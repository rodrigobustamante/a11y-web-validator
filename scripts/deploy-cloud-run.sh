#!/usr/bin/env bash
# Build the API image with Cloud Build and deploy it to Cloud Run.
#
# Idempotent: safe to run for the first deploy and for every update.
# Sized to stay inside the Cloud Run free tier; see DEPLOYMENT.md.
#
# Required:
#   PROJECT_ID        GCP project to deploy into
#   CORS_ORIGIN       Frontend origin allowed by CORS (e.g. https://a11yscan.vercel.app)
# Optional:
#   REGION            Cloud Run region (default: us-central1)
#   SERVICE           Cloud Run service name (default: a11y-api)
#   REPOSITORY        Artifact Registry repository (default: a11y)
#   BILLING_ACCOUNT   Billing account ID; when set, creates a 1 USD budget alert once
#   ALLOW_DIRTY=1     Deploy uncommitted changes (tagged <sha>-dirty-<timestamp>)
#   DRY_RUN=1         Print the gcloud commands instead of running them

set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID to your GCP project ID}"
: "${CORS_ORIGIN:?Set CORS_ORIGIN to the frontend origin, e.g. https://a11yscan.vercel.app}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-a11y-api}"
REPOSITORY="${REPOSITORY:-a11y}"
DRY_RUN="${DRY_RUN:-0}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Validate inputs before anything is built or pushed, so a bad value never
# leaves an undeployed image behind
if [[ ! "$CORS_ORIGIN" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "CORS_ORIGIN must be a single origin without path or trailing slash," >&2
  echo "e.g. https://a11yscan.vercel.app (got: ${CORS_ORIGIN})" >&2
  exit 1
fi

# The tag must identify the code that is built; `gcloud builds submit`
# uploads the working tree, uncommitted changes included
TAG="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
  if [[ "$ALLOW_DIRTY" != "1" ]]; then
    echo "Working tree has uncommitted changes. Commit them or set ALLOW_DIRTY=1." >&2
    exit 1
  fi
  TAG="${TAG}-dirty-$(date +%Y%m%d%H%M%S)"
fi
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}:${TAG}"

run() {
  echo "+ $*"
  if [[ "$DRY_RUN" != "1" ]]; then
    "$@"
  fi
}

if [[ "$DRY_RUN" != "1" ]] && ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install it: https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

SERVICES=(run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com)
if [[ -n "${BILLING_ACCOUNT:-}" ]]; then
  SERVICES+=(billingbudgets.googleapis.com)
fi

echo "==> Enabling required APIs"
run gcloud services enable "${SERVICES[@]}" --project "$PROJECT_ID"

echo "==> Ensuring Artifact Registry repository '${REPOSITORY}'"
if [[ "$DRY_RUN" == "1" ]] || ! gcloud artifacts repositories describe "$REPOSITORY" \
  --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  run gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format docker \
    --location "$REGION" \
    --project "$PROJECT_ID" \
    --description "A11yScan container images"
fi

# Artifact Registry includes 0.5 GB free and the image is ~2 GB, almost all
# of it the shared Playwright base layer, so extra versions are cheap. Keeping
# five also protects the serving image when a few builds fail to deploy.
run gcloud artifacts repositories set-cleanup-policies "$REPOSITORY" \
  --location "$REGION" \
  --project "$PROJECT_ID" \
  --policy "$ROOT_DIR/deploy/artifact-cleanup-policy.json" \
  --no-dry-run

# Cloud Build's default staging bucket is multi-region (not covered by the
# free tier) and never cleaned up; use a regional bucket that expires uploads
SOURCE_BUCKET="gs://${PROJECT_ID}-cloudbuild-src"
echo "==> Ensuring source staging bucket ${SOURCE_BUCKET}"
if [[ "$DRY_RUN" == "1" ]] || ! gcloud storage buckets describe "$SOURCE_BUCKET" \
  --project "$PROJECT_ID" >/dev/null 2>&1; then
  run gcloud storage buckets create "$SOURCE_BUCKET" \
    --location "$REGION" \
    --uniform-bucket-level-access \
    --project "$PROJECT_ID"
fi
run gcloud storage buckets update "$SOURCE_BUCKET" \
  --lifecycle-file "$ROOT_DIR/deploy/source-bucket-lifecycle.json" \
  --project "$PROJECT_ID"

echo "==> Building ${IMAGE}"
run gcloud builds submit "$ROOT_DIR" \
  --tag "$IMAGE" \
  --gcs-source-staging-dir "${SOURCE_BUCKET}/source" \
  --project "$PROJECT_ID"

# Limits, measured locally with the production image:
#   - 1 scan + PDF peaks at ~600 MiB, 3 concurrent scans at ~1.1 GiB -> 2Gi
#   - max-instances 1 bounds spend (worst case ~75 USD/month if saturated
#     around the clock) and keeps the in-memory rate limiter global
#   - min-instances 0 scales to zero when idle (an always-on instance is ~50 USD/month)
#   - gen2 gives Chromium a full Linux environment
#   - TRUST_PROXY=1 because Google's front end appends the client IP to X-Forwarded-For
echo "==> Deploying ${SERVICE} to Cloud Run (${REGION})"
run gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --platform managed \
  --execution-environment gen2 \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 2Gi \
  --concurrency 5 \
  --min-instances 0 \
  --max-instances 1 \
  --timeout 120 \
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=${CORS_ORIGIN},TRUST_PROXY=1"

if [[ -n "${BILLING_ACCOUNT:-}" ]]; then
  echo "==> Ensuring 1 USD budget alert"
  # Capture the listing instead of piping it, so pipefail/SIGPIPE cannot turn
  # "found" into "missing"; if the check itself fails, skip instead of
  # risking a duplicate budget
  if [[ "$DRY_RUN" == "1" ]]; then
    BUDGETS=""
  elif ! BUDGETS="$(gcloud billing budgets list \
    --billing-account "$BILLING_ACCOUNT" \
    --format 'value(displayName)')"; then
    echo "WARNING: could not list budgets; skipping the budget alert." >&2
    echo "         Create it manually (see DEPLOYMENT.md)." >&2
    BUDGETS="__skip__"
  fi

  if [[ "$BUDGETS" != "__skip__" ]] && ! grep -qx "${SERVICE}-budget" <<<"$BUDGETS"; then
    # Alerts only; it does not stop spending
    run gcloud billing budgets create \
      --billing-account "$BILLING_ACCOUNT" \
      --display-name "${SERVICE}-budget" \
      --budget-amount 1USD \
      --threshold-rule percent=0.5 \
      --threshold-rule percent=1.0 \
      --filter-projects "projects/${PROJECT_ID}"
  fi
fi

if [[ "$DRY_RUN" != "1" ]]; then
  URL="$(gcloud run services describe "$SERVICE" \
    --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')"
  echo
  echo "==> Deployed: ${URL}"
  echo "    Health check: curl ${URL}/health"
  echo "    Next: set NEXT_PUBLIC_API_URL=${URL} in Vercel and redeploy the frontend"
fi

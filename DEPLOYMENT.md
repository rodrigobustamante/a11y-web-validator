# Deployment

A11yScan runs on free tiers, for about 0.15–0.20 USD per month (image storage):

| Part     | Host                         | Notes                                     |
| -------- | ---------------------------- | ----------------------------------------- |
| Frontend | Vercel (Hobby)               | `apps/web/vercel.json` is already set up  |
| API      | Google Cloud Run (free tier) | Same `Dockerfile` (Playwright + Chromium) |

> Vercel Hobby is for non-commercial use. If A11yScan starts charging, move the frontend to Vercel Pro.

## Cost

Cloud Run scales to zero and only bills while a request is being handled. With the limits below (1 vCPU, 2 GiB, ~15 s per scan) the monthly free tier (180,000 vCPU-seconds, 360,000 GiB-seconds, 2M requests) covers roughly **12,000 scans per month**.

| Scans per month | Approximate cost               |
| --------------- | ------------------------------ |
| up to ~12,000   | ~0.15 USD (image storage only) |
| 20,000          | ~3.5 USD                       |
| 50,000          | ~17 USD                        |

These are estimates; check them against real usage in the Cloud Console. Image storage is the only fixed cost: Artifact Registry includes 0.5 GB free and the image is ~2 GB, almost all of it the Playwright base layer that every version shares. The cleanup policy keeps the five most recent images (enough to protect the serving image when a few builds fail to deploy) and deletes older ones after 7 days. Cloud Build source uploads go to a regional bucket that deletes them after a day, so they stay inside the free Cloud Storage tier.

`--max-instances 1` bounds spend but does not make it zero: an instance kept busy around the clock (for example by many clients, each within the rate limit) would cost about 75 USD/month. The budget alert is there to tell you if that ever happens.

Do **not** set `--min-instances 1` to avoid cold starts: an always-on instance costs about 50 USD/month.

## Prerequisites

1. A GCP project with a billing account linked (required by Cloud Run even on the free tier).
2. The [gcloud CLI](https://cloud.google.com/sdk/docs/install), authenticated:

   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. Cloud Build permissions. Projects created since mid-2024 build with the Compute Engine default service account, which may lack the roles to read the source bucket and push images. If `gcloud builds submit` fails with `PERMISSION_DENIED`, grant it `roles/cloudbuild.builds.builder`:

   ```bash
   PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format 'value(projectNumber)')
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member "serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
     --role roles/cloudbuild.builds.builder
   ```

4. Your billing account ID, for the budget alert (optional):

   ```bash
   gcloud billing accounts list
   ```

## Deploy the API

```bash
PROJECT_ID=your-project-id \
CORS_ORIGIN=https://your-app.vercel.app \
BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX \
./scripts/deploy-cloud-run.sh
```

The script is idempotent, so the same command deploys updates. It:

1. Validates `CORS_ORIGIN` (one origin, no path or trailing slash) and refuses to run with uncommitted changes, so the image tag always identifies the code. Set `ALLOW_DIRTY=1` to deploy local changes anyway; the tag then gets a `-dirty-<timestamp>` suffix.
2. Enables the Cloud Run, Artifact Registry and Cloud Build APIs (plus Billing Budgets when `BILLING_ACCOUNT` is set).
3. Creates the `a11y` Artifact Registry repository and applies `deploy/artifact-cleanup-policy.json`.
4. Creates the regional `<project>-cloudbuild-src` bucket with `deploy/source-bucket-lifecycle.json`.
5. Builds the image with Cloud Build (linux/amd64, no local Docker needed).
6. Deploys the `a11y-api` service with the limits below.
7. Creates a 1 USD budget alert when `BILLING_ACCOUNT` is set, unless one named `a11y-api-budget` already exists. If the script cannot list budgets, it skips this step with a warning instead of risking a duplicate.

Preview the commands without running anything with `DRY_RUN=1`. Override the defaults with `REGION` (`us-central1`), `SERVICE` (`a11y-api`) and `REPOSITORY` (`a11y`).

### Service limits

| Flag                      | Value | Why                                                                |
| ------------------------- | ----- | ------------------------------------------------------------------ |
| `--memory`                | 2Gi   | Measured peak: ~600 MiB for one scan, ~1.1 GiB for 3 concurrent    |
| `--cpu`                   | 1     | Enough for Chromium; CPU is only billed during requests            |
| `--max-instances`         | 1     | Caps spend and keeps the in-memory rate limiter global             |
| `--min-instances`         | 0     | Scales to zero when idle                                           |
| `--concurrency`           | 5     | The API itself allows 3 concurrent scans and answers "busy" beyond |
| `--timeout`               | 120   | Covers slow pages (navigation timeout is 30 s)                     |
| `--execution-environment` | gen2  | Full Linux environment for Chromium                                |
| `TRUST_PROXY`             | 1     | Rate limiting keys on the client IP from Google's front end        |

The budget alert only notifies. `--max-instances 1` bounds spend (see [Cost](#cost)) but does not stop it.

`TRUST_PROXY=1` assumes clients reach the service directly on its `run.app` URL. If you put a load balancer, Firebase Hosting or a custom domain behind an external load balancer in front of it, set `TRUST_PROXY=2`, or every request will be rate limited as if it came from the load balancer. IPv6 clients are rate limited per /56 prefix, since one client usually controls a whole subnet.

## Connect the frontend

`NEXT_PUBLIC_API_URL` is inlined at build time, so set it in Vercel and redeploy:

```bash
cd apps/web
vercel env add NEXT_PUBLIC_API_URL production   # paste the Cloud Run URL
vercel --prod
```

`CORS_ORIGIN` accepts a single origin, so Vercel preview deployments cannot call the production API.

## Verify

```bash
URL=$(gcloud run services describe "${SERVICE:-a11y-api}" --region "${REGION:-us-central1}" --format 'value(status.url)')
curl "$URL/health"
curl -X POST "$URL/api/audit" -H 'Content-Type: application/json' -d '{"url":"https://example.com"}'
```

The first request after the service has been idle includes a cold start of a few seconds while the ~2 GB image starts.

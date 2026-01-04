# Dockerfile for A11yScan API with Playwright
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# Build packages
RUN pnpm --filter @a11y-web-validator/types build || true

# Build API with explicit tsc call
WORKDIR /app/apps/api
RUN pnpm exec tsc --project tsconfig.json
RUN ls -la dist/

# Return to app root
WORKDIR /app

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Set working directory for runtime
WORKDIR /app/apps/api

# Start the API
CMD ["node", "dist/main.js"]


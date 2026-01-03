# 🚀 Quick Start Guide

Get A11yScan up and running in 5 minutes!

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

Check your versions:
```bash
node -v
pnpm -v
```

If you don't have pnpm installed:
```bash
npm install -g pnpm
```

## Installation

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

### Option 2: Manual Setup

```bash
# 1. Install pnpm (if needed)
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Install Playwright browsers
cd apps/api
pnpm exec playwright install chromium
cd ../..

# 4. Create environment files
# For the API:
cat > apps/api/.env << EOF
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
EOF

# For the Web:
cat > apps/web/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
```

## Running the Application

### Start Everything (Recommended)

```bash
pnpm dev
```

This starts:
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:3001

### Or Run Separately

**Terminal 1 - Backend:**
```bash
cd apps/api
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
pnpm dev
```

## Test the API

### Health Check
```bash
curl http://localhost:3001/health
```

### Run an Audit
```bash
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.w3.org"}'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "url": "https://www.w3.org",
    "healthScore": 95,
    "totalIssues": 3,
    "issuesByImpact": {
      "critical": 0,
      "serious": 1,
      "moderate": 1,
      "minor": 1
    },
    "issues": [...]
  }
}
```

## Using the Web Interface

1. Navigate to http://localhost:3000
2. Enter a URL in the input field
3. Click "Scan Website"
4. View the results!

## Common Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build for production
pnpm build

# Format code
pnpm format

# Run linter
pnpm lint

# Type check
pnpm type-check

# Clean all build artifacts
pnpm clean
```

## Project Scripts by Package

### Root (Monorepo)
```bash
pnpm dev             # Start all apps
pnpm build           # Build all apps
pnpm lint            # Lint all apps
pnpm format          # Format all code
pnpm type-check      # Check types in all apps
```

### Frontend (apps/web)
```bash
cd apps/web
pnpm dev             # Start Next.js dev server
pnpm build           # Build for production
pnpm start           # Start production server
pnpm lint            # Run Next.js linter
```

### Backend (apps/api)
```bash
cd apps/api
pnpm dev             # Start with hot reload (tsx)
pnpm build           # Compile TypeScript
pnpm start           # Run compiled version
pnpm lint            # Run ESLint
```

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

**Frontend:**
```bash
cd apps/web
PORT=3002 pnpm dev
```

**Backend:**
```bash
cd apps/api
PORT=3003 pnpm dev
```

Don't forget to update `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` if you change the backend port!

### Playwright Installation Issues

```bash
# Clear Playwright cache
cd apps/api
pnpm exec playwright clean

# Reinstall browsers
pnpm exec playwright install chromium --with-deps
cd ../..
```

### TypeScript Errors

```bash
# Clean build artifacts
pnpm clean

# Reinstall dependencies
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## Next Steps

- Read the [full README](./README.md) for more details
- Check out [EXAMPLES.md](./EXAMPLES.md) for usage examples
- See [CONTRIBUTING.md](./CONTRIBUTING.md) if you want to contribute
- Review [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) to understand the architecture

## Getting Help

- Check the console output for error messages
- Look at the Network tab in browser DevTools
- Check backend logs in the terminal
- Refer to [EXAMPLES.md](./EXAMPLES.md) for common patterns

Happy scanning! 🎉


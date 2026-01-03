# A11yScan API

This is the Node.js backend API for A11yScan that performs accessibility audits.

## Getting Started

```bash
pnpm dev
```

The API will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
src/
├── controllers/     # Route controllers
├── services/        # Business logic (audit service)
├── middleware/      # Express middleware
├── routes/          # API routes
├── validators/      # Zod schemas
├── config.ts        # Configuration
└── main.ts          # Entry point
```

## Environment Variables

Create a `.env` file:

```
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Health Check
```
GET /health
```

### Run Audit
```
POST /api/audit
Body: { "url": "https://example.com" }
```

### Audit Service Status
```
GET /api/audit/status
```

## Building for Production

```bash
pnpm build
pnpm start
```


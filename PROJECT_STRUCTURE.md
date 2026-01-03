# Project Structure

```
a11y-web-validator/
│
├── apps/
│   ├── web/                          # Next.js Frontend (Port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx       # Root layout with providers
│   │   │   │   ├── page.tsx         # Home page
│   │   │   │   ├── providers.tsx    # React Query setup
│   │   │   │   └── globals.css      # Global styles + Tailwind
│   │   │   ├── components/          # React components (empty - ready for Phase 3)
│   │   │   └── lib/                 # Utility functions (empty)
│   │   ├── public/                  # Static assets
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── .eslintrc.json
│   │
│   └── api/                          # Node.js Backend (Port 3001)
│       ├── src/
│       │   ├── controllers/
│       │   │   └── audit.controller.ts      # Route handlers
│       │   ├── services/
│       │   │   └── a11y-audit.service.ts    # Core audit logic with Playwright
│       │   ├── middleware/
│       │   │   ├── error-handler.ts         # Global error handling
│       │   │   └── rate-limiter.ts          # Rate limiting
│       │   ├── routes/
│       │   │   └── audit.routes.ts          # API routes
│       │   ├── validators/
│       │   │   └── audit.validator.ts       # Zod schemas
│       │   ├── utils/                       # (empty - for future utilities)
│       │   ├── config.ts                    # Configuration
│       │   └── main.ts                      # Entry point (Express setup)
│       ├── package.json
│       ├── tsconfig.json
│       └── .eslintrc.json
│
├── packages/
│   ├── types/                        # Shared TypeScript Definitions
│   │   ├── src/
│   │   │   └── index.ts             # A11yIssue, A11yAuditResult, etc.
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                       # Shared Configurations
│       ├── eslint-config.js
│       ├── prettier-config.js
│       └── package.json
│
├── Configuration Files (Root Level)
├── package.json                      # Root workspace config
├── turbo.json                        # Turborepo pipeline
├── tsconfig.json                     # Base TypeScript config
├── .eslintrc.json                    # Root ESLint config
├── .prettierrc                       # Prettier config
├── .prettierignore                   # Prettier ignore patterns
├── .gitignore                        # Git ignore patterns
├── playwright.config.ts              # Playwright configuration
├── .nvmrc                           # Node version
│
├── Documentation
├── README.md                         # Main project documentation
├── AGENTS.md                         # AI agent definition
├── CONTRIBUTING.md                   # Contribution guidelines
├── EXAMPLES.md                       # Usage examples
├── PROJECT_STRUCTURE.md              # This file
├── LICENSE                           # MIT License
│
├── Setup & Utilities
└── setup.sh                         # Automated setup script
```

## Key Files Explained

### Root Level
- **package.json**: Defines the project metadata and scripts
- **pnpm-workspace.yaml**: Defines the monorepo workspace structure for pnpm
- **turbo.json**: Configures Turborepo for parallel builds and caching
- **tsconfig.json**: Base TypeScript configuration inherited by all packages
- **.npmrc**: PNPM configuration (peer dependencies, hoisting, etc.)

### Frontend (apps/web)
- **src/app/layout.tsx**: Root layout with React Query provider
- **src/app/page.tsx**: Home page with audit form UI
- **src/app/globals.css**: Tailwind CSS imports and custom utilities
- **tailwind.config.js**: Tailwind configuration with custom theme

### Backend (apps/api)
- **src/main.ts**: Express server setup with middleware
- **src/services/a11y-audit.service.ts**: Core service using Playwright + Axe-core
- **src/controllers/audit.controller.ts**: Request handlers
- **src/middleware/**: Error handling and rate limiting

### Shared Packages
- **packages/types**: Type definitions used by both frontend and backend
- **packages/config**: Shared ESLint and Prettier configurations

## Data Flow

```
User Input (URL) 
    ↓
Next.js Frontend (Port 3000)
    ↓ HTTP POST /api/audit
Backend API (Port 3001)
    ↓
AuditController
    ↓
A11yAuditService
    ↓
Playwright Browser + Axe-core
    ↓
Audit Results (A11yAuditResult)
    ↓
JSON Response
    ↓
Frontend Display
```

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 15 (App Router) |
| UI Styling | Tailwind CSS |
| UI Components | Radix UI (Primitives) |
| State Management | TanStack Query (React Query) |
| Backend Framework | Express |
| Browser Automation | Playwright |
| Accessibility Testing | @axe-core/playwright |
| Validation | Zod |
| Type Safety | TypeScript |
| Build System | Turborepo |
| Code Quality | ESLint + Prettier |

## Next Steps (Development Phases)

### ✅ Phase 1: Core Engine (COMPLETE)
- Playwright + Axe-core integration
- Audit service with browser management
- Health score calculation

### ✅ Phase 2: API Layer (COMPLETE)
- REST API with Express
- Zod validation
- Rate limiting
- Error handling

### 🔄 Phase 3: Dashboard (IN PROGRESS)
- [ ] Create AuditResults component
- [ ] Build IssueList with Radix Accordion
- [ ] Add filtering by impact level
- [ ] Implement code snippet display with syntax highlighting

### 📋 Phase 4: Export & UX (PLANNED)
- [ ] PDF export functionality
- [ ] Copy to clipboard feature
- [ ] Share specific issues
- [ ] Historical audit tracking


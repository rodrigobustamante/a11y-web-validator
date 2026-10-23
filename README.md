# A11yScan - Web Accessibility Validator

[![CI](https://github.com/rodrigobustamante/a11y-web-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/rodrigobustamante/a11y-web-validator/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![PNPM](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange)

A specialized Micro-SaaS tool designed to audit web URLs for accessibility barriers. Identifies violations of **WCAG 2.1/2.2** standards specifically for users with visual, motor, and cognitive impairments.

**🌐 Live app:** [a11yscan.rodrigobustamante.cl](https://a11yscan.rodrigobustamante.cl)

## 🎯 Features

- **WCAG 2.1/2.2 Compliance Scanning** - Automated accessibility audits using Playwright + Axe-core
- **Health Score Calculation** - Get an overall accessibility score (0-100) for any website
- **Detailed Issue Reports** - View violations grouped by impact level (Critical, Serious, Moderate, Minor), filter by impact and search by rule
- **Code Snippets** - See the exact HTML causing accessibility issues, syntax-highlighted, with its selector and WCAG criteria
- **Modern UI** - Built with Next.js 15 and Radix UI for an accessible-by-default interface
- **Export & Share** - Download audit results as PDF, copy any issue as Markdown for a ticket or chat, or copy a failing element's HTML

## 🛠 Tech Stack

### Frontend

- **Next.js 15** with App Router
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for state management
- **Recharts** for data visualization

### Backend

- **Node.js** with Express
- **Playwright** for browser automation
- **@axe-core/playwright** for accessibility testing
- **Zod** for schema validation
- **TypeScript** throughout

## 📂 Project Structure

```
a11y-web-validator/
├── apps/
│   ├── web/                # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/        # App router pages
│   │   │   ├── components/ # React components
│   │   │   └── lib/        # Utility functions
│   │   └── package.json
│   └── api/                # Node.js backend API
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/   # Core audit logic
│       │   ├── middleware/
│       │   └── routes/
│       └── package.json
├── packages/
│   ├── types/              # Shared TypeScript types
│   └── config/             # Shared ESLint/Prettier configs
├── package.json            # Root workspace config
└── turbo.json              # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/rodrigobustamante/a11y-web-validator.git
cd a11y-web-validator
```

2. **Install pnpm (if not already installed)**

```bash
npm install -g pnpm
```

3. **Install dependencies**

```bash
pnpm install
```

4. **Install Playwright browsers**

```bash
cd apps/api && pnpm exec playwright install chromium
```

Or simply use the automated setup script:

```bash
./setup.sh
```

### Development

Run both frontend and backend in development mode:

```bash
pnpm dev
```

This will start:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Running Individual Apps

**Frontend only:**

```bash
cd apps/web
pnpm dev
```

**Backend only:**

```bash
cd apps/api
pnpm dev
```

## 🧪 Usage

### API Endpoint

**POST** `/api/audit`

Request body:

```json
{
  "url": "https://example.com"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "healthScore": 85,
    "totalIssues": 12,
    "issuesByImpact": {
      "critical": 1,
      "serious": 3,
      "moderate": 5,
      "minor": 3
    },
    "issues": [...]
  }
}
```

### Frontend Usage

1. Open the [live app](https://a11yscan.rodrigobustamante.cl), or http://localhost:3000 when running locally
2. Enter a URL in the input field
3. Click "Scan Website"
4. View the detailed accessibility report

## 📋 Development Roadmap

- [x] **Phase 1: Core Engine** - Playwright + Axe-core integration
- [x] **Phase 2: API Layer** - REST API with validation and rate limiting
- [x] **Phase 3: Dashboard** - Result views with filtering and code snippets
- [x] **Phase 4: Export & UX** - PDF export and sharing features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📖 Documentation

- [Quick Start Guide](./QUICKSTART.md) - Get started in 5 minutes
- [Usage Examples](./EXAMPLES.md) - API and React examples
- [Project Structure](./PROJECT_STRUCTURE.md) - Architecture overview
- [Deployment](./DEPLOYMENT.md) - Vercel + Cloud Run on free tiers
- [Why PNPM?](./WHY_PNPM.md) - Benefits of using pnpm
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## 🔗 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PNPM Documentation](https://pnpm.io/)

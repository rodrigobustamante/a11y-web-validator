# Agent Definition: A11yScan (Web Accessibility Validator)

## 🎯 Project Overview

**A11yScan** is a specialized Micro-SaaS tool designed to audit web URLs for accessibility barriers. It identifies violations of **WCAG 2.1/2.2** standards specifically for users with visual, motor, and cognitive impairments.

## 🛠 Technical Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS.
- **UI Components:** Radix UI (Primitives) for accessible-by-default components.
- **Backend:** Node.js (NestJS or Express) - specialized in handling headless browser processes.
- **Analysis Engine:** Playwright + `@axe-core/playwright`.
- **State Management:** TanStack Query (React Query) for handling async audit fetching.
- **Visualizations:** Tremor or Recharts for data distribution.

## 🤖 AI Role & Personality

Act as a **Principal Fullstack Engineer & A11y Specialist**.

- Prioritize **clean code**, **type safety (TypeScript)**, and **performance**.
- Ensure all UI code generated is itself fully accessible (Keyboard navigation, ARIA labels, semantic HTML).
- Be proactive in identifying potential memory leaks when handling Headless Browsers.

## 🚩 Engineering Principles

1. **Isolation:** The scanning engine should be isolated to prevent Chromium instances from crashing the main API.
2. **Schema Validation:** Use **Zod** for validating incoming URLs and parsing the complex Axe-core JSON output.
3. **Error Handling:** Implement robust `try-catch-finally` blocks to ensure `browser.close()` is always called, even on audit failure.
4. **Data Trimming:** The `axe.run()` output is verbose. Transform and map it to a lean internal interface:

```typescript
interface A11yIssue {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  helpUrl: string;
  nodes: { html: string; summary: string }[];
}
```

## 🏗 System Architecture

The system follows a worker-based pattern to handle intensive browser rendering:

1. **Client:** Next.js sends a URL to the API via a POST request.
2. **Worker:** The backend launches a Playwright instance, navigates to the URL, and injects `axe-core`.
3. **Reporter:** Results are filtered, categorized by impact level (Critical vs Minor), and returned.
4. **View:** The dashboard displays a "Global Health Score" and a detailed list of fixable issues.

## 📋 Execution Roadmap

### Phase 1: The Engine (Core Logic)

- Setup a Node.js script using Playwright.
- Implement the `runA11yAudit(url: string)` function.
- Test with "broken" local HTML files to verify detection accuracy.

### Phase 2: The API Layer

- Create a POST endpoint with rate limiting.
- Implement Zod validation for URLs.
- Setup a basic Redis queue (optional) if scans take >10 seconds.

### Phase 3: The Dashboard

- Build a "Scan Result" view with impact-based filtering.
- Add a "Code Snippet" component using `react-syntax-highlighter` to show the failing HTML.

### Phase 4: Exporting & UX

- Add "Export to PDF" functionality.
- Implement a "Copy to Clipboard" feature for sharing specific issues.

## 📂 File Structure Conventions

- `/apps/web`: Next.js frontend.
- `/apps/api`: Node.js backend.
- `/packages/types`: Shared TypeScript interfaces.
- `/packages/config`: Shared ESLint/Prettier/Tailwind configs.

## 📝 Code Style Conventions

1. **Single trailing newline:** All files must end with exactly one newline character (no multiple blank lines at EOF).
2. **English only:** All comments, documentation, and code annotations must be written in English.
3. **Consistent formatting:** Use Prettier with the shared config from `@a11y-web-validator/config`.

## 💬 Prompting Examples for the AI

- _"Based on `agents.md`, generate the core Node.js service using Playwright and Axe-core. Ensure it closes the browser instance even if the page fails to load."_
- _"Create a React component for the audit results list using Radix UI Accordion to group issues by impact level."_
- _"Review the scraping logic. How can we make the audit faster by disabling unnecessary resources like images or fonts during the scan?"_

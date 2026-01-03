# Contributing to A11yScan

Thank you for considering contributing to A11yScan! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install pnpm: `npm install -g pnpm` (if not already installed)
3. Install dependencies: `pnpm install`
4. Install Playwright browsers: `cd apps/api && pnpm exec playwright install chromium`
5. Create a new branch: `git checkout -b feature/your-feature-name`

## Code Style

- We use **Prettier** for code formatting
- We use **ESLint** for linting
- Run `pnpm format` before committing
- Run `pnpm lint` to check for issues

## Commit Guidelines

- Use clear, descriptive commit messages
- Follow conventional commits format: `type(scope): description`
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for formatting changes
  - `refactor:` for code refactoring
  - `test:` for adding tests
  - `chore:` for maintenance tasks

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure all tests pass and there are no linting errors
3. Update documentation as necessary
4. Request review from maintainers

## Accessibility Standards

Since this project is about accessibility, **all UI code must be accessible**:

- Use semantic HTML
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers when possible
- Follow WCAG 2.1 AA standards minimum

## Questions?

Feel free to open an issue for any questions or concerns.


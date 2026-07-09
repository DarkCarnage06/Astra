# Contributing to ASTRA

Thank you for your interest in contributing to ASTRA! ASTRA is a cinematic, AI-first self-reflection platform inspired by Vedic astrology. We welcome community contributions.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md) (coming soon, please be respectful and inclusive).

## How Can I Contribute?

### Reporting Bugs
Use the Bug Report issue template. Provide as much detail as possible, including OS, browser, and steps to reproduce.

### Suggesting Enhancements
Use the Feature Request issue template. Detail the problem you are trying to solve and your proposed solution.

### Submitting Pull Requests
1. **Fork the repo** and create your branch from `main`.
2. **Run tests** and ensure `npm run lint` and `npx tsc --noEmit` pass with 0 errors.
3. **Format your code**: We use standard Next.js ESLint and Prettier configs.
4. **Issue your PR** using the Pull Request template.

## Development Setup
Please see the [README.md](README.md) for full instructions on setting up the Next.js frontend and FastAPI backend.

## Design Philosophy
- **No mystical fluff**: ASTRA uses calm, grounded language.
- **Cinematic & Calm**: Use smooth animations (`framer-motion`), dark UI, and subtle glows.
- **Performance**: Ensure 60fps animations. Avoid heavy re-renders. Use `React.memo` for static or heavy components.

Thanks again for helping make ASTRA better!

# Contributing to Holocron

Thank you for your interest in contributing to Holocron! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/holocron.git`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npx tauri dev

# Build for production
npm run build
```

## Code Style

- Use TypeScript for type safety
- Follow Svelte 5 conventions (Runes API)
- Use Tailwind CSS for styling
- Keep components focused and composable
- Write self-documenting code (minimal comments)

## Making Changes

1. Make your changes in a feature branch
2. Test your changes thoroughly
3. Ensure the code builds without errors: `npm run build`
4. Commit with clear, descriptive messages

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add database export functionality`
- `fix: resolve sidebar collapse issue`
- `refactor: simplify storage service logic`
- `docs: update README with setup instructions`

## Pull Requests

1. Push your branch: `git push origin feature/your-feature-name`
2. Open a Pull Request on GitHub
3. Provide a clear description of your changes
4. Reference any related issues

## Areas for Contribution

- Bug fixes
- Performance improvements
- New database view types
- UI/UX enhancements
- Documentation improvements
- Test coverage

## Questions?

Open an issue for discussion or questions about contributing.

Thank you for helping make Holocron better! 🌌


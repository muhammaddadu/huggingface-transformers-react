# Contributing to Hugging Face Transformers React

Thank you for your interest in contributing to Hugging Face Transformers React! We welcome contributions from the community and are grateful for every pull request, bug report, and feature suggestion.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [muhammad@dadu.io](mailto:muhammad@dadu.io).

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm, yarn, or pnpm
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/huggingface-transformers-react.git
   cd huggingface-transformers-react
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/muhammaddadu/huggingface-transformers-react.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development mode**
   ```bash
   npm run dev
   ```

## Making Changes

### Branch Naming

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
git checkout -b fix/your-bug-fix
git checkout -b docs/your-documentation-update
```

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```bash
git commit -m "feat: add support for custom model URLs"
git commit -m "fix: resolve memory leak in model cleanup"
git commit -m "docs: improve API documentation examples"
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix automatically fixable issues
npm run lint -- --fix
```

### TypeScript

- Use TypeScript for all new code
- Add proper type definitions
- Update type exports when adding new public APIs
- Ensure type checking passes: `npm run type-check`

## Testing

We maintain high test coverage to ensure reliability:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Include both positive and negative test cases
- Test error conditions and edge cases
- Use descriptive test names
- Mock external dependencies appropriately

Example test structure:
```tsx
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle normal case', () => {
    // Test implementation
  });

  it('should handle error case', () => {
    // Test error handling
  });
});
```

### Testing React Components

Use React Testing Library for component tests:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('component should work as expected', async () => {
  const user = userEvent.setup();
  render(<YourComponent />);
  
  await user.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

## Documentation

### API Documentation

We use TypeDoc to generate API documentation from JSDoc comments:

```typescript
/**
 * Description of the function
 * 
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter
 * @returns Description of return value
 * @example
 * ```tsx
 * const result = myFunction('example', 42);
 * ```
 */
export function myFunction(param1: string, param2: number): string {
  // Implementation
}
```

### Building Documentation

```bash
# Build API documentation
npm run docs:build

# Start documentation development server
npm run docs:dev
```

### README Updates

When adding new features:
1. Update the main README.md
2. Add examples to demonstrate usage
3. Update the feature list if applicable
4. Ensure all code examples work

## Submitting Changes

### Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**
   ```bash
   git push origin your-branch-name
   ```

3. **Create a Pull Request**
   - Use the provided PR template
   - Include a clear description of changes
   - Reference any related issues
   - Add screenshots for UI changes
   - Ensure all checks pass

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
```

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. Address feedback promptly
4. Keep PR scope focused and manageable

## Release Process

We use semantic versioning and automated releases:

1. **Merge to main** triggers automated release
2. **Version bumping** based on conventional commits
3. **NPM publishing** automated
4. **GitHub release** created automatically
5. **Documentation deployment** to GitHub Pages

### Version Types

- **Patch** (1.0.1): Bug fixes, documentation updates
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

## Development Guidelines

### Performance

- Minimize bundle size impact
- Use React.memo() for expensive components
- Implement proper cleanup in useEffect
- Avoid memory leaks in model management

### Accessibility

- Ensure components are accessible
- Use semantic HTML elements
- Include ARIA labels where appropriate
- Test with screen readers when possible

### Browser Support

- Support modern browsers (ES2018+)
- Test in Chrome, Firefox, Safari, Edge
- Consider mobile browsers
- Provide graceful degradation

## Getting Help

- **Documentation**: Check the [API docs](https://muhammaddadu.github.io/huggingface-transformers-react)
- **Issues**: Search existing [GitHub issues](https://github.com/muhammaddadu/huggingface-transformers-react/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/muhammaddadu/huggingface-transformers-react/discussions)
- **Email**: [muhammad@dadu.io](mailto:muhammad@dadu.io)

## Recognition

Contributors will be:
- Listed in the project's README
- Mentioned in release notes
- Invited to join the contributors team

Thank you for contributing to Hugging Face Transformers React! 🎉 
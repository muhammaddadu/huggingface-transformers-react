# Development Guide

This guide will help you understand the project structure and get started with development.

## 📁 Project Structure

```
huggingface-transformers-react/
├── src/                          # Source code
│   ├── index.tsx                 # Main library export
│   ├── setupTests.ts            # Jest configuration
│   └── __tests__/               # Test files
│       ├── index.test.tsx       # Comprehensive component tests
│       └── TransformersProvider.test.tsx # Basic provider tests
├── examples/                     # Usage examples
│   └── kitchen-sink/            # Comprehensive demo app
├── docs/                        # Generated documentation (auto-generated)
├── dist/                        # Built library (auto-generated)
├── .github/                     # GitHub workflows
│   └── workflows/
│       ├── ci.yml               # Continuous integration
│       └── release.yml          # Release automation
├── package.json                 # Package configuration
├── tsconfig.json               # TypeScript configuration
├── rollup.config.js            # Build configuration
├── jest.config.js              # Test configuration
├── typedoc.json                # Documentation configuration
├── .eslintrc.js                # Linting configuration
├── babel.config.js             # Babel configuration
├── .releaserc.json             # Semantic release configuration
└── README.md                   # Main documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/muhammaddadu/huggingface-transformers-react.git
   cd huggingface-transformers-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Build the library**
   ```bash
   npm run build
   ```

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit source files in `src/`
   - Add tests in `src/__tests__/`
   - Update documentation if needed

3. **Run tests during development**
   ```bash
   npm run test:watch
   ```

4. **Check types and linting**
   ```bash
   npm run type-check
   npm run lint
   ```

5. **Build and test the package**
   ```bash
   npm run build
   ```

### Testing Your Changes

#### Unit Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Integration Testing
Test your changes with the example app:

```bash
# In the main directory, build the library
npm run build

# Navigate to the example
cd examples/kitchen-sink

# Install dependencies (uses the built library)
npm install

# Start the example app
npm start
```

### Building Documentation

```bash
# Generate API documentation
npm run build:docs

# Start documentation development server
npm run docs:dev
```

## 🏗️ Architecture

### Core Components

#### `TransformersProvider`
- Manages Transformers.js library loading
- Handles retry logic and error states
- Provides React context for child components
- Supports SSR and client-side rendering

#### `useTransformers`
- Main hook for accessing transformers functionality
- Provides library status and model management
- Includes convenience methods for common tasks

#### `useTransformersReady`
- Suspense-friendly hook
- Throws promise until library is ready
- Enables clean loading states with React Suspense

### Key Features

#### Model Management
- **Caching**: Models are cached after first load
- **Lifecycle**: Proper cleanup when components unmount
- **Status Tracking**: Each model has loading/ready/error states
- **Retry Logic**: Automatic retries with exponential backoff

#### Error Handling
- **Library Errors**: Network issues, script loading failures
- **Model Errors**: Model download or initialization failures
- **Callback Support**: Custom error handlers for monitoring

#### Performance
- **Lazy Loading**: Models load only when needed
- **Bundle Size**: Minimal impact on app bundle
- **Memory Management**: Proper cleanup of loaded models
- **Audio Processing**: Efficient Web Audio API usage for format conversion

#### Audio Features
- **Automatic Conversion**: Blob/File to Float32Array for Whisper models
- **Sample Rate Conversion**: Automatic resampling to 16kHz
- **Format Support**: Works with all browser-supported audio formats
- **Browser Compatibility**: Graceful fallback when AudioContext unavailable

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests**
   - Component behavior
   - Hook functionality
   - Error handling
   - State management

2. **Integration Tests**
   - Provider + hook interaction
   - Suspense integration
   - Model loading flows

3. **Mock Strategy**
   - Mock `window.transformers`
   - Mock DOM APIs (script injection)
   - Mock AudioContext for audio tests
   - Mock Blob/File APIs for browser environment simulation

### Current Test Coverage

The test suite includes:
- ✅ **23 passing tests** covering core functionality
- ✅ **Provider initialization and state management**
- ✅ **Model loading, caching, and error handling**
- ✅ **Sentiment analysis helper function**
- ✅ **Audio transcription with proper format conversion**
- ✅ **Suspense integration and hooks**
- ✅ **Error boundaries and recovery**
- ✅ **Concurrent model loading**
- ✅ **End-to-end workflows**
- ⏭️ **1 skipped test** (timeout functionality - has timer contamination issues)

### Test Utilities

```tsx
// Test helper for provider
const renderWithProvider = (ui: React.ReactElement, options = {}) => {
  return render(
    <TransformersProvider {...options}>
      {ui}
    </TransformersProvider>
  );
};

// Test helper for suspense
const renderWithSuspense = (ui: React.ReactElement) => {
  return render(
    <TransformersProvider>
      <Suspense fallback={<div>Loading...</div>}>
        {ui}
      </Suspense>
    </TransformersProvider>
  );
};
```

## 📦 Build Process

### Build Tools

- **Rollup**: Bundle creation (CJS + ESM)
- **TypeScript**: Type checking and declaration files
- **Babel**: JavaScript transpilation
- **Terser**: Code minification

### Build Outputs

```
dist/
├── index.js          # CommonJS build
├── index.js.map      # CJS source map
├── index.esm.js      # ES Module build
├── index.esm.js.map  # ESM source map
├── index.d.ts        # TypeScript declarations
└── index.d.ts.map    # Declaration source map
```

### Build Configuration

Key files:
- `rollup.config.js`: Main build configuration
- `tsconfig.json`: TypeScript compiler options
- `babel.config.js`: Babel presets and plugins

## 🚀 Release Process

### Automated Releases

The project uses semantic-release for automated publishing:

1. **Commit Analysis**: Analyzes commit messages for version bumps
2. **Version Calculation**: Determines next version (patch/minor/major)
3. **Changelog Generation**: Creates release notes
4. **NPM Publishing**: Publishes to npm registry
5. **GitHub Release**: Creates GitHub release with notes
6. **Documentation Deployment**: Updates GitHub Pages

### Manual Release Steps

If you need to release manually:

```bash
# Ensure clean working directory
git status

# Run all checks
npm run type-check
npm run lint
npm test
npm run build

# Version bump (semantic-release handles this automatically)
npm version patch|minor|major

# Publish to npm
npm publish

# Push changes and tags
git push --follow-tags
```

## 🔧 Configuration Files

### TypeScript (`tsconfig.json`)
- Strict type checking enabled
- React JSX support
- Declaration file generation
- Source map generation

### ESLint (`.eslintrc.js`)
- TypeScript support
- React rules
- React Hooks rules
- Custom rules for the project

### Jest (`jest.config.js`)
- JSDOM environment for React testing
- TypeScript support via Babel
- Coverage thresholds
- Test file patterns

### Rollup (`rollup.config.js`)
- Dual builds (CJS + ESM)
- TypeScript compilation
- External dependency handling
- Minification

## 🐛 Debugging

### Common Issues

1. **Module not found errors**
   - Check peer dependencies are installed
   - Verify import paths

2. **Type errors**
   - Run `npm run type-check`
   - Check TypeScript version compatibility

3. **Test failures**
   - Check mock configurations
   - Verify test environment setup

4. **Build errors**
   - Check Rollup configuration
   - Verify external dependencies

### Debug Tools

```bash
# Verbose test output
npm test -- --verbose

# Debug build process
npm run build -- --verbose

# Type checking with explanations
npm run type-check -- --listFiles
```

## 📈 Performance Monitoring

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
ls -la dist/

# Check dependencies
npm ls
```

### Runtime Performance

- Monitor model loading times
- Track memory usage of loaded models
- Measure React render performance

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

### Pull Request Checklist

- [ ] Tests pass
- [ ] Types check
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Example updated (if applicable)
- [ ] Conventional commit messages
- [ ] No breaking changes (or properly documented)

## 📚 Additional Resources

- [Hugging Face Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [React Context API](https://react.dev/reference/react/useContext)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 🆘 Getting Help

- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions or share ideas
- **Email**: [muhammad@dadu.io](mailto:muhammad@dadu.io)

---

Happy coding! 🎉 
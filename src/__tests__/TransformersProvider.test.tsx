import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransformersProvider, useTransformers } from '../index';

// Mock window.transformers
const mockPipeline = jest.fn();

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Mock transformers library being loaded
  Object.defineProperty(window, 'transformers', {
    value: { pipeline: mockPipeline },
    writable: true,
    configurable: true
  });
});

afterEach(() => {
  // Clean up window.transformers
  delete (window as any).transformers;
});

// Test component that uses the context
function TestComponent() {
  const { libraryStatus, isLibraryLoaded } = useTransformers();
  
  return (
    <div>
      <div data-testid="library-status">{libraryStatus}</div>
      <div data-testid="library-loaded">{isLibraryLoaded.toString()}</div>
    </div>
  );
}

describe('TransformersProvider', () => {
  it('should render children and provide context', () => {
    render(
      <TransformersProvider>
        <TestComponent />
      </TransformersProvider>
    );

    expect(screen.getByTestId('library-status')).toBeInTheDocument();
    expect(screen.getByTestId('library-loaded')).toBeInTheDocument();
  });

  it('should work with custom configuration', () => {
    const onLibraryError = jest.fn();
    const onModelError = jest.fn();

    render(
      <TransformersProvider
        moduleUrl="https://custom-url.com/transformers.js"
        loadTimeout={60000}
        maxRetries={2}
        onLibraryError={onLibraryError}
        onModelError={onModelError}
      >
        <TestComponent />
      </TransformersProvider>
    );

    expect(screen.getByTestId('library-status')).toBeInTheDocument();
    expect(onLibraryError).not.toHaveBeenCalled();
  });
});

describe('useTransformers', () => {
  it('should throw error when used outside provider', () => {
    const TestComponentOutsideProvider = () => {
      useTransformers();
      return <div>Test</div>;
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useTransformers must be used within TransformersProvider');

    console.error = originalError;
  });

  it('should provide context methods', () => {
    let contextValue: any;

    function TestComponentWithRef() {
      contextValue = useTransformers();
      return <div>Test</div>;
    }

    render(
      <TransformersProvider>
        <TestComponentWithRef />
      </TransformersProvider>
    );

    expect(contextValue).toBeDefined();
    expect(contextValue).toHaveProperty('loadModel');
    expect(contextValue).toHaveProperty('unloadModel');
    expect(contextValue).toHaveProperty('analyzeSentiment');
    expect(contextValue).toHaveProperty('transcribeAudio');
    expect(contextValue).toHaveProperty('readyPromise');
  });
}); 
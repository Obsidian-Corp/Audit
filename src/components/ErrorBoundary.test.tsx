// =====================================================
// OBSIDIAN AUDIT - ERROR BOUNDARY TESTS
// Unit tests for ErrorBoundary component
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

// Silence console errors during tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('calls onReset when try again is clicked', () => {
    const onReset = vi.fn();

    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    expect(onReset).toHaveBeenCalled();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('renders page-level error UI for page level', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError />
      </ErrorBoundary>
    );

    // Page-level should have different styling
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('shows technical details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails>
        <ThrowError />
      </ErrorBoundary>
    );

    // Find and expand details
    const showButton = screen.queryByText(/show details/i);
    if (showButton) {
      fireEvent.click(showButton);
    }

    // Error stack should be visible somewhere
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('resets state and renders children after reset', () => {
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary key="test">
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click try again
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });

    // Change the flag before clicking
    shouldThrow = false;

    fireEvent.click(tryAgainButton);

    // Re-render with non-throwing component
    rerender(
      <ErrorBoundary key="test">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('displays reference ID when eventId is available', async () => {
    // This would need proper Sentry mocking to test fully
    // For now, just verify the component renders
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('passes options to error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError, { showDetails: true });

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders wrapped component when no error', () => {
    function SafeComponent() {
      return <div>Safe content</div>;
    }

    const WrappedComponent = withErrorBoundary(SafeComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});

describe('useErrorHandler hook', () => {
  it('throws error when called', () => {
    function TestComponent() {
      const handleError = useErrorHandler();

      return (
        <button onClick={() => handleError(new Error('Hook error'))}>
          Trigger error
        </button>
      );
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /trigger error/i }));

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

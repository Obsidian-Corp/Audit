// =====================================================
// OBSIDIAN AUDIT - ENTERPRISE ERROR BOUNDARY
// Graceful error handling with recovery and reporting
// =====================================================

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  showStack: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to our logging service
    logger.error('ErrorBoundary caught an error', error, {
      component: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      action: 'error_boundary_catch',
      level: this.props.level || 'component',
    });

    this.setState({ errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to Sentry if available
    this.reportToSentry(error, errorInfo);
  }

  private async reportToSentry(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      const Sentry = await import('@sentry/react');
      const eventId = Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
          level: this.props.level,
        },
      });
      this.setState({ eventId });
    } catch {
      // Sentry not configured, silently continue
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showStack: false,
    });
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, eventId } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(
      `Error Details:\n` +
      `- Message: ${error?.message}\n` +
      `- Event ID: ${eventId || 'N/A'}\n` +
      `- URL: ${window.location.href}\n` +
      `- Time: ${new Date().toISOString()}\n\n` +
      `Please describe what you were doing when this error occurred:\n\n`
    );
    window.open(`mailto:support@obsidiancorp.com?subject=${subject}&body=${body}`);
  };

  toggleStack = () => {
    this.setState(prev => ({ showStack: !prev.showStack }));
  };

  render() {
    const { hasError, error, errorInfo, eventId, showStack } = this.state;
    const { children, fallback, showDetails = false, level = 'component' } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Page-level error - full screen
      if (level === 'page') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-lg w-full text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We encountered an unexpected error. Our team has been notified.
              </p>

              {eventId && (
                <p className="text-sm text-gray-500 mb-6">
                  Reference: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{eventId}</code>
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Button onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button onClick={this.handleReportBug} variant="ghost">
                  <Bug className="w-4 h-4 mr-2" />
                  Report
                </Button>
              </div>

              {showDetails && error && (
                <details className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-48">
                    {error.stack || error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Section or component level - inline alert
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm mb-3">
              {error?.message || 'An unexpected error occurred'}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="bg-background"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Try again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleReportBug}
              >
                <Bug className="w-3 h-3 mr-1" />
                Report
              </Button>
            </div>

            {eventId && (
              <p className="text-xs text-muted-foreground mb-2">
                Reference: {eventId}
              </p>
            )}

            {showDetails && error?.stack && (
              <div className="mt-2">
                <button
                  onClick={this.toggleStack}
                  className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showStack ? 'rotate-180' : ''}`} />
                  {showStack ? 'Hide' : 'Show'} details
                </button>
                {showStack && (
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<Props, 'children'>
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...options}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for programmatic error throwing
export function useErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    logger.error('useErrorHandler triggered', error, {
      action: 'use_error_handler',
    });
    throw error;
  };
}

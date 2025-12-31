/**
 * ==================================================================
 * QUERY ERROR BOUNDARY
 * ==================================================================
 * Error boundary specifically for React Query errors
 * Provides retry functionality and better error messages for data fetching
 * ==================================================================
 */

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Wifi, Server, Lock } from 'lucide-react';
import { ReactNode } from 'react';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

/**
 * Get appropriate icon and message based on error type
 */
function getErrorDetails(error: Error): {
  icon: ReactNode;
  title: string;
  description: string;
} {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('offline')) {
    return {
      icon: <Wifi className="h-10 w-10 text-orange-600" />,
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }

  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized') || message.includes('auth')) {
    return {
      icon: <Lock className="h-10 w-10 text-red-600" />,
      title: 'Authentication Error',
      description: 'Your session may have expired. Please log in again to continue.',
    };
  }

  // Server errors
  if (message.includes('500') || message.includes('server') || message.includes('internal')) {
    return {
      icon: <Server className="h-10 w-10 text-red-600" />,
      title: 'Server Error',
      description: 'The server encountered an error. Please try again later or contact support if the issue persists.',
    };
  }

  // Default error
  return {
    icon: <AlertTriangle className="h-10 w-10 text-red-600" />,
    title: 'Error Loading Data',
    description: 'An error occurred while loading data. Please try again.',
  };
}

/**
 * Fallback component for query errors
 */
function QueryErrorFallback({
  error,
  resetErrorBoundary,
  title,
  description,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string;
  description?: string;
}) {
  const errorDetails = getErrorDetails(error);

  return (
    <Card className="max-w-lg mx-auto my-8">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-muted rounded-full">
            {errorDetails.icon}
          </div>
        </div>
        <CardTitle>{title || errorDetails.title}</CardTitle>
        <CardDescription>
          {description || errorDetails.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error message for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-mono text-red-700">
              {error.message}
            </p>
          </div>
        )}

        <Button onClick={resetErrorBoundary} className="w-full">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Query Error Boundary Component
 * Wraps components that use React Query and provides error handling with retry
 */
export function QueryErrorBoundary({
  children,
  fallbackTitle,
  fallbackDescription,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={(error) => {
            console.error('Query error:', error);
          }}
          fallback={
            <QueryErrorFallback
              error={new Error('An error occurred')}
              resetErrorBoundary={reset}
              title={fallbackTitle}
              description={fallbackDescription}
            />
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

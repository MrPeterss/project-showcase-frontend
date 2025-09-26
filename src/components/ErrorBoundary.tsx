import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {this.state.error && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground">
                      Error details
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto bg-muted p-2 rounded">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Query Error Boundary Wrapper
export const QueryErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <QueryErrorResetBoundary>
      <ErrorBoundary>
        <div className="query-error-boundary">{children}</div>
      </ErrorBoundary>
    </QueryErrorResetBoundary>
  );
};

export default ErrorBoundary;

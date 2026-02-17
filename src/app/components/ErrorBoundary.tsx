import { Component, type ErrorInfo, type ReactNode } from "react";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/app/components/ui/skill-swap-button";
import { Link } from "react-router";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - React error boundary component for graceful error handling
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Log to error reporting service (e.g., Sentry)
    // if (process.env.NODE_ENV === "production") {
    //   // sendToErrorReporting(error, errorInfo);
    // }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
      role="alert"
      aria-live="assertive"
    >
      <div
        className="max-w-md w-full p-8 rounded-2xl shadow-2xl text-center"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "var(--destructive)" + "20" }}
        >
          <AlertTriangle
            className="w-10 h-10"
            style={{ color: "var(--destructive)" }}
          />
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Something went wrong
        </h1>

        <p
          className="mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>

        {error && import.meta.env.DEV && (

          <div
            className="mb-6 p-4 rounded-lg text-left overflow-auto max-h-40"
            style={{
              backgroundColor: "var(--section-bg)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="font-mono text-sm mb-2"
              style={{ color: "var(--destructive)" }}
            >
              {error.message}
            </p>
            {error.stack && (
              <pre
                className="text-xs font-mono whitespace-pre-wrap"
                style={{ color: "var(--text-tertiary)" }}
              >
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>

          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--text-primary)",
            }}
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * withErrorBoundary - HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

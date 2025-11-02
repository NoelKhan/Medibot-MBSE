import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallbackComponent } from './EnhancedUIComponents';
import { reportBoundaryError } from '../services/ErrorReporter';
import { createLogger } from '../services/Logger';

const logger = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * PRODUCTION ERROR BOUNDARY
 * ========================
 * Catches JavaScript errors in the component tree and displays fallback UI
 * Essential for production healthcare apps to prevent crashes
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to ErrorReporter service (which handles Logger and Analytics integration)
    reportBoundaryError(error, errorInfo, errorInfo.componentStack || undefined);
    
    // Log error to crash reporting service in production
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to your error reporting service
    // Example: Sentry, Crashlytics, etc.
    if (__DEV__) {
      logger.debug('Error Stack', { stack: error.stack });
      logger.debug('Component Stack', { componentStack: errorInfo.componentStack });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallbackComponent
          error={this.state.error}
          resetError={this.handleReset}
          context="Healthcare App"
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
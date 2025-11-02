/**
 * Error Reporting Service
 * Centralized error handling and reporting
 * Integrates with ErrorBoundary, Logger, and Analytics
 */

import Logger, { createLogger } from './Logger';
import Analytics, { AnalyticsEvent } from './Analytics';

const logger = createLogger('ErrorReporter');

export interface ErrorReport {
  error: Error;
  errorInfo?: any;
  context?: string;
  componentStack?: string;
  userId?: string;
  timestamp: Date;
  platform: string;
  appVersion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
}

export interface ErrorMetadata {
  context?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  userAction?: string;
  additionalData?: Record<string, any>;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private errors: ErrorReport[] = [];
  private maxErrors: number = 100;
  private remoteReportingUrl?: string;
  private remoteReportingEnabled: boolean = false;

  private constructor() {
    this.setupGlobalErrorHandler();
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  /**
   * Configure error reporting
   */
  public configure(config: {
    maxErrors?: number;
    remoteReportingUrl?: string;
    remoteReportingEnabled?: boolean;
  }): void {
    if (config.maxErrors) {
      this.maxErrors = config.maxErrors;
    }
    if (config.remoteReportingUrl) {
      this.remoteReportingUrl = config.remoteReportingUrl;
    }
    if (config.remoteReportingEnabled !== undefined) {
      this.remoteReportingEnabled = config.remoteReportingEnabled;
    }
  }

  /**
   * Report an error
   */
  public reportError(error: Error, metadata?: ErrorMetadata): void {
    const errorReport: ErrorReport = {
      error,
      context: metadata?.context,
      timestamp: new Date(),
      platform: require('react-native').Platform.OS,
      appVersion: '1.0.0',
      severity: metadata?.severity || 'medium',
      handled: true,
    };

    // Store error
    this.storeError(errorReport);

    // Log error
    logger.error(`Error in ${metadata?.context || 'unknown context'}`, error);

    // Track in analytics
    Analytics.trackError(error, metadata?.context, metadata?.additionalData);

    // Send to remote if configured
    if (this.remoteReportingEnabled) {
      this.sendToRemote(errorReport);
    }
  }

  /**
   * Report error from ErrorBoundary
   */
  public reportBoundaryError(error: Error, errorInfo: any, componentStack?: string): void {
    const errorReport: ErrorReport = {
      error,
      errorInfo,
      componentStack,
      context: 'ErrorBoundary',
      timestamp: new Date(),
      platform: require('react-native').Platform.OS,
      appVersion: '1.0.0',
      severity: 'high',
      handled: true,
    };

    this.storeError(errorReport);
    logger.error('ErrorBoundary caught error', { error, errorInfo, componentStack });
    Analytics.track(AnalyticsEvent.ERROR_BOUNDARY_TRIGGERED, {
      error_message: error.message,
      component_stack: componentStack,
    });

    if (this.remoteReportingEnabled) {
      this.sendToRemote(errorReport);
    }
  }

  /**
   * Report unhandled error
   */
  public reportUnhandledError(error: Error, isFatal: boolean = false): void {
    const errorReport: ErrorReport = {
      error,
      context: 'Unhandled',
      timestamp: new Date(),
      platform: require('react-native').Platform.OS,
      appVersion: '1.0.0',
      severity: isFatal ? 'critical' : 'high',
      handled: false,
    };

    this.storeError(errorReport);
    logger.error('Unhandled error', error);

    if (this.remoteReportingEnabled) {
      this.sendToRemote(errorReport);
    }
  }

  /**
   * Store error in memory
   */
  private storeError(errorReport: ErrorReport): void {
    this.errors.push(errorReport);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * Send error to remote reporting service
   */
  private async sendToRemote(errorReport: ErrorReport): Promise<void> {
    if (!this.remoteReportingUrl) {
      return;
    }

    try {
      await fetch(this.remoteReportingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorReport,
          error: {
            message: errorReport.error.message,
            stack: errorReport.error.stack,
            name: errorReport.error.name,
          },
          timestamp: errorReport.timestamp.toISOString(),
        }),
      });
    } catch (error) {
      // Silently fail - don't want error reporting to break the app
      if (__DEV__) {
        logger.error('Failed to send error report', error as Error);
      }
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandler(): void {
    // Handle unhandled promise rejections
    const globalAny = global as any;
    const originalHandler = globalAny.ErrorUtils?.getGlobalHandler?.();
    
    globalAny.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
      this.reportUnhandledError(error, isFatal);
      originalHandler?.(error, isFatal);
    });

    // Log that global error handler is set up
    logger.info('Global error handler configured');
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(count: number = 50): ErrorReport[] {
    return this.errors.slice(-count);
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: ErrorReport['severity']): ErrorReport[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Get error count by severity
   */
  public getErrorCounts(): Record<ErrorReport['severity'], number> {
    return {
      low: this.errors.filter((e) => e.severity === 'low').length,
      medium: this.errors.filter((e) => e.severity === 'medium').length,
      high: this.errors.filter((e) => e.severity === 'high').length,
      critical: this.errors.filter((e) => e.severity === 'critical').length,
    };
  }

  /**
   * Get unhandled errors
   */
  public getUnhandledErrors(): ErrorReport[] {
    return this.errors.filter((e) => !e.handled);
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
    logger.info('Error reports cleared');
  }

  /**
   * Export errors as JSON
   */
  public exportErrors(): string {
    return JSON.stringify(
      this.errors.map((report) => ({
        ...report,
        error: {
          message: report.error.message,
          stack: report.error.stack,
          name: report.error.name,
        },
        timestamp: report.timestamp.toISOString(),
      })),
      null,
      2
    );
  }

  /**
   * Generate error summary
   */
  public generateSummary(): string {
    const counts = this.getErrorCounts();
    const unhandledCount = this.getUnhandledErrors().length;

    return `
📋 ERROR REPORT SUMMARY
=======================
Total Errors: ${this.errors.length}

By Severity:
- Critical: ${counts.critical}
- High: ${counts.high}
- Medium: ${counts.medium}
- Low: ${counts.low}

Unhandled Errors: ${unhandledCount}

Recent Errors (Last 5):
${this.getRecentErrors(5)
  .map(
    (e) =>
      `- [${e.severity.toUpperCase()}] ${e.error.message} (${e.context || 'unknown context'})`
  )
  .join('\n')}
    `.trim();
  }
}

// Export singleton instance
export const ErrorReporter = ErrorReportingService.getInstance();

// Convenience functions
export const reportError = (error: Error, metadata?: ErrorMetadata) => {
  ErrorReporter.reportError(error, metadata);
};

export const reportBoundaryError = (error: Error, errorInfo: any, componentStack?: string) => {
  ErrorReporter.reportBoundaryError(error, errorInfo, componentStack);
};

export default ErrorReporter;

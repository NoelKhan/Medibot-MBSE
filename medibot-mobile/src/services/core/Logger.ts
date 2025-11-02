/**
 * Production-Ready Logger Service
 * Replaces console.log/warn/error with environment-aware logging
 * Supports log levels, filtering, and optional remote logging
 */

import { Platform } from 'react-native';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
  platform: string;
}

class LoggerService {
  private static instance: LoggerService;
  private logLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN;
  private logs: LogEntry[] = [];
  private maxLogs: number = 100; // Keep last 100 logs in memory
  private remoteLoggingEnabled: boolean = false;
  private remoteLoggingUrl?: string;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Configure logger settings
   */
  public configure(config: {
    logLevel?: LogLevel;
    maxLogs?: number;
    remoteLoggingUrl?: string;
    remoteLoggingEnabled?: boolean;
  }): void {
    if (config.logLevel !== undefined) {
      this.logLevel = config.logLevel;
    }
    if (config.maxLogs !== undefined) {
      this.maxLogs = config.maxLogs;
    }
    if (config.remoteLoggingUrl) {
      this.remoteLoggingUrl = config.remoteLoggingUrl;
    }
    if (config.remoteLoggingEnabled !== undefined) {
      this.remoteLoggingEnabled = config.remoteLoggingEnabled;
    }
  }

  /**
   * Debug level logging (development only)
   */
  public debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info level logging
   */
  public info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning level logging
   */
  public warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error level logging
   */
  public error(message: string, error?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, error, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    // Check if we should log at this level
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context,
      platform: Platform.OS,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output with color coding
    this.consoleOutput(logEntry);

    // Send to remote logging if enabled
    if (this.remoteLoggingEnabled && level >= LogLevel.ERROR) {
      this.sendToRemote(logEntry);
    }
  }

  /**
   * Output to console with formatting
   */
  private consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString().split('T')[1].slice(0, -1);
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const levelStr = LogLevel[entry.level];
    const emoji = this.getLevelEmoji(entry.level);

    const formattedMessage = `${emoji} ${timestamp}${contextStr} ${levelStr}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (__DEV__) {
          console.log(formattedMessage, entry.data || '');
        }
        break;
      case LogLevel.INFO:
        console.log(formattedMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.data || '');
        break;
    }
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🐛';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  /**
   * Send log to remote logging service
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.remoteLoggingUrl) {
      return;
    }

    try {
      await fetch(this.remoteLoggingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
          appVersion: '1.0.0', // Could be dynamic
          environment: __DEV__ ? 'development' : 'production',
        }),
      });
    } catch (error) {
      // Silently fail - don't want logging to break the app
      if (__DEV__) {
        console.error('Failed to send log to remote:', error);
      }
    }
  }

  /**
   * Get recent logs (useful for debug panels)
   */
  public getRecentLogs(count?: number): LogEntry[] {
    const logCount = count || this.maxLogs;
    return this.logs.slice(-logCount);
  }

  /**
   * Clear in-memory logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON (useful for bug reports)
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get logs filtered by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs filtered by context
   */
  public getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter((log) => log.context === context);
  }

  /**
   * Get error count (useful for monitoring)
   */
  public getErrorCount(): number {
    return this.logs.filter((log) => log.level === LogLevel.ERROR).length;
  }

  /**
   * Get warning count
   */
  public getWarningCount(): number {
    return this.logs.filter((log) => log.level === LogLevel.WARN).length;
  }
}

// Export singleton instance
export const Logger = LoggerService.getInstance();

// Convenience exports for common contexts
export const createLogger = (context: string) => ({
  debug: (message: string, data?: any) => Logger.debug(message, data, context),
  info: (message: string, data?: any) => Logger.info(message, data, context),
  warn: (message: string, data?: any) => Logger.warn(message, data, context),
  error: (message: string, error?: any) => Logger.error(message, error, context),
});

export default Logger;

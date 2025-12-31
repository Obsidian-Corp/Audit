// =====================================================
// OBSIDIAN AUDIT - ENTERPRISE LOGGING SERVICE
// Centralized logging with structured output
// =====================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  firmId?: string;
  engagementId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: string;
  version: string;
}

class Logger {
  private static instance: Logger;
  private environment: string;
  private version: string;
  private minLevel: LogLevel;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  private constructor() {
    this.environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
    this.version = import.meta.env.VITE_APP_VERSION || '0.0.0';
    this.minLevel = this.environment === 'production' ? 'info' : 'debug';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      environment: this.environment,
      version: this.version,
    };
  }

  private output(entry: LogEntry): void {
    // Buffer management
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    // Console output with formatting
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}${contextStr}`);
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}${contextStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}${contextStr}`);
        break;
      case 'error':
      case 'fatal':
        console.error(`${prefix} ${entry.message}${contextStr}`, entry.error);
        break;
    }

    // Send to external service in production
    if (this.environment === 'production' && entry.level !== 'debug') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Integration with Sentry for errors
    if ((entry.level === 'error' || entry.level === 'fatal') && entry.error) {
      try {
        // Dynamic import to avoid loading Sentry in development
        const Sentry = await import('@sentry/react');
        Sentry.captureException(new Error(entry.message), {
          extra: entry.context,
          level: entry.level === 'fatal' ? 'fatal' : 'error',
        });
      } catch {
        // Sentry not configured, silently fail
      }
    }

    // Could also send to LogRocket, Datadog, etc.
  }

  public debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, context));
    }
  }

  public info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, context));
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, context));
    }
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      this.output(this.formatEntry('error', message, context, error));
    }
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('fatal')) {
      this.output(this.formatEntry('fatal', message, context, error));
    }
  }

  // Performance logging
  public time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // Get recent logs for debugging
  public getRecentLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  // Clear log buffer
  public clearLogs(): void {
    this.logBuffer = [];
  }

  // Create child logger with default context
  public child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  public debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  public warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    this.parent.fatal(message, error, this.mergeContext(context));
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) =>
  logger.error(message, error, context);
export const logFatal = (message: string, error?: Error, context?: LogContext) =>
  logger.fatal(message, error, context);

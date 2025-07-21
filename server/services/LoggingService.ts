
/**
 * Logging Service
 * Centralized logging service for the application
 */

export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class LoggingService {
  private logLevel: string = process.env.LOG_LEVEL || 'info';

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatLog(level: string, message: string, metadata?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level: level.toUpperCase(),
      message,
      timestamp,
      ...(metadata && { metadata })
    };

    if (process.env.NODE_ENV === 'development') {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metadata ? ` | ${JSON.stringify(metadata)}` : ''}`;
    }

    return JSON.stringify(logEntry);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('debug', message, metadata));
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      console.info(this.formatLog('info', message, metadata));
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, metadata));
    }
  }

  error(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      console.error(this.formatLog('error', message, metadata));
    }
  }

  log(level: string, message: string, metadata?: Record<string, any>): void {
    switch (level.toLowerCase()) {
      case 'debug':
        this.debug(message, metadata);
        break;
      case 'info':
        this.info(message, metadata);
        break;
      case 'warn':
        this.warn(message, metadata);
        break;
      case 'error':
        this.error(message, metadata);
        break;
      default:
        this.info(message, metadata);
    }
  }
}

// Export singleton instance
export const logger = new LoggingService();
export default logger;

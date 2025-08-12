export interface Logger {
  info(message: string, context?: any): void;
  error(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  debug(message: string, context?: any): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, context?: any): void {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
  }

  error(message: string, context?: any): void {
    console.error(`[ERROR] ${message}`, context ? JSON.stringify(context) : '');
  }

  warn(message: string, context?: any): void {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
  }

  debug(message: string, context?: any): void {
    console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context) : '');
  }
}
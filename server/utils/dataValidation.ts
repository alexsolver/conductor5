
export interface DataResult<T> {
  data: T[];
  isEmpty: boolean;
  hasError: boolean;
  errorType?: 'schema_missing' | 'permission_denied' | 'network_error' | 'unknown';
  errorMessage?: string;
  fallbackUsed: boolean;
}

export class DataValidator {
  static createResult<T>(
    data: T[], 
    error?: Error, 
    fallbackUsed: boolean = false
  ): DataResult<T> {
    return {
      data,
      isEmpty: data.length === 0 && !error,
      hasError: !!error,
      errorType: error ? this.categorizeError(error) : undefined,
      errorMessage: error?.message,
      fallbackUsed
    };
  }
  
  private static categorizeError(error: Error): 'schema_missing' | 'permission_denied' | 'network_error' | 'unknown' {
    const message = error.message.toLowerCase();
    
    if (message.includes('schema') || message.includes('table') || message.includes('column')) {
      return 'schema_missing';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission_denied';
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return 'network_error';
    }
    
    return 'unknown';
  }
  
  static isRealError<T>(result: DataResult<T>): boolean {
    return result.hasError && !result.fallbackUsed;
  }
}

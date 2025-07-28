/**
 * Standardized API Response Helper
 * Addresses QA Issue: Inconsistent error handling patterns across endpoints
 */

export interface StandardAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  details?: string;
  timestamp?: string;
  requestId?: string;
}

export function createSuccessResponse<T = any>(
  data: T, 
  message?: string
): StandardAPIResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(
  error: string | Error,
  message?: string,
  statusCode?: number
): StandardAPIResponse {
  const errorMessage = error instanceof Error ? error.message : error;

  return {
    success: false,
    message: message || 'An error occurred',
    error: errorMessage,
    details: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  };
}

export const sendSuccess = (res: any, data: any, metadata?: { fallbackUsed?: boolean; message?: string }) => {
  const response: any = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  // Add metadata if provided
  if (metadata) {
    if (metadata.fallbackUsed) {
      response.warning = 'Dados padrão utilizados devido a problemas de conectividade';
    }
    if (metadata.message) {
      response.message = metadata.message;
    }
  }

  res.status(200).json(response);
};

export function sendError(res: Response, error: any, message: string = "Internal server error", statusCode: number = 500) {
  logger.error('Request failed', {
    error: error?.message || error,
    stack: error?.stack,
    statusCode,
    timestamp: new Date().toISOString(),
    module: 'locations'
  });

  // Special handling for database connection errors
  if (error?.message?.includes('this.db.execute is not a function')) {
    return res.status(503).json({
      success: false,
      error: "Database service temporarily unavailable",
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

export function sendValidationError(
  res: any,
  errors: string[],
  message: string = 'Validation failed'
) {
  const response: StandardAPIResponse = {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  };

  console.error('[Validation Error]:', response);
  return res.status(400).json(response);
}
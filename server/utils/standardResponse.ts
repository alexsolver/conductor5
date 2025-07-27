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

export function sendSuccess<T = any>(
  res: any,
  data: T,
  message?: string,
  statusCode: number = 200
) {
  const response = createSuccessResponse(data, message);
  return res.status(statusCode).json(response);
}

export function sendError(
  res: any,
  error: string | Error,
  message?: string,
  statusCode: number = 500
) {
  const response = createErrorResponse(error, message, statusCode);
  console.error(`[API Error ${statusCode}]:`, response);
  return res.status(statusCode).json(response);
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
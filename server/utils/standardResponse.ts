import { Response } from 'express';

/**
 * Standardized API Response Helper
 * Addresses QA Issue: Inconsistent error handling patterns across endpoints
 */

export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export function standardResponse<T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  error?: string
): void {
  const response: StandardApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  res.status(statusCode).json(response);
}

// Helper functions for common response patterns
export function sendSuccess<T = any>(
  res: Response,
  data?: T,
  message: string = 'Success',
  statusCode: number = 200
): void {
  standardResponse(res, statusCode, message, data);
}

export function sendError(
  res: Response,
  error: any,
  message: string = 'An error occurred',
  statusCode: number = 500
): void {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
  standardResponse(res, statusCode, message, undefined, errorMessage);
}

export function sendValidationError(
  res: Response,
  message: string = 'Validation failed',
  errors?: any
): void {
  standardResponse(res, 400, message, undefined, errors);
}
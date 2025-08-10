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
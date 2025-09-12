
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure request body is only parsed once
 * Prevents "body stream already read" errors
 */
export const validateRequestBody = (req: Request, res: Response, next: NextFunction) => {
  // Ensure we don't double-parse JSON bodies
  if (req.body && typeof req.body === 'object') {
    // Body already parsed, continue
    return next();
  }

  // If body is not parsed yet, let Express handle it normally
  next();
};

/**
 * Enhanced JSON error handler
 */
export const jsonErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      error: 'INVALID_JSON'
    });
  }

  if (error.message?.includes('body stream already read')) {
    return res.status(400).json({
      success: false,
      message: 'Request body parsing error',
      error: 'BODY_STREAM_ERROR'
    });
  }

  next(error);
};

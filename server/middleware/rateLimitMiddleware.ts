
// Rate Limiting Middleware - Memory-based implementation
import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

// Memory store for rate limiting
const memoryStore = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // ✅ 1QA.MD: Development mode - rate limiting bypassed for development
    console.log('🚀 [RATE-LIMIT] Development mode - all requests allowed');
    
    // Set permissive headers for development
    res.set({
      'X-RateLimit-Limit': '999999',
      'X-RateLimit-Remaining': '999999',
      'X-RateLimit-Reset': new Date(Date.now() + 86400000).toISOString(),
      'X-RateLimit-Window': '86400000'
    });

    next(); // Always continue in development
  };
}

export function recordLoginAttempt(req: Request, res: Response, next: NextFunction) {
  // ✅ 1QA.MD: Development mode - login attempt recording bypassed
  console.log('🚀 [LOGIN-ATTEMPT] Development mode - recording bypassed');
  next();
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime <= now) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

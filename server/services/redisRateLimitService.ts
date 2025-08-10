// REMOVED: Redis dependency
import { Request, Response, NextFunction } from 'express';
import rateLimit, { MemoryStore, ipKeyGenerator } from 'express-rate-limit';

// Define RateLimitOptions interface for clarity
interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: Request, res: Response) => void;
  message?: string; // Added for express-rate-limit compatibility
  maxAttempts?: number; // Added for express-rate-limit compatibility
}

export interface RateLimitInfo {
  totalHits: number;
  remainingRequests: number;
  resetTime: Date;
  isLimited: boolean;
}

// This service should be in infrastructure layer and implement a domain interface
export class RedisRateLimitService {
  private static instance: RedisRateLimitService;

  private memoryStore = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    // REMOVED: Redis dependency - using memory-only approach
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.memoryStore.entries()) {
        if (value.resetTime <= now) {
          this.memoryStore.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  static getInstance(): RedisRateLimitService {
    if (!RedisRateLimitService.instance) {
      RedisRateLimitService.instance = new RedisRateLimitService();
    }
    return RedisRateLimitService.instance;
  }

  private getKey(identifier: string, window: number): string {
    return `rate_limit:${identifier}:${window}`;
  }

  async checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
    const key = this.getKey(identifier, windowStart);
    const now = Date.now();

    // Memory-based rate limiting
    const existing = this.memoryStore.get(key);
    let totalHits = 1;

    if (existing && existing.resetTime > now) {
      totalHits = existing.count + 1;
      this.memoryStore.set(key, { count: totalHits, resetTime: existing.resetTime });
    } else {
      this.memoryStore.set(key, { count: 1, resetTime: windowStart + config.windowMs });
    }

    const remainingRequests = Math.max(0, config.maxRequests - totalHits);
    const resetTime = new Date(windowStart + config.windowMs);
    const isLimited = totalHits > config.maxRequests;

    return {
      totalHits,
      remainingRequests,
      resetTime,
      isLimited
    };
  }

  async resetRateLimit(identifier: string): Promise<void> {
    try {
      const pattern = `rate_limit:${identifier}:*`;
      // In-memory, this is a simulation. In a real Redis scenario, you'd use KEYS or SCAN.
      // For this memory-only implementation, we'll iterate and remove matching keys.
      const now = Date.now();
      for (const [key, value] of this.memoryStore.entries()) {
        if (key.startsWith(`rate_limit:${identifier}:`)) {
          this.memoryStore.delete(key);
        }
      }
    } catch (error) {
      console.error('Memory rate limit reset failed:', error);
    }
  }

  async getRateLimitStatus(identifier: string, windowMs: number): Promise<RateLimitInfo | null> {
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const key = this.getKey(identifier, windowStart);

    const entry = this.memoryStore.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const remainingRequests = Math.max(0, 0 - entry.count); // This calculation needs maxRequests from config
    const resetTime = new Date(entry.resetTime);
    const isLimited = entry.count > 0; // This check needs maxRequests from config

    // This method is not fully implemented for memory-only, requires config passed in to calculate properly.
    // Returning a placeholder based on available memory data.
    return {
      totalHits: entry.count,
      remainingRequests: 0, // Placeholder, as maxRequests is not available here
      resetTime: resetTime,
      isLimited: isLimited
    };
  }

  // Sliding window rate limiting
  async checkSlidingWindowRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const key = `sliding_rate_limit:${identifier}`;

    try {
      // Clean old entries and add current request
      // Simulate ZREMRANGEBYSCORE and ZADD for memory store
      const currentEntries = Array.from(this.memoryStore.entries())
        .filter(([k, v]) => k.startsWith(key + ':'))
        .map(([k, v]) => ({ score: v.resetTime, value: k })); // Using resetTime as score

      const validEntries = currentEntries.filter(entry => entry.score > windowStart);
      const newEntries = [...validEntries, { score: now, value: `${key}:${now}` }];

      // Simulate storage
      newEntries.forEach(entry => {
        this.memoryStore.set(entry.value, { count: 1, resetTime: entry.score }); // Storing 'count' and 'resetTime'
      });

      const totalHits = newEntries.length;
      const remainingRequests = Math.max(0, config.maxRequests - totalHits);
      const isLimited = totalHits > config.maxRequests;

      return {
        totalHits,
        remainingRequests,
        resetTime: new Date(now + config.windowMs), // Approximate reset time
        isLimited
      };
    } catch (error) {
      console.error('Memory sliding window rate limit check failed:', error);
      return {
        totalHits: 0,
        remainingRequests: config.maxRequests,
        resetTime: new Date(now + config.windowMs),
        isLimited: false
      };
    }
  }

  // Memory-based distributed rate limiting simulation
  async checkDistributedRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    // Simplified to use same memory-based approach
    return this.checkRateLimit(identifier, config);
  }

  async close(): Promise<void> {
    // REMOVED: Redis cleanup - using memory only
    this.memoryStore.clear();
  }
}

export const redisRateLimitService = RedisRateLimitService.getInstance();

// Create rate limit middleware instances at module initialization
const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = ipKeyGenerator(req);
    return `${ip}:${req.user?.id || 'anonymous'}`;
  },
  store: new MemoryStore(), // Use MemoryStore for express-rate-limit
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path.includes('/health') ||
           req.path.includes('/favicon') ||
           req.path.includes('/@vite/') ||
           req.path.includes('/__vite_ping');
  }
});

const strictRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: new MemoryStore(), // Use MemoryStore for express-rate-limit
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path.includes('/health') ||
           req.path.includes('/favicon') ||
           req.path.includes('/@vite/') ||
           req.path.includes('/__vite_ping');
  }
});

export function createMemoryRateLimitMiddleware(options: RateLimitOptions = {}) {
  // Return pre-created middleware instance based on options
  if (options.max && options.max <= 20) {
    return strictRateLimiter;
  }
  return defaultRateLimiter;
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req: Request) => `login:${ipKeyGenerator(req)}:${req.body?.email || 'unknown'}`,
    message: 'Too many login attempts, please try again later.',
    maxAttempts: 5
  },

  // API endpoints
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req: Request) => `api:${ipKeyGenerator(req)}`,
    message: 'Too many requests, please again later.',
    maxAttempts: 100
  },

  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req: Request) => `upload:${ipKeyGenerator(req)}`,
    message: 'Too many uploads, please try again later.',
    maxAttempts: 10
  },

  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req: Request) => `search:${ipKeyGenerator(req)}`,
    message: 'Too many search requests, please try again later.',
    maxAttempts: 30
  },

  // Password reset
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req: Request) => `password_reset:${ipKeyGenerator(req)}:${req.body?.email || 'unknown'}`,
    message: 'Too many password reset attempts, please try again later.',
    maxAttempts: 3
  },

  // Registration
  REGISTRATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (req: Request) => `registration:${ipKeyGenerator(req)}`,
    message: 'Too many registration attempts, please try again later.',
    maxAttempts: 5
  }
};

// Sliding window rate limiting middleware
export function createSlidingWindowRateLimitMiddleware(config: RateLimitConfig) {
  const service = redisRateLimitService;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = config.keyGenerator ? config.keyGenerator(req) :
      req.ip || req.connection.remoteAddress || 'unknown';

    try {
      const rateLimitInfo = await service.checkSlidingWindowRateLimit(identifier, config);

      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remainingRequests.toString(),
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toISOString(),
        'X-RateLimit-Window': config.windowMs.toString()
      });

      if (rateLimitInfo.isLimited) {
        if (config.onLimitReached) {
          config.onLimitReached(req, res);
          return;
        }

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again after ${rateLimitInfo.resetTime.toISOString()}`,
          retryAfter: Math.ceil((rateLimitInfo.resetTime.getTime() - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      console.error('Sliding window rate limit middleware error:', error);
      next();
    }
  };
}

export default redisRateLimitService;
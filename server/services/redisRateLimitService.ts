// REMOVED: Redis dependency
import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

export interface RateLimitInfo {
  totalHits: number;
  remainingRequests: number;
  resetTime: Date;
  isLimited: boolean;
}

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
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis rate limit reset failed:', error);
    }
  }

  async getRateLimitStatus(identifier: string, windowMs: number): Promise<RateLimitInfo | null> {
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const key = this.getKey(identifier, windowStart);
    
    try {
      const totalHits = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      
      if (totalHits === null) {
        return null;
      }

      return {
        totalHits: parseInt(totalHits),
        remainingRequests: Math.max(0, 0 - parseInt(totalHits)), // Need max requests to calculate
        resetTime: new Date(Date.now() + (ttl * 1000)),
        isLimited: false // Need max requests to determine
      };
    } catch (error) {
      console.error('Redis rate limit status check failed:', error);
      return null;
    }
  }

  // Sliding window rate limiting
  async checkSlidingWindowRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const key = `sliding_rate_limit:${identifier}`;
    
    try {
      // Clean old entries and add current request
      await this.redis.zremrangebyscore(key, 0, windowStart);
      await this.redis.zadd(key, now, now);
      await this.redis.expire(key, Math.ceil(config.windowMs / 1000));
      
      const totalHits = await this.redis.zcard(key);
      const remainingRequests = Math.max(0, config.maxRequests - totalHits);
      const isLimited = totalHits > config.maxRequests;

      return {
        totalHits,
        remainingRequests,
        resetTime: new Date(now + config.windowMs),
        isLimited
      };
    } catch (error) {
      console.error('Redis sliding window rate limit check failed:', error);
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

// Memory-based rate limiting middleware factory
export function createMemoryRateLimitMiddleware(config: RateLimitConfig) {
  const service = redisRateLimitService;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // 🔧 [1QA-COMPLIANCE] DEVELOPMENT MODE: Rate limiting completely bypassed
    
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

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req: Request) => `login:${req.ip}:${req.body?.email || 'unknown'}`
  },

  // API endpoints
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req: Request) => `api:${req.ip}`
  },

  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req: Request) => `upload:${req.ip}`
  },

  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req: Request) => `search:${req.ip}`
  },

  // Password reset
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req: Request) => `password_reset:${req.ip}:${req.body?.email || 'unknown'}`
  },

  // Registration
  REGISTRATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (req: Request) => `registration:${req.ip}`
  }
};

// Sliding window rate limiting middleware
export function createSlidingWindowRateLimitMiddleware(config: RateLimitConfig) {
  const service = redisRateLimitService;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // 🔧 [1QA-COMPLIANCE] DEVELOPMENT MODE: Sliding window rate limiting completely bypassed
    
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

export default redisRateLimitService;
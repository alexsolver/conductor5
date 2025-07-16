import Redis from 'ioredis';
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
  private redis: Redis;
  private static instance: RedisRateLimitService;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      // Fallback to in-memory if Redis is not available
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000
    });

    // Handle Redis connection errors
    this.redis.on('error', (err) => {
      console.warn('Redis connection error, falling back to memory:', err.message);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected for rate limiting');
    });
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
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      
      const results = await pipeline.exec();
      const totalHits = results?.[0]?.[1] as number || 0;
      
      const remainingRequests = Math.max(0, config.maxRequests - totalHits);
      const resetTime = new Date(windowStart + config.windowMs);
      const isLimited = totalHits > config.maxRequests;

      return {
        totalHits,
        remainingRequests,
        resetTime,
        isLimited
      };
    } catch (error) {
      console.error('Redis rate limit check failed:', error);
      // Fallback to allowing request if Redis fails
      return {
        totalHits: 0,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
        isLimited: false
      };
    }
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

  // Distributed rate limiting for multiple instances
  async checkDistributedRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const script = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local max_requests = tonumber(ARGV[2])
      local current_time = tonumber(ARGV[3])
      
      local window_start = math.floor(current_time / window) * window
      local window_key = key .. ':' .. window_start
      
      local current_count = redis.call('GET', window_key)
      if current_count == false then
        current_count = 0
      else
        current_count = tonumber(current_count)
      end
      
      local new_count = current_count + 1
      redis.call('SET', window_key, new_count)
      redis.call('EXPIRE', window_key, math.ceil(window / 1000))
      
      local remaining = math.max(0, max_requests - new_count)
      local reset_time = window_start + window
      local is_limited = new_count > max_requests
      
      return {new_count, remaining, reset_time, is_limited and 1 or 0}
    `;

    try {
      const result = await this.redis.eval(
        script,
        1,
        `distributed_rate_limit:${identifier}`,
        config.windowMs.toString(),
        config.maxRequests.toString(),
        Date.now().toString()
      ) as number[];

      return {
        totalHits: result[0],
        remainingRequests: result[1],
        resetTime: new Date(result[2]),
        isLimited: result[3] === 1
      };
    } catch (error) {
      console.error('Redis distributed rate limit check failed:', error);
      return {
        totalHits: 0,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
        isLimited: false
      };
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const redisRateLimitService = RedisRateLimitService.getInstance();

// Rate limiting middleware factory
export function createRedisRateLimitMiddleware(config: RateLimitConfig) {
  const service = redisRateLimitService;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = config.keyGenerator ? config.keyGenerator(req) : 
      req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      const rateLimitInfo = await service.checkRateLimit(identifier, config);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remainingRequests.toString(),
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toISOString(),
        'X-RateLimit-Window': config.windowMs.toString()
      });

      if (rateLimitInfo.isLimited) {
        // Call custom handler if provided
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
      console.error('Rate limit middleware error:', error);
      next(); // Continue on error
    }
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
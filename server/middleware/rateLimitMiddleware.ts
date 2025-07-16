import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

interface LoginAttempt {
  ip: string;
  email?: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

// In-memory store for rate limiting (in production, use Redis)
const attemptStore = new Map<string, LoginAttempt>();

export class RateLimitService {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(ip: string, email?: string): string {
    return email ? `${ip}:${email}` : ip;
  }

  private cleanupExpiredAttempts(): void {
    const now = new Date();
    for (const [key, attempt] of attemptStore.entries()) {
      if (attempt.blockedUntil && now > attempt.blockedUntil) {
        attemptStore.delete(key);
      } else if (now.getTime() - attempt.lastAttempt.getTime() > this.config.windowMs) {
        attemptStore.delete(key);
      }
    }
  }

  async recordAttempt(ip: string, email?: string, success: boolean = false): Promise<void> {
    this.cleanupExpiredAttempts();
    
    const key = this.getKey(ip, email);
    const now = new Date();
    
    if (success) {
      // Reset attempts on successful login
      attemptStore.delete(key);
      return;
    }

    let attempt = attemptStore.get(key);
    
    if (!attempt) {
      attempt = {
        ip,
        email,
        attempts: 1,
        lastAttempt: now
      };
    } else {
      attempt.attempts++;
      attempt.lastAttempt = now;
    }

    // Block if max attempts reached
    if (attempt.attempts >= this.config.maxAttempts) {
      attempt.blockedUntil = new Date(now.getTime() + this.config.blockDurationMs);
    }

    attemptStore.set(key, attempt);

    // Log security event
    await this.logSecurityEvent(ip, email, attempt.attempts);
  }

  async isBlocked(ip: string, email?: string): Promise<boolean> {
    this.cleanupExpiredAttempts();
    
    const key = this.getKey(ip, email);
    const attempt = attemptStore.get(key);
    
    if (!attempt) return false;
    
    return attempt.blockedUntil ? new Date() < attempt.blockedUntil : false;
  }

  async getRemainingAttempts(ip: string, email?: string): Promise<number> {
    const key = this.getKey(ip, email);
    const attempt = attemptStore.get(key);
    
    if (!attempt) return this.config.maxAttempts;
    
    return Math.max(0, this.config.maxAttempts - attempt.attempts);
  }

  async getBlockedUntil(ip: string, email?: string): Promise<Date | null> {
    const key = this.getKey(ip, email);
    const attempt = attemptStore.get(key);
    
    return attempt?.blockedUntil || null;
  }

  private async logSecurityEvent(ip: string, email: string | undefined, attempts: number): Promise<void> {
    try {
      // Log to database for security monitoring
      await db.execute(sql`
        INSERT INTO security_events (ip, email, event_type, attempts, created_at)
        VALUES (${ip}, ${email || null}, 'failed_login', ${attempts}, NOW())
      `);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Default configuration
const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 30 * 60 * 1000 // 30 minutes
};

export const rateLimitService = new RateLimitService(defaultConfig);

// Middleware factory
export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  const service = config ? new RateLimitService({ ...defaultConfig, ...config }) : rateLimitService;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body?.email || req.body?.username;
    
    try {
      const isBlocked = await service.isBlocked(ip, email);
      
      if (isBlocked) {
        const blockedUntil = await service.getBlockedUntil(ip, email);
        return res.status(429).json({
          error: 'Too many login attempts',
          message: 'Account temporarily blocked due to multiple failed login attempts',
          blockedUntil: blockedUntil?.toISOString(),
          retryAfter: blockedUntil ? Math.ceil((blockedUntil.getTime() - Date.now()) / 1000) : undefined
        });
      }
      
      // Attach rate limit info to request
      req.rateLimitInfo = {
        remainingAttempts: await service.getRemainingAttempts(ip, email),
        service
      };
      
      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next();
    }
  };
}

// Login attempt middleware
export function recordLoginAttempt(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body?.email || req.body?.username;
    
    // Check if login was successful based on status code
    const success = res.statusCode >= 200 && res.statusCode < 300;
    
    if (req.rateLimitInfo?.service) {
      req.rateLimitInfo.service.recordAttempt(ip, email, success);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      rateLimitInfo?: {
        remainingAttempts: number;
        service: RateLimitService;
      };
    }
  }
}
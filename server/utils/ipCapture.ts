
import { Request } from 'express';

export function getClientIP(req: Request): string {
  // Try to get IP from various headers (useful for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const clientIP = req.headers['x-client-ip'] as string;
  
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  // Fallback to connection remote address
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         (req.connection as any)?.socket?.remoteAddress || 
         '127.0.0.1';
}

export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'Unknown';
}

export function getSessionId(req: Request): string {
  // Try to get session ID from various sources
  return (req as any).sessionID || 
         req.headers['x-session-id'] as string || 
         req.cookies?.sessionId || 
         'no-session';
}


import type { Request } from 'express';

// AuthenticatedRequest type (extending Express Request with user info)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
  query: any;
  sessionID?: string;
}

export function getClientIP(req: AuthenticatedRequest): string {
  // Captura o IP real considerando proxies e load balancers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.toString().split(',');
    return ips[0].trim();
  }
  
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         'unknown';
}

export function getUserAgent(req: AuthenticatedRequest): string {
  return req.headers['user-agent'] || 'unknown';
}

export function getSessionId(req: AuthenticatedRequest): string {
  return req.sessionID || req.headers['x-session-id']?.toString() || 'unknown';
}

export function getRequestMetadata(req: AuthenticatedRequest) {
  return {
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
    sessionId: getSessionId(req),
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userId: req.user?.id || 'anonymous'
  };
}

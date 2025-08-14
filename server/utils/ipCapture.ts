
import { Request } from 'express';

export function getClientIP(req: Request): string {
  // Try to get IP from various headers (useful for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const clientIP = req.headers['x-client-ip'] as string;
  
  let capturedIP = '';
  
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    capturedIP = forwarded.split(',')[0].trim();
  } else if (realIP) {
    capturedIP = realIP;
  } else if (clientIP) {
    capturedIP = clientIP;
  } else {
    // Fallback to connection remote address
    capturedIP = req.connection?.remoteAddress || 
                 req.socket?.remoteAddress || 
                 (req.connection as any)?.socket?.remoteAddress || 
                 req.ip ||
                 '127.0.0.1';
  }

  // Debug logging for IP capture
  console.log('🔍 [IP-CAPTURE] IP extraction details:', {
    forwarded: forwarded?.substring(0, 30),
    realIP: realIP?.substring(0, 30),
    clientIP: clientIP?.substring(0, 30),
    connectionRemote: req.connection?.remoteAddress,
    socketRemote: req.socket?.remoteAddress,
    reqIP: req.ip,
    finalIP: capturedIP
  });

  return capturedIP;
}

export function getUserAgent(req: Request): string {
  const userAgent = req.headers['user-agent'] || req.get('User-Agent') || 'Unknown';
  
  console.log('🔍 [USER-AGENT-CAPTURE] User-Agent details:', {
    headerUserAgent: req.headers['user-agent']?.substring(0, 50),
    getUserAgent: req.get('User-Agent')?.substring(0, 50),
    finalUserAgent: userAgent.substring(0, 50)
  });
  
  return userAgent;
}

export function getSessionId(req: Request): string {
  // Try to get session ID from various sources
  const sessionId = (req as any).sessionID || 
                    req.headers['x-session-id'] as string || 
                    req.cookies?.sessionId ||
                    req.session?.id ||
                    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🔍 [SESSION-CAPTURE] Session ID details:', {
    reqSessionID: (req as any).sessionID,
    headerSessionID: req.headers['x-session-id'],
    cookieSessionId: req.cookies?.sessionId,
    sessionId: req.session?.id,
    finalSessionId: sessionId
  });
  
  return sessionId;
}

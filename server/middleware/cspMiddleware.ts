
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface CSPOptions {
  environment: 'development' | 'production';
  nonce?: boolean;
}

export function createCSPMiddleware(options: CSPOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const nonce = options.nonce ? crypto.randomBytes(16).toString('base64') : undefined;
    
    if (nonce) {
      res.locals.nonce = nonce;
    }

    // Basic CSP header for development
    if (options.environment === 'development') {
      res.setHeader('Content-Security-Policy', `
        default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss:;
        script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;
        style-src 'self' 'unsafe-inline' data:;
        img-src 'self' data: blob: https:;
        font-src 'self' data:;
        connect-src 'self' ws: wss: https:;
      `.replace(/\s+/g, ' ').trim());
    } else {
      // Production CSP
      const cspPolicy = [
        "default-src 'self'",
        nonce ? `script-src 'self' 'nonce-${nonce}'` : "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https:"
      ].join('; ');
      
      res.setHeader('Content-Security-Policy', cspPolicy);
    }

    next();
  };
}

export function createCSPReportingEndpoint() {
  return (req: Request, res: Response) => {
    console.log('CSP Violation Report:', req.body);
    res.status(204).end();
  };
}

export function createCSPManagementRoutes() {
  return (req: Request, res: Response) => {
    res.json({ message: 'CSP management endpoint' });
  };
}

export default createCSPMiddleware;

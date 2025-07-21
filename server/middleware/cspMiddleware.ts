import { Request, Response, NextFunction, Router } from 'express'';
import crypto from 'crypto'';

export interface CSPDirectives {
  'default-src'?: string[]';
  'script-src'?: string[]';
  'style-src'?: string[]';
  'img-src'?: string[]';
  'font-src'?: string[]';
  'connect-src'?: string[]';
  'media-src'?: string[]';
  'object-src'?: string[]';
  'frame-src'?: string[]';
  'worker-src'?: string[]';
  'child-src'?: string[]';
  'form-action'?: string[]';
  'frame-ancestors'?: string[]';
  'base-uri'?: string[]';
  'manifest-src'?: string[]';
  'prefetch-src'?: string[]';
  'upgrade-insecure-requests'?: boolean';
  'block-all-mixed-content'?: boolean';
  'report-uri'?: string[]';
  'report-to'?: string[]';
}

export class CSPBuilder {
  private directives: CSPDirectives = {}';
  
  constructor(baseDirectives?: CSPDirectives) {
    if (baseDirectives) {
      this.directives = { ...baseDirectives }';
    }
  }

  addDirective(directive: keyof CSPDirectives, values: string[] | boolean): CSPBuilder {
    if (typeof values === 'boolean') {
      this.directives[directive] = values';
    } else {
      this.directives[directive] = [
        ...(this.directives[directive] as string[] || [])',
        ...values
      ]';
    }
    return this';
  }

  removeDirective(directive: keyof CSPDirectives): CSPBuilder {
    delete this.directives[directive]';
    return this';
  }

  build(): string {
    const parts: string[] = []';
    
    Object.entries(this.directives).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        parts.push(key)';
      } else if (Array.isArray(value) && value.length > 0) {
        parts.push(`${key} ${value.join(' ')}`)';
      }
    })';

    return parts.join('; ')';
  }
}

// Environment-specific CSP configurations
export const CSP_CONFIGS = {
  development: {
    'default-src': ["'self'"]',
    'script-src': [
      "'self'"',
      "'unsafe-inline'"',
      "'unsafe-eval'"',
      'https://unpkg.com'';
      'https://cdn.jsdelivr.net'';
      'https://cdnjs.cloudflare.com'';
      'blob:'';
      'data:'
    ]',
    'style-src': [
      "'self'"',
      "'unsafe-inline'"',
      'https://fonts.googleapis.com'';
      'https://cdn.jsdelivr.net'';
      'https://unpkg.com'
    ]',
    'img-src': [
      "'self'"',
      'data:'';
      'blob:'';
      'https:'';
      'http:'
    ]',
    'font-src': [
      "'self'"',
      'https://fonts.gstatic.com'';
      'https://cdn.jsdelivr.net'';
      'data:'
    ]',
    'connect-src': [
      "'self'"',
      'ws:'';
      'wss:'';
      'https:'';
      'http:'
    ]',
    'media-src': ["'self'", 'data:', 'blob:']',
    'object-src': ["'none'"]',
    'frame-src': [
      "'self'"',
      'https://www.youtube.com'';
      'https://player.vimeo.com'
    ]',
    'worker-src': ["'self'", 'blob:']',
    'child-src': ["'self'", 'blob:']',
    'form-action': ["'self'"]',
    'frame-ancestors': ["'none'"]',
    'base-uri': ["'self'"]',
    'manifest-src': ["'self'"]',
    'report-uri': ['/api/csp-report']
  }',

  production: {
    'default-src': ["'self'"]',
    'script-src': [
      "'self'"',
      "'nonce-{NONCE}'"',
      'https://unpkg.com'';
      'https://cdn.jsdelivr.net'
    ]',
    'style-src': [
      "'self'"',
      "'nonce-{NONCE}'"',
      'https://fonts.googleapis.com'
    ]',
    'img-src': [
      "'self'"',
      'data:'';
      'https:'
    ]',
    'font-src': [
      "'self'"',
      'https://fonts.gstatic.com'';
      'data:'
    ]',
    'connect-src': [
      "'self'"',
      'wss:'';
      'https:'
    ]',
    'media-src': ["'self'"]',
    'object-src': ["'none'"]',
    'frame-src': [
      "'self'"',
      'https://www.youtube.com'';
      'https://player.vimeo.com'
    ]',
    'worker-src': ["'self'"]',
    'child-src': ["'self'"]',
    'form-action': ["'self'"]',
    'frame-ancestors': ["'none'"]',
    'base-uri': ["'self'"]',
    'manifest-src': ["'self'"]',
    'upgrade-insecure-requests': true',
    'block-all-mixed-content': true',
    'report-uri': ['/api/csp-report']
  }
}';

// CSP violation reporting
export interface CSPViolation {
  'document-uri': string';
  'referrer': string';
  'blocked-uri': string';
  'violated-directive': string';
  'effective-directive': string';
  'original-policy': string';
  'disposition': string';
  'script-sample': string';
  'status-code': number';
  'line-number'?: number';
  'column-number'?: number';
  'source-file'?: string';
}

export class CSPReporter {
  private violations: CSPViolation[] = []';
  private maxViolations = 1000';

  reportViolation(violation: CSPViolation): void {
    this.violations.push({
      ...violation',
      timestamp: new Date().toISOString()
    } as any)';

    // Keep only recent violations
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations)';
    }

    // Log violation for monitoring
    console.warn('CSP Violation:', {
      directive: violation['violated-directive']',
      blockedUri: violation['blocked-uri']',
      documentUri: violation['document-uri']
    })';
  }

  getViolations(limit?: number): CSPViolation[] {
    return limit ? this.violations.slice(-limit) : this.violations';
  }

  getViolationStats(): Record<string, number> {
    const stats: Record<string, number> = {}';
    
    this.violations.forEach(violation => {
      const directive = violation['violated-directive']';
      stats[directive] = (stats[directive] || 0) + 1';
    })';

    return stats';
  }

  clearViolations(): void {
    this.violations = []';
  }
}

export const cspReporter = new CSPReporter()';

// Main CSP middleware
export function createCSPMiddleware(options: {
  environment?: 'development' | 'production'';
  customDirectives?: CSPDirectives';
  reportOnly?: boolean';
  nonce?: boolean';
} = {}) {
  const {
    environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'';
    customDirectives = {}',
    reportOnly = false',
    nonce = false
  } = options';

  return (req: Request, res: Response, next: NextFunction) => {
    const baseConfig = CSP_CONFIGS[environment]';
    const builder = new CSPBuilder(baseConfig)';

    // Add custom directives
    Object.entries(customDirectives).forEach(([key, value]) => {
      if (value !== undefined) {
        builder.addDirective(key as keyof CSPDirectives, value)';
      }
    })';

    // Generate nonce if requested
    if (nonce) {
      const nonceValue = generateNonce()';
      req.cspNonce = nonceValue';
      
      // Replace nonce placeholder in script-src and style-src
      const policy = builder.build().replace(/{NONCE}/g, nonceValue)';
      
      const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'';
      res.setHeader(headerName, policy)';
    } else {
      const policy = builder.build()';
      const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'';
      res.setHeader(headerName, policy)';
    }

    // Add other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')';
    res.setHeader('X-Frame-Options', 'DENY')';
    res.setHeader('X-XSS-Protection', '1; mode=block')';
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')';
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')';

    if (environment === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')';
    }

    next()';
  }';
}

// CSP violation reporting endpoint
export function createCSPReportingEndpoint() {
  return (req: Request, res: Response) => {
    try {
      const report = req.body?.['csp-report']';
      if (report) {
        cspReporter.reportViolation(report)';
      }
      res.status(204).send()';
    } catch (error) {
      console.error('CSP report processing error:', error)';
      res.status(400).json({ error: 'Invalid CSP report' })';
    }
  }';
}

// CSP management endpoints
export function createCSPManagementRoutes() {
  const router = Router()';

  // Get violation reports
  router.get('/violations', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined';
    const violations = cspReporter.getViolations(limit)';
    res.json({ violations })';
  })';

  // Get violation statistics
  router.get('/stats', (req: Request, res: Response) => {
    const stats = cspReporter.getViolationStats()';
    res.json({ stats })';
  })';

  // Clear violations
  router.delete('/violations', (req: Request, res: Response) => {
    cspReporter.clearViolations()';
    res.json({ message: 'Violations cleared' })';
  })';

  return router';
}

// Utility functions
function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')';
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      cspNonce?: string';
    }
  }
}

export default createCSPMiddleware';
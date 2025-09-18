// Enhanced Multi-Tenant Validation Middleware
import { Request, Response, NextFunction } from 'express';
// Simple logger replacement
const logger = {
  warn: (message: string, meta?: any) => console.warn(message, meta || ''),
  error: (message: string, meta?: any) => console.error(message, meta || ''),
  debug: (message: string, meta?: any) => console.debug(message, meta || ''),
};

export interface TenantValidatedRequest extends Request {
  tenantId?: string;
  tenantValidated?: boolean;
}

// Assuming AuthenticatedRequest is defined elsewhere and includes a 'user' property
// For demonstration purposes, let's define a minimal interface:
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role?: string;
  };
}

/**
 * CRITICAL: Enhanced tenant validation middleware with cross-tenant protection
 * Prevents data leaks between tenants and validates tenant boundaries
 */
export function enhancedTenantValidator() {
  return async (req: TenantValidatedRequest, res: Response, next: NextFunction) => {
    try {
      // Skip tenant validation for auth routes
      if (req.path.startsWith('/auth/')) {
        console.log(`[TENANT-VALIDATOR] Skipping validation for auth route: ${req.path}`);
        return next();
      }

      const user = (req as any).user;

      if (!user || !user.tenantId) {
        
        return res.status(401).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      // CRITICAL: Validate tenant ID format to prevent injection
      const tenantIdRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantIdRegex.test(user.tenantId)) {
        logger.error('Invalid tenant ID format detected', {
          tenantId: user.tenantId,
          userId: user.id,
          path: req.path,
          method: req.method
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid tenant identifier'
        });
      }

      // CRITICAL: Check for cross-tenant access attempts in request parameters
      const requestParams = { ...req.params, ...req.query, ...req.body };
      for (const [key, value] of Object.entries(requestParams)) {
        if (key.toLowerCase().includes('tenant') && value !== user.tenantId) {
          logger.error('Cross-tenant access attempt detected', {
            requestedTenant: value,
            userTenant: user.tenantId,
            userId: user.id,
            path: req.path,
            method: req.method,
            parameter: key
          });
          return res.status(403).json({
            success: false,
            message: 'Cross-tenant access denied'
          });
        }
      }

      // CRITICAL: Validate tenant access for database operations
      if (req.body && typeof req.body === 'object') {
        // Ensure any tenantId in request body matches user's tenant
        if (req.body.tenantId && req.body.tenantId !== user.tenantId) {
          logger.error('Tenant ID mismatch in request body', {
            bodyTenantId: req.body.tenantId,
            userTenantId: user.tenantId,
            userId: user.id,
            path: req.path
          });
          return res.status(403).json({
            success: false,
            message: 'Tenant context mismatch'
          });
        }

        // Auto-inject tenant ID for create operations
        if (req.method === 'POST' && !req.body.tenantId) {
          req.body.tenantId = user.tenantId;
        }
      }

      // Set validated tenant context
      req.tenantId = user.tenantId;
      req.tenantValidated = true;

      logger.debug('Tenant validation successful', {
        tenantId: user.tenantId,
        userId: user.id,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Tenant validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });

      return res.status(500).json({
        success: false,
        message: 'Tenant validation failed'
      });
    }
  };
}

/**
 * Cross-tenant validation for admin operations
 * Only allows SaaS admins to access cross-tenant data
 */
export function crossTenantValidator() {
  return async (req: TenantValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Only SaaS admins can perform cross-tenant operations
      if (!user || user.role !== 'saas_admin') {
        logger.warn('Non-admin attempted cross-tenant operation', {
          userId: user?.id,
          userRole: user?.role,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Cross-tenant operations require SaaS admin privileges'
        });
      }

      req.tenantValidated = true;
      next();
    } catch (error) {
      logger.error('Cross-tenant validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });

      return res.status(500).json({
        success: false,
        message: 'Cross-tenant validation failed'
      });
    }
  };
}
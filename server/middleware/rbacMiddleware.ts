/**
 * RBAC (Role-Based Access Control) Middleware
 * Handles authorization and permission checks
 */

import { Request, Response, NextFunction } from 'express';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    permissions: string[];
    email?: string;
  };
}

export interface Permission {
  resource: string;
  action: string;
  condition?: (req: AuthenticatedRequest) => boolean;
}

export interface Role {
  name: string;
  permissions: Permission[];
}

// Default role definitions
export const ROLES: { [key: string]: Role } = {
  admin: {
    name: 'admin',
    permissions: ['
      { resource: '*', action: '*' }
    ]
  },
  manager: {
    name: 'manager',
    permissions: ['
      { resource: 'customers', action: 'read' },
      { resource: 'customers', action: 'create' },
      { resource: 'customers', action: 'update' },
      { resource: 'tickets', action: '*' },
      { resource: 'reports', action: 'read' }
    ]
  },
  agent: {
    name: 'agent',
    permissions: ['
      { resource: 'customers', action: 'read' },
      { resource: 'tickets', action: 'read' },
      { resource: 'tickets', action: 'update' },
      { resource: 'tickets', action: 'create' }
    ]
  },
  user: {
    name: 'user',
    permissions: ['
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
      { resource: 'tickets', action: 'read', condition: (req) => req.user?.id === req.params.userId }
    ]
  }
};

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: string, resource: string, action: string, req?: AuthenticatedRequest): boolean {
  const role = ROLES[userRole];
  if (!role) {
    logWarn('Unknown role', { role: userRole });
    return false;
  }

  return role.permissions.some(permission => {
    // Check wildcard permissions
    if (permission.resource === '*' || permission.action === '*') {
      return true;
    }

    // Check exact match
    if (permission.resource === resource && permission.action === action) {
      // Check condition if present
      if (permission.condition && req) {
        return permission.condition(req);
      }
      return true;
    }

    return false;
  });
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(resource: string, action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    if (!hasPermission(userRole, resource, action, req)) {
      logWarn('Access denied', {
        userId: req.user.id,
        role: userRole,
        resource,
        action,
        path: req.path
      });

      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: { resource, action }
      });
    }

    logInfo('Permission granted', {
      userId: req.user.id,
      role: userRole,
      resource,
      action,
      path: req.path
    });

    next();
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      logWarn('Admin access denied', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path
      });

      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  };
}

/**
 * Middleware to require manager or higher role
 */
export function requireManager() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const allowedRoles = ['admin', 'manager];
    if (!allowedRoles.includes(req.user.role)) {
      logWarn('Manager access denied', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path
      });

      return res.status(403).json({ message: 'Manager access or higher required' });
    }

    next();
  };
}

/**
 * Middleware to check tenant access
 */
export function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.tenantId) {
    logWarn('Tenant access denied - no tenant ID', {
      userId: req.user.id,
      path: req.path
    });

    return res.status(403).json({ message: 'Tenant access required' });
  }

  // Add tenant ID to request headers for downstream processing
  req.headers['x-tenant-id] = req.user.tenantId;

  next();
}

/**
 * Middleware to check resource ownership
 */
export function requireOwnership(resourceIdParam: string = 'id') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const resourceId = req.params[resourceIdParam];
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID required' });
    }

    // For now, assume ownership based on user ID match
    // In a real implementation, you'd check against the database
    if (req.user.id !== resourceId && req.user.role !== 'admin') {
      logWarn('Ownership access denied', {
        userId: req.user.id,
        resourceId,
        path: req.path
      });

      return res.status(403).json({ message: 'Resource access denied' });
    }

    next();
  };
}

/**
 * Get user permissions for debugging/API endpoints
 */
export function getUserPermissions(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const role = ROLES[req.user.role];
  if (!role) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  res.json({
    user: {
      id: req.user.id,
      role: req.user.role,
      tenantId: req.user.tenantId
    },
    permissions: role.permissions
  });
}

// Export types for use in other modules
export type { AuthenticatedRequest };
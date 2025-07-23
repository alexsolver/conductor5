// JWT Authentication Middleware - Clean Architecture
import { Request, Response, NextFunction } from 'express';
import { DependencyContainer } from '../application/services/DependencyContainer';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
    permissions: any[];
    attributes: Record<string, any>;
  };
  tenant?: any; // Add tenant property for compatibility
}

export const jwtAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const container = DependencyContainer.getInstance();
    const tokenService = container.tokenService;
    
    // Verify JWT token
    const payload = tokenService.verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Verify user exists and is active
    const userRepository = container.userRepository;
    const user = await userRepository.findById(payload.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Add user context to request - with permissions
    const { RBACService } = await import('./rbacMiddleware');
    const rbacInstance = RBACService.getInstance();
    const permissions = rbacInstance.getRolePermissions(user.role);
    
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      permissions: permissions,
      attributes: {}
    };

    // Debug: Uncomment for troubleshooting permission issues
    // console.log('🔑 JWT Debug - User authenticated with permissions:', {
    //   id: user.id,
    //   email: user.email, 
    //   role: user.role,
    //   tenantId: user.tenantId,
    //   permissionsCount: permissions.length
    // });

    next();
  } catch (error) {
    const { logError } = await import('../utils/logger');
    logError('JWT authentication failed', error, { 
      method: req.method, 
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalJwtAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user context
    }

    const token = authHeader.substring(7);
    const container = DependencyContainer.getInstance();
    const tokenService = container.tokenService;
    
    const payload = tokenService.verifyAccessToken(token);
    if (payload) {
      const userRepository = container.userRepository;
      const user = await userRepository.findById(payload.userId);
      
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId
        };
      }
    }

    next();
  } catch (error) {
    // Log but don't fail the request
    const { logWarn } = await import('../utils/logger');
    logWarn('Optional JWT authentication warning', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      method: req.method, 
      url: req.url 
    });
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Tenant access middleware
export const requireTenantAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admin users can access all tenants
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user has access to their tenant
  if (!req.user.tenantId) {
    return res.status(403).json({ message: 'No tenant access' });
  }

  next();
};
// JWT Authentication Middleware - Clean Architecture
import { Request, Response, NextFunction } from 'express';
import { DependencyContainer } from '../application/services/DependencyContainer';
import { tokenManager } from '../utils/tokenManager';

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
      console.error('No authorization header found');
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);

    if (!token || token === 'null' || token === 'undefined') {
      console.error('Invalid token format:', token);
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify JWT token using enhanced token manager
    const payload = tokenManager.verifyAccessToken(token);
    if (!payload) {
      console.log('Token verification failed - attempting refresh');
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        needsRefresh: true 
      });
    }

    // console.log('✅ Token verified successfully:', { 
    //   userId: payload.userId,
    //   email: payload.email,
    //   tenantId: payload.tenantId 
    // });

    // Verify user exists and is active
    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;
    const user = await userRepository.findById(payload.userId);

    if (!user || !user.active) {
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

    // Log successful authentication for parts-services endpoints
    if (req.path.includes('/parts-services')) {
      console.log(`[AUTH] Parts-Services access granted for tenant: ${req.user.tenantId}`);
    }

    // Debug: Token payload and user authentication (production mode disabled)
    // console.log('🔑 JWT Debug - User authenticated:', {
    //   tokenPayload: payload,
    //   userFromDB: {
    //     id: user.id,
    //     email: user.email, 
    //     role: user.role,
    //     tenantId: user.tenantId
    //   },
    //   requestTenantId: req.user?.tenantId,
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
    console.error(`[AUTH ERROR] Token verification failed:`, error);
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

      if (user && user.active) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          permissions: [],
          attributes: {}
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
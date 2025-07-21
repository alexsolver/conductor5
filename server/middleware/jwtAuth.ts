// JWT Authentication Middleware - Clean Architecture
import { Request, Response, NextFunction } from 'express';
import { DependencyContainer } from '../application/services/DependencyContainer';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
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

    // Add user context to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    };

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
    const { logError } = await import('../utils/logger');
    logError('Optional JWT authentication failed', error, { 
      method: req.method, 
      url: req.url
    });
    next(); // Continue without authentication
  }
};

// Admin role authorization middleware
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Manager role authorization middleware  
export const requireManager = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['admin', 'manager].includes(req.user.role)) {
    return res.status(403).json({ message: 'Manager access required' });
  }
  next();
};

// Tenant-based authorization middleware
export const requireTenantAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const tenantId = req.params.tenantId || req.query.tenantId;
  
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next(); // Admins have access to all tenants
  }
  
  if (req.user.tenantId !== tenantId) {
    return res.status(403).json({ message: 'Tenant access denied' });
  }
  
  next();
};
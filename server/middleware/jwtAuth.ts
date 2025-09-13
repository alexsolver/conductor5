// JWT Authentication Middleware - Clean Architecture
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'; // Import jwt for error types
import { DependencyContainer } from '../application/services/DependencyContainer';
import { tokenManager } from '../utils/tokenManager';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    roles: string[];
    permissions: any[];
    attributes: Record<string, any>;
  };
  tenant?: any; // Add tenant property for compatibility
}

export const jwtAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // ✅ CRITICAL FIX - Force API response headers per 1qa.md compliance
    if (req.path.includes('/api/')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-API-Route', 'authenticated');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    // Try to get token from cookie first (HTTP-only), then fallback to Authorization header
    const tokenFromCookie = req.cookies?.accessToken;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const token = tokenFromCookie || tokenFromHeader;
    
    console.log('🔍 [JWT-AUTH] Processing request:', {
      method: req.method,
      path: req.path,
      hasTokenCookie: !!tokenFromCookie,
      hasAuthHeader: !!authHeader,
      tokenSource: tokenFromCookie ? 'cookie' : (tokenFromHeader ? 'header' : 'none'),
      tokenStart: token?.substring(0, 20) || 'none',
      tokenLength: token?.length || 0
    });

    if (!token) {
      console.log('❌ [JWT-AUTH] No access token found in cookies or headers');

      // ✅ CRITICAL FIX - Ensure JSON response for API routes per 1qa.md compliance
      res.setHeader('Content-Type', 'application/json');
      res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'MISSING_TOKEN',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ✅ CRITICAL FIX: Validação básica de token
    if (!token || 
        token === 'null' || 
        token === 'undefined' || 
        token.trim() === '' ||
        token.length < 20) {
      
      console.log('❌ [JWT-AUTH] Invalid token format:', {
        hasToken: !!token,
        length: token?.length
      });
      
      // ✅ CRITICAL FIX - JSON response
      res.setHeader('Content-Type', 'application/json');
      res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify JWT structure
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('❌ [JWT-AUTH] Invalid JWT structure');
      res.setHeader('Content-Type', 'application/json');
      res.status(401).json({
        success: false,
        message: 'Invalid token structure',
        code: 'INVALID_TOKEN_STRUCTURE',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify JWT token using enhanced token manager
    const payload = tokenManager.verifyAccessToken(token);

    // Check if payload is valid before proceeding
    // The original code had a check for decoded, but it's more robust to check payload directly.
    // Also, ensuring it's an object and has userId.
    if (!payload || typeof payload !== 'object' || !payload.userId) {
      console.log('❌ [JWT-AUTH] Invalid token structure or missing userId');

      // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
      res.setHeader('Content-Type', 'application/json');
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // console.log('✅ Token verified successfully:', {
    //   userId: payload.userId,
    //   email: payload.email,
    //   tenantId: payload.tenantId
    // });

    // Verify user exists and is active
    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;

    // ✅ CRITICAL FIX - Handle different payload structures per 1qa.md compliance
    const userId = payload.userId || payload.sub || payload.id;
    if (!userId) {
      console.error('❌ [JWT-AUTH] No userId found in token payload:', payload);
      // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
      res.setHeader('Content-Type', 'application/json');
      res.status(401).json({
        success: false,
        message: 'Invalid token payload',
        needsRefresh: true,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const user = await userRepository.findById(userId);

    if (!user || !user.isActive) {
      // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
      res.setHeader('Content-Type', 'application/json');
      res.status(401).json({ 
        success: false,
        message: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add user context to request - with permissions and enhanced tenant validation
    const { RBACService } = await import('./rbacMiddleware');
    const rbacInstance = RBACService.getInstance();
    const permissions = rbacInstance.getRolePermissions(user.role);

    // Enhanced tenant validation for customers module
    if (!user.tenantId && req.path.includes('/customers')) {
      // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
      res.setHeader('Content-Type', 'application/json');
      res.status(403).json({
        success: false,
        message: 'Tenant access required for customer operations',
        code: 'MISSING_TENANT_ACCESS',
        timestamp: new Date().toISOString()
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || '',
      roles: [user.role],
      permissions: permissions || [],
      attributes: {}
    };

    // Log successful authentication for materials-services endpoints per 1qa.md compliance
    if (req.path.includes('/materials-services')) {
      console.log(`✅ [AUTH] Materials-Services access granted for user: ${req.user?.id}, tenant: ${req.user?.tenantId}`);
    }

    // Log successful authentication for parts-services endpoints (legacy)
    if (req.path.includes('/parts-services')) {
      console.log(`✅ [AUTH] Parts-Services access granted for tenant: ${req.user?.tenantId}`);
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
    console.error('❌ [JWT-AUTH] Authentication error:', error);
    console.error('❌ [JWT-AUTH] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack?.substring(0, 200)
    });

    // ✅ CRITICAL FIX - Ensure JSON response even in error cases per 1qa.md
    res.setHeader('Content-Type', 'application/json');

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
        needsRefresh: true, // ✅ 1QA.MD: Indicar que precisa fazer refresh
        timestamp: new Date().toISOString()
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
        needsRefresh: true, // ✅ 1QA.MD: Indicar que precisa fazer refresh
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Authentication error',
        code: 'AUTH_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalJwtAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Try to get token from cookie first, then fallback to header
    const tokenFromCookie = req.cookies?.accessToken;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return next(); // Continue without user context
    }
    const container = DependencyContainer.getInstance();
    // Ensure tokenService is correctly typed or handled if missing
    const tokenService = container.tokenService; 

    // Use tokenManager which is already imported and used in jwtAuth
    const payload = tokenManager.verifyAccessToken(token); 

    if (payload && typeof payload === 'object' && payload.userId) {
      const userRepository = container.userRepository;
      const user = await userRepository.findById(payload.userId);

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId || '',
          roles: [user.role],
          permissions: [], // Permissions might need to be fetched here as well if required by optional auth
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
      // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ message: 'Authentication required', timestamp: new Date().toISOString() });
    }

    if (!roles.includes(req.user.role)) {
      // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ message: 'Insufficient permissions', timestamp: new Date().toISOString() });
    }

    next();
  };
};

// Tenant access middleware
export const requireTenantAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ message: 'Authentication required', timestamp: new Date().toISOString() });
  }

  // Admin users can access all tenants
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user has access to their tenant
  if (!req.user.tenantId) {
    // ✅ CRITICAL FIX - Ensure JSON response per 1qa.md compliance
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ message: 'No tenant access', timestamp: new Date().toISOString() });
  }

  next();
};
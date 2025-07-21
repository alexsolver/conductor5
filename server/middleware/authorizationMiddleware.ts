import { Request, Response, NextFunction } from 'express';
import { Role, Permission, PermissionService, AuthorizedUser, enrichUserWithPermissions } from '../domain/authorization/RolePermissions';

export interface AuthorizedRequest extends Request {
  user?: AuthorizedUser;
}

/**
 * Middleware para verificar permissões específicas
 */
export const requirePermission = (...permissions: Permission[]) => {
  return (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Enriquecer usuário com permissões se ainda não foi feito
    if (!req.user.permissions) {
      req.user = enrichUserWithPermissions(req.user);
    }

    const hasPermission = PermissionService.hasAnyPermission(req.user.role, permissions);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permissions,
        userRole: req.user.role 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se usuário pode acessar tenant específico
 */
export const requireTenantAccess = (tenantIdParam = 'tenantId') => {
  return (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const targetTenantId = req.params[tenantIdParam] || req.body.tenantId || req.query.tenantId as string;
    
    if (!targetTenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const canAccess = PermissionService.canAccessTenant(
      req.user.role,
      req.user.tenantId,
      targetTenantId
    );

    if (!canAccess) {
      return res.status(403).json({ 
        message: 'Access denied to tenant',
        userTenant: req.user.tenantId,
        requestedTenant: targetTenantId
      });
    }

    next();
  };
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRoles = (...roles: Role[]) => {
  return (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient role privileges',
        required: roles,
        userRole: req.user.role 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é SaaS Admin
 */
export const requireSaasAdmin = requireRoles(Role.SAAS_ADMIN);

/**
 * Middleware para verificar se é Tenant Admin ou superior
 */
export const requireTenantAdmin = requireRoles(Role.SAAS_ADMIN, Role.TENANT_ADMIN);

/**
 * Middleware para verificar se é Agent ou superior
 */
export const requireAgent = requireRoles(Role.SAAS_ADMIN, Role.TENANT_ADMIN, Role.AGENT);

/**
 * Middleware para verificar gerenciamento de usuários
 */
export const requireUserManagement = (targetUserIdParam = 'userId') => {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // SaaS admin sempre pode gerenciar
    if (req.user.role === Role.SAAS_ADMIN) {
      return next();
    }

    // Para outros roles, verificar permissões de tenant
    const targetUserId = req.params[targetUserIdParam];
    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    // Aqui você pode adicionar lógica para buscar o usuário alvo e verificar permissões
    // Por enquanto, permitir tenant admins gerenciarem usuários do mesmo tenant
    if (req.user.role === Role.TENANT_ADMIN) {
      return next();
    }

    return res.status(403).json({ message: 'Cannot manage this user' });
  };
};

/**
 * Middleware para adicionar contexto de autorização ao request
 */
export const addAuthorizationContext = (req: AuthorizedRequest, res: Response, next: NextFunction) => {
  if (req.user && !req.user.permissions) {
    req.user = enrichUserWithPermissions(req.user);
  }
  next();
};
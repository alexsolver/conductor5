import { Request, Response, NextFunction } from 'express';
import { CrossTenantValidator } from '../database/CrossTenantValidator';
import { logWarn } from '../utils/logger';

// ===========================
// TENANT VALIDATION MIDDLEWARE
// Fixes: Missing cross-tenant security validation
// ===========================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

// ===========================
// STRICT TENANT ISOLATION MIDDLEWARE
// ===========================
export const validateTenantAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validation = await CrossTenantValidator.validateTenantRequest(req);

    if (!validation.valid) {
      logWarn('Tenant access denied', {
        userId: req.user?.id,
        userTenantId: req.user?.tenantId,
        requestedPath: req.originalUrl,
        error: validation.error
      });

      res.status(403).json({
        success: false,
        message: 'Acesso negado: Isolamento de tenant',
        error: validation.error
      });
      return;
    }

    next();
  } catch (error) {
    logWarn('Error in tenant validation middleware', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno de validação'
    });
  }
};

// ===========================
// RESOURCE OWNERSHIP VALIDATION
// ===========================
export const validateResourceOwnership = (resourceType: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resourceId = req.params.id || req.params.resourceId;
      const tenantId = req.user?.tenantId;

      if (!resourceId || !tenantId) {
        res.status(400).json({
          success: false,
          message: 'ID do recurso e tenant são obrigatórios'
        });
        return;
      }

      const isOwner = await CrossTenantValidator.validateResourceOwnership(
        tenantId,
        resourceType,
        resourceId
      );

      if (!isOwner) {
        logWarn('Resource ownership validation failed', {
          userId: req.user?.id,
          tenantId,
          resourceType,
          resourceId,
          path: req.originalUrl
        });

        res.status(404).json({
          success: false,
          message: 'Recurso não encontrado ou acesso negado'
        });
        return;
      }

      next();
    } catch (error) {
      logWarn('Error in resource ownership validation', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno de validação'
      });
    }
  };
};

// ===========================
// SAAS ADMIN BYPASS
// ===========================
export const allowSaasAdminBypass = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // SaaS admins can bypass tenant restrictions
  if (req.user?.role === 'saas_admin') {
    next();
    return;
  }

  // Continue with normal validation
  validateTenantAccess(req, res, next);
};
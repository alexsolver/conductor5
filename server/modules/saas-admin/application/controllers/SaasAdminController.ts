/**
 * SaaS Admin Controller
 * Clean Architecture - Application Layer
 * 
 * @module SaasAdminController
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { GetSystemOverviewUseCase } from '../use-cases/GetSystemOverviewUseCase';
import { GetAllTenantsUseCase } from '../use-cases/GetAllTenantsUseCase';
import { ManageTenantUseCase } from '../use-cases/ManageTenantUseCase';

export class SaasAdminController {
  constructor(
    private getSystemOverviewUseCase: GetSystemOverviewUseCase,
    private getAllTenantsUseCase: GetAllTenantsUseCase,
    private manageTenantUseCase: ManageTenantUseCase
  ) {}

  /**
   * Get system overview
   * GET /saas-admin/overview
   */
  getSystemOverview = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const adminRole = req.user?.role;

      if (!adminId || !adminRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getSystemOverviewUseCase.execute({
        adminId,
        adminRole
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'System overview retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[SaasAdminController] getSystemOverview error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get all tenants
   * GET /saas-admin/tenants
   */
  getAllTenants = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const adminRole = req.user?.role;

      if (!adminId || !adminRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const filters = {
        status: req.query.status as string,
        plan: req.query.plan as string,
        healthStatus: req.query.healthStatus as string,
        search: req.query.search as string
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const result = await this.getAllTenantsUseCase.execute({
        adminId,
        adminRole,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Tenants retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[SaasAdminController] getAllTenants error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get tenant by ID
   * GET /saas-admin/tenants/:id
   */
  getTenantById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const adminRole = req.user?.role;
      const tenantId = req.params.id;

      if (!adminId || !adminRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Use the same use case but filter by specific tenant
      const result = await this.getAllTenantsUseCase.execute({
        adminId,
        adminRole,
        filters: { search: tenantId } // This would be enhanced to search by ID specifically
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          errors: result.errors
        });
      }

      const tenant = result.data?.find(t => t.tenantId === tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      return res.json({
        success: true,
        message: 'Tenant retrieved successfully',
        data: tenant
      });

    } catch (error) {
      console.error('[SaasAdminController] getTenantById error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update tenant
   * PUT /saas-admin/tenants/:id
   */
  updateTenant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const adminEmail = req.user?.email;
      const adminRole = req.user?.role;
      const tenantId = req.params.id;

      if (!adminId || !adminRole || !adminEmail) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.manageTenantUseCase.execute({
        adminId,
        adminEmail,
        adminRole,
        tenantId,
        action: 'update',
        updates: req.body,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      if (!result.success) {
        return res.status(result.errors?.includes('Access denied') ? 403 : 400).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('[SaasAdminController] updateTenant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Suspend tenant
   * POST /saas-admin/tenants/:id/suspend
   */
  suspendTenant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const adminEmail = req.user?.email;
      const adminRole = req.user?.role;
      const tenantId = req.params.id;
      const { reason } = req.body;

      if (!adminId || !adminRole || !adminEmail) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.manageTenantUseCase.execute({
        adminId,
        adminEmail,
        adminRole,
        tenantId,
        action: 'suspend',
        reason,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      if (!result.success) {
        return res.status(result.errors?.includes('Access denied') ? 403 : 400).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('[SaasAdminController] suspendTenant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Activate tenant
   * POST /saas-admin/tenants/:id/activate
   */
  activateTenant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const adminEmail = req.user?.email;
      const adminRole = req.user?.role;
      const tenantId = req.params.id;

      if (!adminId || !adminRole || !adminEmail) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.manageTenantUseCase.execute({
        adminId,
        adminEmail,
        adminRole,
        tenantId,
        action: 'activate',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      if (!result.success) {
        return res.status(result.errors?.includes('Access denied') ? 403 : 400).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('[SaasAdminController] activateTenant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Delete tenant
   * DELETE /saas-admin/tenants/:id
   */
  deleteTenant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const adminEmail = req.user?.email;
      const adminRole = req.user?.role;
      const tenantId = req.params.id;
      const { reason } = req.body;

      if (!adminId || !adminRole || !adminEmail) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.manageTenantUseCase.execute({
        adminId,
        adminEmail,
        adminRole,
        tenantId,
        action: 'delete',
        reason,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      if (!result.success) {
        return res.status(result.errors?.includes('Access denied') ? 403 : 400).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('[SaasAdminController] deleteTenant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
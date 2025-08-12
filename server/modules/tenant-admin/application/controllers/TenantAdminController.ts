/**
 * Tenant Admin Controller
 * Clean Architecture - Application Layer
 * 
 * @module TenantAdminController
 * @created 2025-08-12 - Phase 22 Clean Architecture Implementation
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { GetTenantAdminUseCase } from '../use-cases/GetTenantAdminUseCase';
import { UpdateTenantConfigurationUseCase } from '../use-cases/UpdateTenantConfigurationUseCase';

export class TenantAdminController {
  constructor(
    private getTenantAdminUseCase: GetTenantAdminUseCase,
    private updateTenantConfigurationUseCase: UpdateTenantConfigurationUseCase
  ) {}

  /**
   * Get tenant admin information
   * GET /tenant-admin/:tenantId
   * GET /tenant-admin/user/:userId
   * GET /tenant-admin
   */
  getTenantAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;
      const adminUserId = req.params.userId;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTenantAdminUseCase.execute({
        tenantId,
        adminUserId,
        userRole,
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeHealth: req.query.includeHealth === 'true',
        includeUsage: req.query.includeUsage === 'true',
        includeBilling: req.query.includeBilling === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Tenant admin not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Tenant admin information retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TenantAdminController] getTenantAdmin error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get current user's tenant admin information
   * GET /tenant-admin/me
   */
  getMyTenantAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTenantAdminUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole,
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeHealth: req.query.includeHealth === 'true',
        includeUsage: req.query.includeUsage === 'true',
        includeBilling: req.query.includeBilling === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Tenant admin information not found',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Your tenant admin information retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TenantAdminController] getMyTenantAdmin error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update tenant configuration
   * PUT /tenant-admin/:tenantId/configuration
   */
  updateConfiguration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.updateTenantConfigurationUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole,
        configuration: req.body.configuration,
        createBackup: req.body.createBackup !== false,
        validateOnly: req.body.validateOnly === true
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Configuration update failed',
          errors: result.errors,
          warnings: result.warnings
        });
      }

      const statusCode = req.body.validateOnly ? 200 : 200;
      const message = req.body.validateOnly 
        ? 'Configuration validation completed'
        : 'Configuration updated successfully';

      return res.status(statusCode).json({
        success: true,
        message,
        data: result.data,
        warnings: result.warnings
      });

    } catch (error) {
      console.error('[TenantAdminController] updateConfiguration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get tenant configuration only
   * GET /tenant-admin/:tenantId/configuration
   */
  getConfiguration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTenantAdminUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Tenant configuration not found',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Tenant configuration retrieved successfully',
        data: {
          configuration: result.data?.tenantAdmin?.configuration
        }
      });

    } catch (error) {
      console.error('[TenantAdminController] getConfiguration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get tenant analytics
   * GET /tenant-admin/:tenantId/analytics
   */
  getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTenantAdminUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole,
        includeAnalytics: true,
        includeRecommendations: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Tenant analytics not found',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Tenant analytics retrieved successfully',
        data: {
          analytics: result.data?.analytics,
          recommendations: result.data?.recommendations
        }
      });

    } catch (error) {
      console.error('[TenantAdminController] getAnalytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get tenant health status
   * GET /tenant-admin/:tenantId/health
   */
  getHealth = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTenantAdminUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole,
        includeHealth: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Tenant health information not found',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Tenant health status retrieved successfully',
        data: result.data?.health
      });

    } catch (error) {
      console.error('[TenantAdminController] getHealth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get tenant usage information
   * GET /tenant-admin/:tenantId/usage
   */
  getUsage = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTenantAdminUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole,
        includeUsage: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Tenant usage information not found',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Tenant usage information retrieved successfully',
        data: result.data?.usage
      });

    } catch (error) {
      console.error('[TenantAdminController] getUsage error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get tenant billing information
   * GET /tenant-admin/:tenantId/billing
   */
  getBilling = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTenantAdminUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole,
        includeBilling: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Tenant billing information not found',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Tenant billing information retrieved successfully',
        data: result.data?.billing
      });

    } catch (error) {
      console.error('[TenantAdminController] getBilling error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Validate configuration without saving
   * POST /tenant-admin/:tenantId/configuration/validate
   */
  validateConfiguration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const tenantId = req.params.tenantId || req.user?.tenantId;

      if (!userId || !userRole || !tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.updateTenantConfigurationUseCase.execute({
        tenantId,
        adminUserId: userId,
        userRole,
        configuration: req.body.configuration,
        validateOnly: true
      });

      return res.json({
        success: result.success,
        message: result.success 
          ? 'Configuration validation completed'
          : 'Configuration validation failed',
        data: result.data,
        errors: result.errors,
        warnings: result.warnings
      });

    } catch (error) {
      console.error('[TenantAdminController] validateConfiguration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get available tenant features
   * GET /tenant-admin/features
   */
  getAvailableFeatures = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Mock feature list - in real implementation, this would come from a service
      const features = {
        modules: [
          { name: 'tickets', label: 'Ticket Management', description: 'Comprehensive ticket tracking and management' },
          { name: 'customers', label: 'Customer Management', description: 'Customer database and relationship management' },
          { name: 'companies', label: 'Company Management', description: 'Enterprise and company account management' },
          { name: 'locations', label: 'Location Management', description: 'Multi-location support and coordination' },
          { name: 'teams', label: 'Team Management', description: 'Team organization and collaboration tools' },
          { name: 'inventory', label: 'Inventory Management', description: 'Stock and asset tracking' },
          { name: 'timecard', label: 'Time Tracking', description: 'Employee time tracking and attendance' },
          { name: 'notifications', label: 'Notifications', description: 'Multi-channel notification system' },
          { name: 'dashboard', label: 'Dashboard & Analytics', description: 'Real-time insights and reporting' },
          { name: 'customFields', label: 'Custom Fields', description: 'Flexible data capture and customization' },
          { name: 'templates', label: 'Templates', description: 'Template management and automation' },
          { name: 'api', label: 'API Access', description: 'REST API for integrations' },
          { name: 'webhooks', label: 'Webhooks', description: 'Real-time event notifications' },
          { name: 'integrations', label: 'Integrations', description: 'Third-party service integrations' }
        ],
        plans: [
          { id: 'free', name: 'Free', description: 'Basic features for small teams' },
          { id: 'starter', name: 'Starter', description: 'Essential features for growing businesses' },
          { id: 'professional', name: 'Professional', description: 'Advanced features for established companies' },
          { id: 'enterprise', name: 'Enterprise', description: 'Full feature set with premium support' },
          { id: 'custom', name: 'Custom', description: 'Tailored solution for specific needs' }
        ],
        addons: [
          { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Enhanced reporting and insights' },
          { id: 'priority_support', name: 'Priority Support', description: '24/7 premium support' },
          { id: 'custom_branding', name: 'Custom Branding', description: 'White-label customization' },
          { id: 'api_extension', name: 'Extended API', description: 'Higher API rate limits' },
          { id: 'advanced_security', name: 'Advanced Security', description: 'Enhanced security features' }
        ]
      };

      return res.json({
        success: true,
        message: 'Available features retrieved successfully',
        data: features
      });

    } catch (error) {
      console.error('[TenantAdminController] getAvailableFeatures error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
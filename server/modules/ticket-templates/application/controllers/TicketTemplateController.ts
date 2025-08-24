/**
 * Ticket Template Controller
 * Clean Architecture - Application Layer
 * 
 * @module TicketTemplateController
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { CreateTicketTemplateUseCase } from '../use-cases/CreateTicketTemplateUseCase';
import { GetTicketTemplatesUseCase } from '../use-cases/GetTicketTemplatesUseCase';
import { UpdateTicketTemplateUseCase } from '../use-cases/UpdateTicketTemplateUseCase';

// ✅ 1QA.MD: Interface definida inline por simplicidade
interface GetTicketTemplatesRequest {
  tenantId: string;
  userRole: string;
  companyId?: string;
  templateId?: string;
  filters?: {
    category?: string;
    subcategory?: string;
    templateType?: string;
    status?: string;
    departmentId?: string;
    isDefault?: boolean;
    tags?: string[];
  };
  search?: string;
  includeAnalytics?: boolean;
  includeUsageStats?: boolean;
}

export class TicketTemplateController {
  constructor(
    private createTicketTemplateUseCase: CreateTicketTemplateUseCase,
    private getTicketTemplatesUseCase: GetTicketTemplatesUseCase,
    private updateTicketTemplateUseCase: UpdateTicketTemplateUseCase
  ) {}

  /**
   * Create ticket template
   * POST /ticket-templates
   */
  createTemplate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🎯 [TEMPLATE-CONTROLLER] Creating template:', req.body);
      console.log('🎯 [TEMPLATE-CONTROLLER] Request params:', req.params);
      console.log('🎯 [TEMPLATE-CONTROLLER] User info:', (req as any).user);

      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User or tenantId missing']
        });
      }

      const templateData = {
        ...req.body,
        companyId: req.params.companyId || req.body.companyId || null,
        tenantId: user.tenantId,
        createdBy: user.id,
        isActive: req.body.isActive !== false, // Default to true
        usageCount: 0,
        fields: req.body.fields || [],
        createdAt: new Date().toISOString(),
      };

      console.log('📝 [TEMPLATE-CONTROLLER] Template data prepared:', templateData);

      const result = await this.createTicketTemplateUseCase.execute(templateData);

      console.log('✅ [TEMPLATE-CONTROLLER] Use case result:', result);

      // ✅ 1QA.MD: Handle both success and error cases from use case
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create template',
          errors: result.errors || ['Unknown validation error']
        });
      }

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ [TEMPLATE-CONTROLLER] Create template error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  };

  /**
   * Get all templates or specific template
   * GET /ticket-templates
   * GET /ticket-templates/:id
   */
  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🚨 [TEMPLATE-CONTROLLER] === STARTING EXECUTION ===');
      console.log('🎯 [TEMPLATE-CONTROLLER] GET /api/ticket-templates called');
      console.log('🎯 [TEMPLATE-CONTROLLER] Query params:', req.query);
      console.log('🎯 [TEMPLATE-CONTROLLER] Headers:', req.headers.authorization ? 'HAS_AUTH' : 'NO_AUTH');

      const user = (req as any).user;
      if (!user || !user.tenantId) {
        console.log('❌ [CONTROLLER] User or tenantId missing');
        res.status(401).json({ 
          success: false, 
          errors: ['Authentication required'] 
        });
        return;
      }

      // ✅ 1QA.MD: Build comprehensive request
      const getTemplatesRequest: GetTicketTemplatesRequest = {
        tenantId: user.tenantId,
        userRole: user.role || 'user',
        companyId: req.query.companyId as string,
        templateId: req.query.templateId as string,
        filters: {
          category: req.query.category as string,
          subcategory: req.query.subcategory as string,
          templateType: req.query.templateType as string,
          status: req.query.status as string || 'active',
          departmentId: req.query.departmentId as string,
          isDefault: req.query.isDefault ? req.query.isDefault === 'true' : undefined,
          tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        },
        search: req.query.search as string,
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeUsageStats: req.query.includeUsageStats === 'true'
      };

      console.log('📋 [CONTROLLER] Request prepared:', {
        tenantId: getTemplatesRequest.tenantId,
        userRole: getTemplatesRequest.userRole,
        companyId: getTemplatesRequest.companyId,
        hasFilters: !!getTemplatesRequest.filters
      });

      // Execute use case
      const result = await this.getTicketTemplatesUseCase.execute(getTemplatesRequest);

      console.log('📤 [CONTROLLER] Use case result:', {
        success: result.success,
        hasData: !!result.data,
        templatesCount: result.data?.templates?.length || 0,
        hasErrors: !!result.errors
      });

      if (!result.success) {
        console.log('❌ [CONTROLLER] Use case failed:', result.errors);
        res.status(400).json({
          success: false,
          errors: result.errors || ['Failed to fetch templates']
        });
        return;
      }

      // ✅ 1QA.MD: Always ensure templates array exists
      const responseData = {
        ...result.data,
        templates: result.data?.templates || []
      };

      console.log('🚀 [CONTROLLER] Sending final response:', {
        success: true,
        templatesCount: responseData.templates.length,
        hasAnalytics: !!responseData.analytics,
        hasUsageStats: !!responseData.usageStatistics
      });

      // ✅ 1QA.MD: Consistent response structure
      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('❌ [CONTROLLER] Uncaught error:', error);
      res.status(500).json({
        success: false,
        errors: [error instanceof Error ? error.message : 'Internal server error']
      });
    }
  }

  /**
   * Update ticket template
   * PUT /ticket-templates/:id
   */
  updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const templateId = req.params.id;

      if (!tenantId || !userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.updateTicketTemplateUseCase.execute({
        tenantId,
        templateId,
        updates: req.body,
        updatedBy: userId,
        userRole,
        versionInfo: req.body.versionInfo
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Update failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Template updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TicketTemplateController] updateTemplate error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get template categories
   * GET /ticket-templates/categories
   */
  getCategories = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🚨 [CATEGORIES-CONTROLLER] === STARTING CATEGORIES EXECUTION ===');
      console.log('🎯 [CATEGORIES-CONTROLLER] User:', req.user);
      
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        includeAnalytics: true
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get categories',
          errors: result.errors
        });
      }

      // Extract unique categories from templates
      const categories = result.data?.templates 
        ? Array.from(new Set(result.data.templates.map(t => t.category)))
        : [];

      const subcategories = result.data?.templates
        ? result.data.templates.reduce((acc, template) => {
            if (template.subcategory) {
              if (!acc[template.category]) acc[template.category] = [];
              if (!acc[template.category].includes(template.subcategory)) {
                acc[template.category].push(template.subcategory);
              }
            }
            return acc;
          }, {} as Record<string, string[]>)
        : {};

      return res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories,
          subcategories,
          categoryStats: result.data?.analytics?.templatesByCategory || {}
        }
      });

    } catch (error) {
      console.error('[TicketTemplateController] getCategories error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get templates by category
   * GET /ticket-templates/category/:category
   */
  getTemplatesByCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const category = req.params.category;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        filters: {
          category,
          subcategory: req.query.subcategory as string
        }
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Category not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Templates by category retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TicketTemplateController] getTemplatesByCategory error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get default templates
   * GET /ticket-templates/defaults
   */
  getDefaultTemplates = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        filters: {
          status: 'active'
        }
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get default templates',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Default templates retrieved successfully',
        data: {
          templates: result.data?.templates || []
        }
      });

    } catch (error) {
      console.error('[TicketTemplateController] getDefaultTemplates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get template analytics
   * GET /ticket-templates/:id/analytics
   */
  getTemplateAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const templateId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        templateId,
        userRole,
        includeAnalytics: true,
        includeUsageStats: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Template analytics retrieved successfully',
        data: {
          analytics: result.data?.analytics,
          usageStatistics: result.data?.usageStatistics,
          fieldAnalytics: result.data?.fieldAnalytics
        }
      });

    } catch (error) {
      console.error('[TicketTemplateController] getTemplateAnalytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get popular templates
   * GET /ticket-templates/popular
   */
  getPopularTemplates = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        includeUsageStats: true
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get popular templates',
          errors: result.errors
        });
      }

      const popularTemplates = result.data?.usageStatistics?.popularTemplates?.slice(0, limit) || [];

      return res.json({
        success: true,
        message: 'Popular templates retrieved successfully',
        data: {
          templates: popularTemplates
        }
      });

    } catch (error) {
      console.error('[TicketTemplateController] getPopularTemplates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get company template statistics
   * GET /ticket-templates/company/:companyId/stats
   */
  getCompanyTemplateStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🚨 [STATS-CONTROLLER] === STARTING STATS EXECUTION ===');
      console.log('🎯 [STATS-CONTROLLER] CompanyId:', req.params.companyId);
      console.log('🎯 [STATS-CONTROLLER] User:', req.user);
      
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const companyId = req.params.companyId;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        companyId: companyId !== 'all' ? companyId : undefined,
        includeAnalytics: true,
        includeUsageStats: true
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get company template statistics',
          errors: result.errors
        });
      }

      const stats = {
        total_templates: result.data?.templates?.length || 0,
        active_templates: result.data?.templates?.filter(t => t.status === 'active').length || 0,
        avg_usage: result.data?.analytics?.averageUsage || 0,
        max_usage: result.data?.analytics?.maxUsage || 0,
        templates_by_category: result.data?.analytics?.templatesByCategory || {}
      };

      return res.json({
        success: true,
        message: 'Company template statistics retrieved successfully',
        data: [stats]
      });

    } catch (error) {
      console.error('[TicketTemplateController] getCompanyTemplateStats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  async getTemplateStatsByCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [TEMPLATE-CONTROLLER] Getting stats for company:', req.params.companyId);

      const { companyId } = req.params;
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        companyId: companyId === 'all' ? undefined : companyId,
        includeAnalytics: true
      });

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: 'Failed to get template statistics',
          errors: result.errors
        });
        return;
      }

      console.log('✅ [TEMPLATE-CONTROLLER] Stats retrieved for company:', result.data?.templates?.length || 0);

      res.json({
        success: true,
        message: 'Template statistics retrieved successfully',
        data: {
          analytics: result.data?.analytics || {},
          templates: result.data?.templates || [],
          totalCount: result.data?.templates?.length || 0,
          companyId: companyId === 'all' ? null : companyId
        }
      });
    } catch (error) {
      console.error('❌ [GET-TEMPLATE-STATS-BY-COMPANY-CONTROLLER]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get template statistics',
        code: 'GET_TEMPLATE_STATS_ERROR'
      });
    }
  }

  /**
   * ✅ 1QA.MD: Get templates by company (Clean Architecture compliance)
   * GET /ticket-templates/company/:companyId
   */
  getTemplatesByCompany = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔍 [TEMPLATE-CONTROLLER] Getting templates for company:', req.params.companyId);

      const companyId = req.params.companyId;
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        companyId: companyId === 'all' ? undefined : companyId,
        includeAnalytics: false
      });

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: 'Failed to get templates',
          errors: result.errors
        });
        return;
      }

      console.log('✅ [TEMPLATE-CONTROLLER] Templates retrieved for company:', result.data?.templates?.length || 0);

      res.json({
        success: true,
        message: 'Templates retrieved successfully',
        data: {
          templates: result.data?.templates || []
        }
      });
    } catch (error) {
      console.error('❌ [TEMPLATE-CONTROLLER] getTemplatesByCompany error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve templates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
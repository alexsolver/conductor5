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
          errors: ['User or tenantId missing'],
          code: 'MISSING_TENANT_ID'
        });
      }

      // DB & schema
      const { schemaManager } = await import('../../../../db');
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(user.tenantId);

      // Extract body
      const {
        name,
        category,
        priority,
        templateType,
        fields,
        description,
        subcategory,
        companyId,
        departmentId,
        automation,
        workflow,
        tags,
        isDefault,
        permissions,
        userRole // opcional no body; fallback para role do token
      } = req.body;

      // Required validations
      if (!name || !category || !priority || !templateType || fields == null) {
        console.error('[CREATE-TEMPLATE] Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['name, category, priority, templateType e fields são obrigatórios'],
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      const PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
      if (!PRIORITIES.has(String(priority))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority',
          errors: ['priority deve ser: low | medium | high | urgent'],
          code: 'INVALID_PRIORITY'
        });
      }

      const TEMPLATE_TYPES = new Set(['standard', 'quick', 'escalation', 'auto_response', 'workflow']);
      if (!TEMPLATE_TYPES.has(String(templateType))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid templateType',
          errors: ['templateType deve ser: standard | quick | escalation | auto_response | workflow'],
          code: 'INVALID_TEMPLATE_TYPE'
        });
      }

      // Check table exists
      const tableCheck = await pool.query(
        `
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = 'ticket_templates'
        `,
        [schemaName]
      );
      if (tableCheck.rows.length === 0) {
        console.error('[CREATE-TEMPLATE] ticket_templates table does not exist in schema:', schemaName);
        return res.status(500).json({
          success: false,
          message: 'ticket_templates table not found in tenant schema',
          errors: ['TABLE_NOT_FOUND'],
          code: 'TABLE_NOT_FOUND'
        });
      }

      // Normalize optional values
      const finalTags = Array.isArray(tags) ? tags.map((t: any) => String(t)) : null;

      // Prepare JSONB fields (use ::jsonb no SQL)
      const jsonFields       = typeof fields === 'string' ? fields : JSON.stringify(fields ?? []);
      const jsonAutomation   = automation == null ? null : (typeof automation === 'string' ? automation : JSON.stringify(automation));
      const jsonWorkflow     = workflow   == null ? null : (typeof workflow   === 'string' ? workflow   : JSON.stringify(workflow));
      const jsonPermissions  = permissions== null ? null : (typeof permissions=== 'string' ? permissions: JSON.stringify(permissions));

      const createdBy = user.id;
      const finalUserRole = userRole || user.role || 'user';
      const isDefaultBool = typeof isDefault === 'boolean' ? isDefault : false;

      // Insert (deixa o id ser gerado por DEFAULT gen_random_uuid())
      console.log('[CREATE-TEMPLATE] Inserting template into schema:', schemaName);
      const insertSql = `
        INSERT INTO "${schemaName}".ticket_templates (
          tenant_id,
          name,
          description,
          category,
          subcategory,
          company_id,
          department_id,
          priority,
          template_type,
          fields,
          automation,
          workflow,
          tags,
          is_default,
          permissions,
          created_by,
          user_role,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7,
          $8, $9,
          $10::jsonb,
          $11::jsonb,
          $12::jsonb,
          $13::text[],
          $14,
          $15::jsonb,
          $16,
          $17,
          NOW(),
          NOW()
        )
        RETURNING *;
      `;

      const result = await pool.query(insertSql, [
        user.tenantId,
        name,
        description ?? null,
        category,
        subcategory ?? null,
        companyId ?? null,
        departmentId ?? null,
        String(priority),
        String(templateType),
        jsonFields,
        jsonAutomation,
        jsonWorkflow,
        finalTags,
        isDefaultBool,
        jsonPermissions,
        createdBy,
        finalUserRole
      ]);

      console.log('[CREATE-TEMPLATE] Template created successfully:', result.rows[0]);

      return res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('❌ [TEMPLATE-CONTROLLER] Create template error:', error);

      if (error.code === '23505') {
        // duplicate key
        return res.status(409).json({
          success: false,
          message: 'Template already exists (duplicate key)',
          errors: [error.detail || 'Duplicate key'],
          code: 'DUPLICATE_KEY'
        });
      }

      if (error.code === '42703') {
        // undefined column
        return res.status(500).json({
          success: false,
          message: 'Database schema issue - missing columns',
          errors: [error.message],
          code: 'SCHEMA_ERROR'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error?.message || 'Unknown error'],
        code: 'INTERNAL_ERROR'
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
        res.status(401).json({ success: false, errors: ['Authentication required'] });
        return;
      }

      // DB & schema
      const { schemaManager } = await import('../../../../db');
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(user.tenantId);

      // --------- Query params / filtros ---------
      const companyId = req.query.companyId as string | undefined;
      const templateId = req.query.templateId as string | undefined;
      const category = req.query.category as string | undefined;
      const subcategory = req.query.subcategory as string | undefined;
      const templateType = req.query.templateType as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const isDefault = typeof req.query.isDefault === 'string'
        ? req.query.isDefault === 'true'
        : undefined;
      const tags = req.query.tags ? String(req.query.tags).split(',').map(s => s.trim()).filter(Boolean) : undefined;
      const search = (req.query.search as string | undefined)?.trim();

      const includeAnalytics = req.query.includeAnalytics === 'true';
      const includeUsageStats = req.query.includeUsageStats === 'true';

      // paginação
      const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize ?? '50'), 10) || 50, 1), 200);
      const offset = (page - 1) * pageSize;

      // --------- Valida enums básicos ----------
      const PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
      const TEMPLATE_TYPES = new Set(['standard', 'quick', 'escalation', 'auto_response', 'workflow']);
      if (templateType && !TEMPLATE_TYPES.has(String(templateType))) {
        res.status(400).json({
          success: false,
          errors: ['templateType inválido: use standard | quick | escalation | auto_response | workflow']
        });
        return;
      }

      // --------- Confere existência da tabela ----------
      const tableCheck = await pool.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'ticket_templates'`,
        [schemaName]
      );
      if (tableCheck.rows.length === 0) {
        console.error('[GET-TEMPLATES] ticket_templates não existe em:', schemaName);
        res.status(500).json({
          success: false,
          errors: ['ticket_templates table not found in tenant schema']
        });
        return;
      }

      // --------- Monta WHERE dinâmico ----------
      const where: string[] = [`tenant_id = $1`];
      const params: any[] = [user.tenantId];

      if (templateId) { params.push(templateId); where.push(`id = $${params.length}`); }
      if (companyId) { params.push(companyId); where.push(`company_id = $${params.length}`); }
      if (departmentId) { params.push(departmentId); where.push(`department_id = $${params.length}`); }
      if (category) { params.push(category); where.push(`category = $${params.length}`); }
      if (subcategory) { params.push(subcategory); where.push(`subcategory = $${params.length}`); }
      if (templateType) { params.push(templateType); where.push(`template_type = $${params.length}`); }
      if (typeof isDefault === 'boolean') { params.push(isDefault); where.push(`is_default = $${params.length}`); }

      if (tags && tags.length > 0) {
        // Interseção com array de tags do registro
        params.push(tags);
        where.push(`tags && $${params.length}::text[]`);
      }

      if (search) {
        // Busca textual simples
        params.push(`%${search}%`);
        params.push(`%${search}%`);
        params.push(`%${search}%`);
        params.push(`%${search}%`);
        where.push(`(
          name ILIKE $${params.length - 3}
          OR description ILIKE $${params.length - 2}
          OR category ILIKE $${params.length - 1}
          OR subcategory ILIKE $${params.length}
        )`);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      // --------- Consulta principal + total ----------
      const countSql = `SELECT COUNT(*)::int AS total FROM "${schemaName}".ticket_templates ${whereSql};`;
      const dataSql = `
        SELECT
          id, tenant_id, name, description, category, subcategory,
          company_id, department_id, priority, template_type,
          fields, automation, workflow, tags, is_default,
          permissions, created_by, user_role, created_at, updated_at
        FROM "${schemaName}".ticket_templates
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2};
      `;

      const countParams = [...params];
      const dataParams = [...params, pageSize, offset];

      const [countResult, dataResult] = await Promise.all([
        pool.query(countSql, countParams),
        pool.query(dataSql, dataParams),
      ]);

      const total = countResult.rows[0]?.total ?? 0;
      const templates = dataResult.rows ?? [];

      // --------- (Opcional) Analytics ----------
      let analytics: any = undefined;
      if (includeAnalytics) {
        const [byCategory, byType] = await Promise.all([
          pool.query(
            `
            SELECT category, COUNT(*)::int AS count
            FROM "${schemaName}".ticket_templates
            ${whereSql}
            GROUP BY category
            ORDER BY count DESC;
          `,
            countParams
          ),
          pool.query(
            `
            SELECT template_type, COUNT(*)::int AS count
            FROM "${schemaName}".ticket_templates
            ${whereSql}
            GROUP BY template_type
            ORDER BY count DESC;
          `,
            countParams
          ),
        ]);

        analytics = {
          byCategory: byCategory.rows,
          byTemplateType: byType.rows,
          total,
        };
      }

      // --------- (Opcional) Usage Stats (placeholder útil) ----------
      let usageStatistics: any = undefined;
      if (includeUsageStats) {
        const usage = await pool.query(
          `
          SELECT template_type, COUNT(*)::int AS count
          FROM "${schemaName}".ticket_templates
          ${whereSql}
          GROUP BY template_type
          ORDER BY count DESC;
        `,
          countParams
        );
        usageStatistics = {
          byTemplateType: usage.rows,
          total,
        };
      }

      // --------- Resposta ----------
      const responseData = {
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
        },
        templates: templates || [],
        ...(analytics ? { analytics } : {}),
        ...(usageStatistics ? { usageStatistics } : {}),
      };

      console.log('🚀 [CONTROLLER] Sending final response:', {
        success: true,
        templatesCount: responseData.templates.length,
        hasAnalytics: !!analytics,
        hasUsageStats: !!usageStatistics,
        page,
        pageSize,
        total
      });

      res.status(200).json({ success: true, data: responseData });
    } catch (error: any) {
      console.error('❌ [CONTROLLER] Uncaught error:', error);

      if (error.code === '42703') {
        res.status(500).json({
          success: false,
          errors: ['Database schema issue - missing columns', error.message],
        });
        return;
      }

      res.status(500).json({
        success: false,
        errors: [error?.message || 'Internal server error'],
      });
    }
  };

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
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
        tags,
        isDefault,
        userRole, // opcional no body; fallback para role do token
        // ✅ 1QA.MD: Novos campos para templates
        requiredFields,
        customFields,
        isSystem,
        status,
        automation,
        workflow,
        permissions
      } = req.body;

      // ✅ 1QA.MD: Validação rigorosa de campos obrigatórios
      const missingFields = [];

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        missingFields.push('name');
      }

      if (!category || typeof category !== 'string' || category.trim().length === 0) {
        missingFields.push('category');
      }

      if (!priority || typeof priority !== 'string') {
        missingFields.push('priority');
      }

      if (!templateType || typeof templateType !== 'string') {
        missingFields.push('templateType');
      }

      if (missingFields.length > 0) {
        console.error('[CREATE-TEMPLATE] Missing or invalid required fields:', missingFields);
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: [`Campos obrigatórios inválidos ou em branco: ${missingFields.join(', ')}`],
          code: 'MISSING_REQUIRED_FIELDS',
          details: { missingFields }
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

      // ✅ 1QA.MD: Novos tipos de template - 'creation' e 'edit'
      const TEMPLATE_TYPES = new Set(['creation', 'edit']);
      if (!TEMPLATE_TYPES.has(String(templateType))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid templateType',
          errors: ['templateType deve ser: creation | edit'],
          code: 'INVALID_TEMPLATE_TYPE'
        });
      }

      // ✅ 1QA.MD: Validação de campos obrigatórios para templates de CRIAÇÃO
      if (templateType === 'creation') {
        const { requiredFields, customFields } = req.body;

        // Verificar se os campos obrigatórios estão presentes
        if (!Array.isArray(requiredFields)) {
          return res.status(400).json({
            success: false,
            message: 'Templates de criação devem ter campos obrigatórios definidos',
            errors: ['requiredFields é obrigatório para templates de criação'],
            code: 'MISSING_REQUIRED_FIELDS'
          });
        }

        // Validar que os 5 campos obrigatórios estão presentes
        const mandatoryFields = ['company', 'client', 'beneficiary', 'status', 'summary'];
        const providedFieldNames = requiredFields.map((f: any) => f.fieldName?.toLowerCase()).filter(Boolean);
        const missingMandatory = mandatoryFields.filter(field => !providedFieldNames.includes(field));

        if (missingMandatory.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Templates de criação devem incluir todos os campos obrigatórios',
            errors: [`Campos obrigatórios em falta: ${missingMandatory.join(', ')}`],
            code: 'MISSING_MANDATORY_FIELDS'
          });
        }
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

      // ✅ 1QA.MD: Prepare JSONB fields para novos campos
      const jsonAutomation     = automation == null ? '{"enabled": false}' : (typeof automation === 'string' ? automation : JSON.stringify(automation));
      const jsonWorkflow       = workflow   == null ? '{"enabled": false}' : (typeof workflow   === 'string' ? workflow   : JSON.stringify(workflow));
      const jsonPermissions    = permissions== null ? '[]' : (typeof permissions=== 'string' ? permissions: JSON.stringify(permissions));
      // ✅ 1QA.MD: Novos campos JSONB obrigatórios
      const jsonRequiredFields = requiredFields == null ? '[]' : (typeof requiredFields === 'string' ? requiredFields : JSON.stringify(requiredFields));
      const jsonCustomFields   = customFields == null ? '[]' : (typeof customFields === 'string' ? customFields : JSON.stringify(customFields));

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
          priority,
          template_type,
          required_fields,
          custom_fields,
          automation,
          workflow,
          tags,
          is_default,
          is_system,
          status,
          permissions,
          created_by,
          updated_by,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9::jsonb,
          $10::jsonb,
          $11::jsonb,
          $12::jsonb,
          $13::text[],
          $14, $15, $16,
          $17::jsonb,
          $18, $19,
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
        companyId ?? null,  // ✅ Hierarquia de empresa - null = global
        String(priority),
        String(templateType),
        jsonRequiredFields,  // ✅ Campos obrigatórios
        jsonCustomFields,    // ✅ Campos customizáveis
        jsonAutomation,
        jsonWorkflow,
        finalTags,
        isDefaultBool,
        isSystem ?? false,   // ✅ Template do sistema
        status ?? 'draft',   // ✅ Status do template
        jsonPermissions,
        createdBy,
        createdBy            // ✅ updated_by inicial = created_by
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
   * Update ticket template
   * PUT /ticket-templates/:id
   */
  updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔄 [TEMPLATE-CONTROLLER] Updating template:', req.params.id);
      console.log('🔄 [TEMPLATE-CONTROLLER] Request body:', req.body);

      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User or tenantId missing'],
          code: 'MISSING_TENANT_ID'
        });
      }

      const templateId = req.params.id;
      if (!templateId) {
        return res.status(400).json({
          success: false,
          message: 'Template ID is required',
          errors: ['Template ID missing'],
          code: 'MISSING_TEMPLATE_ID'
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
        userRole,
        status,          
        requiredFields,  
        customFields,

      } = req.body;

      // Check if template exists
      console.log('[UPDATE-TEMPLATE] Checking if template exists:', { templateId, tenantId: user.tenantId, schemaName });

      const existingTemplate = await pool.query(
        `SELECT id, name FROM "${schemaName}".ticket_templates WHERE id = $1 AND tenant_id = $2`,
        [templateId, user.tenantId]
      );

      console.log('[UPDATE-TEMPLATE] Existing template query result:', existingTemplate.rows);

      if (existingTemplate.rows.length === 0) {
        console.error('[UPDATE-TEMPLATE] Template not found:', { templateId, tenantId: user.tenantId });
        return res.status(404).json({
          success: false,
          message: 'Update failed',
          errors: ['Template not found'],
          code: 'TEMPLATE_NOT_FOUND'
        });
      }

      // Prepare update fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCounter = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCounter++}`);
        updateValues.push(description);
      }
      if (category !== undefined) {
        updateFields.push(`category = $${paramCounter++}`);
        updateValues.push(category);
      }
      if (subcategory !== undefined) {
        updateFields.push(`subcategory = $${paramCounter++}`);
        updateValues.push(subcategory);
      }
      if (companyId !== undefined) {
        updateFields.push(`company_id = $${paramCounter++}`);
        updateValues.push(companyId);
      }
      // departmentId removido - não existe na tabela
      if (priority !== undefined) {
        updateFields.push(`priority = $${paramCounter++}`);
        updateValues.push(String(priority));
      }
      if (templateType !== undefined) {
        updateFields.push(`template_type = $${paramCounter++}`);
        updateValues.push(String(templateType));
      }
      if (fields !== undefined) {
        updateFields.push(`fields = $${paramCounter++}::jsonb`);
        updateValues.push(typeof fields === 'string' ? fields : JSON.stringify(fields ?? []));
      }
      if (automation !== undefined) {
        updateFields.push(`automation = $${paramCounter++}::jsonb`);
        updateValues.push(automation == null ? null : (typeof automation === 'string' ? automation : JSON.stringify(automation)));
      }
      if (workflow !== undefined) {
        updateFields.push(`workflow = $${paramCounter++}::jsonb`);
        updateValues.push(workflow == null ? null : (typeof workflow === 'string' ? workflow : JSON.stringify(workflow)));
      }
      if (tags !== undefined) {
        updateFields.push(`tags = $${paramCounter++}::text[]`);
        updateValues.push(Array.isArray(tags) ? tags.map((t: any) => String(t)) : null);
      }
      if (isDefault !== undefined) {
        updateFields.push(`is_default = $${paramCounter++}`);
        updateValues.push(typeof isDefault === 'boolean' ? isDefault : false);
      }
      if (permissions !== undefined) {
        updateFields.push(`permissions = $${paramCounter++}::jsonb`);
        updateValues.push(permissions == null ? null : (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)));
      }
      if (userRole !== undefined) {
        updateFields.push(`user_role = $${paramCounter++}`);
        updateValues.push(userRole);
      }

      if (status !== undefined) {
        updateFields.push(`status = $${paramCounter++}`);
        updateValues.push(String(status));
      }

      // ✅ custom_fields (array)
      if (customFields !== undefined) {
        updateFields.push(`custom_fields = $${paramCounter++}::jsonb`);

        let cfValue: any;

        if (customFields === null) {
          cfValue = '[]'; // null -> []
        } else if (Array.isArray(customFields)) {
          cfValue = customFields.length === 0
            ? '[]'                       // [] -> []
            : JSON.stringify(customFields);
        } else if (typeof customFields === 'string') {
          cfValue = customFields.trim() === ''
            ? '[]'                       // '' -> []
            : customFields;              // assume string JSON válida
        } else {
          // objeto inesperado -> serializa (fallback seguro)
          cfValue = JSON.stringify(customFields);
        }

        updateValues.push(cfValue);
      }

      // ✅ required_fields (array) — mesmo tratamento
      if (requiredFields !== undefined) {
        updateFields.push(`required_fields = $${paramCounter++}::jsonb`);

        let rfValue: any;

        if (requiredFields === null) {
          rfValue = '[]';
        } else if (Array.isArray(requiredFields)) {
          rfValue = requiredFields.length === 0
            ? '[]'
            : JSON.stringify(requiredFields);
        } else if (typeof requiredFields === 'string') {
          rfValue = requiredFields.trim() === ''
            ? '[]'
            : requiredFields;
        } else {
          rfValue = JSON.stringify(requiredFields);
        }

        updateValues.push(rfValue);
      }


      // Always update the updated_at timestamp
      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length === 1) { // Only updated_at
        return res.status(400).json({
          success: false,
          message: 'No fields to update',
          errors: ['At least one field must be provided for update'],
          code: 'NO_UPDATE_FIELDS'
        });
      }

      // Add WHERE clause parameters
      updateValues.push(templateId, user.tenantId);
      const whereClause = `WHERE id = $${paramCounter++} AND tenant_id = $${paramCounter++}`;

      const updateSql = `
        UPDATE "${schemaName}".ticket_templates
        SET ${updateFields.join(', ')}
        ${whereClause}
        RETURNING *;
      `;

      console.log('[UPDATE-TEMPLATE] Updating template in schema:', schemaName);
      const result = await pool.query(updateSql, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or update failed',
          errors: ['Template update failed'],
          code: 'UPDATE_FAILED'
        });
      }

      console.log('[UPDATE-TEMPLATE] Template updated successfully:', result.rows[0]);

      return res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('❌ [TEMPLATE-CONTROLLER] Update template error:', error);

      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Template name already exists',
          errors: [error.detail || 'Duplicate key'],
          code: 'DUPLICATE_KEY'
        });
      }

      if (error.code === '42703') {
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
      // departmentId removido - não existe na tabela
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
          *, 0 as usage_count
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
   * Get template categories
   * GET /ticket-templates/categories
   */
  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🚨 [CATEGORIES-CONTROLLER] === STARTING CATEGORIES EXECUTION ===');
      console.log('🎯 [CATEGORIES-CONTROLLER] User:', req.user);

      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const userRole = user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // DB & schema
      const { schemaManager } = await import('../../../../db');
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);

      // Get unique categories from templates
      const result = await pool.query(
        `SELECT DISTINCT category FROM "${schemaName}".ticket_templates WHERE category IS NOT NULL ORDER BY category`,
        []
      );

      const categories = result.rows.map(row => row.category);

      // Get unique subcategories grouped by category
      const subcategoryResult = await pool.query(
        `SELECT category, subcategory FROM "${schemaName}".ticket_templates WHERE subcategory IS NOT NULL ORDER BY category, subcategory`,
        []
      );

      const subcategories: Record<string, string[]> = {};
      subcategoryResult.rows.forEach(row => {
        if (!subcategories[row.category]) {
          subcategories[row.category] = [];
        }
        if (!subcategories[row.category].includes(row.subcategory)) {
          subcategories[row.category].push(row.subcategory);
        }
      });

      // Fetch analytics data for category stats
      const analyticsResult = await this.getTicketTemplatesUseCase.execute({
        tenantId,
        userRole,
        includeAnalytics: true,
      });

      const categoryStats = analyticsResult.success && analyticsResult.data?.analytics?.templatesByCategory
        ? analyticsResult.data.analytics.templatesByCategory
        : {};

      return res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories,
          subcategories,
          categoryStats
        }
      });

    } catch (error) {
      console.error('[TicketTemplateController] getCategories error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
          isDefault: true // Filter for default templates
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
      // Implementation for template analytics
      res.json({
        success: true,
        message: 'Template analytics endpoint - coming soon'
      });
    } catch (error: any) {
      console.error('❌ [TEMPLATE-CONTROLLER] Get template analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error?.message || 'Unknown error']
      });
    }
  };

  /**
   * Get template custom fields
   * GET /ticket-templates/:id/custom-fields
   */
  getTemplateCustomFields = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🎯 [TEMPLATE-CONTROLLER] Getting template custom fields:', req.params.id);

      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User or tenantId missing'],
          code: 'MISSING_TENANT_ID'
        });
      }

      const templateId = req.params.id;
      if (!templateId) {
        return res.status(400).json({
          success: false,
          message: 'Template ID is required',
          errors: ['Template ID missing'],
          code: 'MISSING_TEMPLATE_ID'
        });
      }

      // DB & schema
      const { schemaManager } = await import('../../../../db');
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(user.tenantId);

      // Get template with custom fields
      console.log('[GET-TEMPLATE-CUSTOM-FIELDS] Fetching template from schema:', schemaName);
      const templateQuery = `
        SELECT id, name, custom_fields, required_fields
        FROM "${schemaName}".ticket_templates 
        WHERE id = $1 AND tenant_id = $2 AND is_active = true
      `;

      const result = await pool.query(templateQuery, [templateId, user.tenantId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          errors: ['Template not found or inactive'],
          code: 'TEMPLATE_NOT_FOUND'
        });
      }

      const template = result.rows[0];

      // Parse custom fields from JSONB
      let customFields = [];
      let requiredFields = [];

      try {
        if (template.custom_fields) {
          customFields = typeof template.custom_fields === 'string' 
            ? JSON.parse(template.custom_fields) 
            : template.custom_fields;
        }
      } catch (e) {
        console.warn('[GET-TEMPLATE-CUSTOM-FIELDS] Error parsing custom_fields:', e);
        customFields = [];
      }

      try {
        if (template.required_fields) {
          requiredFields = typeof template.required_fields === 'string' 
            ? JSON.parse(template.required_fields) 
            : template.required_fields;
        }
      } catch (e) {
        console.warn('[GET-TEMPLATE-CUSTOM-FIELDS] Error parsing required_fields:', e);
        requiredFields = [];
      }

      console.log('[GET-TEMPLATE-CUSTOM-FIELDS] Template custom fields found:', {
        templateId,
        customFieldsCount: customFields.length,
        requiredFieldsCount: requiredFields.length
      });

      return res.json({
        success: true,
        data: {
          templateId: template.id,
          templateName: template.name,
          customFields,
          requiredFields
        }
      });

    } catch (error: any) {
      console.error('❌ [TEMPLATE-CONTROLLER] Get template custom fields error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error?.message || 'Unknown error'],
        code: 'INTERNAL_ERROR'
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
        includeUsageStats: true // To get usage data for popularity
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get popular templates',
          errors: result.errors
        });
      }

      // Assuming usageStatistics.popularTemplates is an array of templates sorted by usage
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
        companyId: companyId !== 'all' ? companyId : undefined, // If 'all', fetch for all companies
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

      // Consolidate stats from the result
      const stats = {
        total_templates: result.data?.templates?.length || 0,
        active_templates: result.data?.templates?.filter(t => t.status === 'active').length || 0, // Assuming 'status' field exists
        avg_usage: result.data?.analytics?.averageUsage || 0,
        max_usage: result.data?.analytics?.maxUsage || 0,
        templates_by_category: result.data?.analytics?.templatesByCategory || {}
      };

      return res.json({
        success: true,
        message: 'Company template statistics retrieved successfully',
        data: [stats] // Returning as an array to match potential API structure
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
        companyId: companyId === 'all' ? undefined : companyId, // If 'all', fetch for all companies
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
        companyId: companyId === 'all' ? undefined : companyId, // If 'all', fetch for all companies
        includeAnalytics: false // No analytics needed for this endpoint
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
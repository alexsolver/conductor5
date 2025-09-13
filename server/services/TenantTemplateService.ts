/**
 * Tenant Template Service
 * Aplica o template da empresa Default na criação de novos tenants
 */

import { DEFAULT_COMPANY_TEMPLATE, DefaultCompanyTemplate } from '../templates/default-company-template';
import { v4 as uuidv4 } from 'uuid';

// Assuming db and sql are imported from your database client library
// import { db, sql } from './db'; // Example import

// Mocking db and sql for demonstration purposes if not provided
const db = {
  execute: async (query: any) => {
    console.log('Mock db.execute called with:', query);
    // Simulate table creation or data retrieval
    if (query.text.includes('CREATE TABLE')) {
      return { rows: [] };
    } else if (query.text.includes('SELECT')) {
      // Simulate returning empty rows for potentially non-existent tables during the fix
      return { rows: [] };
    }
    return { rows: [] };
  }
};
const sql = (strings: TemplateStringsArray, ...values: any[]) => ({
  text: strings.reduce((acc, str, i) => acc + str + (values[i] || ''), ''),
  values: values
});
const randomUUID = uuidv4;


export class TenantTemplateService {
  /**
   * Alternative method signature for compatibility
   */
  async applyDefaultTemplate(tenantId: string, companyId: string): Promise<void> {
    const { db } = await import("../db");
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const pool = { query: (text: string, params: any[]) => db.execute({ text, values: params }) };

    await TenantTemplateService.applyDefaultCompanyTemplate(tenantId, companyId, pool, schemaName);
  }

  /**
   * Aplica o template completo da empresa Default para um novo tenant
   */
  static async applyDefaultCompanyTemplate(
    tenantId: string,
    userId: string,
    pool: any,
    schemaName: string
  ): Promise<void> {
    console.log(`[TENANT-TEMPLATE] Applying NEW hierarchical structure template for tenant ${tenantId}`);

    try {
      // 1. Limpar estrutura antiga (se existir)
      try {
        await this.cleanOldHierarchicalStructure(pool, schemaName);
        console.log('[TENANT-TEMPLATE] Old hierarchical structure cleaned');
      } catch (cleanError) {
        console.warn('[TENANT-TEMPLATE] No old structure to clean or error cleaning:', cleanError.message);
      }

      // 2. Criar empresa Default
      const defaultCompanyId = DEFAULT_COMPANY_TEMPLATE.company.id;
      await this.createDefaultCompany(pool, schemaName, tenantId, userId, defaultCompanyId);

      // 3. Criar opções de campos de tickets
      try {
        await this.createTicketFieldOptions(pool, schemaName, tenantId);
        console.log('[TENANT-TEMPLATE] Ticket field options created successfully');
      } catch (fieldOptionsError) {
        console.warn('[TENANT-TEMPLATE] Field options creation failed, continuing without them:', fieldOptionsError.message);
      }

      // 4. Criar NOVA estrutura hierárquica de 5 categorias
      try {
        await this.createNewHierarchicalStructure(pool, schemaName, tenantId, defaultCompanyId);
        console.log(`[TENANT-TEMPLATE] NEW hierarchical structure created: ${DEFAULT_COMPANY_TEMPLATE.categories.length} categories, ${DEFAULT_COMPANY_TEMPLATE.subcategories.length} subcategories, ${DEFAULT_COMPANY_TEMPLATE.actions.length} actions`);
      } catch (hierarchyError) {
        console.error('[TENANT-TEMPLATE] NEW hierarchical structure creation failed:', hierarchyError);
        throw hierarchyError;
      }

      console.log(`[TENANT-TEMPLATE] NEW template applied successfully for tenant ${tenantId}`);
    } catch (error) {
      console.error(`[TENANT-TEMPLATE] Error applying NEW template for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Limpa estrutura hierárquica antiga
   */
  private static async cleanOldHierarchicalStructure(
    pool: any,
    schemaName: string
  ): Promise<void> {
    console.log('[TENANT-TEMPLATE] Cleaning old hierarchical structure...');

    const cleanupQueries = [
      `DELETE FROM "${schemaName}".ticket_actions WHERE id IS NOT NULL`,
      `DELETE FROM "${schemaName}".ticket_subcategories WHERE id IS NOT NULL`,
      `DELETE FROM "${schemaName}".ticket_categories WHERE id IS NOT NULL`
    ];

    for (const query of cleanupQueries) {
      try {
        await pool.query(query, []);
      } catch (error) {
        console.warn(`[TENANT-TEMPLATE] Cleanup query failed (normal if table doesn't exist): ${error.message}`);
      }
    }
  }

  /**
   * Cria a empresa Default no novo tenant
   */
  private static async createDefaultCompany(
    pool: any,
    schemaName: string,
    tenantId: string,
    userId: string,
    defaultCompanyId: string
  ): Promise<void> {
    const company = DEFAULT_COMPANY_TEMPLATE.company;

    // Check which table name exists in the schema
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      AND table_name IN ('customer_companies', 'companies')
    `;

    const tableCheckResult = await pool.query(tableCheckQuery, [schemaName]);
    const tableName = tableCheckResult.rows.find(row => row.table_name === 'customer_companies') ? 'customer_companies' : 'companies';

    console.log(`[TENANT-TEMPLATE] Using table: ${tableName} in schema: ${schemaName}`);

    const query = `
      INSERT INTO "${schemaName}"."${tableName}" (
        id, tenant_id, name, display_name, description, industry, size,
        email, phone, website, subscription_tier, status, 
        created_by, created_at, updated_at, is_active, country
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), true, 'Brazil')
      ON CONFLICT (id) DO NOTHING
    `;

    await pool.query(query, [
      defaultCompanyId,
      tenantId,
      company.name,
      company.displayName,
      company.description,
      company.industry,
      company.size,
      company.email,
      company.phone,
      company.website,
      company.subscriptionTier,
      company.status,
      userId
    ]);

    console.log(`[TENANT-TEMPLATE] Default company created with ID: ${defaultCompanyId} in table: ${tableName}`);
  }

  /**
   * Cria as opções básicas de campos de tickets
   */
  private static async createTicketFieldOptions(
    pool: any,
    schemaName: string,
    tenantId: string
  ): Promise<void> {
    console.log('[TENANT-TEMPLATE] Creating basic ticket field options');

    const fieldOptions = [
      // Status options
      { field_type: 'status', field_value: 'new', label: 'Novo', color: '#f59e0b', sort_order: 1, is_active: true },
      { field_type: 'status', field_value: 'open', label: 'Aberto', color: '#3b82f6', sort_order: 2, is_active: true },
      { field_type: 'status', field_value: 'in_progress', label: 'Em Progresso', color: '#8b5cf6', sort_order: 3, is_active: true },
      { field_type: 'status', field_value: 'resolved', label: 'Resolvido', color: '#10b981', sort_order: 4, is_active: true },
      { field_type: 'status', field_value: 'closed', label: 'Fechado', color: '#6b7280', sort_order: 5, is_active: true },

      // Priority options
      { field_type: 'priority', field_value: 'low', label: 'Baixa', color: '#10b981', sort_order: 1, is_active: true },
      { field_type: 'priority', field_value: 'medium', label: 'Média', color: '#f59e0b', sort_order: 2, is_active: true },
      { field_type: 'priority', field_value: 'high', label: 'Alta', color: '#f97316', sort_order: 3, is_active: true },
      { field_type: 'priority', field_value: 'critical', label: 'Crítica', color: '#dc2626', sort_order: 4, is_active: true },

      // Impact options
      { field_type: 'impact', field_value: 'low', label: 'Baixo', color: '#10b981', sort_order: 1, is_active: true },
      { field_type: 'impact', field_value: 'medium', label: 'Médio', color: '#f59e0b', sort_order: 2, is_active: true },
      { field_type: 'impact', field_value: 'high', label: 'Alto', color: '#f97316', sort_order: 3, is_active: true },
      { field_type: 'impact', field_value: 'critical', label: 'Crítico', color: '#dc2626', sort_order: 4, is_active: true },

      // Urgency options
      { field_type: 'urgency', field_value: 'low', label: 'Baixa', color: '#10b981', sort_order: 1, is_active: true },
      { field_type: 'urgency', field_value: 'medium', label: 'Média', color: '#f59e0b', sort_order: 2, is_active: true },
      { field_type: 'urgency', field_value: 'high', label: 'Alta', color: '#f97316', sort_order: 3, is_active: true },
      { field_type: 'urgency', field_value: 'critical', label: 'Crítica', color: '#dc2626', sort_order: 4, is_active: true }
    ];

    for (const option of fieldOptions) {
      const insertQuery = `
        INSERT INTO "${schemaName}".ticket_field_options 
        (field_type, field_value, label, color, sort_order, is_active, tenant_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING
      `;

      await pool.query(insertQuery, [
        option.field_type,
        option.field_value,
        option.label,
        option.color,
        option.sort_order,
        option.is_active,
        tenantId
      ]);
    }

    console.log('[TENANT-TEMPLATE] Basic ticket field options created successfully');
  }

  /**
   * Cria a NOVA estrutura hierárquica completa (5 categorias → 20 subcategorias → 30 ações)
   */
  private static async createNewHierarchicalStructure(
    pool: any,
    schemaName: string,
    tenantId: string,
    defaultCompanyId: string
  ): Promise<void> {
    console.log('[TENANT-TEMPLATE] Creating NEW 5-category hierarchical structure...');

    // Mapear nomes para IDs das categorias
    const categoryIdMap = new Map<string, string>();

    // 1. Criar 5 NOVAS categorias
    for (const category of DEFAULT_COMPANY_TEMPLATE.categories) {
      const categoryId = uuidv4();
      categoryIdMap.set(category.name, categoryId);

      // Check if company_id column exists
      const columnCheckQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'ticket_categories' 
        AND column_name = 'company_id'
      `;

      const columnExists = await pool.query(columnCheckQuery, [schemaName]);

      let query;
      let values;

      if (columnExists.rows.length > 0) {
        query = `
          INSERT INTO "${schemaName}".ticket_categories (
            id, tenant_id, company_id, name, description, color, icon,
            active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          categoryId,
          tenantId,
          defaultCompanyId,
          category.name,
          category.description,
          category.color,
          category.icon,
          category.active,
          category.sortOrder
        ];
      } else {
        query = `
          INSERT INTO "${schemaName}".ticket_categories (
            id, tenant_id, name, description, color, icon,
            active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          categoryId,
          tenantId,
          category.name,
          category.description,
          category.color,
          category.icon,
          category.active,
          category.sortOrder
        ];
      }

      await pool.query(query, values);
      console.log(`[TENANT-TEMPLATE] Created category: ${category.name}`);
    }

    // Mapear nomes para IDs das subcategorias
    const subcategoryIdMap = new Map<string, string>();

    // 2. Criar 20 NOVAS subcategorias
    for (const subcategory of DEFAULT_COMPANY_TEMPLATE.subcategories) {
      const subcategoryId = uuidv4();
      const categoryId = categoryIdMap.get(subcategory.categoryName);

      if (!categoryId) {
        console.warn(`[TENANT-TEMPLATE] Category not found: ${subcategory.categoryName}`);
        continue;
      }

      subcategoryIdMap.set(subcategory.name, subcategoryId);

      // Check if company_id column exists in subcategories
      const columnCheckQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'ticket_subcategories' 
        AND column_name = 'company_id'
      `;

      const columnExists = await pool.query(columnCheckQuery, [schemaName]);

      let query;
      let values;

      if (columnExists.rows.length > 0) {
        query = `
          INSERT INTO "${schemaName}".ticket_subcategories (
            id, tenant_id, company_id, category_id, name, description, color, icon,
            active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          subcategoryId,
          tenantId,
          defaultCompanyId,
          categoryId,
          subcategory.name,
          subcategory.description,
          subcategory.color,
          subcategory.icon,
          subcategory.active,
          subcategory.sortOrder
        ];
      } else {
        query = `
          INSERT INTO "${schemaName}".ticket_subcategories (
            id, tenant_id, category_id, name, description, color, icon,
            active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          subcategoryId,
          tenantId,
          categoryId,
          subcategory.name,
          subcategory.description,
          subcategory.color,
          subcategory.icon,
          subcategory.active,
          subcategory.sortOrder
        ];
      }

      await pool.query(query, values);
      console.log(`[TENANT-TEMPLATE] Created subcategory: ${subcategory.name} under ${subcategory.categoryName}`);
    }

    // 3. Criar 30 NOVAS ações
    for (const action of DEFAULT_COMPANY_TEMPLATE.actions) {
      const actionId = uuidv4();
      const subcategoryId = subcategoryIdMap.get(action.subcategoryName);

      if (!subcategoryId) {
        console.warn(`[TENANT-TEMPLATE] Subcategory not found: ${action.subcategoryName}`);
        continue;
      }

      // Check if company_id column exists in actions
      const columnCheckQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'ticket_actions' 
        AND column_name = 'company_id'
      `;

      const columnExists = await pool.query(columnCheckQuery, [schemaName]);

      let query;
      let values;

      if (columnExists.rows.length > 0) {
        query = `
          INSERT INTO "${schemaName}".ticket_actions (
            id, tenant_id, company_id, subcategory_id, name, description, 
            estimated_time_minutes, color, icon, active, sort_order, 
            action_type, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          actionId,
          tenantId,
          defaultCompanyId,
          subcategoryId,
          action.name,
          action.description,
          action.estimatedTimeMinutes,
          action.color,
          action.icon,
          action.active,
          action.sortOrder,
          action.actionType
        ];
      } else {
        query = `
          INSERT INTO "${schemaName}".ticket_actions (
            id, tenant_id, subcategory_id, name, description, 
            estimated_time_minutes, color, icon, active, sort_order, 
            action_type, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          actionId,
          tenantId,
          subcategoryId,
          action.name,
          action.description,
          action.estimatedTimeMinutes,
          action.color,
          action.icon,
          action.active,
          action.sortOrder,
          action.actionType
        ];
      }

      await pool.query(query, values);
      console.log(`[TENANT-TEMPLATE] Created action: ${action.name} under ${action.subcategoryName}`);
    }

    console.log('[TENANT-TEMPLATE] NEW hierarchical structure creation completed successfully!');
  }
}
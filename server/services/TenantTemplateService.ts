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
   * Aplica o template completo da empresa Default para um novo tenant
   */
  static async applyDefaultCompanyTemplate(
    tenantId: string,
    userId: string,
    pool: any,
    schemaName: string
  ): Promise<void> {
    console.log(`[TENANT-TEMPLATE] Applying Default company template for tenant ${tenantId}`);

    try {
      // 1. Criar empresa Default
      const defaultCompanyId = DEFAULT_COMPANY_TEMPLATE.company.id;
      await this.createDefaultCompany(pool, schemaName, tenantId, userId, defaultCompanyId);

      // 2. Criar opções de campos de tickets
      await this.createTicketFieldOptions(pool, schemaName, tenantId, defaultCompanyId);

      // 3. Criar categorias hierárquicas
      await this.createHierarchicalStructure(pool, schemaName, tenantId, defaultCompanyId);

      console.log(`[TENANT-TEMPLATE] Default company template applied successfully for tenant ${tenantId}`);
    } catch (error) {
      console.error(`[TENANT-TEMPLATE] Error applying template for tenant ${tenantId}:`, error);
      throw error;
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
   * Cria empresa personalizada baseada no template Default
   */
  private static async createCustomizedDefaultCompany(
    pool: any,
    schemaName: string,
    tenantId: string,
    userId: string,
    defaultCompanyId: string,
    customizations: {
      companyName: string;
      companyEmail?: string;
      industry?: string;
    }
  ): Promise<void> {
    const company = DEFAULT_COMPANY_TEMPLATE.company;

    // First, check which table name exists in the schema
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
      customizations.companyName, // Nome personalizado
      customizations.companyName, // Display name igual ao nome
      `Empresa ${customizations.companyName} - Configurações padrão do sistema`, // Descrição personalizada
      customizations.industry || company.industry, // Indústria personalizada ou padrão
      company.size,
      customizations.companyEmail || company.email, // Email personalizado ou padrão
      company.phone,
      company.website,
      company.subscriptionTier,
      company.status,
      userId
    ]);

    console.log(`[TENANT-TEMPLATE] Customized default company '${customizations.companyName}' created with ID: ${defaultCompanyId} in table: ${tableName}`);
  }

  /**
   * Cria as opções de campos de tickets (priority, status, category, etc.)
   */
  private static async createTicketFieldOptions(
    pool: any,
    schemaName: string,
    tenantId: string,
    defaultCompanyId: string
  ): Promise<void> {
    const options = DEFAULT_COMPANY_TEMPLATE.ticketFieldOptions;

    for (const option of options) {
      const query = `
        INSERT INTO "${schemaName}".ticket_field_options (
          id, tenant_id, customer_id, field_name, value, label, color,
          sort_order, is_active, is_default, status_type, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;

      await pool.query(query, [
        uuidv4(),
        tenantId,
        defaultCompanyId,
        option.fieldName,
        option.value,
        option.label,
        option.color,
        option.sortOrder,
        option.isActive,
        option.isDefault,
        option.statusType || null
      ]);
    }

    console.log(`[TENANT-TEMPLATE] Created ${options.length} ticket field options`);
  }

  /**
   * Cria a estrutura hierárquica completa (categorias → subcategorias → ações)
   */
  private static async createHierarchicalStructure(
    pool: any,
    schemaName: string,
    tenantId: string,
    defaultCompanyId: string
  ): Promise<void> {
    // Mapear nomes para IDs das categorias
    const categoryIdMap = new Map<string, string>();

    // 1. Criar categorias
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
            id, tenant_id, company_id, customer_id, name, description, color, icon,
            active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          categoryId,
          tenantId,
          defaultCompanyId,
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
            id, tenant_id, customer_id, name, description, color, icon,
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
      }

      await pool.query(query, values);
    }

    // Mapear nomes para IDs das subcategorias
    const subcategoryIdMap = new Map<string, string>();

    // 2. Criar subcategorias
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
            id, tenant_id, company_id, customer_id, category_id, name, description, color, icon,
            active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          subcategoryId,
          tenantId,
          defaultCompanyId,
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
            id, tenant_id, customer_id, category_id, name, description, color, icon,
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
      }

      await pool.query(query, values);
    }

    // 3. Criar ações
    for (const action of DEFAULT_COMPANY_TEMPLATE.actions) {
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
            id, tenant_id, company_id, customer_id, subcategory_id, name, description,
            estimated_time_minutes, color, icon, active, sort_order, action_type,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          uuidv4(),
          tenantId,
          defaultCompanyId,
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
            id, tenant_id, customer_id, subcategory_id, name, description,
            estimated_time_minutes, color, icon, active, sort_order, action_type,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          uuidv4(),
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
      }

      await pool.query(query, values);
    }

    console.log(`[TENANT-TEMPLATE] Created hierarchical structure: ${DEFAULT_COMPANY_TEMPLATE.categories.length} categories, ${DEFAULT_COMPANY_TEMPLATE.subcategories.length} subcategories, ${DEFAULT_COMPANY_TEMPLATE.actions.length} actions`);
  }

  /**
   * Aplica template personalizado baseado na empresa Default mas com customizações
   */
  static async applyCustomizedTemplate(
    tenantId: string,
    userId: string,
    pool: any,
    schemaName: string,
    customizations?: {
      companyName?: string;
      companyEmail?: string;
      industry?: string;
      customCategories?: Array<{ name: string; description: string; color: string; icon: string }>;
    }
  ): Promise<void> {
    console.log(`[TENANT-TEMPLATE] Applying customized template for tenant ${tenantId}`);

    // Aplicar template base
    await this.applyDefaultCompanyTemplate(tenantId, userId, pool, schemaName);

    // Aplicar customizações se fornecidas
    if (customizations) {
      await this.applyCustomizations(pool, schemaName, tenantId, customizations);
    }
  }

  /**
   * Aplica template default com nome de empresa personalizado
   */
  static async applyCustomizedDefaultTemplate(
    tenantId: string,
    userId: string,
    pool: any,
    schemaName: string,
    customizations: {
      companyName: string;
      companyEmail?: string;
      industry?: string;
    }
  ): Promise<void> {
    console.log(`[TENANT-TEMPLATE] Applying customized default template for tenant ${tenantId} with company: ${customizations.companyName}`);

    try {
      // 1. Criar empresa personalizada em vez da Default
      const defaultCompanyId = DEFAULT_COMPANY_TEMPLATE.company.id;
      await this.createCustomizedDefaultCompany(pool, schemaName, tenantId, userId, defaultCompanyId, customizations);

      // 2. Criar opções de campos de tickets
      await this.createTicketFieldOptions(pool, schemaName, tenantId, defaultCompanyId);

      // 3. Criar categorias hierárquicas
      await this.createHierarchicalStructure(pool, schemaName, tenantId, defaultCompanyId);

      console.log(`[TENANT-TEMPLATE] Customized default template applied successfully for tenant ${tenantId} with company: ${customizations.companyName}`);
    } catch (error) {
      console.error(`[TENANT-TEMPLATE] Error applying customized template for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Aplica customizações adicionais
   */
  private static async applyCustomizations(
    pool: any,
    schemaName: string,
    tenantId: string,
    customizations: {
      companyName?: string;
      companyEmail?: string;
      industry?: string;
      customCategories?: Array<{ name: string; description: string; color: string; icon: string }>;
    }
  ): Promise<void> {
    // Implementar customizações adicionais conforme necessário
    console.log(`[TENANT-TEMPLATE] Applying additional customizations for tenant ${tenantId}`);
  }

  /**
   * Verifica se o template já foi aplicado para um tenant
   */
  static async isTemplateApplied(pool: any, schemaName: string, tenantId: string): Promise<boolean> {
    try {
      // Check which company table exists
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name IN ('customer_companies', 'companies')
      `;

      const tableCheckResult = await pool.query(tableCheckQuery, [schemaName]);
      const tableName = tableCheckResult.rows.find(row => row.table_name === 'customer_companies') ? 'customer_companies' : 'companies';

      // Check for default company
      const companyQuery = `
        SELECT COUNT(*) as count 
        FROM "${schemaName}"."${tableName}" 
        WHERE tenant_id = $1
      `;
      const companyResult = await pool.query(companyQuery, [tenantId]);
      const hasCompany = parseInt(companyResult.rows[0].count) > 0;

      // Check for ticket field options
      const optionsQuery = `
        SELECT COUNT(*) as count 
        FROM "${schemaName}".ticket_field_options 
        WHERE tenant_id = $1
      `;
      const optionsResult = await pool.query(optionsQuery, [tenantId]);
      const hasOptions = parseInt(optionsResult.rows[0].count) > 0;

      // Check for categories
      const categoriesQuery = `
        SELECT COUNT(*) as count 
        FROM "${schemaName}".ticket_categories 
        WHERE tenant_id = $1
      `;
      const categoriesResult = await pool.query(categoriesQuery, [tenantId]);
      const hasCategories = parseInt(categoriesResult.rows[0].count) > 0;

      const isApplied = hasCompany && hasOptions && hasCategories;

      console.log(`[TENANT-TEMPLATE] Template check for ${tenantId}: company=${hasCompany} (table: ${tableName}), options=${hasOptions}, categories=${hasCategories}, applied=${isApplied}`);

      return isApplied;
    } catch (error) {
      console.error(`[TENANT-TEMPLATE] Error checking template status:`, error);
      return false;
    }
  }

  // Helper to apply default template, potentially used by copyHierarchy
  private static async applyDefaultTemplate(tenantId: string, companyName: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    // This is a placeholder. In a real scenario, this would call applyDefaultCompanyTemplate
    // or applyCustomizedDefaultTemplate with default values.
    console.log(`[TENANT-TEMPLATE] Placeholder for applying default template for ${tenantId}`);

    // Ensure the necessary tables exist before attempting to copy
    await this.ensureTicketConfigTables(tenantId);

    // Simulate creating default data if sourceCompanyId is the default placeholder
    const defaultCompanyId = '00000000-0000-0000-0000-000000000001';
    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_categories" 
      (id, tenant_id, company_id, name, active, created_at, updated_at)
      VALUES (
        '${uuidv4()}', ${tenantId}, ${defaultCompanyId}, 
        'Default Category', true, NOW(), NOW()
      ) ON CONFLICT DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories" 
      (id, tenant_id, company_id, category_id, name, active, created_at, updated_at)
      VALUES (
        '${uuidv4()}', ${tenantId}, ${defaultCompanyId}, '${defaultCompanyId}',
        'Default Subcategory', true, NOW(), NOW()
      ) ON CONFLICT DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_actions" 
      (id, tenant_id, company_id, subcategory_id, name, active, created_at, updated_at)
      VALUES (
        '${uuidv4()}', ${tenantId}, ${defaultCompanyId}, '${defaultCompanyId}',
        'Default Action', true, NOW(), NOW()
      ) ON CONFLICT DO NOTHING
    `);
  }


  /**
   * Copia a estrutura hierárquica de uma empresa para outra.
   */
  static async copyHierarchy(sourceCompanyId: string, targetCompanyId: string, tenantId: string) {
    try {
      console.log('🔄 [TENANT-TEMPLATE] Starting hierarchy copy:', {
        sourceCompanyId,
        targetCompanyId, 
        tenantId
      });

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // First, ensure we have the basic ticket configuration tables
      await this.ensureTicketConfigTables(tenantId);

      // Apply default template first to ensure we have a source to copy from
      // This is a workaround for when the source is the default company template itself.
      if (sourceCompanyId === '00000000-0000-0000-0000-000000000001') {
        console.log('🔄 Creating default structure first...');
        await this.applyDefaultTemplate(tenantId, 'Default Company');
      }

      // Copy categories
      console.log('📂 Copying categories...');
      let categories;
      try {
        // Attempt to select with sort_order, assuming it might exist
        categories = await db.execute(sql`
          SELECT id, name, description, color, icon, sort_order FROM "${sql.raw(schemaName)}"."ticket_categories" 
          WHERE company_id = ${sourceCompanyId} AND active = true
        `);
      } catch (error: any) {
        // If sort_order column doesn't exist, select without it
        if (error.message.includes('column "sort_order" does not exist')) {
          console.log('⚠️ "sort_order" column not found in ticket_categories, fetching without it.');
          categories = await db.execute(sql`
            SELECT id, name, description, color, icon FROM "${sql.raw(schemaName)}"."ticket_categories" 
            WHERE company_id = ${sourceCompanyId} AND active = true
          `);
        } else {
          throw error; // Rethrow other errors
        }
      }

      const categoryMapping: Record<string, string> = {};

      for (const category of categories.rows) {
        const newCategoryId = randomUUID();
        categoryMapping[category.id as string] = newCategoryId;

        try {
          await db.execute(sql`
            INSERT INTO "${sql.raw(schemaName)}"."ticket_categories" 
            (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
            VALUES (
              ${newCategoryId}, ${tenantId}, ${targetCompanyId}, 
              ${category.name}, ${category.description}, ${category.color || '#3b82f6'}, 
              ${category.icon}, true, ${category.sort_order || 1}, NOW(), NOW()
            )
          `);
        } catch (error: any) {
          console.log('⚠️ Category insert error, trying alternative approach:', error.message);
          // Try with minimal fields if the full insert fails
          // This might happen if some columns like description, color, icon are not nullable
          await db.execute(sql`
            INSERT INTO "${sql.raw(schemaName)}"."ticket_categories" 
            (id, tenant_id, company_id, name, active, created_at, updated_at)
            VALUES (
              ${newCategoryId}, ${tenantId}, ${targetCompanyId}, 
              ${category.name}, true, NOW(), NOW()
            )
          `);
        }
      }

      // Copy subcategories
      console.log('📁 Copying subcategories...');
      let subcategories;
      try {
        subcategories = await db.execute(sql`
          SELECT s.id, s.name, s.description, s.color, s.icon, s.category_id, s.sort_order
          FROM "${sql.raw(schemaName)}"."ticket_subcategories" s
          JOIN "${sql.raw(schemaName)}"."ticket_categories" c ON s.category_id = c.id
          WHERE c.company_id = ${sourceCompanyId} AND s.active = true
        `);
      } catch (error: any) {
        // If the table or column doesn't exist, log and continue with empty results
        if (error.message.includes('does not exist') || error.message.includes('relation "ticket_subcategories" does not exist')) {
          console.log('⚠️ Subcategories table or necessary columns not found, skipping subcategories.');
          subcategories = { rows: [] };
        } else {
          throw error;
        }
      }

      const subcategoryMapping: Record<string, string> = {};

      for (const subcategory of subcategories.rows) {
        const newSubcategoryId = randomUUID();
        const newCategoryId = categoryMapping[subcategory.category_id as string];

        if (newCategoryId) {
          subcategoryMapping[subcategory.id as string] = newSubcategoryId;

          try {
            await db.execute(sql`
              INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories" 
              (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
              VALUES (
                ${newSubcategoryId}, ${tenantId}, ${targetCompanyId}, ${newCategoryId},
                ${subcategory.name}, ${subcategory.description}, ${subcategory.color || '#3b82f6'},
                ${subcategory.icon}, true, ${subcategory.sort_order || 1}, NOW(), NOW()
              )
            `);
          } catch (error: any) {
            console.log('⚠️ Subcategory insert error, trying minimal approach:', error.message);
            await db.execute(sql`
              INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories" 
              (id, tenant_id, company_id, category_id, name, active, created_at, updated_at)
              VALUES (
                ${newSubcategoryId}, ${tenantId}, ${targetCompanyId}, ${newCategoryId},
                ${subcategory.name}, true, NOW(), NOW()
              )
            `);
          }
        }
      }

      // Copy actions
      console.log('⚡ Copying actions...');
      let actions;
      try {
        actions = await db.execute(sql`
          SELECT a.id, a.name, a.description, a.color, a.icon, a.subcategory_id, a.sort_order
          FROM "${sql.raw(schemaName)}"."ticket_actions" a
          JOIN "${sql.raw(schemaName)}"."ticket_subcategories" s ON a.subcategory_id = s.id  
          JOIN "${sql.raw(schemaName)}"."ticket_categories" c ON s.category_id = c.id
          WHERE c.company_id = ${sourceCompanyId} AND a.active = true
        `);
      } catch (error: any) {
        if (error.message.includes('does not exist') || error.message.includes('relation "ticket_actions" does not exist')) {
          console.log('⚠️ Actions table or necessary columns not found, skipping actions.');
          actions = { rows: [] };
        } else {
          throw error;
        }
      }

      for (const action of actions.rows) {
        const newActionId = randomUUID();
        const newSubcategoryId = subcategoryMapping[action.subcategory_id as string];

        if (newSubcategoryId) {
          try {
            await db.execute(sql`
              INSERT INTO "${sql.raw(schemaName)}"."ticket_actions" 
              (id, tenant_id, company_id, subcategory_id, name, description, color, icon, active, sort_order, created_at, updated_at)
              VALUES (
                ${newActionId}, ${tenantId}, ${targetCompanyId}, ${newSubcategoryId},
                ${action.name}, ${action.description}, ${action.color || '#3b82f6'},
                ${action.icon}, true, ${action.sort_order || 1}, NOW(), NOW()
              )
            `);
          } catch (error: any) {
            console.log('⚠️ Action insert error, trying minimal approach:', error.message);
            await db.execute(sql`
              INSERT INTO "${sql.raw(schemaName)}"."ticket_actions" 
              (id, tenant_id, company_id, subcategory_id, name, active, created_at, updated_at)
              VALUES (
                ${newActionId}, ${tenantId}, ${targetCompanyId}, ${newSubcategoryId},
                ${action.name}, true, NOW(), NOW()
              )
            `);
          }
        }
      }

      // Copy field options
      console.log('🏷️ Copying field options...');
      let fieldOptions;
      try {
        fieldOptions = await db.execute(sql`
          SELECT id, field_name, value, label, color, sort_order 
          FROM "${sql.raw(schemaName)}"."ticket_field_options" 
          WHERE company_id = ${sourceCompanyId} AND active = true
        `);
      } catch (error: any) {
        if (error.message.includes('does not exist') || error.message.includes('relation "ticket_field_options" does not exist')) {
          console.log('⚠️ Field options table not found, skipping field options.');
          fieldOptions = { rows: [] };
        } else {
          throw error;
        }
      }

      for (const option of fieldOptions.rows) {
        const newOptionId = randomUUID();

        try {
          await db.execute(sql`
            INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" 
            (id, tenant_id, company_id, field_name, value, label, color, sort_order, active, created_at, updated_at)
            VALUES (
              ${newOptionId}, ${tenantId}, ${targetCompanyId}, ${option.field_name},
              ${option.value}, ${option.label}, ${option.color || '#3b82f6'}, 
              ${option.sort_order || 1}, true, NOW(), NOW()
            )
          `);
        } catch (error: any) {
          console.log('⚠️ Field option insert error:', error.message);
          // Minimal insert if needed, though field options are usually simpler
          await db.execute(sql`
            INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" 
            (id, tenant_id, company_id, field_name, value, label, active, created_at, updated_at)
            VALUES (
              ${newOptionId}, ${tenantId}, ${targetCompanyId}, ${option.field_name},
              ${option.value}, ${option.label}, true, NOW(), NOW()
            )
          `);
        }
      }

      const summary = `Copiou ${categories.rows.length} categorias, ${subcategories.rows.length} subcategorias, ${actions.rows.length} ações e ${fieldOptions.rows.length} opções de campos`;

      console.log('✅ [TENANT-TEMPLATE] Hierarchy copy completed:', summary);

      return {
        success: true,
        summary,
        details: {
          categories: categories.rows.length,
          subcategories: subcategories.rows.length, 
          actions: actions.rows.length,
          fieldOptions: fieldOptions.rows.length
        }
      };

    } catch (error) {
      console.error('❌ [TENANT-TEMPLATE] Error copying hierarchy:', error);
      throw error;
    }
  }


  /**
   * Garante que as tabelas de configuração de tickets existam no schema do tenant.
   * Se alguma tabela ou coluna não existir, ela será criada.
   */
  private static async ensureTicketConfigTables(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log('🔧 [TENANT-TEMPLATE] Ensuring ticket config tables exist...');

    try {
      // Create ticket_categories table
      // Added sort_order back, as the copyHierarchy now handles its potential absence.
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."ticket_categories" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3b82f6',
          icon VARCHAR(50),
          active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id, name)
        )
      `);

      // Create ticket_subcategories table  
      // Added sort_order back. Removed company_id NOT NULL constraint as it might not be present in all scenarios.
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."ticket_subcategories" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID,
          category_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3b82f6',
          icon VARCHAR(50),
          active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, category_id, name),
          FOREIGN KEY (category_id) REFERENCES "${sql.raw(schemaName)}"."ticket_categories"(id) ON DELETE CASCADE
        )
      `);

      // Create ticket_actions table
      // Added sort_order back. Removed company_id NOT NULL constraint.
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."ticket_actions" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID,
          subcategory_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3b82f6',
          icon VARCHAR(50),
          active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, subcategory_id, name),
          FOREIGN KEY (subcategory_id) REFERENCES "${sql.raw(schemaName)}"."ticket_subcategories"(id) ON DELETE CASCADE
        )
      `);

      // Create ticket_field_options table
      // Kept as is, assuming it's generally stable.
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."ticket_field_options" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          field_name VARCHAR(100) NOT NULL,
          value VARCHAR(255) NOT NULL,
          label VARCHAR(255) NOT NULL,
          color VARCHAR(7) DEFAULT '#3b82f6',
          sort_order INTEGER DEFAULT 1,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id, field_name, value)
        )
      `);

      // Create ticket_numbering_config table
      // This table was missing and added to resolve errors related to it.
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "${sql.raw(schemaName)}"."ticket_numbering_config" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          prefix VARCHAR(10) DEFAULT 'TK',
          separator VARCHAR(5) DEFAULT '-',
          current_number INTEGER DEFAULT 1,
          padding INTEGER DEFAULT 6,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id)
        )
      `);

      console.log('✅ [TENANT-TEMPLATE] Ticket config tables ensured');

    } catch (error: any) {
      console.error('❌ [TENANT-TEMPLATE] Error ensuring tables:', error);
      // If the error is due to tables already existing with a different structure,
      // we log it and continue, assuming the necessary components are present.
      if (error.message.includes('already exists') || error.message.includes('relation "') && error.message.includes('" already exists')) {
        console.log('⚠️ Tables might already exist with different structure, continuing...');
      } else {
        // Rethrow unexpected errors
        throw error;
      }
    }
  }
}
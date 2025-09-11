/**
 * Tenant Template Service
 * Aplica o template da empresa Default na criação de novos tenants
 */

import { DEFAULT_COMPANY_TEMPLATE, DefaultCompanyTemplate } from '../templates/default-company-template';
import { v4 as uuidv4 } from 'uuid';

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

    const query = `
      INSERT INTO "${schemaName}".customer_companies (
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

    console.log(`[TENANT-TEMPLATE] Default company created with ID: ${defaultCompanyId}`);
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

    const query = `
      INSERT INTO "${schemaName}".customer_companies (
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

    console.log(`[TENANT-TEMPLATE] Customized default company '${customizations.companyName}' created with ID: ${defaultCompanyId}`);
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

      const query = `
        INSERT INTO "${schemaName}".ticket_categories (
          id, tenant_id, company_id, customer_id, name, description, color, icon,
          active, sort_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;

      await pool.query(query, [
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
      ]);
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

      const query = `
        INSERT INTO "${schemaName}".ticket_subcategories (
          id, tenant_id, company_id, customer_id, category_id, name, description, color, icon,
          active, sort_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;

      await pool.query(query, [
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
      ]);
    }

    // 3. Criar ações
    for (const action of DEFAULT_COMPANY_TEMPLATE.actions) {
      const subcategoryId = subcategoryIdMap.get(action.subcategoryName);
      
      if (!subcategoryId) {
        console.warn(`[TENANT-TEMPLATE] Subcategory not found: ${action.subcategoryName}`);
        continue;
      }

      const query = `
        INSERT INTO "${schemaName}".ticket_actions (
          id, tenant_id, company_id, customer_id, subcategory_id, name, description,
          estimated_time_minutes, color, icon, active, sort_order, action_type,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;

      await pool.query(query, [
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
      ]);
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
    console.log(`[TENANT-TEMPLATE] Applying customized default template for tenant ${tenantId} with company name: ${customizations.companyName}`);

    const defaultCompanyId = `default-${tenantId}`;

    try {
      // 1. Criar empresa personalizada baseada no template Default
      await this.createCustomizedDefaultCompany(
        pool,
        schemaName,
        tenantId,
        userId,
        defaultCompanyId,
        customizations
      );

      // 2. Criar opções de campos de tickets (mantém o padrão)
      await this.createTicketFieldOptions(pool, schemaName, tenantId, defaultCompanyId);

      // 3. Criar estrutura hierárquica de categorias, subcategorias e ações (mantém o padrão)
      await this.createHierarchicalStructure(pool, schemaName, tenantId, defaultCompanyId);

      console.log(`[TENANT-TEMPLATE] Customized default template applied successfully for tenant ${tenantId}`);
    } catch (error) {
      console.error(`[TENANT-TEMPLATE] Error applying customized default template for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Aplica customizações específicas sobre o template base
   */
  private static async applyCustomizations(
    pool: any,
    schemaName: string,
    tenantId: string,
    customizations: any
  ): Promise<void> {
    const defaultCompanyId = DEFAULT_COMPANY_TEMPLATE.company.id;

    // Atualizar dados da empresa se fornecidos
    if (customizations.companyName || customizations.companyEmail || customizations.industry) {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (customizations.companyName) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(customizations.companyName);
      }
      if (customizations.companyEmail) {
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(customizations.companyEmail);
      }
      if (customizations.industry) {
        updateFields.push(`industry = $${paramIndex++}`);
        updateValues.push(customizations.industry);
      }

      updateValues.push(defaultCompanyId, tenantId);

      const query = `
        UPDATE "${schemaName}".customer_companies 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
      `;

      await pool.query(query, updateValues);
      console.log(`[TENANT-TEMPLATE] Applied company customizations`);
    }

    // Adicionar categorias customizadas se fornecidas
    if (customizations.customCategories && customizations.customCategories.length > 0) {
      let sortOrder = DEFAULT_COMPANY_TEMPLATE.categories.length + 1;

      for (const customCategory of customizations.customCategories) {
        const query = `
          INSERT INTO "${schemaName}".ticket_categories (
            id, tenant_id, company_id, customer_id, name, description, color, icon,
            active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, NOW(), NOW())
        `;

        await pool.query(query, [
          uuidv4(),
          tenantId,
          defaultCompanyId,
          defaultCompanyId,
          customCategory.name,
          customCategory.description,
          customCategory.color,
          customCategory.icon,
          sortOrder++
        ]);
      }

      console.log(`[TENANT-TEMPLATE] Added ${customizations.customCategories.length} custom categories`);
    }
  }

  /**
   * Verifica se o template já foi aplicado para um tenant
   */
  static async isTemplateApplied(pool: any, schemaName: string, tenantId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM "${schemaName}".customer_companies 
        WHERE id = $1 AND tenant_id = $2
      `;

      const result = await pool.query(query, [DEFAULT_COMPANY_TEMPLATE.company.id, tenantId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error(`[TENANT-TEMPLATE] Error checking template status:`, error);
      return false;
    }
  }
}
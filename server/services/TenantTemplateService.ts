/**
 * Tenant Template Service
 * Aplica o template da empresa Default na criação de novos tenants
 */

import { DEFAULT_COMPANY_TEMPLATE, DefaultCompanyTemplate } from '../templates/default-company-template';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { pool } from '../db';


export class TenantTemplateService {

  /**
   * Apply default structure to a specific company
   */
  static async applyDefaultStructureToCompany(tenantId: string, companyId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`🔄 Aplicando estrutura padrão para empresa ${companyId} no schema ${schemaName}`);

    try {
      // 1. Aplicar categorias
      await this.applyCategoriesForCompany(schemaName, tenantId, companyId);

      // 2. Aplicar subcategorias
      await this.applySubcategoriesForCompany(schemaName, tenantId, companyId);

      // 3. Aplicar ações
      await this.applyActionsForCompany(schemaName, tenantId, companyId);

      // 4. Aplicar opções de campos
      await this.applyFieldOptionsForCompany(schemaName, tenantId, companyId);

      console.log('✅ Estrutura padrão aplicada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aplicar estrutura padrão:', error);
      throw error;
    }
  }

  /**
   * Copy hierarchy from one company to another within the same tenant
   */
  static async copyHierarchy(tenantId: string, sourceCompanyId: string, targetCompanyId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      console.log('🔄 [TENANT-TEMPLATE] Starting hierarchy copy:', {
        sourceCompanyId,
        targetCompanyId,
        tenantId,
        schemaName,
        derivedFrom: 'tenantId parameter'
      });

      // First, ensure the tenant schema exists
      console.log('🔄 [TENANT-TEMPLATE] Ensuring tenant schema exists...');
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "${sql.raw(schemaName)}"`);

      // Then, ensure we have the basic ticket configuration tables
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

        // Check if category already exists
        const existingCategory = await pool.query(`
          SELECT id FROM "${schemaName}".ticket_categories
          WHERE tenant_id = $1 AND company_id = $2 AND name = $3
        `, [tenantId, targetCompanyId, category.name]);

        if (existingCategory.rows.length === 0) {
          await pool.query(`
            INSERT INTO "${schemaName}".ticket_categories
            (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          `, [
            newCategoryId,
            tenantId,
            targetCompanyId,
            category.name,
            category.description,
            category.color,
            category.icon,
            category.active,
            category.sort_order || 1
          ]);
        } else {
          // Update existing category
          await pool.query(`
            UPDATE "${schemaName}".ticket_categories
            SET
              description = $1,
              color = $2,
              icon = $3,
              active = $4,
              sort_order = $5,
              updated_at = NOW()
            WHERE tenant_id = $6 AND company_id = $7 AND name = $8
          `, [
            category.description,
            category.color,
            category.icon,
            category.active,
            category.sort_order || 1,
            tenantId,
            targetCompanyId,
            category.name
          ]);
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

          // Check if subcategory already exists
          const existingSubcategory = await pool.query(`
            SELECT id FROM "${schemaName}".ticket_subcategories
            WHERE tenant_id = $1 AND company_id = $2 AND category_id = $3 AND name = $4
          `, [tenantId, targetCompanyId, newCategoryId, subcategory.name]);

          if (existingSubcategory.rows.length === 0) {
            await pool.query(`
              INSERT INTO "${schemaName}".ticket_subcategories
              (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `, [
              newSubcategoryId,
              tenantId,
              targetCompanyId,
              newCategoryId,
              subcategory.name,
              subcategory.description,
              subcategory.color,
              subcategory.icon,
              subcategory.active,
              subcategory.sort_order || 1
            ]);
          } else {
            // Update existing subcategory
            await pool.query(`
              UPDATE "${schemaName}".ticket_subcategories
              SET
                description = $1,
                color = $2,
                icon = $3,
                active = $4,
                sort_order = $5,
                updated_at = NOW()
              WHERE tenant_id = $6 AND company_id = $7 AND category_id = $8 AND name = $9
            `, [
              subcategory.description,
              subcategory.color,
              subcategory.icon,
              subcategory.active,
              subcategory.sort_order || 1,
              tenantId,
              targetCompanyId,
              newCategoryId,
              subcategory.name
            ]);
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
          // Check if action already exists
          const existingAction = await pool.query(`
            SELECT id FROM "${schemaName}".ticket_actions
            WHERE tenant_id = $1 AND company_id = $2 AND subcategory_id = $3 AND name = $4
          `, [tenantId, targetCompanyId, newSubcategoryId, action.name]);

          if (existingAction.rows.length === 0) {
            await pool.query(`
              INSERT INTO "${schemaName}".ticket_actions
              (id, tenant_id, company_id, subcategory_id, name, description, color, icon, active, sort_order, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `, [
              newActionId,
              tenantId,
              targetCompanyId,
              newSubcategoryId,
              action.name,
              action.description,
              action.color,
              action.icon,
              action.active,
              action.sort_order || 1
            ]);
          } else {
            // Update existing action
            await pool.query(`
              UPDATE "${schemaName}".ticket_actions
              SET
                description = $1,
                color = $2,
                icon = $3,
                active = $4,
                sort_order = $5,
                updated_at = NOW()
              WHERE tenant_id = $6 AND company_id = $7 AND subcategory_id = $8 AND name = $9
            `, [
              action.description,
              action.color,
              action.icon,
              action.active,
              action.sort_order || 1,
              tenantId,
              targetCompanyId,
              newSubcategoryId,
              action.name
            ]);
          }
        }
      }

      // Copy field options - Create default ones if none exist
      console.log('🏷️ Copying/Creating field options...');
      let fieldOptions;
      try {
        fieldOptions = await db.execute(sql`
          SELECT id, field_name, value, label, color, sort_order
          FROM "${sql.raw(schemaName)}"."ticket_field_options"
          WHERE company_id = ${sourceCompanyId} AND active = true
        `);

        // If no field options found, create default ones
        if (fieldOptions.rows.length === 0) {
          console.log('⚡ No field options found, creating default field options...');

          const defaultFieldOptions = [
            // Status options
            { field_name: 'status', value: 'open', label: 'Aberto', color: '#ef4444', sort_order: 1 },
            { field_name: 'status', value: 'in_progress', label: 'Em Andamento', color: '#f59e0b', sort_order: 2 },
            { field_name: 'status', value: 'resolved', label: 'Resolvido', color: '#22c55e', sort_order: 3 },
            { field_name: 'status', value: 'closed', label: 'Fechado', color: '#6b7280', sort_order: 4 },

            // Priority options
            { field_name: 'priority', value: 'high', label: 'Alta', color: '#f87171', sort_order: 1 },
            { field_name: 'priority', value: 'medium', label: 'Média', color: '#fcd34d', sort_order: 2 },
            { field_name: 'priority', value: 'low', label: 'Baixa', color: '#9ca3af', sort_order: 3 },

            // Impact options
            { field_name: 'impact', value: 'high', label: 'Alto', color: '#fb923c', sort_order: 1 },
            { field_name: 'impact', value: 'medium', label: 'Médio', color: '#fcd34d', sort_order: 2 },
            { field_name: 'impact', value: 'low', label: 'Baixo', color: '#9ca3af', sort_order: 3 },

            // Urgency options
            { field_name: 'urgency', value: 'high', label: 'Alta', color: '#f87171', sort_order: 1 },
            { field_name: 'urgency', value: 'medium', label: 'Média', color: '#fcd34d', sort_order: 2 },
            { field_name: 'urgency', value: 'low', label: 'Baixa', color: '#9ca3af', sort_order: 3 }
          ];

          // Insert default field options for target company
          for (const option of defaultFieldOptions) {
            const optionId = randomUUID();
            await db.execute(sql`
              INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options"
              (id, tenant_id, company_id, field_name, value, label, color, sort_order, active, created_at, updated_at)
              VALUES (
                ${optionId}, ${tenantId}, ${targetCompanyId}, ${option.field_name},
                ${option.value}, ${option.label}, ${option.color},
                ${option.sort_order}, true, NOW(), NOW()
              )
            `);
          }

          console.log(`✅ Created ${defaultFieldOptions.length} default field options for company ${targetCompanyId}`);
          fieldOptions = { rows: defaultFieldOptions };
        }
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
              ${option.sort_order}, true, NOW(), NOW()
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
   * Copia hierarquia de uma empresa para outra
   */
  static async copyHierarchy(tenantId: string, sourceCompanyId: string, targetCompanyId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`🔄 Copiando hierarquia de ${sourceCompanyId} para ${targetCompanyId} no schema ${schemaName}`);

    try {
      // 1. Copiar categorias
      await this.copyCategoriesForCompany(schemaName, tenantId, sourceCompanyId, targetCompanyId);

      // 2. Copiar subcategorias
      await this.copySubcategoriesForCompany(schemaName, tenantId, sourceCompanyId, targetCompanyId);

      // 3. Copiar ações
      await this.copyActionsForCompany(schemaName, tenantId, sourceCompanyId, targetCompanyId);

      console.log('✅ Hierarquia copiada com sucesso');

      return {
        summary: `Hierarquia copiada com sucesso de ${sourceCompanyId} para ${targetCompanyId}`,
        details: {
          tenantId,
          sourceCompanyId,
          targetCompanyId,
          schemaUsed: schemaName
        }
      };

    } catch (error) {
      console.error('❌ Erro ao copiar hierarquia:', error);
      throw error;
    }
  }

  private static async applyCategoriesForCompany(schemaName: string, tenantId: string, companyId: string) {
    const { DEFAULT_COMPANY_TEMPLATE } = await import('../templates/default-company-template');

    for (const category of DEFAULT_COMPANY_TEMPLATE.categories) {
      // Check if category already exists
      const existsQuery = `
        SELECT id FROM "${schemaName}"."ticket_categories"
        WHERE tenant_id = $1 AND company_id = $2 AND name = $3
      `;

      const existsResult = await pool.query(existsQuery, [tenantId, companyId, category.name]);

      if (existsResult.rows.length === 0) {
        // Insert new category
        const insertQuery = `
          INSERT INTO "${schemaName}"."ticket_categories"
          (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `;

        await pool.query(insertQuery, [
          tenantId, companyId, category.name, category.description,
          category.color, category.icon, category.active, category.sortOrder
        ]);
      }
    }

    console.log(`✅ ${DEFAULT_COMPANY_TEMPLATE.categories.length} categorias aplicadas`);
  }

  private static async copyCategoriesForCompany(schemaName: string, tenantId: string, sourceCompanyId: string, targetCompanyId: string) {
    // Get source categories
    const sourceQuery = `
      SELECT name, description, color, icon, active, sort_order
      FROM "${schemaName}"."ticket_categories"
      WHERE tenant_id = $1 AND company_id = $2
    `;

    const sourceResult = await pool.query(sourceQuery, [tenantId, sourceCompanyId]);

    for (const category of sourceResult.rows) {
      // Check if category already exists in target
      const existsQuery = `
        SELECT id FROM "${schemaName}"."ticket_categories"
        WHERE tenant_id = $1 AND company_id = $2 AND name = $3
      `;

      const existsResult = await pool.query(existsQuery, [tenantId, targetCompanyId, category.name]);

      if (existsResult.rows.length === 0) {
        // Insert new category
        const insertQuery = `
          INSERT INTO "${schemaName}"."ticket_categories"
          (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `;

        await pool.query(insertQuery, [
          tenantId, targetCompanyId, category.name, category.description,
          category.color, category.icon, category.active, category.sort_order
        ]);
      }
    }

    console.log(`✅ ${sourceResult.rows.length} categorias copiadas`);
  }

  private static async applySubcategoriesForCompany(schemaName: string, tenantId: string, companyId: string) {
    const { DEFAULT_COMPANY_TEMPLATE } = await import('../templates/default-company-template');

    for (const subcategory of DEFAULT_COMPANY_TEMPLATE.subcategories) {
      // Buscar ID da categoria pai
      const categoryQuery = `
        SELECT id FROM "${schemaName}"."ticket_categories"
        WHERE tenant_id = $1 AND company_id = $2 AND name = $3
      `;

      const categoryResult = await pool.query(categoryQuery, [tenantId, companyId, subcategory.categoryName]);

      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;

        // Check if subcategory already exists
        const existsQuery = `
          SELECT id FROM "${schemaName}"."ticket_subcategories"
          WHERE tenant_id = $1 AND company_id = $2 AND category_id = $3 AND name = $4
        `;

        const existsResult = await pool.query(existsQuery, [tenantId, companyId, categoryId, subcategory.name]);

        if (existsResult.rows.length === 0) {
          const insertQuery = `
            INSERT INTO "${schemaName}"."ticket_subcategories"
            (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          `;

          await pool.query(insertQuery, [
            tenantId, companyId, categoryId, subcategory.name, subcategory.description,
            subcategory.color, subcategory.icon, subcategory.active, subcategory.sortOrder
          ]);
        }
      }
    }

    console.log(`✅ ${DEFAULT_COMPANY_TEMPLATE.subcategories.length} subcategorias aplicadas`);
  }

  private static async copySubcategoriesForCompany(schemaName: string, tenantId: string, sourceCompanyId: string, targetCompanyId: string) {
    // Get source subcategories with their category names
    const sourceQuery = `
      SELECT s.name, s.description, s.color, s.icon, s.active, s.sort_order, c.name as category_name
      FROM "${schemaName}"."ticket_subcategories" s
      JOIN "${schemaName}"."ticket_categories" c ON s.category_id = c.id
      WHERE s.tenant_id = $1 AND s.company_id = $2
    `;

    const sourceResult = await pool.query(sourceQuery, [tenantId, sourceCompanyId]);

    for (const subcategory of sourceResult.rows) {
      // Find the category ID in the target company
      const categoryQuery = `
        SELECT id FROM "${schemaName}"."ticket_categories"
        WHERE tenant_id = $1 AND company_id = $2 AND name = $3
      `;

      const categoryResult = await pool.query(categoryQuery, [tenantId, targetCompanyId, subcategory.category_name]);

      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;

        // Check if subcategory already exists
        const existsQuery = `
          SELECT id FROM "${schemaName}"."ticket_subcategories"
          WHERE tenant_id = $1 AND company_id = $2 AND category_id = $3 AND name = $4
        `;

        const existsResult = await pool.query(existsQuery, [tenantId, targetCompanyId, categoryId, subcategory.name]);

        if (existsResult.rows.length === 0) {
          const insertQuery = `
            INSERT INTO "${schemaName}"."ticket_subcategories"
            (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          `;

          await pool.query(insertQuery, [
            tenantId, targetCompanyId, categoryId, subcategory.name, subcategory.description,
            subcategory.color, subcategory.icon, subcategory.active, subcategory.sort_order
          ]);
        }
      }
    }

    console.log(`✅ ${sourceResult.rows.length} subcategorias copiadas`);
  }

  private static async applyActionsForCompany(schemaName: string, tenantId: string, companyId: string) {
    const { DEFAULT_COMPANY_TEMPLATE } = await import('../templates/default-company-template');

    for (const action of DEFAULT_COMPANY_TEMPLATE.actions) {
      // Buscar ID da subcategoria pai
      const subcategoryQuery = `
        SELECT s.id FROM "${schemaName}"."ticket_subcategories" s
        JOIN "${schemaName}"."ticket_categories" c ON s.category_id = c.id
        WHERE s.tenant_id = $1 AND c.company_id = $2 AND s.name = $3
      `;

      const subcategoryResult = await pool.query(subcategoryQuery, [tenantId, companyId, action.subcategoryName]);

      if (subcategoryResult.rows.length > 0) {
        const subcategoryId = subcategoryResult.rows[0].id;

        // Check if action already exists
        const existsQuery = `
          SELECT id FROM "${schemaName}"."ticket_actions"
          WHERE tenant_id = $1 AND company_id = $2 AND subcategory_id = $3 AND name = $4
        `;

        const existsResult = await pool.query(existsQuery, [tenantId, companyId, subcategoryId, action.name]);

        if (existsResult.rows.length === 0) {
          const insertQuery = `
            INSERT INTO "${schemaName}"."ticket_actions"
            (id, tenant_id, company_id, subcategory_id, name, description, estimated_time_minutes, color, icon, active, sort_order, action_type, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          `;

          await pool.query(insertQuery, [
            tenantId, companyId, subcategoryId, action.name, action.description,
            action.estimatedTimeMinutes, action.color, action.icon, action.active,
            action.sortOrder, action.actionType
          ]);
        }
      }
    }

    console.log(`✅ ${DEFAULT_COMPANY_TEMPLATE.actions.length} ações aplicadas`);
  }

  private static async copyActionsForCompany(schemaName: string, tenantId: string, sourceCompanyId: string, targetCompanyId: string) {
    // Get source actions with their subcategory names
    const sourceQuery = `
      SELECT a.name, a.description, a.estimated_time_minutes, a.color, a.icon, a.active, a.sort_order, a.action_type, s.name as subcategory_name
      FROM "${schemaName}"."ticket_actions" a
      JOIN "${schemaName}"."ticket_subcategories" s ON a.subcategory_id = s.id
      WHERE a.tenant_id = $1 AND a.company_id = $2
    `;

    const sourceResult = await pool.query(sourceQuery, [tenantId, sourceCompanyId]);

    for (const action of sourceResult.rows) {
      // Find the subcategory ID in the target company
      const subcategoryQuery = `
        SELECT s.id FROM "${schemaName}"."ticket_subcategories" s
        JOIN "${schemaName}"."ticket_categories" c ON s.category_id = c.id
        WHERE s.tenant_id = $1 AND c.company_id = $2 AND s.name = $3
      `;

      const subcategoryResult = await pool.query(subcategoryQuery, [tenantId, targetCompanyId, action.subcategory_name]);

      if (subcategoryResult.rows.length > 0) {
        const subcategoryId = subcategoryResult.rows[0].id;

        // Check if action already exists
        const existsQuery = `
          SELECT id FROM "${schemaName}"."ticket_actions"
          WHERE tenant_id = $1 AND company_id = $2 AND subcategory_id = $3 AND name = $4
        `;

        const existsResult = await pool.query(existsQuery, [tenantId, targetCompanyId, subcategoryId, action.name]);

        if (existsResult.rows.length === 0) {
          const insertQuery = `
            INSERT INTO "${schemaName}"."ticket_actions"
            (id, tenant_id, company_id, subcategory_id, name, description, estimated_time_minutes, color, icon, active, sort_order, action_type, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          `;

          await pool.query(insertQuery, [
            tenantId, targetCompanyId, subcategoryId, action.name, action.description,
            action.estimated_time_minutes, action.color, action.icon, action.active,
            action.sort_order, action.action_type
          ]);
        }
      }
    }

    console.log(`✅ ${sourceResult.rows.length} ações copiadas`);
  }

  private static async applyFieldOptionsForCompany(schemaName: string, tenantId: string, companyId: string) {
    const { DEFAULT_COMPANY_TEMPLATE } = await import('../templates/default-company-template');

    // First ensure the table exists, if not create it
    try {
      const tableCheckQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        AND table_name = 'ticket_field_options'
      `;

      const tableResult = await pool.query(tableCheckQuery, [schemaName]);

      if (tableResult.rows.length === 0) {
        console.log(`🔧 Creating ticket_field_options table in schema ${schemaName}`);

        // Create the table
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS "${schemaName}"."ticket_field_options" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            company_id UUID NOT NULL,
            field_name VARCHAR(100) NOT NULL,
            value VARCHAR(100) NOT NULL,
            display_label VARCHAR(255) NOT NULL,
            color VARCHAR(7),
            icon VARCHAR(100),
            is_default BOOLEAN DEFAULT false,
            active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            status_type VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT unique_field_option UNIQUE (tenant_id, company_id, field_name, value)
          );
        `;

        await pool.query(createTableQuery);
        console.log(`✅ Table ticket_field_options created in schema ${schemaName}`);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar/criar tabela ticket_field_options:', error);
      return;
    }

    console.log(`🔄 Applying field options for company ${companyId}...`);

    // Apply field options from template
    for (const option of DEFAULT_COMPANY_TEMPLATE.ticketFieldOptions) {
      try {
        const insertQuery = `
          INSERT INTO "${schemaName}"."ticket_field_options"
          (id, tenant_id, company_id, field_name, value, display_label, color, icon, is_default, active, sort_order, status_type, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT (tenant_id, company_id, field_name, value) DO UPDATE SET
            display_label = $5,
            color = $6,
            icon = $7,
            is_default = $8,
            active = $9,
            sort_order = $10,
            status_type = $11,
            updated_at = NOW()
        `;

        await pool.query(insertQuery, [
          tenantId, companyId, option.fieldName, option.value, option.label,
          option.color, option.icon || null, option.isDefault, option.isActive,
          option.sortOrder, option.statusType || null
        ]);

        console.log(`✅ Applied field option: ${option.fieldName}:${option.value}`);
      } catch (error) {
        console.error(`❌ Erro ao inserir field option ${option.fieldName}:${option.value}:`, error);
      }
    }

    // Add basic fallback options to ensure minimum functionality
    const fallbackOptions = [
      { fieldName: 'status', value: 'novo', label: 'Novo', color: '#6b7280', isDefault: true, isActive: true, sortOrder: 1, statusType: 'open' },
      { fieldName: 'status', value: 'aberto', label: 'Aberto', color: '#3b82f6', isDefault: false, isActive: true, sortOrder: 2, statusType: 'open' },
      { fieldName: 'status', value: 'em_andamento', label: 'Em Andamento', color: '#f59e0b', isDefault: false, isActive: true, sortOrder: 3, statusType: 'open' },
      { fieldName: 'status', value: 'resolvido', label: 'Resolvido', color: '#10b981', isDefault: false, isActive: true, sortOrder: 4, statusType: 'resolved' },
      { fieldName: 'status', value: 'fechado', label: 'Fechado', color: '#6b7280', isDefault: false, isActive: true, sortOrder: 5, statusType: 'closed' },
      { fieldName: 'priority', value: 'low', label: 'Baixa', color: '#10b981', isDefault: false, isActive: true, sortOrder: 1 },
      { fieldName: 'priority', value: 'medium', label: 'Média', color: '#f59e0b', isDefault: true, isActive: true, sortOrder: 2 },
      { fieldName: 'priority', value: 'high', label: 'Alta', color: '#ef4444', isDefault: false, isActive: true, sortOrder: 3 },
      { fieldName: 'priority', value: 'critical', label: 'Crítica', color: '#dc2626', isDefault: false, isActive: true, sortOrder: 4 },
      { fieldName: 'impact', value: 'baixo', label: 'Baixo', color: '#10b981', isDefault: false, isActive: true, sortOrder: 1 },
      { fieldName: 'impact', value: 'medio', label: 'Médio', color: '#f59e0b', isDefault: true, isActive: true, sortOrder: 2 },
      { fieldName: 'impact', value: 'alto', label: 'Alto', color: '#ef4444', isDefault: false, isActive: true, sortOrder: 3 },
      { fieldName: 'urgency', value: 'low', label: 'Baixa', color: '#10b981', isDefault: true, isActive: true, sortOrder: 1 },
      { fieldName: 'urgency', value: 'medium', label: 'Média', color: '#f59e0b', isDefault: false, isActive: true, sortOrder: 2 },
      { fieldName: 'urgency', value: 'high', label: 'Alta', color: '#ef4444', isDefault: false, isActive: true, sortOrder: 3 },
    ];

    for (const option of fallbackOptions) {
      try {
        const insertQuery = `
          INSERT INTO "${schemaName}"."ticket_field_options"
          (id, tenant_id, company_id, field_name, value, display_label, color, is_default, active, sort_order, status_type, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (tenant_id, company_id, field_name, value) DO NOTHING
        `;

        await pool.query(insertQuery, [
          tenantId, companyId, option.fieldName, option.value, option.label,
          option.color, option.isDefault, option.isActive, option.sortOrder, option.statusType || null
        ]);
      } catch (error) {
        console.error(`❌ Erro ao inserir fallback option ${option.fieldName}:${option.value}:`, error);
      }
    }

    console.log(`✅ Field options aplicadas para empresa ${companyId} - Total: ${DEFAULT_COMPANY_TEMPLATE.ticketFieldOptions.length + fallbackOptions.length} opções`);
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
    console.log(`[TENANT-TEMPLATE] Applying Default company template for tenant ${tenantId}`);

    try {
      // 1. Criar empresa Default
      const defaultCompanyId = DEFAULT_COMPANY_TEMPLATE.company.id;
      await this.createDefaultCompany(pool, schemaName, tenantId, userId, defaultCompanyId);

      // 2. Criar opções de campos de tickets
      try {
        await this.createTicketFieldOptions(pool, schemaName, tenantId);
        console.log('[TENANT-TEMPLATE] Ticket field options created successfully');
      } catch (fieldOptionsError) {
        console.warn('[TENANT-TEMPLATE] Field options creation failed, continuing without them:', fieldOptionsError.message);
      }

      // 3. Criar categorias hierárquicas
      try {
        await this.createHierarchicalStructure(pool, schemaName, tenantId, defaultCompanyId);
        console.log(`[TENANT-TEMPLATE] Created hierarchical structure: ${DEFAULT_COMPANY_TEMPLATE.categories.length} categories, ${DEFAULT_COMPANY_TEMPLATE.subcategories.length} subcategories, ${DEFAULT_COMPANY_TEMPLATE.actions.length} actions`);
      } catch (hierarchyError) {
        console.warn('[TENANT-TEMPLATE] Hierarchical structure creation failed, continuing without it:', hierarchyError.message);
      }

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
    tenantId: string
  ): Promise<void> {
    console.log('[TENANT-TEMPLATE] Creating ticket field options');

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

    console.log('[TENANT-TEMPLATE] Ticket field options created successfully');
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
    }

    // Mapear nomes para IDs das subcategorias
    const subcategoryIDMap = new Map<string, string>();

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
            id, tenant_id, company_id, subcategory_id, name, description,
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
      } else {
        query = `
          INSERT INTO "${schemaName}".ticket_actions (
            id, tenant_id, subcategory_id, name, description,
            estimated_time_minutes, color, icon, active, sort_order, action_type,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        values = [
          uuidv4(),
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
    }

    console.log(`[TENANT-TEMPLATE] Created hierarchical structure: ${DEFAULT_COMPANY_TEMPLATE.categories.length} categories, ${DEFAULT_COMPANY_TEMPLATE.subcategories.length} subcategories, ${DEFAULT_COMPANY_TEMPLATE.actions.length} actions`);
  }

  /**
   * Aplica customizações adicionais
   */
  private static async applyCustomizations(
    pool: any,
    schemaName: string,
    tenantId: string,
    customizations?: {
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
    console.log(`[TENANT-TEMPLATE] Applying customized template for tenant ${tenantId}`);

    try {
      // 1. Criar empresa customizada
      console.log(`[TENANT-TEMPLATE] Step 1: Creating customized company for ${tenantId}`);
      const defaultCompanyId = DEFAULT_COMPANY_TEMPLATE.company.id;
      await this.createCustomizedDefaultCompany(pool, schemaName, tenantId, userId, defaultCompanyId, customizations);

      // 2. Criar opções de campos de tickets (com verificação de estrutura)
      console.log(`[TENANT-TEMPLATE] Step 2: Creating ticket field options for ${tenantId}`);
      try {
        await this.createTicketFieldOptions(pool, schemaName, tenantId);
      } catch (fieldOptionsError) {
        console.warn(`[TENANT-TEMPLATE] Field options creation failed, continuing without them:`, fieldOptionsError.message);
      }

      // 3. Criar categorias hierárquicas (usando as padrões do template)
      console.log(`[TENANT-TEMPLATE] Step 3: Creating hierarchical structure for ${tenantId}`);
      try {
        await this.createHierarchicalStructure(pool, schemaName, tenantId, defaultCompanyId);
      } catch (hierarchyError) {
        console.warn(`[TENANT-TEMPLATE] Hierarchical structure creation failed, continuing without it:`, hierarchyError.message);
      }

      console.log(`[TENANT-TEMPLATE] Customized template applied successfully for tenant ${tenantId}`);
    } catch (error) {
      console.error(`[TENANT-TEMPLATE] Error applying customized template for tenant ${tenantId}:`, error);
      // Don't throw the error - let tenant creation succeed even if template application fails
      console.log(`[TENANT-TEMPLATE] Template application failed, but tenant creation will continue`);
    }
  }

  /**
   * Aplica template customizado baseado no template Default
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

        // Check if category already exists
        const existingCategory = await pool.query(`
          SELECT id FROM "${schemaName}".ticket_categories
          WHERE tenant_id = $1 AND company_id = $2 AND name = $3
        `, [tenantId, targetCompanyId, category.name]);

        if (existingCategory.rows.length === 0) {
          await pool.query(`
            INSERT INTO "${schemaName}".ticket_categories
            (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          `, [
            newCategoryId,
            tenantId,
            targetCompanyId,
            category.name,
            category.description,
            category.color,
            category.icon,
            category.active,
            category.sort_order || 1
          ]);
        } else {
          // Update existing category
          await pool.query(`
            UPDATE "${schemaName}".ticket_categories
            SET
              description = $1,
              color = $2,
              icon = $3,
              active = $4,
              sort_order = $5,
              updated_at = NOW()
            WHERE tenant_id = $6 AND company_id = $7 AND name = $8
          `, [
            category.description,
            category.color,
            category.icon,
            category.active,
            category.sort_order || 1,
            tenantId,
            targetCompanyId,
            category.name
          ]);
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

          // Check if subcategory already exists
          const existingSubcategory = await pool.query(`
            SELECT id FROM "${schemaName}".ticket_subcategories
            WHERE tenant_id = $1 AND company_id = $2 AND category_id = $3 AND name = $4
          `, [tenantId, targetCompanyId, newCategoryId, subcategory.name]);

          if (existingSubcategory.rows.length === 0) {
            await pool.query(`
              INSERT INTO "${schemaName}".ticket_subcategories
              (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `, [
              newSubcategoryId,
              tenantId,
              targetCompanyId,
              newCategoryId,
              subcategory.name,
              subcategory.description,
              subcategory.color,
              subcategory.icon,
              subcategory.active,
              subcategory.sort_order || 1
            ]);
          } else {
            // Update existing subcategory
            await pool.query(`
              UPDATE "${schemaName}".ticket_subcategories
              SET
                description = $1,
                color = $2,
                icon = $3,
                active = $4,
                sort_order = $5,
                updated_at = NOW()
              WHERE tenant_id = $6 AND company_id = $7 AND category_id = $8 AND name = $9
            `, [
              subcategory.description,
              subcategory.color,
              subcategory.icon,
              subcategory.active,
              subcategory.sort_order || 1,
              tenantId,
              targetCompanyId,
              newCategoryId,
              subcategory.name
            ]);
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
          // Check if action already exists
          const existingAction = await pool.query(`
            SELECT id FROM "${schemaName}".ticket_actions
            WHERE tenant_id = $1 AND company_id = $2 AND subcategory_id = $3 AND name = $4
          `, [tenantId, targetCompanyId, newSubcategoryId, action.name]);

          if (existingAction.rows.length === 0) {
            await pool.query(`
              INSERT INTO "${schemaName}".ticket_actions
              (id, tenant_id, company_id, subcategory_id, name, description, color, icon, active, sort_order, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `, [
              newActionId,
              tenantId,
              targetCompanyId,
              newSubcategoryId,
              action.name,
              action.description,
              action.color,
              action.icon,
              action.active,
              action.sort_order || 1
            ]);
          } else {
            // Update existing action
            await pool.query(`
              UPDATE "${schemaName}".ticket_actions
              SET
                description = $1,
                color = $2,
                icon = $3,
                active = $4,
                sort_order = $5,
                updated_at = NOW()
              WHERE tenant_id = $6 AND company_id = $7 AND subcategory_id = $8 AND name = $9
            `, [
              action.description,
              action.color,
              action.icon,
              action.active,
              action.sort_order || 1,
              tenantId,
              targetCompanyId,
              newSubcategoryId,
              action.name
            ]);
          }
        }
      }

      // Copy field options - Create default ones if none exist
      console.log('🏷️ Copying/Creating field options...');
      let fieldOptions;
      try {
        fieldOptions = await db.execute(sql`
          SELECT id, field_name, value, label, color, sort_order
          FROM "${sql.raw(schemaName)}"."ticket_field_options"
          WHERE company_id = ${sourceCompanyId} AND active = true
        `);

        // If no field options found, create default ones
        if (fieldOptions.rows.length === 0) {
          console.log('⚡ No field options found, creating default field options...');

          const defaultFieldOptions = [
            // Status options
            { field_name: 'status', value: 'open', label: 'Aberto', color: '#ef4444', sort_order: 1 },
            { field_name: 'status', value: 'in_progress', label: 'Em Andamento', color: '#f59e0b', sort_order: 2 },
            { field_name: 'status', value: 'resolved', label: 'Resolvido', color: '#22c55e', sort_order: 3 },
            { field_name: 'status', value: 'closed', label: 'Fechado', color: '#6b7280', sort_order: 4 },

            // Priority options
            { field_name: 'priority', value: 'high', label: 'Alta', color: '#f87171', sort_order: 1 },
            { field_name: 'priority', value: 'medium', label: 'Média', color: '#fcd34d', sort_order: 2 },
            { field_name: 'priority', value: 'low', label: 'Baixa', color: '#9ca3af', sort_order: 3 },

            // Impact options
            { field_name: 'impact', value: 'high', label: 'Alto', color: '#fb923c', sort_order: 1 },
            { field_name: 'impact', value: 'medium', label: 'Médio', color: '#fcd34d', sort_order: 2 },
            { field_name: 'impact', value: 'low', label: 'Baixo', color: '#9ca3af', sort_order: 3 },

            // Urgency options
            { field_name: 'urgency', value: 'high', label: 'Alta', color: '#f87171', sort_order: 1 },
            { field_name: 'urgency', value: 'medium', label: 'Média', color: '#fcd34d', sort_order: 2 },
            { field_name: 'urgency', value: 'low', label: 'Baixa', color: '#9ca3af', sort_order: 3 }
          ];

          // Insert default field options for target company
          for (const option of defaultFieldOptions) {
            const optionId = randomUUID();
            await db.execute(sql`
              INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options"
              (id, tenant_id, company_id, field_name, value, label, color, sort_order, active, created_at, updated_at)
              VALUES (
                ${optionId}, ${tenantId}, ${targetCompanyId}, ${option.field_name},
                ${option.value}, ${option.label}, ${option.color},
                ${option.sort_order}, true, NOW(), NOW()
              )
            `);
          }

          console.log(`✅ Created ${defaultFieldOptions.length} default field options for company ${targetCompanyId}`);
          fieldOptions = { rows: defaultFieldOptions };
        }
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
              ${option.sort_order}, true, NOW(), NOW()
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
      // Ensure ticket config tables exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."ticket_field_configurations" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          field_name VARCHAR(100) NOT NULL,
          display_name VARCHAR(200) NOT NULL,
          field_type VARCHAR(50) NOT NULL DEFAULT 'text',
          is_required BOOLEAN DEFAULT false,
          is_system_field BOOLEAN DEFAULT false,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          field_config JSONB DEFAULT '{}',
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id, field_name)
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."ticket_field_options" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          field_config_id UUID NOT NULL,
          option_value VARCHAR(100) NOT NULL,
          display_label VARCHAR(200) NOT NULL,
          color_hex VARCHAR(7) DEFAULT '#3b82f6',
          sort_order INTEGER DEFAULT 0,
          is_default BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          option_config JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id, field_config_id, option_value),
          FOREIGN KEY (field_config_id) REFERENCES "${schemaName}"."ticket_field_configurations"(id) ON DELETE CASCADE
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."ticket_categories" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3b82f6',
          icon VARCHAR(50),
          active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id, name)
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."ticket_subcategories" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          category_id UUID NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3b82f6',
          icon VARCHAR(50),
          active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id, category_id, name),
          FOREIGN KEY (category_id) REFERENCES "${schemaName}"."ticket_categories"(id) ON DELETE CASCADE
        )
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."ticket_actions" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          company_id UUID NOT NULL,
          subcategory_id UUID NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          estimated_time_minutes INTEGER DEFAULT 0,
          color VARCHAR(7) DEFAULT '#3b82f6',
          icon VARCHAR(50),
          active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          action_type VARCHAR(50) DEFAULT 'general',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, company_id, subcategory_id, name),
          FOREIGN KEY (subcategory_id) REFERENCES "${schemaName}"."ticket_subcategories"(id) ON DELETE CASCADE
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
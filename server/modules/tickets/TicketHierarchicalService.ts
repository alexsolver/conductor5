/**
 * TicketHierarchicalService - Gerencia hierarquia de categorias
 * Sistema completo: Categoria → Subcategoria → Ação
 */

import { pool } from '../../db';
import {
  TicketCategory,
  TicketSubcategory,
  TicketAction,
  InsertTicketCategory,
  InsertTicketSubcategory,
  InsertTicketAction
} from '@shared/schema';

export class TicketHierarchicalService {

  // ============================================
  // CATEGORIES (Nível 1)
  // ============================================

  async getCategories(tenantId: string, customerId?: string): Promise<TicketCategory[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // 🎯 [1QA-COMPLIANCE] Selecionar apenas categorias ativas
    let query = `
      SELECT * FROM "${schemaName}".ticket_categories 
      WHERE tenant_id = $1 
      AND active = true
    `;
    const params = [tenantId];

    if (customerId) {
      // Filtrar por company_id: mostrar categorias da empresa específica + categorias globais
      query += ` AND (company_id = $2 OR company_id = '00000000-0000-0000-0000-000000000001')`;
      params.push(customerId);
    } else {
      // Sem filtro: mostrar apenas categorias globais
      query += ` AND company_id = '00000000-0000-0000-0000-000000000001'`;
    }

    query += ` ORDER BY sort_order ASC, name ASC`;

    const result = await pool.query(query, params);
    return result.rows as TicketCategory[];
  }

  async createCategory(categoryData: InsertTicketCategory): Promise<TicketCategory> {
    const schemaName = `tenant_${categoryData.tenantId.replace(/-/g, '_')}`;
    
    const query = `
      INSERT INTO "${schemaName}".ticket_categories 
      (tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      categoryData.tenantId,
      categoryData.customerId || null,
      categoryData.name,
      categoryData.description || null,
      categoryData.color || '#3b82f6',
      categoryData.icon || null,
      categoryData.isActive !== false,
      categoryData.sortOrder || 0
    ];

    const result = await pool.query(query, params);
    return result.rows[0] as TicketCategory;
  }

  async updateCategory(id: string, updateData: Partial<TicketCategory>, tenantId: string): Promise<TicketCategory> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const columnName = this.camelToSnake(key);
        setClauses.push(`${columnName} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE "${schemaName}".ticket_categories 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    params.push(id, tenantId);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }
    return result.rows[0] as TicketCategory;
  }

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Soft delete - marca como inativo
    const query = `
      UPDATE "${schemaName}".ticket_categories 
      SET active = false, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [id, tenantId]);
    if (result.rowCount === 0) {
      throw new Error('Category not found');
    }
  }

  // ============================================
  // SUBCATEGORIES (Nível 2)
  // ============================================

  async getSubcategories(tenantId: string, categoryId: string, customerId?: string): Promise<TicketSubcategory[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    let query = `
      SELECT s.*, c.name as category_name, c.color as category_color 
      FROM "${schemaName}".ticket_subcategories s
      JOIN "${schemaName}".ticket_categories c ON s.category_id = c.id
      WHERE s.tenant_id = $1 AND s.category_id = $2 
      AND s.active = true
    `;
    const params = [tenantId, categoryId];

    if (customerId) {
      query += ` AND (s.company_id = $3 OR s.company_id = '00000000-0000-0000-0000-000000000001')`;
      params.push(customerId);
    } else {
      query += ` AND s.company_id = '00000000-0000-0000-0000-000000000001'`;
    }

    query += ` ORDER BY s.sort_order ASC, s.name ASC`;

    const result = await pool.query(query, params);
    return result.rows as TicketSubcategory[];
  }

  async createSubcategory(subcategoryData: InsertTicketSubcategory): Promise<TicketSubcategory> {
    const schemaName = `tenant_${subcategoryData.tenantId.replace(/-/g, '_')}`;
    
    const query = `
      INSERT INTO "${schemaName}".ticket_subcategories 
      (tenant_id, customer_id, category_id, name, description, code, color, icon, sort_order, sla_hours, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const params = [
      subcategoryData.tenantId,
      subcategoryData.customerId || null,
      subcategoryData.categoryId,
      subcategoryData.name,
      subcategoryData.description || null,
      subcategoryData.code,
      subcategoryData.color || null,
      subcategoryData.icon || null,
      subcategoryData.sortOrder || 0,
      subcategoryData.slaHours || null,
      subcategoryData.isActive !== false
    ];

    const result = await pool.query(query, params);
    return result.rows[0] as TicketSubcategory;
  }

  async updateSubcategory(id: string, updateData: Partial<TicketSubcategory>, tenantId: string): Promise<TicketSubcategory> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const columnName = this.camelToSnake(key);
        setClauses.push(`${columnName} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE "${schemaName}".ticket_subcategories 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    params.push(id, tenantId);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Subcategory not found');
    }
    return result.rows[0] as TicketSubcategory;
  }

  async deleteSubcategory(id: string, tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const query = `
      UPDATE "${schemaName}".ticket_subcategories 
      SET active = false, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [id, tenantId]);
    if (result.rowCount === 0) {
      throw new Error('Subcategory not found');
    }
  }

  // ============================================
  // ACTIONS (Nível 3)
  // ============================================

  async getActions(tenantId: string, subcategoryId: string, customerId?: string): Promise<TicketAction[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    let query = `
      SELECT a.*, s.name as subcategory_name, c.name as category_name 
      FROM "${schemaName}".ticket_actions a
      JOIN "${schemaName}".ticket_subcategories s ON a.subcategory_id = s.id
      JOIN "${schemaName}".ticket_categories c ON s.category_id = c.id
      WHERE a.tenant_id = $1 AND a.subcategory_id = $2 
      AND a.active = true
    `;
    const params = [tenantId, subcategoryId];

    if (customerId) {
      query += ` AND (a.company_id = $3 OR a.company_id = '00000000-0000-0000-0000-000000000001')`;
      params.push(customerId);
    } else {
      query += ` AND a.company_id = '00000000-0000-0000-0000-000000000001'`;
    }

    query += ` ORDER BY a.sort_order ASC, a.name ASC`;

    const result = await pool.query(query, params);
    return result.rows as TicketAction[];
  }

  async createAction(actionData: InsertTicketAction): Promise<TicketAction> {
    const schemaName = `tenant_${actionData.tenantId.replace(/-/g, '_')}`;
    
    const query = `
      INSERT INTO "${schemaName}".ticket_actions 
      (tenant_id, customer_id, subcategory_id, name, description, code, action_type, 
       estimated_hours, required_skills, templates, automation_rules, sort_order, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const params = [
      actionData.tenantId,
      actionData.customerId || null,
      actionData.subcategoryId,
      actionData.name,
      actionData.description || null,
      actionData.code,
      actionData.actionType || 'standard',
      actionData.estimatedHours || null,
      actionData.requiredSkills ? JSON.stringify(actionData.requiredSkills) : null,
      actionData.templates ? JSON.stringify(actionData.templates) : null,
      actionData.automationRules ? JSON.stringify(actionData.automationRules) : null,
      actionData.sortOrder || 0,
      actionData.isActive !== false
    ];

    const result = await pool.query(query, params);
    return result.rows[0] as TicketAction;
  }

  async updateAction(id: string, updateData: Partial<TicketAction>, tenantId: string): Promise<TicketAction> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const columnName = this.camelToSnake(key);
        if (key === 'requiredSkills' || key === 'templates' || key === 'automationRules') {
          setClauses.push(`${columnName} = $${paramIndex}`);
          params.push(JSON.stringify(value));
        } else {
          setClauses.push(`${columnName} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    });

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE "${schemaName}".ticket_actions 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    params.push(id, tenantId);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Action not found');
    }
    return result.rows[0] as TicketAction;
  }

  async deleteAction(id: string, tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const query = `
      UPDATE "${schemaName}".ticket_actions 
      SET active = false, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [id, tenantId]);
    if (result.rowCount === 0) {
      throw new Error('Action not found');
    }
  }

  // ============================================
  // HIERARCHY VISUALIZATION
  // ============================================

  async getFullHierarchy(tenantId: string, customerId?: string) {
    const categories = await this.getCategories(tenantId, customerId);
    
    const hierarchy = [];
    
    for (const category of categories) {
      const subcategories = await this.getSubcategories(tenantId, category.id, customerId);
      
      const categoryWithSubcategories = {
        ...category,
        subcategories: []
      };
      
      for (const subcategory of subcategories) {
        const actions = await this.getActions(tenantId, subcategory.id, customerId);
        
        categoryWithSubcategories.subcategories.push({
          ...subcategory,
          actions
        });
      }
      
      hierarchy.push(categoryWithSubcategories);
    }
    
    return hierarchy;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
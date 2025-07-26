import { Pool } from 'pg';
import { 
  PageLayout, 
  AvailableField, 
  LayoutSection, 
  LayoutHistory,
  InsertPageLayout,
  InsertAvailableField,
  InsertLayoutSection,
  InsertLayoutHistory,
  ModuleType,
  PageType,
  FieldType
} from '../../../shared/schema-field-layout';

export class FieldLayoutRepository {
  constructor(private pool: Pool) {}

  // ===========================
  // PAGE LAYOUTS MANAGEMENT
  // ===========================

  async getLayoutsForModule(tenantId: string, moduleType: ModuleType, pageType?: PageType): Promise<PageLayout[]> {
    const query = `
      SELECT * FROM page_layouts 
      WHERE tenant_id = $1 AND module_type = $2
      ${pageType ? 'AND page_type = $3' : ''}
      AND is_active = true
      ORDER BY is_default DESC, layout_name ASC
    `;
    const params = pageType ? [tenantId, moduleType, pageType] : [tenantId, moduleType];
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getLayoutById(tenantId: string, layoutId: string): Promise<PageLayout | null> {
    const query = `
      SELECT * FROM page_layouts 
      WHERE tenant_id = $1 AND id = $2 AND is_active = true
    `;
    
    const result = await this.pool.query(query, [tenantId, layoutId]);
    return result.rows[0] || null;
  }

  async createLayout(tenantId: string, layout: Omit<InsertPageLayout, 'tenantId'>): Promise<PageLayout> {
    const query = `
      INSERT INTO page_layouts (
        tenant_id, module_type, page_type, layout_name, layout_config,
        is_default, is_active, created_by, required_permissions, user_groups
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      tenantId,
      layout.moduleType,
      layout.pageType,
      layout.layoutName,
      JSON.stringify(layout.layoutConfig),
      layout.isDefault || false,
      layout.isActive !== false,
      layout.createdBy,
      layout.requiredPermissions ? JSON.stringify(layout.requiredPermissions) : null,
      layout.userGroups ? JSON.stringify(layout.userGroups) : null
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateLayout(tenantId: string, layoutId: string, updates: Partial<PageLayout>): Promise<PageLayout | null> {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (updates.layoutName) {
      setClause.push(`layout_name = $${paramCount++}`);
      values.push(updates.layoutName);
    }
    
    if (updates.layoutConfig) {
      setClause.push(`layout_config = $${paramCount++}`);
      values.push(JSON.stringify(updates.layoutConfig));
    }
    
    if (updates.isDefault !== undefined) {
      setClause.push(`is_default = $${paramCount++}`);
      values.push(updates.isDefault);
    }
    
    if (updates.isActive !== undefined) {
      setClause.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }
    
    if (updates.requiredPermissions) {
      setClause.push(`required_permissions = $${paramCount++}`);
      values.push(JSON.stringify(updates.requiredPermissions));
    }
    
    if (updates.userGroups) {
      setClause.push(`user_groups = $${paramCount++}`);
      values.push(JSON.stringify(updates.userGroups));
    }

    if (setClause.length === 0) {
      return null;
    }

    setClause.push(`updated_at = NOW()`);
    values.push(tenantId, layoutId);

    const query = `
      UPDATE page_layouts 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramCount++} AND id = $${paramCount++}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteLayout(tenantId: string, layoutId: string): Promise<boolean> {
    const query = `
      UPDATE page_layouts 
      SET is_active = false, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
    `;
    
    const result = await this.pool.query(query, [tenantId, layoutId]);
    return (result.rowCount || 0) > 0;
  }

  async setDefaultLayout(tenantId: string, layoutId: string, moduleType: ModuleType, pageType: PageType): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remove default from all layouts of this module/page
      await client.query(`
        UPDATE page_layouts 
        SET is_default = false, updated_at = NOW()
        WHERE tenant_id = $1 AND module_type = $2 AND page_type = $3
      `, [tenantId, moduleType, pageType]);
      
      // Set new default
      const result = await client.query(`
        UPDATE page_layouts 
        SET is_default = true, updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2
      `, [tenantId, layoutId]);
      
      await client.query('COMMIT');
      return (result.rowCount || 0) > 0;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===========================
  // AVAILABLE FIELDS MANAGEMENT
  // ===========================

  async getAvailableFields(tenantId: string, moduleType: ModuleType): Promise<AvailableField[]> {
    const query = `
      SELECT * FROM available_fields 
      WHERE tenant_id = $1 AND module_type = $2 AND is_active = true
      ORDER BY category ASC, display_order ASC, field_label ASC
    `;
    
    const result = await this.pool.query(query, [tenantId, moduleType]);
    return result.rows;
  }

  async getFieldsByCategory(tenantId: string, moduleType: ModuleType, category: string): Promise<AvailableField[]> {
    const query = `
      SELECT * FROM available_fields 
      WHERE tenant_id = $1 AND module_type = $2 AND category = $3 AND is_active = true
      ORDER BY display_order ASC, field_label ASC
    `;
    
    const result = await this.pool.query(query, [tenantId, moduleType, category]);
    return result.rows;
  }

  async createField(tenantId: string, field: Omit<InsertAvailableField, 'tenantId'>): Promise<AvailableField> {
    const query = `
      INSERT INTO available_fields (
        tenant_id, module_type, field_key, field_type, field_label, 
        field_description, field_config, category, is_system_field, 
        is_required, display_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      tenantId,
      field.moduleType,
      field.fieldKey,
      field.fieldType,
      field.fieldLabel,
      field.fieldDescription,
      JSON.stringify(field.fieldConfig),
      field.category,
      field.isSystemField || false,
      field.isRequired || false,
      field.displayOrder || 0,
      field.isActive !== false
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateField(tenantId: string, fieldId: string, updates: Partial<AvailableField>): Promise<AvailableField | null> {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'tenantId' && key !== 'createdAt') {
        if (key === 'fieldConfig') {
          setClause.push(`field_config = $${paramCount++}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount++}`);
          values.push(value);
        }
      }
    });

    if (setClause.length === 0) {
      return null;
    }

    setClause.push(`updated_at = NOW()`);
    values.push(tenantId, fieldId);

    const query = `
      UPDATE available_fields 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramCount++} AND id = $${paramCount++}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteField(tenantId: string, fieldId: string): Promise<boolean> {
    const query = `
      UPDATE available_fields 
      SET is_active = false, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2 AND is_system_field = false
    `;
    
    const result = await this.pool.query(query, [tenantId, fieldId]);
    return (result.rowCount || 0) > 0;
  }

  // ===========================
  // LAYOUT SECTIONS MANAGEMENT
  // ===========================

  async getLayoutSections(tenantId: string, moduleType: ModuleType): Promise<LayoutSection[]> {
    const query = `
      SELECT * FROM layout_sections 
      WHERE tenant_id = $1 AND module_type = $2 AND is_active = true
      ORDER BY display_order ASC, section_name ASC
    `;
    
    const result = await this.pool.query(query, [tenantId, moduleType]);
    return result.rows;
  }

  async createSection(tenantId: string, section: Omit<InsertLayoutSection, 'tenantId'>): Promise<LayoutSection> {
    const query = `
      INSERT INTO layout_sections (
        tenant_id, module_type, section_key, section_name, section_description,
        max_columns, allowed_field_types, display_order, is_collapsible, 
        is_default_expanded, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      tenantId,
      section.moduleType,
      section.sectionKey,
      section.sectionName,
      section.sectionDescription,
      section.maxColumns || 2,
      section.allowedFieldTypes ? JSON.stringify(section.allowedFieldTypes) : null,
      section.displayOrder || 0,
      section.isCollapsible || false,
      section.isDefaultExpanded !== false,
      section.isActive !== false
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // ===========================
  // LAYOUT HISTORY MANAGEMENT
  // ===========================

  async addHistoryEntry(tenantId: string, entry: Omit<InsertLayoutHistory, 'tenantId'>): Promise<LayoutHistory> {
    const query = `
      INSERT INTO layout_history (
        tenant_id, layout_id, change_type, previous_config, 
        new_config, change_description, changed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      tenantId,
      entry.layoutId,
      entry.changeType,
      entry.previousConfig ? JSON.stringify(entry.previousConfig) : null,
      entry.newConfig ? JSON.stringify(entry.newConfig) : null,
      entry.changeDescription,
      entry.changedBy
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getLayoutHistory(tenantId: string, layoutId: string, limit: number = 50): Promise<LayoutHistory[]> {
    const query = `
      SELECT lh.*, u.first_name, u.last_name, u.email
      FROM layout_history lh
      LEFT JOIN users u ON lh.changed_by = u.id
      WHERE lh.tenant_id = $1 AND lh.layout_id = $2
      ORDER BY lh.changed_at DESC
      LIMIT $3
    `;
    
    const result = await this.pool.query(query, [tenantId, layoutId, limit]);
    return result.rows;
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  async initializeDefaultFields(tenantId: string, moduleType: ModuleType): Promise<void> {
    const defaultFields = this.getDefaultFieldsForModule(moduleType);
    
    for (const field of defaultFields) {
      await this.createField(tenantId, {
        ...field,
        isSystemField: true,
        isActive: true
      });
    }
  }

  private getDefaultFieldsForModule(moduleType: ModuleType): Omit<InsertAvailableField, 'tenantId'>[] {
    const commonFields = [
      {
        moduleType,
        fieldKey: 'created_at',
        fieldType: 'datetime' as FieldType,
        fieldLabel: 'Data de Criação',
        fieldDescription: 'Data e hora de criação do registro',
        fieldConfig: { display: { width: 'half' as const } },
        category: 'system',
        isSystemField: true,
        isRequired: false,
        displayOrder: 100
      },
      {
        moduleType,
        fieldKey: 'updated_at',
        fieldType: 'datetime' as FieldType,
        fieldLabel: 'Última Atualização',
        fieldDescription: 'Data e hora da última atualização',
        fieldConfig: { display: { width: 'half' as const } },
        category: 'system',
        isSystemField: true,
        isRequired: false,
        displayOrder: 101
      }
    ];

    switch (moduleType) {
      case 'customers':
        return [
          ...commonFields,
          {
            moduleType,
            fieldKey: 'first_name',
            fieldType: 'text' as FieldType,
            fieldLabel: 'Nome',
            fieldDescription: 'Primeiro nome do cliente',
            fieldConfig: { validation: { required: true }, display: { width: 'half' as const } },
            category: 'basic',
            isSystemField: true,
            isRequired: true,
            displayOrder: 1
          },
          {
            moduleType,
            fieldKey: 'last_name',
            fieldType: 'text' as FieldType,
            fieldLabel: 'Sobrenome',
            fieldDescription: 'Sobrenome do cliente',
            fieldConfig: { validation: { required: true }, display: { width: 'half' as const } },
            category: 'basic',
            isSystemField: true,
            isRequired: true,
            displayOrder: 2
          },
          {
            moduleType,
            fieldKey: 'email',
            fieldType: 'email' as FieldType,
            fieldLabel: 'Email',
            fieldDescription: 'Email principal do cliente',
            fieldConfig: { validation: { required: true }, display: { width: 'half' as const } },
            category: 'contact',
            isSystemField: true,
            isRequired: true,
            displayOrder: 3
          },
          {
            moduleType,
            fieldKey: 'phone',
            fieldType: 'phone' as FieldType,
            fieldLabel: 'Telefone',
            fieldDescription: 'Telefone principal do cliente',
            fieldConfig: { display: { width: 'half' as const } },
            category: 'contact',
            isSystemField: true,
            isRequired: false,
            displayOrder: 4
          }
        ];

      case 'tickets':
        return [
          ...commonFields,
          {
            moduleType,
            fieldKey: 'title',
            fieldType: 'text' as FieldType,
            fieldLabel: 'Título',
            fieldDescription: 'Título do ticket',
            fieldConfig: { validation: { required: true }, display: { width: 'full' as const } },
            category: 'basic',
            isSystemField: true,
            isRequired: true,
            displayOrder: 1
          },
          {
            moduleType,
            fieldKey: 'description',
            fieldType: 'textarea' as FieldType,
            fieldLabel: 'Descrição',
            fieldDescription: 'Descrição detalhada do problema',
            fieldConfig: { validation: { required: true }, display: { width: 'full' as const } },
            category: 'basic',
            isSystemField: true,
            isRequired: true,
            displayOrder: 2
          },
          {
            moduleType,
            fieldKey: 'priority',
            fieldType: 'select' as FieldType,
            fieldLabel: 'Prioridade',
            fieldDescription: 'Prioridade do ticket',
            fieldConfig: { 
              options: [
                { value: 'low', label: 'Baixa', color: 'bg-gray-500' },
                { value: 'medium', label: 'Média', color: 'bg-yellow-500' },
                { value: 'high', label: 'Alta', color: 'bg-orange-500' },
                { value: 'urgent', label: 'Urgente', color: 'bg-red-500' }
              ],
              display: { width: 'half' as const }
            },
            category: 'classification',
            isSystemField: true,
            isRequired: true,
            displayOrder: 3
          },
          {
            moduleType,
            fieldKey: 'status',
            fieldType: 'select' as FieldType,
            fieldLabel: 'Status',
            fieldDescription: 'Status atual do ticket',
            fieldConfig: { 
              options: [
                { value: 'open', label: 'Aberto', color: 'bg-blue-500' },
                { value: 'in_progress', label: 'Em Progresso', color: 'bg-yellow-500' },
                { value: 'resolved', label: 'Resolvido', color: 'bg-green-500' },
                { value: 'closed', label: 'Fechado', color: 'bg-gray-500' }
              ],
              display: { width: 'half' as const }
            },
            category: 'classification',
            isSystemField: true,
            isRequired: true,
            displayOrder: 4
          }
        ];

      case 'favorecidos':
        return [
          ...commonFields,
          {
            moduleType,
            fieldKey: 'name',
            fieldType: 'text' as FieldType,
            fieldLabel: 'Nome',
            fieldDescription: 'Nome do favorecido',
            fieldConfig: { validation: { required: true }, display: { width: 'full' as const } },
            category: 'basic',
            isSystemField: true,
            isRequired: true,
            displayOrder: 1
          },
          {
            moduleType,
            fieldKey: 'document',
            fieldType: 'text' as FieldType,
            fieldLabel: 'Documento',
            fieldDescription: 'CPF ou CNPJ do favorecido',
            fieldConfig: { validation: { required: true }, display: { width: 'half' as const } },
            category: 'basic',
            isSystemField: true,
            isRequired: true,
            displayOrder: 2
          },
          {
            moduleType,
            fieldKey: 'email',
            fieldType: 'email' as FieldType,
            fieldLabel: 'Email',
            fieldDescription: 'Email do favorecido',
            fieldConfig: { display: { width: 'half' as const } },
            category: 'contact',
            isSystemField: true,
            isRequired: false,
            displayOrder: 3
          }
        ];

      default:
        return commonFields;
    }
  }
}
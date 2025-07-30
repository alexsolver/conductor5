/**
 * TICKET METADATA HIERARCHICAL SERVICE
 * Manages customer-specific ticket configurations with hierarchical inheritance
 * Resolution order: Customer → Tenant → System defaults
 */

const { pool } = require("../db.js");

// System default configurations for fallback
const SYSTEM_DEFAULT_CONFIGS = {
  priority: {
    fieldName: 'priority',
    displayName: 'Prioridade',
    fieldType: 'select',
    isRequired: true,
    options: [
      { value: 'low', label: 'Baixa', color: '#22c55e', isDefault: false },
      { value: 'medium', label: 'Média', color: '#eab308', isDefault: true },
      { value: 'high', label: 'Alta', color: '#f97316', isDefault: false },
      { value: 'urgent', label: 'Urgente', color: '#ef4444', isDefault: false }
    ]
  },
  status: {
    fieldName: 'status',
    displayName: 'Status',
    fieldType: 'select',
    isRequired: true,
    options: [
      { value: 'open', label: 'Aberto', color: '#3b82f6', isDefault: true },
      { value: 'in_progress', label: 'Em Progresso', color: '#eab308', isDefault: false },
      { value: 'resolved', label: 'Resolvido', color: '#22c55e', isDefault: false },
      { value: 'closed', label: 'Fechado', color: '#6b7280', isDefault: false }
    ]
  },
  category: {
    fieldName: 'category',
    displayName: 'Categoria',
    fieldType: 'select',
    isRequired: false,
    options: [
      { value: 'technical', label: 'Técnico', color: '#3b82f6', isDefault: false },
      { value: 'support', label: 'Suporte', color: '#22c55e', isDefault: true },
      { value: 'billing', label: 'Financeiro', color: '#f97316', isDefault: false }
    ]
  }
};

export interface HierarchicalFieldConfig {
  id: string;
  fieldName: string;
  displayName: string;
  fieldType: string;
  isRequired: boolean;
  isSystemField: boolean;
  sortOrder: number;
  source: "customer" | "tenant" | "system";
  customerId?: string | null;
}

export interface HierarchicalFieldOption {
  id: string;
  optionValue: string;
  displayLabel: string;
  colorHex?: string;
  iconName?: string;
  sortOrder: number;
  isDefault: boolean;
  source: "customer" | "tenant" | "system";
  customerId?: string | null;
}

export class TicketMetadataHierarchicalService {
  
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  /**
   * HIERARCHICAL FIELD CONFIGURATION RESOLUTION
   * Returns customer-specific configs first, falls back to tenant global, then system defaults
   */
  async resolveFieldConfiguration(
    tenantId: string, 
    customerId: string | null, 
    fieldName: string
  ): Promise<HierarchicalFieldConfig | null> {
    
    const schemaName = this.getSchemaName(tenantId);
    
    // 1. Try customer-specific configuration first (if customerId provided)
    if (customerId) {
      const customerQuery = `
        SELECT * FROM ${schemaName}.ticket_field_configurations 
        WHERE tenant_id = $1 
        AND customer_id = $2 
        AND field_name = $3 
        AND is_active = true
        ORDER BY sort_order ASC
      `;
      
      const customerResult = await pool.query(customerQuery, [tenantId, customerId, fieldName]);
      if (customerResult.rows.length > 0) {
        const config = customerResult.rows[0];
        return {
          id: config.id,
          fieldName: config.field_name,
          displayName: config.display_name,
          fieldType: config.field_type,
          isRequired: config.is_required,
          isSystemField: false,
          sortOrder: config.sort_order,
          source: "customer" as const,
          customerId: config.customer_id
        };
      }
    }

    // 2. Fallback to global tenant configuration
    const tenantQuery = `
      SELECT * FROM ${schemaName}.ticket_field_configurations 
      WHERE tenant_id = $1 
      AND customer_id IS NULL 
      AND field_name = $2 
      AND is_active = true
      ORDER BY sort_order ASC
    `;
    
    const tenantResult = await pool.query(tenantQuery, [tenantId, fieldName]);
    if (tenantResult.rows.length > 0) {
      const config = tenantResult.rows[0];
      return {
        id: config.id,
        fieldName: config.field_name,
        displayName: config.display_name,
        fieldType: config.field_type,
        isRequired: config.is_required,
        isSystemField: false,
        sortOrder: config.sort_order,
        source: "tenant" as const,
        customerId: null
      };
    }

    // 3. Final fallback to system defaults
    if (SYSTEM_DEFAULT_CONFIGS[fieldName as keyof typeof SYSTEM_DEFAULT_CONFIGS]) {
      const systemConfig = SYSTEM_DEFAULT_CONFIGS[fieldName as keyof typeof SYSTEM_DEFAULT_CONFIGS];
      return {
        id: `system-${fieldName}`,
        fieldName: systemConfig.fieldName,
        displayName: systemConfig.displayName,
        fieldType: systemConfig.fieldType,
        isRequired: systemConfig.isRequired,
        isSystemField: true,
        sortOrder: 0,
        source: "system" as const,
        customerId: null
      };
    }

    return null;
  }

  /**
   * HIERARCHICAL FIELD OPTIONS RESOLUTION
   * Returns customer-specific options first, falls back to tenant global, then system defaults
   */
  async resolveFieldOptions(
    tenantId: string,
    customerId: string | null,
    fieldName: string
  ): Promise<HierarchicalFieldOption[]> {
    
    const schemaName = this.getSchemaName(tenantId);

    // 1. Try customer-specific options first (if customerId provided)
    if (customerId) {
      const customerOptionsQuery = `
        SELECT * FROM ${schemaName}.ticket_field_options
        WHERE tenant_id = $1 
        AND customer_id = $2 
        AND fieldname = $3 
        AND is_active = true
        ORDER BY sort_order ASC
      `;
      
      const customerResult = await pool.query(customerOptionsQuery, [tenantId, customerId, fieldName]);
      if (customerResult.rows.length > 0) {
        return customerResult.rows.map(option => ({
          id: option.id,
          optionValue: option.option_value,
          displayLabel: option.display_label,
          colorHex: option.color_hex,
          iconName: option.icon_name,
          sortOrder: option.sort_order,
          isDefault: option.is_default,
          source: "customer" as const,
          customerId: option.customer_id
        }));
      }
    }

    // 2. Fallback to global tenant options
    const tenantOptionsQuery = `
      SELECT * FROM ${schemaName}.ticket_field_options
      WHERE tenant_id = $1 
      AND customer_id IS NULL 
      AND fieldname = $2 
      AND is_active = true
      ORDER BY sort_order ASC
    `;
    
    const tenantResult = await pool.query(tenantOptionsQuery, [tenantId, fieldName]);
    if (tenantResult.rows.length > 0) {
      return tenantResult.rows.map(option => ({
        id: option.id,
        optionValue: option.option_value,
        displayLabel: option.display_label,
        colorHex: option.color_hex,
        iconName: option.icon_name,
        sortOrder: option.sort_order,
        isDefault: option.is_default,
        source: "tenant" as const,
        customerId: null
      }));
    }

    // 3. Final fallback to system defaults
    if (SYSTEM_DEFAULT_CONFIGS[fieldName as keyof typeof SYSTEM_DEFAULT_CONFIGS]) {
      const systemConfig = SYSTEM_DEFAULT_CONFIGS[fieldName as keyof typeof SYSTEM_DEFAULT_CONFIGS];
      return systemConfig.options.map((option, index) => ({
        id: `system-${fieldName}-${option.value}`,
        optionValue: option.value,
        displayLabel: option.label,
        colorHex: option.color,
        iconName: undefined,
        sortOrder: index,
        isDefault: option.isDefault,
        source: "system" as const,
        customerId: null
      }));
    }

    return [];
  }

  /**
   * GET COMPLETE CUSTOMER CONFIGURATION
   * Returns all fields with their hierarchical configurations
   */
  async getCustomerCompleteConfiguration(
    tenantId: string,
    customerId: string
  ): Promise<{
    fieldConfigurations: HierarchicalFieldConfig[];
    fieldOptions: { [fieldName: string]: HierarchicalFieldOption[] };
    inheritanceMap: { [fieldName: string]: { configSource: string; optionsSource: string } };
  }> {
    
    const fieldNames = ['priority', 'status', 'category', 'urgency', 'impact'];
    
    // Resolve configurations for all fields
    const fieldConfigurations = await Promise.all(
      fieldNames.map(fieldName => 
        this.resolveFieldConfiguration(tenantId, customerId, fieldName)
      )
    );

    // Resolve options for all fields
    const fieldOptionsPromises = fieldNames.map(async fieldName => {
      const options = await this.resolveFieldOptions(tenantId, customerId, fieldName);
      return { fieldName, options };
    });
    
    const fieldOptionsResults = await Promise.all(fieldOptionsPromises);
    
    const fieldOptions: { [fieldName: string]: HierarchicalFieldOption[] } = {};
    const inheritanceMap: { [fieldName: string]: { configSource: string; optionsSource: string } } = {};
    
    fieldOptionsResults.forEach(({ fieldName, options }) => {
      fieldOptions[fieldName] = options;
    });
    
    fieldConfigurations.forEach((config, index) => {
      const fieldName = fieldNames[index];
      if (config) {
        const options = fieldOptions[fieldName] || [];
        inheritanceMap[fieldName] = {
          configSource: config.source,
          optionsSource: options.length > 0 ? options[0].source : "none"
        };
      }
    });

    return {
      fieldConfigurations: fieldConfigurations.filter(Boolean) as HierarchicalFieldConfig[],
      fieldOptions,
      inheritanceMap
    };
  }
}

// Export singleton instance
export const ticketMetadataHierarchicalService = new TicketMetadataHierarchicalService();
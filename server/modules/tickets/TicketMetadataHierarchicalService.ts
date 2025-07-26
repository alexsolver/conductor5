/**
 * TICKET METADATA HIERARCHICAL SERVICE
 * Provides hierarchical resolution of ticket configurations by customer company
 * 
 * Resolution Order:
 * 1. Customer-specific configuration (customerId = specific UUID)
 * 2. Global tenant configuration (customerId = NULL)
 * 3. System default configuration (hard-coded fallback)
 */

import { eq, and, isNull, or } from "drizzle-orm";
import { db } from "../../db";
import { 
  ticketFieldConfigurations, 
  ticketFieldOptions, 
  ticketStyleConfigurations, 
  ticketDefaultConfigurations,
  customers
} from "@shared/schema";

export interface HierarchicalFieldConfig {
  id: string;
  fieldName: string;
  displayName: string;
  fieldType: string;
  isRequired: boolean;
  isSystemField: boolean;
  sortOrder: number;
  source: "customer" | "tenant" | "system"; // Indicates configuration source
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
  
  /**
   * HIERARCHICAL FIELD CONFIGURATION RESOLUTION
   * Returns customer-specific configs first, falls back to tenant global, then system defaults
   */
  async resolveFieldConfiguration(
    tenantId: string, 
    customerId: string | null, 
    fieldName: string
  ): Promise<HierarchicalFieldConfig | null> {
    
    // 1. Try customer-specific configuration first (if customerId provided)
    if (customerId) {
      const customerConfig = await db
        .select()
        .from(ticketFieldConfigurations)
        .where(
          and(
            eq(ticketFieldConfigurations.tenantId, tenantId),
            eq(ticketFieldConfigurations.customerId, customerId),
            eq(ticketFieldConfigurations.fieldName, fieldName),
            eq(ticketFieldConfigurations.isActive, true)
          )
        )
        .limit(1);

      if (customerConfig.length > 0) {
        return {
          ...customerConfig[0],
          source: "customer" as const,
          customerId: customerConfig[0].customerId
        };
      }
    }

    // 2. Fallback to global tenant configuration
    const tenantConfig = await db
      .select()
      .from(ticketFieldConfigurations)
      .where(
        and(
          eq(ticketFieldConfigurations.tenantId, tenantId),
          isNull(ticketFieldConfigurations.customerId), // NULL = global
          eq(ticketFieldConfigurations.fieldName, fieldName),
          eq(ticketFieldConfigurations.isActive, true)
        )
      )
      .limit(1);

    if (tenantConfig.length > 0) {
      return {
        ...tenantConfig[0],
        source: "tenant" as const,
        customerId: null
      };
    }

    // 3. System default configuration (hard-coded fallback)
    return this.getSystemDefaultFieldConfig(fieldName);
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
    
    // 1. Try customer-specific options first (if customerId provided)
    if (customerId) {
      const customerOptions = await this.getFieldOptionsForCustomer(tenantId, customerId, fieldName);
      if (customerOptions.length > 0) {
        return customerOptions.map(option => ({
          ...option,
          source: "customer" as const,
          customerId: option.customerId
        }));
      }
    }

    // 2. Fallback to global tenant options
    const tenantOptions = await this.getFieldOptionsForTenant(tenantId, fieldName);
    if (tenantOptions.length > 0) {
      return tenantOptions.map(option => ({
        ...option,
        source: "tenant" as const,
        customerId: null
      }));
    }

    // 3. System default options (hard-coded fallback)
    return this.getSystemDefaultFieldOptions(fieldName);
  }

  /**
   * GET ALL CONFIGURATIONS FOR A CUSTOMER (WITH INHERITANCE)
   * Returns complete configuration showing what comes from customer vs tenant vs system
   */
  async getCustomerCompleteConfiguration(
    tenantId: string, 
    customerId: string
  ) {
    const fieldNames = ['priority', 'status', 'category', 'urgency', 'impact', 'environment'];
    
    const configurations = await Promise.all(
      fieldNames.map(async (fieldName) => {
        const config = await this.resolveFieldConfiguration(tenantId, customerId, fieldName);
        const options = await this.resolveFieldOptions(tenantId, customerId, fieldName);
        
        return {
          fieldName,
          configuration: config,
          options,
          inheritance: {
            configSource: config?.source || "none",
            optionsSource: options.length > 0 ? options[0].source : "none",
            hasCustomerOverride: config?.source === "customer",
            hasCustomerOptions: options.some(o => o.source === "customer")
          }
        };
      })
    );

    return configurations;
  }

  /**
   * PRACTICAL EXAMPLES: CREATE CUSTOMER-SPECIFIC CONFIGURATIONS
   */
  async createCustomerSpecificConfiguration(
    tenantId: string,
    customerId: string,
    fieldName: string,
    customerConfig: {
      displayName: string;
      options: Array<{
        value: string;
        label: string;
        color?: string;
        isDefault?: boolean;
      }>;
    }
  ) {
    // 1. Create customer-specific field configuration
    const [fieldConfig] = await db
      .insert(ticketFieldConfigurations)
      .values({
        tenantId,
        customerId, // Specific customer ID
        fieldName,
        displayName: customerConfig.displayName,
        fieldType: "select",
        isRequired: true,
        isSystemField: false,
        sortOrder: 1,
        isActive: true
      })
      .returning();

    // 2. Create customer-specific field options
    const optionValues = customerConfig.options.map((option, index) => ({
      tenantId,
      customerId, // Specific customer ID
      fieldConfigId: fieldConfig.id,
      optionValue: option.value,
      displayLabel: option.label,
      colorHex: option.color || "#3B82F6",
      sortOrder: index + 1,
      isDefault: option.isDefault || false,
      isActive: true
    }));

    const createdOptions = await db
      .insert(ticketFieldOptions)
      .values(optionValues)
      .returning();

    return {
      fieldConfiguration: fieldConfig,
      fieldOptions: createdOptions
    };
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  private async getFieldOptionsForCustomer(tenantId: string, customerId: string, fieldName: string) {
    return await db
      .select()
      .from(ticketFieldOptions)
      .innerJoin(
        ticketFieldConfigurations,
        eq(ticketFieldOptions.fieldConfigId, ticketFieldConfigurations.id)
      )
      .where(
        and(
          eq(ticketFieldOptions.tenantId, tenantId),
          eq(ticketFieldOptions.customerId, customerId),
          eq(ticketFieldConfigurations.fieldName, fieldName),
          eq(ticketFieldOptions.isActive, true)
        )
      )
      .orderBy(ticketFieldOptions.sortOrder);
  }

  private async getFieldOptionsForTenant(tenantId: string, fieldName: string) {
    return await db
      .select()
      .from(ticketFieldOptions)
      .innerJoin(
        ticketFieldConfigurations,
        eq(ticketFieldOptions.fieldConfigId, ticketFieldConfigurations.id)
      )
      .where(
        and(
          eq(ticketFieldOptions.tenantId, tenantId),
          isNull(ticketFieldOptions.customerId), // NULL = global tenant
          eq(ticketFieldConfigurations.fieldName, fieldName),
          eq(ticketFieldOptions.isActive, true)
        )
      )
      .orderBy(ticketFieldOptions.sortOrder);
  }

  private getSystemDefaultFieldConfig(fieldName: string): HierarchicalFieldConfig | null {
    const systemDefaults: Record<string, HierarchicalFieldConfig> = {
      priority: {
        id: "system-priority",
        fieldName: "priority",
        displayName: "Prioridade",
        fieldType: "select",
        isRequired: true,
        isSystemField: true,
        sortOrder: 1,
        source: "system"
      },
      status: {
        id: "system-status",
        fieldName: "status",
        displayName: "Status",
        fieldType: "select",
        isRequired: true,
        isSystemField: true,
        sortOrder: 2,
        source: "system"
      }
    };

    return systemDefaults[fieldName] || null;
  }

  private getSystemDefaultFieldOptions(fieldName: string): HierarchicalFieldOption[] {
    const systemDefaults: Record<string, HierarchicalFieldOption[]> = {
      priority: [
        { id: "sys-low", optionValue: "low", displayLabel: "Baixa", colorHex: "#10B981", sortOrder: 1, isDefault: false, source: "system" },
        { id: "sys-medium", optionValue: "medium", displayLabel: "Média", colorHex: "#F59E0B", sortOrder: 2, isDefault: true, source: "system" },
        { id: "sys-high", optionValue: "high", displayLabel: "Alta", colorHex: "#F97316", sortOrder: 3, isDefault: false, source: "system" },
        { id: "sys-critical", optionValue: "critical", displayLabel: "Crítica", colorHex: "#EF4444", sortOrder: 4, isDefault: false, source: "system" }
      ],
      status: [
        { id: "sys-open", optionValue: "open", displayLabel: "Aberto", colorHex: "#2563EB", sortOrder: 1, isDefault: true, source: "system" },
        { id: "sys-progress", optionValue: "in_progress", displayLabel: "Em Andamento", colorHex: "#F59E0B", sortOrder: 2, isDefault: false, source: "system" },
        { id: "sys-resolved", optionValue: "resolved", displayLabel: "Resolvido", colorHex: "#10B981", sortOrder: 3, isDefault: false, source: "system" },
        { id: "sys-closed", optionValue: "closed", displayLabel: "Fechado", colorHex: "#6B7280", sortOrder: 4, isDefault: false, source: "system" }
      ]
    };

    return systemDefaults[fieldName] || [];
  }
}

// Export singleton instance
export const ticketMetadataHierarchicalService = new TicketMetadataHierarchicalService();
/**
 * TicketMetadataRepository - Repository for managing ticket field configurations
 * Handles dynamic metadata for tickets (priorities, statuses, categories, etc.)
 */

import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { 
  ticketFieldConfigurations, 
  ticketFieldOptions, 
  ticketStyleConfigurations, 
  ticketDefaultConfigurations,
  type insertTicketFieldConfigurationSchema,
  type insertTicketFieldOptionSchema,
  type insertTicketStyleConfigurationSchema,
  type insertTicketDefaultConfigurationSchema
} from "@shared/schema";
import { z } from "zod";

type FieldConfiguration = z.infer<typeof insertTicketFieldConfigurationSchema>;
type FieldOption = z.infer<typeof insertTicketFieldOptionSchema>;
type StyleConfiguration = z.infer<typeof insertTicketStyleConfigurationSchema>;
type DefaultConfiguration = z.infer<typeof insertTicketDefaultConfigurationSchema>;

export class TicketMetadataRepository {
  
  // ===========================
  // FIELD CONFIGURATIONS
  // ===========================

  async getFieldConfigurations(tenantId: string) {
    return await db
      .select()
      .from(ticketFieldConfigurations)
      .where(
        and(
          eq(ticketFieldConfigurations.tenantId, tenantId),
          eq(ticketFieldConfigurations.isActive, true)
        )
      )
      .orderBy(ticketFieldConfigurations.sortOrder, ticketFieldConfigurations.fieldName);
  }

  async getFieldConfiguration(tenantId: string, fieldName: string) {
    const [config] = await db
      .select()
      .from(ticketFieldConfigurations)
      .where(
        and(
          eq(ticketFieldConfigurations.tenantId, tenantId),
          eq(ticketFieldConfigurations.fieldName, fieldName),
          eq(ticketFieldConfigurations.isActive, true)
        )
      );
    return config;
  }

  async createFieldConfiguration(data: FieldConfiguration) {
    const [created] = await db
      .insert(ticketFieldConfigurations)
      .values(data)
      .returning();
    return created;
  }

  async updateFieldConfiguration(tenantId: string, fieldName: string, data: Partial<FieldConfiguration>) {
    const [updated] = await db
      .update(ticketFieldConfigurations)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(ticketFieldConfigurations.tenantId, tenantId),
          eq(ticketFieldConfigurations.fieldName, fieldName)
        )
      )
      .returning();
    return updated;
  }

  // ===========================
  // FIELD OPTIONS
  // ===========================

  async getFieldOptions(tenantId: string, fieldName: string) {
    const config = await this.getFieldConfiguration(tenantId, fieldName);
    if (!config) return [];

    return await db
      .select()
      .from(ticketFieldOptions)
      .where(
        and(
          eq(ticketFieldOptions.tenantId, tenantId),
          eq(ticketFieldOptions.fieldConfigId, config.id),
          eq(ticketFieldOptions.isActive, true)
        )
      )
      .orderBy(ticketFieldOptions.sortOrder, ticketFieldOptions.displayLabel);
  }

  async createFieldOption(data: FieldOption) {
    const [created] = await db
      .insert(ticketFieldOptions)
      .values(data)
      .returning();
    return created;
  }

  async updateFieldOption(tenantId: string, optionId: string, data: Partial<FieldOption>) {
    const [updated] = await db
      .update(ticketFieldOptions)
      .set(data)
      .where(
        and(
          eq(ticketFieldOptions.tenantId, tenantId),
          eq(ticketFieldOptions.id, optionId)
        )
      )
      .returning();
    return updated;
  }

  async deleteFieldOption(tenantId: string, optionId: string) {
    return await db
      .update(ticketFieldOptions)
      .set({ isActive: false })
      .where(
        and(
          eq(ticketFieldOptions.tenantId, tenantId),
          eq(ticketFieldOptions.id, optionId)
        )
      );
  }

  // ===========================
  // STYLE CONFIGURATIONS
  // ===========================

  async getStyleConfigurations(tenantId: string) {
    return await db
      .select()
      .from(ticketStyleConfigurations)
      .where(
        and(
          eq(ticketStyleConfigurations.tenantId, tenantId),
          eq(ticketStyleConfigurations.isActive, true)
        )
      );
  }

  async getStyleConfiguration(tenantId: string, fieldName: string) {
    const [config] = await db
      .select()
      .from(ticketStyleConfigurations)
      .where(
        and(
          eq(ticketStyleConfigurations.tenantId, tenantId),
          eq(ticketStyleConfigurations.fieldName, fieldName),
          eq(ticketStyleConfigurations.isActive, true)
        )
      );
    return config;
  }

  async createStyleConfiguration(data: StyleConfiguration) {
    const [created] = await db
      .insert(ticketStyleConfigurations)
      .values(data)
      .returning();
    return created;
  }

  async updateStyleConfiguration(tenantId: string, fieldName: string, data: Partial<StyleConfiguration>) {
    const [updated] = await db
      .update(ticketStyleConfigurations)
      .set({ ...data, createdAt: new Date() })
      .where(
        and(
          eq(ticketStyleConfigurations.tenantId, tenantId),
          eq(ticketStyleConfigurations.fieldName, fieldName)
        )
      )
      .returning();
    return updated;
  }

  // ===========================
  // DEFAULT CONFIGURATIONS
  // ===========================

  async getDefaultConfigurations(tenantId: string) {
    return await db
      .select()
      .from(ticketDefaultConfigurations)
      .where(eq(ticketDefaultConfigurations.tenantId, tenantId));
  }

  async getDefaultConfiguration(tenantId: string, fieldName: string) {
    const [config] = await db
      .select()
      .from(ticketDefaultConfigurations)
      .where(
        and(
          eq(ticketDefaultConfigurations.tenantId, tenantId),
          eq(ticketDefaultConfigurations.fieldName, fieldName)
        )
      );
    return config;
  }

  async createDefaultConfiguration(data: DefaultConfiguration) {
    const [created] = await db
      .insert(ticketDefaultConfigurations)
      .values(data)
      .returning();
    return created;
  }

  async updateDefaultConfiguration(tenantId: string, fieldName: string, data: Partial<DefaultConfiguration>) {
    const [updated] = await db
      .update(ticketDefaultConfigurations)
      .set(data)
      .where(
        and(
          eq(ticketDefaultConfigurations.tenantId, tenantId),
          eq(ticketDefaultConfigurations.fieldName, fieldName)
        )
      )
      .returning();
    return updated;
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  async initializeDefaultConfigurations(tenantId: string) {
    // Default field configurations for new tenants
    const defaultFields = [
      {
        tenantId,
        fieldName: 'priority',
        displayName: 'Prioridade',
        fieldType: 'select',
        isRequired: true,
        isSystemField: true,
        sortOrder: 1
      },
      {
        tenantId,
        fieldName: 'status',
        displayName: 'Status',
        fieldType: 'select',
        isRequired: true,
        isSystemField: true,
        sortOrder: 2
      },
      {
        tenantId,
        fieldName: 'category',
        displayName: 'Categoria',
        fieldType: 'select',
        isRequired: false,
        isSystemField: false,
        sortOrder: 3
      },
      {
        tenantId,
        fieldName: 'location',
        displayName: 'Localização',
        fieldType: 'select',
        isRequired: false,
        isSystemField: false,
        sortOrder: 4
      }
    ];

    // Create field configurations
    const createdConfigs = await db
      .insert(ticketFieldConfigurations)
      .values(defaultFields)
      .returning();

    // Default options for priority
    const priorityConfig = createdConfigs.find(c => c.fieldName === 'priority');
    if (priorityConfig) {
      const priorityOptions = [
        { tenantId, fieldConfigId: priorityConfig.id, optionValue: 'low', displayLabel: 'Baixa', colorHex: '#10B981', sortOrder: 1 },
        { tenantId, fieldConfigId: priorityConfig.id, optionValue: 'medium', displayLabel: 'Média', colorHex: '#F59E0B', sortOrder: 2, isDefault: true },
        { tenantId, fieldConfigId: priorityConfig.id, optionValue: 'high', displayLabel: 'Alta', colorHex: '#F97316', sortOrder: 3 },
        { tenantId, fieldConfigId: priorityConfig.id, optionValue: 'critical', displayLabel: 'Crítica', colorHex: '#EF4444', sortOrder: 4, slaHours: 4 }
      ];
      await db.insert(ticketFieldOptions).values(priorityOptions);
    }

    // Default options for status
    const statusConfig = createdConfigs.find(c => c.fieldName === 'status');
    if (statusConfig) {
      const statusOptions = [
        { tenantId, fieldConfigId: statusConfig.id, optionValue: 'open', displayLabel: 'Aberto', colorHex: '#3B82F6', sortOrder: 1, isDefault: true },
        { tenantId, fieldConfigId: statusConfig.id, optionValue: 'in_progress', displayLabel: 'Em Progresso', colorHex: '#F59E0B', sortOrder: 2 },
        { tenantId, fieldConfigId: statusConfig.id, optionValue: 'pending', displayLabel: 'Pendente', colorHex: '#6B7280', sortOrder: 3 },
        { tenantId, fieldConfigId: statusConfig.id, optionValue: 'resolved', displayLabel: 'Resolvido', colorHex: '#10B981', sortOrder: 4 },
        { tenantId, fieldConfigId: statusConfig.id, optionValue: 'closed', displayLabel: 'Fechado', colorHex: '#374151', sortOrder: 5 }
      ];
      await db.insert(ticketFieldOptions).values(statusOptions);
    }

    // Default style configurations
    const styleConfigs = [
      {
        tenantId,
        styleName: 'priority_colors',
        fieldName: 'priority',
        styleMapping: {
          low: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200' },
          medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200' },
          high: { bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'dark:bg-orange-900', darkText: 'dark:text-orange-200' },
          critical: { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-200' }
        }
      },
      {
        tenantId,
        styleName: 'status_colors',
        fieldName: 'status',
        styleMapping: {
          open: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200' },
          in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200' },
          pending: { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-900', darkText: 'dark:text-gray-200' },
          resolved: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200' },
          closed: { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-900', darkText: 'dark:text-gray-200' }
        }
      }
    ];

    await db.insert(ticketStyleConfigurations).values(styleConfigs);

    // ✅ CONFIGURAÇÕES 100% DINÂMICAS - Valores padrão vêm do banco
    // Não há mais valores hard-coded, tudo é configurável por tenant/empresa

    await db.insert(ticketDefaultConfigurations).values(defaultConfigs);

    return { success: true, message: 'Default configurations initialized' };
  }
}
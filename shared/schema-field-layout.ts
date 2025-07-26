import { pgTable, uuid, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===========================
// FIELD LAYOUT MANAGEMENT SCHEMA
// ===========================

/**
 * Layouts de páginas configuráveis via drag & drop
 * Permite personalizar quais campos aparecem em cada página e sua posição
 */
export const pageLayouts = pgTable("page_layouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  moduleType: varchar("module_type", { length: 50 }).notNull(), // 'customers', 'tickets', 'favorecidos', etc.
  pageType: varchar("page_type", { length: 50 }).notNull(), // 'edit', 'create', 'details', 'list'
  layoutName: varchar("layout_name", { length: 100 }).notNull(),
  
  // Configuração do layout em JSON
  layoutConfig: jsonb("layout_config").notNull(), // Array de seções e campos
  
  // Metadados
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Permissões
  requiredPermissions: jsonb("required_permissions"), // Array de permissões necessárias
  userGroups: jsonb("user_groups"), // Array de grupos que podem usar este layout
});

/**
 * Campos disponíveis para drag & drop
 * Define quais campos estão disponíveis na paleta de componentes
 */
export const availableFields = pgTable("available_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  moduleType: varchar("module_type", { length: 50 }).notNull(),
  
  // Informações do campo
  fieldKey: varchar("field_key", { length: 100 }).notNull(), // 'name', 'email', 'priority', etc.
  fieldType: varchar("field_type", { length: 50 }).notNull(), // 'text', 'select', 'date', etc.
  fieldLabel: varchar("field_label", { length: 200 }).notNull(),
  fieldDescription: text("field_description"),
  
  // Configurações do campo
  fieldConfig: jsonb("field_config").notNull(), // Validações, opções, etc.
  
  // Metadados
  category: varchar("category", { length: 50 }).notNull(), // 'basic', 'contact', 'classification', etc.
  isSystemField: boolean("is_system_field").default(false), // Campos do sistema vs customizados
  isRequired: boolean("is_required").default(false),
  displayOrder: integer("display_order").default(0),
  
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Seções de layout personalizáveis
 * Define áreas onde campos podem ser organizados
 */
export const layoutSections = pgTable("layout_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  moduleType: varchar("module_type", { length: 50 }).notNull(),
  
  // Informações da seção
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  sectionName: varchar("section_name", { length: 200 }).notNull(),
  sectionDescription: text("section_description"),
  
  // Layout da seção
  maxColumns: integer("max_columns").default(2), // Máximo de colunas na seção
  allowedFieldTypes: jsonb("allowed_field_types"), // Tipos de campo permitidos
  
  // Metadados
  displayOrder: integer("display_order").default(0),
  isCollapsible: boolean("is_collapsible").default(false),
  isDefaultExpanded: boolean("is_default_expanded").default(true),
  
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Histórico de mudanças de layout
 * Rastreia alterações para auditoria e rollback
 */
export const layoutHistory = pgTable("layout_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  layoutId: uuid("layout_id").notNull(),
  
  // Dados da mudança
  changeType: varchar("change_type", { length: 50 }).notNull(), // 'field_added', 'field_moved', 'section_renamed', etc.
  previousConfig: jsonb("previous_config"),
  newConfig: jsonb("new_config"),
  changeDescription: text("change_description"),
  
  // Metadados
  changedBy: uuid("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

// ===========================
// ZOD SCHEMAS
// ===========================

// Layout configuration structure
export const layoutConfigSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    fields: z.array(z.object({
      id: z.string(),
      fieldKey: z.string(),
      position: z.object({
        row: z.number(),
        column: z.number(),
        span: z.number().optional().default(1)
      }),
      config: z.record(z.any()).optional()
    }))
  }))
});

// Field configuration structure
export const fieldConfigSchema = z.object({
  validation: z.object({
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    customValidation: z.string().optional()
  }).optional(),
  display: z.object({
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    width: z.enum(['full', 'half', 'third', 'quarter']).optional().default('full')
  }).optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string().optional()
  })).optional()
});

// Insert schemas
export const insertPageLayoutSchema = createInsertSchema(pageLayouts, {
  layoutConfig: layoutConfigSchema
});

export const insertAvailableFieldSchema = createInsertSchema(availableFields, {
  fieldConfig: fieldConfigSchema
});

export const insertLayoutSectionSchema = createInsertSchema(layoutSections);
export const insertLayoutHistorySchema = createInsertSchema(layoutHistory);

// Select types
export type PageLayout = typeof pageLayouts.$inferSelect;
export type AvailableField = typeof availableFields.$inferSelect;
export type LayoutSection = typeof layoutSections.$inferSelect;
export type LayoutHistory = typeof layoutHistory.$inferSelect;

// Insert types
export type InsertPageLayout = z.infer<typeof insertPageLayoutSchema>;
export type InsertAvailableField = z.infer<typeof insertAvailableFieldSchema>;
export type InsertLayoutSection = z.infer<typeof insertLayoutSectionSchema>;
export type InsertLayoutHistory = z.infer<typeof insertLayoutHistorySchema>;

// Configuration types
export type LayoutConfig = z.infer<typeof layoutConfigSchema>;
export type FieldConfig = z.infer<typeof fieldConfigSchema>;

// Module types supported
export const SUPPORTED_MODULES = [
  'customers',
  'favorecidos', 
  'tickets',
  'habilidades',
  'materials',
  'services',
  'locais'
] as const;

export type ModuleType = typeof SUPPORTED_MODULES[number];

// Page types supported
export const SUPPORTED_PAGE_TYPES = [
  'create',
  'edit', 
  'details',
  'list'
] as const;

export type PageType = typeof SUPPORTED_PAGE_TYPES[number];

// Field types supported
export const SUPPORTED_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'date',
  'datetime',
  'select',
  'multiselect',
  'checkbox',
  'radio',
  'file',
  'image',
  'currency',
  'percentage'
] as const;

export type FieldType = typeof SUPPORTED_FIELD_TYPES[number];
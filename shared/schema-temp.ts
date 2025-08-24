// ✅ TEMPORARY SCHEMA FOR QUICK SYSTEM STARTUP
// This file contains minimal definitions for all missing tables
// to allow the system to start while the full migration is completed

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  unique,
  time,
  bigint,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// MISSING TABLES - TEMPORARY DEFINITIONS  
// ========================================
// These are minimal definitions to resolve import errors
// Full implementations will be moved to schema-tenant.ts

// Approval Group Members table
export const approvalGroupMembers = pgTable("approval_group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  groupId: uuid("group_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: varchar("role", { length: 50 }).default("member"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("approval_group_members_tenant_group_idx").on(table.tenantId, table.groupId),
  index("approval_group_members_tenant_user_idx").on(table.tenantId, table.userId),
  unique("approval_group_members_unique").on(table.tenantId, table.groupId, table.userId),
]);

// Approval Groups table
export const approvalGroups = pgTable("approval_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: uuid("manager_id"),
  type: varchar("type", { length: 50 }).default("general"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("approval_groups_tenant_name_idx").on(table.tenantId, table.name),
  index("approval_groups_tenant_manager_idx").on(table.tenantId, table.managerId),
]);

// Approval Workflows table
export const approvalWorkflows = pgTable("approval_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  rules: jsonb("rules").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("approval_workflows_tenant_entity_idx").on(table.tenantId, table.entityType),
  index("approval_workflows_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Timecard Approval History table
export const timecardApprovalHistory = pgTable("timecard_approval_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  timecardId: uuid("timecard_id").notNull(),
  approverId: uuid("approver_id").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'approved', 'rejected', 'pending'
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecard_approval_history_tenant_timecard_idx").on(table.tenantId, table.timecardId),
  index("timecard_approval_history_tenant_approver_idx").on(table.tenantId, table.approverId),
  index("timecard_approval_history_status_idx").on(table.status),
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  data: jsonb("data").default({}),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notifications_tenant_user_idx").on(table.tenantId, table.userId),
  index("notifications_tenant_read_idx").on(table.tenantId, table.isRead),
  index("notifications_tenant_type_idx").on(table.tenantId, table.type),
]);

// Template Fields table  
export const templateFields = pgTable("template_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  templateId: uuid("template_id").notNull(),
  fieldName: varchar("field_name", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(),
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("template_fields_tenant_template_idx").on(table.tenantId, table.templateId),
  index("template_fields_tenant_name_idx").on(table.tenantId, table.fieldName),
]);

// Timecard Approval Settings table
export const timecardApprovalSettings = pgTable("timecard_approval_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id"),
  groupId: uuid("group_id"),
  requiresApproval: boolean("requires_approval").default(false),
  autoApprovalThreshold: decimal("auto_approval_threshold", { precision: 10, scale: 2 }),
  approvalLevels: jsonb("approval_levels").default([]),
  escalationRules: jsonb("escalation_rules").default({}),
  notificationSettings: jsonb("notification_settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecard_approval_settings_tenant_user_idx").on(table.tenantId, table.userId),
  index("timecard_approval_settings_tenant_group_idx").on(table.tenantId, table.groupId),
]);

// Activities table
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }).default("general"),
  color: varchar("color", { length: 7 }).default("#007bff"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("activities_tenant_name_idx").on(table.tenantId, table.name),
  index("activities_tenant_type_idx").on(table.tenantId, table.type),
]);

// Settings table
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value"),
  type: varchar("type", { length: 50 }).default("text"),
  description: text("description"),
  isSystem: boolean("is_system").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("settings_tenant_category_idx").on(table.tenantId, table.category),
  index("settings_tenant_key_idx").on(table.tenantId, table.key),
  unique("settings_tenant_category_key_unique").on(table.tenantId, table.category, table.key),
]);

// Files table
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }),
  uploadedBy: uuid("uploaded_by").notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("files_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
  index("files_tenant_uploader_idx").on(table.tenantId, table.uploadedBy),
  index("files_tenant_name_idx").on(table.tenantId, table.fileName),
]);

// Tags table
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#007bff"),
  description: text("description"),
  entityType: varchar("entity_type", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tags_tenant_name_idx").on(table.tenantId, table.name),
  index("tags_tenant_entity_idx").on(table.tenantId, table.entityType),
]);

// Contract SLAs table
export const contractSlas = pgTable("contract_slas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  target: decimal("target", { precision: 10, scale: 2 }),
  penalty: decimal("penalty", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contract_slas_tenant_contract_idx").on(table.tenantId, table.contractId),
]);

// Contract Services table
export const contractServices = pgTable("contract_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contract_services_tenant_contract_idx").on(table.tenantId, table.contractId),
]);

// Contract Documents table
export const contractDocuments = pgTable("contract_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }),
  uploadedBy: uuid("uploaded_by").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contract_documents_tenant_contract_idx").on(table.tenantId, table.contractId),
]);

// Contract Renewals table
export const contractRenewals = pgTable("contract_renewals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  renewalDate: date("renewal_date").notNull(),
  newEndDate: date("new_end_date"),
  renewalType: varchar("renewal_type", { length: 50 }).default("automatic"),
  status: varchar("status", { length: 50 }).default("pending"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contract_renewals_tenant_contract_idx").on(table.tenantId, table.contractId),
]);

// Contract Billing table
export const contractBilling = pgTable("contract_billing", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  billingPeriod: varchar("billing_period", { length: 50 }).default("monthly"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  billingDate: date("billing_date"),
  dueDate: date("due_date"),
  status: varchar("status", { length: 50 }).default("pending"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contract_billing_tenant_contract_idx").on(table.tenantId, table.contractId),
]);

// Contract Equipment table
export const contractEquipment = pgTable("contract_equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }),
  serialNumber: varchar("serial_number", { length: 255 }),
  quantity: integer("quantity").default(1),
  status: varchar("status", { length: 50 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contract_equipment_tenant_contract_idx").on(table.tenantId, table.contractId),
]);

// Ticket Field Configurations table
export const ticketFieldConfigurations = pgTable("ticket_field_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  fieldName: varchar("field_name", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(),
  isRequired: boolean("is_required").default(false),
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  validation: jsonb("validation").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_field_configurations_tenant_field_idx").on(table.tenantId, table.fieldName),
  unique("ticket_field_configurations_tenant_field_unique").on(table.tenantId, table.fieldName),
]);

// Ticket Field Options table
export const ticketFieldOptions = pgTable("ticket_field_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  fieldConfigurationId: uuid("field_configuration_id").notNull(),
  optionValue: varchar("option_value", { length: 255 }).notNull(),
  optionLabel: varchar("option_label", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_field_options_tenant_config_idx").on(table.tenantId, table.fieldConfigurationId),
]);

// Ticket Style Configurations table
export const ticketStyleConfigurations = pgTable("ticket_style_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  cssVariables: jsonb("css_variables").default({}),
  customCSS: text("custom_css"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_style_configurations_tenant_name_idx").on(table.tenantId, table.name),
  index("ticket_style_configurations_tenant_default_idx").on(table.tenantId, table.isDefault),
]);

// Ticket Default Configurations table
export const ticketDefaultConfigurations = pgTable("ticket_default_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  configType: varchar("config_type", { length: 100 }).notNull(),
  configKey: varchar("config_key", { length: 255 }).notNull(),
  configValue: text("config_value"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_default_configurations_tenant_type_idx").on(table.tenantId, table.configType),
  index("ticket_default_configurations_tenant_key_idx").on(table.tenantId, table.configKey),
  unique("ticket_default_configurations_tenant_type_key_unique").on(table.tenantId, table.configType, table.configKey),
]);

// Assets table
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assetType: varchar("asset_type", { length: 100 }).notNull(),
  model: varchar("model", { length: 255 }),
  serialNumber: varchar("serial_number", { length: 255 }),
  purchaseDate: date("purchase_date"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"),
  assignedTo: uuid("assigned_to"),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("assets_tenant_name_idx").on(table.tenantId, table.name),
  index("assets_tenant_type_idx").on(table.tenantId, table.assetType),
  index("assets_tenant_status_idx").on(table.tenantId, table.status),
  index("assets_tenant_assigned_idx").on(table.tenantId, table.assignedTo),
  index("assets_tenant_serial_idx").on(table.tenantId, table.serialNumber),
]);

// Ticket Consumed Items table
export const ticketConsumedItems = pgTable("ticket_consumed_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  itemId: uuid("item_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  consumedBy: uuid("consumed_by").notNull(),
  consumedAt: timestamp("consumed_at").defaultNow(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_consumed_items_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_consumed_items_tenant_item_idx").on(table.tenantId, table.itemId),
  index("ticket_consumed_items_tenant_consumed_by_idx").on(table.tenantId, table.consumedBy),
]);

// Ticket Planned Items table
export const ticketPlannedItems = pgTable("ticket_planned_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  itemId: uuid("item_id").notNull(),
  plannedQuantity: decimal("planned_quantity", { precision: 10, scale: 3 }).notNull(),
  estimatedUnitPrice: decimal("estimated_unit_price", { precision: 10, scale: 2 }),
  estimatedTotalPrice: decimal("estimated_total_price", { precision: 10, scale: 2 }),
  plannedBy: uuid("planned_by").notNull(),
  plannedAt: timestamp("planned_at").defaultNow(),
  status: varchar("status", { length: 50 }).default("planned"), // planned, approved, consumed, cancelled
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_planned_items_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_planned_items_tenant_item_idx").on(table.tenantId, table.itemId),
  index("ticket_planned_items_tenant_planned_by_idx").on(table.tenantId, table.plannedBy),
  index("ticket_planned_items_tenant_status_idx").on(table.tenantId, table.status),
]);

// Item Attachments table
export const itemAttachments = pgTable("item_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 255 }),
  uploadedBy: uuid("uploaded_by").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("item_attachments_tenant_item_idx").on(table.tenantId, table.itemId),
  index("item_attachments_tenant_uploaded_idx").on(table.tenantId, table.uploadedBy),
]);

// Item Links table
export const itemLinks = pgTable("item_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  linkedItemId: uuid("linked_item_id").notNull(),
  linkType: varchar("link_type", { length: 50 }).default("related"), // related, replacement, upgrade, etc
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("item_links_tenant_item_idx").on(table.tenantId, table.itemId),
  index("item_links_tenant_linked_idx").on(table.tenantId, table.linkedItemId),
]);

// Item Customer Links table
export const itemCustomerLinks = pgTable("item_customer_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  customerPartNumber: varchar("customer_part_number", { length: 255 }),
  preferredPrice: decimal("preferred_price", { precision: 10, scale: 2 }),
  isPreferred: boolean("is_preferred").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("item_customer_links_tenant_item_idx").on(table.tenantId, table.itemId),
  index("item_customer_links_tenant_customer_idx").on(table.tenantId, table.customerId),
]);

// Item Supplier Links table
export const itemSupplierLinks = pgTable("item_supplier_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  supplierId: uuid("supplier_id").notNull(),
  supplierPartNumber: varchar("supplier_part_number", { length: 255 }),
  supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }),
  leadTime: integer("lead_time"), // in days
  minimumOrderQuantity: decimal("minimum_order_quantity", { precision: 10, scale: 3 }),
  isPreferred: boolean("is_preferred").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("item_supplier_links_tenant_item_idx").on(table.tenantId, table.itemId),
  index("item_supplier_links_tenant_supplier_idx").on(table.tenantId, table.supplierId),
]);

// Customer Item Mappings table
export const customerItemMappings = pgTable("customer_item_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  itemId: uuid("item_id").notNull(),
  customerItemCode: varchar("customer_item_code", { length: 255 }),
  customerItemName: varchar("customer_item_name", { length: 255 }),
  mapping: jsonb("mapping").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("customer_item_mappings_tenant_customer_idx").on(table.tenantId, table.customerId),
  index("customer_item_mappings_tenant_item_idx").on(table.tenantId, table.itemId),
  unique("customer_item_mappings_unique").on(table.tenantId, table.customerId, table.itemId),
]);

// ========================================
// SCHEMA VALIDATION & TYPES  
// ========================================

// Insert schemas
export const insertApprovalGroupMemberSchema = createInsertSchema(approvalGroupMembers);
export const insertApprovalGroupSchema = createInsertSchema(approvalGroups);
export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows);
export const insertTimecardApprovalHistorySchema = createInsertSchema(timecardApprovalHistory);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertTemplateFieldSchema = createInsertSchema(templateFields);
export const insertTimecardApprovalSettingSchema = createInsertSchema(timecardApprovalSettings);
export const insertActivitySchema = createInsertSchema(activities);
export const insertSettingSchema = createInsertSchema(settings);
export const insertFileSchema = createInsertSchema(files);
export const insertTagSchema = createInsertSchema(tags);
export const insertContractSlaSchema = createInsertSchema(contractSlas);
export const insertContractServiceSchema = createInsertSchema(contractServices);
export const insertContractDocumentSchema = createInsertSchema(contractDocuments);
export const insertContractRenewalSchema = createInsertSchema(contractRenewals);
export const insertContractBillingSchema = createInsertSchema(contractBilling);
export const insertContractEquipmentSchema = createInsertSchema(contractEquipment);
export const insertTicketFieldConfigurationSchema = createInsertSchema(ticketFieldConfigurations);
export const insertTicketFieldOptionSchema = createInsertSchema(ticketFieldOptions);
export const insertTicketStyleConfigurationSchema = createInsertSchema(ticketStyleConfigurations);
export const insertTicketDefaultConfigurationSchema = createInsertSchema(ticketDefaultConfigurations);
export const insertAssetSchema = createInsertSchema(assets);
export const insertTicketConsumedItemSchema = createInsertSchema(ticketConsumedItems);
export const insertTicketPlannedItemSchema = createInsertSchema(ticketPlannedItems);
export const insertItemAttachmentSchema = createInsertSchema(itemAttachments);
export const insertItemLinkSchema = createInsertSchema(itemLinks);
export const insertItemCustomerLinkSchema = createInsertSchema(itemCustomerLinks);
export const insertItemSupplierLinkSchema = createInsertSchema(itemSupplierLinks);
export const insertCustomerItemMappingSchema = createInsertSchema(customerItemMappings);

// Types
export type ApprovalGroupMember = typeof approvalGroupMembers.$inferSelect;
export type InsertApprovalGroupMember = z.infer<typeof insertApprovalGroupMemberSchema>;
export type ApprovalGroup = typeof approvalGroups.$inferSelect;
export type InsertApprovalGroup = z.infer<typeof insertApprovalGroupSchema>;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type TimecardApprovalHistory = typeof timecardApprovalHistory.$inferSelect;
export type InsertTimecardApprovalHistory = z.infer<typeof insertTimecardApprovalHistorySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type TemplateField = typeof templateFields.$inferSelect;
export type InsertTemplateField = z.infer<typeof insertTemplateFieldSchema>;
export type TimecardApprovalSetting = typeof timecardApprovalSettings.$inferSelect;
export type InsertTimecardApprovalSetting = z.infer<typeof insertTimecardApprovalSettingSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type ContractSla = typeof contractSlas.$inferSelect;
export type InsertContractSla = z.infer<typeof insertContractSlaSchema>;
export type ContractService = typeof contractServices.$inferSelect;
export type InsertContractService = z.infer<typeof insertContractServiceSchema>;
export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractDocument = z.infer<typeof insertContractDocumentSchema>;
export type ContractRenewal = typeof contractRenewals.$inferSelect;
export type InsertContractRenewal = z.infer<typeof insertContractRenewalSchema>;
export type ContractBilling = typeof contractBilling.$inferSelect;
export type InsertContractBilling = z.infer<typeof insertContractBillingSchema>;
export type ContractEquipment = typeof contractEquipment.$inferSelect;
export type InsertContractEquipment = z.infer<typeof insertContractEquipmentSchema>;
export type TicketFieldConfiguration = typeof ticketFieldConfigurations.$inferSelect;
export type InsertTicketFieldConfiguration = z.infer<typeof insertTicketFieldConfigurationSchema>;
export type TicketFieldOption = typeof ticketFieldOptions.$inferSelect;
export type InsertTicketFieldOption = z.infer<typeof insertTicketFieldOptionSchema>;
export type TicketStyleConfiguration = typeof ticketStyleConfigurations.$inferSelect;
export type InsertTicketStyleConfiguration = z.infer<typeof insertTicketStyleConfigurationSchema>;
export type TicketDefaultConfiguration = typeof ticketDefaultConfigurations.$inferSelect;
export type InsertTicketDefaultConfiguration = z.infer<typeof insertTicketDefaultConfigurationSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type TicketConsumedItem = typeof ticketConsumedItems.$inferSelect;
export type InsertTicketConsumedItem = z.infer<typeof insertTicketConsumedItemSchema>;
export type TicketPlannedItem = typeof ticketPlannedItems.$inferSelect;
export type InsertTicketPlannedItem = z.infer<typeof insertTicketPlannedItemSchema>;
export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type InsertItemAttachment = z.infer<typeof insertItemAttachmentSchema>;
export type ItemLink = typeof itemLinks.$inferSelect;
export type InsertItemLink = z.infer<typeof insertItemLinkSchema>;
export type ItemCustomerLink = typeof itemCustomerLinks.$inferSelect;
export type InsertItemCustomerLink = z.infer<typeof insertItemCustomerLinkSchema>;
export type ItemSupplierLink = typeof itemSupplierLinks.$inferSelect;
export type InsertItemSupplierLink = z.infer<typeof insertItemSupplierLinkSchema>;
export type CustomerItemMapping = typeof customerItemMappings.$inferSelect;
export type InsertCustomerItemMapping = z.infer<typeof insertCustomerItemMappingSchema>;
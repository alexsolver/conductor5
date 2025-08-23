// ✅ 1QA.MD COMPLIANCE: UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source
// CRITICAL: Este arquivo é a fonte única para imports em todo o sistema

// Import Drizzle essentials FIRST
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';

// Re-export all schema definitions - avoiding conflicts
export * from "./schema-master";

// Reports & Dashboards Module Schema
export * from "./schema-reports";

// GDPR Compliance Module Schema - Clean Version
export * from "./schema-gdpr-compliance-clean";

// Knowledge Base Module Schema - Clean Architecture
export * from "./schema-knowledge-base";

// Interactive Map Module Schema - Clean Architecture
export * from "./schema-interactive-map";

// Selective export from contracts to avoid conflicts - Export only enums
export {
  contractTypeEnum,
  contractStatusEnum,
  contractPriorityEnum,
  documentTypeEnum,
  accessLevelEnum,
  signatureStatusEnum,
  measurementPeriodEnum,
  billingCycleEnum,
  paymentStatusEnum,
  renewalTypeEnum,
  equipmentStatusEnum,
} from "./schema-contracts";

// ✅ DRIZZLE ORM SETUP - 1QA.MD PATTERNS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 50 : 20,
  min: process.env.NODE_ENV === 'production' ? 5 : 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Import all schema definitions for drizzle connection
import * as schemaDefinitions from "./schema-master";

// Export essentials for universal access
export const db = drizzle({ client: pool, schema: schemaDefinitions });
export { sql, pool };

// Selective exports from materials-services to avoid conflicts with schema-master
export {
  itemTypeEnum,
  measurementUnitEnum,
  itemStatusEnum,
  movementTypeEnum,
  linkTypeEnum,
  itemAttachments,
  itemGroups,
  itemGroupMemberships,
  itemHierarchy,
  bulkItemOperations,
  itemCustomerLinks,
  itemSupplierLinks,
  stockLocations,
  stockLevels,
  stockMovements,
  suppliers,
  supplierCatalog,
  serviceTypes,
  serviceExecution,
  assetMovements,
  assetMaintenance,
  assetMeters,
  priceLists,
  priceListItems,
  priceListVersions,
  pricingRules,
  dynamicPricing,
  materialCertifications,
  complianceAudits,
  complianceAlerts,
  complianceCertifications,
  complianceEvidence,
  complianceScores,
  systemSettings,
  // Relations
  itemsRelations,
  itemGroupsRelations,
  itemGroupMembershipsRelations,
  itemHierarchyRelations,
  stockLocationsRelations,
  suppliersRelations,
  priceListsRelations
} from "./schema-materials-services";

// Validation: Ensure all critical exports are available
import type {
  User, Customer, Ticket, Tenant, Company, Beneficiary,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule,
  CustomerItemMapping, InsertCustomerItemMapping
} from "./schema-master";

// User Notification Preferences - Re-export from notifications schema per 1qa.md
export {
  userNotificationPreferences,
  insertUserNotificationPreferencesSchema
} from "./schema-notifications";

// Re-export all types for consistency
export type {
  User, Customer, Ticket, Tenant, Company, Beneficiary,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule,
  CustomerItemMapping, InsertCustomerItemMapping
};

// User Notification Preferences types from notifications schema
export type {
  UserNotificationPreferences,
  InsertUserNotificationPreferences
} from "./schema-notifications";

// This file serves as the single entry point for all schema definitions
// All imports should use: import { ... } from '@shared/schema'

// CRITICAL FIX: Remove duplicate tickets definition
// The tickets table is properly defined in schema-master.ts
// This redundant definition was causing schema conflicts

// Removed duplicate userNotificationPreferences table - using the one from schema-notifications.ts per 1qa.md

// Export all tables for migrations - using selective exports to avoid conflicts
export * from './schema-field-layout';
export * from './schema-notifications';

// Selective export from schema-sla to avoid queryOperatorEnum conflict with schema-master
// TEMPORARILY COMMENTED TO FIX MODULE LOADING ISSUE - WILL RE-ENABLE ONCE SYSTEM IS STABLE
// export {
//   slaDefinitions,
//   slaWorkflows,
//   slaWorkflowExecutions,
//   slaInstances,
//   slaEvents,
//   slaViolations,
//   slaReports,
//   insertSlaDefinitionSchema,
//   insertSlaInstanceSchema,
//   insertSlaEventSchema,
//   insertSlaViolationSchema,
//   insertSlaReportSchema,
//   SlaDefinition,
//   InsertSlaDefinition,
//   SlaInstance,
//   InsertSlaInstance,
//   SlaEvent,
//   InsertSlaEvent,
//   SlaViolation,
//   InsertSlaViolation,
//   SlaReport,
//   InsertSlaReport
// } from './schema-sla';

// Selective exports from locations to avoid conflicts
export {
  locationTypeEnum,
  geometryTypeEnum,
  locationStatusEnum,
  segmentTypeEnum,
  areaTypeEnum,
  routeTypeEnum,
  difficultyLevelEnum,
  serviceLevelEnum,
  securityLevelEnum,
  accessTypeEnum,
  membershipTypeEnum,
  groupTypeEnum,
  locations as geoLocations,
  locationSegments,
  locationAreas,
  locationRoutes,
  areaGroups,
  locationAreaMemberships,
  insertLocationSchema as insertGeoLocationSchema,
  insertLocationSegmentSchema,
  insertLocationAreaSchema,
  insertLocationRouteSchema,
  insertAreaGroupSchema,
  businessHoursSchema,
  accessRequirementsSchema,
  slaConfigSchema
} from './schema-locations';

// OmniBridge tables
import { pgTable, varchar, timestamp, jsonb, text, integer, boolean, uuid, json, unique } from 'drizzle-orm/pg-core';

export const omnibridgeChannels = pgTable('omnibridge_channels', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  integrationId: varchar('integration_id', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('inactive'),
  config: jsonb('config').default({}),
  features: jsonb('features').default([]),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  lastSync: timestamp('last_sync'),
  metrics: jsonb('metrics').default({}),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeMessages = pgTable('omnibridge_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  channelId: varchar('channel_id', { length: 36 }).notNull(),
  channelType: varchar('channel_type', { length: 50 }).notNull(),
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  subject: text('subject'),
  content: text('content'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('unread'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  tags: jsonb('tags').default([]),
  attachments: integer('attachments').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeChatbots = pgTable('omnibridge_chatbots', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  configuration: jsonb('configuration').default({}),
  isEnabled: boolean('is_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 36 }),
  updatedBy: varchar('updated_by', { length: 36 })
});

// ✅ 1QA.MD: Custom Fields table definition
export const customFields = pgTable('custom_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  moduleType: varchar('module_type', { length: 50 }).notNull(), // customers, tickets, beneficiaries, etc.
  fieldName: varchar('field_name', { length: 100 }).notNull(), // Technical name for the field
  fieldType: varchar('field_type', { length: 50 }).notNull(), // text, number, select, etc.
  fieldLabel: varchar('field_label', { length: 200 }).notNull(), // Display name for the field
  isRequired: boolean('is_required').default(false).notNull(),
  validationRules: json('validation_rules'),
  fieldOptions: json('field_options'), // For select/multiselect fields
  placeholder: varchar('placeholder', { length: 500 }),
  defaultValue: varchar('default_value', { length: 500 }),
  displayOrder: integer('display_order').default(0).notNull(),
  helpText: text('help_text'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
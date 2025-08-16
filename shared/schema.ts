// UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source

export * from "./schema-master";

// Selective exports from materials-services to avoid conflicts
export {
  itemTypeEnum,
  measurementUnitEnum,
  itemStatusEnum,
  movementTypeEnum,
  assetStatusEnum,
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
  assets,
  assetMovements,
  assetMaintenance,
  assetMeters,
  priceLists,
  priceListItems,
  priceListVersions,
  pricingRules,
  dynamicPricing,
  auditLogs,
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
  assetsRelations,
  priceListsRelations
} from "./schema-materials-services";

// Validation: Ensure all critical exports are available
import type {
  User, Customer, Ticket, Tenant, Company, Beneficiary,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule,
  CustomerItemMapping, InsertCustomerItemMapping
} from "./schema-master";

// Re-export all types for consistency
export type {
  User, Customer, Ticket, Tenant, Company, Beneficiary,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule,
  CustomerItemMapping, InsertCustomerItemMapping
};

// This file serves as the single entry point for all schema definitions
// All imports should use: import { ... } from '@shared/schema'

// CRITICAL FIX: Remove duplicate tickets definition
// The tickets table is properly defined in schema-master.ts
// This redundant definition was causing schema conflicts

// Export all tables for migrations
export * from './schema-master';
export * from './schema-materials-services';
export * from './schema-field-layout';
export * from './schema-notifications';

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
import { pgTable, varchar, timestamp, jsonb, text, integer, boolean } from 'drizzle-orm/pg-core';

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


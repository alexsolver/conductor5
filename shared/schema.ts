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

import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './schema-master'; // Assuming tenants are defined here
import { customers } from './schema-master'; // Assuming customers are defined here
import { users } from './schema-master'; // Assuming users are defined here
import { companies } from './schema-master'; // Assuming companies are defined here

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  number: varchar('number', { length: 50 }),
  subject: varchar('subject', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('open'),
  priority: varchar('priority', { length: 50 }).default('medium'),
  urgency: varchar('urgency', { length: 50 }),
  impact: varchar('impact', { length: 50 }),
  category: varchar('category', { length: 100 }),
  subcategory: varchar('subcategory', { length: 100 }),
  callerId: uuid('caller_id').references(() => customers.id),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  customerCompanyId: uuid('customer_company_id').references(() => companies.id),
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
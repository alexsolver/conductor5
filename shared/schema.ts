// UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source

// Re-export everything from schema-master as the single source of truth
module.exports = require('./schema-master');

// Garantir que tickets está sendo exportado corretamente
import { tickets as ticketsTable } from "./schema-master";
export { ticketsTable as tickets };

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
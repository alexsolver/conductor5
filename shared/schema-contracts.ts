// ✅ 1QA.MD COMPLIANCE: CONTRACT MANAGEMENT SCHEMA
// Clean Architecture - Database Schema following exact patterns from schema-master.ts

import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, date, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ✅ ENUMS - Matching requirements exactly
export const contractTypeEnum = pgEnum('contract_type', [
  'service', 'supply', 'maintenance', 'rental', 'sla'
]);

export const contractStatusEnum = pgEnum('contract_status', [
  'draft', 'analysis', 'approved', 'active', 'finished', 'canceled'
]);

export const contractPriorityEnum = pgEnum('contract_priority', [
  'low', 'medium', 'high', 'critical', 'emergency'
]);

export const documentTypeEnum = pgEnum('document_type', [
  'contract', 'addendum', 'proposal', 'invoice', 'receipt', 'certificate'
]);

export const accessLevelEnum = pgEnum('access_level', [
  'internal', 'client', 'public'
]);

export const signatureStatusEnum = pgEnum('signature_status', [
  'pending', 'signed', 'rejected', 'expired'
]);

export const slaTypeEnum = pgEnum('sla_type', [
  'response_time', 'resolution_time', 'availability', 'performance'
]);

export const measurementPeriodEnum = pgEnum('measurement_period', [
  'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
]);

export const billingCycleEnum = pgEnum('billing_cycle', [
  'monthly', 'quarterly', 'semi_annual', 'annual', 'one_time'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'paid', 'overdue', 'canceled'
]);

export const renewalTypeEnum = pgEnum('renewal_type', [
  'automatic', 'manual', 'negotiated'
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending', 'approved', 'rejected'
]);

export const equipmentStatusEnum = pgEnum('equipment_status', [
  'active', 'maintenance', 'inactive', 'retired'
]);

// ✅ MAIN CONTRACTS TABLE
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractNumber: varchar("contract_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  contractType: contractTypeEnum("contract_type").notNull(),
  status: contractStatusEnum("status").default('draft'),
  priority: contractPriorityEnum("priority").default('medium'),
  customerCompanyId: uuid("customer_company_id"), // References customer_companies
  managerId: uuid("manager_id"), // References users
  technicalManagerId: uuid("technical_manager_id"), // References users
  locationId: uuid("location_id"), // References locations
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  renewalDate: date("renewal_date"),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }),
  monthlyValue: decimal("monthly_value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default('BRL'),
  paymentTerms: integer("payment_terms"), // Days
  description: text("description"),
  termsConditions: text("terms_conditions"),
  autoRenewal: boolean("auto_renewal").default(false),
  renewalPeriodMonths: integer("renewal_period_months"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: uuid("created_by_id"), // References users
  updatedById: uuid("updated_by_id"), // References users
  isActive: boolean("is_active").default(true)
});

// ✅ CONTRACT DOCUMENTS
export const contractDocuments = pgTable("contract_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  documentName: varchar("document_name", { length: 255 }).notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  versionNumber: integer("version_number").default(1),
  isCurrentVersion: boolean("is_current_version").default(true),
  description: text("description"),
  accessLevel: accessLevelEnum("access_level").default('internal'),
  requiresSignature: boolean("requires_signature").default(false),
  signatureStatus: signatureStatusEnum("signature_status"),
  uploadedById: uuid("uploaded_by_id"), // References users
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true)
});

// ✅ CONTRACT SLAs
export const contractSlas = pgTable("contract_slas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  slaName: varchar("sla_name", { length: 255 }).notNull(),
  slaType: slaTypeEnum("sla_type").notNull(),
  serviceDescription: text("service_description"),
  targetResolutionTime: integer("target_resolution_time"), // in minutes
  escalationTime: integer("escalation_time"), // in minutes
  penaltyPercentage: decimal("penalty_percentage", { precision: 5, scale: 2 }),
  penaltyAmount: decimal("penalty_amount", { precision: 15, scale: 2 }),
  measurementPeriod: measurementPeriodEnum("measurement_period"),
  availabilityTarget: decimal("availability_target", { precision: 5, scale: 2 }),
  performanceTarget: decimal("performance_target", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// ✅ CONTRACT BILLING
export const contractBilling = pgTable("contract_billing", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  billingCycle: billingCycleEnum("billing_cycle"),
  billingDay: integer("billing_day"),
  billingPeriodStart: date("billing_period_start"),
  billingPeriodEnd: date("billing_period_end"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('BRL'),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  dueDate: date("due_date"),
  paymentStatus: paymentStatusEnum("payment_status").default('pending'),
  paymentDate: date("payment_date"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  generatedById: uuid("generated_by_id"), // References users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ✅ CONTRACT RENEWALS
export const contractRenewals = pgTable("contract_renewals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  renewalType: renewalTypeEnum("renewal_type"),
  renewalDate: date("renewal_date").notNull(),
  newEndDate: date("new_end_date").notNull(),
  newValue: decimal("new_value", { precision: 15, scale: 2 }),
  valueAdjustmentPercentage: decimal("value_adjustment_percentage", { precision: 5, scale: 2 }),
  termsChanges: text("terms_changes"),
  approvalStatus: approvalStatusEnum("approval_status").default('pending'),
  approvedById: uuid("approved_by_id"), // References users
  approvalDate: date("approval_date"),
  notes: text("notes"),
  requestedById: uuid("requested_by_id"), // References users
  createdAt: timestamp("created_at").defaultNow()
});

// ✅ CONTRACT EQUIPMENT
export const contractEquipment = pgTable("contract_equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").notNull(),
  equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
  equipmentType: varchar("equipment_type", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  model: varchar("model", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 100 }),
  warrantyStartDate: date("warranty_start_date"),
  warrantyEndDate: date("warranty_end_date"),
  maintenanceSchedule: text("maintenance_schedule"),
  location: varchar("location", { length: 255 }),
  status: equipmentStatusEnum("status").default('active'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true)
});

// ✅ RELATIONS - Following schema-master.ts patterns
export const contractsRelations = relations(contracts, ({ many, one }) => ({
  documents: many(contractDocuments),
  slas: many(contractSlas),
  billing: many(contractBilling),
  renewals: many(contractRenewals),
  equipment: many(contractEquipment)
}));

export const contractDocumentsRelations = relations(contractDocuments, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractDocuments.contractId],
    references: [contracts.id]
  })
}));

export const contractSlasRelations = relations(contractSlas, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractSlas.contractId],
    references: [contracts.id]
  })
}));

export const contractBillingRelations = relations(contractBilling, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractBilling.contractId],
    references: [contracts.id]
  })
}));

export const contractRenewalsRelations = relations(contractRenewals, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractRenewals.contractId],
    references: [contracts.id]
  })
}));

export const contractEquipmentRelations = relations(contractEquipment, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractEquipment.contractId],
    references: [contracts.id]
  })
}));

// ✅ ZOD SCHEMAS - Following 1qa.md patterns
export const insertContractSchema = createInsertSchema(contracts);
export const selectContractSchema = createSelectSchema(contracts);
export const insertContractDocumentSchema = createInsertSchema(contractDocuments);
export const selectContractDocumentSchema = createSelectSchema(contractDocuments);
export const insertContractSlaSchema = createInsertSchema(contractSlas);
export const selectContractSlaSchema = createSelectSchema(contractSlas);
export const insertContractBillingSchema = createInsertSchema(contractBilling);
export const selectContractBillingSchema = createSelectSchema(contractBilling);
export const insertContractRenewalSchema = createInsertSchema(contractRenewals);
export const selectContractRenewalSchema = createSelectSchema(contractRenewals);
export const insertContractEquipmentSchema = createInsertSchema(contractEquipment);
export const selectContractEquipmentSchema = createSelectSchema(contractEquipment);

// ✅ TYPES
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;
export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractDocument = typeof contractDocuments.$inferInsert;
export type ContractSla = typeof contractSlas.$inferSelect;
export type InsertContractSla = typeof contractSlas.$inferInsert;
export type ContractBilling = typeof contractBilling.$inferSelect;
export type InsertContractBilling = typeof contractBilling.$inferInsert;
export type ContractRenewal = typeof contractRenewals.$inferSelect;
export type InsertContractRenewal = typeof contractRenewals.$inferInsert;
export type ContractEquipment = typeof contractEquipment.$inferSelect;
export type InsertContractEquipment = typeof contractEquipment.$inferInsert;
/**
 * CONTRACT MANAGEMENT MODULE - SCHEMA DEFINITIONS
 * ✅ 1QA.MD COMPLIANCE: Pure Drizzle ORM without @neondatabase/serverless
 * ✅ CLEAN ARCHITECTURE: Domain-driven schema design
 * ✅ MULTI-TENANT: Schema isolation via tenant_id
 */

import { pgTable, varchar, uuid, timestamp, text, decimal, boolean, integer, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ENUMs para tipos de contratos
export const contractTypeEnum = pgEnum('contract_type_enum', ['service', 'supply', 'maintenance', 'rental', 'sla']);
export const contractStatusEnum = pgEnum('contract_status_enum', ['draft', 'analysis', 'approved', 'active', 'terminated']);
export const priorityEnum = pgEnum('priority_enum', ['low', 'medium', 'high', 'critical', 'emergency']);
export const documentTypeEnum = pgEnum('document_type_enum', ['contract', 'addendum', 'proposal', 'invoice', 'receipt']);
export const accessLevelEnum = pgEnum('access_level_enum', ['internal', 'client', 'public']);
export const signatureStatusEnum = pgEnum('signature_status_enum', ['pending', 'signed', 'rejected']);
export const slaTypeEnum = pgEnum('sla_type_enum', ['availability', 'response_time', 'resolution_time', 'performance']);
export const measurementPeriodEnum = pgEnum('measurement_period_enum', ['daily', 'weekly', 'monthly', 'quarterly']);
export const billingCycleEnum = pgEnum('billing_cycle_enum', ['monthly', 'quarterly', 'annually', 'one_time']);
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending', 'paid', 'overdue', 'cancelled']);
export const renewalTypeEnum = pgEnum('renewal_type_enum', ['automatic', 'manual', 'negotiated']);
export const approvalStatusEnum = pgEnum('approval_status_enum', ['pending', 'approved', 'rejected']);
export const equipmentStatusEnum = pgEnum('equipment_status_enum', ['active', 'inactive', 'maintenance', 'decommissioned']);

// Tabela principal de contratos
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractNumber: varchar('contract_number', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  contractType: contractTypeEnum('contract_type').notNull(),
  status: contractStatusEnum('status').notNull().default('draft'),
  priority: priorityEnum('priority').notNull().default('medium'),
  customerCompanyId: uuid('customer_company_id'),
  managerId: uuid('manager_id').notNull(),
  technicalManagerId: uuid('technical_manager_id'),
  locationId: uuid('location_id'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  renewalDate: date('renewal_date'),
  totalValue: decimal('total_value', { precision: 15, scale: 2 }).notNull().default('0'),
  monthlyValue: decimal('monthly_value', { precision: 15, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('BRL'),
  paymentTerms: integer('payment_terms').default(30),
  description: text('description'),
  termsConditions: text('terms_conditions'),
  autoRenewal: boolean('auto_renewal').default(false),
  renewalPeriodMonths: integer('renewal_period_months').default(12),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull(),
  updatedById: uuid('updated_by_id').notNull(),
  isActive: boolean('is_active').notNull().default(true)
});

// Tabela de documentos de contratos
export const contractDocuments = pgTable('contract_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id').notNull(),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  fileName: varchar('file_name', { length: 255 }),
  filePath: text('file_path'),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  versionNumber: integer('version_number').default(1),
  isCurrentVersion: boolean('is_current_version').default(true),
  description: text('description'),
  accessLevel: accessLevelEnum('access_level').default('internal'),
  requiresSignature: boolean('requires_signature').default(false),
  signatureStatus: signatureStatusEnum('signature_status').default('pending'),
  uploadedById: uuid('uploaded_by_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  isActive: boolean('is_active').default(true)
});

// Tabela de SLAs de contratos
export const contractSlas = pgTable('contract_slas', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id').notNull(),
  slaName: varchar('sla_name', { length: 255 }).notNull(),
  slaType: slaTypeEnum('sla_type').notNull(),
  serviceDescription: text('service_description'),
  targetResolutionTime: integer('target_resolution_time'), // em minutos
  escalationTime: integer('escalation_time'),
  penaltyPercentage: decimal('penalty_percentage', { precision: 5, scale: 2 }),
  penaltyAmount: decimal('penalty_amount', { precision: 15, scale: 2 }),
  measurementPeriod: measurementPeriodEnum('measurement_period').notNull().default('monthly'),
  availabilityTarget: decimal('availability_target', { precision: 5, scale: 2 }),
  performanceTarget: decimal('performance_target', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Tabela de faturamento de contratos
export const contractBilling = pgTable('contract_billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id').notNull(),
  billingCycle: billingCycleEnum('billing_cycle').notNull(),
  billingDay: integer('billing_day').default(1),
  billingPeriodStart: date('billing_period_start').notNull(),
  billingPeriodEnd: date('billing_period_end').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  dueDate: date('due_date').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  paymentDate: date('payment_date'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  notes: text('notes'),
  generatedById: uuid('generated_by_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabela de renovações de contratos
export const contractRenewals = pgTable('contract_renewals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id').notNull(),
  renewalType: renewalTypeEnum('renewal_type').notNull(),
  renewalDate: date('renewal_date').notNull(),
  newEndDate: date('new_end_date').notNull(),
  newValue: decimal('new_value', { precision: 15, scale: 2 }),
  valueAdjustmentPercentage: decimal('value_adjustment_percentage', { precision: 5, scale: 2 }),
  termsChanges: text('terms_changes'),
  approvalStatus: approvalStatusEnum('approval_status').default('pending'),
  approvedById: uuid('approved_by_id'),
  approvalDate: date('approval_date'),
  notes: text('notes'),
  requestedById: uuid('requested_by_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Tabela de equipamentos de contratos
export const contractEquipment = pgTable('contract_equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id').notNull(),
  equipmentName: varchar('equipment_name', { length: 255 }).notNull(),
  equipmentType: varchar('equipment_type', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  model: varchar('model', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  warrantyStartDate: date('warranty_start_date'),
  warrantyEndDate: date('warranty_end_date'),
  maintenanceSchedule: text('maintenance_schedule'),
  location: varchar('location', { length: 255 }),
  status: equipmentStatusEnum('status').default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  isActive: boolean('is_active').default(true)
});

// Schemas Zod para validação
export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const selectContractSchema = createSelectSchema(contracts);

export const insertContractDocumentSchema = createInsertSchema(contractDocuments).omit({
  id: true,
  createdAt: true
});

export const insertContractSlaSchema = createInsertSchema(contractSlas).omit({
  id: true,
  createdAt: true
});

export const insertContractBillingSchema = createInsertSchema(contractBilling).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContractRenewalSchema = createInsertSchema(contractRenewals).omit({
  id: true,
  createdAt: true
});

export const insertContractEquipmentSchema = createInsertSchema(contractEquipment).omit({
  id: true,
  createdAt: true
});

// Tipos TypeScript
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractDocument = z.infer<typeof insertContractDocumentSchema>;
export type ContractSla = typeof contractSlas.$inferSelect;
export type InsertContractSla = z.infer<typeof insertContractSlaSchema>;
export type ContractBilling = typeof contractBilling.$inferSelect;
export type InsertContractBilling = z.infer<typeof insertContractBillingSchema>;
export type ContractRenewal = typeof contractRenewals.$inferSelect;
export type InsertContractRenewal = z.infer<typeof insertContractRenewalSchema>;
export type ContractEquipment = typeof contractEquipment.$inferSelect;
export type InsertContractEquipment = z.infer<typeof insertContractEquipmentSchema>;

// Filtros para busca
export interface ContractFilters {
  status?: string;
  contractType?: string;
  priority?: string;
  managerId?: string;
  customerCompanyId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  totalValueMin?: number;
  totalValueMax?: number;
}

export interface ContractListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
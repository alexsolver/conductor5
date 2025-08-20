/**
 * EXPENSE APPROVAL MODULE - SCHEMA DEFINITIONS
 * ✅ 1QA.MD COMPLIANCE: Pure Drizzle ORM without @neondatabase/serverless
 * ✅ CLEAN ARCHITECTURE: Domain-driven schema design
 * ✅ MULTI-TENANT: Schema isolation via tenant_id
 */

import { pgTable, varchar, uuid, timestamp, text, decimal, boolean, integer, date, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ENUMs para despesas corporativas
export const expenseStatusEnum = pgEnum('expense_status_enum', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'cancelled']);
export const expenseTypeEnum = pgEnum('expense_type_enum', ['travel', 'meal', 'accommodation', 'transport', 'supplies', 'equipment', 'training', 'client_entertainment', 'other']);
export const paymentMethodEnum = pgEnum('payment_method_enum', ['corporate_card', 'personal_reimbursement', 'advance_payment', 'direct_billing']);
export const currencyEnum = pgEnum('currency_enum', ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']);
export const approvalStatusEnum = pgEnum('approval_status_enum', ['pending', 'approved', 'rejected', 'delegated', 'escalated']);
export const policyViolationLevelEnum = pgEnum('policy_violation_level_enum', ['none', 'minor', 'major', 'critical']);
export const riskLevelEnum = pgEnum('risk_level_enum', ['low', 'medium', 'high', 'critical']);

// Tabela principal de relatórios de despesas
export const expenseReports = pgTable('expense_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  reportNumber: varchar('report_number', { length: 50 }).notNull(),
  employeeId: uuid('employee_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: expenseStatusEnum('status').notNull().default('draft'),
  submissionDate: timestamp('submission_date'),
  approvalDate: timestamp('approval_date'),
  paymentDate: timestamp('payment_date'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  currency: currencyEnum('currency').notNull().default('BRL'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }).default('1'),
  totalAmountLocal: decimal('total_amount_local', { precision: 15, scale: 2 }).notNull().default('0'),
  departmentId: uuid('department_id'),
  costCenterId: uuid('cost_center_id'),
  projectId: uuid('project_id'),
  policyViolationLevel: policyViolationLevelEnum('policy_violation_level').default('none'),
  riskScore: integer('risk_score').default(0),
  complianceChecked: boolean('compliance_checked').default(false),
  auditRequired: boolean('audit_required').default(false),
  currentApproverId: uuid('current_approver_id'),
  approvalWorkflowId: uuid('approval_workflow_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull(),
  updatedById: uuid('updated_by_id').notNull(),
  isActive: boolean('is_active').notNull().default(true)
});

// Itens de despesa
export const expenseItems = pgTable('expense_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  expenseReportId: uuid('expense_report_id').notNull(),
  itemNumber: integer('item_number').notNull(),
  expenseType: expenseTypeEnum('expense_type').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  description: text('description').notNull(),
  expenseDate: date('expense_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').notNull().default('BRL'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }).default('1'),
  amountLocal: decimal('amount_local', { precision: 15, scale: 2 }).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  vendorTaxId: varchar('vendor_tax_id', { length: 50 }),
  location: varchar('location', { length: 255 }),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  cardTransactionId: varchar('card_transaction_id', { length: 100 }),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }),
  businessJustification: text('business_justification'),
  attendees: jsonb('attendees'),
  mileage: decimal('mileage', { precision: 10, scale: 2 }),
  mileageRate: decimal('mileage_rate', { precision: 10, scale: 4 }),
  policyViolation: boolean('policy_violation').default(false),
  policyViolationDetails: text('policy_violation_details'),
  complianceNotes: text('compliance_notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Documentos anexos
export const expenseDocuments = pgTable('expense_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  expenseReportId: uuid('expense_report_id'),
  expenseItemId: uuid('expense_item_id'),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  documentHash: varchar('document_hash', { length: 64 }),
  ocrData: jsonb('ocr_data'),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  uploadedById: uuid('uploaded_by_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  isActive: boolean('is_active').default(true)
});

// Workflow de aprovação
export const expenseApprovalWorkflows = pgTable('expense_approval_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  steps: jsonb('steps').notNull(),
  conditions: jsonb('conditions'),
  slaHours: integer('sla_hours').default(24),
  escalationRules: jsonb('escalation_rules'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull()
});

// Instâncias de aprovação
export const expenseApprovalInstances = pgTable('expense_approval_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  expenseReportId: uuid('expense_report_id').notNull(),
  workflowId: uuid('workflow_id').notNull(),
  currentStep: integer('current_step').default(1),
  totalSteps: integer('total_steps').notNull(),
  status: approvalStatusEnum('status').default('pending'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  slaDeadline: timestamp('sla_deadline'),
  escalated: boolean('escalated').default(false),
  escalationCount: integer('escalation_count').default(0),
  currentApproverId: uuid('current_approver_id'),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true)
});

// Decisões de aprovação
export const expenseApprovalDecisions = pgTable('expense_approval_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  instanceId: uuid('instance_id').notNull(),
  expenseReportId: uuid('expense_report_id').notNull(),
  step: integer('step').notNull(),
  approverId: uuid('approver_id').notNull(),
  decision: approvalStatusEnum('decision').notNull(),
  comments: text('comments'),
  decisionDate: timestamp('decision_date').notNull().defaultNow(),
  timeToDecision: integer('time_to_decision'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  delegatedTo: uuid('delegated_to'),
  delegationReason: text('delegation_reason'),
  metadata: jsonb('metadata')
});

// Políticas de despesas
export const expensePolicies = pgTable('expense_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  priority: integer('priority').default(100),
  isActive: boolean('is_active').default(true),
  conditions: jsonb('conditions').notNull(),
  actions: jsonb('actions').notNull(),
  limits: jsonb('limits'),
  requiredDocuments: jsonb('required_documents'),
  taxRules: jsonb('tax_rules'),
  riskFactors: jsonb('risk_factors'),
  applicableRoles: jsonb('applicable_roles'),
  applicableDepartments: jsonb('applicable_departments'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedById: uuid('updated_by_id').notNull()
});

// Cartão corporativo
export const corporateCards = pgTable('corporate_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  cardNumber: varchar('card_number', { length: 20 }).notNull(),
  cardholderName: varchar('cardholder_name', { length: 255 }).notNull(),
  employeeId: uuid('employee_id').notNull(),
  cardType: varchar('card_type', { length: 50 }).notNull(),
  issuer: varchar('issuer', { length: 100 }).notNull(),
  expiryDate: date('expiry_date').notNull(),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
  currency: currencyEnum('currency').notNull().default('BRL'),
  isActive: boolean('is_active').default(true),
  isBlocked: boolean('is_blocked').default(false),
  lastSyncDate: timestamp('last_sync_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull()
});

// Transações do cartão corporativo
export const cardTransactions = pgTable('card_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  cardId: uuid('card_id').notNull(),
  transactionId: varchar('transaction_id', { length: 100 }).notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  postingDate: timestamp('posting_date'),
  description: text('description').notNull(),
  merchant: varchar('merchant', { length: 255 }),
  merchantCategory: varchar('merchant_category', { length: 100 }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').notNull(),
  amountLocal: decimal('amount_local', { precision: 15, scale: 2 }),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }),
  isPersonal: boolean('is_personal').default(false),
  expenseItemId: uuid('expense_item_id'),
  reconciled: boolean('reconciled').default(false),
  reconciledAt: timestamp('reconciled_at'),
  location: varchar('location', { length: 255 }),
  metadata: jsonb('metadata'),
  importedAt: timestamp('imported_at').notNull().defaultNow()
});

// Trilha de auditoria
export const expenseAuditTrail = pgTable('expense_audit_trail', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  userId: uuid('user_id').notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  userRole: varchar('user_role', { length: 100 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  metadata: jsonb('metadata'),
  sessionId: varchar('session_id', { length: 100 })
});

// Relações entre tabelas
export const expenseReportsRelations = relations(expenseReports, ({ many, one }) => ({
  items: many(expenseItems),
  documents: many(expenseDocuments),
  approvalInstance: one(expenseApprovalInstances),
  auditEntries: many(expenseAuditTrail)
}));

export const expenseItemsRelations = relations(expenseItems, ({ one, many }) => ({
  expenseReport: one(expenseReports, {
    fields: [expenseItems.expenseReportId],
    references: [expenseReports.id]
  }),
  documents: many(expenseDocuments),
  cardTransaction: one(cardTransactions, {
    fields: [expenseItems.cardTransactionId],
    references: [cardTransactions.transactionId]
  })
}));

export const expenseDocumentsRelations = relations(expenseDocuments, ({ one }) => ({
  expenseReport: one(expenseReports, {
    fields: [expenseDocuments.expenseReportId],
    references: [expenseReports.id]
  }),
  expenseItem: one(expenseItems, {
    fields: [expenseDocuments.expenseItemId],
    references: [expenseItems.id]
  })
}));

export const expenseApprovalInstancesRelations = relations(expenseApprovalInstances, ({ one, many }) => ({
  expenseReport: one(expenseReports, {
    fields: [expenseApprovalInstances.expenseReportId],
    references: [expenseReports.id]
  }),
  workflow: one(expenseApprovalWorkflows, {
    fields: [expenseApprovalInstances.workflowId],
    references: [expenseApprovalWorkflows.id]
  }),
  decisions: many(expenseApprovalDecisions)
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  card: one(corporateCards, {
    fields: [cardTransactions.cardId],
    references: [corporateCards.id]
  }),
  expenseItem: one(expenseItems, {
    fields: [cardTransactions.expenseItemId],
    references: [expenseItems.id]
  })
}));

// Schemas de validação Zod
export const insertExpenseReportSchema = createInsertSchema(expenseReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const selectExpenseReportSchema = createSelectSchema(expenseReports);

export const insertExpenseItemSchema = createInsertSchema(expenseItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const selectExpenseItemSchema = createSelectSchema(expenseItems);

export const insertExpenseDocumentSchema = createInsertSchema(expenseDocuments).omit({
  id: true,
  createdAt: true
});

export const selectExpenseDocumentSchema = createSelectSchema(expenseDocuments);

export const insertExpenseApprovalWorkflowSchema = createInsertSchema(expenseApprovalWorkflows).omit({
  id: true,
  createdAt: true
});

export const selectExpenseApprovalWorkflowSchema = createSelectSchema(expenseApprovalWorkflows);

export const insertExpenseApprovalInstanceSchema = createInsertSchema(expenseApprovalInstances).omit({
  id: true,
  startedAt: true
});

export const selectExpenseApprovalInstanceSchema = createSelectSchema(expenseApprovalInstances);

export const insertExpenseApprovalDecisionSchema = createInsertSchema(expenseApprovalDecisions).omit({
  id: true,
  decisionDate: true
});

export const selectExpenseApprovalDecisionSchema = createSelectSchema(expenseApprovalDecisions);

export const insertExpensePolicySchema = createInsertSchema(expensePolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const selectExpensePolicySchema = createSelectSchema(expensePolicies);

export const insertCorporateCardSchema = createInsertSchema(corporateCards).omit({
  id: true,
  createdAt: true
});

export const selectCorporateCardSchema = createSelectSchema(corporateCards);

export const insertCardTransactionSchema = createInsertSchema(cardTransactions).omit({
  id: true,
  importedAt: true
});

export const selectCardTransactionSchema = createSelectSchema(cardTransactions);

export const insertExpenseAuditTrailSchema = createInsertSchema(expenseAuditTrail).omit({
  id: true,
  timestamp: true
});

export const selectExpenseAuditTrailSchema = createSelectSchema(expenseAuditTrail);

// Tipos TypeScript inferidos
export type ExpenseReport = typeof expenseReports.$inferSelect;
export type InsertExpenseReport = z.infer<typeof insertExpenseReportSchema>;

export type ExpenseItem = typeof expenseItems.$inferSelect;
export type InsertExpenseItem = z.infer<typeof insertExpenseItemSchema>;

export type ExpenseDocument = typeof expenseDocuments.$inferSelect;
export type InsertExpenseDocument = z.infer<typeof insertExpenseDocumentSchema>;

export type ExpenseApprovalWorkflow = typeof expenseApprovalWorkflows.$inferSelect;
export type InsertExpenseApprovalWorkflow = z.infer<typeof insertExpenseApprovalWorkflowSchema>;

export type ExpenseApprovalInstance = typeof expenseApprovalInstances.$inferSelect;
export type InsertExpenseApprovalInstance = z.infer<typeof insertExpenseApprovalInstanceSchema>;

export type ExpenseApprovalDecision = typeof expenseApprovalDecisions.$inferSelect;
export type InsertExpenseApprovalDecision = z.infer<typeof insertExpenseApprovalDecisionSchema>;

export type ExpensePolicy = typeof expensePolicies.$inferSelect;
export type InsertExpensePolicy = z.infer<typeof insertExpensePolicySchema>;

export type CorporateCard = typeof corporateCards.$inferSelect;
export type InsertCorporateCard = z.infer<typeof insertCorporateCardSchema>;

export type CardTransaction = typeof cardTransactions.$inferSelect;
export type InsertCardTransaction = z.infer<typeof insertCardTransactionSchema>;

export type ExpenseAuditTrail = typeof expenseAuditTrail.$inferSelect;
export type InsertExpenseAuditTrail = z.infer<typeof insertExpenseAuditTrailSchema>;
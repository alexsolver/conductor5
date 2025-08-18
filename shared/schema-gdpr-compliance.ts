/**
 * GDPR Compliance Reports Schema
 * Clean Architecture - Domain Layer Schema Definition
 * Following 1qa.md standards for enterprise compliance management
 */

import { pgTable, text, uuid, timestamp, boolean, jsonb, pgEnum, integer, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ✅ GDPR Compliance Report Status Enum
export const gdprReportStatusEnum = pgEnum('gdpr_report_status', [
  'draft',
  'in_progress', 
  'under_review',
  'approved',
  'published',
  'archived'
]);

// ✅ GDPR Report Type Enum
export const gdprReportTypeEnum = pgEnum('gdpr_report_type', [
  'dpia', // Data Protection Impact Assessment
  'audit_trail',
  'data_breach',
  'consent_management',
  'right_of_access',
  'right_of_rectification',
  'right_of_erasure',
  'data_portability',
  'processing_activities',
  'vendor_assessment',
  'training_compliance',
  'incident_response'
]);

// ✅ Priority Level Enum
export const gdprPriorityEnum = pgEnum('gdpr_priority', [
  'low',
  'medium', 
  'high',
  'critical',
  'urgent'
]);

// ✅ Risk Level Enum  
export const gdprRiskLevelEnum = pgEnum('gdpr_risk_level', [
  'minimal',
  'low',
  'medium',
  'high',
  'very_high'
]);

// ✅ GDPR Reports Main Table
export const gdprReports = pgTable('gdpr_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  reportType: gdprReportTypeEnum('report_type').notNull(),
  status: gdprReportStatusEnum('status').notNull().default('draft'),
  priority: gdprPriorityEnum('priority').notNull().default('medium'),
  riskLevel: gdprRiskLevelEnum('risk_level').default('medium'),
  
  // Metadata fields
  reportData: jsonb('report_data'), // Structured report content
  findings: jsonb('findings'), // Key findings and recommendations
  actionItems: jsonb('action_items'), // Required actions and deadlines
  attachments: jsonb('attachments'), // File references and metadata
  
  // Compliance tracking
  complianceScore: integer('compliance_score'), // 0-100 score
  lastAuditDate: timestamp('last_audit_date'),
  nextReviewDate: timestamp('next_review_date'),
  dueDate: timestamp('due_date'),
  
  // Stakeholder management
  assignedUserId: uuid('assigned_user_id'),
  reviewerUserId: uuid('reviewer_user_id'),
  approverUserId: uuid('approver_user_id'),
  
  // Workflow tracking
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  publishedAt: timestamp('published_at'),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  isActive: boolean('is_active').notNull().default(true)
});

// ✅ GDPR Report Templates Table
export const gdprReportTemplates = pgTable('gdpr_report_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  reportType: gdprReportTypeEnum('report_type').notNull(),
  templateData: jsonb('template_data').notNull(), // Template structure and fields
  isDefault: boolean('is_default').notNull().default(false),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  isActive: boolean('is_active').notNull().default(true)
});

// ✅ GDPR Compliance Tasks Table
export const gdprComplianceTasks = pgTable('gdpr_compliance_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: gdprReportStatusEnum('status').notNull().default('draft'),
  priority: gdprPriorityEnum('priority').notNull().default('medium'),
  
  // Task specifics
  taskType: varchar('task_type', { length: 100 }), // action_item, review, approval, etc.
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Assignment
  assignedUserId: uuid('assigned_user_id'),
  assignedBy: uuid('assigned_by'),
  
  // Task data
  taskData: jsonb('task_data'), // Specific task requirements and progress
  evidence: jsonb('evidence'), // Supporting documentation
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  isActive: boolean('is_active').notNull().default(true)
});

// ✅ GDPR Audit Log Table
export const gdprAuditLog = pgTable('gdpr_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // gdpr_reports, gdpr_tasks, etc.
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // created, updated, deleted, approved, etc.
  
  // Change tracking
  previousData: jsonb('previous_data'),
  newData: jsonb('new_data'),
  changes: jsonb('changes'), // Specific field changes
  
  // Context
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  tenantId: uuid('tenant_id').notNull()
});

// ✅ Insert Schemas using drizzle-zod
export const insertGdprReportSchema = createInsertSchema(gdprReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true
});

export const insertGdprReportTemplateSchema = createInsertSchema(gdprReportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true
});

export const insertGdprComplianceTaskSchema = createInsertSchema(gdprComplianceTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true
});

export const insertGdprAuditLogSchema = createInsertSchema(gdprAuditLog).omit({
  id: true,
  createdAt: true
});

// ✅ Select Types
export type GdprReport = typeof gdprReports.$inferSelect;
export type InsertGdprReport = z.infer<typeof insertGdprReportSchema>;

export type GdprReportTemplate = typeof gdprReportTemplates.$inferSelect;
export type InsertGdprReportTemplate = z.infer<typeof insertGdprReportTemplateSchema>;

export type GdprComplianceTask = typeof gdprComplianceTasks.$inferSelect;
export type InsertGdprComplianceTask = z.infer<typeof insertGdprComplianceTaskSchema>;

export type GdprAuditLog = typeof gdprAuditLog.$inferSelect;
export type InsertGdprAuditLog = z.infer<typeof insertGdprAuditLogSchema>;
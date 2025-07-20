
import { pgTable, uuid, varchar, text, timestamp, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'approved', 
  'in_progress',
  'on_hold',
  'review',
  'completed',
  'cancelled'
]);

export const projectPriorityEnum = pgEnum('project_priority', [
  'low',
  'medium',
  'high', 
  'critical'
]);

export const projectActionTypeEnum = pgEnum('project_action_type', [
  'internal_meeting',
  'internal_approval',
  'internal_review',
  'internal_task',
  'external_delivery',
  'external_validation',
  'external_meeting',
  'external_feedback',
  'milestone',
  'checkpoint'
]);

export const actionStatusEnum = pgEnum('action_status', [
  'pending',
  'in_progress',
  'completed', 
  'cancelled',
  'blocked'
]);

export const projectTimelineEventEnum = pgEnum('project_timeline_event', [
  'project_created',
  'status_changed',
  'action_completed',
  'milestone_reached',
  'budget_updated',
  'team_changed'
]);

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('planning'),
  priority: projectPriorityEnum('priority').notNull().default('medium'),
  
  // Dates
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours').notNull().default(0),
  
  // Financial
  budget: decimal('budget', { precision: 15, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 15, scale: 2 }).notNull().default('0'),
  
  // People
  projectManagerId: uuid('project_manager_id'),
  clientId: uuid('client_id'),
  teamMemberIds: jsonb('team_member_ids').$type<string[]>().notNull().default([]),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  customFields: jsonb('custom_fields').$type<Record<string, any>>().notNull().default({}),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull()
});

// Project Actions table
export const projectActions = pgTable('project_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  projectId: uuid('project_id').notNull(),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: projectActionTypeEnum('type').notNull(),
  status: actionStatusEnum('status').notNull().default('pending'),
  
  // Scheduling
  scheduledDate: timestamp('scheduled_date'),
  dueDate: timestamp('due_date'),
  completedDate: timestamp('completed_date'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours').notNull().default(0),
  
  // Assignment
  assignedToId: uuid('assigned_to_id'),
  responsibleIds: jsonb('responsible_ids').$type<string[]>().notNull().default([]),
  
  // External Actions
  clientContactId: uuid('client_contact_id'),
  externalReference: varchar('external_reference', { length: 255 }),
  deliveryMethod: varchar('delivery_method', { length: 100 }),
  
  // Dependencies
  dependsOnActionIds: jsonb('depends_on_action_ids').$type<string[]>().notNull().default([]),
  blockedByActionIds: jsonb('blocked_by_action_ids').$type<string[]>().notNull().default([]),
  
  // Metadata
  priority: projectPriorityEnum('priority').notNull().default('medium'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  attachments: jsonb('attachments').$type<string[]>().notNull().default([]),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull()
});

// Project Timeline table
export const projectTimeline = pgTable('project_timeline', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  projectId: uuid('project_id').notNull(),
  
  eventType: projectTimelineEventEnum('event_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // References
  actionId: uuid('action_id'),
  relatedEntityId: uuid('related_entity_id'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  
  // Data
  oldValue: text('old_value'),
  newValue: text('new_value'), 
  metadata: jsonb('metadata').$type<Record<string, any>>().notNull().default({}),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull()
});

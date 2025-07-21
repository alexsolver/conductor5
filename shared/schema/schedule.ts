
import { pgTable, text, timestamp, boolean, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './base';
import { customers } from './customer';
import { tickets } from './ticket';
import { projects } from './projects-db';

export const scheduleTypeEnum = pgEnum('schedule_type', ['appointment', 'meeting', 'task', 'break', 'travel', 'ticket_service']);
export const scheduleStatusEnum = pgEnum('schedule_status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);
export const conflictTypeEnum = pgEnum('conflict_type', ['overlap', 'resource_conflict', 'location_conflict']);
export const conflictSeverityEnum = pgEnum('conflict_severity', ['low', 'medium', 'high']);

export const schedules = pgTable('schedules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  type: scheduleTypeEnum('type').notNull(),
  status: scheduleStatusEnum('status').notNull().default('scheduled'),
  priority: priorityEnum('priority').notNull().default('medium'),
  location: text('location'), // JSON string for location data
  customerId: text('customer_id').references(() => customers.id),
  ticketId: text('ticket_id').references(() => tickets.id),
  projectId: text('project_id').references(() => projects.id),
  metadata: text('metadata'), // JSON string for additional data
  reminderMinutes: text('reminder_minutes'), // JSON array of reminder times
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: text('recurring_pattern'), // JSON string for recurring pattern
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduleAvailability = pgTable('schedule_availability', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6, Sunday to Saturday
  startTime: text('start_time').notNull(), // HH:mm format
  endTime: text('end_time').notNull(), // HH:mm format
  isAvailable: boolean('is_available').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduleConflicts = pgTable('schedule_conflicts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  scheduleId: text('schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  conflictingScheduleId: text('conflicting_schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  conflictType: conflictTypeEnum('conflict_type').notNull(),
  severity: conflictSeverityEnum('severity').notNull(),
  resolved: boolean('resolved').default(false),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

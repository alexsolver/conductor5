
import { pgTable, text, timestamp, decimal, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './base';

export const journeyStatusEnum = pgEnum('journey_status', ['active', 'paused', 'completed']);
export const checkpointTypeEnum = pgEnum('checkpoint_type', ['check_in', 'check_out', 'break_start', 'break_end', 'location_update']);

export const journeys = pgTable('journeys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  status: journeyStatusEnum('status').notNull().default('active'),
  location: text('location'), // JSON string for location data
  notes: text('notes'),
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }),
  breakMinutes: integer('break_minutes').default(0),
  overtimeHours: decimal('overtime_hours', { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const journeyCheckpoints = pgTable('journey_checkpoints', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  journeyId: text('journey_id').notNull().references(() => journeys.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull(),
  type: checkpointTypeEnum('type').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  location: text('location'), // JSON string for location data
  notes: text('notes'),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const journeyMetrics = pgTable('journey_metrics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  journeyId: text('journey_id').notNull().references(() => journeys.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull(),
  date: timestamp('date').notNull(),
  totalWorkingHours: decimal('total_working_hours', { precision: 5, scale: 2 }).notNull(),
  breakHours: decimal('break_hours', { precision: 5, scale: 2 }).default('0'),
  overtimeHours: decimal('overtime_hours', { precision: 5, scale: 2 }).default('0'),
  productivity: decimal('productivity', { precision: 5, scale: 2 }).default('0'),
  distanceTraveled: decimal('distance_traveled', { precision: 8, scale: 2 }),
  ticketsCompleted: integer('tickets_completed').default(0),
  customerVisits: integer('customer_visits').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

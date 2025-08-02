// UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source

export * from "./schema-master";

// This file serves as the single entry point for all schema definitions
// All imports should use: import { ... } from '@shared/schema'

// Validation: Ensure all exports are properly typed
import type { 
  User, Customer, Ticket, Tenant, 
  scheduleTemplates, workSchedules, timecardEntries,
  ScheduleTemplate, WorkSchedule
} from "./schema-master";

// Re-export types for consistency
export type {
  User, Customer, Ticket, Tenant,
  ScheduleTemplate, WorkSchedule
};
export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  scheduleName: varchar("schedule_name", { length: 100 }).notNull(),
  scheduleType: varchar("schedule_type", { length: 20 }).notNull().default('5x2'),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  workDays: jsonb("work_days").notNull().$type<number[]>(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakStart: time("break_start"),
  breakEnd: time("break_end"),
  breakDurationMinutes: integer("break_duration_minutes").default(60),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
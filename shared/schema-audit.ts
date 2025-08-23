// ===========================================================================================
// AUDIT SCHEMA - Map Audit Logs for Privacy Compliance and Activity Tracking
// ===========================================================================================

import { pgTable, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===========================================================================================
// Map Audit Logs Table
// ===========================================================================================

export const mapAuditLogs = pgTable('map_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Event Classification
  eventType: varchar('event_type', { length: 50 }).notNull(),
  resourceType: varchar('resource_type', { length: 30 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  
  // Event Details
  details: jsonb('details').$type<Record<string, any>>().default({}),
  clientInfo: jsonb('client_info').$type<{
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  }>().default({}),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('map_audit_logs_user_id_idx').on(table.userId),
  tenantIdIdx: index('map_audit_logs_tenant_id_idx').on(table.tenantId),
  eventTypeIdx: index('map_audit_logs_event_type_idx').on(table.eventType),
  createdAtIdx: index('map_audit_logs_created_at_idx').on(table.createdAt),
  userTenantIdx: index('map_audit_logs_user_tenant_idx').on(table.userId, table.tenantId),
}));

// ===========================================================================================
// Zod Schemas
// ===========================================================================================

export const insertMapAuditLogSchema = createInsertSchema(mapAuditLogs);
export const selectMapAuditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  eventType: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  details: z.record(z.any()),
  clientInfo: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  createdAt: z.date(),
});

export type InsertMapAuditLog = z.infer<typeof insertMapAuditLogSchema>;
export type SelectMapAuditLog = z.infer<typeof selectMapAuditLogSchema>;
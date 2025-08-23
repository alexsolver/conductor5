// ✅ 1QA.MD COMPLIANCE: Interactive Map Module Schema - Clean Architecture
// Schema definitions for Interactive Map agents, locations, and real-time tracking

import {
  pgTable,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  text,
  pgEnum,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// ✅ Agent Status Enum - Following business rules
export const agentStatusEnum = pgEnum('agent_status', [
  'available',     // Verde #24B47E
  'in_transit',    // Azul #2F80ED
  'in_service',    // Amarelo #F2C94C
  'paused',        // Lilás #9B51E0
  'sla_risk',      // Vermelho #EB5757 com pulso
  'offline'        // Cinza #BDBDBD
]);

// ✅ Map Layer Types
export const mapLayerTypeEnum = pgEnum('map_layer_type', [
  'agents',
  'tickets',
  'customers', 
  'traffic',
  'weather',
  'geofencing',
  'heatmap'
]);

// ✅ 1QA.MD: Field Agents Table - Real-time tracking with all business fields
export const fieldAgents = pgTable('field_agents', {
  id: varchar('id').primaryKey().$defaultFn(() => `fa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
  agent_id: varchar('agent_id').notNull(),  // Link to users table
  name: varchar('name', { length: 255 }).notNull(),
  photo_url: varchar('photo_url', { length: 500 }),
  team: varchar('team', { length: 100 }),
  skills: jsonb('skills').$type<string[]>().default([]),
  
  // Status and Time
  status: agentStatusEnum('status').default('offline').notNull(),
  status_since: timestamp('status_since', { withTimezone: true }).defaultNow(),
  
  // Location Data - High precision for GPS
  lat: decimal('lat', { precision: 10, scale: 8 }),
  lng: decimal('lng', { precision: 11, scale: 8 }),
  accuracy: decimal('accuracy', { precision: 8, scale: 2 }), // meters
  heading: decimal('heading', { precision: 5, scale: 2 }), // 0-360 degrees
  speed: decimal('speed', { precision: 6, scale: 2 }), // km/h
  
  // Device Information
  device_battery: integer('device_battery'), // 0-100%
  signal_strength: integer('signal_strength'), // dBm
  last_ping_at: timestamp('last_ping_at', { withTimezone: true }),
  
  // Work Assignment
  assigned_ticket_id: varchar('assigned_ticket_id'),
  customer_site_id: varchar('customer_site_id'),
  sla_deadline_at: timestamp('sla_deadline_at', { withTimezone: true }),
  
  // Work Schedule
  shift_start_at: timestamp('shift_start_at', { withTimezone: true }),
  shift_end_at: timestamp('shift_end_at', { withTimezone: true }),
  is_on_duty: boolean('is_on_duty').default(false),
  
  // Route Information
  current_route_id: varchar('current_route_id'),
  eta_seconds: integer('eta_seconds'),
  distance_meters: integer('distance_meters'),
  
  // Audit fields
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  tenant_id: varchar('tenant_id').notNull()
}, (table) => {
  return {
    agentIdIdx: index('field_agents_agent_id_idx').on(table.agent_id),
    statusIdx: index('field_agents_status_idx').on(table.status),
    locationIdx: index('field_agents_location_idx').on(table.lat, table.lng),
    tenantIdx: index('field_agents_tenant_idx').on(table.tenant_id),
    lastPingIdx: index('field_agents_last_ping_idx').on(table.last_ping_at),
    uniqueAgentTenant: unique('field_agents_agent_tenant_unique').on(table.agent_id, table.tenant_id)
  };
});

// ✅ Agent Position History - For trails and analytics
export const agentPositionHistory = pgTable('agent_position_history', {
  id: varchar('id').primaryKey().$defaultFn(() => `aph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
  agent_id: varchar('agent_id').notNull(),
  lat: decimal('lat', { precision: 10, scale: 8 }).notNull(),
  lng: decimal('lng', { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal('accuracy', { precision: 8, scale: 2 }),
  heading: decimal('heading', { precision: 5, scale: 2 }),
  speed: decimal('speed', { precision: 6, scale: 2 }),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
  tenant_id: varchar('tenant_id').notNull()
}, (table) => {
  return {
    agentTimeIdx: index('agent_position_agent_time_idx').on(table.agent_id, table.recorded_at),
    tenantIdx: index('agent_position_tenant_idx').on(table.tenant_id)
  };
});

// ✅ Map Filter Configurations - User preferences for map display
export const mapFilterConfigs = pgTable('map_filter_configs', {
  id: varchar('id').primaryKey().$defaultFn(() => `mfc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
  user_id: varchar('user_id').notNull(),
  filter_name: varchar('filter_name', { length: 100 }).notNull(),
  layers_enabled: jsonb('layers_enabled').$type<string[]>().default([]),
  status_filters: jsonb('status_filters').$type<string[]>().default([]),
  team_filters: jsonb('team_filters').$type<string[]>().default([]),
  proximity_radius: integer('proximity_radius').default(1000), // meters
  auto_refresh: boolean('auto_refresh').default(true),
  refresh_interval: integer('refresh_interval').default(10), // seconds
  is_default: boolean('is_default').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  tenant_id: varchar('tenant_id').notNull()
}, (table) => {
  return {
    userIdx: index('map_filter_user_idx').on(table.user_id),
    tenantIdx: index('map_filter_tenant_idx').on(table.tenant_id)
  };
});

// ✅ Geofence Areas - For location-based rules and SLA triggers
export const geofenceAreas = pgTable('geofence_areas', {
  id: varchar('id').primaryKey().$defaultFn(() => `gf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  area_type: varchar('area_type', { length: 50 }).notNull(), // customer_site, service_zone, restricted
  coordinates: jsonb('coordinates').notNull(), // GeoJSON polygon
  radius_meters: integer('radius_meters'), // For circular areas
  is_active: boolean('is_active').default(true),
  
  // Business rules
  auto_start_sla: boolean('auto_start_sla').default(false),
  working_hours_start: varchar('working_hours_start', { length: 8 }), // HH:MM:SS
  working_hours_end: varchar('working_hours_end', { length: 8 }),
  timezone: varchar('timezone', { length: 50 }).default('America/Sao_Paulo'),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  tenant_id: varchar('tenant_id').notNull()
}, (table) => {
  return {
    typeIdx: index('geofence_type_idx').on(table.area_type),
    tenantIdx: index('geofence_tenant_idx').on(table.tenant_id),
    activeIdx: index('geofence_active_idx').on(table.is_active)
  };
});

// ✅ Map Events Log - Audit trail for map interactions
export const mapEventsLog = pgTable('map_events_log', {
  id: varchar('id').primaryKey().$defaultFn(() => `mel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
  user_id: varchar('user_id').notNull(),
  event_type: varchar('event_type', { length: 50 }).notNull(), // view_agent, assign_ticket, view_route
  target_agent_id: varchar('target_agent_id'),
  target_ticket_id: varchar('target_ticket_id'),
  event_data: jsonb('event_data'),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: text('user_agent'),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
  tenant_id: varchar('tenant_id').notNull()
}, (table) => {
  return {
    userTimeIdx: index('map_events_user_time_idx').on(table.user_id, table.recorded_at),
    eventTypeIdx: index('map_events_type_idx').on(table.event_type),
    tenantIdx: index('map_events_tenant_idx').on(table.tenant_id)
  };
});

// ✅ Relations - Following 1qa.md patterns
export const fieldAgentsRelations = relations(fieldAgents, ({ one, many }) => ({
  positionHistory: many(agentPositionHistory)
}));

export const agentPositionHistoryRelations = relations(agentPositionHistory, ({ one }) => ({
  agent: one(fieldAgents, {
    fields: [agentPositionHistory.agent_id],
    references: [fieldAgents.agent_id]
  })
}));

// ✅ Zod Schemas for validation - Following drizzle-zod pattern
export const insertFieldAgentSchema = createInsertSchema(fieldAgents, {
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  accuracy: z.coerce.number().min(0).optional(),
  heading: z.coerce.number().min(0).max(360).optional(),
  speed: z.coerce.number().min(0).optional(),
  device_battery: z.number().int().min(0).max(100).optional(),
  signal_strength: z.number().int().optional(),
  eta_seconds: z.number().int().min(0).optional(),
  distance_meters: z.number().int().min(0).optional()
}).omit({ id: true, created_at: true, updated_at: true });

export const updateFieldAgentSchema = insertFieldAgentSchema.partial();

export const insertGeofenceAreaSchema = createInsertSchema(geofenceAreas).omit({
  id: true,
  created_at: true
});

export const insertMapFilterConfigSchema = createInsertSchema(mapFilterConfigs).omit({
  id: true,
  created_at: true
});

// ✅ TypeScript Types - Following 1qa.md conventions
export type FieldAgent = typeof fieldAgents.$inferSelect;
export type InsertFieldAgent = z.infer<typeof insertFieldAgentSchema>;
export type UpdateFieldAgent = z.infer<typeof updateFieldAgentSchema>;
export type GeofenceArea = typeof geofenceAreas.$inferSelect;
export type InsertGeofenceArea = z.infer<typeof insertGeofenceAreaSchema>;
export type MapFilterConfig = typeof mapFilterConfigs.$inferSelect;
export type InsertMapFilterConfig = z.infer<typeof insertMapFilterConfigSchema>;
export type AgentPositionHistory = typeof agentPositionHistory.$inferSelect;
export type MapEventLog = typeof mapEventsLog.$inferSelect;

// ✅ Business Logic Types
export interface AgentLocationUpdate {
  agentId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  deviceBattery?: number;
  signalStrength?: number;
}

export interface MapBounds {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

export interface AgentCluster {
  lat: number;
  lng: number;
  count: number;
  maxSeverity: 'normal' | 'warning' | 'critical';
  agents: FieldAgent[];
}

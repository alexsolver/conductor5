// ===========================================================================================
// MOBILE INTEGRATION SCHEMA - GPS Data & Device Status for Field Agents  
// Supports 1000+ agents with real-time updates and intelligent rules
// ===========================================================================================

import { pgTable, uuid, varchar, decimal, integer, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===========================================================================================
// Agent Position Tracking - Real-time GPS data from mobile devices
// ===========================================================================================
export const agentPositions = pgTable('agent_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull(), // FK to users table
  tenantId: uuid('tenant_id').notNull(),
  
  // GPS Core Data
  lat: decimal('lat', { precision: 10, scale: 8 }).notNull(),
  lng: decimal('lng', { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal('accuracy', { precision: 8, scale: 2 }), // meters
  altitude: decimal('altitude', { precision: 8, scale: 2 }), // meters
  
  // Movement Data
  heading: decimal('heading', { precision: 5, scale: 2 }), // degrees 0-360
  speed: decimal('speed', { precision: 5, scale: 2 }), // km/h
  
  // Device Status
  deviceBattery: integer('device_battery'), // percentage 0-100
  signalStrength: integer('signal_strength'), // dBm or percentage
  
  // Timestamps
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
  serverReceivedAt: timestamp('server_received_at', { withTimezone: true }).defaultNow(),
  
  // Quality Metrics
  isAccurate: boolean('is_accurate').default(true), // accuracy < 50m
  dataSource: varchar('data_source', { length: 50 }).default('mobile_app'), // mobile_app, vehicle_tracker, etc.
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  agentIdIdx: index('agent_positions_agent_id_idx').on(table.agentId),
  tenantIdIdx: index('agent_positions_tenant_id_idx').on(table.tenantId),
  capturedAtIdx: index('agent_positions_captured_at_idx').on(table.capturedAt),
  agentCapturedIdx: index('agent_positions_agent_captured_idx').on(table.agentId, table.capturedAt),
}));

// ===========================================================================================
// Agent Routes - Planned and Active Routes with ETA calculations
// ===========================================================================================
export const agentRoutes = pgTable('agent_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  ticketId: uuid('ticket_id'), // Optional - may be standalone route
  
  // Route Details
  startLat: decimal('start_lat', { precision: 10, scale: 8 }).notNull(),
  startLng: decimal('start_lng', { precision: 11, scale: 8 }).notNull(),
  destinationLat: decimal('destination_lat', { precision: 10, scale: 8 }).notNull(),
  destinationLng: decimal('destination_lng', { precision: 11, scale: 8 }).notNull(),
  
  // Route Geometry (GeoJSON LineString)
  routeGeometry: jsonb('route_geometry'), // GeoJSON path coordinates
  
  // ETA & Distance
  originalEtaSeconds: integer('original_eta_seconds'), // planned ETA
  currentEtaSeconds: integer('current_eta_seconds'), // real-time ETA
  totalDistanceMeters: integer('total_distance_meters'),
  remainingDistanceMeters: integer('remaining_distance_meters'),
  
  // Status
  status: varchar('status', { length: 20 }).default('planned'), // planned, active, completed, cancelled
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // External Integration Data
  trafficImpact: varchar('traffic_impact', { length: 20 }), // none, light, moderate, heavy
  weatherImpact: varchar('weather_impact', { length: 20 }), // none, rain, storm, etc.
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  agentIdIdx: index('agent_routes_agent_id_idx').on(table.agentId),
  tenantIdIdx: index('agent_routes_tenant_id_idx').on(table.tenantId),
  statusIdx: index('agent_routes_status_idx').on(table.status),
  ticketIdIdx: index('agent_routes_ticket_id_idx').on(table.ticketId),
}));

// ===========================================================================================
// Agent Device Status - Comprehensive device health and connectivity
// ===========================================================================================
export const agentDeviceStatus = pgTable('agent_device_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Device Information
  deviceId: varchar('device_id', { length: 100 }), // unique device identifier
  deviceModel: varchar('device_model', { length: 50 }),
  appVersion: varchar('app_version', { length: 20 }),
  osVersion: varchar('os_version', { length: 20 }),
  
  // Connectivity Status
  isOnline: boolean('is_online').default(true),
  lastPingAt: timestamp('last_ping_at', { withTimezone: true }).defaultNow(),
  connectionType: varchar('connection_type', { length: 20 }), // wifi, 4g, 5g, etc.
  
  // Battery & Performance
  batteryLevel: integer('battery_level'), // 0-100
  isCharging: boolean('is_charging').default(false),
  lowBatteryWarning: boolean('low_battery_warning').default(false), // < 15%
  
  // GPS Status
  gpsEnabled: boolean('gps_enabled').default(true),
  locationPermission: boolean('location_permission').default(true),
  backgroundLocationEnabled: boolean('background_location_enabled').default(true),
  
  // Performance Metrics
  cpuUsage: decimal('cpu_usage', { precision: 5, scale: 2 }), // percentage
  memoryUsage: decimal('memory_usage', { precision: 5, scale: 2 }), // percentage
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  agentIdIdx: index('agent_device_status_agent_id_idx').on(table.agentId),
  tenantIdIdx: index('agent_device_status_tenant_id_idx').on(table.tenantId),
  onlineIdx: index('agent_device_status_online_idx').on(table.isOnline),
  lastPingIdx: index('agent_device_status_last_ping_idx').on(table.lastPingAt),
}));

// ===========================================================================================
// Agent Status History - Track status changes with timestamps
// ===========================================================================================
export const agentStatusHistory = pgTable('agent_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Status Change
  fromStatus: varchar('from_status', { length: 30 }),
  toStatus: varchar('to_status', { length: 30 }).notNull(),
  changeReason: varchar('change_reason', { length: 100 }), // auto_speed, manual, arrival, etc.
  
  // Context Data
  lat: decimal('lat', { precision: 10, scale: 8 }),
  lng: decimal('lng', { precision: 11, scale: 8 }),
  speed: decimal('speed', { precision: 5, scale: 2 }),
  ticketId: uuid('ticket_id'), // if status change related to ticket
  
  // Metadata
  changedBy: varchar('changed_by', { length: 20 }).default('system'), // system, agent, supervisor
  metadata: jsonb('metadata'), // additional context data
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  agentIdIdx: index('agent_status_history_agent_id_idx').on(table.agentId),
  tenantIdIdx: index('agent_status_history_tenant_id_idx').on(table.tenantId),
  createdAtIdx: index('agent_status_history_created_at_idx').on(table.createdAt),
  statusIdx: index('agent_status_history_status_idx').on(table.toStatus),
}));

// ===========================================================================================
// Zod Schemas for Validation
// ===========================================================================================

export const insertAgentPositionSchema = createInsertSchema(agentPositions, {
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000).optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).max(300).optional(), // reasonable max speed
  deviceBattery: z.number().min(0).max(100).optional(),
  signalStrength: z.number().optional(),
}).omit({
  id: true,
  serverReceivedAt: true,
  createdAt: true,
});

export const insertAgentRouteSchema = createInsertSchema(agentRoutes, {
  startLat: z.number().min(-90).max(90),
  startLng: z.number().min(-180).max(180),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  originalEtaSeconds: z.number().min(0).optional(),
  currentEtaSeconds: z.number().min(0).optional(),
  totalDistanceMeters: z.number().min(0).optional(),
  remainingDistanceMeters: z.number().min(0).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentDeviceStatusSchema = createInsertSchema(agentDeviceStatus, {
  batteryLevel: z.number().min(0).max(100).optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
  memoryUsage: z.number().min(0).max(100).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentStatusHistorySchema = createInsertSchema(agentStatusHistory, {
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  speed: z.number().min(0).max(300).optional(),
}).omit({
  id: true,
  createdAt: true,
});

// ===========================================================================================
// TypeScript Types
// ===========================================================================================

export type AgentPosition = typeof agentPositions.$inferSelect;
export type InsertAgentPosition = z.infer<typeof insertAgentPositionSchema>;

export type AgentRoute = typeof agentRoutes.$inferSelect;
export type InsertAgentRoute = z.infer<typeof insertAgentRouteSchema>;

export type AgentDeviceStatus = typeof agentDeviceStatus.$inferSelect;
export type InsertAgentDeviceStatus = z.infer<typeof insertAgentDeviceStatusSchema>;

export type AgentStatusHistory = typeof agentStatusHistory.$inferSelect;
export type InsertAgentStatusHistory = z.infer<typeof insertAgentStatusHistorySchema>;

// ===========================================================================================
// Agent Status Enums for Type Safety
// ===========================================================================================

export const AgentStatus = {
  AVAILABLE: 'available',
  IN_TRANSIT: 'in_transit', 
  IN_SERVICE: 'in_service',
  ON_BREAK: 'on_break',
  UNAVAILABLE: 'unavailable',
  SLA_RISK: 'sla_risk',
  SLA_BREACHED: 'sla_breached',
  OFFLINE: 'offline'
} as const;

export const RouteStatus = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const TrafficImpact = {
  NONE: 'none',
  LIGHT: 'light',
  MODERATE: 'moderate',
  HEAVY: 'heavy',
  SEVERE: 'severe'
} as const;

export const WeatherImpact = {
  NONE: 'none',
  RAIN: 'rain',
  STORM: 'storm',
  FOG: 'fog',
  SNOW: 'snow'
} as const;

export type AgentStatusType = typeof AgentStatus[keyof typeof AgentStatus];
export type RouteStatusType = typeof RouteStatus[keyof typeof RouteStatus];
export type TrafficImpactType = typeof TrafficImpact[keyof typeof TrafficImpact];
export type WeatherImpactType = typeof WeatherImpact[keyof typeof WeatherImpact];
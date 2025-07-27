// NEW LOCATIONS MODULE - Complete Geospatial Schema
import { pgTable, uuid, varchar, text, timestamp, jsonb, decimal, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for location types and geometry
export const locationTypeEnum = pgEnum('location_type', ['point', 'segment', 'area', 'region', 'route']);
export const geometryTypeEnum = pgEnum('geometry_type', ['point', 'linestring', 'polygon', 'multipolygon']);
export const locationStatusEnum = pgEnum('location_status', ['active', 'inactive', 'maintenance', 'restricted']);
export const segmentTypeEnum = pgEnum('segment_type', ['fiber', 'cable', 'pipeline', 'rail', 'road']);
export const areaTypeEnum = pgEnum('area_type', ['service_zone', 'coverage_area', 'territory', 'district']);
export const routeTypeEnum = pgEnum('route_type', ['maintenance', 'installation', 'emergency', 'inspection']);
export const difficultyLevelEnum = pgEnum('difficulty_level', ['easy', 'medium', 'hard', 'extreme']);
export const serviceLevelEnum = pgEnum('service_level', ['premium', 'standard', 'basic']);
export const securityLevelEnum = pgEnum('security_level', ['public', 'restricted', 'high_security', 'military']);
export const accessTypeEnum = pgEnum('access_type', ['pedestrian', 'motorcycle', 'car', 'truck', 'specialized']);
export const membershipTypeEnum = pgEnum('membership_type', ['primary', 'secondary', 'backup']);
export const groupTypeEnum = pgEnum('group_type', ['region', 'district', 'zone', 'territory']);

// Main locations table - Core geospatial data
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  locationType: locationTypeEnum('location_type').notNull(),
  geometryType: geometryTypeEnum('geometry_type').notNull(),
  coordinates: jsonb('coordinates').notNull(), // GeoJSON completo
  addressData: jsonb('address_data'), // Endereço estruturado
  businessHours: jsonb('business_hours'), // Horários de funcionamento
  accessRequirements: jsonb('access_requirements'), // Requisitos de acesso
  slaConfig: jsonb('sla_config'), // Configurações de SLA
  status: locationStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Location segments for linear infrastructure
export const locationSegments = pgTable('location_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  segmentType: segmentTypeEnum('segment_type').notNull(),
  startCoordinates: jsonb('start_coordinates').notNull(),
  endCoordinates: jsonb('end_coordinates').notNull(),
  pathCoordinates: jsonb('path_coordinates'), // Array de pontos do trajeto
  lengthMeters: decimal('length_meters', { precision: 10, scale: 2 }),
  infrastructureData: jsonb('infrastructure_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Geographic areas and regions
export const locationAreas = pgTable('location_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  areaType: areaTypeEnum('area_type').notNull(),
  boundaryCoordinates: jsonb('boundary_coordinates').notNull(), // Polígono
  areaSizeKm2: decimal('area_size_km2', { precision: 10, scale: 2 }),
  populationEstimate: integer('population_estimate'),
  serviceLevel: serviceLevelEnum('service_level').notNull().default('standard'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Dynamic routes
export const locationRoutes = pgTable('location_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  routeName: varchar('route_name', { length: 200 }).notNull(),
  routeType: routeTypeEnum('route_type').notNull(),
  routeCoordinates: jsonb('route_coordinates').notNull(), // Array ordenado de coordenadas
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  difficultyLevel: difficultyLevelEnum('difficulty_level').notNull().default('medium'),
  requiredSkills: jsonb('required_skills'), // Array de skill IDs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Area groups for hierarchical organization
export const areaGroups = pgTable('area_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  groupName: varchar('group_name', { length: 200 }).notNull(),
  groupType: groupTypeEnum('group_type').notNull(),
  parentGroupId: uuid('parent_group_id').references(() => areaGroups.id, { onDelete: 'cascade' }),
  coordinatesCenter: jsonb('coordinates_center'),
  totalLocations: integer('total_locations').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Location memberships in area groups
export const locationAreaMemberships = pgTable('location_area_memberships', {
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  areaGroupId: uuid('area_group_id').notNull().references(() => areaGroups.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  membershipType: membershipTypeEnum('membership_type').notNull().default('primary'),
  createdAt: timestamp('created_at').defaultNow()
});

// Zod schemas for validation
export const insertLocationSchema = createInsertSchema(locations, {
  name: z.string().min(1, "Nome é obrigatório").max(200),
  coordinates: z.any(), // GeoJSON validation would be complex
  locationType: z.enum(['point', 'segment', 'area', 'region', 'route']),
  geometryType: z.enum(['point', 'linestring', 'polygon', 'multipolygon']),
  status: z.enum(['active', 'inactive', 'maintenance', 'restricted']).default('active')
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertLocationSegmentSchema = createInsertSchema(locationSegments, {
  segmentType: z.enum(['fiber', 'cable', 'pipeline', 'rail', 'road']),
  startCoordinates: z.any(),
  endCoordinates: z.any(),
  lengthMeters: z.string().regex(/^\d+(\.\d{1,2})?$/, "Formato inválido")
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertLocationAreaSchema = createInsertSchema(locationAreas, {
  areaType: z.enum(['service_zone', 'coverage_area', 'territory', 'district']),
  boundaryCoordinates: z.any(),
  serviceLevel: z.enum(['premium', 'standard', 'basic']).default('standard')
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertLocationRouteSchema = createInsertSchema(locationRoutes, {
  routeName: z.string().min(1, "Nome da rota é obrigatório").max(200),
  routeType: z.enum(['maintenance', 'installation', 'emergency', 'inspection']),
  routeCoordinates: z.any(),
  difficultyLevel: z.enum(['easy', 'medium', 'hard', 'extreme']).default('medium')
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAreaGroupSchema = createInsertSchema(areaGroups, {
  groupName: z.string().min(1, "Nome do grupo é obrigatório").max(200),
  groupType: z.enum(['region', 'district', 'zone', 'territory'])
}).omit({ id: true, createdAt: true, updatedAt: true });

// TypeScript types
export type Location = typeof locations.$inferSelect;
export type NewLocation = z.infer<typeof insertLocationSchema>;
export type LocationSegment = typeof locationSegments.$inferSelect;
export type NewLocationSegment = z.infer<typeof insertLocationSegmentSchema>;
export type LocationArea = typeof locationAreas.$inferSelect;
export type NewLocationArea = z.infer<typeof insertLocationAreaSchema>;
export type LocationRoute = typeof locationRoutes.$inferSelect;
export type NewLocationRoute = z.infer<typeof insertLocationRouteSchema>;
export type AreaGroup = typeof areaGroups.$inferSelect;
export type NewAreaGroup = z.infer<typeof insertAreaGroupSchema>;
export type LocationAreaMembership = typeof locationAreaMemberships.$inferSelect;

// Business hours schema validation
export const businessHoursSchema = z.object({
  default_hours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() })
  }),
  special_dates: z.array(z.object({
    date: z.string(),
    closed: z.boolean(),
    open: z.string().optional(),
    close: z.string().optional(),
    reason: z.string()
  })).optional(),
  seasonal_adjustments: z.array(z.object({
    start_date: z.string(),
    end_date: z.string(),
    modified_hours: z.any(),
    reason: z.string()
  })).optional()
});

// Access requirements schema validation
export const accessRequirementsSchema = z.object({
  security_level: z.enum(['public', 'restricted', 'high_security', 'military']),
  authorization_required: z.boolean(),
  access_instructions: z.string().optional(),
  emergency_contact: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email()
  }).optional(),
  equipment_required: z.array(z.string()).optional(),
  vehicle_restrictions: z.object({
    height_limit_cm: z.number().optional(),
    weight_limit_kg: z.number().optional(),
    access_type: z.enum(['pedestrian', 'motorcycle', 'car', 'truck', 'specialized'])
  }).optional(),
  parking_available: z.boolean().optional(),
  public_transport_access: z.string().optional(),
  best_access_route: z.any().optional()
});

// SLA configuration schema validation
export const slaConfigSchema = z.object({
  standard_response_time_minutes: z.number(),
  priority_response_time_minutes: z.number(),
  emergency_response_time_minutes: z.number(),
  max_travel_time_minutes: z.number(),
  preferred_technician_radius_km: z.number(),
  backup_technician_radius_km: z.number(),
  cost_per_km: z.string().regex(/^\d+(\.\d{1,2})?$/),
  difficulty_multiplier: z.number()
});
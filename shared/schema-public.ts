// ✅ 1QA.MD COMPLIANCE: PUBLIC SCHEMA - CROSS-TENANT ESSENTIAL TABLES
// Only tables that MUST be shared across tenants

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// PUBLIC SCHEMA TABLES (Cross-tenant only)
// ========================================

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tenants table for multi-tenancy
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table - JWT Authentication (public schema) - Extended with complete HR fields
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { length: 50 }).default("agent").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  profileImageUrl: varchar("profile_image_url"),

  // Dados Básicos - Basic Information
  integrationCode: varchar("integration_code", { length: 100 }),
  alternativeEmail: varchar("alternative_email"),
  cellPhone: varchar("cell_phone", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  ramal: varchar("ramal", { length: 20 }),
  timeZone: varchar("time_zone", { length: 50 }).default("America/Sao_Paulo"),
  vehicleType: varchar("vehicle_type", { length: 50 }), // Nenhum, Particular, Empresarial
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }),
  supervisorIds: text("supervisor_ids").array(),

  // Endereço - Address Information
  cep: varchar("cep", { length: 10 }),
  country: varchar("country", { length: 100 }).default("Brasil"),
  state: varchar("state", { length: 100 }),
  city: varchar("city", { length: 100 }),
  streetAddress: varchar("street_address"),
  houseType: varchar("house_type", { length: 50 }),
  houseNumber: varchar("house_number", { length: 20 }),
  complement: varchar("complement"),
  neighborhood: varchar("neighborhood", { length: 100 }),

  // Dados RH - HR Information
  employeeCode: varchar("employee_code", { length: 50 }),
  pis: varchar("pis", { length: 20 }),
  cargo: varchar("cargo", { length: 100 }),
  ctps: varchar("ctps", { length: 50 }),
  serieNumber: varchar("serie_number", { length: 20 }),
  admissionDate: timestamp("admission_date"),
  costCenter: varchar("cost_center", { length: 100 }),

  // HR Extension Fields for TeamManagement (existing)
  position: varchar("position", { length: 100 }),
  departmentId: uuid("department_id"),
  performance: integer("performance").default(75), // Performance percentage
  lastActiveAt: timestamp("last_active_at"),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, pending
  goals: integer("goals").default(0),
  completedGoals: integer("completed_goals").default(0),

  // Employment Type for CLT vs Autonomous classification
  employmentType: varchar("employment_type", { length: 20 }).default("clt"), // 'clt' or 'autonomo'

  // System fields
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // TENANT ISOLATION: Email must be unique per tenant
  unique("users_tenant_email_unique").on(table.tenantId, table.email),
  index("users_tenant_idx").on(table.tenantId),
  index("users_role_idx").on(table.role),
  index("users_active_idx").on(table.isActive),
]);

// User Sessions table (public schema)
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sessionToken: varchar("session_token", { length: 255 }).notNull(),
  deviceType: varchar("device_type", { length: 50 }),
  browser: varchar("browser", { length: 100 }),
  operatingSystem: varchar("operating_system", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: jsonb("location"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // TENANT ISOLATION: Session tokens must be unique per tenant
  unique("user_sessions_tenant_token_unique").on(table.tenantId, table.sessionToken),
  index("user_sessions_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_sessions_active_idx").on(table.isActive, table.lastActivity),
]);

// ========================================
// SCHEMA VALIDATION & TYPES
// ========================================

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants);
export const insertUserSchema = createInsertSchema(users);
export const insertUserSessionSchema = createInsertSchema(userSessions);

// Update schema - Only allow updating specific fields, exclude system fields
export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  lastActiveAt: true,
}).partial().transform((data) => {
  // Normalize email to lowercase if provided
  if (data.email) {
    data.email = data.email.toLowerCase();
  }
  return data;
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
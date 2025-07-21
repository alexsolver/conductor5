// Base database schema definitions - Common tables shared across all tenants
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// User storage table - JWT Authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { length: 50 }).default("agent").notNull(), // saas_admin, tenant_admin, agent, customer
  tenantId: uuid("tenant_id").references(() => tenants.id),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema types
export const insertSessionSchema = createInsertSchema(sessions);
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
// Security-related schema definitions
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, tenants } from "./base";

// Security Events for authentication monitoring
export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // login, logout, failed_login, password_reset, etc.
  severity: varchar("severity", { length: 20 }).default("info"), // info, warning, error, critical
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Two-Factor Authentication
export const userTwoFactor = pgTable("user_two_factor", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  secret: varchar("secret", { length: 32 }).notNull(),
  backupCodes: jsonb("backup_codes").default([]),
  isEnabled: boolean("is_enabled").default(false),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Account Lockouts
export const accountLockouts = pgTable("account_lockouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  attempts: integer("attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  reason: varchar("reason", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password Reset Tokens
export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 100 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Magic Links for passwordless authentication
export const magicLinks = pgTable("magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUserTwoFactorSchema = createInsertSchema(userTwoFactor).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountLockoutSchema = createInsertSchema(accountLockouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).omit({
  id: true,
  createdAt: true,
});

export const insertMagicLinkSchema = createInsertSchema(magicLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type InsertUserTwoFactor = z.infer<typeof insertUserTwoFactorSchema>;
export type InsertAccountLockout = z.infer<typeof insertAccountLockoutSchema>;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type UserTwoFactor = typeof userTwoFactor.$inferSelect;
export type AccountLockout = typeof accountLockouts.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type MagicLink = typeof magicLinks.$inferSelect;
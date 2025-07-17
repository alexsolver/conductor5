import { pgTable, varchar, uuid, timestamp, boolean, text, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./base";
import { tenants } from "./base";

// User-Tenant Relationships - permite um usuário ter acesso a múltiplos tenants
export const userTenantRelationships = pgTable("user_tenant_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(), // Role específico para este tenant
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false), // Indica se é o tenant principal do usuário
  grantedBy: uuid("granted_by").references(() => users.id), // Quem concedeu o acesso
  grantedAt: timestamp("granted_at").defaultNow(),
  lastAccessed: timestamp("last_accessed"),
  permissions: json("permissions").$type<Record<string, any>>(), // Permissões específicas para este tenant
  notes: text("notes"), // Notas sobre o acesso
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Convites para adicionar usuários existentes a novos tenants
export const userTenantInvitations = pgTable("user_tenant_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  inviterId: uuid("inviter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Pode ser um usuário existente ou email para novo usuário
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }),
  
  role: varchar("role", { length: 50 }).notNull(),
  message: text("message"),
  permissions: json("permissions").$type<Record<string, any>>(),
  
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, rejected, expired
  expiresAt: timestamp("expires_at"),
  respondedAt: timestamp("responded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Histórico de acesso do usuário aos tenants
export const userTenantAccessLog = pgTable("user_tenant_access_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(), // login, logout, switch_tenant, access_granted, access_revoked
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: json("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow()
});

// Tipos TypeScript
export type UserTenantRelationship = typeof userTenantRelationships.$inferSelect;
export type InsertUserTenantRelationship = typeof userTenantRelationships.$inferInsert;

export type UserTenantInvitation = typeof userTenantInvitations.$inferSelect;
export type InsertUserTenantInvitation = typeof userTenantInvitations.$inferInsert;

export type UserTenantAccessLog = typeof userTenantAccessLog.$inferSelect;
export type InsertUserTenantAccessLog = typeof userTenantAccessLog.$inferInsert;

// Schemas Zod
export const insertUserTenantRelationshipSchema = createInsertSchema(userTenantRelationships);
export const selectUserTenantRelationshipSchema = createSelectSchema(userTenantRelationships);

export const insertUserTenantInvitationSchema = createInsertSchema(userTenantInvitations);
export const selectUserTenantInvitationSchema = createSelectSchema(userTenantInvitations);

export const insertUserTenantAccessLogSchema = createInsertSchema(userTenantAccessLog);
export const selectUserTenantAccessLogSchema = createSelectSchema(userTenantAccessLog);

// Schemas para API
export const createUserTenantRelationshipSchema = insertUserTenantRelationshipSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  grantedAt: true
});

export const updateUserTenantRelationshipSchema = insertUserTenantRelationshipSchema.partial().omit({
  id: true,
  userId: true,
  tenantId: true,
  createdAt: true,
  grantedAt: true
});

export const createUserTenantInvitationSchema = insertUserTenantInvitationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  respondedAt: true
});

export const updateUserTenantInvitationSchema = insertUserTenantInvitationSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Enums para validação
export const USER_TENANT_INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired"
} as const;

export const USER_TENANT_ACCESS_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",
  SWITCH_TENANT: "switch_tenant",
  ACCESS_GRANTED: "access_granted",
  ACCESS_REVOKED: "access_revoked"
} as const;

// Validações
export const userTenantInvitationStatusSchema = z.enum([
  USER_TENANT_INVITATION_STATUS.PENDING,
  USER_TENANT_INVITATION_STATUS.ACCEPTED,
  USER_TENANT_INVITATION_STATUS.REJECTED,
  USER_TENANT_INVITATION_STATUS.EXPIRED
]);

export const userTenantAccessActionSchema = z.enum([
  USER_TENANT_ACCESS_ACTIONS.LOGIN,
  USER_TENANT_ACCESS_ACTIONS.LOGOUT,
  USER_TENANT_ACCESS_ACTIONS.SWITCH_TENANT,
  USER_TENANT_ACCESS_ACTIONS.ACCESS_GRANTED,
  USER_TENANT_ACCESS_ACTIONS.ACCESS_REVOKED
]);
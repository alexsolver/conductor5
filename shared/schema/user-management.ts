import { pgTable, text, boolean, timestamp, uuid, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { tenants } from "./base";

// User Groups/Teams within tenants
export const userGroups = pgTable("user_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by").notNull(),
});

// User Group Memberships
export const userGroupMemberships = pgTable("user_group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  groupId: uuid("group_id").notNull().references(() => userGroups.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // member, lead, coordinator
  isActive: boolean("is_active").default(true),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: text("assigned_by").notNull(),
});

// Custom Roles (tenant-specific)
export const customRoles = pgTable("custom_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  basedOnRole: text("based_on_role"), // Reference to system role
  permissions: json("permissions").$type<Array<{resource: string, action: string, conditions?: Record<string, any>}>>().default([]),
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false), // Cannot be edited
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by").notNull(),
});

// User Role Assignments
export const userRoleAssignments = pgTable("user_role_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  roleId: uuid("role_id").references(() => customRoles.id, { onDelete: "cascade" }), // null for system roles
  systemRole: text("system_role"), // For system roles: saas_admin, tenant_admin, agent, customer
  scope: text("scope").default("tenant"), // tenant, group, location
  scopeId: uuid("scope_id"), // Reference to tenant, group, or location
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: text("assigned_by").notNull(),
  justification: text("justification"),
});

// Permission Overrides (granular permissions)
export const userPermissionOverrides = pgTable("user_permission_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  granted: boolean("granted").notNull(), // true = grant, false = deny
  conditions: json("conditions").$type<Record<string, any>>(),
  scope: text("scope").default("tenant"),
  scopeId: uuid("scope_id"),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: text("granted_by").notNull(),
  justification: text("justification").notNull(),
});

// User Invitations
export const userInvitations = pgTable("user_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  department: text("department"),
  position: text("position"),
  roleAssignments: json("role_assignments").$type<Array<{systemRole?: string, customRoleId?: string, groupIds?: string[]}>>().default([]),
  status: text("status").default("pending"), // pending, accepted, expired, revoked
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  invitedAt: timestamp("invited_at").defaultNow(),
  invitedBy: text("invited_by").notNull(),
  acceptedAt: timestamp("accepted_at"),
  notes: text("notes"),
});

// User Status Types
export const userStatusTypes = pgTable("user_status_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null for system types
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6b7280"),
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false),
  restrictions: json("restrictions").$type<Array<string>>().default([]), // Array of restricted actions
  createdAt: timestamp("created_at").defaultNow(),
});

// User Activity Log
export const userActivityLog = pgTable("user_activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // login, logout, permission_change, role_change, etc.
  resource: text("resource"),
  resourceId: uuid("resource_id"),
  details: json("details").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").default(true),
  performedAt: timestamp("performed_at").defaultNow(),
  performedBy: text("performed_by"), // Who performed the action (if different from user)
});

// Active Sessions
export const activeSessions = pgTable("active_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Relations
export const userGroupsRelations = relations(userGroups, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [userGroups.tenantId],
    references: [tenants.id],
  }),
  // createdByUser relation removed due to different ID types
  memberships: many(userGroupMemberships),
}));

export const userGroupMembershipsRelations = relations(userGroupMemberships, ({ one }) => ({
  group: one(userGroups, {
    fields: [userGroupMemberships.groupId],
    references: [userGroups.id],
  }),
  // user and assignedByUser relations removed due to different ID types
}));

export const customRolesRelations = relations(customRoles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customRoles.tenantId],
    references: [tenants.id],
  }),
  // createdByUser relation removed due to different ID types
  assignments: many(userRoleAssignments),
}));

export const userRoleAssignmentsRelations = relations(userRoleAssignments, ({ one }) => ({
  customRole: one(customRoles, {
    fields: [userRoleAssignments.roleId],
    references: [customRoles.id],
  }),
  // user and assignedByUser relations removed due to different ID types
}));

export const userPermissionOverridesRelations = relations(userPermissionOverrides, ({ one }) => ({
  // user and grantedByUser relations removed due to different ID types
}));

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userInvitations.tenantId],
    references: [tenants.id],
  }),
  // invitedByUser relation removed due to different ID types
}));

export const userActivityLogRelations = relations(userActivityLog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userActivityLog.tenantId],
    references: [tenants.id],
  }),
  // user and performedByUser relations removed due to different ID types
}));

export const activeSessionsRelations = relations(activeSessions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [activeSessions.tenantId],
    references: [tenants.id],
  }),
  // user relation removed due to different ID types
}));

// Zod Schemas
export const insertUserGroupSchema = createInsertSchema(userGroups);
export const selectUserGroupSchema = createSelectSchema(userGroups);
export const insertUserGroupMembershipSchema = createInsertSchema(userGroupMemberships);
export const selectUserGroupMembershipSchema = createSelectSchema(userGroupMemberships);
export const insertCustomRoleSchema = createInsertSchema(customRoles);
export const selectCustomRoleSchema = createSelectSchema(customRoles);
export const insertUserRoleAssignmentSchema = createInsertSchema(userRoleAssignments);
export const selectUserRoleAssignmentSchema = createSelectSchema(userRoleAssignments);
export const insertUserPermissionOverrideSchema = createInsertSchema(userPermissionOverrides);
export const selectUserPermissionOverrideSchema = createSelectSchema(userPermissionOverrides);
export const insertUserInvitationSchema = createInsertSchema(userInvitations);
export const selectUserInvitationSchema = createSelectSchema(userInvitations);
export const insertUserStatusTypeSchema = createInsertSchema(userStatusTypes);
export const selectUserStatusTypeSchema = createSelectSchema(userStatusTypes);
export const insertUserActivityLogSchema = createInsertSchema(userActivityLog);
export const selectUserActivityLogSchema = createSelectSchema(userActivityLog);
export const insertActiveSessionSchema = createInsertSchema(activeSessions);
export const selectActiveSessionSchema = createSelectSchema(activeSessions);

// Types
export type UserGroup = typeof userGroups.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroupMembership = typeof userGroupMemberships.$inferSelect;
export type InsertUserGroupMembership = z.infer<typeof insertUserGroupMembershipSchema>;
export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type InsertUserRoleAssignment = z.infer<typeof insertUserRoleAssignmentSchema>;
export type UserPermissionOverride = typeof userPermissionOverrides.$inferSelect;
export type InsertUserPermissionOverride = z.infer<typeof insertUserPermissionOverrideSchema>;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;
export type UserStatusType = typeof userStatusTypes.$inferSelect;
export type InsertUserStatusType = z.infer<typeof insertUserStatusTypeSchema>;
export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type InsertActiveSession = z.infer<typeof insertActiveSessionSchema>;
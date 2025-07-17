import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  
  // Status fields
  verified: boolean("verified").default(false),
  active: boolean("active").default(true),
  suspended: boolean("suspended").default(false),
  lastLogin: timestamp("last_login"),
  
  // Localization fields
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  locale: varchar("locale", { length: 10 }).default("en-US"),
  language: varchar("language", { length: 10 }).default("en"),
  
  // Additional fields
  externalId: varchar("external_id", { length: 100 }),
  role: varchar("role", { length: 50 }).default("customer"),
  notes: text("notes"),
  avatar: varchar("avatar", { length: 255 }),
  signature: text("signature"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table - ServiceNow style professional fields
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Basic Fields
  number: varchar("number", { length: 50 }).notNull().unique(), // Auto-generated unique number like INC0010001
  shortDescription: varchar("short_description", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // critical, high, medium, low
  impact: varchar("impact", { length: 20 }).default("medium"), // high, medium, low
  urgency: varchar("urgency", { length: 20 }).default("medium"), // high, medium, low
  state: varchar("state", { length: 20 }).notNull().default("new"), // new, in_progress, resolved, closed, cancelled
  
  // Assignment Fields - Enhanced for flexible person referencing
  callerId: uuid("caller_id").notNull(), // Person who reported (flexible reference)
  callerType: varchar("caller_type", { length: 20 }).notNull().default("customer"), // 'user' | 'customer'
  beneficiaryId: uuid("beneficiary_id"), // Person who benefits from resolution (flexible reference)
  beneficiaryType: varchar("beneficiary_type", { length: 20 }).default("customer"), // 'user' | 'customer'
  openedById: varchar("opened_by_id").notNull().references(() => users.id), // Who opened the ticket
  assignedToId: varchar("assigned_to_id").references(() => users.id), // Agent who resolves
  assignmentGroup: varchar("assignment_group", { length: 100 }),
  customerId: uuid("customer_id").notNull().references(() => customers.id), // Legacy compatibility
  location: varchar("location", { length: 200 }),
  
  // Control Fields
  openedAt: timestamp("opened_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  resolutionCode: varchar("resolution_code", { length: 100 }),
  resolutionNotes: text("resolution_notes"),
  workNotes: text("work_notes"),
  additionalComments: text("additional_comments"),
  
  // CI/CMDB Fields
  configurationItem: varchar("configuration_item", { length: 200 }),
  businessService: varchar("business_service", { length: 200 }),
  
  // Communication Fields
  contactType: varchar("contact_type", { length: 20 }).default("email"), // email, phone, self_service, chat
  notify: boolean("notify").default(true),
  closeNotes: text("close_notes"),
  
  // Business Fields
  businessImpact: text("business_impact"),
  symptoms: text("symptoms"),
  rootCause: text("root_cause"),
  workaround: text("workaround"),
  
  // Legacy compatibility (mantém campos existentes)
  subject: varchar("subject", { length: 500 }).notNull(), // Maps to shortDescription
  status: varchar("status", { length: 50 }).default("open"), // Maps to state
  channel: varchar("channel", { length: 50 }).default("email"), // Maps to contactType
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket messages/comments
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  authorId: varchar("author_id").references(() => users.id),
  customerId: uuid("customer_id").references(() => customers.id),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("reply"), // reply, note, system
  isPublic: boolean("is_public").default(true),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Security tables
export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  ip: varchar("ip_address"),
  email: varchar("email"),
  identifier: varchar("identifier"),
  eventType: varchar("event_type").notNull(),
  attempts: integer("attempts").default(1),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userTwoFactor = pgTable("user_two_factor", {
  userId: varchar("user_id").primaryKey().notNull().references(() => users.id),
  secret: varchar("secret").notNull(),
  enabled: boolean("enabled").default(false),
  backupCodes: jsonb("backup_codes"),
  createdAt: timestamp("created_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const accountLockouts = pgTable("account_lockouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  reason: varchar("reason"),
  active: boolean("active").default(true),
  lockedAt: timestamp("locked_at").defaultNow(),
  unlockedAt: timestamp("unlocked_at"),
});

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").unique().notNull(),
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Configuration Tables
export const ticketCategories = pgTable("ticket_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  parentId: text("parent_id").references(() => ticketCategories.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  color: text("color").default("#3b82f6"),
  icon: text("icon"),
  active: boolean("active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const ticketStatuses = pgTable("ticket_statuses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type", { enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'] }).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  color: text("color").default("#3b82f6"),
  order: integer("order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const ticketPriorities = pgTable("ticket_priorities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  level: integer("level").notNull(), // 1-5
  slaHours: integer("sla_hours").default(24),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  color: text("color").default("#3b82f6"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const statusTransitions = pgTable("status_transitions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromStatusId: text("from_status_id").references(() => ticketStatuses.id).notNull(),
  toStatusId: text("to_status_id").references(() => ticketStatuses.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  requiredRole: text("required_role"),
  createdAt: timestamp("created_at").defaultNow()
});

export const assignmentGroups = pgTable("assignment_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const ticketLocations = pgTable("ticket_locations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  parentId: text("parent_id").references(() => ticketLocations.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const magicLinks = pgTable("magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").notNull(),
  token: varchar("token").unique().notNull(),
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  tickets: many(tickets),
  activityLogs: many(activityLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  assignedTickets: many(tickets),
  ticketMessages: many(ticketMessages),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  tickets: many(tickets),
  ticketMessages: many(ticketMessages),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tickets.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [tickets.customerId],
    references: [customers.id],
  }),
  // Note: caller and beneficiary relations are handled dynamically based on type
  // Use callerType and beneficiaryType to determine if referencing users or customers
  openedBy: one(users, {
    fields: [tickets.openedById],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [ticketMessages.authorId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [ticketMessages.customerId],
    references: [customers.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [activityLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const ticketCategoriesRelations = relations(ticketCategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [ticketCategories.tenantId],
    references: [tenants.id]
  }),
  parent: one(ticketCategories, {
    fields: [ticketCategories.parentId],
    references: [ticketCategories.id]
  }),
  children: many(ticketCategories)
}));

export const ticketStatusesRelations = relations(ticketStatuses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ticketStatuses.tenantId],
    references: [tenants.id]
  })
}));

export const ticketPrioritiesRelations = relations(ticketPriorities, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ticketPriorities.tenantId],
    references: [tenants.id]
  })
}));

export const statusTransitionsRelations = relations(statusTransitions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [statusTransitions.tenantId],
    references: [tenants.id]
  }),
  fromStatus: one(ticketStatuses, {
    fields: [statusTransitions.fromStatusId],
    references: [ticketStatuses.id]
  }),
  toStatus: one(ticketStatuses, {
    fields: [statusTransitions.toStatusId],
    references: [ticketStatuses.id]
  })
}));

export const assignmentGroupsRelations = relations(assignmentGroups, ({ one }) => ({
  tenant: one(tenants, {
    fields: [assignmentGroups.tenantId],
    references: [tenants.id]
  })
}));

export const ticketLocationsRelations = relations(ticketLocations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [ticketLocations.tenantId],
    references: [tenants.id]
  }),
  parent: one(ticketLocations, {
    fields: [ticketLocations.parentId],
    references: [ticketLocations.id]
  }),
  children: many(ticketLocations)
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
  openedAt: true,
}).extend({
  // Make some fields optional for creation
  number: z.string().optional(), // Auto-generated
  state: z.string().optional(),
  impact: z.string().optional(),
  urgency: z.string().optional(),
  beneficiaryId: z.string().optional(), // Optional - defaults to callerId
  beneficiaryType: z.enum(["user", "customer"]).optional(),
  callerType: z.enum(["user", "customer"]).optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),
  resolutionCode: z.string().optional(),
  resolutionNotes: z.string().optional(),
  workNotes: z.string().optional(),
  additionalComments: z.string().optional(),
  configurationItem: z.string().optional(),
  businessService: z.string().optional(),
  contactType: z.string().optional(),
  closeNotes: z.string().optional(),
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  rootCause: z.string().optional(),
  workaround: z.string().optional(),
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTicketCategorySchema = createInsertSchema(ticketCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketStatusSchema = createInsertSchema(ticketStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketPrioritySchema = createInsertSchema(ticketPriorities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStatusTransitionSchema = createInsertSchema(statusTransitions).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentGroupSchema = createInsertSchema(assignmentGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketLocationSchema = createInsertSchema(ticketLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type TicketCategory = typeof ticketCategories.$inferSelect;
export type InsertTicketCategory = z.infer<typeof insertTicketCategorySchema>;
export type TicketStatus = typeof ticketStatuses.$inferSelect;
export type InsertTicketStatus = z.infer<typeof insertTicketStatusSchema>;
export type TicketPriority = typeof ticketPriorities.$inferSelect;
export type InsertTicketPriority = z.infer<typeof insertTicketPrioritySchema>;
export type StatusTransition = typeof statusTransitions.$inferSelect;
export type InsertStatusTransition = z.infer<typeof insertStatusTransitionSchema>;
export type AssignmentGroup = typeof assignmentGroups.$inferSelect;
export type InsertAssignmentGroup = z.infer<typeof insertAssignmentGroupSchema>;
export type TicketLocation = typeof ticketLocations.$inferSelect;
export type InsertTicketLocation = z.infer<typeof insertTicketLocationSchema>;

// Function to create tenant-specific schema with proper naming
export function getTenantSpecificSchema(schemaName: string) {
  // Customers table for tenant schema
  const tenantCustomers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),
    tags: jsonb("tags").default([]),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  // Tickets table for tenant schema
  const tenantTickets = pgTable("tickets", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => tenantCustomers.id),
    assignedToId: varchar("assigned_to_id"), // References public.users
    subject: varchar("subject", { length: 500 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("open"),
    priority: varchar("priority", { length: 50 }).default("medium"),
    tags: jsonb("tags").default([]),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  // Ticket Messages table for tenant schema
  const tenantTicketMessages = pgTable("ticket_messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id").notNull().references(() => tenantTickets.id),
    authorId: varchar("author_id"), // References public.users
    customerId: uuid("customer_id").references(() => tenantCustomers.id),
    content: text("content").notNull(),
    isInternal: boolean("is_internal").default(false),
    attachments: jsonb("attachments").default([]),
    createdAt: timestamp("created_at").defaultNow(),
  });

  // Activity Logs table for tenant schema
  const tenantActivityLogs = pgTable("activity_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id"), // References public.users
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: uuid("entity_id"),
    details: jsonb("details").default({}),
    createdAt: timestamp("created_at").defaultNow(),
  });

  // Relations for tenant schema
  const tenantCustomersRelations = relations(tenantCustomers, ({ many }) => ({
    tickets: many(tenantTickets),
    messages: many(tenantTicketMessages),
  }));

  const tenantTicketsRelations = relations(tenantTickets, ({ one, many }) => ({
    customer: one(tenantCustomers, {
      fields: [tenantTickets.customerId],
      references: [tenantCustomers.id],
    }),
    messages: many(tenantTicketMessages),
  }));

  const tenantTicketMessagesRelations = relations(tenantTicketMessages, ({ one }) => ({
    ticket: one(tenantTickets, {
      fields: [tenantTicketMessages.ticketId],
      references: [tenantTickets.id],
    }),
    customer: one(tenantCustomers, {
      fields: [tenantTicketMessages.customerId],
      references: [tenantCustomers.id],
    }),
  }));

  const tenantActivityLogsRelations = relations(tenantActivityLogs, ({ one }) => ({}));

  return {
    customers: tenantCustomers,
    tickets: tenantTickets,
    ticketMessages: tenantTicketMessages,
    activityLogs: tenantActivityLogs,
    customersRelations: tenantCustomersRelations,
    ticketsRelations: tenantTicketsRelations,
    ticketMessagesRelations: tenantTicketMessagesRelations,
    activityLogsRelations: tenantActivityLogsRelations,
  };
}

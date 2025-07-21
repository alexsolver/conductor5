// Ticket schema definitions
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  uuid,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./base";
import { customers } from "./customer";

// Tickets table with ServiceNow-style professional fields
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Legacy fields (maintained for backward compatibility)
  subject: varchar("subject", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  
  // ServiceNow standard fields
  number: varchar("number", { length: 40 }), // Auto-generated ticket number
  shortDescription: varchar("short_description", { length: 160 }),
  category: varchar("category", { length: 50 }),
  subcategory: varchar("subcategory", { length: 50 }),
  impact: varchar("impact", { length: 20 }).default("medium"), // low, medium, high, critical
  urgency: varchar("urgency", { length: 20 }).default("medium"), // low, medium, high, critical
  state: varchar("state", { length: 20 }).default("new"), // new, in_progress, resolved, closed
  
  // Assignment fields
  customerId: uuid("customer_id").references(() => customers.id),
  assignedToId: varchar("assigned_to_id"),
  callerId: uuid("caller_id"),
  openedById: uuid("opened_by_id"),
  assignmentGroup: varchar("assignment_group", { length: 100 }),
  location: varchar("location", { length: 100 }),
  
  // Time tracking fields
  openedAt: timestamp("opened_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  
  // Resolution fields
  resolutionCode: varchar("resolution_code", { length: 50 }),
  resolutionNotes: text("resolution_notes"),
  workNotes: jsonb("work_notes").default([]),
  
  // CI/CMDB fields
  configurationItem: varchar("configuration_item", { length: 100 }),
  businessService: varchar("business_service", { length: 100 }),
  
  // Communication fields
  contactType: varchar("contact_type", { length: 20 }).default("email"), // email, phone, chat, portal
  notify: varchar("notify", { length: 20 }).default("do_not_notify"),
  closeNotes: text("close_notes"),
  
  // Business impact fields
  businessImpact: varchar("business_impact", { length: 50 }),
  symptoms: text("symptoms"),
  rootCause: text("root_cause"),
  workaround: text("workaround"),
  
  // Additional person references for flexible assignment
  beneficiaryId: uuid("beneficiary_id"), // Who benefits from this ticket
  beneficiaryType: varchar("beneficiary_type", { length: 20 }), // 'customer' or 'user'
  callerType: varchar("caller_type", { length: 20 }), // 'customer' or 'user'
  
  // Integration with Project Actions System
  relatedProjectId: uuid("related_project_id"), // Link to project if ticket came from action
  relatedActionId: uuid("related_action_id"), // Link to specific action that generated this ticket
  actionConversionData: jsonb("action_conversion_data").$type<{
    originalActionType?: string;
    projectName?: string;
    actionTitle?: string;
    convertedAt?: string;
    convertedBy?: string;
  }>().default({}),
  
  // Ticket hierarchy and linking
  parentTicketId: uuid("parent_ticket_id").references(() => tickets.id), // For ticket hierarchy
  relatedTicketIds: jsonb("related_ticket_ids").default([]), // For linked tickets
  linkType: varchar("link_type", { length: 30 }), // 'duplicate', 'related', 'blocks', 'caused_by'
  hierarchyLevel: integer("hierarchy_level").default(0), // 0 = root, 1 = child, 2 = grandchild, etc.
  rootTicketId: uuid("root_ticket_id").references(() => tickets.id), // Points to root ticket for fast queries
  
  // Metadata
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket messages for communication history
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  customerId: uuid("customer_id").references(() => customers.id),
  userId: varchar("user_id"),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("comment"), // comment, note, resolution
  isInternal: varchar("is_internal", { length: 10 }).default("false"),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket relationships for linking and hierarchy
export const ticketRelationships = pgTable("ticket_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  sourceTicketId: uuid("source_ticket_id").notNull().references(() => tickets.id),
  targetTicketId: uuid("target_ticket_id").notNull().references(() => tickets.id),
  relationshipType: varchar("relationship_type", { length: 30 }).notNull(), 
  // Types: 'parent_child', 'duplicate', 'related', 'blocks', 'caused_by', 'follows'
  description: text("description"), // Optional description of the relationship
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema types
export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertTicketRelationshipSchema = createInsertSchema(ticketRelationships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type InsertTicketRelationship = z.infer<typeof insertTicketRelationshipSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type TicketRelationship = typeof ticketRelationships.$inferSelect;
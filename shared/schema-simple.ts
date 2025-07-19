// Simplified schema for initial setup - avoiding complex relations
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
  role: varchar("role", { length: 50 }).default("agent").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table (Solicitantes - internal system requesters)
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }), // For Brazilian customers
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorecidos table (External contacts who can be beneficiaries of tickets)
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }), // For Brazilian contacts
  contactType: varchar("contact_type", { length: 50 }).default("external"), // external, partner, vendor
  relationship: varchar("relationship", { length: 100 }), // business relationship description
  preferredContactMethod: varchar("preferred_contact_method", { length: 50 }).default("email"), // email, phone, whatsapp
  notes: text("notes"), // Internal notes about this contact
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Simplified tickets table - Modern person management system
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  subject: varchar("subject", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  // Modern person management fields
  callerId: uuid("caller_id").notNull(), // Person who reported the issue  
  callerType: varchar("caller_type", { length: 20 }).notNull().default("customer"), // 'user' or 'customer'
  beneficiaryId: uuid("beneficiary_id"), // Person who benefits from resolution (optional, defaults to caller)
  beneficiaryType: varchar("beneficiary_type", { length: 20 }).default("customer"), // 'user' or 'customer'
  assignedToId: varchar("assigned_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Simplified ticket messages - Modern person management system
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  // Modern person management - messages can be from any person type
  personId: uuid("person_id"), // ID of the person who wrote the message
  personType: varchar("person_type", { length: 20 }).default("customer"), // 'user' or 'customer'
  userId: varchar("user_id"), // Legacy field for backward compatibility
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("comment"),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Removed: external_contacts table - functionality eliminated from system

// Locations table
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorecido-Location association table (many-to-many relationship)
export const favorecidoLocations = pgTable("favorecido_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  favorecidoId: uuid("favorecido_id").references(() => favorecidos.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false), // Mark primary location for favorecido
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
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
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertFavorecidoSchema = createInsertSchema(favorecidos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});
// Removed: insertExternalContactSchema - functionality eliminated
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertFavorecidoLocationSchema = createInsertSchema(favorecidoLocations).omit({
  id: true,
  createdAt: true,
});

// Types
export type Session = typeof sessions.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Favorecido = typeof favorecidos.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
// Removed: ExternalContact type - functionality eliminated
export type Location = typeof locations.$inferSelect;
export type FavorecidoLocation = typeof favorecidoLocations.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertFavorecido = z.infer<typeof insertFavorecidoSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
// Removed: InsertExternalContact type - functionality eliminated
export type InsertLocation = z.infer<typeof insertLocationSchema>;
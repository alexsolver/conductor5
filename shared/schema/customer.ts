// Customer schema definitions
import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  uuid,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./base";
import { locations } from "./location";

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
  language: varchar("language", { length: 5 }).default("en"),
  
  // Professional fields
  externalId: varchar("external_id", { length: 255 }),
  role: varchar("role", { length: 100 }),
  notes: varchar("notes", { length: 1000 }),
  avatar: varchar("avatar", { length: 500 }),
  signature: varchar("signature", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema types
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Customer Locations relationship table (many-to-many)
export const customerLocations = pgTable("customer_locations", {
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.customerId, table.locationId] }),
  };
});

// Customer Location relationship schemas
export const insertCustomerLocationSchema = createInsertSchema(customerLocations).omit({
  createdAt: true,
});

export type InsertCustomerLocation = z.infer<typeof insertCustomerLocationSchema>;
export type CustomerLocation = typeof customerLocations.$inferSelect;
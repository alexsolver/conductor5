// Customer Company schema definitions
// This implements the CustomerCompany entity from the roadmap to manage customer organizations
import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  uuid,
  boolean,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { tenants } from "./base";
import { customers } from "./customer";

// Customer Companies - Organizations that customers belong to
export const customerCompanies = pgTable("customer_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Basic company information
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  size: varchar("size", { length: 50 }), // small, medium, large, enterprise
  
  // Contact information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  
  // Address information
  address: jsonb("address").$type<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }>(),
  
  // Business information
  taxId: varchar("tax_id", { length: 100 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  
  // Subscription and tier information
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("basic"), // basic, premium, enterprise
  contractType: varchar("contract_type", { length: 50 }), // monthly, yearly, custom
  maxUsers: integer("max_users"),
  maxTickets: integer("max_tickets"),
  
  // Company settings and preferences
  settings: jsonb("settings").$type<{
    timezone?: string;
    locale?: string;
    currency?: string;
    dateFormat?: string;
    timeFormat?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      slack?: boolean;
    };
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  }>().default({}),
  
  // Tags and metadata for customization
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Status and lifecycle
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, suspended, trial
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false), // For customers with multiple companies
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by"),
});

// Customer-Company relationships (many-to-many)
// A customer can be associated with multiple companies, and a company can have multiple customers
export const customerCompanyMemberships = pgTable("customer_company_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => customerCompanies.id, { onDelete: "cascade" }),
  
  // Membership details
  role: varchar("role", { length: 100 }).default("member"), // member, admin, owner, contact
  title: varchar("title", { length: 255 }), // Job title within the company
  department: varchar("department", { length: 255 }),
  
  // Permissions within the company context
  permissions: jsonb("permissions").$type<{
    canCreateTickets?: boolean;
    canViewAllTickets?: boolean;
    canManageUsers?: boolean;
    canViewBilling?: boolean;
    canManageSettings?: boolean;
  }>().default({}),
  
  // Status and lifecycle
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false), // Primary company for the customer
  
  // Audit fields
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  addedBy: text("added_by").notNull(),
}, (table) => {
  return {
    // Composite primary key to ensure unique customer-company relationships
    unique: primaryKey({ columns: [table.customerId, table.companyId] }),
  };
});

// Company billing information (separate table for sensitive data)
export const customerCompanyBilling = pgTable("customer_company_billing", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => customerCompanies.id, { onDelete: "cascade" }).unique(),
  
  // Billing contact
  billingEmail: varchar("billing_email", { length: 255 }),
  billingPhone: varchar("billing_phone", { length: 50 }),
  billingContact: varchar("billing_contact", { length: 255 }),
  
  // Billing address (may differ from company address)
  billingAddress: jsonb("billing_address").$type<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }>(),
  
  // Payment information
  paymentMethod: varchar("payment_method", { length: 50 }), // credit_card, bank_transfer, invoice
  currency: varchar("currency", { length: 3 }).default("USD"),
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly"), // monthly, quarterly, yearly
  
  // Contract information
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  autoRenew: boolean("auto_renew").default(true),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const customerCompaniesRelations = relations(customerCompanies, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customerCompanies.tenantId],
    references: [tenants.id],
  }),
  memberships: many(customerCompanyMemberships),
  billing: one(customerCompanyBilling, {
    fields: [customerCompanies.id],
    references: [customerCompanyBilling.companyId],
  }),
}));

export const customerCompanyMembershipsRelations = relations(customerCompanyMemberships, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCompanyMemberships.customerId],
    references: [customers.id],
  }),
  company: one(customerCompanies, {
    fields: [customerCompanyMemberships.companyId],
    references: [customerCompanies.id],
  }),
}));

export const customerCompanyBillingRelations = relations(customerCompanyBilling, ({ one }) => ({
  company: one(customerCompanies, {
    fields: [customerCompanyBilling.companyId],
    references: [customerCompanies.id],
  }),
}));

// Zod Schemas
export const insertCustomerCompanySchema = createInsertSchema(customerCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
  createdBy: z.string().min(1),
  website: z.string().optional().refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
    message: "Invalid URL format"
  }),
});

export const updateCustomerCompanySchema = insertCustomerCompanySchema.partial().omit({
  tenantId: true,
  createdBy: true,
}).extend({
  updatedBy: z.string().min(1),
});

export const insertCustomerCompanyMembershipSchema = createInsertSchema(customerCompanyMemberships).omit({
  id: true,
  joinedAt: true,
}).extend({
  customerId: z.string().uuid(),
  companyId: z.string().uuid(),
  addedBy: z.string().min(1),
});

export const insertCustomerCompanyBillingSchema = createInsertSchema(customerCompanyBilling).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().uuid(),
});

export const selectCustomerCompanySchema = createSelectSchema(customerCompanies);
export const selectCustomerCompanyMembershipSchema = createSelectSchema(customerCompanyMemberships);
export const selectCustomerCompanyBillingSchema = createSelectSchema(customerCompanyBilling);

// Types
export type CustomerCompany = typeof customerCompanies.$inferSelect;
export type InsertCustomerCompany = z.infer<typeof insertCustomerCompanySchema>;
export type UpdateCustomerCompany = z.infer<typeof updateCustomerCompanySchema>;

export type CustomerCompanyMembership = typeof customerCompanyMemberships.$inferSelect;
export type InsertCustomerCompanyMembership = z.infer<typeof insertCustomerCompanyMembershipSchema>;

export type CustomerCompanyBilling = typeof customerCompanyBilling.$inferSelect;
export type InsertCustomerCompanyBilling = z.infer<typeof insertCustomerCompanyBillingSchema>;
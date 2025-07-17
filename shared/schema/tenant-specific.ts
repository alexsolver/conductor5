// Tenant-specific schema generator for multi-tenant isolation
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
// Removed relations import to fix ExtraConfigBuilder error

/**
 * Creates tenant-specific tables with proper schema isolation
 * Each tenant gets their own schema with these isolated tables
 */
export function getTenantSpecificSchema(schemaName: string) {
  // Tenant-specific customers table
  const tenantCustomers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
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
  }, { schema: schemaName });

  // Tenant-specific tickets table
  const tenantTickets = pgTable("tickets", {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // Legacy fields
    subject: varchar("subject", { length: 500 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("open"),
    priority: varchar("priority", { length: 20 }).default("medium"),
    
    // ServiceNow standard fields
    number: varchar("number", { length: 40 }),
    shortDescription: varchar("short_description", { length: 160 }),
    category: varchar("category", { length: 50 }),
    subcategory: varchar("subcategory", { length: 50 }),
    impact: varchar("impact", { length: 20 }).default("medium"),
    urgency: varchar("urgency", { length: 20 }).default("medium"),
    state: varchar("state", { length: 20 }).default("new"),
    
    // Assignment fields
    customerId: uuid("customer_id").references(() => tenantCustomers.id),
    assignedToId: varchar("assigned_to_id"), // References public.users
    callerId: uuid("caller_id"),
    openedById: uuid("opened_by_id"), // References public.users
    assignmentGroup: varchar("assignment_group", { length: 100 }),
    location: varchar("location", { length: 100 }),
    
    // Time tracking
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
    contactType: varchar("contact_type", { length: 20 }).default("email"),
    notify: varchar("notify", { length: 20 }).default("do_not_notify"),
    closeNotes: text("close_notes"),
    
    // Business impact fields
    businessImpact: varchar("business_impact", { length: 50 }),
    symptoms: text("symptoms"),
    rootCause: text("root_cause"),
    workaround: text("workaround"),
    
    // Flexible person references
    beneficiaryId: uuid("beneficiary_id"),
    beneficiaryType: varchar("beneficiary_type", { length: 20 }),
    callerType: varchar("caller_type", { length: 20 }),
    
    // Metadata
    tags: jsonb("tags").default([]),
    metadata: jsonb("metadata").default({}),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName });

  // Tenant-specific ticket messages
  const tenantTicketMessages = pgTable("ticket_messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id").notNull().references(() => tenantTickets.id),
    customerId: uuid("customer_id").references(() => tenantCustomers.id),
    userId: varchar("user_id"), // References public.users
    content: text("content").notNull(),
    type: varchar("type", { length: 50 }).default("comment"),
    isInternal: varchar("is_internal", { length: 10 }).default("false"),
    attachments: jsonb("attachments").default([]),
    createdAt: timestamp("created_at").defaultNow(),
  }, { schema: schemaName });

  // Tenant-specific activity logs
  const tenantActivityLogs = pgTable("activity_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // ticket, customer, user
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(), // created, updated, deleted, assigned
    performedById: varchar("performed_by_id"), // References public.users
    performedByType: varchar("performed_by_type", { length: 20 }), // user, customer, system
    details: jsonb("details").default({}),
    previousValues: jsonb("previous_values").default({}),
    newValues: jsonb("new_values").default({}),
    createdAt: timestamp("created_at").defaultNow(),
  }, { schema: schemaName });

  // Tenant-specific locations table
  const tenantLocations = pgTable("locations", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).default("office"),
    status: varchar("status", { length: 50 }).default("active"),
    
    // Address fields
    address: varchar("address", { length: 500 }),
    number: varchar("number", { length: 20 }),
    complement: varchar("complement", { length: 100 }),
    neighborhood: varchar("neighborhood", { length: 100 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    zipCode: varchar("zip_code", { length: 20 }),
    country: varchar("country", { length: 50 }).default("Brasil"),
    
    // Geolocation
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),
    
    // Business hours and timezone
    businessHours: jsonb("business_hours").default({}),
    specialHours: jsonb("special_hours").default({}),
    timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
    
    // SLA and access
    slaId: uuid("sla_id"),
    accessInstructions: text("access_instructions"),
    requiresAuthorization: boolean("requires_authorization").default(false),
    
    // Security and emergency
    securityEquipment: jsonb("security_equipment").default({}),
    emergencyContacts: jsonb("emergency_contacts").default({}),
    
    // Metadata
    metadata: jsonb("metadata").default({}),
    tags: jsonb("tags").default([]),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName });

  // Return schema object compatible with Drizzle (without relations to avoid ExtraConfigBuilder error)
  return {
    customers: tenantCustomers,
    tickets: tenantTickets,
    ticketMessages: tenantTicketMessages,
    activityLogs: tenantActivityLogs,
    locations: tenantLocations,
  };
}
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
  // Tenant-specific customers table - OPTIMIZED STRUCTURE
  const tenantCustomers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),
    tags: varchar("tags", { length: 500 }), // Optimized: VARCHAR for simple tag lists
    metadata: text("metadata"), // Optimized: TEXT for optional complex data
    
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

  // Tenant-specific customer companies table
  const tenantCustomerCompanies = pgTable("customer_companies", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }),
    description: text("description"),
    industry: varchar("industry", { length: 100 }),
    size: varchar("size", { length: 50 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    website: varchar("website", { length: 500 }),
    address: text("address"), // Optimized: TEXT instead of JSONB for address
    taxId: varchar("tax_id", { length: 100 }),
    registrationNumber: varchar("registration_number", { length: 100 }),
    subscriptionTier: varchar("subscription_tier", { length: 50 }).default("basic"),
    contractType: varchar("contract_type", { length: 50 }),
    maxUsers: integer("max_users"),
    maxTickets: integer("max_tickets"),
    settings: text("settings"), // Optimized: TEXT for settings
    tags: varchar("tags", { length: 500 }), // Optimized: VARCHAR for tags
    metadata: text("metadata"), // Optimized: TEXT for metadata
    status: varchar("status", { length: 50 }).default("active"),
    isActive: boolean("is_active").default(true),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),
  }, { schema: schemaName });

  // Tenant-specific customer company memberships table
  const tenantCustomerCompanyMemberships = pgTable("customer_company_memberships", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => tenantCustomers.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").notNull().references(() => tenantCustomerCompanies.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 100 }).default("member"),
    title: varchar("title", { length: 255 }),
    department: varchar("department", { length: 255 }),
    permissions: text("permissions"), // Optimized: TEXT for permissions
    isActive: boolean("is_active").default(true),
    isPrimary: boolean("is_primary").default(false),
    joinedAt: timestamp("joined_at").defaultNow(),
    leftAt: timestamp("left_at"),
    addedBy: text("added_by").notNull(),
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
    workNotes: text("work_notes"), // Optimized: TEXT for work notes
    
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
    
    // Metadata - OPTIMIZED
    tags: varchar("tags", { length: 500 }), // VARCHAR for simple tag lists
    metadata: text("metadata"), // TEXT for optional metadata
    
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
    attachments: text("attachments"), // Optimized: TEXT for attachments list
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
    details: text("details"), // Optimized: TEXT for activity details
    previousValues: text("previous_values"), // Optimized: TEXT for previous values
    newValues: text("new_values"), // Optimized: TEXT for new values
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
    
    // Business hours and timezone - OPTIMIZED
    businessHours: text("business_hours"), // TEXT for business hours
    specialHours: text("special_hours"), // TEXT for special hours
    timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
    
    // SLA and access
    slaId: uuid("sla_id"),
    accessInstructions: text("access_instructions"),
    requiresAuthorization: boolean("requires_authorization").default(false),
    
    // Security and emergency - OPTIMIZED
    securityEquipment: text("security_equipment"), // TEXT for security equipment
    emergencyContacts: text("emergency_contacts"), // TEXT for emergency contacts
    
    // Metadata - FINAL OPTIMIZATION
    metadata: text("metadata"), // TEXT for metadata
    tags: varchar("tags", { length: 500 }), // VARCHAR for tags
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName });

  // Tenant-specific integrations - 100% DATABASE STORAGE
  const tenantIntegrations = pgTable("integrations", {
    id: varchar("id", { length: 100 }).primaryKey(), // email-smtp, whatsapp-business, etc.
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(), // Comunicação, Automação, Dados, etc.
    provider: varchar("provider", { length: 100 }),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("disconnected"), // connected, error, disconnected
    configured: boolean("configured").default(false),
    apiKeyConfigured: boolean("api_key_configured").default(false),
    config: jsonb("config").default({}), // Store API keys, settings, etc.
    features: jsonb("features").default([]), // Available features
    lastSync: timestamp("last_sync"),
    lastTested: timestamp("last_tested"),
    errorMessage: text("error_message"),
    syncFrequency: varchar("sync_frequency", { length: 50 }).default("manual"),
    webhookUrl: varchar("webhook_url", { length: 500 }),
    isActive: boolean("is_active").default(true),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName });

  // Return schema object compatible with Drizzle (without relations to avoid ExtraConfigBuilder error)
  return {
    customers: tenantCustomers,
    customerCompanies: tenantCustomerCompanies,
    customerCompanyMemberships: tenantCustomerCompanyMemberships,
    tickets: tenantTickets,
    ticketMessages: tenantTicketMessages,
    activityLogs: tenantActivityLogs,
    locations: tenantLocations,
    integrations: tenantIntegrations,
  };
}
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
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";
// Removed relations import to fix ExtraConfigBuilder error

/**
 * Creates tenant-specific tables with proper schema isolation
 * Each tenant gets their own schema with these isolated tables
 */
export function getTenantSpecificSchema(schemaName: string) {
  // Tenant-specific customers table - ENHANCED ISOLATION
  const tenantCustomers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
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
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Tenant isolation constraints and indexes
    tenantEmailUnique: unique("customers_tenant_email_unique").on(table.tenantId, table.email),
    tenantIdCheck: check("customers_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantEmailIndex: index("customers_tenant_email_idx").on(table.tenantId, table.email),
    tenantActiveIndex: index("customers_tenant_active_idx").on(table.tenantId, table.active),
  }));

  // Tenant-specific customer companies table - ENHANCED ISOLATION
  const tenantCustomerCompanies = pgTable("customer_companies", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
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
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Company tenant isolation constraints
    tenantNameUnique: unique("companies_tenant_name_unique").on(table.tenantId, table.name),
    tenantIdCheck: check("companies_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantNameIndex: index("companies_tenant_name_idx").on(table.tenantId, table.name),
    tenantStatusIndex: index("companies_tenant_status_idx").on(table.tenantId, table.status),
  }));

  // Tenant-specific customer company memberships table - ENHANCED ISOLATION
  const tenantCustomerCompanyMemberships = pgTable("customer_company_memberships", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
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
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Membership tenant isolation constraints
    tenantMembershipUnique: unique("memberships_tenant_customer_company_unique").on(table.tenantId, table.customerId, table.companyId),
    tenantIdCheck: check("memberships_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantCustomerIndex: index("memberships_tenant_customer_idx").on(table.tenantId, table.customerId),
    tenantCompanyIndex: index("memberships_tenant_company_idx").on(table.tenantId, table.companyId),
  }));

  // Tenant-specific tickets table - ENHANCED ISOLATION  
  const tenantTickets = pgTable("tickets", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    
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
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Tickets tenant isolation constraints
    tenantNumberUnique: unique("tickets_tenant_number_unique").on(table.tenantId, table.number),
    tenantIdCheck: check("tickets_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantStatusIndex: index("tickets_tenant_status_idx").on(table.tenantId, table.status),
    tenantCustomerIndex: index("tickets_tenant_customer_idx").on(table.tenantId, table.customerId),
    tenantAssigneeIndex: index("tickets_tenant_assignee_idx").on(table.tenantId, table.assignedToId),
  }));

  // Tenant-specific ticket messages - ENHANCED ISOLATION
  const tenantTicketMessages = pgTable("ticket_messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    ticketId: uuid("ticket_id").notNull().references(() => tenantTickets.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => tenantCustomers.id),
    userId: varchar("user_id"), // References public.users
    content: text("content").notNull(),
    type: varchar("type", { length: 50 }).default("comment"),
    isInternal: varchar("is_internal", { length: 10 }).default("false"),
    attachments: text("attachments"), // Optimized: TEXT for attachments list
    createdAt: timestamp("created_at").defaultNow(),
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Ticket messages tenant isolation constraints
    tenantIdCheck: check("ticket_messages_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantTicketIndex: index("ticket_messages_tenant_ticket_idx").on(table.tenantId, table.ticketId),
    tenantCustomerIndex: index("ticket_messages_tenant_customer_idx").on(table.tenantId, table.customerId),
  }));

  // Tenant-specific activity logs - ENHANCED ISOLATION
  const tenantActivityLogs = pgTable("activity_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    entityType: varchar("entity_type", { length: 50 }).notNull(), // ticket, customer, user
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(), // created, updated, deleted, assigned
    performedById: varchar("performed_by_id"), // References public.users
    performedByType: varchar("performed_by_type", { length: 20 }), // user, customer, system
    details: text("details"), // Optimized: TEXT for activity details
    previousValues: text("previous_values"), // Optimized: TEXT for previous values
    newValues: text("new_values"), // Optimized: TEXT for new values
    createdAt: timestamp("created_at").defaultNow(),
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Activity logs tenant isolation constraints
    tenantIdCheck: check("activity_logs_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantEntityIndex: index("activity_logs_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
    tenantPerformerIndex: index("activity_logs_tenant_performer_idx").on(table.tenantId, table.performedById),
  }));

  // Tenant-specific locations table - ENHANCED ISOLATION
  const tenantLocations = pgTable("locations", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
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

  // Tenant-specific integrations - ENHANCED ISOLATION with OPTIMIZED JSONB
  const tenantIntegrations = pgTable("integrations", {
    id: varchar("id", { length: 100 }).primaryKey(), // email-smtp, whatsapp-business, etc.
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(), // Comunicação, Automação, Dados, etc.
    provider: varchar("provider", { length: 100 }),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("disconnected"), // connected, error, disconnected
    configured: boolean("configured").default(false),
    apiKeyConfigured: boolean("api_key_configured").default(false),
    config: text("config"), // Optimized: TEXT for API configuration (only keep JSONB for complex nested data)
    features: text("features"), // Optimized: TEXT for features list
    lastSync: timestamp("last_sync"),
    lastTested: timestamp("last_tested"),
    errorMessage: text("error_message"),
    syncFrequency: varchar("sync_frequency", { length: 50 }).default("manual"),
    webhookUrl: varchar("webhook_url", { length: 500 }),
    isActive: boolean("is_active").default(true),
    metadata: text("metadata"), // Optimized: TEXT for metadata
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName });

  // Technical Skills tables - ENHANCED ISOLATION
  const tenantSkills = pgTable("skills", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    subcategory: varchar("subcategory", { length: 100 }),
    description: text("description"),
    minLevelRequired: integer("min_level_required").default(1),
    suggestedCertification: varchar("suggested_certification", { length: 255 }),
    validityMonths: integer("validity_months"),
    observations: text("observations"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Skills tenant isolation constraints
    tenantSkillUnique: unique("skills_tenant_name_category_unique").on(table.tenantId, table.name, table.category),
    tenantIdCheck: check("skills_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantCategoryIndex: index("skills_tenant_category_idx").on(table.tenantId, table.category),
    tenantNameIndex: index("skills_tenant_name_idx").on(table.tenantId, table.name),
  }));

  const tenantUserSkills = pgTable("user_skills", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    userId: varchar("user_id", { length: 36 }).notNull(),
    skillId: uuid("skill_id").notNull().references(() => tenantSkills.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    assessedAt: timestamp("assessed_at").defaultNow(),
    assessedBy: varchar("assessed_by", { length: 36 }),
    expiresAt: timestamp("expires_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: User skills tenant isolation constraints
    tenantUserSkillUnique: unique("user_skills_tenant_user_skill_unique").on(table.tenantId, table.userId, table.skillId),
    tenantIdCheck: check("user_skills_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantUserIndex: index("user_skills_tenant_user_idx").on(table.tenantId, table.userId),
    tenantSkillIndex: index("user_skills_tenant_skill_idx").on(table.tenantId, table.skillId),
  }));

  const tenantCertifications = pgTable("certifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    name: varchar("name", { length: 255 }).notNull(),
    issuer: varchar("issuer", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    validityMonths: integer("validity_months"),
    skillRequirements: text("skill_requirements"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: Certifications tenant isolation constraints
    tenantCertificationUnique: unique("certifications_tenant_name_issuer_unique").on(table.tenantId, table.name, table.issuer),
    tenantIdCheck: check("certifications_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantCategoryIndex: index("certifications_tenant_category_idx").on(table.tenantId, table.category),
    tenantIssuerIndex: index("certifications_tenant_issuer_idx").on(table.tenantId, table.issuer),
  }));

  // External Contacts tables - ENHANCED ISOLATION
  const tenantExternalContacts = pgTable("external_contacts", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(), // CRITICAL: Explicit tenant isolation
    type: varchar("type", { length: 20 }).notNull(), // 'solicitante' or 'favorecido'
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),
    department: varchar("department", { length: 100 }),
    role: varchar("role", { length: 100 }),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }, { schema: schemaName }, (table) => ({
    // CRITICAL: External contacts tenant isolation constraints
    tenantContactUnique: unique("external_contacts_tenant_type_email_unique").on(table.tenantId, table.type, table.email),
    tenantIdCheck: check("external_contacts_tenant_id_format", "LENGTH(tenant_id) = 36"),
    tenantTypeIndex: index("external_contacts_tenant_type_idx").on(table.tenantId, table.type),
    tenantEmailIndex: index("external_contacts_tenant_email_idx").on(table.tenantId, table.email),
  }));

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
    skills: tenantSkills,
    userSkills: tenantUserSkills,
    certifications: tenantCertifications,
    externalContacts: tenantExternalContacts,
  };
}
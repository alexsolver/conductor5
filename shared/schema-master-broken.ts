// MASTER SCHEMA - SINGLE SOURCE OF TRUTH
// Consolidates all fragmented schemas into one unified definition
// This replaces: schema.ts, schema-simple.ts, schema-unified.ts

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// PUBLIC SCHEMA TABLES (Cross-tenant)
// ========================================

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

// User storage table - JWT Authentication (public schema)
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

// ========================================
// TENANT-SPECIFIC SCHEMA TABLES
// ========================================

// Customers table (Solicitantes - internal system requesters)
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  // Document information
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }), // For Brazilian customers
  // Address fields
  address: varchar("address", { length: 500 }),
  addressNumber: varchar("address_number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 50 }).default("medium").notNull(),
  status: varchar("status", { length: 50 }).default("open").notNull(),
  urgency: varchar("urgency", { length: 50 }).default("medium"),
  impact: varchar("impact", { length: 50 }).default("medium"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  requesterId: uuid("requester_id"),
  beneficiaryId: uuid("beneficiary_id"),
  assignedTo: uuid("assigned_to"),
  assignmentGroup: varchar("assignment_group", { length: 100 }),
  location: varchar("location", { length: 255 }),
  businessImpact: varchar("business_impact", { length: 100 }),
  symptoms: text("symptoms"),
  workaround: text("workaround"),
  dueDate: timestamp("due_date"),
  triggerDate: timestamp("trigger_date"),
  originalDueDate: timestamp("original_due_date"),
  resolutionDate: timestamp("resolution_date"),
  closedDate: timestamp("closed_date"),
  daysInStatus: integer("days_in_status").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket Messages table
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  ticketId: uuid("ticket_id").notNull(),
  userId: uuid("user_id"),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false),
  attachments: jsonb("attachments").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details").default('{}'),
  userId: uuid("user_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Locations table
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 50 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  contactInfo: jsonb("contact_info").default('{}'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Companies table
export const customerCompanies = pgTable("customer_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  description: text("description"),
  size: varchar("size", { length: 50 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }),
  status: varchar("status", { length: 50 }).default("active"),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skills table (Technical Skills)
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  level: varchar("level", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certifications table
export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  issuer: varchar("issuer", { length: 255 }),
  description: text("description"),
  validityMonths: integer("validity_months"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Skills table (many-to-many relationship)
export const userSkills = pgTable("user_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  userId: uuid("user_id").notNull(),
  skillId: uuid("skill_id").notNull(),
  currentLevel: varchar("current_level", { length: 50 }),
  experienceYears: integer("experience_years"),
  certificationIds: jsonb("certification_ids").default('[]'),
  lastValidated: timestamp("last_validated"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorecidos table (External contacts)
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  fullName: varchar("full_name", { length: 500 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  cellPhone: varchar("cell_phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  cpf: varchar("cpf", { length: 20 }),
  rg: varchar("rg", { length: 20 }),
  integrationCode: varchar("integration_code", { length: 100 }),
  contactType: varchar("contact_type", { length: 50 }),
  relationship: varchar("relationship", { length: 100 }),
  preferredContactMethod: varchar("preferred_contact_method", { length: 50 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External Contacts table
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 100 }),
  contactType: varchar("contact_type", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Company Memberships table (many-to-many)
export const customerCompanyMemberships = pgTable("customer_company_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  customerId: uuid("customer_id").notNull(),
  companyId: uuid("company_id").notNull(),
  role: varchar("role", { length: 100 }),
  permissions: jsonb("permissions").default('[]'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========================================
// PROJECT MANAGEMENT TABLES
// ========================================

// Projects table (FIXED to match actual DB structure exactly)
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: DB uses UUID, not VARCHAR
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planning").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium").notNull(),
  startDate: timestamp("start_date"), // FIXED: DB uses timestamp, not date
  endDate: timestamp("end_date"), // FIXED: DB uses timestamp, not date
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours").default(0),
  budget: decimal("budget"),
  actualCost: decimal("actual_cost").default("0"), // FIXED: DB field name
  projectManagerId: uuid("project_manager_id"),
  clientId: uuid("client_id"), // FIXED: DB field name
  teamMemberIds: uuid("team_member_ids").array().default([]), // FIXED: Array type
  tags: text("tags").array().default([]), // FIXED: Array type
  customFields: jsonb("custom_fields").default('{}'), // FIXED: DB field name
  metadata: jsonb("metadata").default('{}'),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by").notNull(),
  managerId: uuid("manager_id"), // FIXED: Additional DB field
  isActive: boolean("is_active").default(true), // FIXED: Added missing active field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Actions table (FIXED to match actual DB structure exactly)
export const projectActions = pgTable("project_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: DB uses UUID, not VARCHAR
  projectId: uuid("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // FIXED: Length 20
  scheduledDate: timestamp("scheduled_date"), // FIXED: DB field name
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours").default(0),
  assignedToId: uuid("assigned_to_id"), // FIXED: DB field name
  responsibleIds: uuid("responsible_ids").array().default([]), // FIXED: Array type
  clientContactId: uuid("client_contact_id"), // FIXED: DB field
  externalReference: varchar("external_reference", { length: 255 }), // FIXED: DB field
  deliveryMethod: varchar("delivery_method", { length: 255 }), // FIXED: DB field
  dependsOnActionIds: uuid("depends_on_action_ids").array().default([]), // FIXED: Array type
  blockedByActionIds: uuid("blocked_by_action_ids").array().default([]), // FIXED: Array type
  priority: varchar("priority", { length: 20 }).default("medium"),
  tags: text("tags").array().default([]), // FIXED: Array type
  attachments: text("attachments").array().default([]), // FIXED: Array type
  notes: text("notes"),
  relatedTicketId: uuid("related_ticket_id"), // FIXED: DB field
  canConvertToTicket: varchar("can_convert_to_ticket", { length: 10 }).default("true"), // FIXED: DB field
  ticketConversionRules: jsonb("ticket_conversion_rules").default('{}'), // FIXED: DB field
  completedAt: timestamp("completed_at"), // FIXED: DB field
  metadata: jsonb("metadata").default('{}'),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Timeline table
export const projectTimeline = pgTable("project_timeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  projectId: uuid("project_id").notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // milestone, task_completion, phase_change, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedBy: uuid("completed_by"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// TIMECARD SYSTEM TABLES (CLT Compliance)
// ========================================

// Time Records table (Individual clock-in/out records)
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  userId: uuid("user_id").notNull(),
  recordType: varchar("record_type", { length: 20 }).notNull(), // clock_in, clock_out, break_start, break_end
  timestamp: timestamp("timestamp").notNull(),
  location: jsonb("location"), // {latitude, longitude, address}
  method: varchar("method", { length: 20 }).default("web"), // web, mobile, biometric, manual
  ipAddress: varchar("ip_address", { length: 45 }),
  deviceInfo: jsonb("device_info"),
  notes: text("notes"),
  isValidated: boolean("is_validated").default(false),
  validatedBy: uuid("validated_by"),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Timesheet table (Daily summary of work hours)
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  userId: uuid("user_id").notNull(),
  workDate: date("work_date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  totalWorkedMinutes: integer("total_worked_minutes").default(0),
  totalBreakMinutes: integer("total_break_minutes").default(0),
  overtimeMinutes: integer("overtime_minutes").default(0),
  scheduledMinutes: integer("scheduled_minutes"),
  status: varchar("status", { length: 20 }).default("incomplete"), // complete, incomplete, missing, holiday
  workScheduleId: uuid("work_schedule_id"),
  exceptions: jsonb("exceptions").default('[]'), // Array of exceptions/notes
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work Schedules table (Employee work patterns)
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  scheduleType: varchar("schedule_type", { length: 50 }).notNull(), // fixed, flexible, rotating
  workDays: jsonb("work_days").notNull(), // [1,2,3,4,5] for Mon-Fri
  dailyHours: integer("daily_hours").default(8),
  weeklyHours: integer("weekly_hours").default(40),
  startTime: varchar("start_time", { length: 8 }), // "08:00:00"
  endTime: varchar("end_time", { length: 8 }), // "17:00:00"
  breakDuration: integer("break_duration").default(60), // minutes
  flexTimeWindow: integer("flex_time_window").default(0), // minutes of flexibility
  isActive: boolean("is_active").default(true),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time Bank table (Banco de Horas - Brazilian CLT requirement)
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  userId: uuid("user_id").notNull(),
  referenceMonth: varchar("reference_month", { length: 7 }).notNull(), // "2024-01"
  creditMinutes: integer("credit_minutes").default(0), // Positive balance (worked extra)
  debitMinutes: integer("debit_minutes").default(0), // Negative balance (worked less)
  netBalance: integer("net_balance").default(0), // credit - debit
  maxCreditLimit: integer("max_credit_limit").default(600), // 10 hours in minutes
  expirationDate: date("expiration_date"), // CLT compliance - 1 year expiry
  compensationUsed: integer("compensation_used").default(0),
  status: varchar("status", { length: 20 }).default("active"), // active, expired, compensated
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Templates table (Reusable work patterns)
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // fixed, rotating, flexible, shift
  scheduleType: varchar("schedule_type", { length: 50 }).notNull(), // 5x2, 6x1, 12x36, etc.
  rotationCycleDays: integer("rotation_cycle_days"),
  configuration: jsonb("configuration").notNull(), // {workDays, startTime, endTime, breakDuration, flexTimeWindow}
  requiresApproval: boolean("requires_approval").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Absence Requests table (Vacation, sick leave, etc.)
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  userId: uuid("user_id").notNull(),
  absenceType: varchar("absence_type", { length: 50 }).notNull(), // vacation, sick_leave, maternity, etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason").notNull(),
  medicalCertificate: varchar("medical_certificate", { length: 500 }), // URL to document
  coverUserId: uuid("cover_user_id"), // Replacement during absence
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, cancelled
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Compliance Alerts table (CLT violation warnings)
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // FIXED: Standardized to UUID type
  userId: uuid("user_id").notNull(),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // overtime_limit, missing_break, etc.
  severity: varchar("severity", { length: 20 }).default("medium"), // low, medium, high, critical
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  relatedDate: date("related_date"),
  status: varchar("status", { length: 20 }).default("open"), // open, acknowledged, resolved
  acknowledgedBy: uuid("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: uuid("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").default('{}'), // Additional alert context
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// ZOD VALIDATION SCHEMAS
// ========================================

// Public schema insert schemas
export const insertSessionSchema = createInsertSchema(sessions);
export const insertTenantSchema = createInsertSchema(tenants);
export const insertUserSchema = createInsertSchema(users);

// Tenant-specific insert schemas
export const insertCustomerSchema = createInsertSchema(customers);
export const insertTicketSchema = createInsertSchema(tickets);
export const insertTicketMessageSchema = createInsertSchema(ticketMessages);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertLocationSchema = createInsertSchema(locations);
export const insertCustomerCompanySchema = createInsertSchema(customerCompanies);
export const insertSkillSchema = createInsertSchema(skills);
export const insertCertificationSchema = createInsertSchema(certifications);
export const insertUserSkillSchema = createInsertSchema(userSkills);
export const insertFavorecidoSchema = createInsertSchema(favorecidos);
export const insertCustomerCompanyMembershipSchema = createInsertSchema(customerCompanyMemberships);

// Project insert schemas
export const insertProjectActionSchema = createInsertSchema(projectActions);
export const insertProjectTimelineSchema = createInsertSchema(projectTimeline);

// Timecard insert schemas

// ========================================
// TYPE DEFINITIONS
// ========================================

// Public schema types
export type Session = typeof sessions.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Tenant-specific types
export type Customer = typeof customers.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type CustomerCompany = typeof customerCompanies.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;
export type Favorecido = typeof favorecidos.$inferSelect;
export type CustomerCompanyMembership = typeof customerCompanyMemberships.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertCustomerCompany = z.infer<typeof insertCustomerCompanySchema>;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type InsertFavorecido = z.infer<typeof insertFavorecidoSchema>;
export type InsertExternalContact = z.infer<typeof insertExternalContactSchema>;
export type InsertCustomerCompanyMembership = z.infer<typeof insertCustomerCompanyMembershipSchema>;

// Project types
export type Project = typeof projects.$inferSelect;
export type ProjectAction = typeof projectActions.$inferSelect;
export type ProjectTimeline = typeof projectTimeline.$inferSelect;

export type InsertProjectAction = z.infer<typeof insertProjectActionSchema>;
export type InsertProjectTimeline = z.infer<typeof insertProjectTimelineSchema>;

// Timecard types

export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type InsertDailyTimesheet = z.infer<typeof insertDailyTimesheetSchema>;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type InsertTimeBank = z.infer<typeof insertTimeBankSchema>;
export type InsertScheduleTemplate = z.infer<typeof insertScheduleTemplateSchema>;
export type InsertAbsenceRequest = z.infer<typeof insertAbsenceRequestSchema>;
export type InsertComplianceAlert = z.infer<typeof insertComplianceAlertSchema>;
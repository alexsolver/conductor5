import { eq, and, desc, asc, ilike, count, sql, or } from "drizzle-orm";
import { db, schemaManager } from "./db";
import { users, tenants, type User, type InsertUser } from "@shared/schema";
import { logInfo, logError } from "./utils/logger";
import { poolManager } from "./database/ConnectionPoolManager";
import { TenantValidator } from "./database/TenantValidator";
import { randomUUID } from "crypto";

// ===========================
// INTERFACES & TYPES
// ===========================

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Tenant Management
  createTenant(tenantData: any): Promise<any>;
  getTenantUsers(
    tenantId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<User[]>;
  initializeTenantSchema(tenantId: string): Promise<void>;

  // Customer Management
  getCustomers(
    tenantId: string,
    options?: { limit?: number; offset?: number; search?: string },
  ): Promise<any[]>;
  getCustomerById(
    tenantId: string,
    customerId: string,
  ): Promise<any | undefined>;
  createCustomer(tenantId: string, customerData: any): Promise<any>;
  updateCustomer(
    tenantId: string,
    customerId: string,
    customerData: any,
  ): Promise<any>;
  deleteCustomer(tenantId: string, customerId: string): Promise<boolean>;

  // Ticket Management
  getTickets(
    tenantId: string,
    options?: { limit?: number; offset?: number; status?: string },
  ): Promise<any[]>;
  getTicketById(tenantId: string, ticketId: string): Promise<any | undefined>;
  createTicket(tenantId: string, ticketData: any): Promise<any>;
  updateTicket(
    tenantId: string,
    ticketId: string,
    ticketData: any,
  ): Promise<any>;
  deleteTicket(tenantId: string, ticketId: string): Promise<boolean>;
  searchTickets(tenantId: string, query: string): Promise<any[]>;
  getTicketsCount(tenantId: string): Promise<number>;

  // Ticket Relationships Management
  getTicketRelationships(tenantId: string, ticketId: string): Promise<any[]>;
  createTicketRelationship(
    tenantId: string,
    ticketId: string,
    relationshipData: any,
  ): Promise<any>;
  deleteTicketRelationship(relationshipId: string): Promise<boolean>;
  getTicketHierarchy(tenantId: string, ticketId: string): Promise<any[]>;

  // Dashboard & Analytics
  getDashboardStats(tenantId: string): Promise<any>;
  getRecentActivity(
    tenantId: string,
    options?: { limit?: number },
  ): Promise<any[]>;

  // External Contacts
  getClientes(
    tenantId: string,
    options?: { limit?: number; offset?: number; search?: string },
  ): Promise<any[]>;
  getBeneficiaries(
    tenantId: string,
    options?: { limit?: number; offset?: number; search?: string },
  ): Promise<any[]>;
  createCliente(tenantId: string, data: any): Promise<any>;
  createBeneficiary(tenantId: string, data: any): Promise<any>;
  getBeneficiary(id: string, tenantId: string): Promise<any | null>;

  // Ticket Templates Management
  getTicketTemplates(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      search?: string;
      category?: string;
    },
  ): Promise<any[]>;
  getTicketTemplateById(
    tenantId: string,
    templateId: string,
  ): Promise<any | undefined>;
  createTicketTemplate(tenantId: string, templateData: any): Promise<any>;
  updateTicketTemplate(
    tenantId: string,
    templateId: string,
    templateData: any,
  ): Promise<any>;
  deleteTicketTemplate(tenantId: string, templateId: string): Promise<boolean>;
  duplicateTicketTemplate(tenantId: string, templateId: string): Promise<any>;

  // Tenant Integrations Management
  getTenantIntegrations(tenantId: string): Promise<any[]>;
  getTenantIntegrationConfig(
    tenantId: string,
    integrationId: string,
  ): Promise<any | undefined>;
  saveTenantIntegrationConfig(
    tenantId: string,
    integrationId: string,
    config: any,
  ): Promise<any>;
  updateTenantIntegrationStatus(
    tenantId: string,
    integrationId: string,
    status: string,
  ): Promise<void>;
  getIntegrationByType(
    tenantId: string,
    typeName: string,
  ): Promise<any | undefined>;
  initializeTenantIntegrations(tenantId: string): Promise<void>;

  // Template Bulk Operations
  bulkDeleteTicketTemplates(
    tenantId: string,
    templateIds: string[],
  ): Promise<boolean>;

  // Email Templates Management
  getEmailTemplates(tenantId: string): Promise<any[]>;
  createEmailTemplate(tenantId: string, templateData: any): Promise<any>;
  updateEmailTemplate(
    tenantId: string,
    templateId: string,
    templateData: any,
  ): Promise<any | undefined>;
  deleteEmailTemplate(tenantId: string, templateId: string): Promise<boolean>;

  // Email Management
  getEmailInboxMessages(tenantId: string): Promise<any[]>;
  markEmailAsRead(tenantId: string, messageId: string): Promise<void>;
  archiveEmail(tenantId: string, messageId: string): Promise<void>;
  deleteEmail(tenantId: string, messageId: string): Promise<void>;
  getClientesCount(tenantId: string): Promise<number>;

  // Project Management - COMPLETELY REMOVED
  // All project-related functionality has been eliminated from the system

  // Locations Management
  getLocations(tenantId: string): Promise<any[]>;
  createLocation(tenantId: string, locationData: any): Promise<any>;
  getBeneficiaryLocations(
    beneficiaryId: string,
    tenantId: string,
  ): Promise<any[]>;
  addBeneficiaryLocation(
    beneficiaryId: string,
    locationId: string,
    tenantId: string,
    isPrimary?: boolean,
  ): Promise<any>;
  removeBeneficiaryLocation(
    beneficiaryId: string,
    locationId: string,
    tenantId: string,
  ): Promise<boolean>;
  updateBeneficiaryLocationPrimary(
    beneficiaryId: string,
    locationId: string,
    tenantId: string,
    isPrimary: boolean,
  ): Promise<boolean>;

  // Beneficiary Management
  getCustomerBeneficiaries(
    tenantId: string,
    customerId: string,
  ): Promise<any[]>;
  updateBeneficiary(tenantId: string, id: string, data: any): Promise<any>;
  deleteBeneficiary(tenantId: string, id: string): Promise<boolean>;
  getBeneficiaryCustomers(
    tenantId: string,
    beneficiaryId: string,
  ): Promise<any[]>;
  addBeneficiaryCustomer(
    tenantId: string,
    beneficiaryId: string,
    customerId: string,
  ): Promise<any>;
  removeBeneficiaryCustomer(
    tenantId: string,
    beneficiaryId: string,
    customerId: string,
  ): Promise<boolean>;
}

// ===========================
// ENHANCED TENANT VALIDATION
// Uses advanced validation with existence checks
// ===========================

async function validateTenantAccess(tenantId: string): Promise<string> {
  return await TenantValidator.validateTenantAccess(tenantId);
}

// ===========================
// ENTERPRISE DATABASE STORAGE
// COMPLETE REWRITE WITH PERFORMANCE & SECURITY
// ===========================

export class DatabaseStorage implements IStorage {
  // private schemaManager: SchemaManager; // Removed for simplification

  constructor() {
    // Using simplified schema manager from db.ts
  }

  // Mock `this.neon` for local testing if not available
  private neon = async (query: string, params: any[]): Promise<any[]> => {
    // Placeholder implementation for demonstration
    // In a real scenario, this would interact with your database
    console.log("Mock Neon DB call:", { query, params });
    // Simulate finding the Telegram integration for testing
    if (
      query.includes("tenant_integrations") &&
      query.includes("telegram") &&
      params[1] === "telegram"
    ) {
      return [
        {
          id: "telegram",
          tenant_id: params[0],
          name: "Telegram",
          description:
            "Envio de notificações e alertas via Telegram para grupos ou usuários",
          category: "Comunicação",
          icon: "Send",
          status: "connected", // Default to connected for testing
          config: JSON.stringify({ botToken: "12345:ABCDEF" }),
          features: [
            "Notificações em tempo real",
            "Mensagens personalizadas",
            "Integração com Bot API",
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_currently_monitoring: false,
        },
      ];
    }
    return [];
  };

  // ===========================
  // USER MANAGEMENT
  // ===========================

  async getUser(id: number): Promise<User | undefined> {
    try {
      // ✅ SECURITY FIX: Use public schema connection explicitly for user management
      // Users table is in public schema and requires system-level access
      const result = await db.execute(sql`
        SELECT id, email, tenant_id, role, is_active, password_hash, created_at, updated_at
        FROM public.users 
        WHERE id = ${String(id)} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] || undefined;
    } catch (error) {
      logError("Error fetching user", error, { userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (!username) {
        throw new Error("Username is required");
      }

      // ✅ SECURITY FIX: Use public schema connection explicitly for user authentication
      // Users table is in public schema and requires system-level access
      const result = await db.execute(sql`
        SELECT id, email, tenant_id, role, is_active, password_hash, created_at, updated_at
        FROM public.users 
        WHERE email = ${username} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] || undefined;
    } catch (error) {
      logError("Error fetching user by username", error, { username });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      if (!insertUser.email || !insertUser.passwordHash) {
        throw new Error("Email and password hash are required");
      }

      const [user] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          ...insertUser,
        })
        .returning();

      logInfo("User created successfully", {
        userId: user.id,
        email: user.email,
      });
      return user;
    } catch (error) {
      logError("Error creating user", error, { email: insertUser.email });
      throw error;
    }
  }

  // ===========================
  // TENANT MANAGEMENT
  // ===========================

  async createTenant(tenantData: any): Promise<any> {
    try {
      if (!tenantData.name || !tenantData.subdomain) {
        throw new Error("Tenant name and subdomain are required");
      }

      // Create tenant record
      const [tenant] = await db.insert(tenants).values(tenantData).returning();

      // Create tenant-specific schema
      await schemaManager.createTenantSchema(tenant.id);

      logInfo("Tenant created successfully", {
        tenantId: tenant.id,
        name: tenant.name,
      });
      return tenant;
    } catch (error) {
      logError("Error creating tenant", error, { tenantData });
      throw error;
    }
  }

  async getTenantUsers(
    tenantId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<User[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0 } = options;

      const tenantUsers = await db
        .select()
        .from(users)
        .where(eq(users.tenantId, validatedTenantId))
        .limit(limit)
        .offset(offset)
        .orderBy(asc(users.email));

      return tenantUsers;
    } catch (error) {
      logError("Error fetching tenant users", error, { tenantId, options });
      throw error;
    }
  }

  // ===========================
  // CUSTOMER MANAGEMENT - OPTIMIZED
  // Fixes: N+1 queries, performance issues
  // ===========================

  async getCustomers(
    tenantId: string,
    options: { limit?: number; offset?: number; search?: string } = {},
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, search } = options;

      // Use connection pool for better performance
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // OPTIMIZED: Single query with proper parameterization
      let baseQuery = sql`
        SELECT 
          id, first_name, last_name, email, phone,
          created_at, updated_at
        FROM ${sql.identifier(schemaName)}.customers
        WHERE 1=1
      `;

      // SECURE: Parameterized search
      if (search) {
        const searchPattern = `%${search}%`;
        baseQuery = sql`${baseQuery} AND (
          first_name ILIKE ${searchPattern} OR 
          last_name ILIKE ${searchPattern} OR 
          email ILIKE ${searchPattern}
        )`;
      }

      const finalQuery = sql`${baseQuery} 
        ORDER BY created_at DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await tenantDb.execute(finalQuery);
      return result.rows || [];
    } catch (error) {
      logError("Error fetching customers", error, { tenantId, options });
      throw error;
    }
  }

  async getCustomerById(
    tenantId: string,
    customerId: string,
  ): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers
        WHERE id = ${customerId}
        LIMIT 1
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError("Error fetching customer", error, { tenantId, customerId });
      throw error;
    }
  }

  async createCustomer(tenantId: string, customerData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      if (!customerData.email) {
        throw new Error("Customer email is required");
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.customers 
        (first_name, last_name, email, phone, tenant_id, created_at, updated_at)
        VALUES (
          ${customerData.firstName || null},
          ${customerData.lastName || null}, 
          ${customerData.email},
          ${customerData.phone || null},
          ${validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      const customer = result.rows?.[0];
      if (customer) {
        logInfo("Customer created successfully", {
          tenantId,
          customerId: customer.id,
        });
      }

      return customer;
    } catch (error) {
      logError("Error creating customer", error, { tenantId, customerData });
      throw error;
    }
  }

  async updateCustomer(
    tenantId: string,
    customerId: string,
    customerData: any,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.customers 
        SET 
          first_name = ${customerData.firstName || null},
          last_name = ${customerData.lastName || null},
          email = ${customerData.email},
          phone = ${customerData.phone || null},
          updated_at = NOW()
        WHERE id = ${customerId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError("Error updating customer", error, {
        tenantId,
        customerId,
        customerData,
      });
      throw error;
    }
  }

  async deleteCustomer(tenantId: string, customerId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.customers
        WHERE id = ${customerId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError("Error deleting customer", error, { tenantId, customerId });
      throw error;
    }
  }

  // ===========================
  // TICKET MANAGEMENT - OPTIMIZED
  // Fixes: N+1 queries, complex joins
  // ===========================

  async getTickets(
    tenantId: string,
    options: { limit?: number; offset?: number; status?: string } = {},
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, status } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // OPTIMIZED: Single JOIN query instead of N+1
      let baseQuery = sql`
        SELECT 
          tickets.*,
          beneficiary.first_name as customer_first_name,
          beneficiary.last_name as customer_last_name,
          beneficiary.email as customer_email,
          caller.first_name as caller_first_name,
          caller.last_name as caller_last_name,
          caller.email as caller_email,
          companies.name as company_name
        FROM ${sql.identifier(schemaName)}.tickets
        LEFT JOIN ${sql.identifier(schemaName)}.customers beneficiary ON tickets.beneficiary_id = beneficiary.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers caller ON tickets.caller_id = caller.id
        LEFT JOIN ${sql.identifier(schemaName)}.companies companies ON tickets.company_id = companies.id
        WHERE tickets.tenant_id = ${validatedTenantId}
      `;

      if (status) {
        baseQuery = sql`${baseQuery} AND tickets.status = ${status}`;
      }

      const finalQuery = sql`${baseQuery} 
        ORDER BY tickets.created_at DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await tenantDb.execute(finalQuery);
      return result.rows || [];
    } catch (error) {
      logError("Error fetching tickets", error, { tenantId, options });
      throw error;
    }
  }

  async getTicketById(
    tenantId: string,
    ticketId: string,
  ): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          tickets.*,
          beneficiary.first_name as customer_first_name,
          beneficiary.last_name as customer_last_name,
          beneficiary.email as customer_email,
          caller.first_name as caller_first_name,
          caller.last_name as caller_last_name,
          caller.email as caller_email,
          companies.name as company_name
        FROM ${sql.identifier(schemaName)}.tickets
        LEFT JOIN ${sql.identifier(schemaName)}.customers beneficiary ON tickets.beneficiary_id = beneficiary.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers caller ON tickets.caller_id = caller.id
        LEFT JOIN ${sql.identifier(schemaName)}.companies companies ON tickets.company_id = companies.id
        WHERE tickets.id = ${ticketId} AND tickets.tenant_id = ${validatedTenantId}
        LIMIT 1
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError("Error fetching ticket", error, { tenantId, ticketId });
      throw error;
    }
  }

  async createTicket(tenantId: string, ticketData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // Debug: Log all ticket data fields for debugging
      console.log("🔍 All ticket data fields:", Object.keys(ticketData));
      console.log("🔍 Ticket data values:", {
        subject: ticketData.subject,
        customerId: ticketData.customerId,
        caller_id: ticketData.caller_id,
        customer_id: ticketData.customer_id,
      });

      const customerId =
        ticketData.customerId || ticketData.caller_id || ticketData.customer_id;

      if (!ticketData.subject || !customerId) {
        console.log("🐛 Validation failed:", {
          subject: ticketData.subject,
          finalCustomerId: customerId,
          allFields: Object.keys(ticketData),
        });
        throw new Error("Ticket subject and customer ID are required");
      }

      // Get company ID for numbering configuration
      const companyId =
        ticketData.company_id || "00000000-0000-0000-0000-000000000001"; // Default company

      // Generate ticket number using configuration
      const { ticketNumberGenerator } = await import(
        "./utils/ticketNumberGenerator"
      );
      const ticketNumber = await ticketNumberGenerator.generateTicketNumber(
        validatedTenantId,
        companyId,
      );

      console.log("🎯 Generated ticket number:", ticketNumber, {
        companyId,
        tenantId: validatedTenantId,
      });

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.tickets 
        (number, subject, description, status, priority, customer_id, caller_id, tenant_id, created_at, updated_at)
        VALUES (
          ${ticketNumber},
          ${ticketData.subject},
          ${ticketData.description || null},
          ${ticketData.status || "new"},
          ${ticketData.priority || "medium"},
          ${customerId},
          ${customerId},
          ${validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      const ticket = result.rows?.[0];
      if (ticket) {
        logInfo("Ticket created successfully", {
          tenantId,
          ticketId: ticket.id,
          ticketNumber,
        });
      }

      return ticket;
    } catch (error) {
      logError("Error creating ticket", error, { tenantId, ticketData });
      throw error;
    }
  }

  async updateTicket(
    tenantId: string,
    ticketId: string,
    ticketData: any,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // DEBUG: Log ticket data before SQL update
      console.log("🎫 STORAGE DEBUG - About to update ticket:", {
        ticketId,
        followersRaw: ticketData.followers,
        followersType: typeof ticketData.followers,
        customerIdRaw: ticketData.customer_id,
        assignedToIdRaw: ticketData.responsible_id || ticketData.assigned_to_id,
        companyIdRaw: ticketData.company_id,
        companyIdType: typeof ticketData.company_id,
        allKeys: Object.keys(ticketData),
      });

      // PROBLEMA 2,3,7 RESOLVIDOS: Campos reais do banco, mapping correto, SQL injection safe
      // CORREÇÃO CRÍTICA: Usar location ao invés de location_id baseado no schema real
      // CORREÇÃO FOLLOWERS: Adicionar campo followers que estava faltando
      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.tickets
        SET 
          subject = ${ticketData.subject || ""},
          description = ${ticketData.description || null},
          priority = ${ticketData.priority || "medium"},
          state = ${ticketData.status || "open"},
          status = ${ticketData.status || "open"},
          category = ${ticketData.category || null},
          subcategory = ${ticketData.subcategory || null},
          action = ${ticketData.action || null},
          impact = ${ticketData.impact || null},
          urgency = ${ticketData.urgency || null},
          caller_id = ${ticketData.caller_id || null},
          beneficiary_id = ${ticketData.beneficiary_id || null},
          assigned_to_id = ${ticketData.responsible_id || ticketData.assigned_to_id || null},
          assignment_group = ${ticketData.assignment_group || null},
          location = ${ticketData.location && ticketData.location !== "unspecified" ? ticketData.location : null},
          contact_type = ${ticketData.contact_type || null},
          business_impact = ${ticketData.business_impact || null},
          symptoms = ${ticketData.symptoms || null},
          workaround = ${ticketData.workaround || null},
          resolution_notes = ${ticketData.resolution || null},
          environment = ${ticketData.environment || null},
          caller_type = ${ticketData.caller_type || "customer"},
          beneficiary_type = ${ticketData.beneficiary_type || "customer"},
          customer_id = ${ticketData.customer_id || null},
          company_id = ${ticketData.company_id || null},

          followers = ${
            ticketData.followers &&
            Array.isArray(ticketData.followers) &&
            ticketData.followers.length > 0
              ? ticketData.followers
              : null
          },

          updated_at = NOW()
        WHERE id = ${ticketId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      console.log("🎫 STORAGE DEBUG - SQL update completed:", {
        ticketId,
        rowsAffected: result.rowCount,
        returnedData: result.rows?.[0] ? "Yes" : "No",
      });

      return result.rows?.[0];
    } catch (error) {
      logError("Error updating ticket", error, {
        tenantId,
        ticketId,
        ticketData,
      });
      throw error;
    }
  }

  async deleteTicket(tenantId: string, ticketId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${(sql.identifier(schemaName), "tickets")}
        WHERE id = ${ticketId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError("Error deleting ticket", error, { tenantId, ticketId });
      throw error;
    }
  }

  // Get tickets count for pagination
  async getTicketsCount(tenantId: string): Promise<number> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT COUNT(*) as count
        FROM ${sql.identifier(schemaName)}.tickets 
        WHERE tenant_id = ${validatedTenantId}
      `);

      return parseInt((result.rows?.[0]?.count as string) || "0");
    } catch (error) {
      logError("Error getting tickets count", error, { tenantId });
      return 0;
    }
  }

  // ===========================
  // DASHBOARD & ANALYTICS - OPTIMIZED
  // Fixes: Multiple separate queries, performance
  // ===========================

  async getDashboardStats(tenantId: string): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // OPTIMIZED: Single query with multiple aggregations
      const result = await tenantDb.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ${sql.identifier(schemaName)}.customers) as total_customers,
          (SELECT COUNT(*) FROM ${sql.identifier(schemaName)}.tickets) as total_tickets,
          (SELECT COUNT(*) FROM ${sql.identifier(schemaName)}.tickets WHERE status = 'open') as open_tickets,
          (SELECT COUNT(*) FROM ${sql.identifier(schemaName)}.tickets WHERE status = 'resolved') as resolved_tickets
      `);

      const stats = result.rows?.[0] || {};
      return {
        totalCustomers: Number(stats.total_customers || 0),
        totalTickets: Number(stats.total_tickets || 0),
        openTickets: Number(stats.open_tickets || 0),
        resolvedTickets: Number(stats.resolved_tickets || 0),
      };
    } catch (error) {
      logError("Error fetching dashboard stats", error, { tenantId });
      // Return empty stats on error instead of failing
      return {
        totalCustomers: 0,
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
      };
    }
  }

  async getRecentActivity(
    tenantId: string,
    options: { limit?: number } = {},
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 10 } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // OPTIMIZED: Single query with JOIN for activity
      const result = await tenantDb.execute(sql`
        SELECT 
          'ticket' as type,
          tickets.id,
          tickets.subject as title,
          tickets.status,
          tickets.created_at,
          customers.first_name || ' ' || customers.last_name as customer_name
        FROM ${sql.identifier(schemaName)}.tickets
        LEFT JOIN ${sql.identifier(schemaName)}.customers ON tickets.customer_id = customers.id
        WHERE tickets.tenant_id = ${validatedTenantId}
        ORDER BY tickets.created_at DESC
        LIMIT ${limit}
      `);

      return result.rows || [];
    } catch (error) {
      logError("Error fetching recent activity", error, { tenantId, options });
      return [];
    }
  }

  // ===========================
  // EXTERNAL CONTACTS (SOLICITANTES/FAVORECIDOS)
  // ===========================

  // Interface compatibility methods
  async getSolicitantes(
    tenantId: string,
    options: { limit?: number; offset?: number; search?: string } = {},
  ): Promise<any[]> {
    return this.getCustomers(tenantId, options);
  }

  async createSolicitante(tenantId: string, data: any): Promise<any> {
    return this.createCustomer(tenantId, data);
  }

  async getClientes(
    tenantId: string,
    options: { limit?: number; offset?: number; search?: string } = {},
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, search } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      let baseQuery = sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers
        WHERE tenant_id = ${validatedTenantId}
      `;

      if (search) {
        baseQuery = sql`${baseQuery} AND (
          first_name ILIKE ${"%" + search + "%"} OR 
          last_name ILIKE ${"%" + search + "%"} OR
          email ILIKE ${"%" + search + "%"}
        )`;
      }

      const finalQuery = sql`${baseQuery} 
        ORDER BY created_at DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await tenantDb.execute(finalQuery);
      return result.rows || [];
    } catch (error) {
      logError("Error fetching clientes", error, { tenantId, options });
      return [];
    }
  }

  async getBeneficiaries(
    tenantId: string,
    options: { limit?: number; offset?: number; search?: string } = {},
  ) {
    const { limit = 20, offset = 0, search } = options;
    const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

    try {
      // First check if table exists
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const tableCheck = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'beneficiaries'
        )
      `);

      if (!tableCheck.rows[0].exists) {
        console.log(`Favorecidos table does not exist in schema ${schemaName}`);
        return [];
      }

      let query = sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          CONCAT(first_name, ' ', last_name) as full_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries 
        WHERE tenant_id = ${tenantId}
      `;

      if (search) {
        query = sql`${query} AND (
          first_name ILIKE ${`%${search}%`} OR 
          last_name ILIKE ${`%${search}%`} OR 
          email ILIKE ${`%${search}%`} OR
          customer_code ILIKE ${`%${search}%`}
        )`;
      }

      query = sql`${query} ORDER BY created_at DESC`;

      if (limit > 0) {
        query = sql`${query} LIMIT ${limit}`;

        if (offset > 0) {
          query = sql`${query} OFFSET ${offset}`;
        }
      }

      const result = await tenantDb.execute(query);
      console.log(`Found ${result.rows.length} beneficiaries in ${schemaName}`);

      // Padronizar mapeamento de dados para interfaceconsistente
      const beneficiaries = (result.rows || []).map((favorecido) => ({
        id: favorecido.id,
        tenantId: favorecido.tenant_id,
        firstName: favorecido.first_name,
        lastName: favorecido.last_name,
        fullName:
          `${favorecido.first_name || ""} ${favorecido.last_name || ""}`.trim(),
        email: favorecido.email,
        birthDate: favorecido.birth_date,
        rg: favorecido.rg,
        cpfCnpj: favorecido.cpf_cnpj,
        isActive: favorecido.is_active,
        customerCode: favorecido.customer_code,
        customerId: favorecido.customer_id,
        phone: favorecido.phone,
        cellPhone: favorecido.cell_phone,
        contactPerson: favorecido.contact_person,
        contactPhone: favorecido.contact_phone,
        createdAt: favorecido.created_at,
        updatedAt: favorecido.updated_at,
      }));

      console.log(
        `Fetched ${beneficiaries.length} beneficiaries for tenant ${tenantId}`,
      );
      return beneficiaries;
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async getBeneficiary(id: string, tenantId: string): Promise<any | null> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          CONCAT(first_name, ' ', last_name) as full_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries 
        WHERE id = ${id} AND tenant_id = ${validatedTenantId}
      `);

      const favorecido = result.rows?.[0] || null;

      // Adicionar fullName computed field para compatibilidade frontend
      if (favorecido) {
        favorecido.fullName =
          `${favorecido.first_name || ""} ${favorecido.last_name || ""}`.trim();
      }

      return favorecido;
    } catch (error) {
      logError("Error fetching favorecido", error, { id, tenantId });
      throw error;
    }
  }

  async createCliente(tenantId: string, data: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.customers
        (first_name, last_name, email, phone, document, tenant_id, created_at, updated_at)
        VALUES (
          ${data.firstName || data.name},
          ${data.lastName || null},
          ${data.email || null},
          ${data.phone || null},
          ${data.document || null},
          ${validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError("Error creating cliente", error, { tenantId, data });
      throw error;
    }
  }

  async updateCliente(
    tenantId: string,
    clienteId: string,
    data: any,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.customers
        SET 
          first_name = ${data.firstName || data.name},
          last_name = ${data.lastName || null},
          email = ${data.email},
          phone = ${data.phone || null},
          document = ${data.document || null},
          updated_at = NOW()
        WHERE id = ${clienteId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError("Error updating cliente", error, { tenantId, clienteId, data });
      throw error;
    }
  }

  async deleteCliente(tenantId: string, clienteId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.customers
        WHERE id = ${clienteId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError("Error deleting cliente", error, { tenantId, clienteId });
      throw error;
    }
  }

  async createBeneficiary(tenantId: string, data: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // ✅ CORREÇÃO CRÍTICA: Inserindo na tabela correta (beneficiaries)
      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.beneficiaries
        (
          id,
          tenant_id,
          first_name, 
          last_name, 
          email, 
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone, 
          cell_phone,
          contact_person,
          contact_phone,
          created_at, 
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${validatedTenantId},
          ${data.firstName},
          ${data.lastName || null},
          ${data.email || null},
          ${data.birthDate || null},
          ${data.rg || null},
          ${data.cpfCnpj || null},
          ${data.isActive !== undefined ? data.isActive : true},
          ${data.customerCode || null},
          ${data.customerId || null},
          ${data.phone || null},
          ${data.cellPhone || null},
          ${data.contactPerson || null},
          ${data.contactPhone || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      const favorecido = result.rows?.[0];

      // Adicionar fullName computed field para compatibilidade frontend
      if (favorecido) {
        favorecido.fullName =
          `${favorecido.first_name} ${favorecido.last_name || ""}`.trim();
      }

      return favorecido;
    } catch (error) {
      logError("Error creating favorecido", error, { tenantId, data });
      throw error;
    }
  }

  async updateBeneficiary(
    tenantId: string,
    id: string,
    data: any,
  ): Promise<any> {
    try {
      console.log("UPDATE DEBUG:", { tenantId, id, data });

      // CRITICAL FIX: Validate that tenantId looks like UUID and id looks like UUID
      if (
        !tenantId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        )
      ) {
        throw new Error(`Invalid tenantId format: ${tenantId}`);
      }
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        )
      ) {
        throw new Error(`Invalid favorecido ID format: ${id}`);
      }

      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.beneficiaries
        SET 
          first_name = ${data.firstName},
          last_name = ${data.lastName || null},
          email = ${data.email || null},
          birth_date = ${data.birthDate || null},
          rg = ${data.rg || null},
          cpf_cnpj = ${data.cpfCnpj || null},
          is_active = ${data.isActive !== undefined ? data.isActive : true},
          customer_code = ${data.customerCode || null},
          customer_id = ${data.customerId || null},
          phone = ${data.phone || null},
          cell_phone = ${data.cellPhone || null},
          contact_person = ${data.contactPerson || null},
          contact_phone = ${data.contactPhone || null},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      const favorecido = result.rows?.[0];

      // Adicionar fullName computed field para compatibilidade frontend
      if (favorecido) {
        favorecido.fullName =
          `${favorecido.first_name} ${favorecido.last_name || ""}`.trim();
      }

      return favorecido;
    } catch (error) {
      logError("Error updating favorecido", error, {
        id,
        tenantId,
        data,
        context: {
          id: tenantId, // This shows that parameters are swapped in error context
          tenantId: id, // This confirms the parameter swap issue
          data,
        },
      });
      throw error;
    }
  }

  async deleteBeneficiary(tenantId: string, id: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE id = ${id} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = Number(result.rowCount || 0) > 0;
      if (deleted) {
        logInfo("Beneficiary deleted successfully", {
          tenantId: validatedTenantId,
          beneficiaryId: id,
        });
      }

      return deleted;
    } catch (error) {
      logError("Error deleting beneficiary", error, { id, tenantId });
      throw error;
    }
  }

  // ===========================
  // TICKET TEMPLATES MANAGEMENT
  // ===========================

  async getTicketTemplates(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      search?: string;
      category?: string;
    },
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      let baseQuery = sql`
        SELECT id, name, description, category, priority, urgency, impact, 
               default_title, default_description, default_tags, estimated_hours, 
               requires_approval, auto_assign, default_assignee_role, is_active, 
               tenant_id, created_by, created_at, updated_at
        FROM ${sql.identifier(schemaName)}.ticket_templates
        WHERE tenant_id = ${validatedTenantId}
      `;

      // Add search filter
      if (options?.search) {
        baseQuery = sql`${baseQuery} AND (name ILIKE ${`%${options.search}%`} OR description ILIKE ${`%${options.search}%`})`;
      }

      // Add category filter
      if (options?.category) {
        baseQuery = sql`${baseQuery} AND category = ${options.category}`;
      }

      const finalQuery = sql`${baseQuery} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      const result = await tenantDb.execute(finalQuery);

      return result.rows || [];
    } catch (error) {
      logError("Error fetching ticket templates", error, { tenantId, options });
      throw error;
    }
  }

  async getTicketTemplateById(
    tenantId: string,
    templateId: string,
  ): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT id, name, description, category, priority, urgency, impact,
               default_title, default_description, default_tags, estimated_hours,
               requires_approval, auto_assign, default_assignee_role, is_active,
               tenant_id, created_by, created_at, updated_at
        FROM ${sql.identifier(schemaName)}.ticket_templates
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
        LIMIT 1
      `);

      return result.rows?.[0];
    } catch (error) {
      logError("Error fetching ticket template by ID", error, {
        tenantId,
        templateId,
      });
      throw error;
    }
  }

  async createTicketTemplate(
    tenantId: string,
    templateData: any,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const id = crypto.randomUUID();
      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.ticket_templates
        (id, name, description, category, priority, urgency, impact, default_title, 
         default_description, default_tags, estimated_hours, requires_approval, 
         auto_assign, default_assignee_role, is_active, tenant_id, created_by, created_at, updated_at)
        VALUES (
          ${id},
          ${templateData.name},
          ${templateData.description || null},
          ${templateData.category || "Geral"},
          ${templateData.priority || "medium"},
          ${templateData.urgency || "medium"},
          ${templateData.impact || "medium"},
          ${templateData.default_title || null},
          ${templateData.default_description || null},
          ${templateData.default_tags || null},
          ${templateData.estimated_hours || 0},
          ${templateData.requires_approval || false},
          ${templateData.auto_assign || false},
          ${templateData.default_assignee_role || null},
          ${templateData.is_active !== false},
          ${validatedTenantId},
          ${templateData.created_by || validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      logInfo("Ticket template created successfully", {
        tenantId: validatedTenantId,
        templateId: id,
      });
      return result.rows?.[0];
    } catch (error) {
      logError("Error creating ticket template", error, {
        tenantId,
        templateData,
      });
      throw error;
    }
  }

  async updateTicketTemplate(
    tenantId: string,
    templateId: string,
    templateData: any,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.ticket_templates
        SET name = ${templateData.name},
            description = ${templateData.description || null},
            category = ${templateData.category || "Geral"},
            priority = ${templateData.priority || "medium"},
            urgency = ${templateData.urgency || "medium"},
            impact = ${templateData.impact || "medium"},
            default_title = ${templateData.default_title || null},
            default_description = ${templateData.default_description || null},
            default_tags = ${templateData.default_tags || null},
            estimated_hours = ${templateData.estimated_hours || 0},
            requires_approval = ${templateData.requires_approval || false},
            auto_assign = ${templateData.auto_assign || false},
            default_assignee_role = ${templateData.default_assignee_role || null},
            is_active = ${templateData.is_active !== false},
            updated_at = NOW()
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      if (!result.rows?.[0]) {
        throw new Error("Template not found or access denied");
      }

      logInfo("Ticket template updated successfully", {
        tenantId: validatedTenantId,
        templateId,
      });
      return result.rows[0];
    } catch (error) {
      logError("Error updating ticket template", error, {
        tenantId,
        templateId,
        templateData,
      });
      throw error;
    }
  }

  async deleteTicketTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_templates
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo("Ticket template deleted successfully", {
          tenantId: validatedTenantId,
          templateId,
        });
      }

      return deleted;
    } catch (error) {
      logError("Error deleting ticket template", error, {
        tenantId,
        templateId,
      });
      throw error;
    }
  }

  async duplicateTicketTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);

      // First get the original template
      const original = await this.getTicketTemplateById(
        validatedTenantId,
        templateId,
      );
      if (!original) {
        throw new Error("Template not found");
      }

      // Create a copy with modified name
      const copyData = {
        ...original,
        name: `${original.name} (Cópia)`,
        id: undefined, // Will be generated
        created_at: undefined,
        updated_at: undefined,
      };

      return await this.createTicketTemplate(validatedTenantId, copyData);
    } catch (error) {
      logError("Error duplicating ticket template", error, {
        tenantId,
        templateId,
      });
      throw error;
    }
  }

  async bulkDeleteTicketTemplates(
    tenantId: string,
    templateIds: string[],
  ): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      if (!templateIds || templateIds.length === 0) {
        return true;
      }

      const placeholders = templateIds
        .map((_, index) => `$${index + 2}`)
        .join(", ");
      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_templates
        WHERE tenant_id = ${validatedTenantId} AND id IN (${sql.raw(placeholders)})
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo("Ticket templates bulk deleted successfully", {
          tenantId: validatedTenantId,
          count: result.rowCount,
          templateIds,
        });
      }

      return deleted;
    } catch (error) {
      logError("Error bulk deleting ticket templates", error, {
        tenantId,
        templateIds,
      });
      throw error;
    }
  }

  async updateTenantIntegrationStatus(
    tenantId: string,
    integrationId: string,
    status: string,
  ): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.integrations
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${integrationId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo("Integration status updated successfully", {
        tenantId: validatedTenantId,
        integrationId,
        status,
      });
    } catch (error) {
      logError("Error updating integration status", error, {
        tenantId,
        integrationId,
        status,
      });
      throw error;
    }
  }

  async initializeTenantIntegrations(tenantId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);

      console.log(
        `🔧 [INIT-INTEGRATIONS] Initializing integrations for tenant: ${validatedTenantId}`,
      );

      // Create default integrations if they don't exist
      await this.createDefaultIntegrations(validatedTenantId);

      console.log(
        `✅ [INIT-INTEGRATIONS] Integrations initialized for tenant: ${validatedTenantId}`,
      );
    } catch (error) {
      console.error(
        `❌ [INIT-INTEGRATIONS] Error initializing integrations:`,
        error,
      );
      throw error;
    }
  }

  // ===========================
  // TENANT INTEGRATIONS
  // ===========================

  async getTenantIntegrations(tenantId: string): Promise<any[]> {
    try {
      console.log(`🔍 [STORAGE] Getting integrations for tenant: ${tenantId}`);

      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // Use the standard integrations table (not service_integrations)
      const tableExists = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'integrations'
        );
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log(
          `🔧 Creating integrations table for tenant ${validatedTenantId}`,
        );
        await this.createDefaultIntegrations(validatedTenantId);
      }

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations
        WHERE tenant_id = ${validatedTenantId}
        ORDER BY created_at DESC
      `);

      console.log(
        `📊 [STORAGE] Found ${result.rows.length} integrations for tenant: ${validatedTenantId}`,
      );

      // If no integrations are found, create default ones
      if (!result.rows || result.rows.length === 0) {
        console.log(
          `🔧 No integrations found for tenant ${validatedTenantId}, creating defaults.`,
        );
        await this.createDefaultIntegrations(validatedTenantId);

        // Re-fetch after creation
        const newResult = await tenantDb.execute(sql`
          SELECT * FROM ${sql.identifier(schemaName)}.integrations
          WHERE tenant_id = ${validatedTenantId}
          ORDER BY created_at DESC
        `);
        return newResult.rows || [];
      }

      return result.rows || [];
    } catch (error) {
      console.error(`❌ [STORAGE] Error getting tenant integrations:`, error);
      return [];
    }
  }

  async getTenantIntegrationConfig(
    tenantId: string,
    integrationId: string,
  ): Promise<any | undefined> {
    try {
      console.log(
        `🔍 [GET-CONFIG] Buscando configuração: tenant=${tenantId}, integration=${integrationId}`,
      );

      // ✅ VALIDATION: Input validation
      if (!tenantId || typeof tenantId !== "string") {
        console.error(`❌ [GET-CONFIG] Invalid tenantId: ${tenantId}`);
        return { configured: false, config: {} };
      }

      if (!integrationId || typeof integrationId !== "string") {
        console.error(
          `❌ [GET-CONFIG] Invalid integrationId: ${integrationId}`,
        );
        return { configured: false, config: {} };
      }

      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // ✅ SAFETY: Check if integrations table exists
      let tableExists;
      try {
        const tableExistsResult = await tenantDb.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = ${schemaName} AND table_name = 'integrations'
          );
        `);
        tableExists = tableExistsResult.rows?.[0]?.exists;
      } catch (tableCheckError) {
        console.error(
          `❌ [GET-CONFIG] Error checking table existence:`,
          tableCheckError,
        );
        return { configured: false, config: {} };
      }

      if (!tableExists) {
        console.log(
          `❌ [GET-CONFIG] Integrations table does not exist for tenant ${validatedTenantId}`,
        );
        // ✅ CRITICAL FIX: Create default integrations if table doesn't exist
        await this.createDefaultIntegrations(validatedTenantId);
      }

      // ✅ SAFETY: Execute query with proper error handling
      let result;
      try {
        result = await tenantDb.execute(sql`
          SELECT id, name, description, category, icon, status, config, features, created_at, updated_at, configured
          FROM ${sql.identifier(schemaName)}.integrations 
          WHERE tenant_id = ${validatedTenantId} AND id = ${integrationId}
          LIMIT 1
        `);
      } catch (queryError) {
        console.error(`❌ [GET-CONFIG] Database query error:`, queryError);
        return { configured: false, config: {} };
      }

      console.log(`🔍 [GET-CONFIG] Query result:`, {
        rowsFound: result.rows?.length || 0,
      });

      if (!result.rows || result.rows.length === 0) {
        console.log(
          `❌ [GET-CONFIG] Nenhuma configuração encontrada para ${integrationId}, criando integração default...`,
        );
        // ✅ CRITICAL FIX: Create integration if it doesn't exist
        await this.createTenantIntegration(validatedTenantId, {
          id: integrationId,
          name: integrationId === "telegram" ? "Telegram" : integrationId,
          description:
            integrationId === "telegram"
              ? "Envio de notificações via Telegram"
              : `Integration ${integrationId}`,
          category: "Comunicação",
          icon: integrationId === "telegram" ? "Send" : "Settings",
          features:
            integrationId === "telegram"
              ? ["Notificações em tempo real", "Mensagens personalizadas"]
              : [],
        });
        return {
          id: integrationId,
          name: integrationId === "telegram" ? "Telegram" : integrationId,
          configured: false,
          config: {},
          status: "disconnected",
        };
      }

      const integration = result.rows[0];

      // ✅ SAFETY: Parse config if it's a string with proper error handling
      let parsedConfig = integration.config;
      if (typeof integration.config === "string") {
        try {
          parsedConfig = JSON.parse(integration.config);
        } catch (parseError) {
          console.error(
            `❌ [GET-CONFIG] Erro ao fazer parse do config:`,
            parseError,
          );
          parsedConfig = {}; // Default to empty object on parse error
        }
      }

      // ✅ VALIDATION: Ensure config is an object
      if (parsedConfig === null || typeof parsedConfig !== "object") {
        parsedConfig = {};
      }

      // ✅ CRITICAL FIX: Return structured response with configured flag
      const isConfigured =
        integration.configured === true ||
        (parsedConfig && Object.keys(parsedConfig).length > 0);

      // ✅ TELEGRAM SPECIFIC: Log configuração do Telegram
      if (integration.id === "telegram") {
        console.log(`📱 [TELEGRAM-CONFIG] Dados carregados:`, {
          configured: isConfigured,
          hasConfig: !!parsedConfig,
          configKeys: parsedConfig ? Object.keys(parsedConfig) : [],
          botToken: parsedConfig?.telegramBotToken
            ? "***" + parsedConfig.telegramBotToken.slice(-4)
            : "VAZIO",
          chatId: parsedConfig?.telegramChatId || "VAZIO",
        });
      }

      const finalResult = {
        id: integration.id,
        name: integration.name,
        description: integration.description,
        category: integration.category,
        icon: integration.icon,
        status: integration.status,
        configured: isConfigured,
        config: parsedConfig || {},
        features: integration.features,
        created_at: integration.created_at,
        updated_at: integration.updated_at,
      };

      console.log(`✅ [GET-CONFIG] Configuração retornada:`, {
        id: finalResult.id,
        configured: finalResult.configured,
        hasConfig: !!finalResult.config,
        configKeys: Object.keys(finalResult.config || {}),
      });

      return finalResult;
    } catch (error) {
      console.error(
        "❌ [GET-CONFIG] Critical error in getTenantIntegrationConfig:",
        error,
      );
      return { configured: false, config: {} };
    }
  }

  async saveTenantIntegrationConfig(
    tenantId: string,
    integrationId: string,
    config: any,
  ): Promise<any> {
    try {
      console.log(
        `💾 [SAVE-CONFIG] Salvando configuração: tenant=${tenantId}, integration=${integrationId}`,
      );
      console.log(
        `💾 [SAVE-CONFIG] Config data keys:`,
        Object.keys(config || {}),
      );

      // ✅ TELEGRAM SPECIFIC: Log específico para Telegram
      if (integrationId === "telegram") {
        console.log(`📱 [TELEGRAM-SAVE] Campos Telegram:`, {
          enabled: config.enabled,
          hasBotToken: !!config.telegramBotToken,
          botTokenStart: config.telegramBotToken
            ? config.telegramBotToken.substring(0, 10) + "..."
            : "VAZIO",
          chatId: config.telegramChatId,
        });
      }

      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // ✅ SAFETY: Check if integrations table exists
      const tableExists = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'integrations'
        );
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log(
          `🔧 Creating integrations table for tenant ${validatedTenantId}`,
        );
        await this.createDefaultIntegrations(validatedTenantId);
      }

      // Verificar se a integração existe
      console.log(
        `🔍 [SAVE-CONFIG] Verificando se integração ${integrationId} existe...`,
      );
      const existingResult = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations 
        WHERE tenant_id = ${validatedTenantId} 
        AND id = ${integrationId}
        LIMIT 1
      `);

      if (!existingResult.rows || existingResult.rows.length === 0) {
        console.log(
          `⚠️ [SAVE-CONFIG] Integração ${integrationId} não encontrada, criando...`,
        );
        // Create the integration first
        await this.createTenantIntegration(validatedTenantId, {
          id: integrationId,
          name: integrationId === "telegram" ? "Telegram" : integrationId,
          description:
            integrationId === "telegram"
              ? "Envio de notificações via Telegram"
              : `Integration ${integrationId}`,
          category: "Comunicação",
          icon: integrationId === "telegram" ? "Send" : "Settings",
          features:
            integrationId === "telegram"
              ? ["Notificações em tempo real", "Mensagens personalizadas"]
              : [],
        });
      } else {
        console.log(`✅ [SAVE-CONFIG] Integração ${integrationId} já existe`);
      }

      // Update the integration configuration
      console.log(
        `💾 [SAVE-CONFIG] Atualizando configuração na base de dados...`,
      );
      const updateResult = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.integrations 
        SET 
          config = ${JSON.stringify(config)},
          configured = true,
          status = ${config.enabled ? "connected" : "disconnected"},
          updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = ${validatedTenantId} 
        AND id = ${integrationId}
        RETURNING *
      `);

      if (updateResult.rows && updateResult.rows.length > 0) {
        const updatedIntegration = updateResult.rows[0] as any;
        console.log(
          `✅ [SAVE-CONFIG] Configuração salva com sucesso para ${integrationId}`,
        );
        console.log(`📊 [SAVE-CONFIG] Status final:`, {
          configured: updatedIntegration.configured,
          status: updatedIntegration.status,
          configKeys: updatedIntegration.config
            ? Object.keys(updatedIntegration.config)
            : [],
        });

        return {
          integrationId: updatedIntegration.id,
          tenantId: updatedIntegration.tenant_id,
          configured: updatedIntegration.configured,
          config: updatedIntegration.config,
          status: updatedIntegration.status,
          updatedAt: updatedIntegration.updated_at,
        };
      } else {
        throw new Error("Failed to save integration configuration");
      }
    } catch (error) {
      console.error(`❌ [SAVE-CONFIG] Erro ao salvar configuração:`, error);
      throw error;
    }
  }

  async getIntegrationByType(
    tenantId: string,
    typeName: string,
  ): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations
        WHERE name = ${typeName} AND tenant_id = ${validatedTenantId}
        LIMIT 1
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError("Error fetching integration by type", error, {
        tenantId,
        typeName,
      });
      return undefined;
    }
  }

  private async createDefaultIntegrations(tenantId: string): Promise<void> {
    try {
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

      await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.integrations (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          icon VARCHAR(100),
          status VARCHAR(50) DEFAULT 'disconnected',
          configured BOOLEAN DEFAULT false,
          config JSONB DEFAULT '{}',
          features TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Use raw SQL since Drizzle has issues with TEXT[] arrays - ALL 14 INTEGRATIONS
      const insertQuery = `
        INSERT INTO ${schemaName}.integrations 
        (id, tenant_id, name, description, category, icon, status, configured, config, features)
        VALUES 
        ('gmail-oauth2', '${tenantId}', 'Gmail OAuth2', 'Integração OAuth2 com Gmail para envio e recebimento seguro de emails', 'Comunicação', 'Mail', 'disconnected', false, '{}', ARRAY['OAuth2 Authentication', 'Send/Receive Emails', 'Auto-sync', 'Secure Token Management']),
        ('outlook-oauth2', '${tenantId}', 'Outlook OAuth2', 'Integração OAuth2 com Microsoft Outlook para emails corporativos', 'Comunicação', 'Mail', 'disconnected', false, '{}', ARRAY['OAuth2 Authentication', 'Exchange Integration', 'Calendar Sync', 'Corporate Email']),
        ('email-smtp', '${tenantId}', 'Email SMTP', 'Configuração de servidor SMTP para envio de emails automáticos e notificações', 'Comunicação', 'Mail', 'disconnected', false, '{}', ARRAY['Notificações por email', 'Tickets por email', 'Relatórios automáticos']),
        ('imap-email', '${tenantId}', 'IMAP Email', 'Conecte sua caixa de email via IMAP para sincronização de tickets', 'Comunicação', 'Inbox', 'disconnected', false, '{}', ARRAY['Sincronização bidirecional', 'Auto-resposta', 'Filtros avançados']),
        ('whatsapp-business', '${tenantId}', 'WhatsApp Business', 'Integração com WhatsApp Business API para atendimento via WhatsApp', 'Comunicação', 'MessageSquare', 'disconnected', false, '{}', ARRAY['Mensagens automáticas', 'Templates aprovados', 'Webhooks']),
        ('slack', '${tenantId}', 'Slack', 'Notificações e gerenciamento de tickets através do Slack', 'Comunicação', 'MessageCircle', 'disconnected', false, '{}', ARRAY['Notificações de tickets', 'Comandos slash', 'Bot integrado']),
        ('twilio-sms', '${tenantId}', 'Twilio SMS', 'Envio de SMS para notificações e alertas importantes', 'Comunicação', 'Phone', 'disconnected', false, '{}', ARRAY['SMS automático', 'Notificações críticas', 'Verificação 2FA']),
        ('telegram', '${tenantId}', 'Telegram', 'Envio de notificações e alertas via Telegram para grupos ou usuários', 'Comunicação', 'Send', 'disconnected', false, '{}', ARRAY['Notificações em tempo real', 'Mensagens personalizadas', 'Integração com Bot API']),
        ('zapier', '${tenantId}', 'Zapier', 'Conecte com mais de 3000 aplicativos através de automações Zapier', 'Automação', 'Zap', 'disconnected', false, '{}', ARRAY['Workflows automáticos', '3000+ integrações', 'Triggers personalizados']),
        ('webhooks', '${tenantId}', 'Webhooks', 'Receba notificações em tempo real de eventos do sistema', 'Automação', 'Webhook', 'disconnected', false, '{}', ARRAY['Eventos em tempo real', 'Custom endpoints', 'Retry automático']),
        ('crm-integration', '${tenantId}', 'CRM Integration', 'Sincronização com sistemas CRM para gestão unificada de clientes', 'Dados', 'Database', 'disconnected', false, '{}', ARRAY['Sincronização bidirecionais', 'Mapeamento de campos', 'Histórico unificado']),
        ('dropbox-personal', '${tenantId}', 'Dropbox Pessoal', 'Backup automático de dados e arquivos importantes', 'Dados', 'Cloud', 'disconnected', false, '{}', ARRAY['Backup automático', 'Sincronização de arquivos', 'Versionamento']),
        ('sso-saml', '${tenantId}', 'SSO/SAML', 'Single Sign-On para autenticação corporativa segura', 'Segurança', 'Shield', 'disconnected', false, '{}', ARRAY['Single Sign-On', 'SAML 2.0', 'Active Directory', 'Multi-factor Authentication']),
        ('google-workspace', '${tenantId}', 'Google Workspace', 'Integração completa com Gmail, Drive e Calendar', 'Produtividade', 'Calendar', 'disconnected', false, '{}', ARRAY['Gmail sync', 'Drive backup', 'Calendar integration']),
        ('chatbot-ai', '${tenantId}', 'Chatbot IA', 'Assistente virtual inteligente para atendimento automatizado', 'Produtividade', 'Bot', 'disconnected', false, '{}', ARRAY['Respostas automáticas', 'Machine Learning', 'Escalação inteligente'])
        ON CONFLICT (id) DO NOTHING
      `;

      await tenantDb.execute(sql.raw(insertQuery));
    } catch (error) {
      throw error;
    }
  }

  // =========================================
  // Helper methods for DatabaseStorage Class
  // =========================================

  // Validates if a string is a valid UUID
  private validateUUID(uuid: string): string | null {
    if (!uuid || typeof uuid !== "string") return null;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid) ? uuid : null;
  }

  // Gets tenant specific database connection from pool manager
  private async getTenantConnection(tenantId: string): Promise<any> {
    const validatedTenantId = this.validateUUID(tenantId);
    if (!validatedTenantId) {
      throw new Error(`Invalid tenant UUID provided: ${tenantId}`);
    }
    return poolManager.getTenantConnection(validatedTenantId);
  }

  // ✅ CRITICAL FIX: Add missing deleteTenantIntegrations method
  async deleteTenantIntegrations(tenantId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.integrations
        WHERE tenant_id = ${validatedTenantId}
      `);

      console.log(
        `🗑️ [DELETE-INTEGRATIONS] Limpeza de integrações para tenant ${validatedTenantId} concluída`,
      );
    } catch (error) {
      console.error(
        `❌ [DELETE-INTEGRATIONS] Erro ao limpar integrações:`,
        error,
      );
      throw error;
    }
  }

  // Creates a new integration entry for a tenant
  private async createTenantIntegration(
    tenantId: string,
    integrationData: any,
  ): Promise<void> {
    try {
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

      // Use raw SQL since Drizzle has issues with TEXT[] arrays
      const insertQuery = `
        INSERT INTO ${schemaName}.integrations 
        (id, tenant_id, name, description, category, icon, status, configured, config, features, created_at, updated_at)
        VALUES 
        ('${integrationData.id}', '${tenantId}', '${integrationData.name}', '${integrationData.description}', 
         '${integrationData.category}', '${integrationData.icon}', 'disconnected', false, '{}', 
         ARRAY[${integrationData.features.map((f: string) => `'${f}'`).join(", ")}], 
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `;

      await tenantDb.execute(sql.raw(insertQuery));
      console.log(
        `✅ [CREATE-INTEGRATION] Integração ${integrationData.id} criada para tenant ${tenantId}`,
      );
    } catch (error) {
      console.error(`❌ [CREATE-INTEGRATION] Erro ao criar integração:`, error);
      throw error;
    }
  }

  // ==============================
  // BENEFICIARY-CUSTOMER RELATIONSHIPS METHODS
  // ==============================

  async getBeneficiaryCustomers(
    tenantId: string,
    beneficiaryId: string,
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          fcr.created_at as relationship_created_at
        FROM ${sql.identifier(schemaName)}.beneficiary_customer_relationships fcr
        JOIN ${sql.identifier(schemaName)}.customers c ON c.id = fcr.customer_id
        WHERE fcr.beneficiary_id = ${beneficiaryId} AND fcr.tenant_id = ${validatedTenantId}
        ORDER BY fcr.created_at DESC
      `);

      return result.rows || [];
    } catch (error) {
      logError("Error fetching beneficiary customers", error, {
        tenantId,
        beneficiaryId,
      });
      return [];
    }
  }

  async addBeneficiaryCustomer(
    tenantId: string,
    beneficiaryId: string,
    customerId: string,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.beneficiary_customer_relationships (
          beneficiary_id, customer_id, tenant_id, created_at, updated_at
        ) VALUES (${beneficiaryId}, ${customerId}, ${validatedTenantId}, NOW(), NOW())
        ON CONFLICT (beneficiary_id, customer_id) DO NOTHING
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError("Error adding beneficiary customer relationship", error, {
        tenantId,
        beneficiaryId,
        customerId,
      });
      throw error;
    }
  }

  async removeBeneficiaryCustomer(
    tenantId: string,
    beneficiaryId: string,
    customerId: string,
  ): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.beneficiary_customer_relationships
        WHERE beneficiary_id = ${beneficiaryId} 
          AND customer_id = ${customerId}
          AND tenant_id = ${validatedTenantId}
      `);

      return (result.rowCount || 0) > 0;
    } catch (error) {
      logError("Error removing beneficiary customer relationship", error, {
        tenantId,
        beneficiaryId,
        customerId,
      });
      throw error;
    }
  }

  // ==============================
  // TICKET RELATIONSHIPS METHODS
  // ==============================

  async getTicketsWithRelationships(tenantId: string): Promise<string[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT DISTINCT 
          CASE 
            WHEN tr.source_ticket_id = t.id THEN tr.source_ticket_id
            ELSE tr.target_ticket_id 
          END as ticket_id
        FROM ${sql.identifier(schemaName)}.tickets t
        INNER JOIN ${sql.identifier(schemaName)}.ticket_relationships tr 
          ON (tr.source_ticket_id = t.id OR tr.target_ticket_id = t.id)
        WHERE t.tenant_id = ${validatedTenantId}
      `);

      return result.rows?.map((row: any) => row.ticket_id as string) || [];
    } catch (error) {
      logError("Error fetching tickets with relationships", error, {
        tenantId,
      });
      return [];
    }
  }

  async searchTickets(tenantId: string, query: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT id, short_description as subject, state as status, priority, COALESCE(number, CONCAT('T-', SUBSTRING(id::text, 1, 8))) as number, created_at
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE tenant_id = ${validatedTenantId}
        AND (
          short_description ILIKE ${"%" + query + "%"} OR
          description ILIKE ${"%" + query + "%"} OR
          number ILIKE ${"%" + query + "%"} OR
          id::text = ${query}
        )
        ORDER BY created_at DESC
        LIMIT 20
      `);

      return result.rows || [];
    } catch (error) {
      logError("Error searching tickets", error, { tenantId, query });
      throw error;
    }
  }

  async getTicketRelationships(
    tenantId: string,
    ticketId: string,
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          tr.id,
          tr.relationship_type as "relationshipType",
          tr.description,
          tr.created_at as "createdAt",
          CASE 
            WHEN tr.source_ticket_id = ${ticketId} THEN t_target.id
            WHEN tr.target_ticket_id = ${ticketId} THEN t_source.id
          END as "targetTicket.id",
          CASE 
            WHEN tr.source_ticket_id = ${ticketId} THEN t_target.subject
            WHEN tr.target_ticket_id = ${ticketId} THEN t_source.subject
          END as "targetTicket.subject",
          CASE 
            WHEN tr.source_ticket_id = ${ticketId} THEN t_target.status
            WHEN tr.target_ticket_id = ${ticketId} THEN t_source.status
          END as "targetTicket.status",
          CASE 
            WHEN tr.source_ticket_id = ${ticketId} THEN t_target.priority
            WHEN tr.target_ticket_id = ${ticketId} THEN t_source.priority
          END as "targetTicket.priority",
          CASE 
            WHEN tr.source_ticket_id = ${ticketId} THEN COALESCE(t_target.number, CONCAT('T-', SUBSTRING(t_target.id::text, 1, 8)))
            WHEN tr.target_ticket_id = ${ticketId} THEN COALESCE(t_source.number, CONCAT('T-', SUBSTRING(t_source.id::text, 1, 8)))
          END as "targetTicket.number",
          CASE 
            WHEN tr.source_ticket_id = ${ticketId} THEN t_target.created_at
            WHEN tr.target_ticket_id = ${ticketId} THEN t_source.created_at
          END as "targetTicket.createdAt"
        FROM "${schemaName}".ticket_relationships tr
        LEFT JOIN "${schemaName}".tickets t_source ON tr.source_ticket_id = t_source.id
        LEFT JOIN "${schemaName}".tickets t_target ON tr.target_ticket_id = t_target.id
        WHERE tr.source_ticket_id = ${ticketId} OR tr.target_ticket_id = ${ticketId}
        ORDER BY tr.created_at DESC
      `);

      // Transform the flat result into nested structure
      const relationships = result.rows?.map((row: any) => ({
        id: row.id,
        relationshipType: row.relationshipType,
        description: row.description,
        createdAt: row.createdAt,
        targetTicket: {
          id: row["targetTicket.id"],
          subject: row["targetTicket.subject"],
          status: row["targetTicket.status"],
          priority: row["targetTicket.priority"],
          number: row["targetTicket.number"],
          createdAt: row["targetTicket.createdAt"],
        },
      }));

      return relationships || [];
    } catch (error) {
      logError("Error fetching ticket relationships", error, {
        tenantId,
        ticketId,
      });
      throw error;
    }
  }

  async createTicketRelationship(
    tenantId: string,
    ticketId: string,
    relationshipData: any,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const id = crypto.randomUUID();
      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.ticket_relationships
        (id, tenant_id, source_ticket_id, target_ticket_id, relationship_type, description, created_by, created_at, updated_at)
        VALUES (
          ${id},
          ${validatedTenantId},
          ${ticketId},
          ${relationshipData.targetTicketId},
          ${relationshipData.relationshipType},
          ${relationshipData.description || null},
          ${relationshipData.createdBy || validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      logInfo("Ticket relationship created successfully", {
        tenantId: validatedTenantId,
        relationshipId: id,
      });
      return result.rows?.[0];
    } catch (error) {
      logError("Error creating ticket relationship", error, {
        tenantId,
        ticketId,
        relationshipData,
      });
      throw error;
    }
  }

  async deleteTicketRelationship(relationshipId: string): Promise<boolean> {
    try {
      // ⚠️ CRITICAL SECURITY FIX: This method needs tenant context!
      // Cannot safely delete without knowing which tenant this relationship belongs to
      throw new Error(
        "SECURITY: deleteTicketRelationship requires explicit tenant context. Use deleteTicketRelationshipWithTenant(tenantId, relationshipId) instead.",
      );
    } catch (error) {
      logError(
        "Error deleting ticket relationship - security violation prevented",
        error,
        { relationshipId },
      );
      throw error;
    }
  }

  // ✅ SECURITY FIX: New safe method with explicit tenant context
  async deleteTicketRelationshipWithTenant(
    tenantId: string,
    relationshipId: string,
  ): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db: tenantDb } =
        await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = schemaManager.getSchemaName(validatedTenantId);

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_relationships
        WHERE id = ${relationshipId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo("Ticket relationship deleted successfully", {
          tenantId: validatedTenantId,
          relationshipId,
        });
      }

      return deleted;
    } catch (error) {
      logError("Error deleting ticket relationship", error, {
        tenantId,
        relationshipId,
      });
      throw error;
    }
  }

  async getTicketHierarchy(tenantId: string, ticketId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // Build hierarchy using recursive CTE
      const result = await tenantDb.execute(sql`
        WITH RECURSIVE ticket_hierarchy AS (
          -- Base case: find root ticket (no parent or current ticket)
          SELECT 
            t.id,
            t.short_description as subject,
            t.state as status,
            t.priority,
            t.number,
            t.parent_ticket_id as "parentTicketId",
            NULL::uuid as "rootTicketId",
            0 as "hierarchyLevel"
          FROM ${sql.identifier(schemaName)}.tickets t
          WHERE t.id = ${ticketId} AND t.tenant_id = ${validatedTenantId}

          UNION ALL

          -- Recursive case: find children
          SELECT 
            t.id,
            t.short_description as subject,
            t.state as status,
            t.priority,
            t.number,
            t.parent_ticket_id as "parentTicketId",
            COALESCE(th."rootTicketId", ${ticketId}) as "rootTicketId",
            th."hierarchyLevel" + 1 as "hierarchyLevel"
          FROM ${sql.identifier(schemaName)}.tickets t
          JOIN ticket_hierarchy th ON t.parent_ticket_id = th.id
          WHERE t.tenant_id = ${validatedTenantId}
        )
        SELECT * FROM ticket_hierarchy
        ORDER BY "hierarchyLevel", subject
      `);

      return result.rows || [];
    } catch (error) {
      logError("Error fetching ticket hierarchy", error, {
        tenantId,
        ticketId,
      });
      throw error;
    }
  }

  // ===========================
  // EMAIL TEMPLATES MANAGEMENT
  // ===========================

  async getEmailTemplates(tenantId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db } = await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await db.execute(sql`
        SELECT 
          id,
          name,
          subject,
          content,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM ${sql.identifier(schemaName)}.email_templates
        WHERE tenant_id = ${validatedTenantId}
        ORDER BY name
      `);

      return result.rows || [];
    } catch (error) {
      logError("Error fetching email templates", error, { tenantId });
      throw error;
    }
  }

  async createEmailTemplate(tenantId: string, templateData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db } = await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const templateId = randomUUID();
      const now = new Date().toISOString();

      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.email_templates (
          id, tenant_id, name, subject, content, created_at, updated_at
        ) VALUES (
          ${templateId}, ${validatedTenantId}, ${templateData.name}, 
          ${templateData.subject}, ${templateData.content}, ${now}, ${now}
        ) RETURNING *
      `);

      const template = result.rows?.[0];
      if (template) {
        logInfo("Email template created successfully", {
          tenantId: validatedTenantId,
          templateId,
        });
      }

      return template;
    } catch (error) {
      logError("Error creating email template", error, {
        tenantId,
        templateData,
      });
      throw error;
    }
  }

  async updateEmailTemplate(
    tenantId: string,
    templateId: string,
    templateData: any,
  ): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db } = await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const now = new Date().toISOString();

      const result = await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.email_templates 
        SET 
          name = ${templateData.name},
          subject = ${templateData.subject},
          content = ${templateData.content},
          updated_at = ${now}
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      const template = result.rows?.[0];
      if (template) {
        logInfo("Email template updated successfully", {
          tenantId: validatedTenantId,
          templateId,
        });
      }

      return template;
    } catch (error) {
      logError("Error updating email template", error, {
        tenantId,
        templateId,
        templateData,
      });
      throw error;
    }
  }

  async deleteEmailTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db } = await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.email_templates
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo("Email template deleted successfully", {
          tenantId: validatedTenantId,
          templateId,
        });
      }

      return deleted;
    } catch (error) {
      logError("Error deleting email template", error, {
        tenantId,
        templateId,
      });
      throw error;
    }
  }

  async getEmailInboxMessages(tenantId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // Check if emails table exists, if not create it
      const tableExists = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} 
          AND table_name = 'emails'
        );
      `);

      if (!tableExists.rows?.[0]?.exists) {
        // Create emails table if it doesn't exist
        await tenantDb.execute(sql`
          CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.emails (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            message_id TEXT UNIQUE NOT NULL,
            thread_id TEXT,
            from_email TEXT NOT NULL,
            from_name TEXT,
            to_email TEXT NOT NULL,
            cc_emails TEXT DEFAULT '[]',
            bcc_emails TEXT DEFAULT '[]',
            subject TEXT,
            body_text TEXT,
            body_html TEXT,
            has_attachments BOOLEAN DEFAULT false,
            attachment_count INTEGER DEFAULT 0,
            attachment_details TEXT DEFAULT '[]',
            email_headers TEXT DEFAULT '{}',
            priority VARCHAR(20) DEFAULT 'medium',
            is_read BOOLEAN DEFAULT false,
            is_processed BOOLEAN DEFAULT false,
            rule_matched TEXT,
            ticket_created UUID,
            email_date TIMESTAMP,
            received_at TIMESTAMP DEFAULT NOW(),
            processed_at TIMESTAMP
          )
        `);

        // Add indexes
        await tenantDb.execute(sql`
          CREATE INDEX IF NOT EXISTS emails_tenant_received_idx 
          ON ${sql.identifier(schemaName)}.emails (tenant_id, received_at DESC)
        `);

        await tenantDb.execute(sql`
          CREATE INDEX IF NOT EXISTS emails_message_id_idx 
          ON ${sql.identifier(schemaName)}.emails (message_id)
        `);

        logInfo("Emails table created for tenant", {
          tenantId: validatedTenantId,
        });
      }

      const result = await tenantDb.execute(sql`
        SELECT 
          id, message_id as "messageId", 
          from_email as "fromEmail", from_name as "fromName",
          to_email as "toEmail", cc_emails as "ccEmails", bcc_emails as "bccEmails",
          subject, body_text as "bodyText", body_html as "bodyHtml",
          has_attachments as "hasAttachments", attachment_count as "attachmentCount",
          attachment_details as "attachmentDetails", email_headers as "emailHeaders",
          priority, is_read as "isRead", is_processed as "isProcessed",
          email_date as "emailDate", received_at as "receivedAt", processed_at as "processedAt"
        FROM ${sql.identifier(schemaName)}.emails 
        WHERE tenant_id = ${validatedTenantId}
        ORDER BY received_at DESC
        LIMIT 100
      `);

      return result.rows || [];
    } catch (error) {
      logError("Error fetching email inbox messages", error, { tenantId });
      return [];
    }
  }

  // Email management methods
  async markEmailAsRead(tenantId: string, messageId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.emails 
        SET is_read = true, processed_at = NOW()
        WHERE message_id = ${messageId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo("Email marked as read", {
        tenantId: validatedTenantId,
        messageId,
      });
    } catch (error) {
      logError("Error marking email as read", error, { tenantId, messageId });
      throw error;
    }
  }

  async archiveEmail(tenantId: string, messageId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.emails 
        SET is_processed = true, processed_at = NOW()
        WHERE message_id = ${messageId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo("Email archived", { tenantId: validatedTenantId, messageId });
    } catch (error) {
      logError("Error archiving email", error, { tenantId, messageId });
      throw error;
    }
  }

  async deleteEmail(tenantId: string, messageId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.emails 
        WHERE message_id = ${messageId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo("Email deleted", { tenantId: validatedTenantId, messageId });
    } catch (error) {
      logError("Error deleting email", error, { tenantId, messageId });
      throw error;
    }
  }

  async saveEmailToInbox(tenantId: string, messageData: any): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // Check if emails table exists, if not create it
      const tableExists = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} 
          AND table_name = 'emails'
        );
      `);

      if (!tableExists.rows?.[0]?.exists) {
        // Create emails table if it doesn't exist
        await tenantDb.execute(sql`
          CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.emails (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            message_id TEXT UNIQUE NOT NULL,
            thread_id TEXT,
            from_email TEXT NOT NULL,
            from_name TEXT,
            to_email TEXT NOT NULL,
            cc_emails TEXT DEFAULT '[]',
            bcc_emails TEXT DEFAULT '[]',
            subject TEXT,
            body_text TEXT,
            body_html TEXT,
            has_attachments BOOLEAN DEFAULT false,
            attachment_count INTEGER DEFAULT 0,
            attachment_details TEXT DEFAULT '[]',
            email_headers TEXT DEFAULT '{}',
            priority VARCHAR(20) DEFAULT 'medium',
            is_read BOOLEAN DEFAULT false,
            is_processed BOOLEAN DEFAULT false,
            rule_matched TEXT,
            ticket_created UUID,
            email_date TIMESTAMP,
            received_at TIMESTAMP DEFAULT NOW(),
            processed_at TIMESTAMP
          )
        `);

        // Add indexes
        await tenantDb.execute(sql`
          CREATE INDEX IF NOT EXISTS emails_tenant_received_idx 
          ON ${sql.identifier(schemaName)}.emails (tenant_id, received_at DESC)
        `);

        await tenantDb.execute(sql`
          CREATE INDEX IF NOT EXISTS emails_message_id_idx 
          ON ${sql.identifier(schemaName)}.emails (message_id)
        `);

        logInfo("Emails table created for tenant", {
          tenantId: validatedTenantId,
        });
      }

      // Insert message into emails table
      await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.emails (
          id, tenant_id, message_id, from_email, from_name, to_email, 
          cc_emails, bcc_emails, subject, body_text, body_html, 
          has_attachments, attachment_count, attachment_details, 
          email_headers, priority, is_read, is_processed, 
          email_date, received_at
        ) VALUES (
          ${messageData.id || randomUUID()},
          ${validatedTenantId},
          ${messageData.message_id},
          ${messageData.from_email},
          ${messageData.from_name || null},
          ${messageData.to_email},
          ${messageData.cc_emails || "[]"},
          ${messageData.bcc_emails || "[]"},
          ${messageData.subject || null},
          ${messageData.body_text || null},
          ${messageData.body_html || null},
          ${messageData.has_attachments || false},
          ${messageData.attachment_count || 0},
          ${messageData.attachment_details || "[]"},
          ${messageData.email_headers || "{}"},
          ${messageData.priority || "medium"},
          ${messageData.is_read || false},
          ${messageData.is_processed || false},
          ${messageData.email_date || new Date().toISOString()},
          ${messageData.received_at || new Date().toISOString()}
        )
        ON CONFLICT (message_id) DO NOTHING
      `);

      logInfo("Message saved to inbox", {
        tenantId: validatedTenantId,
        messageId: messageData.message_id,
        source: messageData.from_email.includes("telegram:")
          ? "Telegram"
          : "Email",
      });
    } catch (error) {
      logError("Error saving message to inbox", error, {
        tenantId,
        messageData,
      });
      throw error;
    }
  }

  async getClientesCount(tenantId: string): Promise<number> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(schemaName)}.external_contacts
        WHERE tenant_id = ${validatedTenantId} AND type = 'cliente'
      `);

      return parseInt((result.rows?.[0]?.count as string) || "0");
    } catch (error) {
      logError("Error counting clientes", error, { tenantId });
      return 0;
    }
  }

  // ===========================
  // PROJECT MANAGEMENT - COMPLETELY REMOVED
  // All project-related functionality has been eliminated from the system
  // ===========================

  // ===========================
  // LOCATIONS MANAGEMENT
  // ===========================

  async getLocations(tenantId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(`
        SELECT id, tenant_id, name, description, location_type, geometry_type, coordinates, address_data, business_hours, access_requirements, sla_config, status, created_at, updated_at, tags, attachments, parent_location_id, is_favorite
        FROM "${schemaName}".locations
        WHERE status = 'active' OR status IS NULL
        ORDER BY created_at DESC
      `);

      logInfo("Locations fetched successfully", {
        tenantId: validatedTenantId,
        count: result.rows?.length,
      });
      return result.rows || [];
    } catch (error) {
      logError("Error fetching locations", error, { tenantId });
      return [];
    }
  }

  async createLocation(tenantId: string, locationData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const locationId = randomUUID();
      const now = new Date().toISOString();

      const location = {
        id: locationId,
        tenant_id: validatedTenantId,
        name: locationData.name,
        address: locationData.address || "",
        city: locationData.city || "",
        state: locationData.state || "",
        country: locationData.country || "Brasil",
        postal_code: locationData.postal_code || locationData.zipCode || "",
        latitude: locationData.latitude || "",
        longitude: locationData.longitude || "",
        active: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      await tenantDb.execute(`
        INSERT INTO "${schemaName}".locations 
        (id, tenant_id, name, address, city, state, country, postal_code, latitude, longitude, active, is_active, created_at, updated_at)
        VALUES ('${location.id}', '${location.tenant_id}', '${location.name}', 
                '${location.address}', '${location.city}', '${location.state}', 
                '${location.country}', '${location.postal_code}', '${location.latitude}', 
                '${location.longitude}', ${location.active}, ${location.is_active}, 
                '${location.created_at}', '${location.updated_at}')
      `);

      logInfo("Location created successfully", {
        tenantId: validatedTenantId,
        locationId,
      });
      return location;
    } catch (error) {
      logError("Error creating location", error, { tenantId, locationData });
      throw error;
    }
  }

  // Implement the missing initializeTenantSchema method
  async initializeTenantSchema(tenantId: string): Promise<void> {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }

      console.log(
        `🏗️ [SCHEMA-INIT] Starting schema initialization for tenant: ${tenantId}`,
      );

      // Use EnterpriseMigrationManager for robust schema creation
      const { EnterpriseMigrationManager } = await import(
        "./database/EnterpriseMigrationManager"
      );
      const migrationManager = EnterpriseMigrationManager.getInstance();

      // Create complete tenant schema with all tables
      await migrationManager.createCompleteTenantSchema(tenantId);

      console.log(
        `✅ [SCHEMA-INIT] Schema created successfully for tenant: ${tenantId}`,
      );
      logInfo("Tenant schema initialized successfully", { tenantId });
    } catch (error) {
      console.error(
        `❌ [SCHEMA-INIT] Failed to initialize schema for tenant ${tenantId}:`,
        error,
      );
      logError("Error initializing tenant schema", error, { tenantId });
      throw error;
    }
  }

  // Get beneficiary locations
  async getBeneficiaryLocations(
    beneficiaryId: string,
    tenantId: string,
  ): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          fl.location_id,
          fl.is_primary,
          l.id,
          l.name,
          l.address,
          l.city,
          l.state,
          l.country,
          l.postal_code,
          l.latitude,
          l.longitude
        FROM ${sql.identifier(schemaName)}.beneficiaries_locations fl
        JOIN ${sql.identifier(schemaName)}.locations l ON fl.location_id = l.id
        WHERE fl.beneficiary_id = ${beneficiaryId} AND fl.tenant_id = ${validatedTenantId}
        ORDER BY fl.is_primary DESC, l.name ASC
      `);

      return (result.rows || []).map((row) => ({
        locationId: row.location_id,
        isPrimary: row.is_primary,
        location: {
          id: row.id,
          name: row.name,
          address: row.address,
          city: row.city,
          state: row.state,
          country: row.country,
          postalCode: row.postal_code,
          latitude: row.latitude,
          longitude: row.longitude,
        },
      }));
    } catch (error) {
      logError("Error fetching beneficiary locations", error, {
        beneficiaryId,
        tenantId,
      });
      throw error;
    }
  }

  // Add location to beneficiary
  async addBeneficiaryLocation(
    beneficiaryId: string,
    locationId: string,
    tenantId: string,
    isPrimary: boolean = false,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // If setting as primary, remove primary from others
      if (isPrimary) {
        await tenantDb.execute(sql`
          UPDATE ${sql.identifier(schemaName)}.beneficiaries_locations 
          SET is_primary = false 
          WHERE beneficiary_id = ${beneficiaryId} AND tenant_id = ${validatedTenantId}
        `);
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.beneficiaries_locations (
          tenant_id, beneficiary_id, location_id, is_primary
        ) VALUES (
          ${validatedTenantId}, ${beneficiaryId}, ${locationId}, ${isPrimary}
        ) RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError("Error adding beneficiary location", error, {
        beneficiaryId,
        locationId,
        tenantId,
        isPrimary,
      });
      throw error;
    }
  }

  // Remove location from beneficiary
  async removeBeneficiaryLocation(
    beneficiaryId: string,
    locationId: string,
    tenantId: string,
  ): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.beneficiaries_locations 
        WHERE beneficiary_id = ${beneficiaryId} 
          AND location_id = ${locationId} 
          AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError("Error removing beneficiary location", error, {
        beneficiaryId,
        locationId,
        tenantId,
      });
      return false;
    }
  }

  // Update primary status of beneficiary location
  async updateBeneficiaryLocationPrimary(
    beneficiaryId: string,
    locationId: string,
    tenantId: string,
    isPrimary: boolean,
  ): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // If setting as primary, remove primary from others
      if (isPrimary) {
        await tenantDb.execute(sql`
          UPDATE ${sql.identifier(schemaName)}.beneficiaries_locations 
          SET is_primary = false 
          WHERE beneficiary_id = ${beneficiaryId} AND tenant_id = ${validatedTenantId}
        `);
      }

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.beneficiaries_locations 
        SET is_primary = ${isPrimary}
        WHERE beneficiary_id = ${beneficiaryId} 
          AND location_id = ${locationId} 
          AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError("Error updating beneficiary location primary status", error, {
        beneficiaryId,
        locationId,
        tenantId,
        isPrimary,
      });
      return false;
    }
  }

  // Get beneficiaries for a specific customer
  async getCustomerBeneficiaries(tenantId: string, customerId: string) {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;
      console.log(
        `Fetching beneficiaries for customer ${customerId} in tenant ${tenantId}`,
      );

      const result = await tenantDb.execute(sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          CONCAT(first_name, ' ', last_name) as full_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries 
        WHERE tenant_id = ${tenantId} AND customer_id = ${customerId} AND is_active = true
        ORDER BY first_name, last_name
      `);

      const beneficiaries = result.rows || [];

      console.log(
        `Found ${beneficiaries.length} beneficiaries for customer ${customerId}`,
      );
      return beneficiaries;
    } catch (error) {
      console.error("Error fetching customer beneficiaries:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
export const storageSimple = storage;
export const unifiedStorage = storage;

// Storage getter function for use in routes
export async function getStorage() {
  return storage;
}
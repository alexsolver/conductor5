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
  deleteTicketRelationshipWithTenant(
    tenantId: string,
    relationshipId: string,
  ): Promise<boolean>;
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
  updateBeneficiary(tenantId: string, id: string, data: any): Promise<any>;
  deleteBeneficiary(tenantId: string, id: string): Promise<boolean>;

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
  bulkDeleteTicketTemplates(
    tenantId: string,
    templateIds: string[],
  ): Promise<boolean>;

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
  deleteTenantIntegrations(tenantId: string): Promise<void>;

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
  saveEmailToInbox(tenantId: string, messageData: any): Promise<void>;
  getClientesCount(tenantId: string): Promise<number>;

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
  // Removed schemaManager as it's not used in the current implementation.
  // If needed, it should be properly initialized and injected.

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

      function normalizeUUID(value?: string | null) {
        if (!value || value === "" || value === "unspecified") return null;
        return value;
      }

      function isJsonString(str) {
        try {
          const parsed = JSON.parse(str);
          return typeof parsed === "object" && parsed !== null;
        } catch (e) {
          return false;
        }
      }

      
      
      const now = new Date().toISOString();
      const generatedId = crypto.randomUUID();
      let camposCustom = isJsonString(ticketData.custom_fields_values) ? ticketData.custom_fields_values : JSON.stringify(ticketData.custom_fields_values)
      
      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.tickets (
          id,
          tenant_id, ticket_number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id, assigned_to_id, company_id, beneficiary_id,
          is_active, created_at, updated_at, template_id, custom_fields
        )
        VALUES (
          ${generatedId},
          ${tenantId}, ${ticketNumber}, ${ticketData.subject}, ${ticketData.description},
          ${ticketData.status || "open"}, ${ticketData.priority || "medium"},
          ${ticketData.urgency || null}, ${ticketData.impact || null},
          ${ticketData.category || null}, ${ticketData.subcategory || null},
          ${normalizeUUID(ticketData.caller_id) || customerId},
          ${normalizeUUID(ticketData.assigned_to_id)},
          ${normalizeUUID(ticketData.company_id) || companyId},
          ${normalizeUUID(ticketData.beneficiary_id) || customerId},
          ${ticketData.isActive !== false}, ${now}, ${now}, ${ticketData.template_id || null},
          ${camposCustom}
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

  // Get beneficiaries with pagination and search
  async getBeneficiaries(
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
          id, tenant_id, name, cpf, cnpj, email, phone, is_active,
          created_at, updated_at, metadata
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE 1=1
      `;

      // SECURE: Parameterized search
      if (search) {
        const searchPattern = `%${search}%`;
        baseQuery = sql`${baseQuery} AND (
          name ILIKE ${searchPattern} OR
          email ILIKE ${searchPattern} OR
          cpf ILIKE ${searchPattern} OR
          cnpj ILIKE ${searchPattern}
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
      logError("Error fetching beneficiaries", error, { tenantId, options });
      throw error;
    }
  }

  async getBeneficiary(id: string, tenantId: string): Promise<any | null> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE id = ${id} AND tenant_id = ${validatedTenantId}
        LIMIT 1
      `);

      return result.rows?.[0] || null;
    } catch (error) {
      logError("Error fetching beneficiary", error, { tenantId, beneficiaryId: id });
      return null;
    }
  }

  async createBeneficiary(tenantId: string, beneficiaryData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      // Construct the name based on first_name and last_name if available, otherwise use provided name
      const name = beneficiaryData.firstName && beneficiaryData.lastName
        ? `${beneficiaryData.firstName} ${beneficiaryData.lastName}`
        : beneficiaryData.name || 'Unnamed Beneficiary';


      const beneficiaryId = crypto.randomUUID();

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.beneficiaries
        (id, name, email, phone, cpf, cnpj, tenant_id, is_active, created_at, updated_at)
        VALUES (
          ${beneficiaryId},
          ${name},
          ${beneficiaryData.email || null},
          ${beneficiaryData.phone || beneficiaryData.cellPhone || null},
          ${beneficiaryData.cpfCnpj || beneficiaryData.cpf || null},
          ${beneficiaryData.cpfCnpj || beneficiaryData.cnpj || null},
          ${validatedTenantId},
          ${beneficiaryData.isActive !== undefined ? beneficiaryData.isActive : true},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      const beneficiary = result.rows?.[0];
      if (beneficiary) {
        logInfo("Beneficiary created successfully", {
          tenantId,
          beneficiaryId: beneficiary.id,
        });
      }

      return beneficiary;
    } catch (error) {
      logError("Error creating beneficiary", error, { tenantId, beneficiaryData });
      throw error;
    }
  }

  async updateBeneficiary(tenantId: string, id: string, beneficiaryData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const now = new Date().toISOString();

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.beneficiaries
        SET
          name = COALESCE(${beneficiaryData.name}, name),
          cpf = COALESCE(${beneficiaryData.cpf}, cpf),
          cnpj = COALESCE(${beneficiaryData.cnpj}, cnpj),
          email = COALESCE(${beneficiaryData.email}, email),
          phone = COALESCE(${beneficiaryData.phone}, phone),
          is_active = COALESCE(${beneficiaryData.isActive}, is_active),
          updated_at = ${now},
          metadata = COALESCE(${beneficiaryData.metadata ? JSON.stringify(beneficiaryData.metadata) : null}, metadata)
        WHERE id = ${id} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      const beneficiary = result.rows?.[0];
      if (beneficiary) {
        logInfo("Beneficiary updated successfully", {
          tenantId,
          beneficiaryId: beneficiary.id,
        });
      }

      return beneficiary;
    } catch (error) {
      logError("Error updating beneficiary", error, { tenantId, beneficiaryId: id, beneficiaryData });
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
        RETURNING id
      `);

      const deleted = (result.rows?.length || 0) > 0;
      if (deleted) {
        logInfo("Beneficiary deleted successfully", {
          tenantId,
          beneficiaryId: id,
        });
      }

      return deleted;
    } catch (error) {
      logError("Error deleting beneficiary", error, { tenantId, beneficiaryId: id });
      return false;
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

  async createBeneficiaryFromOriginal(tenantId: string, beneficiaryData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);

      const beneficiaryWithTenant = {
        ...beneficiaryData,
        tenantId: validatedTenantId,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Use connection pool for better performance
      const pool = await poolManager.getPool();
      const client = await pool.connect();

      try {
        // Use correct column names from schema-tenant.ts
        const result = await client.query(`
          INSERT INTO ${schemaManager.getTenantSchemaName(validatedTenantId)}.beneficiaries
          (id, tenant_id, name, email, phone, cell_phone, cpf_cnpj, rg, address, city, state,
           zip_code, contact_person, contact_phone, integration_code, customer_id, customer_code,
           birth_date, notes, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          RETURNING *
        `, [
          beneficiaryWithTenant.id,
          beneficiaryWithTenant.tenantId,
          beneficiaryData.firstName && beneficiaryData.lastName ?
            `${beneficiaryData.firstName} ${beneficiaryData.lastName}` :
            beneficiaryData.firstName || beneficiaryData.lastName || 'Unnamed',
          beneficiaryData.email || null,
          beneficiaryData.phone || null,
          beneficiaryData.cellPhone || null,
          beneficiaryData.cpfCnpj || null,
          null, // cnpj - separate from cpfCnpj
          beneficiaryData.rg || null,
          null, // address
          null, // city
          null, // state
          null, // zip_code
          beneficiaryData.contactPerson || null,
          beneficiaryData.contactPhone || null,
          null, // integration_code
          beneficiaryData.customerId || null,
          beneficiaryData.customerCode || null,
          beneficiaryData.birthDate || null,
          null, // notes
          beneficiaryData.isActive !== undefined ? beneficiaryData.isActive : true,
          beneficiaryWithTenant.createdAt,
          beneficiaryWithTenant.updatedAt
        ]);

        logInfo("Beneficiary created successfully", {
          beneficiaryId: result.rows[0].id,
          tenantId: validatedTenantId,
        });

        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      logError("Error creating beneficiary", error, { tenantId, data: beneficiaryData });
      throw error;
    }
  }


  // Get customer beneficiaries (many-to-many relationship)
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

  // ===========================
  // TENANT INTEGRATIONS MANAGEMENT
  // ===========================

  async getTenantIntegrations(tenantId: string): Promise<any[]> {
    // Lista estática de TODAS as integrações disponíveis no sistema
    const AVAILABLE_INTEGRATIONS = [
      { id: 'telegram', name: 'Telegram', category: 'communication' },
      { id: 'discord', name: 'Discord', category: 'communication' },
      { id: 'slack', name: 'Slack', category: 'communication' },
      { id: 'whatsapp-business', name: 'WhatsApp Business', category: 'communication' },
      { id: 'twilio-sms', name: 'Twilio SMS', category: 'communication' },
      { id: 'imap-email', name: 'IMAP Email', category: 'communication' },
      { id: 'email-smtp', name: 'Email SMTP', category: 'communication' },
      { id: 'gmail-oauth2', name: 'Gmail OAuth2', category: 'communication' },
      { id: 'outlook-oauth2', name: 'Outlook OAuth2', category: 'communication' },
      { id: 'microsoft-365', name: 'Microsoft 365 OAuth', category: 'communication' },
    ];

    try {
      console.log('🔍 [GET-INTEGRATIONS] Starting fetch for tenant:', tenantId);
      console.log('🔍 [GET-INTEGRATIONS] Available integrations count:', AVAILABLE_INTEGRATIONS.length);
      
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      console.log('🔍 [GET-INTEGRATIONS] Schema:', schemaName);

      // Buscar configurações salvas
      const result = await tenantDb.execute(sql`
        SELECT integration_id, config, enabled, created_at, updated_at
        FROM ${sql.identifier(schemaName)}.tenant_integrations
      `);

      console.log('✅ [GET-INTEGRATIONS] Query succeeded, rows:', result.rows?.length || 0);

      const savedConfigs = new Map(
        (result.rows || []).map((row: any) => [row.integration_id, row])
      );

      // Combinar todas as integrações disponíveis com as configurações salvas
      const allIntegrations = AVAILABLE_INTEGRATIONS.map((integration: any) => {
        const saved = savedConfigs.get(integration.id);
        
        return {
          id: integration.id,
          name: integration.name,
          category: integration.category,
          config: saved?.config || {},
          enabled: saved?.enabled || false,
          configured: !!saved,
          created_at: saved?.created_at,
          updated_at: saved?.updated_at,
        };
      });

      console.log(`✅ [GET-INTEGRATIONS] Returning ${allIntegrations.length} integrations (${savedConfigs.size} configured)`);
      console.log(`🔍 [GET-INTEGRATIONS] Integration IDs:`, allIntegrations.map((i: any) => i.id).join(', '));
      return allIntegrations;
    } catch (error) {
      console.error('❌ [GET-INTEGRATIONS] Error fetching tenant integrations:', error);
      logError("Error fetching tenant integrations", error, { tenantId });
      // Em caso de erro, retornar pelo menos as integrações disponíveis sem configuração
      const fallback = AVAILABLE_INTEGRATIONS.map((integration: any) => ({
        ...integration,
        config: {},
        enabled: false,
        configured: false,
      }));
      console.log('🔧 [GET-INTEGRATIONS] Returning fallback with', fallback.length, 'integrations');
      return fallback;
    }
  }

  async getTenantIntegrationConfig(
    tenantId: string,
    integrationId: string,
  ): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const result = await tenantDb.execute(sql`
        SELECT config
        FROM ${sql.identifier(schemaName)}.tenant_integrations
        WHERE integration_id = ${integrationId}
      `);

      return result.rows?.[0]?.config || undefined;
    } catch (error) {
      logError("Error fetching tenant integration config", error, {
        tenantId,
        integrationId,
      });
      return undefined;
    }
  }

  async saveTenantIntegrationConfig(
    tenantId: string,
    integrationId: string,
    config: any,
  ): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, "_")}`;

      const configJson = JSON.stringify(config);

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.tenant_integrations (tenant_id, integration_id, config, enabled, updated_at)
        VALUES (${validatedTenantId}::uuid, ${integrationId}, ${configJson}::jsonb, true, NOW())
        ON CONFLICT (tenant_id, integration_id) 
        DO UPDATE SET 
          config = ${configJson}::jsonb, 
          enabled = true, 
          updated_at = NOW()
        RETURNING *
      `);

      logInfo("Tenant integration config saved", {
        tenantId: validatedTenantId,
        integrationId,
      });

      return result.rows?.[0] || { updatedAt: new Date().toISOString() };
    } catch (error) {
      logError("Error saving tenant integration config", error, {
        tenantId,
        integrationId,
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
        UPDATE ${sql.identifier(schemaName)}.tenant_integrations
        SET status = ${status}, updated_at = NOW()
        WHERE integration_id = ${integrationId}
      `);

      logInfo("Tenant integration status updated", {
        tenantId: validatedTenantId,
        integrationId,
        status,
      });
    } catch (error) {
      logError("Error updating tenant integration status", error, {
        tenantId,
        integrationId,
        status,
      });
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
        SELECT id, name, description, category, config, status, configured, created_at, updated_at
        FROM ${sql.identifier(schemaName)}.integrations
        WHERE tenant_id = ${validatedTenantId} AND id = ${typeName}
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

  async initializeTenantIntegrations(tenantId: string): Promise<void> {
    console.log(`[initializeTenantIntegrations] Placeholder for ${tenantId}`);
  }

  async deleteTenantIntegrations(tenantId: string): Promise<void> {
    console.log(`[deleteTenantIntegrations] Placeholder for ${tenantId}`);
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
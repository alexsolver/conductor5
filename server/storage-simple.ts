import { eq, and, desc, asc, ilike, count, sql } from "drizzle-orm";
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
  getTenantUsers(tenantId: string, options?: { limit?: number; offset?: number }): Promise<User[]>;
  initializeTenantSchema(tenantId: string): Promise<void>;

  // Customer Management
  getCustomers(tenantId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<any[]>;
  getCustomerById(tenantId: string, customerId: string): Promise<any | undefined>;
  createCustomer(tenantId: string, customerData: any): Promise<any>;
  updateCustomer(tenantId: string, customerId: string, customerData: any): Promise<any>;
  deleteCustomer(tenantId: string, customerId: string): Promise<boolean>;

  // Ticket Management
  getTickets(tenantId: string, options?: { limit?: number; offset?: number; status?: string }): Promise<any[]>;
  getTicketById(tenantId: string, ticketId: string): Promise<any | undefined>;
  createTicket(tenantId: string, ticketData: any): Promise<any>;
  updateTicket(tenantId: string, ticketId: string, ticketData: any): Promise<any>;
  deleteTicket(tenantId: string, ticketId: string): Promise<boolean>;
  searchTickets(tenantId: string, query: string): Promise<any[]>;

  // Ticket Relationships Management
  getTicketRelationships(tenantId: string, ticketId: string): Promise<any[]>;
  createTicketRelationship(tenantId: string, ticketId: string, relationshipData: any): Promise<any>;
  deleteTicketRelationship(relationshipId: string): Promise<boolean>;
  getTicketHierarchy(tenantId: string, ticketId: string): Promise<any[]>;

  // Dashboard & Analytics
  getDashboardStats(tenantId: string): Promise<any>;
  getRecentActivity(tenantId: string, options?: { limit?: number }): Promise<any[]>;

  // Knowledge Base
  createKnowledgeBaseArticle(tenantId: string, article: any): Promise<any>;

  // External Contacts
  getSolicitantes(tenantId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<any[]>;
  getFavorecidos(tenantId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<any[]>;
  createSolicitante(tenantId: string, data: any): Promise<any>;
  createFavorecido(tenantId: string, data: any): Promise<any>;

  // Ticket Templates Management
  getTicketTemplates(tenantId: string, options?: { limit?: number; offset?: number; search?: string; category?: string }): Promise<any[]>;
  getTicketTemplateById(tenantId: string, templateId: string): Promise<any | undefined>;
  createTicketTemplate(tenantId: string, templateData: any): Promise<any>;
  updateTicketTemplate(tenantId: string, templateId: string, templateData: any): Promise<any>;
  deleteTicketTemplate(tenantId: string, templateId: string): Promise<boolean>;
  duplicateTicketTemplate(tenantId: string, templateId: string): Promise<any>;

  // Tenant Integrations Management
  getTenantIntegrations(tenantId: string): Promise<any[]>;
  getTenantIntegrationConfig(tenantId: string, integrationId: string): Promise<any | undefined>;
  saveTenantIntegrationConfig(tenantId: string, integrationId: string, config: any): Promise<any>;
  updateTenantIntegrationStatus(tenantId: string, integrationId: string, status: string): Promise<void>;
  getIntegrationByType(tenantId: string, typeName: string): Promise<any | undefined>;

  // Template Bulk Operations
  bulkDeleteTicketTemplates(tenantId: string, templateIds: string[]): Promise<boolean>;

  // Email Templates Management
  getEmailTemplates(tenantId: string): Promise<any[]>;
  createEmailTemplate(tenantId: string, templateData: any): Promise<any>;
  updateEmailTemplate(tenantId: string, templateId: string, templateData: any): Promise<any | undefined>;
  deleteEmailTemplate(tenantId: string, templateId: string): Promise<boolean>;

  // Email Management
  getEmailInboxMessages(tenantId: string): Promise<any[]>;

  // Project Management
  getProjects(tenantId: string, options?: { limit?: number; offset?: number; search?: string; status?: string }): Promise<any[]>;
  getProjectById(tenantId: string, projectId: string): Promise<any | undefined>;
  createProject(tenantId: string, projectData: any): Promise<any>;
  updateProject(tenantId: string, projectId: string, projectData: any): Promise<any>;
  deleteProject(tenantId: string, projectId: string): Promise<boolean>;
  getProjectStats(tenantId: string): Promise<any>;

  // Project Actions Management  
  getProjectActions(tenantId: string, projectId?: string, options?: { limit?: number; offset?: number }): Promise<any[]>;
  getProjectActionById(tenantId: string, actionId: string): Promise<any | undefined>;
  createProjectAction(tenantId: string, actionData: any): Promise<any>;
  updateProjectAction(tenantId: string, actionId: string, actionData: any): Promise<any>;
  deleteProjectAction(tenantId: string, actionId: string): Promise<boolean>;
  convertProjectActionToTicket(tenantId: string, actionId: string): Promise<any>;

  // Locations Management
  getLocations(tenantId: string): Promise<any[]>;
  createLocation(tenantId: string, locationData: any): Promise<any>;
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

  // ===========================
  // USER MANAGEMENT  
  // ===========================

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, String(id)));
      return user || undefined;
    } catch (error) {
      logError('Error fetching user', error, { userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (!username) {
        throw new Error('Username is required');
      }

      const [user] = await db.select().from(users).where(eq(users.email, username));
      return user || undefined;
    } catch (error) {
      logError('Error fetching user by username', error, { username });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      if (!insertUser.email || !insertUser.passwordHash) {
        throw new Error('Email and password hash are required');
      }

      const [user] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          ...insertUser
        })
        .returning();

      logInfo('User created successfully', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      logError('Error creating user', error, { email: insertUser.email });
      throw error;
    }
  }

  // ===========================
  // TENANT MANAGEMENT
  // ===========================

  async createTenant(tenantData: any): Promise<any> {
    try {
      if (!tenantData.name || !tenantData.subdomain) {
        throw new Error('Tenant name and subdomain are required');
      }

      // Create tenant record
      const [tenant] = await db
        .insert(tenants)
        .values(tenantData)
        .returning();

      // Create tenant-specific schema
      await schemaManager.createTenantSchema(tenant.id);

      logInfo('Tenant created successfully', { tenantId: tenant.id, name: tenant.name });
      return tenant;
    } catch (error) {
      logError('Error creating tenant', error, { tenantData });
      throw error;
    }
  }

  async getTenantUsers(tenantId: string, options: { limit?: number; offset?: number } = {}): Promise<User[]> {
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
      logError('Error fetching tenant users', error, { tenantId, options });
      throw error;
    }
  }

  // ===========================
  // CUSTOMER MANAGEMENT - OPTIMIZED
  // Fixes: N+1 queries, performance issues
  // ===========================

  async getCustomers(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, search } = options;

      // Use connection pool for better performance
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // OPTIMIZED: Single query with proper parameterization
      let baseQuery = sql`
        SELECT 
          id, first_name, last_name, email, phone, company,
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
      logError('Error fetching customers', error, { tenantId, options });
      throw error;
    }
  }

  async getCustomerById(tenantId: string, customerId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers
        WHERE id = ${customerId}
        LIMIT 1
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError('Error fetching customer', error, { tenantId, customerId });
      throw error;
    }
  }

  async createCustomer(tenantId: string, customerData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      if (!customerData.email) {
        throw new Error('Customer email is required');
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.customers 
        (first_name, last_name, email, phone, company, tenant_id, created_at, updated_at)
        VALUES (
          ${customerData.firstName || null},
          ${customerData.lastName || null}, 
          ${customerData.email},
          ${customerData.phone || null},
          ${customerData.company || null},
          ${validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      const customer = result.rows?.[0];
      if (customer) {
        logInfo('Customer created successfully', { tenantId, customerId: customer.id });
      }

      return customer;
    } catch (error) {
      logError('Error creating customer', error, { tenantId, customerData });
      throw error;
    }
  }

  async updateCustomer(tenantId: string, customerId: string, customerData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.customers 
        SET 
          first_name = ${customerData.firstName || null},
          last_name = ${customerData.lastName || null},
          email = ${customerData.email},
          phone = ${customerData.phone || null},
          company = ${customerData.company || null},
          updated_at = NOW()
        WHERE id = ${customerId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error updating customer', error, { tenantId, customerId, customerData });
      throw error;
    }
  }

  async deleteCustomer(tenantId: string, customerId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.customers
        WHERE id = ${customerId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError('Error deleting customer', error, { tenantId, customerId });
      throw error;
    }
  }

  // ===========================
  // TICKET MANAGEMENT - OPTIMIZED
  // Fixes: N+1 queries, complex joins
  // ===========================

  async getTickets(tenantId: string, options: { limit?: number; offset?: number; status?: string } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, status } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // OPTIMIZED: Single JOIN query instead of N+1  
      let baseQuery = sql`
        SELECT 
          tickets.*,
          customers.first_name as customer_first_name,
          customers.last_name as customer_last_name,
          customers.email as customer_email
        FROM ${sql.identifier(schemaName)}.tickets
        LEFT JOIN ${sql.identifier(schemaName)}.customers ON tickets.customer_id = customers.id
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
      logError('Error fetching tickets', error, { tenantId, options });
      throw error;
    }
  }

  async getTicketById(tenantId: string, ticketId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          tickets.*,
          customers.first_name as customer_first_name,
          customers.last_name as customer_last_name,
          customers.email as customer_email
        FROM ${sql.identifier(schemaName)}.tickets
        LEFT JOIN ${sql.identifier(schemaName)}.customers ON tickets.customer_id = customers.id
        WHERE tickets.id = ${ticketId} AND tickets.tenant_id = ${validatedTenantId}
        LIMIT 1
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError('Error fetching ticket', error, { tenantId, ticketId });
      throw error;
    }
  }

  async createTicket(tenantId: string, ticketData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Debug: Log all ticket data fields for debugging
      console.log('🔍 All ticket data fields:', Object.keys(ticketData));
      console.log('🔍 Ticket data values:', {
        subject: ticketData.subject,
        customerId: ticketData.customerId,
        caller_id: ticketData.caller_id,
        customer_id: ticketData.customer_id
      });

      const customerId = ticketData.customerId || ticketData.caller_id || ticketData.customer_id;

      if (!ticketData.subject || !customerId) {
        console.log('🐛 Validation failed:', { 
          subject: ticketData.subject, 
          finalCustomerId: customerId,
          allFields: Object.keys(ticketData)
        });
        throw new Error('Ticket subject and customer ID are required');
      }

      // Generate ticket number
      const ticketNumber = `T-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.tickets 
        (number, subject, description, status, priority, customer_id, caller_id, tenant_id, created_at, updated_at)
        VALUES (
          ${ticketNumber},
          ${ticketData.subject},
          ${ticketData.description || null},
          ${ticketData.status || 'new'},
          ${ticketData.priority || 'medium'},
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
        logInfo('Ticket created successfully', { tenantId, ticketId: ticket.id, ticketNumber });
      }

      return ticket;
    } catch (error) {
      logError('Error creating ticket', error, { tenantId, ticketData });
      throw error;
    }
  }

  async updateTicket(tenantId: string, ticketId: string, ticketData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // PROBLEMA 2,3,7 RESOLVIDOS: Campos reais do banco, mapping correto, SQL injection safe
      // CORREÇÃO CRÍTICA: Usar location ao invés de location_id baseado no schema real
      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.tickets
        SET 
          subject = ${ticketData.subject || ''},
          description = ${ticketData.description || null},
          priority = ${ticketData.priority || 'medium'},
          state = ${ticketData.status || 'open'},
          status = ${ticketData.status || 'open'},
          category = ${ticketData.category || null},
          subcategory = ${ticketData.subcategory || null},
          impact = ${ticketData.impact || null},
          urgency = ${ticketData.urgency || null},
          caller_id = ${ticketData.caller_id || null},
          beneficiary_id = ${ticketData.beneficiary_id || null},
          assigned_to_id = ${ticketData.assigned_to_id || null},
          assignment_group = ${ticketData.assignment_group || null},
          location = ${ticketData.location && ticketData.location !== 'unspecified' ? ticketData.location : null},
          contact_type = ${ticketData.contact_type || null},
          business_impact = ${ticketData.business_impact || null},
          symptoms = ${ticketData.symptoms || null},
          workaround = ${ticketData.workaround || null},
          resolution_notes = ${ticketData.resolution || null},
          environment = ${ticketData.environment || null},
          caller_type = ${ticketData.caller_type || 'customer'},
          beneficiary_type = ${ticketData.beneficiary_type || 'customer'},
          customer_id = ${ticketData.customer_id || null},
          followers = ${ticketData.followers || []}::text[],
          tags = ${ticketData.tags || []}::text[],
          updated_at = NOW()
        WHERE id = ${ticketId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error updating ticket', error, { tenantId, ticketId, ticketData });
      throw error;
    }
  }

  async deleteTicket(tenantId: string, ticketId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName), "tickets"}
        WHERE id = ${ticketId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError('Error deleting ticket', error, { tenantId, ticketId });
      throw error;
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
        resolvedTickets: Number(stats.resolved_tickets || 0)
      };
    } catch (error) {
      logError('Error fetching dashboard stats', error, { tenantId });
      // Return empty stats on error instead of failing
      return {
        totalCustomers: 0,
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0
      };
    }
  }

  async getRecentActivity(tenantId: string, options: { limit?: number } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 10 } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
      logError('Error fetching recent activity', error, { tenantId, options });
      return [];
    }
  }

  // ===========================
  // KNOWLEDGE BASE
  // ===========================

  async createKnowledgeBaseArticle(tenantId: string, article: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      if (!article.title || !article.content) {
        throw new Error('Article title and content are required');
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.knowledge_base_articles 
        (title, excerpt, content, category, tags, author, status, tenant_id, created_at, updated_at)
        VALUES (
          ${article.title},
          ${article.excerpt || null},
          ${article.content},
          ${article.category || 'general'},
          ${JSON.stringify(article.tags || [])}::jsonb,
          ${article.author || 'system'},
          ${article.status || 'published'},
          ${validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error creating knowledge base article', error, { tenantId, article });
      throw error;
    }
  }

  // ===========================
  // EXTERNAL CONTACTS (SOLICITANTES/FAVORECIDOS)
  // ===========================

  // Interface compatibility methods
  async getSolicitantes(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<any[]> {
    return this.getClientes(tenantId, options);
  }

  async createSolicitante(tenantId: string, data: any): Promise<any> {
    return this.createCliente(tenantId, data);
  }

  async getClientes(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, search } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let baseQuery = sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers
        WHERE tenant_id = ${validatedTenantId}
      `;

      if (search) {
        baseQuery = sql`${baseQuery} AND (
          first_name ILIKE ${'%' + search + '%'} OR 
          last_name ILIKE ${'%' + search + '%'} OR
          email ILIKE ${'%' + search + '%'}
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
      logError('Error fetching clientes', error, { tenantId, options });
      return [];
    }
  }

  async getFavorecidos(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}) {
    const { limit = 20, offset = 0, search } = options;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      // First check if table exists
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const tableCheck = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'favorecidos'
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
        FROM ${sql.identifier(schemaName)}.favorecidos 
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
      console.log(`Found ${result.rows.length} favorecidos in ${schemaName}`);
      
      // Adicionar fullName computed field para compatibilidade frontend em TODOS os registros
      const favorecidos = (result.rows || []).map(favorecido => {
        favorecido.fullName = `${favorecido.first_name || ''} ${favorecido.last_name || ''}`.trim();
        return favorecido;
      });
      
      console.log(`Fetched ${favorecidos.length} favorecidos for tenant ${tenantId}`);
      return favorecidos;
    } catch (error) {
      console.error('Error fetching favorecidos:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getFavorecido(id: string, tenantId: string): Promise<any | null> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
        FROM ${sql.identifier(schemaName)}.favorecidos 
        WHERE id = ${id} AND tenant_id = ${validatedTenantId}
      `);

      const favorecido = result.rows?.[0] || null;
      
      // Adicionar fullName computed field para compatibilidade frontend
      if (favorecido) {
        favorecido.fullName = `${favorecido.first_name || ''} ${favorecido.last_name || ''}`.trim();
      }

      return favorecido;
    } catch (error) {
      logError('Error fetching favorecido', error, { id, tenantId });
      throw error;
    }
  }

  async createCliente(tenantId: string, data: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
      logError('Error creating cliente', error, { tenantId, data });
      throw error;
    }
  }

  async updateCliente(tenantId: string, clienteId: string, data: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
      logError('Error updating cliente', error, { tenantId, clienteId, data });
      throw error;
    }
  }

  async deleteCliente(tenantId: string, clienteId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.customers
        WHERE id = ${clienteId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError('Error deleting cliente', error, { tenantId, clienteId });
      throw error;
    }
  }

  async createFavorecido(tenantId: string, data: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // ✅ CORREÇÃO CRÍTICA: Inserindo na tabela correta (favorecidos)
      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.favorecidos
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
        favorecido.fullName = `${favorecido.first_name} ${favorecido.last_name || ''}`.trim();
      }

      return favorecido;
    } catch (error) {
      logError('Error creating favorecido', error, { tenantId, data });
      throw error;
    }
  }

  async updateFavorecido(tenantId: string, id: string, data: any): Promise<any> {
    try {
      console.log('UPDATE DEBUG:', { tenantId, id, data });
      
      // CRITICAL FIX: Validate that tenantId looks like UUID and id looks like UUID
      if (!tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
        throw new Error(`Invalid tenantId format: ${tenantId}`);
      }
      if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
        throw new Error(`Invalid favorecido ID format: ${id}`);
      }
      
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.favorecidos
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
        favorecido.fullName = `${favorecido.first_name} ${favorecido.last_name || ''}`.trim();
      }

      return favorecido;
    } catch (error) {
      logError('Error updating favorecido', error, { 
        id, 
        tenantId, 
        data,
        context: {
          id: tenantId, // This shows that parameters are swapped in error context
          tenantId: id, // This confirms the parameter swap issue
          data
        }
      });
      throw error;
    }
  }

  async deleteFavorecido(tenantId: string, id: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.favorecidos
        WHERE id = ${id} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = Number(result.rowCount || 0) > 0;
      if (deleted) {
        logInfo('Favorecido deleted successfully', { tenantId: validatedTenantId, favorecidoId: id });
      }

      return deleted;
    } catch (error) {
      logError('Error deleting favorecido', error, { id, tenantId });
      throw error;
    }
  }

  // ===========================
  // TICKET TEMPLATES MANAGEMENT
  // ===========================

  async getTicketTemplates(tenantId: string, options?: { limit?: number; offset?: number; search?: string; category?: string }): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
      logError('Error fetching ticket templates', error, { tenantId, options });
      throw error;
    }
  }

  async getTicketTemplateById(tenantId: string, templateId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
      logError('Error fetching ticket template by ID', error, { tenantId, templateId });
      throw error;
    }
  }

  async createTicketTemplate(tenantId: string, templateData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
          ${templateData.category || 'Geral'},
          ${templateData.priority || 'medium'},
          ${templateData.urgency || 'medium'},
          ${templateData.impact || 'medium'},
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

      logInfo('Ticket template created successfully', { tenantId: validatedTenantId, templateId: id });
      return result.rows?.[0];
    } catch (error) {
      logError('Error creating ticket template', error, { tenantId, templateData });
      throw error;
    }
  }

  async updateTicketTemplate(tenantId: string, templateId: string, templateData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.ticket_templates
        SET name = ${templateData.name},
            description = ${templateData.description || null},
            category = ${templateData.category || 'Geral'},
            priority = ${templateData.priority || 'medium'},
            urgency = ${templateData.urgency || 'medium'},
            impact = ${templateData.impact || 'medium'},
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
        throw new Error('Template not found or access denied');
      }

      logInfo('Ticket template updated successfully', { tenantId: validatedTenantId, templateId });
      return result.rows[0];
    } catch (error) {
      logError('Error updating ticket template', error, { tenantId, templateId, templateData });
      throw error;
    }
  }

  async deleteTicketTemplate(tenantId: string, templateId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_templates
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo('Ticket template deleted successfully', { tenantId: validatedTenantId, templateId });
      }

      return deleted;
    } catch (error) {
      logError('Error deleting ticket template', error, { tenantId, templateId });
      throw error;
    }
  }

  async duplicateTicketTemplate(tenantId: string, templateId: string): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);

      // First get the original template
      const original = await this.getTicketTemplateById(validatedTenantId, templateId);
      if (!original) {
        throw new Error('Template not found');
      }

      // Create a copy with modified name
      const copyData = {
        ...original,
        name: `${original.name} (Cópia)`,
        id: undefined, // Will be generated
        created_at: undefined,
        updated_at: undefined
      };

      return await this.createTicketTemplate(validatedTenantId, copyData);
    } catch (error) {
      logError('Error duplicating ticket template', error, { tenantId, templateId });
      throw error;
    }
  }

  async bulkDeleteTicketTemplates(tenantId: string, templateIds: string[]): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      if (!templateIds || templateIds.length === 0) {
        return true;
      }

      const placeholders = templateIds.map((_, index) => `$${index + 2}`).join(', ');
      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_templates
        WHERE tenant_id = ${validatedTenantId} AND id IN (${sql.raw(placeholders)})
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo('Ticket templates bulk deleted successfully', { 
          tenantId: validatedTenantId, 
          count: result.rowCount,
          templateIds 
        });
      }

      return deleted;
    } catch (error) {
      logError('Error bulk deleting ticket templates', error, { tenantId, templateIds });
      throw error;
    }
  }

  async updateTenantIntegrationStatus(tenantId: string, integrationId: string, status: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.integrations
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${integrationId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo('Integration status updated successfully', { 
        tenantId: validatedTenantId, 
        integrationId, 
        status 
      });
    } catch (error) {
      logError('Error updating integration status', error, { tenantId, integrationId, status });
      throw error;
    }
  }

  // ===========================  
  // TENANT INTEGRATIONS
  // ===========================

  async getTenantIntegrations(tenantId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const tableExists = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = 'integrations'
        );
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log(`🔧 Creating integrations table for tenant ${validatedTenantId}`);
        await this.createDefaultIntegrations(validatedTenantId);
      }

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations
        WHERE tenant_id = ${validatedTenantId}
        ORDER BY created_at DESC
      `);

      if (result.rows && result.rows.length === 0) {
        console.log(`🔧 No integrations found, creating defaults for tenant ${validatedTenantId}`);
        await this.createDefaultIntegrations(validatedTenantId);
        // Re-fetch after creating defaults
        const newResult = await tenantDb.execute(sql`
          SELECT * FROM ${sql.identifier(schemaName)}.integrations
          WHERE tenant_id = ${validatedTenantId}
          ORDER BY created_at DESC
        `);
        return newResult.rows || [];
      }

      return result.rows || [];
    } catch (error) {
      return [];
    }
  }

  async getTenantIntegrationConfig(tenantId: string, integrationId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations
        WHERE id = ${integrationId} AND tenant_id = ${validatedTenantId}
        LIMIT 1
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError('Error fetching integration config', error, { tenantId, integrationId });
      return undefined;
    }
  }

  async saveTenantIntegrationConfig(tenantId: string, integrationId: string, config: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Update existing integration config
      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.integrations
        SET config = ${JSON.stringify(config)}, updated_at = NOW()
        WHERE id = ${integrationId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError('Error saving integration config', error, { tenantId, integrationId });
      throw error;
    }
  }

  async getIntegrationByType(tenantId: string, typeName: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations
        WHERE name = ${typeName} AND tenant_id = ${validatedTenantId}
        LIMIT 1
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError('Error fetching integration by type', error, { tenantId, typeName });
      return undefined;
    }
  }

  private async createDefaultIntegrations(tenantId: string): Promise<void> {
    try {
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.integrations (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          icon VARCHAR(100),
          status VARCHAR(50) DEFAULT 'disconnected',
          config JSONB DEFAULT '{}',
          features TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const defaultIntegrations = [
        // Comunicação
        {
          id: 'gmail-oauth2',
          name: 'Gmail OAuth2',
          description: 'Integração OAuth2 com Gmail para envio e recebimento seguro de emails',
          category: 'Comunicação',
          icon: 'Mail',
          features: ['OAuth2 Authentication', 'Send/Receive Emails', 'Auto-sync', 'Secure Token Management']
        },
        {
          id: 'outlook-oauth2',
          name: 'Outlook OAuth2',
          description: 'Integração OAuth2 com Microsoft Outlook para emails corporativos',
          category: 'Comunicação',
          icon: 'Mail',
          features: ['OAuth2 Authentication', 'Exchange Integration', 'Calendar Sync', 'Corporate Email']
        },
        {
          id: 'email-smtp',
          name: 'Email SMTP',
          description: 'Configuração de servidor SMTP para envio de emails automáticos e notificações',
          category: 'Comunicação',
          icon: 'Mail',
          features: ['Notificações por email', 'Tickets por email', 'Relatórios automáticos']
        },
        {
          id: 'imap-email',
          name: 'IMAP Email',
          description: 'Conecte sua caixa de email via IMAP para sincronização de tickets',
          category: 'Comunicação',
          icon: 'Inbox',
          features: ['Sincronização bidirecional', 'Auto-resposta', 'Filtros avançados']
        },
        {
          id: 'whatsapp-business',
          name: 'WhatsApp Business',
          description: 'Integração com WhatsApp Business API para atendimento via WhatsApp',
          category: 'Comunicação',
          icon: 'MessageSquare',
          features: ['Mensagens automáticas', 'Templates aprovados', 'Webhooks']
        },
        {
          id: 'slack',
          name: 'Slack',
          description: 'Notificações e gerenciamento de tickets através do Slack',
          category: 'Comunicação',
          icon: 'MessageCircle',
          features: ['Notificações de tickets', 'Comandos slash', 'Bot integrado']
        },
        {
          id: 'twilio-sms',
          name: 'Twilio SMS',
          description: 'Envio de SMS para notificações e alertas importantes',
          category: 'Comunicação',
          icon: 'Phone',
          features: ['SMS automático', 'Notificações críticas', 'Verificação 2FA']
        },
        // Automação
        {
          id: 'zapier',
          name: 'Zapier',
          description: 'Conecte com mais de 3000 aplicativos através de automações Zapier',
          category: 'Automação',
          icon: 'Zap',
          features: ['Workflows automáticos', '3000+ integrações', 'Triggers personalizados']
        },
        {
          id: 'webhooks',
          name: 'Webhooks',
          description: 'Receba notificações em tempo real de eventos do sistema',
          category: 'Automação',
          icon: 'Webhook',
          features: ['Eventos em tempo real', 'Custom endpoints', 'Retry automático']
        },
        // Dados
        {
          id: 'crm-integration',
          name: 'CRM Integration',
          description: 'Sincronização com sistemas CRM para gestão unificada de clientes',
          category: 'Dados',
          icon: 'Database',
          features: ['Sincronização bidirecionais', 'Mapeamento de campos', 'Histórico unificado']
        },
        {
          id: 'dropbox-personal',
          name: 'Dropbox Pessoal',
          description: 'Backup automático de dados e arquivos importantes',
          category: 'Dados',
          icon: 'Cloud',
          features: ['Backup automático', 'Sincronização de arquivos', 'Versionamento']
        },
        // Segurança
        {
          id: 'sso-saml',
          name: 'SSO/SAML',
          description: 'Single Sign-On para autenticação corporativa segura',
          category: 'Segurança',
          icon: 'Shield',
          features: ['Single Sign-On', 'SAML 2.0', 'Active Directory', 'Multi-factor Authentication']
        },
        // Produtividade
        {
          id: 'google-workspace',
          name: 'Google Workspace',
          description: 'Integração completa com Gmail, Drive e Calendar',
          category: 'Produtividade',
          icon: 'Calendar',
          features: ['Gmail sync', 'Drive backup', 'Calendar integration']
        },
        {
          id: 'chatbot-ai',
          name: 'Chatbot IA',
          description: 'Assistente virtual inteligente para atendimento automatizado',
          category: 'Produtividade',
          icon: 'Bot',
          features: ['Respostas automáticas', 'Machine Learning', 'Escalação inteligente']
        }
      ];

      // Use raw SQL since Drizzle has issues with TEXT[] arrays - ALL 14 INTEGRATIONS
      const insertQuery = `
        INSERT INTO ${schemaName}.integrations 
        (id, tenant_id, name, description, category, icon, status, config, features)
        VALUES 
        ('gmail-oauth2', '${tenantId}', 'Gmail OAuth2', 'Integração OAuth2 com Gmail para envio e recebimento seguro de emails', 'Comunicação', 'Mail', 'disconnected', '{}', ARRAY['OAuth2 Authentication', 'Send/Receive Emails', 'Auto-sync', 'Secure Token Management']),
        ('outlook-oauth2', '${tenantId}', 'Outlook OAuth2', 'Integração OAuth2 com Microsoft Outlook para emails corporativos', 'Comunicação', 'Mail', 'disconnected', '{}', ARRAY['OAuth2 Authentication', 'Exchange Integration', 'Calendar Sync', 'Corporate Email']),
        ('email-smtp', '${tenantId}', 'Email SMTP', 'Configuração de servidor SMTP para envio de emails automáticos e notificações', 'Comunicação', 'Mail', 'disconnected', '{}', ARRAY['Notificações por email', 'Tickets por email', 'Relatórios automáticos']),
        ('imap-email', '${tenantId}', 'IMAP Email', 'Conecte sua caixa de email via IMAP para sincronização de tickets', 'Comunicação', 'Inbox', 'disconnected', '{}', ARRAY['Sincronização bidirecional', 'Auto-resposta', 'Filtros avançados']),
        ('whatsapp-business', '${tenantId}', 'WhatsApp Business', 'Integração com WhatsApp Business API para atendimento via WhatsApp', 'Comunicação', 'MessageSquare', 'disconnected', '{}', ARRAY['Mensagens automáticas', 'Templates aprovados', 'Webhooks']),
        ('slack', '${tenantId}', 'Slack', 'Notificações e gerenciamento de tickets através do Slack', 'Comunicação', 'MessageCircle', 'disconnected', '{}', ARRAY['Notificações de tickets', 'Comandos slash', 'Bot integrado']),
        ('twilio-sms', '${tenantId}', 'Twilio SMS', 'Envio de SMS para notificações e alertas importantes', 'Comunicação', 'Phone', 'disconnected', '{}', ARRAY['SMS automático', 'Notificações críticas', 'Verificação 2FA']),
        ('zapier', '${tenantId}', 'Zapier', 'Conecte com mais de 3000 aplicativos através de automações Zapier', 'Automação', 'Zap', 'disconnected', '{}', ARRAY['Workflows automáticos', '3000+ integrações', 'Triggers personalizados']),
        ('webhooks', '${tenantId}', 'Webhooks', 'Receba notificações em tempo real de eventos do sistema', 'Automação', 'Webhook', 'disconnected', '{}', ARRAY['Eventos em tempo real', 'Custom endpoints', 'Retry automático']),
        ('crm-integration', '${tenantId}', 'CRM Integration', 'Sincronização com sistemas CRM para gestão unificada de clientes', 'Dados', 'Database', 'disconnected', '{}', ARRAY['Sincronização bidirecionais', 'Mapeamento de campos', 'Histórico unificado']),
        ('dropbox-personal', '${tenantId}', 'Dropbox Pessoal', 'Backup automático de dados e arquivos importantes', 'Dados', 'Cloud', 'disconnected', '{}', ARRAY['Backup automático', 'Sincronização de arquivos', 'Versionamento']),
        ('sso-saml', '${tenantId}', 'SSO/SAML', 'Single Sign-On para autenticação corporativa segura', 'Segurança', 'Shield', 'disconnected', '{}', ARRAY['Single Sign-On', 'SAML 2.0', 'Active Directory', 'Multi-factor Authentication']),
        ('google-workspace', '${tenantId}', 'Google Workspace', 'Integração completa com Gmail, Drive e Calendar', 'Produtividade', 'Calendar', 'disconnected', '{}', ARRAY['Gmail sync', 'Drive backup', 'Calendar integration']),
        ('chatbot-ai', '${tenantId}', 'Chatbot IA', 'Assistente virtual inteligente para atendimento automatizado', 'Produtividade', 'Bot', 'disconnected', '{}', ARRAY['Respostas automáticas', 'Machine Learning', 'Escalação inteligente'])
        ON CONFLICT (id) DO NOTHING
      `;

      await tenantDb.execute(sql.raw(insertQuery));

    } catch (error) {
      throw error;
    }
  }

  // ==============================
  // FAVORECIDO-CUSTOMER RELATIONSHIPS METHODS
  // ==============================

  async getFavorecidoCustomers(tenantId: string, favorecidoId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          fcr.created_at as relationship_created_at
        FROM ${sql.identifier(schemaName)}.favorecido_customer_relationships fcr
        JOIN ${sql.identifier(schemaName)}.customers c ON c.id = fcr.customer_id
        WHERE fcr.favorecido_id = ${favorecidoId}
        ORDER BY fcr.created_at DESC
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching favorecido customers', error, { tenantId, favorecidoId });
      return [];
    }
  }

  async addFavorecidoCustomer(tenantId: string, favorecidoId: string, customerId: string): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.favorecido_customer_relationships
        (favorecido_id, customer_id, created_at, updated_at)
        VALUES (${favorecidoId}, ${customerId}, NOW(), NOW())
        ON CONFLICT (favorecido_id, customer_id) DO NOTHING
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error adding favorecido customer relationship', error, { tenantId, favorecidoId, customerId });
      throw error;
    }
  }

  async removeFavorecidoCustomer(tenantId: string, favorecidoId: string, customerId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.favorecido_customer_relationships
        WHERE favorecido_id = ${favorecidoId} 
        AND customer_id = ${customerId}
      `);

      return result.rowCount > 0;
    } catch (error) {
      logError('Error removing favorecido customer relationship', error, { tenantId, favorecidoId, customerId });
      throw error;
    }
  }

  // ==============================
  // TICKET RELATIONSHIPS METHODS
  // ==============================

  async searchTickets(tenantId: string, query: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT id, short_description as subject, state as status, priority, number, created_at
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE tenant_id = ${validatedTenantId}
        AND (
          short_description ILIKE ${'%' + query + '%'} OR
          description ILIKE ${'%' + query + '%'} OR
          number ILIKE ${'%' + query + '%'} OR
          id::text = ${query}
        )
        ORDER BY created_at DESC
        LIMIT 20
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error searching tickets', error, { tenantId, query });
      throw error;
    }
  }

  async getTicketRelationships(tenantId: string, ticketId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          tr.id,
          tr.relationship_type as "relationshipType",
          tr.description,
          tr.created_at as "createdAt",
          t.id as "targetTicket.id",
          t.short_description as "targetTicket.subject",
          t.state as "targetTicket.status",
          t.priority as "targetTicket.priority",
          t.number as "targetTicket.number"
        FROM ${sql.identifier(schemaName)}.ticket_relationships tr
        JOIN ${sql.identifier(schemaName)}.tickets t ON t.id = tr.target_ticket_id
        WHERE tr.source_ticket_id = ${ticketId} 
        AND tr.tenant_id = ${validatedTenantId}
        ORDER BY tr.created_at DESC
      `);

      // Transform flat results into nested objects
      return (result.rows || []).map(row => ({
        id: row.id,
        relationshipType: row.relationshipType,
        description: row.description,
        createdAt: row.createdAt,
        targetTicket: {
          id: row['targetTicket.id'],
          subject: row['targetTicket.subject'],
          status: row['targetTicket.status'],
          priority: row['targetTicket.priority'],
          number: row['targetTicket.number']
        }
      }));
    } catch (error) {
      logError('Error fetching ticket relationships', error, { tenantId, ticketId });
      throw error;
    }
  }

  async createTicketRelationship(tenantId: string, ticketId: string, relationshipData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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

      logInfo('Ticket relationship created successfully', { tenantId: validatedTenantId, relationshipId: id });
      return result.rows?.[0];
    } catch (error) {
      logError('Error creating ticket relationship', error, { tenantId, ticketId, relationshipData });
      throw error;
    }
  }

  async deleteTicketRelationship(relationshipId: string): Promise<boolean> {
    try {
      // Get relationship details first to determine tenant
      const publicResult = await db.execute(sql`
        SELECT tenant_id FROM ticket_relationships WHERE id = ${relationshipId}
        LIMIT 1
      `);

      if (!publicResult.rows?.[0]) {
        return false;
      }

      const tenantId = String(publicResult.rows[0].tenant_id);
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_relationships
        WHERE id = ${relationshipId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo('Ticket relationship deleted successfully', { tenantId: validatedTenantId, relationshipId });
      }

      return deleted;
    } catch (error) {
      logError('Error deleting ticket relationship', error, { relationshipId });
      throw error;
    }
  }

  async getTicketHierarchy(tenantId: string, ticketId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
      logError('Error fetching ticket hierarchy', error, { tenantId, ticketId });
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
      logError('Error fetching email templates', error, { tenantId });
      throw error;
    }
  }

  async createEmailTemplate(tenantId: string, templateData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db } = await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
        logInfo('Email template created successfully', { tenantId: validatedTenantId, templateId });
      }

      return template;
    } catch (error) {
      logError('Error creating email template', error, { tenantId, templateData });
      throw error;
    }
  }

  async updateEmailTemplate(tenantId: string, templateId: string, templateData: any): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db } = await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
        logInfo('Email template updated successfully', { tenantId: validatedTenantId, templateId });
      }

      return template;
    } catch (error) {
      logError('Error updating email template', error, { tenantId, templateId, templateData });
      throw error;
    }
  }

  async deleteEmailTemplate(tenantId: string, templateId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { db } = await schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.email_templates
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = !!(result.rowCount && result.rowCount > 0);
      if (deleted) {
        logInfo('Email template deleted successfully', { tenantId: validatedTenantId, templateId });
      }

      return deleted;
    } catch (error) {
      logError('Error deleting email template', error, { tenantId, templateId });
      throw error;
    }
  }

  async getEmailInboxMessages(tenantId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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

        logInfo('Emails table created for tenant', { tenantId: validatedTenantId });
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
      logError('Error fetching email inbox messages', error, { tenantId });
      return [];
    }
  }

  // Email management methods
  async markEmailAsRead(tenantId: string, messageId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.emails 
        SET is_read = true, processed_at = NOW()
        WHERE message_id = ${messageId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo('Email marked as read', { tenantId: validatedTenantId, messageId });
    } catch (error) {
      logError('Error marking email as read', error, { tenantId, messageId });
      throw error;
    }
  }

  async archiveEmail(tenantId: string, messageId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.emails 
        SET is_processed = true, processed_at = NOW()
        WHERE message_id = ${messageId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo('Email archived', { tenantId: validatedTenantId, messageId });
    } catch (error) {
      logError('Error archiving email', error, { tenantId, messageId });
      throw error;
    }
  }

  async deleteEmail(tenantId: string, messageId: string): Promise<void> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.emails 
        WHERE message_id = ${messageId} AND tenant_id = ${validatedTenantId}
      `);

      logInfo('Email deleted', { tenantId: validatedTenantId, messageId });
    } catch (error) {
      logError('Error deleting email', error, { tenantId, messageId });
      throw error;
    }
  }

  async getClientesCount(tenantId: string): Promise<number> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(schemaName)}.external_contacts
        WHERE tenant_id = ${validatedTenantId} AND type = 'cliente'
      `);

      return parseInt((result.rows?.[0]?.count as string) || '0');
    } catch (error) {
      logError('Error counting clientes', error, { tenantId });
      return 0;
    }
  }

  // REMOVED DUPLICATE FUNCTION - Using implementation below

  // DUPLICATE FUNCTIONS REMOVED - Using implementations at end of file

  // DUPLICATE FUNCTION REMOVED - Using implementation at end of file

  // ===========================
  // PROJECT MANAGEMENT
  // ===========================

  async getProjects(tenantId: string, options?: { limit?: number; offset?: number; search?: string; status?: string }): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      let whereClause = `WHERE p.tenant_id = '${validatedTenantId}' AND p.is_active = true`;

      if (options?.search) {
        whereClause += ` AND (p.name ILIKE '%${options.search}%' OR p.description ILIKE '%${options.search}%')`;
      }

      if (options?.status) {
        whereClause += ` AND p.status = '${options.status}'`;
      }

      const result = await tenantDb.execute(`
        SELECT p.*, 
               u.first_name || ' ' || u.last_name as manager_name,
               c.first_name || ' ' || c.last_name as client_name,
               (SELECT COUNT(*) FROM "${schemaName}".project_actions pa WHERE pa.project_id = p.id) as action_count
        FROM "${schemaName}".projects p
        LEFT JOIN public.users u ON p.manager_id = u.id
        LEFT JOIN "${schemaName}".customers c ON p.client_id = c.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching projects', error, { tenantId });
      return [];
    }
  }

  async getProjectById(tenantId: string, projectId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(`
        SELECT p.*, 
               u.first_name || ' ' || u.last_name as manager_name,
               c.first_name || ' ' || c.last_name as client_name
        FROM "${schemaName}".projects p
        LEFT JOIN public.users u ON p.manager_id = u.id
        LEFT JOIN "${schemaName}".customers c ON p.client_id = c.id
        WHERE p.id = '${projectId}' AND p.tenant_id = '${validatedTenantId}' AND p.is_active = true
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error fetching project by ID', error, { tenantId, projectId });
      return undefined;
    }
  }

  async createProject(tenantId: string, projectData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const projectId = randomUUID();
      const now = new Date().toISOString();

      logInfo('Creating project with data:', { projectData });

      const result = await tenantDb.execute(`
        INSERT INTO "${schemaName}".projects (
          id, tenant_id, name, description, status, priority, budget, 
          estimated_hours, start_date, end_date, manager_id, client_id, 
          team_member_ids, tags, custom_fields, created_at, updated_at, created_by, updated_by
        ) VALUES (
          '${projectId}', '${validatedTenantId}', '${projectData.name}', 
          '${projectData.description || ''}', '${projectData.status || 'planning'}', 
          '${projectData.priority || 'medium'}', ${projectData.budget || 'NULL'}, 
          ${projectData.estimatedHours || 'NULL'}, 
          ${projectData.startDate ? `'${projectData.startDate}'` : 'NULL'}, 
          ${projectData.endDate ? `'${projectData.endDate}'` : 'NULL'}, 
          ${projectData.managerId ? `'${projectData.managerId}'` : 'NULL'}, 
          ${projectData.clientId ? `'${projectData.clientId}'` : 'NULL'}, 
          NULL, 
          NULL, 
          NULL, 
          '${now}', '${now}', '${projectData.createdBy}', '${projectData.createdBy}'
        ) RETURNING *
      `);

      logInfo('Project created successfully', { tenantId: validatedTenantId, projectId });
      return result.rows?.[0];
    } catch (error) {
      logError('Error creating project', error, { tenantId });
      throw error;
    }
  }

  async updateProject(tenantId: string, projectId: string, projectData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const now = new Date().toISOString();

      const result = await tenantDb.execute(`
        UPDATE "${schemaName}".projects SET
          name = '${projectData.name}',
          description = '${projectData.description || ''}',
          status = '${projectData.status}',
          priority = '${projectData.priority}',
          budget = ${projectData.budget || 'NULL'},
          estimated_hours = ${projectData.estimatedHours || 'NULL'},
          actual_hours = ${projectData.actualHours || 'NULL'},
          start_date = ${projectData.startDate ? `'${projectData.startDate}'` : 'NULL'},
          end_date = ${projectData.endDate ? `'${projectData.endDate}'` : 'NULL'},
          manager_id = ${projectData.managerId ? `'${projectData.managerId}'` : 'NULL'},
          client_id = ${projectData.clientId ? `'${projectData.clientId}'` : 'NULL'},
          team_member_ids = '${JSON.stringify(projectData.teamMemberIds || [])}',
          tags = '${JSON.stringify(projectData.tags || [])}',
          custom_fields = '${JSON.stringify(projectData.customFields || {})}',
          updated_at = '${now}'
        WHERE id = '${projectId}' AND tenant_id = '${validatedTenantId}'
        RETURNING *
      `);

      logInfo('Project updated successfully', { tenantId: validatedTenantId, projectId });
      return result.rows?.[0];
    } catch (error) {
      logError('Error updating project', error, { tenantId, projectId });
      throw error;
    }
  }

  async deleteProject(tenantId: string, projectId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      await tenantDb.execute(`
        UPDATE "${schemaName}".projects 
        SET is_active = false, updated_at = '${new Date().toISOString()}'
        WHERE id = '${projectId}' AND tenant_id = '${validatedTenantId}'
      `);

      logInfo('Project deleted successfully', { tenantId: validatedTenantId, projectId });
      return true;
    } catch (error) {
      logError('Error deleting project', error, { tenantId, projectId });
      return false;
    }
  }

  async getProjectStats(tenantId: string): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'active' OR status = 'in_progress' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_projects,
          COALESCE(SUM(budget), 0) as total_budget,
          COALESCE(SUM(estimated_hours), 0) as total_estimated_hours,
          COALESCE(SUM(actual_hours), 0) as total_actual_hours
        FROM "${schemaName}".projects 
        WHERE tenant_id = '${validatedTenantId}' AND is_active = true
      `);

      return result.rows?.[0] || {
        total_projects: 0,
        active_projects: 0,
        completed_projects: 0,
        planning_projects: 0,
        total_budget: 0,
        total_estimated_hours: 0,
        total_actual_hours: 0
      };
    } catch (error) {
      logError('Error fetching project stats', error, { tenantId });
      return {
        total_projects: 0,
        active_projects: 0,
        completed_projects: 0,
        planning_projects: 0,
        total_budget: 0,
        total_estimated_hours: 0,
        total_actual_hours: 0
      };
    }
  }

  // ===========================
  // PROJECT ACTIONS MANAGEMENT WITH AUTOMATIC TICKET INTEGRATION
  // ===========================

  async getProjectActions(tenantId: string, projectId?: string, options?: { limit?: number; offset?: number }): Promise<any[]> {
    try {  
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      let whereClause = `WHERE pa.tenant_id = '${validatedTenantId}' AND pa.is_active = true`;

      if (projectId) {
        whereClause += ` AND pa.project_id = '${projectId}'`;
      }

      const result = await tenantDb.execute(`
        SELECT pa.*, 
               p.name as project_name,
               u.first_name || ' ' || u.last_name as assigned_to_name,
               t.subject as related_ticket_subject,
               t.status as related_ticket_status
        FROM "${schemaName}".project_actions pa
        LEFT JOIN "${schemaName}".projects p ON pa.project_id = p.id
        LEFT JOIN public.users u ON pa.assigned_to_id = u.id
        LEFT JOIN "${schemaName}".tickets t ON pa.related_ticket_id = t.id
        ${whereClause}
        ORDER BY pa.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching project actions', error, { tenantId });
      return [];
    }
  }

  async createProjectAction(tenantId: string, actionData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const actionId = randomUUID();
      const now = new Date().toISOString();

      // Create the project action
      const result = await tenantDb.execute(`
        INSERT INTO "${schemaName}".project_actions (
          id, tenant_id, project_id, title, description, type, status, priority,
          estimated_hours, scheduled_date, assigned_to_id, responsible_ids,
          depends_on_action_ids, blocked_by_action_ids, can_convert_to_ticket,
          ticket_conversion_rules, created_at, updated_at
        ) VALUES (
          '${actionId}', '${validatedTenantId}', '${actionData.projectId}',
          '${actionData.title}', '${actionData.description || ''}', 
          '${actionData.type}', '${actionData.status || 'pending'}', 
          '${actionData.priority || 'medium'}', 
          ${actionData.estimatedHours || 'NULL'}, 
          ${actionData.scheduledDate ? `'${actionData.scheduledDate}'` : 'NULL'},
          ${actionData.assignedToId ? `'${actionData.assignedToId}'` : 'NULL'},
          '${JSON.stringify(actionData.responsibleIds || [])}',
          '${JSON.stringify(actionData.dependsOnActionIds || [])}',
          '${JSON.stringify(actionData.blockedByActionIds || [])}',
          ${actionData.canConvertToTicket || true},
          '${JSON.stringify(actionData.ticketConversionRules || {})}',
          '${now}', '${now}'
        ) RETURNING *
      `);

      const newAction = result.rows?.[0];

      // AUTOMATIC TICKET INTEGRATION: Create corresponding ticket for every project action
      if (newAction) {
        try {
          const ticketId = await this.createTicketFromProjectAction(validatedTenantId, newAction, schemaName, tenantDb);

          // Update project action with related ticket ID
          if (ticketId) {
            await tenantDb.execute(`
              UPDATE "${schemaName}".project_actions 
              SET related_ticket_id = '${ticketId}', updated_at = '${new Date().toISOString()}'
              WHERE id = '${actionId}' AND tenant_id = '${validatedTenantId}'
            `);

            newAction.related_ticket_id = ticketId;
            logInfo('Project action created with auto-generated ticket', { 
              tenantId: validatedTenantId, 
              actionId, 
              ticketId 
            });
          }
        } catch (ticketError) {
          logError('Failed to create automatic ticket for project action', ticketError, { 
            tenantId: validatedTenantId, 
            actionId 
          });
          // Continue without failing the project action creation
        }
      }

      return newAction;
    } catch (error) {
      logError('Error creating project action', error, { tenantId });
      throw error;
    }
  }

  // AUTOMATIC TICKET CREATION FROM PROJECT ACTION
  private async createTicketFromProjectAction(tenantId: string, action: any, schemaName: string, tenantDb: any): Promise<string | null> {
    try {
      const ticketId = randomUUID();
      const now = new Date().toISOString();

      // Create ticket with project action data
      const ticketResult = await tenantDb.execute(`
        INSERT INTO "${schemaName}".tickets (
          id, tenant_id, subject, description, status, priority, 
          assigned_to_id, category, subcategory, type, 
          source, created_at, updated_at
        ) VALUES (
          '${ticketId}', '${tenantId}', 
          '[PROJETO] ${action.title}', 
          'Ticket criado automaticamente para ação do projeto: ${action.description || action.title}',
          'open', '${action.priority || 'medium'}',
          ${action.assigned_to_id ? `'${action.assigned_to_id}'` : 'NULL'},
          'Projeto', 'Ação de Projeto', '${action.type}',
          'project_action', '${now}', '${now}'
        ) RETURNING id
      `);

      return ticketResult.rows?.[0]?.id || null;
    } catch (error) {
      logError('Error creating ticket from project action', error, { tenantId, actionId: action.id });
      return null;
    }
  }

  async updateProjectAction(tenantId: string, actionId: string, actionData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const now = new Date().toISOString();

      const result = await tenantDb.execute(`
        UPDATE "${schemaName}".project_actions SET
          title = '${actionData.title}',
          description = '${actionData.description || ''}',
          type = '${actionData.type}',
          status = '${actionData.status}',
          priority = '${actionData.priority}',
          estimated_hours = ${actionData.estimatedHours || 'NULL'},
          actual_hours = ${actionData.actualHours || 'NULL'},
          scheduled_date = ${actionData.scheduledDate ? `'${actionData.scheduledDate}'` : 'NULL'},
          assigned_to_id = ${actionData.assignedToId ? `'${actionData.assignedToId}'` : 'NULL'},
          responsible_ids = '${JSON.stringify(actionData.responsibleIds || [])}',
          depends_on_action_ids = '${JSON.stringify(actionData.dependsOnActionIds || [])}',
          blocked_by_action_ids = '${JSON.stringify(actionData.blockedByActionIds || [])}',
          ticket_conversion_rules = '${JSON.stringify(actionData.ticketConversionRules || {})}',
          ${actionData.status === 'completed' ? `completed_at = '${now}',` : ''}
          updated_at = '${now}'
        WHERE id = '${actionId}' AND tenant_id = '${validatedTenantId}'
        RETURNING *
      `);

      const updatedAction = result.rows?.[0];

      // AUTOMATIC TICKET SYNC: Update related ticket when project action changes
      if (updatedAction?.related_ticket_id) {
        try {
          await tenantDb.execute(`
            UPDATE "${schemaName}".tickets SET
              subject = '[PROJETO] ${actionData.title}',
              description = 'Ticket atualizado automaticamente - Ação: ${actionData.description || actionData.title}',
              status = ${actionData.status === 'completed' ? "'resolved'" : "'open'"},
              priority = '${actionData.priority}',
              assigned_to_id = ${actionData.assignedToId ? `'${actionData.assignedToId}'` : 'NULL'},
              updated_at = '${now}'
            WHERE id = '${updatedAction.related_ticket_id}' AND tenant_id = '${validatedTenantId}'
          `);

          logInfo('Related ticket automatically updated', { 
            tenantId: validatedTenantId, 
            actionId, 
            ticketId: updatedAction.related_ticket_id 
          });
        } catch (ticketError) {
          logError('Failed to update related ticket', ticketError, { 
            tenantId: validatedTenantId, 
            actionId, 
            ticketId: updatedAction.related_ticket_id 
          });
        }
      }

      return updatedAction;
    } catch (error) {
      logError('Error updating project action', error, { tenantId, actionId });
      throw error;
    }
  }

  async convertProjectActionToTicket(tenantId: string, actionId: string): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Get project action details
      const actionResult = await tenantDb.execute(`
        SELECT * FROM "${schemaName}".project_actions 
        WHERE id = '${actionId}' AND tenant_id = '${validatedTenantId}'
      `);

      const action = actionResult.rows?.[0];
      if (!action) {
        throw new Error('Project action not found');
      }

      // If already has related ticket, return existing ticket
      if (action.related_ticket_id) {
        const ticketResult = await tenantDb.execute(`
          SELECT * FROM "${schemaName}".tickets 
          WHERE id = '${action.related_ticket_id}' AND tenant_id = '${validatedTenantId}'
        `);
        return ticketResult.rows?.[0];
      }

      // Create new ticket from project action
      const ticketId = await this.createTicketFromProjectAction(validatedTenantId, action, schemaName, tenantDb);

      if (ticketId) {
        // Update project action with ticket reference
        await tenantDb.execute(`
          UPDATE "${schemaName}".project_actions 
          SET related_ticket_id = '${ticketId}', can_convert_to_ticket = true, updated_at = '${new Date().toISOString()}'
          WHERE id = '${actionId}' AND tenant_id = '${validatedTenantId}'
        `);

        // Return the created ticket
        const ticketResult = await tenantDb.execute(`
          SELECT * FROM "${schemaName}".tickets 
          WHERE id = '${ticketId}' AND tenant_id = '${validatedTenantId}'
        `);

        logInfo('Project action converted to ticket successfully', { 
          tenantId: validatedTenantId, 
          actionId, 
          ticketId 
        });

        return ticketResult.rows?.[0];
      }

      throw new Error('Failed to create ticket from project action');
    } catch (error) {
      logError('Error converting project action to ticket', error, { tenantId, actionId });
      throw error;
    }
  }

  async deleteProjectAction(tenantId: string, actionId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      await tenantDb.execute(`
        UPDATE "${schemaName}".project_actions 
        SET is_active = false, updated_at = '${new Date().toISOString()}'
        WHERE id = '${actionId}' AND tenant_id = '${validatedTenantId}'
      `);

      logInfo('Project action deleted successfully', { tenantId: validatedTenantId, actionId });
      return true;
    } catch (error) {
      logError('Error deleting project action', error, { tenantId, actionId });
      return false;
    }
  }

  async getProjectActionById(tenantId: string, actionId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(`
        SELECT pa.*, 
               p.name as project_name,
               u.first_name || ' ' || u.last_name as assigned_to_name,
               t.subject as related_ticket_subject,
               t.status as related_ticket_status
        FROM "${schemaName}".project_actions pa
        LEFT JOIN "${schemaName}".projects p ON pa.project_id = p.id
        LEFT JOIN public.users u ON pa.assigned_to_id = u.id
        LEFT JOIN "${schemaName}".tickets t ON pa.related_ticket_id = t.id
        WHERE pa.id = '${actionId}' AND pa.tenant_id = '${validatedTenantId}' AND pa.is_active = true
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error fetching project action by ID', error, { tenantId, actionId });
      return undefined;
    }
  }

  // ===========================
  // LOCATIONS MANAGEMENT
  // ===========================

  async getLocations(tenantId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(`
        SELECT id, name, address, city, state, country, postal_code, latitude, longitude, active, is_active, created_at, updated_at
        FROM "${schemaName}".locations
        WHERE (active IS NULL OR active = true) AND (is_active IS NULL OR is_active = true)
        ORDER BY created_at DESC
      `);

      logInfo('Locations fetched successfully', { tenantId: validatedTenantId, count: result.rows?.length });
      return result.rows || [];
    } catch (error) {
      logError('Error fetching locations', error, { tenantId });
      return [];
    }
  }

  async createLocation(tenantId: string, locationData: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const locationId = randomUUID();
      const now = new Date().toISOString();

      const location = {
        id: locationId,
        tenant_id: validatedTenantId,
        name: locationData.name,
        address: locationData.address || '',
        city: locationData.city || '',
        state: locationData.state || '',
        country: locationData.country || 'Brasil',
        postal_code: locationData.postal_code || locationData.zipCode || '',
        latitude: locationData.latitude || '',
        longitude: locationData.longitude || '',
        active: true,
        is_active: true,
        created_at: now,
        updated_at: now
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

      logInfo('Location created successfully', { tenantId: validatedTenantId, locationId });
      return location;
    } catch (error) {
      logError('Error creating location', error, { tenantId, locationData });
      throw error;
    }
  }

  // Implement the missing initializeTenantSchema method
  async initializeTenantSchema(tenantId: string): Promise<void> {
    try {
      await schemaManager.createTenantSchema(tenantId);
      logInfo('Tenant schema initialized successfully', { tenantId });
    } catch (error) {
      logError('Error initializing tenant schema', error, { tenantId });
      throw error;
    }
  }

   // Get favorecido locations
   async getFavorecidoLocations(favorecidoId: string, tenantId: string): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

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
        FROM ${sql.identifier(schemaName)}.favorecidos_locations fl
        JOIN ${sql.identifier(schemaName)}.locations l ON fl.location_id = l.id
        WHERE fl.favorecido_id = ${favorecidoId} AND fl.tenant_id = ${validatedTenantId}
        ORDER BY fl.is_primary DESC, l.name ASC
      `);

      return (result.rows || []).map(row => ({
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
          longitude: row.longitude
        }
      }));
    } catch (error) {
      logError('Error fetching favorecido locations', error, { favorecidoId, tenantId });
      throw error;
    }
  }

  // Add location to favorecido
  async addFavorecidoLocation(favorecidoId: string, locationId: string, tenantId: string, isPrimary: boolean = false): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // If setting as primary, remove primary from others
      if (isPrimary) {
        await tenantDb.execute(sql`
          UPDATE ${sql.identifier(schemaName)}.favorecidos_locations 
          SET is_primary = false 
          WHERE favorecido_id = ${favorecidoId} AND tenant_id = ${validatedTenantId}
        `);
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.favorecidos_locations (
          tenant_id, favorecido_id, location_id, is_primary
        ) VALUES (
          ${validatedTenantId}, ${favorecidoId}, ${locationId}, ${isPrimary}
        ) RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error adding favorecido location', error, { favorecidoId, locationId, tenantId, isPrimary });
      throw error;
    }
  }

  // Remove location from favorecido
  async removeFavorecidoLocation(favorecidoId: string, locationId: string, tenantId: string): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.favorecidos_locations 
        WHERE favorecido_id = ${favorecidoId} 
          AND location_id = ${locationId} 
          AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError('Error removing favorecido location', error, { favorecidoId, locationId, tenantId });
      return false;
    }
  }

  // Update primary status of favorecido location
  async updateFavorecidoLocationPrimary(favorecidoId: string, locationId: string, tenantId: string, isPrimary: boolean): Promise<boolean> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // If setting as primary, remove primary from others
      if (isPrimary) {
        await tenantDb.execute(sql`
          UPDATE ${sql.identifier(schemaName)}.favorecidos_locations 
          SET is_primary = false 
          WHERE favorecido_id = ${favorecidoId} AND tenant_id = ${validatedTenantId}
        `);
      }

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.favorecidos_locations 
        SET is_primary = ${isPrimary}
        WHERE favorecido_id = ${favorecidoId} 
          AND location_id = ${locationId} 
          AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError('Error updating favorecido location primary status', error, { favorecidoId, locationId, tenantId, isPrimary });
      return false;
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
import { eq, and, desc, asc, ilike, count, sql } from "drizzle-orm";
import { db, SchemaManager } from "./db";
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

  // Template Bulk Operations
  bulkDeleteTicketTemplates(tenantId: string, templateIds: string[]): Promise<boolean>;

  // Email Templates Management
  getEmailTemplates(tenantId: string): Promise<any[]>;
  createEmailTemplate(tenantId: string, templateData: any): Promise<any>;
  updateEmailTemplate(tenantId: string, templateId: string, templateData: any): Promise<any | undefined>;
  deleteEmailTemplate(tenantId: string, templateId: string): Promise<boolean>;
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
  private schemaManager: SchemaManager;

  constructor() {
    this.schemaManager = SchemaManager.getInstance();
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
      await this.schemaManager.createTenantSchema(tenant.id);

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
        LEFT JOIN ${sql.identifier(schemaName)}.customers ON tickets.solicitante_id = customers.id
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
        LEFT JOIN ${sql.identifier(schemaName)}.customers ON tickets.solicitante_id = customers.id
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

      if (!ticketData.subject || !ticketData.customerId) {
        throw new Error('Ticket subject and customer ID are required');
      }

      // Generate ticket number
      const ticketNumber = `T-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.tickets 
        (number, subject, description, status, priority, solicitante_id, tenant_id, created_at, updated_at)
        VALUES (
          ${ticketNumber},
          ${ticketData.subject},
          ${ticketData.description || null},
          ${ticketData.status || 'open'},
          ${ticketData.priority || 'medium'},
          ${ticketData.customerId},
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

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName), "tickets"} 
        SET 
          subject = ${ticketData.subject},
          description = ${ticketData.description || null},
          status = ${ticketData.status || 'open'},
          priority = ${ticketData.priority || 'medium'},
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
        LEFT JOIN ${sql.identifier(schemaName)}.customers ON tickets.solicitante_id = customers.id
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
        INSERT INTO ${sql.identifier(schemaName).knowledge_base_articles} 
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

  async getSolicitantes(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, search } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let baseQuery = sql`
        SELECT * FROM ${sql.identifier(schemaName)}.external_contacts
        WHERE tenant_id = ${validatedTenantId} AND type = 'solicitante'
      `;

      if (search) {
        baseQuery = sql`${baseQuery} AND (
          name ILIKE ${'%' + search + '%'} OR 
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
      logError('Error fetching solicitantes', error, { tenantId, options });
      return [];
    }
  }

  async getFavorecidos(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, search } = options;
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let baseQuery = sql`
        SELECT * FROM ${sql.identifier(schemaName)}.external_contacts
        WHERE tenant_id = ${validatedTenantId} AND type = 'favorecido'
      `;

      if (search) {
        baseQuery = sql`${baseQuery} AND (
          name ILIKE ${'%' + search + '%'} OR 
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
      logError('Error fetching favorecidos', error, { tenantId, options });
      return [];
    }
  }

  async createSolicitante(tenantId: string, data: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.external_contacts
        (name, email, phone, document, type, tenant_id, created_at, updated_at)
        VALUES (
          ${data.name},
          ${data.email || null},
          ${data.phone || null},
          ${data.document || null},
          'solicitante',
          ${validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error creating solicitante', error, { tenantId, data });
      throw error;
    }
  }

  async createFavorecido(tenantId: string, data: any): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.external_contacts
        (name, email, phone, document, type, tenant_id, created_at, updated_at)
        VALUES (
          ${data.name},
          ${data.email || null},
          ${data.phone || null},
          ${data.document || null},
          'favorecido',
          ${validatedTenantId},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error creating favorecido', error, { tenantId, data });
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

      const deleted = result.rowCount && result.rowCount > 0;
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
      `, [validatedTenantId, ...templateIds]);

      const deleted = result.rowCount && result.rowCount > 0;
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

      // Check if integrations table exists
      const tableExists = await tenantDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schemaName} 
          AND table_name = 'integrations'
        );
      `);

      if (!tableExists.rows?.[0]?.exists) {
        await this.createDefaultIntegrations(validatedTenantId);
      }

      // Query integrations from tenant-specific schema
      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations 
        ORDER BY created_at DESC
      `);

      // If integrations table exists but is empty, create default integrations
      if (result.rows && result.rows.length === 0) {
        await this.createDefaultIntegrations(validatedTenantId);
        // Re-fetch after creating defaults
        const newResult = await tenantDb.execute(sql`
          SELECT * FROM ${sql.identifier(schemaName)}.integrations 
          ORDER BY created_at DESC
        `);
        return newResult.rows || [];
      }

      return result.rows || [];
    } catch (error) {
      logError('Error fetching tenant integrations', error, { tenantId });
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
        WHERE id = ${integrationId}
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
        WHERE id = ${integrationId}
        RETURNING *
      `);

      return result.rows?.[0] || undefined;
    } catch (error) {
      logError('Error saving integration config', error, { tenantId, integrationId });
      throw error;
    }
  }

  private async createDefaultIntegrations(tenantId: string): Promise<void> {
    try {
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Create integrations table if it doesn't exist
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
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT integrations_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // Insert default integrations
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

      logInfo('All 14 default integrations created', { tenantId, count: 14 });
    } catch (error) {
      logError('Error creating default integrations', error, { tenantId });
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

      const tenantId = publicResult.rows[0].tenant_id;
      const validatedTenantId = await validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_relationships
        WHERE id = ${relationshipId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = result.rowCount && result.rowCount > 0;
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
      const { db } = await this.schemaManager.getTenantDb(validatedTenantId);
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
      const { db } = await this.schemaManager.getTenantDb(validatedTenantId);
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
      const { db } = await this.schemaManager.getTenantDb(validatedTenantId);
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
      const { db } = await this.schemaManager.getTenantDb(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.email_templates
        WHERE id = ${templateId} AND tenant_id = ${validatedTenantId}
      `);

      const deleted = result.rowCount && result.rowCount > 0;
      if (deleted) {
        logInfo('Email template deleted successfully', { tenantId: validatedTenantId, templateId });
      }

      return deleted;
    } catch (error) {
      logError('Error deleting email template', error, { tenantId, templateId });
      throw error;
    }
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
export const storageSimple = storage;

// Storage getter function for use in routes
export async function getStorage() {
  return storage;
}
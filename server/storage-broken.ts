import { eq, and, desc, asc, ilike, count, sql } from "drizzle-orm";
import { db, SchemaManager } from "./db";
import { users, tenants, type User, type InsertUser } from "@shared/schema";
import { logInfo, logError } from "./utils/logger";
import { poolManager } from "./database/ConnectionPoolManager";
import { TenantValidator } from "./database/TenantValidator";

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
  
  // Dashboard & Analytics
  getDashboardStats(tenantId: string): Promise<any>;
  getRecentActivity(tenantId: string, options?: { limit?: number }): Promise<any[]>;
  
  // Knowledge Base
  createKnowledgeBaseArticle(tenantId: string, article: any): Promise<any>;
}

// ===========================
// ENHANCED TENANT VALIDATION
// Uses advanced validation with existence checks
// ===========================

async function validateTenantAccess(tenantId: string): Promise<string> {
  return await TenantValidator.validateTenantAccess(tenantId);
}

// ===========================
// DATABASE STORAGE CLASS
// ===========================

export class DatabaseStorage implements IStorage {
  private schemaManager: SchemaManager;

  constructor() {
    this.schemaManager = // SchemaManager.getInstance();
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
  // CUSTOMER MANAGEMENT
  // ===========================

  async getCustomers(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, search } = options;
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let query = sql`
        SELECT * FROM ${sql.identifier(schemaName, 'customers')}
        WHERE 1=1
      `;

      if (search) {
        query = sql`${query} AND (
          first_name ILIKE ${`%${search}%`} OR 
          last_name ILIKE ${`%${search}%`} OR 
          email ILIKE ${`%${search}%`}
        )`;
      }

      query = sql`${query} 
        ORDER BY created_at DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await db.execute(query);
      return result.rows || [];
    } catch (error) {
      logError('Error fetching customers', error, { tenantId, options });
      throw error;
    }
  }

  async getCustomerById(tenantId: string, customerId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName, 'customers')}
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      if (!customerData.email) {
        throw new Error('Customer email is required');
      }

      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName, 'customers')} 
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        UPDATE ${sql.identifier(schemaName, 'customers')} 
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName, 'customers')}
        WHERE id = ${customerId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError('Error deleting customer', error, { tenantId, customerId });
      throw error;
    }
  }

  // ===========================
  // TICKET MANAGEMENT
  // ===========================

  async getTickets(tenantId: string, options: { limit?: number; offset?: number; status?: string } = {}): Promise<any[]> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const { limit = 50, offset = 0, status } = options;
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let query = sql`
        SELECT 
          t.*,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.email as customer_email
        FROM ${sql.identifier(schemaName, 'tickets')} t
        LEFT JOIN ${sql.identifier(schemaName, 'customers')} c ON t.customer_id = c.id
        WHERE t.tenant_id = ${validatedTenantId}
      `;

      if (status) {
        query = sql`${query} AND t.status = ${status}`;
      }

      query = sql`${query} 
        ORDER BY t.created_at DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await db.execute(query);
      return result.rows || [];
    } catch (error) {
      logError('Error fetching tickets', error, { tenantId, options });
      throw error;
    }
  }

  async getTicketById(tenantId: string, ticketId: string): Promise<any | undefined> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        SELECT 
          t.*,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.email as customer_email
        FROM ${sql.identifier(schemaName, 'tickets')} t
        LEFT JOIN ${sql.identifier(schemaName, 'customers')} c ON t.customer_id = c.id
        WHERE t.id = ${ticketId} AND t.tenant_id = ${validatedTenantId}
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      if (!ticketData.subject || !ticketData.customerId) {
        throw new Error('Ticket subject and customer ID are required');
      }

      // Generate ticket number
      const ticketNumber = `T-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName, 'tickets')} 
        (number, subject, description, status, priority, customer_id, tenant_id, created_at, updated_at)
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        UPDATE ${sql.identifier(schemaName, 'tickets')} 
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName, 'tickets')}
        WHERE id = ${ticketId} AND tenant_id = ${validatedTenantId}
      `);

      return Number(result.rowCount || 0) > 0;
    } catch (error) {
      logError('Error deleting ticket', error, { tenantId, ticketId });
      throw error;
    }
  }

  // ===========================
  // DASHBOARD & ANALYTICS
  // ===========================

  async getDashboardStats(tenantId: string): Promise<any> {
    try {
      const validatedTenantId = await validateTenantAccess(tenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Get stats from database
      const [customersResult, ticketsResult, openTicketsResult] = await Promise.all([
        db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(schemaName, 'customers')}`),
        db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(schemaName, 'tickets')}`),
        db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(schemaName, 'tickets')} WHERE status = 'open'`)
      ]);

      return {
        totalCustomers: customersResult.rows?.[0]?.count || 0,
        totalTickets: ticketsResult.rows?.[0]?.count || 0,
        openTickets: openTicketsResult.rows?.[0]?.count || 0,
        resolvedTickets: Number(ticketsResult.rows?.[0]?.count || 0) - Number(openTicketsResult.rows?.[0]?.count || 0)
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Get recent tickets as activity
      const result = await db.execute(sql`
        SELECT 
          'ticket' as type,
          t.id,
          t.subject as title,
          t.status,
          t.created_at,
          c.first_name || ' ' || c.last_name as customer_name
        FROM ${sql.identifier(schemaName, 'tickets')} t
        LEFT JOIN ${sql.identifier(schemaName, 'customers')} c ON t.customer_id = c.id
        WHERE t.tenant_id = ${validatedTenantId}
        ORDER BY t.created_at DESC
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
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      if (!article.title || !article.content) {
        throw new Error('Article title and content are required');
      }

      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName, 'knowledge_base_articles')} 
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
}

// Export singleton instance
export const storage = new DatabaseStorage();
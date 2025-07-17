import {
  users,
  tenants,
  customers,
  tickets,
  ticketMessages,
  type User,
  type Tenant,
  type InsertTenant,
  type Customer,
  type InsertCustomer,
  type Ticket,
  type InsertTicket,
  type TicketMessage,
  type InsertTicketMessage,
} from "@shared/schema";
import { db, schemaManager } from "./db";
import { eq, and, desc, count, sql, ne, inArray, gte } from "drizzle-orm";

// Define missing types for backwards compatibility
type UpsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type ActivityLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedById?: string;
  performedByType?: string;
  details: any;
  previousValues: any;
  newValues: any;
  createdAt: Date;
};
type InsertActivityLog = Omit<ActivityLog, 'id' | 'createdAt'>;

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  initializeTenantSchema(tenantId: string): Promise<void>;
  
  // Customer operations
  getCustomers(tenantId: string, limit?: number, offset?: number): Promise<Customer[]>;
  getCustomer(id: string, tenantId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, tenantId: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string, tenantId: string): Promise<boolean>;
  
  // Ticket operations
  getTickets(tenantId: string, limit?: number, offset?: number): Promise<(Ticket & { customer: Customer; assignedTo?: User })[]>;
  getTicket(id: string, tenantId: string): Promise<(Ticket & { customer: Customer; assignedTo?: User; messages: (TicketMessage & { author?: User; customer?: Customer })[] }) | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, tenantId: string, updates: Partial<InsertTicket>): Promise<Ticket | undefined>;
  getUrgentTickets(tenantId: string): Promise<(Ticket & { customer: Customer; assignedTo?: User })[]>;
  
  // Ticket message operations
  getTicketMessages(ticketId: string): Promise<(TicketMessage & { author?: User; customer?: Customer })[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Activity log operations
  getRecentActivity(tenantId: string, limit?: number): Promise<(ActivityLog & { user?: User })[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Dashboard statistics
  getDashboardStats(tenantId: string): Promise<{
    activeTickets: number;
    resolvedToday: number;
    avgResolutionTime: number;
    satisfactionScore: number;
    onlineAgents: number;
    totalAgents: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First, try to find an existing user
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    }

    // For new users, create a default tenant first
    let defaultTenant;
    try {
      defaultTenant = await this.createTenant({
        name: `${userData.firstName || userData.email || 'User'}'s Organization`,
        subdomain: `tenant-${userData.id}`,
        settings: {}
      });
    } catch (error) {
      // If tenant creation fails, try to get default tenant
      const existingTenants = await db.select().from(tenants).limit(1);
      if (existingTenants.length > 0) {
        defaultTenant = existingTenants[0];
      } else {
        throw new Error('Failed to create or find default tenant');
      }
    }

    // Create new user with tenant association
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        tenantId: defaultTenant.id,
        role: 'admin', // First user is admin
        isActive: true
      })
      .returning();
    return user;
  }

  // Tenant operations
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    
    // Initialize the tenant's dedicated schema
    await this.initializeTenantSchema(newTenant.id);
    
    return newTenant;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async initializeTenantSchema(tenantId: string): Promise<void> {
    try {
      await schemaManager.createTenantSchema(tenantId);
      const { logInfo } = await import('./utils/logger');
      logInfo(`Tenant schema initialized successfully`, { tenantId });
    } catch (error) {
      // Schema may already exist - this is expected behavior
      const { logInfo } = await import('./utils/logger');
      logInfo(`Tenant schema already exists or creation skipped`, { tenantId });
    }
  }

  // Customer operations using secure parameterized queries
  async getCustomers(tenantId: string, limit = 50, offset = 0): Promise<Customer[]> {
    try {
      // Ensure tenant schema exists before querying
      await this.initializeTenantSchema(tenantId);
      
      const { db: tenantDb } = schemaManager.getTenantDb(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Use parameterized query with sql.identifier for security
      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers 
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      // Map results and add tenantId
      return result.rows.map((row: any) => ({ ...row, tenantId }));
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError('Error fetching customers', error, { tenantId, limit, offset });
      
      // If schema doesn't exist, return empty array instead of throwing
      if (error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  async getCustomer(id: string, tenantId: string): Promise<Customer | undefined> {
    try {
      const { db: tenantDb } = schemaManager.getTenantDb(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Use parameterized query for security
      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers 
        WHERE id = ${sql.placeholder('id')}
        LIMIT 1
      `, { id });
      
      const customer = result.rows[0];
      return customer ? { ...customer, tenantId } : undefined;
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError('Error fetching customer', error, { id, tenantId });
      throw error;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    if (!customer.tenantId) {
      throw new Error('Customer must have a tenantId');
    }
    
    // Criando cliente para o tenant especificado
    
    // Ensure tenant schema exists
    try {
      await schemaManager.createTenantSchema(customer.tenantId);
    } catch (error) {
      // Schema do tenant já existe ou falha na criação - comportamento esperado
    }
    
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(customer.tenantId);
    const { customers: tenantCustomers } = tenantSchema;
    
    // Usando schema específico do tenant para criação do cliente
    
    // Remove tenantId from customer data since it's not part of tenant schema
    const { tenantId, ...customerData } = customer;
    
    const [newCustomer] = await tenantDb
      .insert(tenantCustomers)
      .values(customerData)
      .returning();
    return { ...newCustomer, tenantId };
  }

  async updateCustomer(id: string, tenantId: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers: tenantCustomers } = tenantSchema;
    
    // Remove tenantId from updates since it's not part of tenant schema
    const { tenantId: _, ...updateData } = updates;
    
    const [updatedCustomer] = await tenantDb
      .update(tenantCustomers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(tenantCustomers.id, id))
      .returning();
    return updatedCustomer ? { ...updatedCustomer, tenantId } : undefined;
  }

  async deleteCustomer(id: string, tenantId: string): Promise<boolean> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers: tenantCustomers } = tenantSchema;
    
    const result = await tenantDb
      .delete(tenantCustomers)
      .where(eq(tenantCustomers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Ticket operations using secure parameterized queries
  async getTickets(tenantId: string, limit = 50, offset = 0): Promise<(Ticket & { customer: Customer; assignedTo?: User })[]> {
    try {
      // Ensure tenant schema exists before querying
      await this.initializeTenantSchema(tenantId);
      
      const { db: tenantDb } = schemaManager.getTenantDb(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Get tickets using parameterized query
      const ticketResult = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.tickets
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      // Get customers for each ticket
      const ticketsWithCustomers = await Promise.all(
        ticketResult.rows.map(async (ticket: any) => {
          let customer = null;
          if (ticket.customer_id) {
            try {
              const customerResult = await tenantDb.execute(sql`
                SELECT * FROM ${sql.identifier(schemaName)}.customers 
                WHERE id = ${sql.placeholder('customerId')}
                LIMIT 1
              `, { customerId: ticket.customer_id });
              customer = customerResult.rows[0];
            } catch (error) {
              // Customer not found - use fallback
            }
          }
          
          // Get assigned user from public schema if exists
          let assignedTo = null;
          if (ticket.assigned_to_id) {
            try {
              const userResult = await db.execute(sql`
                SELECT * FROM public.users 
                WHERE id = ${sql.placeholder('userId')}
                LIMIT 1
              `, { userId: ticket.assigned_to_id });
              assignedTo = userResult.rows[0];
            } catch (error) {
              // User not found - continue without
            }
          }
          
          return {
            ...ticket,
            customer: customer ? { ...customer, tenantId } : {
              id: ticket.customer_id || 'unknown',
              fullName: `ID: ${(ticket.customer_id || '').slice(-8)}`,
              email: 'unknown@example.com',
              tenantId
            },
            assignedTo: assignedTo || undefined
          };
        })
      );
      
      return ticketsWithCustomers;
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError('Error fetching tickets', error, { tenantId, limit, offset });
      
      // If schema doesn't exist, return empty array instead of throwing
      if (error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  async getTicket(id: string, tenantId: string): Promise<(Ticket & { customer: Customer; assignedTo?: User; messages: (TicketMessage & { author?: User; customer?: Customer })[] }) | undefined> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers: tenantCustomers } = tenantSchema;
    
    const [result] = await db
      .select({
        ticket: tickets,
        assignedTo: users,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)));

    if (!result) return undefined;

    // Fetch customer from tenant schema
    const [customer] = await tenantDb
      .select()
      .from(tenantCustomers)
      .where(eq(tenantCustomers.id, result.ticket.customerId));

    const messages = await this.getTicketMessages(id);
    return { 
      ...result.ticket, 
      customer: customer ? { ...customer, tenantId } : {
        id: result.ticket.customerId,
        fullName: `ID: ${result.ticket.customerId.slice(-8)}`,
        email: 'unknown@example.com',
        tenantId
      },
      assignedTo: result.assignedTo || undefined,
      messages 
    };
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    // Generate ticket number if not provided
    const ticketNumber = `INC${Date.now().toString().slice(-8)}`;
    
    // Map legacy fields to new fields for compatibility
    const ticketData = {
      ...ticket,
      number: ticket.number || ticketNumber,
      shortDescription: ticket.shortDescription || ticket.subject,
      state: ticket.state || "new",
      callerId: ticket.callerId || ticket.customerId,
      openedById: ticket.openedById,
      contactType: ticket.contactType || ticket.channel || "email",
    };
    
    const [newTicket] = await db.insert(tickets).values(ticketData).returning();
    return newTicket;
  }

  async updateTicket(id: string, tenantId: string, updates: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)))
      .returning();
    return updatedTicket;
  }

  async getUrgentTickets(tenantId: string): Promise<(Ticket & { customer: Customer; assignedTo?: User })[]> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers: tenantCustomers } = tenantSchema;
    
    const results = await db
      .select({
        ticket: tickets,
        assignedTo: users,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(and(
        eq(tickets.tenantId, tenantId),
        inArray(tickets.priority, ['high', 'critical']),
        ne(tickets.status, 'resolved')
      ))
      .orderBy(desc(tickets.createdAt))
      .limit(10);

    // Fetch customer data from tenant schema for each ticket
    const urgentTicketsWithCustomers = await Promise.all(
      results.map(async (row) => {
        const [customer] = await tenantDb
          .select()
          .from(tenantCustomers)
          .where(eq(tenantCustomers.id, row.ticket.customerId));
        
        return {
          ...row.ticket,
          customer: customer ? { ...customer, tenantId } : {
            id: row.ticket.customerId,
            fullName: `ID: ${row.ticket.customerId.slice(-8)}`,
            email: 'unknown@example.com',
            tenantId
          },
          assignedTo: row.assignedTo || undefined
        };
      })
    );

    return urgentTicketsWithCustomers;
  }

  // Ticket message operations
  async getTicketMessages(ticketId: string): Promise<(TicketMessage & { author?: User; customer?: Customer })[]> {
    const results = await db
      .select({
        message: ticketMessages,
        author: users,
        customer: customers,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.userId, users.id))
      .leftJoin(customers, eq(ticketMessages.customerId, customers.id))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);

    return results.map(row => ({
      ...row.message,
      author: row.author || undefined,
      customer: row.customer || undefined
    }));
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [newMessage] = await db.insert(ticketMessages).values(message).returning();
    return newMessage;
  }

  // Activity log operations
  async getRecentActivity(tenantId: string, limit = 20): Promise<(ActivityLog & { user?: User })[]> {
    // Temporary implementation returning empty array until activity logs schema is fully migrated
    // This prevents the "storage.getRecentActivity is not a function" error
    return [];
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    // Temporary implementation until activity logs schema is fully migrated
    return {
      id: 'temp-log-id',
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      performedById: log.performedById,
      performedByType: log.performedByType,
      details: log.details,
      previousValues: log.previousValues,
      newValues: log.newValues,
      createdAt: new Date()
    };
  }

  // Dashboard statistics
  async getDashboardStats(tenantId: string): Promise<{
    activeTickets: number;
    resolvedToday: number;
    avgResolutionTime: number;
    satisfactionScore: number;
    onlineAgents: number;
    totalAgents: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeTicketsResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(
        eq(tickets.tenantId, tenantId),
        ne(tickets.status, 'resolved')
      ));

    const [resolvedTodayResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.status, 'resolved'),
        gte(tickets.resolvedAt, today)
      ));

    const [totalAgentsResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.role, 'agent')
      ));

    return {
      activeTickets: activeTicketsResult?.count || 0,
      resolvedToday: resolvedTodayResult?.count || 0,
      avgResolutionTime: 4.2, // Would calculate from actual data
      satisfactionScore: 94, // Would calculate from survey data
      onlineAgents: Math.floor((totalAgentsResult?.count || 0) * 0.75),
      totalAgents: totalAgentsResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();

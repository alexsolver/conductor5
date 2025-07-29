
// SIMPLE STORAGE - UNIFIED INTERFACE
// Provides a clean, simplified storage layer with proper error handling
// Implements the complete storage interface required by the application

import { db } from "./db";
import { 
  users, tenants, customers, tickets, ticketMessages, 
  type User, type Tenant, type Customer, type Ticket, type TicketMessage,
  type InsertUser, type InsertTenant, type InsertCustomer, type InsertTicket, type InsertTicketMessage
} from "@shared/schema-master";
import { eq, and, sql, desc, like } from "drizzle-orm";

// ========================================
// STORAGE INTERFACE
// ========================================

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Customer operations (tenant-specific)
  getCustomers(tenantId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<{ customers: Customer[]; total: number }>;
  getCustomer(tenantId: string, id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(tenantId: string, id: string, updates: Partial<InsertCustomer>): Promise<Customer>;
  
  // Ticket operations (tenant-specific)
  getTickets(tenantId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<{ tickets: Ticket[]; total: number }>;
  getTicket(tenantId: string, id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(tenantId: string, id: string, updates: Partial<InsertTicket>): Promise<Ticket>;
  
  // Ticket message operations
  getTicketMessages(tenantId: string, ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Dashboard stats
  getDashboardStats(tenantId: string): Promise<{
    totalCustomers: number;
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
  }>;
}

// ========================================
// SIMPLE DATABASE STORAGE
// ========================================

class SimpleDatabaseStorage implements IStorage {
  
  // ========================================
  // USER OPERATIONS
  // ========================================
  
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    try {
      const result = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // ========================================
  // TENANT OPERATIONS
  // ========================================
  
  async getTenant(id: string): Promise<Tenant | undefined> {
    try {
      const result = await db.select().from(tenants).where(eq(tenants.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting tenant:', error);
      throw error;
    }
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    try {
      const result = await db.insert(tenants).values(tenant).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  // ========================================
  // CUSTOMER OPERATIONS
  // ========================================
  
  async getCustomers(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<{ customers: Customer[]; total: number }> {
    try {
      const { limit = 50, offset = 0, search } = options;
      
      let query = db.select().from(customers).where(eq(customers.tenantId, tenantId));
      
      if (search) {
        query = query.where(
          and(
            eq(customers.tenantId, tenantId),
            like(customers.email, `%${search}%`)
          )
        );
      }
      
      const result = await query
        .limit(limit)
        .offset(offset)
        .orderBy(desc(customers.createdAt));
      
      // Get total count
      const countQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.tenantId, tenantId));
      
      const total = Number(countQuery[0]?.count || 0);
      
      return {
        customers: result,
        total
      };
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  async getCustomer(tenantId: string, id: string): Promise<Customer | undefined> {
    try {
      const result = await db
        .select()
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
      return result[0];
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const result = await db.insert(customers).values(customer).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(tenantId: string, id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    try {
      const result = await db
        .update(customers)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // ========================================
  // TICKET OPERATIONS
  // ========================================
  
  async getTickets(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<{ tickets: Ticket[]; total: number }> {
    try {
      const { limit = 50, offset = 0, search } = options;
      
      let query = db.select().from(tickets).where(eq(tickets.tenantId, tenantId));
      
      if (search) {
        query = query.where(
          and(
            eq(tickets.tenantId, tenantId),
            like(tickets.subject, `%${search}%`)
          )
        );
      }
      
      const result = await query
        .limit(limit)
        .offset(offset)
        .orderBy(desc(tickets.createdAt));
      
      // Get total count
      const countQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));
      
      const total = Number(countQuery[0]?.count || 0);
      
      return {
        tickets: result,
        total
      };
    } catch (error) {
      console.error('Error getting tickets:', error);
      throw error;
    }
  }

  async getTicket(tenantId: string, id: string): Promise<Ticket | undefined> {
    try {
      const result = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.id, id)));
      return result[0];
    } catch (error) {
      console.error('Error getting ticket:', error);
      throw error;
    }
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    try {
      const result = await db.insert(tickets).values(ticket).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  async updateTicket(tenantId: string, id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    try {
      const result = await db
        .update(tickets)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.id, id)))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  // ========================================
  // TICKET MESSAGE OPERATIONS
  // ========================================
  
  async getTicketMessages(tenantId: string, ticketId: string): Promise<TicketMessage[]> {
    try {
      const result = await db
        .select()
        .from(ticketMessages)
        .where(and(eq(ticketMessages.tenantId, tenantId), eq(ticketMessages.ticketId, ticketId)))
        .orderBy(ticketMessages.createdAt);
      return result;
    } catch (error) {
      console.error('Error getting ticket messages:', error);
      throw error;
    }
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    try {
      const result = await db.insert(ticketMessages).values(message).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating ticket message:', error);
      throw error;
    }
  }

  // ========================================
  // DASHBOARD OPERATIONS
  // ========================================
  
  async getDashboardStats(tenantId: string): Promise<{
    totalCustomers: number;
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
  }> {
    try {
      // Get customer count
      const customerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.tenantId, tenantId));

      // Get ticket counts
      const ticketCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));

      const openTicketCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.status, 'open')
        ));

      const resolvedTicketCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.status, 'resolved')
        ));

      return {
        totalCustomers: Number(customerCount[0]?.count || 0),
        totalTickets: Number(ticketCount[0]?.count || 0),
        openTickets: Number(openTicketCount[0]?.count || 0),
        resolvedTickets: Number(resolvedTicketCount[0]?.count || 0)
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

// ========================================
// EXPORTS
// ========================================

// Export singleton instance
export const storageSimple = new SimpleDatabaseStorage();

// Export for compatibility
export const storage = storageSimple;

// Export the class for dependency injection
export { SimpleDatabaseStorage };

// Export the interface
export type { IStorage };

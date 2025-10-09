// MASTER STORAGE - SINGLE SOURCE OF TRUTH
// Consolidates all storage implementations into one unified approach
// Replaces: storage.ts, storage-simple.ts, storage-old.ts and fragments

import { db } from "./db";
import { 
  users, tenants, customers, tickets, ticketMessages,
  type User, type Tenant, type Customer, type Ticket, type TicketMessage,
  type InsertUser, type InsertTenant, type InsertCustomer, type InsertTicket, type InsertTicketMessage
} from "@shared/schema";

// AI Agent types are now in tenant schemas via OmniBridge module
// These interfaces are kept for compatibility but implementations should use tenant-specific repositories
interface AiAgent {
  id: string;
  tenantId: string;
  name: string;
  configPrompt?: string;
  allowedFormIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface InsertAiAgent {
  id?: string;
  tenantId: string;
  name: string;
  configPrompt?: string;
  allowedFormIds?: string[];
}

interface AiConversation {
  id: string;
  tenantId: string;
  agentId: string;
  userId?: string;
  status?: string;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InsertAiConversation {
  id?: string;
  tenantId: string;
  agentId: string;
  userId?: string;
  status?: string;
}

interface AiConversationMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  timestamp: Date;
}

interface InsertAiConversationMessage {
  id?: string;
  conversationId: string;
  role: string;
  content: string;
}

interface AiConversationLog {
  id: string;
  conversationId: string;
  level: string;
  message: string;
  timestamp: Date;
}

interface InsertAiConversationLog {
  id?: string;
  conversationId: string;
  level: string;
  message: string;
}

import { eq, and, sql, desc } from "drizzle-orm";

// ========================================
// UNIFIED STORAGE INTERFACE
// ========================================

export interface IUnifiedStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Customer operations (tenant-specific)
  getCustomers(tenantId: string, limit?: number): Promise<Customer[]>;
  getCustomer(tenantId: string, id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(tenantId: string, id: string, updates: Partial<InsertCustomer>): Promise<Customer>;
  
  // Ticket operations (tenant-specific)
  getTickets(tenantId: string, limit?: number): Promise<Ticket[]>;
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
  
  // ========================================
  // AI AGENT OPERATIONS
  // ========================================
  
  // Agent CRUD
  getAiAgents(tenantId: string): Promise<AiAgent[]>;
  getAiAgent(tenantId: string, id: string): Promise<AiAgent | undefined>;
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(tenantId: string, id: string, updates: Partial<InsertAiAgent>): Promise<AiAgent>;
  deleteAiAgent(tenantId: string, id: string): Promise<void>;
  
  // Conversation management
  getAiConversations(tenantId: string, filters?: {
    agentId?: string;
    userId?: string;
    status?: string;
    limit?: number;
  }): Promise<AiConversation[]>;
  getAiConversation(conversationId: string): Promise<AiConversation | undefined>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  updateAiConversation(conversationId: string, updates: Partial<InsertAiConversation>): Promise<AiConversation>;
  
  // Conversation messages
  getAiConversationMessages(conversationId: string): Promise<AiConversationMessage[]>;
  createAiConversationMessage(message: InsertAiConversationMessage): Promise<AiConversationMessage>;
  
  // Conversation logs
  getAiConversationLogs(conversationId: string, level?: string): Promise<AiConversationLog[]>;
  createAiConversationLog(log: InsertAiConversationLog): Promise<AiConversationLog>;
}

// ========================================
// UNIFIED DATABASE STORAGE IMPLEMENTATION
// ========================================

class UnifiedDatabaseStorage implements IUnifiedStorage {
  
  // ========================================
  // USER OPERATIONS (Public Schema)
  // ========================================
  
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // ========================================
  // TENANT OPERATIONS (Public Schema)
  // ========================================
  
  async getTenant(id: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id));
    return result[0];
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return result[0];
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const result = await db.insert(tenants).values(tenant).returning();
    return result[0];
  }

  // ========================================
  // CUSTOMER OPERATIONS (Tenant-Specific)
  // ========================================
  
  async getCustomers(tenantId: string, limit: number = 50): Promise<Customer[]> {
    await this.setTenantSchema(tenantId);
    
    const result = await db.select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .limit(limit);
    
    return result;
  }

  async getCustomer(tenantId: string, id: string): Promise<Customer | undefined> {
    await this.setTenantSchema(tenantId);
    
    const result = await db.select()
      .from(customers)
      .where(and(
        eq(customers.tenantId, tenantId),
        eq(customers.id, id)
      ));
    
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    await this.setTenantSchema(customer.tenantId);
    
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(tenantId: string, id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    await this.setTenantSchema(tenantId);
    
    const result = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(customers.tenantId, tenantId),
        eq(customers.id, id)
      ))
      .returning();
    
    return result[0];
  }

  // ========================================
  // TICKET OPERATIONS (Tenant-Specific)
  // ========================================
  
  async getTickets(tenantId: string, limit: number = 50): Promise<Ticket[]> {
    await this.setTenantSchema(tenantId);
    
    const result = await db.select()
      .from(tickets)
      .where(eq(tickets.tenantId, tenantId))
      .limit(limit)
      .orderBy(sql`created_at DESC`);
    
    return result;
  }

  async getTicket(tenantId: string, id: string): Promise<Ticket | undefined> {
    await this.setTenantSchema(tenantId);
    
    const result = await db.select()
      .from(tickets)
      .where(and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.id, id)
      ));
    
    return result[0];
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    await this.setTenantSchema(ticket.tenantId);
    
    const result = await db.insert(tickets).values(ticket).returning();
    return result[0];
  }

  async updateTicket(tenantId: string, id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    await this.setTenantSchema(tenantId);
    
    const result = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.id, id)
      ))
      .returning();
    
    return result[0];
  }

  // ========================================
  // TICKET MESSAGE OPERATIONS
  // ========================================
  
  async getTicketMessages(tenantId: string, ticketId: string): Promise<TicketMessage[]> {
    await this.setTenantSchema(tenantId);
    
    const result = await db.select()
      .from(ticketMessages)
      .where(and(
        eq(ticketMessages.tenantId, tenantId),
        eq(ticketMessages.ticketId, ticketId)
      ))
      .orderBy(sql`created_at ASC`);
    
    return result;
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    await this.setTenantSchema(message.tenantId);
    
    const result = await db.insert(ticketMessages).values(message).returning();
    return result[0];
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
    await this.setTenantSchema(tenantId);
    
    // Execute all queries in parallel for better performance
    const [customersCount, ticketsCount, openTicketsCount, resolvedTicketsCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.tenantId, tenantId)),
      
      db.select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId)),
      
      db.select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.status, 'open')
        )),
      
      db.select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.status, 'resolved')
        ))
    ]);

    return {
      totalCustomers: Number(customersCount[0]?.count || 0),
      totalTickets: Number(ticketsCount[0]?.count || 0),
      openTickets: Number(openTicketsCount[0]?.count || 0),
      resolvedTickets: Number(resolvedTicketsCount[0]?.count || 0),
    };
  }

  // ========================================
  // OMNIBRIDGE EMAIL OPERATIONS
  // ========================================
  
  async getEmailInboxMessages(tenantId: string): Promise<any[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Get inbox messages from the actual emails table where processed emails are stored
      const result = await db.execute(sql`
        SELECT 
          id,
          message_id,
          subject,
          from_email as sender,
          to_email as recipient,
          body_text as body,
          priority,
          CASE WHEN is_read THEN 'read' ELSE 'unread' END as status,
          is_processed as processed,
          email_date,
          received_at as created_at
        FROM ${sql.identifier(schemaName)}.emails
        WHERE tenant_id = ${tenantId}
        ORDER BY received_at DESC
        LIMIT 50
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      
      // Fallback to email_inbox table if emails table doesn't exist
      try {
        const fallbackResult = await db.execute(sql`
          SELECT * FROM ${sql.identifier(schemaName)}.email_inbox
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `);
        return fallbackResult.rows || [];
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  async getIntegrationByType(tenantId: string, typeName: string): Promise<any | undefined> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Get integration by name from tenant-specific integrations table
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations
        WHERE name = ${typeName} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      
      return result.rows?.[0] || undefined;
    } catch (error) {
      console.error('Error fetching integration by type:', error);
      return undefined;
    }
  }

  async getTenantIntegrations(tenantId: string): Promise<any[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Get all integrations from tenant-specific schema
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.integrations
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error('Error fetching tenant integrations:', error);
      return [];
    }
  }

  async updateTenantIntegrationStatus(tenantId: string, integrationId: string, status: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.integrations
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${integrationId} AND tenant_id = ${tenantId}
      `);
    } catch (error) {
      console.error('Error updating integration status:', error);
      throw error;
    }
  }

  // ========================================
  // TENANT SCHEMA MANAGEMENT
  // ========================================
  
  private async setTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    try {
      await db.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    } catch (error) {
      console.error(`Failed to set search path for tenant ${tenantId}:`, error);
      throw new Error(`Unable to access tenant data for ${tenantId}`);
    }
  }

  // ========================================
  // AI AGENT OPERATIONS IMPLEMENTATION
  // NOTE: These methods are deprecated. Use OmniBridge module repositories instead.
  // AI Agent tables are now in tenant schemas, not shared schema.
  // ========================================
  
  async getAiAgents(tenantId: string): Promise<AiAgent[]> {
    console.warn('⚠️ [DEPRECATED] storage-master.getAiAgents() - Use OmniBridge AiAgentRepository instead');
    return [];
  }

  async getAiAgent(tenantId: string, id: string): Promise<AiAgent | undefined> {
    console.warn('⚠️ [DEPRECATED] storage-master.getAiAgent() - Use OmniBridge AiAgentRepository instead');
    return undefined;
  }

  async createAiAgent(agent: InsertAiAgent): Promise<AiAgent> {
    console.warn('⚠️ [DEPRECATED] storage-master.createAiAgent() - Use OmniBridge AiAgentRepository instead');
    throw new Error('Use OmniBridge AiAgentRepository instead');
  }

  async updateAiAgent(tenantId: string, id: string, updates: Partial<InsertAiAgent>): Promise<AiAgent> {
    console.warn('⚠️ [DEPRECATED] storage-master.updateAiAgent() - Use OmniBridge AiAgentRepository instead');
    throw new Error('Use OmniBridge AiAgentRepository instead');
  }

  async deleteAiAgent(tenantId: string, id: string): Promise<void> {
    console.warn('⚠️ [DEPRECATED] storage-master.deleteAiAgent() - Use OmniBridge AiAgentRepository instead');
    throw new Error('Use OmniBridge AiAgentRepository instead');
  }

  async getAiConversations(tenantId: string, filters?: {
    agentId?: string;
    userId?: string;
    status?: string;
    limit?: number;
  }): Promise<AiConversation[]> {
    console.warn('⚠️ [DEPRECATED] storage-master.getAiConversations() - Use OmniBridge repositories instead');
    return [];
  }

  async getAiConversation(conversationId: string): Promise<AiConversation | undefined> {
    console.warn('⚠️ [DEPRECATED] storage-master.getAiConversation() - Use OmniBridge repositories instead');
    return undefined;
  }

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    console.warn('⚠️ [DEPRECATED] storage-master.createAiConversation() - Use OmniBridge repositories instead');
    throw new Error('Use OmniBridge repositories instead');
  }

  async updateAiConversation(conversationId: string, updates: Partial<InsertAiConversation>): Promise<AiConversation> {
    console.warn('⚠️ [DEPRECATED] storage-master.updateAiConversation() - Use OmniBridge repositories instead');
    throw new Error('Use OmniBridge repositories instead');
  }

  async getAiConversationMessages(conversationId: string): Promise<AiConversationMessage[]> {
    console.warn('⚠️ [DEPRECATED] storage-master.getAiConversationMessages() - Use OmniBridge repositories instead');
    return [];
  }

  async createAiConversationMessage(message: InsertAiConversationMessage): Promise<AiConversationMessage> {
    console.warn('⚠️ [DEPRECATED] storage-master.createAiConversationMessage() - Use OmniBridge repositories instead');
    throw new Error('Use OmniBridge repositories instead');
  }

  async getAiConversationLogs(conversationId: string, level?: string): Promise<AiConversationLog[]> {
    console.warn('⚠️ [DEPRECATED] storage-master.getAiConversationLogs() - Use OmniBridge repositories instead');
    return [];
  }

  async createAiConversationLog(log: InsertAiConversationLog): Promise<AiConversationLog> {
    console.warn('⚠️ [DEPRECATED] storage-master.createAiConversationLog() - Use OmniBridge repositories instead');
    throw new Error('Use OmniBridge repositories instead');
  }

  // ========================================
  // HEALTH CHECK OPERATIONS
  // ========================================
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Test basic database connectivity
      await db.execute(sql`SELECT 1`);
      
      // Test tenant schema access
      const tenantCount = await db.select({ count: sql<number>`count(*)` }).from(tenants);
      
      return {
        status: 'healthy',
        details: {
          database: 'connected',
          tenants: Number(tenantCount[0]?.count || 0),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// ========================================
// EXPORTS
// ========================================

// Export singleton instance
export const unifiedStorage = new UnifiedDatabaseStorage();

// Export for dependency injection
export { UnifiedDatabaseStorage };

// Legacy compatibility export
export const storage = unifiedStorage;
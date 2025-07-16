import {
  users,
  tenants,
  customers,
  tickets,
  ticketMessages,
  activityLogs,
  type User,
  type UpsertUser,
  type Tenant,
  type InsertTenant,
  type Customer,
  type InsertCustomer,
  type Ticket,
  type InsertTicket,
  type TicketMessage,
  type InsertTicketMessage,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
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
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
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
    return newTenant;
  }

  // Customer operations
  async getCustomers(tenantId: string, limit = 50, offset = 0): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string, tenantId: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, tenantId: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  // Ticket operations
  async getTickets(tenantId: string, limit = 50, offset = 0): Promise<(Ticket & { customer: Customer; assignedTo?: User })[]> {
    return await db
      .select({
        id: tickets.id,
        tenantId: tickets.tenantId,
        customerId: tickets.customerId,
        assignedToId: tickets.assignedToId,
        subject: tickets.subject,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        channel: tickets.channel,
        tags: tickets.tags,
        metadata: tickets.metadata,
        resolvedAt: tickets.resolvedAt,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        customer: customers,
        assignedTo: users,
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(eq(tickets.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string, tenantId: string): Promise<(Ticket & { customer: Customer; assignedTo?: User; messages: (TicketMessage & { author?: User; customer?: Customer })[] }) | undefined> {
    const [ticket] = await db
      .select({
        id: tickets.id,
        tenantId: tickets.tenantId,
        customerId: tickets.customerId,
        assignedToId: tickets.assignedToId,
        subject: tickets.subject,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        channel: tickets.channel,
        tags: tickets.tags,
        metadata: tickets.metadata,
        resolvedAt: tickets.resolvedAt,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        customer: customers,
        assignedTo: users,
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)));

    if (!ticket) return undefined;

    const messages = await this.getTicketMessages(id);
    return { ...ticket, messages };
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
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
    return await db
      .select({
        id: tickets.id,
        tenantId: tickets.tenantId,
        customerId: tickets.customerId,
        assignedToId: tickets.assignedToId,
        subject: tickets.subject,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        channel: tickets.channel,
        tags: tickets.tags,
        metadata: tickets.metadata,
        resolvedAt: tickets.resolvedAt,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        customer: customers,
        assignedTo: users,
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(and(
        eq(tickets.tenantId, tenantId),
        sql`${tickets.priority} IN ('high', 'critical')`,
        sql`${tickets.status} != 'resolved'`
      ))
      .orderBy(desc(tickets.createdAt))
      .limit(10);
  }

  // Ticket message operations
  async getTicketMessages(ticketId: string): Promise<(TicketMessage & { author?: User; customer?: Customer })[]> {
    return await db
      .select({
        id: ticketMessages.id,
        ticketId: ticketMessages.ticketId,
        authorId: ticketMessages.authorId,
        customerId: ticketMessages.customerId,
        content: ticketMessages.content,
        type: ticketMessages.type,
        isPublic: ticketMessages.isPublic,
        attachments: ticketMessages.attachments,
        createdAt: ticketMessages.createdAt,
        author: users,
        customer: customers,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.authorId, users.id))
      .leftJoin(customers, eq(ticketMessages.customerId, customers.id))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [newMessage] = await db.insert(ticketMessages).values(message).returning();
    return newMessage;
  }

  // Activity log operations
  async getRecentActivity(tenantId: string, limit = 20): Promise<(ActivityLog & { user?: User })[]> {
    return await db
      .select({
        id: activityLogs.id,
        tenantId: activityLogs.tenantId,
        userId: activityLogs.userId,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        action: activityLogs.action,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        user: users,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.tenantId, tenantId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
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
        sql`${tickets.status} != 'resolved'`
      ));

    const [resolvedTodayResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.status, 'resolved'),
        sql`${tickets.resolvedAt} >= ${today}`
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

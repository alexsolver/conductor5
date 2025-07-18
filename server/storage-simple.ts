import { db } from "./db";
import { eq, and, desc, asc, count, or, ilike } from "drizzle-orm";
import { 
  users, 
  customers, 
  tickets, 
  ticketMessages, 
  tenants,
  externalContacts,
  locations,
  type User,
  type Customer,
  type Ticket,
  type TicketMessage,
  type Tenant,
  type ExternalContact,
  type Location,
  type InsertCustomer,
  type InsertTicket,
  type InsertTicketMessage,
  type InsertUser,
  type InsertTenant,
  type InsertExternalContact,
  type InsertLocation
} from "@shared/schema-simple";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;

  // Tenants
  getTenant(id: string): Promise<Tenant | null>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | null>;
  createTenant(data: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | null>;
  deleteTenant(id: string): Promise<boolean>;

  // Customers
  getCustomer(id: string, tenantId: string): Promise<Customer | null>;
  getCustomers(tenantId: string, limit?: number, offset?: number): Promise<Customer[]>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, tenantId: string, data: Partial<InsertCustomer>): Promise<Customer | null>;
  deleteCustomer(id: string, tenantId: string): Promise<boolean>;

  // Tickets
  getTicket(id: string, tenantId: string): Promise<Ticket | null>;
  getTickets(tenantId: string, limit?: number, offset?: number): Promise<Ticket[]>;
  createTicket(data: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, tenantId: string, data: Partial<InsertTicket>): Promise<Ticket | null>;
  deleteTicket(id: string, tenantId: string): Promise<boolean>;

  // Ticket Messages
  getTicketMessage(id: string): Promise<TicketMessage | null>;
  getTicketMessages(ticketId: string, limit?: number, offset?: number): Promise<TicketMessage[]>;
  createTicketMessage(data: InsertTicketMessage): Promise<TicketMessage>;
  updateTicketMessage(id: string, data: Partial<InsertTicketMessage>): Promise<TicketMessage | null>;
  deleteTicketMessage(id: string): Promise<boolean>;

  // External Contacts
  getExternalContact(id: string, tenantId: string): Promise<ExternalContact | null>;
  getExternalContacts(tenantId: string, limit?: number, offset?: number): Promise<ExternalContact[]>;
  createExternalContact(data: InsertExternalContact): Promise<ExternalContact>;
  updateExternalContact(id: string, tenantId: string, data: Partial<InsertExternalContact>): Promise<ExternalContact | null>;
  deleteExternalContact(id: string, tenantId: string): Promise<boolean>;

  // Locations
  getLocation(id: string, tenantId: string): Promise<Location | null>;
  getLocations(tenantId: string, limit?: number, offset?: number): Promise<Location[]>;
  createLocation(data: InsertLocation): Promise<Location>;
  updateLocation(id: string, tenantId: string, data: Partial<InsertLocation>): Promise<Location | null>;
  deleteLocation(id: string, tenantId: string): Promise<boolean>;

  // Removed: favorecidos and solicitantes functionality

  // Dashboard stats
  getRecentActivity(tenantId: string): Promise<any[]>;
  getDashboardStats(tenantId: string): Promise<any>;
}

export class DrizzleStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  async createUser(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | null> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0] || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Tenants
  async getTenant(id: string): Promise<Tenant | null> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id));
    return result[0] || null;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const result = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return result[0] || null;
  }

  async createTenant(data: InsertTenant): Promise<Tenant> {
    const result = await db.insert(tenants).values(data).returning();
    return result[0];
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | null> {
    const result = await db.update(tenants).set(data).where(eq(tenants.id, id)).returning();
    return result[0] || null;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const result = await db.delete(tenants).where(eq(tenants.id, id));
    return result.rowCount > 0;
  }

  // Customers
  async getCustomer(id: string, tenantId: string): Promise<Customer | null> {
    const result = await db.select().from(customers).where(
      and(eq(customers.id, id), eq(customers.tenantId, tenantId))
    );
    return result[0] || null;
  }

  async getCustomers(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<Customer[]> {
    const { limit = 50, offset = 0, search } = options;
    
    let query = db.select().from(customers)
      .where(eq(customers.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(customers.createdAt));
    
    if (search) {
      query = query.where(
        and(
          eq(customers.tenantId, tenantId),
          or(
            ilike(customers.firstName, `%${search}%`),
            ilike(customers.lastName, `%${search}%`),
            ilike(customers.email, `%${search}%`)
          )
        )
      );
    }
    
    return await query;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(data).returning();
    return result[0];
  }

  async updateCustomer(id: string, tenantId: string, data: Partial<InsertCustomer>): Promise<Customer | null> {
    const result = await db.update(customers).set(data).where(
      and(eq(customers.id, id), eq(customers.tenantId, tenantId))
    ).returning();
    return result[0] || null;
  }

  async deleteCustomer(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(customers).where(
      and(eq(customers.id, id), eq(customers.tenantId, tenantId))
    );
    return result.rowCount > 0;
  }

  // Tickets
  async getTicket(id: string, tenantId: string): Promise<Ticket | null> {
    const result = await db.select().from(tickets).where(
      and(eq(tickets.id, id), eq(tickets.tenantId, tenantId))
    );
    return result[0] || null;
  }

  async getTickets(tenantId: string, limit: number = 50, offset: number = 0): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(eq(tickets.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(tickets.createdAt));
  }

  async createTicket(data: InsertTicket): Promise<Ticket> {
    const result = await db.insert(tickets).values(data).returning();
    return result[0];
  }

  async updateTicket(id: string, tenantId: string, data: Partial<InsertTicket>): Promise<Ticket | null> {
    const result = await db.update(tickets).set(data).where(
      and(eq(tickets.id, id), eq(tickets.tenantId, tenantId))
    ).returning();
    return result[0] || null;
  }

  async deleteTicket(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(tickets).where(
      and(eq(tickets.id, id), eq(tickets.tenantId, tenantId))
    );
    return result.rowCount > 0;
  }

  // Ticket Messages
  async getTicketMessage(id: string): Promise<TicketMessage | null> {
    const result = await db.select().from(ticketMessages).where(eq(ticketMessages.id, id));
    return result[0] || null;
  }

  async getTicketMessages(ticketId: string, limit: number = 50, offset: number = 0): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .limit(limit)
      .offset(offset)
      .orderBy(asc(ticketMessages.createdAt));
  }

  async createTicketMessage(data: InsertTicketMessage): Promise<TicketMessage> {
    const result = await db.insert(ticketMessages).values(data).returning();
    return result[0];
  }

  async updateTicketMessage(id: string, data: Partial<InsertTicketMessage>): Promise<TicketMessage | null> {
    const result = await db.update(ticketMessages).set(data).where(eq(ticketMessages.id, id)).returning();
    return result[0] || null;
  }

  async deleteTicketMessage(id: string): Promise<boolean> {
    const result = await db.delete(ticketMessages).where(eq(ticketMessages.id, id));
    return result.rowCount > 0;
  }

  // External Contacts
  async getExternalContact(id: string, tenantId: string): Promise<ExternalContact | null> {
    const result = await db.select().from(externalContacts).where(
      and(eq(externalContacts.id, id), eq(externalContacts.tenantId, tenantId))
    );
    return result[0] || null;
  }

  async getExternalContacts(tenantId: string, limit: number = 50, offset: number = 0): Promise<ExternalContact[]> {
    return await db.select().from(externalContacts)
      .where(eq(externalContacts.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(externalContacts.createdAt));
  }

  async createExternalContact(data: InsertExternalContact): Promise<ExternalContact> {
    const result = await db.insert(externalContacts).values(data).returning();
    return result[0];
  }

  async updateExternalContact(id: string, tenantId: string, data: Partial<InsertExternalContact>): Promise<ExternalContact | null> {
    const result = await db.update(externalContacts).set(data).where(
      and(eq(externalContacts.id, id), eq(externalContacts.tenantId, tenantId))
    ).returning();
    return result[0] || null;
  }

  async deleteExternalContact(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(externalContacts).where(
      and(eq(externalContacts.id, id), eq(externalContacts.tenantId, tenantId))
    );
    return result.rowCount > 0;
  }

  // Locations
  async getLocation(id: string, tenantId: string): Promise<Location | null> {
    const result = await db.select().from(locations).where(
      and(eq(locations.id, id), eq(locations.tenantId, tenantId))
    );
    return result[0] || null;
  }

  async getLocations(tenantId: string, limit: number = 50, offset: number = 0): Promise<Location[]> {
    return await db.select().from(locations)
      .where(eq(locations.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(locations.createdAt));
  }

  async createLocation(data: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values(data).returning();
    return result[0];
  }

  async updateLocation(id: string, tenantId: string, data: Partial<InsertLocation>): Promise<Location | null> {
    const result = await db.update(locations).set(data).where(
      and(eq(locations.id, id), eq(locations.tenantId, tenantId))
    ).returning();
    return result[0] || null;
  }

  async deleteLocation(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(locations).where(
      and(eq(locations.id, id), eq(locations.tenantId, tenantId))
    );
    return result.rowCount > 0;
  }

  // Removed: favorecidos and solicitantes methods - functionality completely eliminated

  // Dashboard stats
  async getRecentActivity(tenantId: string, limit: number = 20): Promise<any[]> {
    try {
      const recentTickets = await db.select().from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .orderBy(desc(tickets.createdAt))
        .limit(5);

      const recentCustomers = await db.select().from(customers)
        .where(eq(customers.tenantId, tenantId))
        .orderBy(desc(customers.createdAt))
        .limit(5);

      // Combine activities
      const activities = [
        ...recentTickets.map(ticket => ({
          type: 'ticket',
          id: ticket.id,
          title: ticket.subject,
          createdAt: ticket.createdAt,
          data: ticket
        })),
        ...recentCustomers.map(customer => ({
          type: 'customer',
          id: customer.id,
          title: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
          createdAt: customer.createdAt,
          data: customer
        }))
      ];

      // Sort by creation date and return
      return activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getDashboardStats(tenantId: string): Promise<any> {
    const [ticketCount] = await db.select({ count: count() }).from(tickets)
      .where(eq(tickets.tenantId, tenantId));

    const [customerCount] = await db.select({ count: count() }).from(customers)
      .where(eq(customers.tenantId, tenantId));

    const [openTickets] = await db.select({ count: count() }).from(tickets)
      .where(and(eq(tickets.tenantId, tenantId), eq(tickets.status, 'open')));

    return {
      totalTickets: ticketCount?.count || 0,
      totalCustomers: customerCount?.count || 0,
      openTickets: openTickets?.count || 0,
      resolvedTickets: (ticketCount?.count || 0) - (openTickets?.count || 0)
    };
  }
}

export const storage = new DrizzleStorage();
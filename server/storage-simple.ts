import { db } from "./db";
import { eq, and, desc, asc, count, or, ilike, sql } from "drizzle-orm";
import { 
  users, 
  customers, 
  favorecidos,
  tickets, 
  ticketMessages, 
  tenants,
  locations,
  type User,
  type Customer,
  type Favorecido,
  type Ticket,
  type TicketMessage,
  type Tenant,
  type Location,
  type InsertCustomer,
  type InsertFavorecido,
  type InsertTicket,
  type InsertTicketMessage,
  type InsertUser,
  type InsertTenant,
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

  // Customers (Solicitantes)
  getCustomer(id: string, tenantId: string): Promise<Customer | null>;
  getCustomers(tenantId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<Customer[]>;
  createCustomer(tenantId: string, data: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, tenantId: string, data: Partial<InsertCustomer>): Promise<Customer | null>;
  deleteCustomer(id: string, tenantId: string): Promise<boolean>;

  // Favorecidos (External Contacts)
  getFavorecido(id: string, tenantId: string): Promise<Favorecido | null>;
  getFavorecidos(tenantId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<Favorecido[]>;
  createFavorecido(tenantId: string, data: InsertFavorecido): Promise<Favorecido>;
  updateFavorecido(id: string, tenantId: string, data: Partial<InsertFavorecido>): Promise<Favorecido | null>;
  deleteFavorecido(id: string, tenantId: string): Promise<boolean>;

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

  // Removed: External Contacts functionality eliminated from system

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

  async createCustomer(tenantId: string, data: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values({ ...data, tenantId }).returning();
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

  // Favorecidos (External Contacts)
  async getFavorecido(id: string, tenantId: string): Promise<Favorecido | null> {
    const result = await db.select().from(favorecidos).where(
      and(eq(favorecidos.id, id), eq(favorecidos.tenantId, tenantId))
    );
    return result[0] || null;
  }

  async getFavorecidos(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<Favorecido[]> {
    const { limit = 50, offset = 0, search } = options;
    
    let query = db.select().from(favorecidos)
      .where(eq(favorecidos.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(favorecidos.createdAt));
    
    if (search) {
      query = query.where(
        and(
          eq(favorecidos.tenantId, tenantId),
          or(
            ilike(favorecidos.firstName, `%${search}%`),
            ilike(favorecidos.lastName, `%${search}%`),
            ilike(favorecidos.email, `%${search}%`)
          )
        )
      );
    }
    
    return await query;
  }

  async createFavorecido(tenantId: string, data: InsertFavorecido): Promise<Favorecido> {
    const result = await db.insert(favorecidos).values({ ...data, tenantId }).returning();
    return result[0];
  }

  async updateFavorecido(id: string, tenantId: string, data: Partial<InsertFavorecido>): Promise<Favorecido | null> {
    const result = await db.update(favorecidos).set(data).where(
      and(eq(favorecidos.id, id), eq(favorecidos.tenantId, tenantId))
    ).returning();
    return result[0] || null;
  }

  async deleteFavorecido(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(favorecidos).where(
      and(eq(favorecidos.id, id), eq(favorecidos.tenantId, tenantId))
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

  // Removed: External Contacts implementation - functionality eliminated from system

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

  // Favorecidos (External Contacts) Methods - Using direct SQL for tenant-specific tables
  async getFavorecido(id: string, tenantId: string): Promise<Favorecido | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;  // Convert hyphens to underscores
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.favorecidos 
      WHERE id = ${id} AND tenant_id = ${tenantId}
      LIMIT 1
    `);
    return (result.rows[0] as Favorecido) || null;
  }

  async getFavorecidos(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<Favorecido[]> {
    const { limit = 50, offset = 0, search } = options;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;  // Convert hyphens to underscores
    
    let query = sql`
      SELECT * FROM ${sql.identifier(schemaName)}.favorecidos 
      WHERE tenant_id = ${tenantId}
    `;
    
    if (search) {
      query = sql`
        SELECT * FROM ${sql.identifier(schemaName)}.favorecidos 
        WHERE tenant_id = ${tenantId}
        AND (
          first_name ILIKE ${`%${search}%`} OR
          last_name ILIKE ${`%${search}%`} OR
          email ILIKE ${`%${search}%`} OR
          company ILIKE ${`%${search}%`}
        )
      `;
    }
    
    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const result = await db.execute(query);
    return result.rows as Favorecido[];
  }

  async createFavorecido(tenantId: string, data: InsertFavorecido): Promise<Favorecido> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;  // Convert hyphens to underscores
    const id = crypto.randomUUID();
    
    await db.execute(sql`
      INSERT INTO ${sql.identifier(schemaName)}.favorecidos (
        id, tenant_id, first_name, last_name, email, phone, company, 
        cpf_cnpj, contact_type, relationship, preferred_contact_method, 
        notes, is_active, created_at, updated_at
      ) VALUES (
        ${id}, ${tenantId}, ${data.firstName || ''}, ${data.lastName || ''}, ${data.email}, 
        ${data.phone || ''}, ${data.company || ''}, ${data.cpfCnpj || ''}, 
        ${data.contactType || 'external'}, ${data.relationship || ''}, 
        ${data.preferredContactMethod || 'email'}, ${data.notes || ''}, 
        ${data.isActive ?? true}, NOW(), NOW()
      )
    `);

    return this.getFavorecido(id, tenantId) as Promise<Favorecido>;
  }

  async updateFavorecido(id: string, tenantId: string, data: Partial<InsertFavorecido>): Promise<Favorecido | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;  // Convert hyphens to underscores
    const updates = [];
    const values = [tenantId, id]; // Start with tenantId and id for WHERE clause
    
    if (data.firstName !== undefined) { updates.push(`first_name = $${values.length + 1}`); values.push(data.firstName); }
    if (data.lastName !== undefined) { updates.push(`last_name = $${values.length + 1}`); values.push(data.lastName); }
    if (data.email !== undefined) { updates.push(`email = $${values.length + 1}`); values.push(data.email); }
    if (data.phone !== undefined) { updates.push(`phone = $${values.length + 1}`); values.push(data.phone); }
    if (data.company !== undefined) { updates.push(`company = $${values.length + 1}`); values.push(data.company); }
    if (data.cpfCnpj !== undefined) { updates.push(`cpf_cnpj = $${values.length + 1}`); values.push(data.cpfCnpj); }
    if (data.contactType !== undefined) { updates.push(`contact_type = $${values.length + 1}`); values.push(data.contactType); }
    if (data.relationship !== undefined) { updates.push(`relationship = $${values.length + 1}`); values.push(data.relationship); }
    if (data.preferredContactMethod !== undefined) { updates.push(`preferred_contact_method = $${values.length + 1}`); values.push(data.preferredContactMethod); }
    if (data.notes !== undefined) { updates.push(`notes = $${values.length + 1}`); values.push(data.notes); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${values.length + 1}`); values.push(data.isActive); }
    
    updates.push('updated_at = NOW()');
    
    await db.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.favorecidos 
      SET ${sql.raw(updates.join(', '))}
      WHERE tenant_id = ${tenantId} AND id = ${id}
    `);
    
    return this.getFavorecido(id, tenantId);
  }

  async deleteFavorecido(id: string, tenantId: string): Promise<boolean> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;  // Convert hyphens to underscores
    const result = await db.execute(sql`
      DELETE FROM ${sql.identifier(schemaName)}.favorecidos 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `);
    return result.rowCount > 0;
  }

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
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
  favorecidoLocations,
  type User,
  type Customer,
  type Favorecido,
  type Ticket,
  type TicketMessage,
  type Tenant,
  type Location,
  type FavorecidoLocation,
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
  
  // Favorecido-Location Associations
  getFavorecidoLocations(favorecidoId: string, tenantId: string): Promise<(FavorecidoLocation & { location: Location })[]>;
  addFavorecidoLocation(favorecidoId: string, locationId: string, tenantId: string, isPrimary?: boolean): Promise<FavorecidoLocation>;
  removeFavorecidoLocation(favorecidoId: string, locationId: string, tenantId: string): Promise<boolean>;
  updateFavorecidoLocationPrimary(favorecidoId: string, locationId: string, tenantId: string, isPrimary: boolean): Promise<boolean>;
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

  // Customers - Using direct SQL with tenant schema
  async getCustomer(id: string, tenantId: string): Promise<Customer | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers 
        WHERE id = ${id} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      return (result.rows[0] as Customer) || null;
    } catch (error) {
      console.error('Error getting customer:', error);
      return null;
    }
  }

  async getCustomers(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<Customer[]> {
    try {
      const { limit = 50, offset = 0, search } = options;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      let query = sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers 
        WHERE tenant_id = ${tenantId}
      `;
      
      if (search) {
        query = sql`
          SELECT * FROM ${sql.identifier(schemaName)}.customers 
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
      return result.rows as Customer[];
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  async createCustomer(tenantId: string, data: InsertCustomer): Promise<Customer> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const id = crypto.randomUUID();
      
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.customers (
          id, tenant_id, first_name, last_name, email, phone, 
          company, cpf_cnpj, is_active, created_at, updated_at
        ) VALUES (
          ${id}, ${tenantId}, ${data.firstName || ''}, ${data.lastName || ''}, 
          ${data.email}, ${data.phone || ''}, ${data.company || ''}, 
          ${data.cpfCnpj || ''}, ${data.isActive ?? true}, NOW(), NOW()
        )
      `);

      return this.getCustomer(id, tenantId) as Promise<Customer>;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, tenantId: string, data: Partial<InsertCustomer>): Promise<Customer | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const updates = [];
      if (data.firstName !== undefined) updates.push(`first_name = '${data.firstName}'`);
      if (data.lastName !== undefined) updates.push(`last_name = '${data.lastName}'`);
      if (data.email !== undefined) updates.push(`email = '${data.email}'`);
      if (data.phone !== undefined) updates.push(`phone = '${data.phone}'`);
      if (data.company !== undefined) updates.push(`company = '${data.company}'`);
      if (data.cpfCnpj !== undefined) updates.push(`cpf_cnpj = '${data.cpfCnpj}'`);
      if (data.isActive !== undefined) updates.push(`is_active = ${data.isActive}`);
      
      updates.push('updated_at = NOW()');
      
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.customers 
        SET ${sql.raw(updates.join(', '))}
        WHERE tenant_id = ${tenantId} AND id = ${id}
      `);
      
      return this.getCustomer(id, tenantId);
    } catch (error) {
      console.error('Error updating customer:', error);
      return null;
    }
  }

  async deleteCustomer(id: string, tenantId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.customers 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // Favorecidos (External Contacts) - Using direct SQL with tenant schema  
  async getFavorecido(id: string, tenantId: string): Promise<Favorecido | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.favorecidos 
        WHERE id = ${id} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      return (result.rows[0] as Favorecido) || null;
    } catch (error) {
      console.error('Error getting favorecido:', error);
      return null;
    }
  }

  async getFavorecidos(tenantId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<Favorecido[]> {
    try {
      const { limit = 50, offset = 0, search } = options;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
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
    } catch (error) {
      console.error('Error getting favorecidos:', error);
      return [];
    }
  }

  async createFavorecido(tenantId: string, data: InsertFavorecido): Promise<Favorecido> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
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
    } catch (error) {
      console.error('Error creating favorecido:', error);
      throw error;
    }
  }

  async updateFavorecido(id: string, tenantId: string, data: Partial<InsertFavorecido>): Promise<Favorecido | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const updates = [];
      if (data.firstName !== undefined) updates.push(`first_name = '${data.firstName}'`);
      if (data.lastName !== undefined) updates.push(`last_name = '${data.lastName}'`);
      if (data.email !== undefined) updates.push(`email = '${data.email}'`);
      if (data.phone !== undefined) updates.push(`phone = '${data.phone}'`);
      if (data.company !== undefined) updates.push(`company = '${data.company}'`);
      if (data.cpfCnpj !== undefined) updates.push(`cpf_cnpj = '${data.cpfCnpj}'`);
      if (data.contactType !== undefined) updates.push(`contact_type = '${data.contactType}'`);
      if (data.relationship !== undefined) updates.push(`relationship = '${data.relationship}'`);
      if (data.preferredContactMethod !== undefined) updates.push(`preferred_contact_method = '${data.preferredContactMethod}'`);
      if (data.notes !== undefined) updates.push(`notes = '${data.notes}'`);
      if (data.isActive !== undefined) updates.push(`is_active = ${data.isActive}`);
      
      updates.push('updated_at = NOW()');
      
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.favorecidos 
        SET ${sql.raw(updates.join(', '))}
        WHERE tenant_id = ${tenantId} AND id = ${id}
      `);
      
      return this.getFavorecido(id, tenantId);
    } catch (error) {
      console.error('Error updating favorecido:', error);
      return null;
    }
  }

  async deleteFavorecido(id: string, tenantId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.favorecidos 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting favorecido:', error);
      return false;
    }
  }

  // Tickets - Using tenant-specific database connections
  async getTicket(id: string, tenantId: string): Promise<Ticket | null> {
    try {
      await this.schemaManager.createTenantSchema(tenantId);
      const { db: tenantDb } = await this.schemaManager.getTenantDb(tenantId);
      
      const result = await tenantDb.execute(sql`
        SELECT * FROM tickets 
        WHERE id = ${id} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      return (result.rows[0] as Ticket) || null;
    } catch (error) {
      console.error('Error getting ticket:', error);
      return null;
    }
  }

  async getTickets(tenantId: string, limit: number = 50, offset: number = 0): Promise<Ticket[]> {
    try {
      await this.schemaManager.createTenantSchema(tenantId);
      const { db: tenantDb } = await this.schemaManager.getTenantDb(tenantId);
      
      const result = await tenantDb.execute(sql`
        SELECT * FROM tickets 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `);
      return result.rows as Ticket[];
    } catch (error) {
      console.error('Error getting tickets:', error);
      return [];
    }
  }

  async createTicket(data: InsertTicket): Promise<Ticket> {
    try {
      await this.schemaManager.createTenantSchema(data.tenantId!);
      const { db: tenantDb } = await this.schemaManager.getTenantDb(data.tenantId!);
      const id = crypto.randomUUID();
      
      await tenantDb.execute(sql`
        INSERT INTO tickets (
          id, tenant_id, subject, description, status, priority, 
          customer_id, assigned_to_id, created_at, updated_at
        ) VALUES (
          ${id}, ${data.tenantId}, ${data.subject}, ${data.description || ''}, 
          ${data.status || 'open'}, ${data.priority || 'medium'}, 
          ${data.customerId || null}, ${data.assignedToId || null}, NOW(), NOW()
        )
      `);

      return this.getTicket(id, data.tenantId!) as Promise<Ticket>;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  async updateTicket(id: string, tenantId: string, data: Partial<InsertTicket>): Promise<Ticket | null> {
    try {
      await this.schemaManager.createTenantSchema(tenantId);
      const { db: tenantDb } = await this.schemaManager.getTenantDb(tenantId);
      
      const updates = [];
      if (data.subject !== undefined) updates.push(`subject = '${data.subject}'`);
      if (data.description !== undefined) updates.push(`description = '${data.description}'`);
      if (data.status !== undefined) updates.push(`status = '${data.status}'`);
      if (data.priority !== undefined) updates.push(`priority = '${data.priority}'`);
      if (data.customerId !== undefined) updates.push(`customer_id = '${data.customerId}'`);
      if (data.assignedToId !== undefined) updates.push(`assigned_to_id = '${data.assignedToId}'`);
      
      updates.push('updated_at = NOW()');
      
      await tenantDb.execute(sql`
        UPDATE tickets 
        SET ${sql.raw(updates.join(', '))}
        WHERE tenant_id = ${tenantId} AND id = ${id}
      `);
      
      return this.getTicket(id, tenantId);
    } catch (error) {
      console.error('Error updating ticket:', error);
      return null;
    }
  }

  async deleteTicket(id: string, tenantId: string): Promise<boolean> {
    try {
      await this.schemaManager.createTenantSchema(tenantId);
      const { db: tenantDb } = await this.schemaManager.getTenantDb(tenantId);
      
      const result = await tenantDb.execute(sql`
        DELETE FROM tickets 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return false;
    }
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

  // Locations - Using direct SQL with tenant schema
  async getLocation(id: string, tenantId: string): Promise<Location | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.locations 
        WHERE id = ${id} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      return (result.rows[0] as Location) || null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async getLocations(tenantId: string, limit: number = 50, offset: number = 0): Promise<Location[]> {
    try {
      await this.schemaManager.createTenantSchema(tenantId);
      const { db: tenantDb } = await this.schemaManager.getTenantDb(tenantId);
      
      const result = await tenantDb.execute(sql`
        SELECT * FROM locations 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `);
      return result.rows as Location[];
    } catch (error) {
      console.error('Error getting locations:', error);
      return [];
    }
  }

  async createLocation(data: InsertLocation): Promise<Location> {
    try {
      const schemaName = `tenant_${data.tenantId!.replace(/-/g, '_')}`;
      const id = crypto.randomUUID();
      
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.locations (
          id, tenant_id, name, address, city, state, zip_code, 
          latitude, longitude, created_at, updated_at
        ) VALUES (
          ${id}, ${data.tenantId}, ${data.name}, ${data.address}, 
          ${data.city}, ${data.state}, ${data.zipCode}, 
          ${data.latitude || null}, ${data.longitude || null}, NOW(), NOW()
        )
      `);

      return this.getLocation(id, data.tenantId!) as Promise<Location>;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  async updateLocation(id: string, tenantId: string, data: Partial<InsertLocation>): Promise<Location | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const updates = [];
      if (data.name !== undefined) updates.push(`name = '${data.name}'`);
      if (data.address !== undefined) updates.push(`address = '${data.address}'`);
      if (data.city !== undefined) updates.push(`city = '${data.city}'`);
      if (data.state !== undefined) updates.push(`state = '${data.state}'`);
      if (data.zipCode !== undefined) updates.push(`zip_code = '${data.zipCode}'`);
      if (data.latitude !== undefined) updates.push(`latitude = '${data.latitude}'`);
      if (data.longitude !== undefined) updates.push(`longitude = '${data.longitude}'`);
      
      updates.push('updated_at = NOW()');
      
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.locations 
        SET ${sql.raw(updates.join(', '))}
        WHERE tenant_id = ${tenantId} AND id = ${id}
      `);
      
      return this.getLocation(id, tenantId);
    } catch (error) {
      console.error('Error updating location:', error);
      return null;
    }
  }

  async deleteLocation(id: string, tenantId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.locations 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting location:', error);
      return false;
    }
  }

  // REMOVED: Duplicate favorecidos methods - already implemented above with tenant-specific connections

  // Dashboard stats - Using tenant-specific connections
  async getRecentActivity(tenantId: string, limit: number = 20): Promise<any[]> {
    try {
      await this.schemaManager.createTenantSchema(tenantId);
      const { db: tenantDb } = await this.schemaManager.getTenantDb(tenantId);

      // Get recent tickets from tenant schema
      const recentTicketsResult = await tenantDb.execute(sql`
        SELECT * FROM tickets 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      // Get recent customers from tenant schema  
      const recentCustomersResult = await tenantDb.execute(sql`
        SELECT * FROM customers 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      const recentTickets = recentTicketsResult.rows;
      const recentCustomers = recentCustomersResult.rows;

      // Combine activities
      const activities = [
        ...recentTickets.map((ticket: any) => ({
          type: 'ticket',
          id: ticket.id,
          title: ticket.subject,
          createdAt: ticket.created_at,
          data: ticket
        })),
        ...recentCustomers.map((customer: any) => ({
          type: 'customer',
          id: customer.id,
          title: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
          createdAt: customer.created_at,
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

  // Favorecido-Location Associations Implementation
  async getFavorecidoLocations(favorecidoId: string, tenantId: string): Promise<(FavorecidoLocation & { location: Location })[]> {
    const results = await db
      .select({
        id: favorecidoLocations.id,
        tenantId: favorecidoLocations.tenantId,
        favorecidoId: favorecidoLocations.favorecidoId,
        locationId: favorecidoLocations.locationId,
        isPrimary: favorecidoLocations.isPrimary,
        createdAt: favorecidoLocations.createdAt,
        location: locations
      })
      .from(favorecidoLocations)
      .leftJoin(locations, eq(favorecidoLocations.locationId, locations.id))
      .where(and(
        eq(favorecidoLocations.favorecidoId, favorecidoId),
        eq(favorecidoLocations.tenantId, tenantId)
      ))
      .orderBy(desc(favorecidoLocations.isPrimary), asc(favorecidoLocations.createdAt));

    return results.map(result => ({
      id: result.id,
      tenantId: result.tenantId,
      favorecidoId: result.favorecidoId,
      locationId: result.locationId,
      isPrimary: result.isPrimary,
      createdAt: result.createdAt,
      location: result.location!
    }));
  }

  async addFavorecidoLocation(favorecidoId: string, locationId: string, tenantId: string, isPrimary: boolean = false): Promise<FavorecidoLocation> {
    // If setting as primary, unset all other primary locations for this favorecido
    if (isPrimary) {
      await db
        .update(favorecidoLocations)
        .set({ isPrimary: false })
        .where(and(
          eq(favorecidoLocations.favorecidoId, favorecidoId),
          eq(favorecidoLocations.tenantId, tenantId)
        ));
    }

    const [result] = await db
      .insert(favorecidoLocations)
      .values({
        favorecidoId,
        locationId,
        tenantId,
        isPrimary
      })
      .returning();

    return result;
  }

  async removeFavorecidoLocation(favorecidoId: string, locationId: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(favorecidoLocations)
      .where(and(
        eq(favorecidoLocations.favorecidoId, favorecidoId),
        eq(favorecidoLocations.locationId, locationId),
        eq(favorecidoLocations.tenantId, tenantId)
      ));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateFavorecidoLocationPrimary(favorecidoId: string, locationId: string, tenantId: string, isPrimary: boolean): Promise<boolean> {
    // If setting as primary, unset all other primary locations for this favorecido
    if (isPrimary) {
      await db
        .update(favorecidoLocations)
        .set({ isPrimary: false })
        .where(and(
          eq(favorecidoLocations.favorecidoId, favorecidoId),
          eq(favorecidoLocations.tenantId, tenantId)
        ));
    }

    const result = await db
      .update(favorecidoLocations)
      .set({ isPrimary })
      .where(and(
        eq(favorecidoLocations.favorecidoId, favorecidoId),
        eq(favorecidoLocations.locationId, locationId),
        eq(favorecidoLocations.tenantId, tenantId)
      ));

    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DrizzleStorage();
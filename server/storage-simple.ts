import { db } from "./db";
import { eq, and, desc, asc, count, or, ilike, sql } from "drizzle-orm";
import { withHibernationHandling } from './database/NeonHibernationHandler';
import { 
  users, 
  customers, 
  favorecidos,
  tickets, 
  ticketMessages, 
  tenants,
  locations,
  favorecidoLocations,
  tenantIntegrationsConfig,
  type User,
  type Customer,
  type Favorecido,
  type Ticket,
  type TicketMessage,
  type Tenant,
  type Location,
  type FavorecidoLocation,
  type TenantIntegrationConfig,
  type InsertCustomer,
  type InsertFavorecido,
  type InsertTicket,
  type InsertTicketMessage,
  type InsertUser,
  type InsertTenant,
  type InsertLocation,
  type InsertTenantIntegrationConfig
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
  
  // Tenant Integrations
  getTenantIntegrations(tenantId: string): Promise<any[]>;
  getTenantIntegrationConfig(tenantId: string, integrationId: string): Promise<TenantIntegrationConfig | null>;
  saveTenantIntegrationConfig(tenantId: string, integrationId: string, config: any): Promise<TenantIntegrationConfig>;
  
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
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

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
    // HIBERNATION PROTECTION: Wrap operation with hibernation handling
    return withHibernationHandling(async () => {
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

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
    }, `getCustomers-${tenantId}`, `tenant-${tenantId}`);
  }

  async createCustomer(tenantId: string, data: InsertCustomer): Promise<Customer> {
    try {
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

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
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // CRITICAL SECURITY FIX: Use parameterized queries for all customer updates
      const setParts = [];
      if (data.firstName !== undefined) setParts.push(sql`first_name = ${data.firstName}`);
      if (data.lastName !== undefined) setParts.push(sql`last_name = ${data.lastName}`);
      if (data.email !== undefined) setParts.push(sql`email = ${data.email}`);
      if (data.phone !== undefined) setParts.push(sql`phone = ${data.phone}`);
      if (data.company !== undefined) setParts.push(sql`company = ${data.company}`);
      if (data.cpfCnpj !== undefined) setParts.push(sql`cpf_cnpj = ${data.cpfCnpj}`);
      if (data.isActive !== undefined) setParts.push(sql`is_active = ${data.isActive}`);
      
      if (setParts.length === 0) {
        return this.getCustomer(id, tenantId); // No updates to perform
      }
      
      setParts.push(sql`updated_at = NOW()`);
      
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.customers 
        SET ${sql.join(setParts, sql`, `)}
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
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

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
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

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
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

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
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }
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
      // ENTERPRISE SECURITY: Strict UUID-v4 validation for tenant ID
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // CRITICAL SECURITY FIX: Use parameterized queries for all favorecido updates
      const setParts = [];
      if (data.firstName !== undefined) setParts.push(sql`first_name = ${data.firstName}`);
      if (data.lastName !== undefined) setParts.push(sql`last_name = ${data.lastName}`);
      if (data.email !== undefined) setParts.push(sql`email = ${data.email}`);
      if (data.phone !== undefined) setParts.push(sql`phone = ${data.phone}`);
      if (data.company !== undefined) setParts.push(sql`company = ${data.company}`);
      if (data.cpfCnpj !== undefined) setParts.push(sql`cpf_cnpj = ${data.cpfCnpj}`);
      if (data.contactType !== undefined) setParts.push(sql`contact_type = ${data.contactType}`);
      if (data.relationship !== undefined) setParts.push(sql`relationship = ${data.relationship}`);
      if (data.preferredContactMethod !== undefined) setParts.push(sql`preferred_contact_method = ${data.preferredContactMethod}`);
      if (data.notes !== undefined) setParts.push(sql`notes = ${data.notes}`);
      if (data.isActive !== undefined) setParts.push(sql`is_active = ${data.isActive}`);
      
      if (setParts.length === 0) {
        return this.getFavorecido(id, tenantId); // No updates to perform
      }
      
      setParts.push(sql`updated_at = NOW()`);
      
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.favorecidos 
        SET ${sql.join(setParts, sql`, `)}
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
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.tickets 
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
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.tickets 
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
      const schemaName = `tenant_${data.tenantId!.replace(/-/g, '_')}`;
      const id = crypto.randomUUID();
      
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.tickets (
          id, tenant_id, subject, description, status, priority, 
          caller_id, caller_type, beneficiary_id, beneficiary_type, 
          assigned_to_id, created_at, updated_at
        ) VALUES (
          ${id}, ${data.tenantId}, ${data.subject}, ${data.description || ''}, 
          ${data.status || 'open'}, ${data.priority || 'medium'}, 
          ${data.callerId}, ${data.callerType || 'customer'}, 
          ${data.beneficiaryId || data.callerId}, ${data.beneficiaryType || 'customer'},
          ${data.assignedToId || null}, NOW(), NOW()
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
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // CRITICAL SECURITY FIX: Use parameterized queries instead of string concatenation
      const setParts = [];
      const values: any[] = [];
      
      if (data.subject !== undefined) {
        setParts.push(`subject = $${values.length + 1}`);
        values.push(data.subject);
      }
      if (data.description !== undefined) {
        setParts.push(`description = $${values.length + 1}`);
        values.push(data.description);
      }
      if (data.status !== undefined) {
        setParts.push(`status = $${values.length + 1}`);
        values.push(data.status);
      }
      if (data.priority !== undefined) {
        setParts.push(`priority = $${values.length + 1}`);
        values.push(data.priority);
      }
      if (data.callerId !== undefined) {
        setParts.push(`caller_id = $${values.length + 1}`);
        values.push(data.callerId);
      }
      if (data.callerType !== undefined) {
        setParts.push(`caller_type = $${values.length + 1}`);
        values.push(data.callerType);
      }
      if (data.beneficiaryId !== undefined) {
        setParts.push(`beneficiary_id = $${values.length + 1}`);
        values.push(data.beneficiaryId);
      }
      if (data.beneficiaryType !== undefined) {
        setParts.push(`beneficiary_type = $${values.length + 1}`);
        values.push(data.beneficiaryType);
      }
      if (data.assignedToId !== undefined) {
        setParts.push(`assigned_to_id = $${values.length + 1}`);
        values.push(data.assignedToId);
      }
      
      setParts.push('updated_at = NOW()');
      values.push(tenantId, id); // Add WHERE clause parameters
      
      // CRITICAL SECURITY FIX: Use fully parameterized query with proper Drizzle ORM
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.tickets 
        SET ${sql.raw(setParts.join(', '))}
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
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.tickets 
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

  // Tenant Integrations
  // Tenant Integration Configuration methods
  async getTenantIntegrationConfig(tenantId: string, integrationId: string): Promise<TenantIntegrationConfig | null> {
    return withHibernationHandling(async () => {
      console.log(`[getTenantIntegrationConfig] Buscando config para tenant: ${tenantId}, integration: ${integrationId}`);
      const result = await db
        .select()
        .from(tenantIntegrationsConfig)
        .where(and(
          eq(tenantIntegrationsConfig.tenantId, tenantId),
          eq(tenantIntegrationsConfig.integrationId, integrationId)
        ))
        .limit(1);
      
      console.log(`[getTenantIntegrationConfig] Resultado encontrado:`, result);
      return result[0] || null;
    });
  }

  async saveTenantIntegrationConfig(tenantId: string, integrationId: string, config: any): Promise<TenantIntegrationConfig> {
    return withHibernationHandling(async () => {
      // Check if configuration exists
      const existing = await this.getTenantIntegrationConfig(tenantId, integrationId);
      
      if (existing) {
        // Update existing configuration
        const result = await db
          .update(tenantIntegrationsConfig)
          .set({
            config,
            enabled: config.enabled !== false,
            updatedAt: new Date()
          })
          .where(and(
            eq(tenantIntegrationsConfig.tenantId, tenantId),
            eq(tenantIntegrationsConfig.integrationId, integrationId)
          ))
          .returning();
        
        return result[0];
      } else {
        // Create new configuration
        const result = await db
          .insert(tenantIntegrationsConfig)
          .values({
            tenantId,
            integrationId,
            config,
            enabled: config.enabled !== false
          })
          .returning();
        
        return result[0];
      }
    });
  }

  async getTenantIntegrations(tenantId: string): Promise<any[]> {
    try {
      // ENTERPRISE SECURITY: Strict UUID-v4 validation
      const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantId || !strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
        throw new Error('Tenant ID must be a valid UUID-v4 format (36 chars)');
      }
      
      // Get saved configurations for this tenant
      const savedConfigs = await db
        .select()
        .from(tenantIntegrationsConfig)
        .where(eq(tenantIntegrationsConfig.tenantId, tenantId));

      // Create a map of saved configurations
      const configMap = savedConfigs.reduce((acc, config) => {
        acc[config.integrationId] = config;
        return acc;
      }, {} as Record<string, any>);

      // Return complete integrations with all 5 categories (Comunicação, Automação, Dados, Segurança, Produtividade)
      const defaultIntegrations = [
        // Comunicação
        {
          id: 'gmail-oauth2',
          name: 'Gmail OAuth2',
          category: 'Comunicação',
          description: 'Integração OAuth2 com Gmail para envio e recebimento seguro de emails',
          status: 'disconnected',
          configured: false,
          features: ['OAuth2 Authentication', 'Send/Receive Emails', 'Auto-sync', 'Secure Token Management']
        },
        {
          id: 'outlook-oauth2',
          name: 'Outlook OAuth2',
          category: 'Comunicação', 
          description: 'Integração OAuth2 com Microsoft Outlook para emails corporativos',
          status: 'disconnected',
          configured: false,
          features: ['OAuth2 Authentication', 'Exchange Integration', 'Calendar Sync', 'Corporate Email']
        },
        {
          id: 'email-smtp',
          name: 'Email SMTP',
          category: 'Comunicação',
          description: 'Configuração de servidor SMTP para envio de emails automáticos',
          status: 'disconnected',
          configured: false,
          features: ['SMTP Configuration', 'Email Notifications', 'Automated Reports']
        },
        {
          id: 'imap-email',
          name: 'IMAP Email',
          category: 'Comunicação',
          description: 'Conexão IMAP para recebimento automático de emails e criação de tickets',
          status: 'disconnected',
          configured: false,
          features: ['Auto-criação de tickets', 'Monitoramento de caixa de entrada', 'Sincronização bidirecional', 'Suporte SSL/TLS']
        },
        {
          id: 'whatsapp-business',
          name: 'WhatsApp Business',
          category: 'Comunicação',
          description: 'Integração com WhatsApp Business API para atendimento via WhatsApp',
          status: 'disconnected',
          configured: false,
          features: ['Mensagens automáticas', 'Templates aprovados', 'Webhooks']
        },
        {
          id: 'slack',
          name: 'Slack',
          category: 'Comunicação',
          description: 'Notificações e gerenciamento de tickets através do Slack',
          status: 'disconnected',
          configured: false,
          features: ['Notificações de tickets', 'Comandos slash', 'Bot integrado']
        },
        {
          id: 'twilio-sms',
          name: 'Twilio SMS',
          category: 'Comunicação',
          description: 'Envio de SMS para notificações e alertas importantes',
          status: 'disconnected',
          configured: false,
          features: ['SMS automático', 'Notificações críticas', 'Verificação 2FA']
        },
        // Automação
        {
          id: 'zapier',
          name: 'Zapier',
          category: 'Automação',
          description: 'Conecte com mais de 3000 aplicativos através de automações Zapier',
          status: 'disconnected',
          configured: false,
          features: ['Workflows automáticos', '3000+ integrações', 'Triggers personalizados']
        },
        {
          id: 'webhooks',
          name: 'Webhooks',
          category: 'Automação',
          description: 'Configure webhooks personalizados para eventos do sistema',
          status: 'disconnected',
          configured: false,
          features: ['Eventos em tempo real', 'Payload customizável', 'Retry automático']
        },
        // Dados
        {
          id: 'google-analytics',
          name: 'Google Analytics',
          category: 'Dados',
          description: 'Rastreamento e análise de performance do atendimento',
          status: 'disconnected',
          configured: false,
          features: ['Métricas de conversão', 'Funis de atendimento', 'Relatórios customizados']
        },
        {
          id: 'crm-integration',
          name: 'CRM Integration',
          category: 'Dados',
          description: 'Sincronização bidirecional com seu sistema CRM',
          status: 'disconnected',
          configured: false,
          features: ['Sync automático', 'Campos customizados', 'Histórico completo']
        },
        {
          id: 'dropbox-personal',
          name: 'Dropbox Pessoal',
          category: 'Dados',
          description: 'Integração com conta pessoal do Dropbox para backup e armazenamento de documentos',
          status: 'disconnected',
          configured: false,
          features: ['Backup automático', 'Sincronização de anexos', 'Armazenamento seguro', 'API v2 Dropbox']
        },
        // Segurança
        {
          id: 'sso-saml',
          name: 'SSO/SAML',
          category: 'Segurança',
          description: 'Single Sign-On com provedores SAML para login corporativo',
          status: 'disconnected',
          configured: false,
          features: ['Login corporativo', 'Múltiplos provedores', 'Controle de acesso']
        },
        // Produtividade
        {
          id: 'google-workspace',
          name: 'Google Workspace',
          category: 'Produtividade',
          description: 'Integração com Gmail, Calendar e Drive para produtividade',
          status: 'disconnected',
          configured: false,
          features: ['Sincronização de calendário', 'Anexos do Drive', 'Emails corporativos']
        },
        {
          id: 'chatbot-ia',
          name: 'Chatbot IA',
          category: 'Produtividade',
          description: 'Chatbot inteligente com IA para atendimento automatizado',
          status: 'disconnected',
          configured: false,
          features: ['Respostas automáticas', 'Aprendizado contínuo', 'Escalação inteligente']
        }
      ];
      
      // Apply saved configurations to integrations
      const integrationsWithConfig = defaultIntegrations.map(integration => {
        const savedConfig = configMap[integration.id];
        if (savedConfig) {
          return {
            ...integration,
            configured: true,
            status: savedConfig.enabled ? 'connected' : 'disconnected',
            config: savedConfig.config
          };
        }
        return integration;
      });
      
      return integrationsWithConfig;
    } catch (error) {
      console.error('Error getting tenant integrations:', error);
      throw error;
    }
  }

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
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.locations 
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
      
      // CRITICAL SECURITY FIX: Use parameterized queries for all updates
      const setParts = [];
      if (data.name !== undefined) setParts.push(sql`name = ${data.name}`);
      if (data.address !== undefined) setParts.push(sql`address = ${data.address}`);
      if (data.city !== undefined) setParts.push(sql`city = ${data.city}`);
      if (data.state !== undefined) setParts.push(sql`state = ${data.state}`);
      if (data.zipCode !== undefined) setParts.push(sql`zip_code = ${data.zipCode}`);
      if (data.latitude !== undefined) setParts.push(sql`latitude = ${data.latitude}`);
      if (data.longitude !== undefined) setParts.push(sql`longitude = ${data.longitude}`);
      
      if (setParts.length === 0) {
        return this.getLocation(id, tenantId); // No updates to perform
      }
      
      setParts.push(sql`updated_at = NOW()`);
      
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.locations 
        SET ${sql.join(setParts, sql`, `)}
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

  // Dashboard stats - Using direct SQL with tenant schema
  async getRecentActivity(tenantId: string, limit: number = 20): Promise<any[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Get recent tickets from tenant schema
      const recentTicketsResult = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.tickets 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      // Get recent customers from tenant schema  
      const recentCustomersResult = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.customers 
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
    // HIBERNATION PROTECTION: Wrap operation with hibernation handling
    return withHibernationHandling(async () => {
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
    }, `getDashboardStats-${tenantId}`, `tenant-${tenantId}`);
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
export const storageSimple = storage;
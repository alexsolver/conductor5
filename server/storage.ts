import { eq, sql, and, desc, asc, ilike, isNotNull, or } from 'drizzle-orm';
import { databaseManager } from './database/DatabaseManager';
import { TenantValidator } from './database/TenantValidator';
import { logInfo, logError, logWarn } from './utils/logger';

// ===========================
// REFACTORED DATABASE STORAGE - PRODUCTION READY
// Fixes: All tenant isolation, query issues, and connection problems
// ===========================

export class DatabaseStorage {
  private static instance: DatabaseStorage;

  static getInstance(): DatabaseStorage {
    if (!DatabaseStorage.instance) {
      DatabaseStorage.instance = new DatabaseStorage();
    }
    return DatabaseStorage.instance;
  }

  // ===========================
  // CUSTOMER OPERATIONS
  // ===========================
  async getCustomers(tenantId: string, options: any = {}): Promise<any[]> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      const { limit = 50, offset = 0, search } = options;

      let query = sql`
        SELECT 
          id, tenant_id, first_name, last_name, email, phone, company,
          verified, active, suspended, created_at, updated_at
        FROM customers
        WHERE tenant_id = ${validatedTenantId}
      `;

      if (search) {
        query = sql`${query} AND (
          first_name ILIKE ${'%' + search + '%'} OR 
          last_name ILIKE ${'%' + search + '%'} OR 
          email ILIKE ${'%' + search + '%'}
        )`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await tenantDb.execute(query);
      return result.rows || [];
    } catch (error) {
      logError('Error fetching customers', error, { tenantId, options });
      throw error;
    }
  }

  async createCustomer(tenantId: string, customerData: any): Promise<any> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      if (!customerData.email) {
        throw new Error('Customer email is required');
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO customers (
          tenant_id, first_name, last_name, email, phone, company, 
          verified, active, suspended, created_at, updated_at
        ) VALUES (
          ${validatedTenantId},
          ${customerData.firstName || null},
          ${customerData.lastName || null},
          ${customerData.email},
          ${customerData.phone || null},
          ${customerData.company || null},
          ${customerData.verified || false},
          ${customerData.active !== undefined ? customerData.active : true},
          ${customerData.suspended || false},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      logError('Error creating customer', error, { tenantId, customerData });
      throw error;
    }
  }

  // ===========================
  // TICKET OPERATIONS
  // ===========================
  async getTickets(tenantId: string, options: any = {}): Promise<any[]> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      const { limit = 50, offset = 0, status } = options;

      let query = sql`
        SELECT 
          id, tenant_id, subject, description, status, priority, customer_id,
          created_at, updated_at
        FROM tickets
        WHERE tenant_id = ${validatedTenantId}
      `;

      if (status) {
        query = sql`${query} AND status = ${status}`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await tenantDb.execute(query);
      return result.rows || [];
    } catch (error) {
      logError('Error fetching tickets', error, { tenantId, options });
      throw error;
    }
  }

  async createTicket(tenantId: string, ticketData: any): Promise<any> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      if (!ticketData.subject) {
        throw new Error('Ticket subject is required');
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO tickets (
          tenant_id, subject, description, status, priority, customer_id,
          created_at, updated_at
        ) VALUES (
          ${validatedTenantId},
          ${ticketData.subject},
          ${ticketData.description || null},
          ${ticketData.status || 'open'},
          ${ticketData.priority || 'medium'},
          ${ticketData.customerId || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      logError('Error creating ticket', error, { tenantId, ticketData });
      throw error;
    }
  }

  // ===========================
  // EXTERNAL CONTACTS OPERATIONS
  // ===========================
  async getSolicitantes(tenantId: string, options: any = {}): Promise<any[]> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      const { limit = 50, offset = 0, search } = options;

      let query = sql`
        SELECT 
          id, tenant_id, type, name, email, phone, company, active,
          created_at, updated_at
        FROM external_contacts
        WHERE tenant_id = ${validatedTenantId} AND type = 'solicitante'
      `;

      if (search) {
        query = sql`${query} AND (
          name ILIKE ${'%' + search + '%'} OR 
          email ILIKE ${'%' + search + '%'}
        )`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await tenantDb.execute(query);
      return result.rows || [];
    } catch (error) {
      logError('Error fetching solicitantes', error, { tenantId, options });
      throw error;
    }
  }

  async getFavorecidos(tenantId: string, options: any = {}): Promise<any[]> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      const { limit = 50, offset = 0, search } = options;

      let query = sql`
        SELECT 
          id, tenant_id, type, name, email, phone, company, active,
          created_at, updated_at
        FROM external_contacts
        WHERE tenant_id = ${validatedTenantId} AND type = 'favorecido'
      `;

      if (search) {
        query = sql`${query} AND (
          name ILIKE ${'%' + search + '%'} OR 
          email ILIKE ${'%' + search + '%'}
        )`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await tenantDb.execute(query);
      return result.rows || [];
    } catch (error) {
      logError('Error fetching favorecidos', error, { tenantId, options });
      throw error;
    }
  }

  async createExternalContact(tenantId: string, contactData: any): Promise<any> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      if (!contactData.name || !contactData.type) {
        throw new Error('Contact name and type are required');
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO external_contacts (
          tenant_id, type, name, email, phone, company, active,
          created_at, updated_at
        ) VALUES (
          ${validatedTenantId},
          ${contactData.type},
          ${contactData.name},
          ${contactData.email || null},
          ${contactData.phone || null},
          ${contactData.company || null},
          ${contactData.active !== undefined ? contactData.active : true},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      logError('Error creating external contact', error, { tenantId, contactData });
      throw error;
    }
  }

  // ===========================
  // LOCATION OPERATIONS
  // ===========================
  async getLocations(tenantId: string, options: any = {}): Promise<any[]> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      const { limit = 50, offset = 0, search } = options;

      let query = sql`
        SELECT 
          id, tenant_id, name, address, city, state, zip_code,
          latitude, longitude, created_at, updated_at
        FROM locations
        WHERE tenant_id = ${validatedTenantId}
      `;

      if (search) {
        query = sql`${query} AND (
          name ILIKE ${'%' + search + '%'} OR 
          city ILIKE ${'%' + search + '%'}
        )`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await tenantDb.execute(query);
      return result.rows || [];
    } catch (error) {
      logError('Error fetching locations', error, { tenantId, options });
      throw error;
    }
  }

  async createLocation(tenantId: string, locationData: any): Promise<any> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      if (!locationData.name || !locationData.address) {
        throw new Error('Location name and address are required');
      }

      const result = await tenantDb.execute(sql`
        INSERT INTO locations (
          tenant_id, name, address, city, state, zip_code,
          latitude, longitude, created_at, updated_at
        ) VALUES (
          ${validatedTenantId},
          ${locationData.name},
          ${locationData.address},
          ${locationData.city || null},
          ${locationData.state || null},
          ${locationData.zipCode || null},
          ${locationData.latitude || null},
          ${locationData.longitude || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      logError('Error creating location', error, { tenantId, locationData });
      throw error;
    }
  }

  // ===========================
  // DASHBOARD OPERATIONS
  // ===========================
  async getDashboardStats(tenantId: string): Promise<any> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const tenantDb = await databaseManager.getTenantConnection(validatedTenantId);

      const [customersResult, ticketsResult, openTicketsResult] = await Promise.all([
        tenantDb.execute(sql`
          SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${validatedTenantId}
        `),
        tenantDb.execute(sql`
          SELECT COUNT(*) as count FROM tickets WHERE tenant_id = ${validatedTenantId}
        `),
        tenantDb.execute(sql`
          SELECT COUNT(*) as count FROM tickets 
          WHERE tenant_id = ${validatedTenantId} AND status = 'open'
        `)
      ]);

      return {
        totalCustomers: Number(customersResult.rows[0]?.count || 0),
        totalTickets: Number(ticketsResult.rows[0]?.count || 0),
        openTickets: Number(openTicketsResult.rows[0]?.count || 0)
      };
    } catch (error) {
      logError('Error fetching dashboard stats', error, { tenantId });
      throw error;
    }
  }

  // ===========================
  // HEALTH CHECK
  // ===========================
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const mainDb = databaseManager.getMainDb();
      await mainDb.execute(sql`SELECT 1`);
      return {
        healthy: true,
        details: { storage: 'healthy', timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance
export const storage = DatabaseStorage.getInstance();
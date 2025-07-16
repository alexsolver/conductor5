// Infrastructure Layer - Repository Implementation
import { eq, and, ilike, inArray } from "drizzle-orm";
import { Customer } from "../../domain/entities/Customer";
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";
import { schemaManager } from "../../../shared/database/SchemaManager";
import { customers as customersSchema } from "../../../../../shared/schema";

export class DrizzleCustomerRepository implements ICustomerRepository {
  
  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const [result] = await tenantDb
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    
    return result ? this.mapToEntity(result, tenantId) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const [result] = await tenantDb
      .select()
      .from(customers)
      .where(eq(customers.email, email));
    
    return result ? this.mapToEntity(result, tenantId) : null;
  }

  async findAll(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    verified?: boolean;
    active?: boolean;
    company?: string;
    tags?: string[];
  }): Promise<Customer[]> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    let query = tenantDb.select().from(customers);
    
    // Build where conditions
    const conditions = [];
    
    if (options?.verified !== undefined) {
      conditions.push(eq(customers.verified, options.verified));
    }
    
    if (options?.active !== undefined) {
      conditions.push(eq(customers.active, options.active));
    }
    
    if (options?.company) {
      conditions.push(ilike(customers.company, `%${options.company}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    const results = await query;
    return results.map(result => this.mapToEntity(result, tenantId));
  }

  async save(customer: Customer): Promise<Customer> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(customer.tenantId);
    const { customers } = tenantSchema;
    
    const customerData = this.mapFromEntity(customer);
    
    const [result] = await tenantDb
      .insert(customers)
      .values(customerData)
      .returning();
    
    return this.mapToEntity(result, customer.tenantId);
  }

  async update(id: string, tenantId: string, customer: Customer): Promise<Customer> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const customerData = this.mapFromEntity(customer);
    
    const [result] = await tenantDb
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    
    return this.mapToEntity(result, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const result = await tenantDb
      .delete(customers)
      .where(eq(customers.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async findByCompany(company: string, tenantId: string): Promise<Customer[]> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const results = await tenantDb
      .select()
      .from(customers)
      .where(ilike(customers.company, `%${company}%`));
    
    return results.map(result => this.mapToEntity(result, tenantId));
  }

  async findByTag(tag: string, tenantId: string): Promise<Customer[]> {
    // This would require a JSON query for tags array
    // Implementation depends on specific database capabilities
    return [];
  }

  async findSuspended(tenantId: string): Promise<Customer[]> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const results = await tenantDb
      .select()
      .from(customers)
      .where(eq(customers.suspended, true));
    
    return results.map(result => this.mapToEntity(result, tenantId));
  }

  async findUnverified(tenantId: string): Promise<Customer[]> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const results = await tenantDb
      .select()
      .from(customers)
      .where(eq(customers.verified, false));
    
    return results.map(result => this.mapToEntity(result, tenantId));
  }

  async countTotal(tenantId: string): Promise<number> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const [result] = await tenantDb
      .select({ count: customers.id })
      .from(customers);
    
    return result?.count || 0;
  }

  async countActive(tenantId: string): Promise<number> {
    const { db: tenantDb, schema: tenantSchema } = schemaManager.getTenantDb(tenantId);
    const { customers } = tenantSchema;
    
    const [result] = await tenantDb
      .select({ count: customers.id })
      .from(customers)
      .where(and(eq(customers.active, true), eq(customers.suspended, false)));
    
    return result?.count || 0;
  }

  async countByCompany(tenantId: string): Promise<Record<string, number>> {
    // Implementation for company statistics
    return {};
  }

  async bulkCreate(customers: Customer[]): Promise<Customer[]> {
    // Implementation for bulk operations
    return [];
  }

  async bulkUpdate(customers: Customer[]): Promise<Customer[]> {
    // Implementation for bulk operations
    return [];
  }

  private mapToEntity(data: any, tenantId: string): Customer {
    return new Customer(
      data.id,
      tenantId,
      data.email,
      data.firstName,
      data.lastName,
      data.phone,
      data.company,
      data.tags || [],
      data.metadata || {},
      data.verified || false,
      data.active || true,
      data.suspended || false,
      data.lastLogin,
      data.timezone || 'UTC',
      data.locale || 'en-US',
      data.language || 'en',
      data.externalId,
      data.role || 'customer',
      data.notes,
      data.avatar,
      data.signature,
      data.createdAt,
      data.updatedAt
    );
  }

  private mapFromEntity(customer: Customer): any {
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      company: customer.company,
      tags: customer.tags,
      metadata: customer.metadata,
      verified: customer.verified,
      active: customer.active,
      suspended: customer.suspended,
      lastLogin: customer.lastLogin,
      timezone: customer.timezone,
      locale: customer.locale,
      language: customer.language,
      externalId: customer.externalId,
      role: customer.role,
      notes: customer.notes,
      avatar: customer.avatar,
      signature: customer.signature,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
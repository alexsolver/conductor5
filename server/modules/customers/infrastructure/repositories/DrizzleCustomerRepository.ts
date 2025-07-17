/**
 * Drizzle Customer Repository Implementation
 * Clean Architecture - Infrastructure Layer
 * Implements ICustomerRepository using Drizzle ORM
 */

import { eq, and, ilike, count, sql, or } from 'drizzle-orm';
import { Customer } from '../../domain/entities/Customer';
import { ICustomerRepository, CustomerFilter } from '../../domain/ports/ICustomerRepository';
import { customers } from '@shared/schema';
import { db } from '../../../../db';

export class DrizzleCustomerRepository implements ICustomerRepository {
  
  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(and(eq(customers.email, email), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  async findMany(filter: CustomerFilter): Promise<Customer[]> {
    let query = db.select().from(customers).where(eq(customers.tenantId, filter.tenantId));

    // Apply filters
    const conditions = [eq(customers.tenantId, filter.tenantId)];

    if (filter.search) {
      // Sanitize search input to prevent SQL injection
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          sql`${customers.firstName} ILIKE ${searchPattern}`,
          sql`${customers.lastName} ILIKE ${searchPattern}`,
          sql`${customers.email} ILIKE ${searchPattern}`,
          sql`${customers.company} ILIKE ${searchPattern}`
        )!
      );
    }

    if (filter.active !== undefined) {
      conditions.push(eq(customers.active, filter.active));
    }

    if (filter.verified !== undefined) {
      conditions.push(eq(customers.verified, filter.verified));
    }

    query = query.where(and(...conditions));

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const results = await query;
    return results.map(result => this.toDomainEntity(result));
  }

  async save(customer: Customer): Promise<Customer> {
    const customerData = this.toPersistenceData(customer);

    // Check if customer exists
    const existingCustomer = await this.findById(customer.getId(), customer.getTenantId());

    if (existingCustomer) {
      // Update existing customer
      const [updated] = await db
        .update(customers)
        .set({
          ...customerData,
          updatedAt: new Date()
        })
        .where(and(
          eq(customers.id, customer.getId()),
          eq(customers.tenantId, customer.getTenantId())
        ))
        .returning();

      return this.toDomainEntity(updated);
    } else {
      // Insert new customer
      const [inserted] = await db
        .insert(customers)
        .values(customerData)
        .returning();

      return this.toDomainEntity(inserted);
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    return result.rowCount > 0;
  }

  async count(filter: Omit<CustomerFilter, 'limit' | 'offset'>): Promise<number> {
    const conditions = [eq(customers.tenantId, filter.tenantId)];

    if (filter.search) {
      // Sanitize search input to prevent SQL injection
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          sql`${customers.firstName} ILIKE ${searchPattern}`,
          sql`${customers.lastName} ILIKE ${searchPattern}`,
          sql`${customers.email} ILIKE ${searchPattern}`,
          sql`${customers.company} ILIKE ${searchPattern}`
        )!
      );
    }

    if (filter.active !== undefined) {
      conditions.push(eq(customers.active, filter.active));
    }

    if (filter.verified !== undefined) {
      conditions.push(eq(customers.verified, filter.verified));
    }

    const result = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  private toDomainEntity(data: any): Customer {
    return Customer.fromPersistence({
      id: data.id,
      tenantId: data.tenantId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      timezone: data.timezone,
      locale: data.locale,
      language: data.language,
      externalId: data.externalId,
      role: data.role,
      notes: data.notes,
      verified: data.verified,
      active: data.active,
      suspended: data.suspended,
      lastLogin: data.lastLogin,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      tags: data.tags || [],
      metadata: data.metadata || {}
    });
  }

  private toPersistenceData(customer: Customer): any {
    return {
      id: customer.getId(),
      tenantId: customer.getTenantId(),
      firstName: customer.getFirstName(),
      lastName: customer.getLastName(),
      email: customer.getEmail(),
      phone: customer.getPhone(),
      company: customer.getCompany(),
      timezone: customer.getTimezone(),
      locale: customer.getLocale(),
      language: customer.getLanguage(),
      externalId: customer.getExternalId(),
      role: customer.getRole(),
      notes: customer.getNotes(),
      verified: customer.isVerified(),
      active: customer.isActive(),
      suspended: customer.isSuspended(),
      lastLogin: customer.getLastLogin(),
      tags: customer.getTags(),
      metadata: customer.getMetadata(),
      createdAt: customer.getCreatedAt(),
      updatedAt: customer.getUpdatedAt()
    };
  }
}
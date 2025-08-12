/**
 * INFRASTRUCTURE LAYER - DRIZZLE CUSTOMER REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull } from 'drizzle-orm';
import { db } from '../../../../db';
import { customers } from '@shared/schema';
import { Customer } from '../../domain/entities/Customer';
import { 
  ICustomerRepository, 
  CustomerFilters, 
  PaginationOptions, 
  CustomerListResult 
} from '../../domain/repositories/ICustomerRepository';

export class DrizzleCustomerRepository implements ICustomerRepository {
  
  async findById(id: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.isActive, true)
        )
      )
      .limit(1);

    return this.mapToCustomer(result[0]) || null;
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      )
      .limit(1);

    return this.mapToCustomer(result[0]) || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.email, email),
          eq(customers.isActive, true)
        )
      )
      .limit(1);

    return this.mapToCustomer(result[0]) || null;
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.email, email),
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      )
      .limit(1);

    return this.mapToCustomer(result[0]) || null;
  }

  async findByCPFAndTenant(cpf: string, tenantId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.cpf, cpf),
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      )
      .limit(1);

    return this.mapToCustomer(result[0]) || null;
  }

  async findByCNPJAndTenant(cnpj: string, tenantId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.cnpj, cnpj),
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      )
      .limit(1);

    return this.mapToCustomer(result[0]) || null;
  }

  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date();
    
    const insertData = {
      tenantId: customerData.tenantId,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
      phone: customerData.phone,
      mobilePhone: customerData.mobilePhone,
      customerType: customerData.customerType,
      cpf: customerData.cpf,
      cnpj: customerData.cnpj,
      companyName: customerData.companyName,
      contactPerson: customerData.contactPerson,
      state: customerData.state,
      address: customerData.address,
      addressNumber: customerData.addressNumber,
      complement: customerData.complement,
      neighborhood: customerData.neighborhood,
      city: customerData.city,
      zipCode: customerData.zipCode,
      isActive: customerData.isActive,
      createdAt: now,
      updatedAt: now
    };

    const result = await db
      .insert(customers)
      .values(insertData)
      .returning();

    return this.mapToCustomer(result[0])!;
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const updateData: any = {
      updatedAt: new Date()
    };

    // Map fields to update
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.mobilePhone !== undefined) updateData.mobilePhone = updates.mobilePhone;
    if (updates.customerType !== undefined) updateData.customerType = updates.customerType;
    if (updates.cpf !== undefined) updateData.cpf = updates.cpf;
    if (updates.cnpj !== undefined) updateData.cnpj = updates.cnpj;
    if (updates.companyName !== undefined) updateData.companyName = updates.companyName;
    if (updates.contactPerson !== undefined) updateData.contactPerson = updates.contactPerson;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.addressNumber !== undefined) updateData.addressNumber = updates.addressNumber;
    if (updates.complement !== undefined) updateData.complement = updates.complement;
    if (updates.neighborhood !== undefined) updateData.neighborhood = updates.neighborhood;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.zipCode !== undefined) updateData.zipCode = updates.zipCode;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const result = await db
      .update(customers)
      .set(updateData)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.isActive, true)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('Customer not found or already deleted');
    }

    return this.mapToCustomer(result[0])!;
  }

  async delete(id: string): Promise<void> {
    const result = await db
      .update(customers)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(customers.id, id));

    if (result.rowCount === 0) {
      throw new Error('Customer not found');
    }
  }

  async findWithFilters(
    filters: CustomerFilters, 
    pagination: PaginationOptions, 
    tenantId?: string
  ): Promise<CustomerListResult> {
    // Build where conditions
    const conditions = [eq(customers.isActive, true)];

    // Add tenant filter if specified
    if (tenantId) {
      conditions.push(eq(customers.tenantId, tenantId));
    }

    // Apply filters
    if (filters.customerType?.length) {
      conditions.push(inArray(customers.customerType, filters.customerType));
    }

    if (filters.isActive !== undefined) {
      conditions[0] = eq(customers.isActive, filters.isActive); // Replace the default isActive filter
    }

    if (filters.state) {
      conditions.push(eq(customers.state, filters.state));
    }

    if (filters.city) {
      conditions.push(like(customers.city, `%${filters.city}%`));
    }

    if (filters.dateFrom) {
      conditions.push(gte(customers.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(customers.createdAt, filters.dateTo));
    }

    if (filters.search) {
      conditions.push(
        or(
          like(customers.firstName, `%${filters.search}%`),
          like(customers.lastName, `%${filters.search}%`),
          like(customers.email, `%${filters.search}%`),
          like(customers.companyName, `%${filters.search}%`),
          like(customers.cpf, `%${filters.search}%`),
          like(customers.cnpj, `%${filters.search}%`)
        )
      );
    }

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Build order by
    const orderColumn = customers[pagination.sortBy as keyof typeof customers] || customers.firstName;
    const orderDirection = pagination.sortOrder === 'asc' ? asc : desc;

    // Fetch paginated results
    const customerResults = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(orderDirection(orderColumn))
      .limit(pagination.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      customers: customerResults.map(c => this.mapToCustomer(c)!),
      total,
      page: pagination.page,
      totalPages
    };
  }

  async findByTenant(tenantId: string): Promise<Customer[]> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      )
      .orderBy(asc(customers.firstName));

    return result.map(c => this.mapToCustomer(c)!);
  }

  async findByTypeAndTenant(customerType: 'PF' | 'PJ', tenantId: string): Promise<Customer[]> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.customerType, customerType),
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      )
      .orderBy(asc(customers.firstName));

    return result.map(c => this.mapToCustomer(c)!);
  }

  async findByLocationAndTenant(state?: string, city?: string, tenantId?: string): Promise<Customer[]> {
    const conditions = [eq(customers.isActive, true)];

    if (tenantId) {
      conditions.push(eq(customers.tenantId, tenantId));
    }

    if (state) {
      conditions.push(eq(customers.state, state));
    }

    if (city) {
      conditions.push(like(customers.city, `%${city}%`));
    }

    const result = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.firstName));

    return result.map(c => this.mapToCustomer(c)!);
  }

  async countByFilters(filters: CustomerFilters, tenantId?: string): Promise<number> {
    const conditions = [eq(customers.isActive, true)];

    if (tenantId) {
      conditions.push(eq(customers.tenantId, tenantId));
    }

    // Apply same filters as findWithFilters
    if (filters.customerType?.length) {
      conditions.push(inArray(customers.customerType, filters.customerType));
    }

    if (filters.search) {
      conditions.push(
        or(
          like(customers.firstName, `%${filters.search}%`),
          like(customers.lastName, `%${filters.search}%`),
          like(customers.email, `%${filters.search}%`),
          like(customers.companyName, `%${filters.search}%`)
        )
      );
    }

    const result = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<'PF' | 'PJ', number>;
    byState: Record<string, number>;
    recentCustomers: number;
  }> {
    const conditions = [];
    if (tenantId) {
      conditions.push(eq(customers.tenantId, tenantId));
    }

    // Basic statistics
    const totalResult = await db
      .select({ count: count() })
      .from(customers)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const activeResult = await db
      .select({ count: count() })
      .from(customers)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(customers.isActive, true))
          : eq(customers.isActive, true)
      );

    const inactiveResult = await db
      .select({ count: count() })
      .from(customers)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(customers.isActive, false))
          : eq(customers.isActive, false)
      );

    // Recent customers (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentResult = await db
      .select({ count: count() })
      .from(customers)
      .where(
        conditions.length > 0 
          ? and(...conditions, gte(customers.createdAt, thirtyDaysAgo))
          : gte(customers.createdAt, thirtyDaysAgo)
      );

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      inactive: inactiveResult[0]?.count || 0,
      byType: { PF: 0, PJ: 0 }, // Simplified for now
      byState: {}, // Simplified for now
      recentCustomers: recentResult[0]?.count || 0
    };
  }

  async searchCustomers(
    searchTerm: string, 
    tenantId?: string, 
    pagination?: PaginationOptions
  ): Promise<CustomerListResult> {
    const conditions = [
      eq(customers.isActive, true),
      or(
        like(customers.firstName, `%${searchTerm}%`),
        like(customers.lastName, `%${searchTerm}%`),
        like(customers.email, `%${searchTerm}%`),
        like(customers.companyName, `%${searchTerm}%`),
        like(customers.cpf, `%${searchTerm}%`),
        like(customers.cnpj, `%${searchTerm}%`)
      )
    ];

    if (tenantId) {
      conditions.push(eq(customers.tenantId, tenantId));
    }

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    if (!pagination) {
      const customerResults = await db
        .select()
        .from(customers)
        .where(and(...conditions))
        .orderBy(asc(customers.firstName));

      return {
        customers: customerResults.map(c => this.mapToCustomer(c)!),
        total,
        page: 1,
        totalPages: 1
      };
    }

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Fetch paginated results
    const customerResults = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.firstName))
      .limit(pagination.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      customers: customerResults.map(c => this.mapToCustomer(c)!),
      total,
      page: pagination.page,
      totalPages
    };
  }

  async emailExists(email: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(customers.email, email),
      eq(customers.tenantId, tenantId)
    ];
    
    if (excludeId) {
      conditions.push(eq(customers.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async cpfExists(cpf: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(customers.cpf, cpf),
      eq(customers.tenantId, tenantId)
    ];
    
    if (excludeId) {
      conditions.push(eq(customers.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async cnpjExists(cnpj: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(customers.cnpj, cnpj),
      eq(customers.tenantId, tenantId)
    ];
    
    if (excludeId) {
      conditions.push(eq(customers.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async bulkUpdate(ids: string[], updates: Partial<Customer>): Promise<Customer[]> {
    const updateData: any = {
      updatedAt: new Date()
    };

    // Map updates
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.customerType !== undefined) updateData.customerType = updates.customerType;

    const result = await db
      .update(customers)
      .set(updateData)
      .where(
        and(
          inArray(customers.id, ids),
          eq(customers.isActive, true)
        )
      )
      .returning();

    return result.map(c => this.mapToCustomer(c)!);
  }

  async findByCompanyName(companyName: string, tenantId: string): Promise<Customer[]> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          like(customers.companyName, `%${companyName}%`),
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      )
      .orderBy(asc(customers.companyName));

    return result.map(c => this.mapToCustomer(c)!);
  }

  async findCustomersForNotification(tenantId: string): Promise<Customer[]> {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true)
        )
      );

    return result.map(c => this.mapToCustomer(c)!);
  }

  async findRecentCustomers(tenantId: string, days: number): Promise<Customer[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true),
          gte(customers.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(customers.createdAt));

    return result.map(c => this.mapToCustomer(c)!);
  }

  private mapToCustomer(dbCustomer: any): Customer | null {
    if (!dbCustomer) return null;

    return {
      id: dbCustomer.id,
      tenantId: dbCustomer.tenantId,
      firstName: dbCustomer.firstName,
      lastName: dbCustomer.lastName,
      email: dbCustomer.email,
      phone: dbCustomer.phone,
      mobilePhone: dbCustomer.mobilePhone,
      customerType: dbCustomer.customerType,
      cpf: dbCustomer.cpf,
      cnpj: dbCustomer.cnpj,
      companyName: dbCustomer.companyName,
      contactPerson: dbCustomer.contactPerson,
      state: dbCustomer.state,
      address: dbCustomer.address,
      addressNumber: dbCustomer.addressNumber,
      complement: dbCustomer.complement,
      neighborhood: dbCustomer.neighborhood,
      city: dbCustomer.city,
      zipCode: dbCustomer.zipCode,
      isActive: dbCustomer.isActive,
      createdAt: dbCustomer.createdAt,
      updatedAt: dbCustomer.updatedAt
    };
  }
}
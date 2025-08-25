/**
 * INFRASTRUCTURE LAYER - DRIZZLE CUSTOMER REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

// ✅ 1QA.MD COMPLIANCE: IMPORTS PADRONIZADOS
import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull, sql } from 'drizzle-orm';
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
  
  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByIdAndTenant instead
  async findById(id: string): Promise<Customer | null> {
    throw new Error('1QA.MD VIOLATION: findById without tenant context is not allowed. Use findByIdAndTenant instead.');
  }

  // ✅ 1QA.MD: Find customer by ID using tenant schema
  async findByIdAndTenant(id: string, tenantId: string): Promise<Customer | null> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Finding customer by ID for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.customers
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToCustomer(result.rows[0] as any) : null;
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error finding customer by ID:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByEmailAndTenant instead
  async findByEmail(email: string): Promise<Customer | null> {
    throw new Error('1QA.MD VIOLATION: findByEmail without tenant context is not allowed. Use findByEmailAndTenant instead.');
  }

  // ✅ 1QA.MD: Find customer by email using tenant schema
  async findByEmailAndTenant(email: string, tenantId: string): Promise<Customer | null> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Finding customer by email for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.customers
        WHERE email = ${email} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToCustomer(result.rows[0] as any) : null;
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error finding customer by email:', error);
      throw error;
    }
  }

  // ✅ 1QA.MD: Find customer by CPF using tenant schema
  async findByCPFAndTenant(cpf: string, tenantId: string): Promise<Customer | null> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Finding customer by CPF for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.customers
        WHERE cpf = ${cpf} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToCustomer(result.rows[0] as any) : null;
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error finding customer by CPF:', error);
      throw error;
    }
  }

  // ✅ 1QA.MD: Find customer by CNPJ using tenant schema
  async findByCNPJAndTenant(cnpj: string, tenantId: string): Promise<Customer | null> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Finding customer by CNPJ for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.customers
        WHERE cnpj = ${cnpj} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToCustomer(result.rows[0] as any) : null;
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error finding customer by CNPJ:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use createWithTenant instead
  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    throw new Error('1QA.MD VIOLATION: create without tenant context is not allowed. Use createWithTenant instead.');
  }

  // ✅ 1QA.MD: Create customer using tenant schema
  async createWithTenant(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<Customer> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Creating customer for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(tenantSchema)}.customers (
          tenant_id, name, email, phone, document_number, document_type,
          company_id, is_active, created_at, updated_at
        )
        VALUES (
          ${tenantId}, ${customerData.name || ''}, ${customerData.email}, 
          ${customerData.phone || ''}, ${customerData.documentNumber || ''}, 
          ${customerData.documentType || ''}, ${customerData.companyId || null},
          ${customerData.isActive !== false}, ${now}, ${now}
        )
        RETURNING 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
      `);

      return this.mapToCustomer(result.rows[0] as any)!;
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error creating customer:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use updateWithTenant instead
  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    throw new Error('1QA.MD VIOLATION: update without tenant context is not allowed. Use updateWithTenant instead.');
  }

  // ✅ 1QA.MD: Update customer using tenant schema
  async updateWithTenant(id: string, updates: Partial<Customer>, tenantId: string): Promise<Customer> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Updating customer for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        UPDATE ${sql.identifier(tenantSchema)}.customers
        SET 
          name = COALESCE(${updates.name}, name),
          email = COALESCE(${updates.email}, email),
          phone = COALESCE(${updates.phone}, phone),
          document_number = COALESCE(${updates.documentNumber}, document_number),
          document_type = COALESCE(${updates.documentType}, document_type),
          company_id = COALESCE(${updates.companyId}, company_id),
          is_active = COALESCE(${updates.isActive}, is_active),
          updated_at = ${now}
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
      `);

      if (!result.rows[0]) {
        throw new Error('Customer not found or already deleted');
      }

      return this.mapToCustomer(result.rows[0] as any)!;
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error updating customer:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use deleteWithTenant instead
  async delete(id: string): Promise<void> {
    throw new Error('1QA.MD VIOLATION: delete without tenant context is not allowed. Use deleteWithTenant instead.');
  }

  // ✅ 1QA.MD: Delete customer using tenant schema
  async deleteWithTenant(id: string, tenantId: string): Promise<void> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Deleting customer for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        UPDATE ${sql.identifier(tenantSchema)}.customers
        SET is_active = false, updated_at = ${now}
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);

      if (result.rowCount === 0) {
        throw new Error('Customer not found');
      }
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error deleting customer:', error);
      throw error;
    }
  }

  // ✅ 1QA.MD: Find customers with filters using tenant schema
  async findWithFilters(
    filters: CustomerFilters, 
    pagination: PaginationOptions, 
    tenantId: string
  ): Promise<CustomerListResult> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Finding customers with filters for schema:', tenantSchema);

      // Build search conditions
      let whereClause = 'WHERE tenant_id = $1 AND is_active = true';
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (filters.search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Count total
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM ${sql.identifier(tenantSchema)}.customers
        ${sql.raw(whereClause)}
      `);

      const total = parseInt(countResult.rows[0]?.count as string) || 0;
      const offset = (pagination.page - 1) * pagination.limit;
      const totalPages = Math.ceil(total / pagination.limit);

      // Fetch results
      const result = await db.execute(sql`
        SELECT 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.customers
        ${sql.raw(whereClause)}
        ORDER BY name
        LIMIT ${pagination.limit} OFFSET ${offset}
      `);

      return {
        customers: result.rows.map(c => this.mapToCustomer(c as any)!),
        total,
        page: pagination.page,
        totalPages
      };
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error finding customers with filters:', error);
      throw error;
    }
  }

  // ✅ 1QA.MD: Find customers by tenant using tenant schema
  async findByTenant(tenantId: string): Promise<Customer[]> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Finding customers by tenant for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.customers
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY name
      `);

      return result.rows.map(c => this.mapToCustomer(c as any)!);
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error finding customers by tenant:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method uses legacy field 'customerType' - Use findByDocumentTypeAndTenant instead
  async findByTypeAndTenant(customerType: 'PF' | 'PJ', tenantId: string): Promise<Customer[]> {
    throw new Error('1QA.MD VIOLATION: findByTypeAndTenant uses legacy field. Use findByDocumentTypeAndTenant instead.');
  }

  // ✅ 1QA.MD: Find customers by document type using tenant schema
  async findByDocumentTypeAndTenant(documentType: string, tenantId: string): Promise<Customer[]> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[CUSTOMER-REPOSITORY-QA] Finding customers by document type for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, name, email, phone, document_number as "documentNumber",
          document_type as "documentType", company_id as "companyId",
          tenant_id as "tenantId", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.customers
        WHERE document_type = ${documentType} AND tenant_id = ${tenantId} AND is_active = true
        ORDER BY name
      `);

      return result.rows.map(c => this.mapToCustomer(c as any)!);
    } catch (error) {
      console.error('[CUSTOMER-REPOSITORY-QA] Error finding customers by document type:', error);
      throw error;
    }
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
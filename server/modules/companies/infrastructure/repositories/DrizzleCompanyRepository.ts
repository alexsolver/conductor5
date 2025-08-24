/**
 * INFRASTRUCTURE LAYER - DRIZZLE COMPANY REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, ilike, gte, lte, inArray, desc, asc, count, isNull, sql } from 'drizzle-orm';
import { db, schemaManager } from '../../../../db';
import { companies } from '@shared/schema';
import { Company, CompanySize, CompanyStatus, SubscriptionTier } from '../../domain/entities/Company';
import {
  ICompanyRepository,
  CompanyFilters,
  PaginationOptions,
  CompanyListResult
} from '../../domain/repositories/ICompanyRepository';

// Assume these are defined elsewhere or imported appropriately
// import { sql } from 'drizzle-orm';
// import { schemaManager } from '../../../../shared/schemaManager'; // Assuming schemaManager is available
// interface CompanyFilter { search?: string; industry?: string; size?: string; status?: string; subscriptionTier?: string; isActive?: boolean; limit?: number; offset?: number; tenantId: string; }
// declare const sql: any; // Placeholder for actual sql import

export class DrizzleCompanyRepository implements ICompanyRepository {
  private logger = {
    error: (message: string, context?: any) => console.error(`[DrizzleCompanyRepository] ${message}`, context)
  };

  async findById(id: string): Promise<Company | null> {
    try {
      const result = await db
        .select()
        .from(companies)
        .where(eq(companies.id, id))
        .limit(1);

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error: any) {
      console.error('❌ [DrizzleCompanyRepository] findById error:', error);
      throw error;
    }
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Company | null> {
    try {
      console.log('🔍 [DrizzleCompanyRepository] findByIdAndTenant called:', { id, tenantId });

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql.raw(`
        SELECT 
          id, tenant_id as "tenantId", name, display_name as "displayName", 
          description, industry, size, email, phone, website, address,
          tax_id as "taxId", registration_number as "registrationNumber",
          subscription_tier as "subscriptionTier", contract_type as "contractType",
          max_users as "maxUsers", max_tickets as "maxTickets",
          settings, tags, metadata, status, is_active as "isActive",
          is_primary as "isPrimary", created_at as "createdAt", updated_at as "updatedAt",
          created_by as "createdBy", updated_by as "updatedBy"
        FROM "${schemaName}".companies
        WHERE id = ? AND tenant_id = ? AND is_active = true
        LIMIT 1
      `, [id, tenantId]));

      if (result.rows.length > 0) {
        console.log('✅ [DrizzleCompanyRepository] Company found:', result.rows[0]);
        return this.mapToEntity(result.rows[0]);
      }

      console.log('❌ [DrizzleCompanyRepository] Company not found');
      return null;
    } catch (error: any) {
      console.error('❌ [DrizzleCompanyRepository] findByIdAndTenant error:', error);
      throw error;
    }
  }

  async create(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const [result] = await db
      .insert(companies)
      .values({
        ...companyData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return this.mapToEntity(result);
  }

  async update(id: string, updates: Partial<Company>): Promise<Company> {
    const [result] = await db
      .update(companies)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(companies.id, id))
      .returning();

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await db
      .update(companies)
      .set({
        isActive: false,
        status: 'inactive' as CompanyStatus,
        updatedAt: new Date()
      })
      .where(eq(companies.id, id));
  }

  async findByCNPJ(cnpj: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.taxId, cnpj))
      .limit(1);

    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findByCNPJAndTenant(cnpj: string, tenantId: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.taxId, cnpj),
        eq(companies.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findByName(name: string, tenantId: string): Promise<Company[]> {
    const result = await db
      .select()
      .from(companies)
      .where(and(
        like(companies.name, `%${name}%`),
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true)
      ))
      .orderBy(asc(companies.name));

    return result.map(row => this.mapToEntity(row));
  }

  async findByEmail(email: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.email, email))
      .limit(1);

    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.email, email),
        eq(companies.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findWithFilters(
    filters: CompanyFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<CompanyListResult> {
    try {
      console.log('🔍 [DrizzleCompanyRepository] findWithFilters called with:', { filters, pagination, tenantId });

      const offset = (pagination.page - 1) * pagination.limit;
      const schemaName = schemaManager.getSchemaName(tenantId);
      const pool = schemaManager.getPool();

      console.log('🔍 [DrizzleCompanyRepository] Using tenant schema:', { schemaName, tenantId });

      // Build WHERE conditions for SQL query with proper schema reference
      const whereConditions: string[] = ['tenant_id = $1', 'is_active = $2'];
      const params: any[] = [tenantId, true];
      let paramIndex = 3;

      // Add dynamic filter conditions only if they have valid values
      if (filters.search && filters.search.trim()) {
        whereConditions.push(`(name ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex + 1})`);
        params.push(`%${filters.search.trim()}%`, `%${filters.search.trim()}%`);
        paramIndex += 2;
      }

      if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        const statusPlaceholders = filters.status.map((_, i) => `$${paramIndex + i}`).join(',');
        whereConditions.push(`status IN (${statusPlaceholders})`);
        params.push(...filters.status);
        paramIndex += filters.status.length;
      }

      if (filters.size && Array.isArray(filters.size) && filters.size.length > 0) {
        const sizePlaceholders = filters.size.map((_, i) => `$${paramIndex + i}`).join(',');
        whereConditions.push(`size IN (${sizePlaceholders})`);
        params.push(...filters.size);
        paramIndex += filters.size.length;
      }

      if (filters.name && filters.name.trim()) {
        whereConditions.push(`name ILIKE $${paramIndex}`);
        params.push(`%${filters.name.trim()}%`);
        paramIndex++;
      }

      if (filters.subscriptionTier && Array.isArray(filters.subscriptionTier) && filters.subscriptionTier.length > 0) {
        const tierPlaceholders = filters.subscriptionTier.map((_, i) => `$${paramIndex + i}`).join(',');
        whereConditions.push(`subscription_tier IN (${tierPlaceholders})`);
        params.push(...filters.subscriptionTier);
        paramIndex += filters.subscriptionTier.length;
      }

      const whereClause = whereConditions.join(' AND ');

      console.log('🔍 [DrizzleCompanyRepository] Query details:', {
        whereClause,
        paramsCount: params.length,
        schemaName
      });

      // Count total records using tenant schema
      const countQuery = `
        SELECT COUNT(*) as total
        FROM "${schemaName}".companies
        WHERE ${whereClause}
      `;

      const countResult = await pool.query(countQuery, params);
      const total = Number(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / pagination.limit);

      console.log('✅ [DrizzleCompanyRepository] Count query successful:', { total, totalPages });

      // Fetch paginated results using tenant schema - using actual column names
      const dataQuery = `
        SELECT 
          id, tenant_id as "tenantId", name, display_name as "displayName", 
          description, industry, size, email, phone, website, address,
          cnpj, city, state, zip_code as "zipCode", country,
          annual_revenue as "annualRevenue", employee_count as "employeeCount",
          subscription_tier as "subscriptionTier", status, is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt",
          created_by as "createdBy", updated_by as "updatedBy"
        FROM "${schemaName}".companies
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const finalParams = [...params, pagination.limit, offset];
      const results = await pool.query(dataQuery, finalParams);

      console.log('✅ [DrizzleCompanyRepository] Data query successful:', { rowsFound: results.rows.length });

      return {
        companies: results.rows.map(row => this.mapToEntity(row as any)),
        total,
        page: pagination.page,
        totalPages
      };

    } catch (error: any) {
      console.error('❌ [DrizzleCompanyRepository] findWithFilters error:', error);
      this.logger.error('Failed to find companies with filters', { error: error.message || 'Unknown error', filters, pagination, tenantId });
      throw new Error(`Failed to find companies with filters: ${error.message || 'Unknown error'}`);
    }
  }

  async searchCompanies(
    searchTerm: string,
    tenantId?: string,
    pagination?: PaginationOptions
  ): Promise<CompanyListResult> {
    const conditions = [];

    // Add tenant filter
    if (tenantId) {
      conditions.push(eq(companies.tenantId, tenantId));
    }

    // Add search conditions
    conditions.push(
      or(
        like(companies.name, `%${searchTerm}%`),
        like(companies.displayName, `%${searchTerm}%`),
        like(companies.taxId, `%${searchTerm}%`),
        like(companies.email, `%${searchTerm}%`),
        like(companies.phone, `%${searchTerm}%`)
      )
    );

    // Add active filter by default
    conditions.push(eq(companies.isActive, true));

    // Default pagination if not provided
    const paginationOptions: PaginationOptions = pagination || {
      page: 1,
      limit: 50,
      sortBy: 'name',
      sortOrder: 'asc'
    };

    const offset = (paginationOptions.page - 1) * paginationOptions.limit;

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(companies)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // Get search results
    const orderBy = this.buildOrderBy(paginationOptions.sortBy, paginationOptions.sortOrder);

    const result = await db
      .select()
      .from(companies)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(paginationOptions.limit)
      .offset(offset);

    const companiesData = result.map(row => this.mapToEntity(row));

    return {
      companies: companiesData,
      total,
      page: paginationOptions.page,
      totalPages: Math.ceil(total / paginationOptions.limit)
    };
  }

  async findByTenant(tenantId: string): Promise<Company[]> {
    try {
      console.log('🔍 [DrizzleCompanyRepository] findByTenant called:', { tenantId });

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", name, display_name as "displayName", 
          description, industry, size, email, phone, website, address,
          tax_id as "taxId", registration_number as "registrationNumber",
          subscription_tier as "subscriptionTier", contract_type as "contractType",
          max_users as "maxUsers", max_tickets as "maxTickets",
          settings, tags, metadata, status, is_active as "isActive",
          is_primary as "isPrimary", created_at as "createdAt", updated_at as "updatedAt",
          created_by as "createdBy", updated_by as "updatedBy"
        FROM "${sql.raw(schemaName)}".companies
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY name ASC
      `);

      console.log(`✅ [DrizzleCompanyRepository] Found ${result.rows.length} companies for tenant`);
      return result.rows.map(row => this.mapToEntity(row as any));
    } catch (error: any) {
      console.error('❌ [DrizzleCompanyRepository] findByTenant error:', error);
      throw error;
    }
  }

  async findByStatusAndTenant(status: CompanyStatus, tenantId: string): Promise<Company[]> {
    const result = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.status, status),
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true)
      ))
      .orderBy(asc(companies.name));

    return result.map(row => this.mapToEntity(row));
  }

  async findBySizeAndTenant(size: CompanySize, tenantId: string): Promise<Company[]> {
    const result = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.size, size),
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true)
      ))
      .orderBy(asc(companies.name));

    return result.map(row => this.mapToEntity(row));
  }

  async findBySubscriptionAndTenant(tier: SubscriptionTier, tenantId: string): Promise<Company[]> {
    const result = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.subscriptionTier, tier),
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true)
      ))
      .orderBy(asc(companies.name));

    return result.map(row => this.mapToEntity(row));
  }

  async findByLocationAndTenant(state?: string, city?: string, tenantId?: string): Promise<Company[]> {
    const conditions = [eq(companies.isActive, true)];

    if (tenantId) {
      conditions.push(eq(companies.tenantId, tenantId));
    }

    // Since location fields don't exist in the current schema,
    // we'll search in address field as a workaround
    if (state || city) {
      const locationTerm = [state, city].filter(Boolean).join(' ');
      conditions.push(like(companies.address, `%${locationTerm}%`));
    }

    const result = await db
      .select()
      .from(companies)
      .where(and(...conditions))
      .orderBy(asc(companies.name));

    return result.map(row => this.mapToEntity(row));
  }

  async getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    bySize: Record<CompanySize, number>;
    bySubscription: Record<SubscriptionTier, number>;
    byState: Record<string, number>;
    recentCompanies: number;
  }> {
    const baseConditions = tenantId ? [eq(companies.tenantId, tenantId)] : [];

    // Total companies
    const totalResult = await db
      .select({ count: count() })
      .from(companies)
      .where(and(...baseConditions, eq(companies.isActive, true)));

    // By status
    const statusResults = await db
      .select({
        status: companies.status,
        count: count()
      })
      .from(companies)
      .where(and(...baseConditions, eq(companies.isActive, true)))
      .groupBy(companies.status);

    // By size
    const sizeResults = await db
      .select({
        size: companies.size,
        count: count()
      })
      .from(companies)
      .where(and(...baseConditions, eq(companies.isActive, true)))
      .groupBy(companies.size);

    // By subscription
    const subscriptionResults = await db
      .select({
        tier: companies.subscriptionTier,
        count: count()
      })
      .from(companies)
      .where(and(...baseConditions, eq(companies.isActive, true)))
      .groupBy(companies.subscriptionTier);

    // By state - using address field since state field doesn't exist
    const stateResults: { state: string; count: number }[] = [];

    // Recent companies (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResult = await db
      .select({ count: count() })
      .from(companies)
      .where(and(
        ...baseConditions,
        eq(companies.isActive, true),
        gte(companies.createdAt, thirtyDaysAgo)
      ));

    // Process results
    const stats = {
      total: totalResult[0]?.count || 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      bySize: {} as Record<CompanySize, number>,
      bySubscription: {} as Record<SubscriptionTier, number>,
      byState: {} as Record<string, number>,
      recentCompanies: recentResult[0]?.count || 0
    };

    // Process status stats
    statusResults.forEach(row => {
      switch (row.status) {
        case 'active':
          stats.active = row.count;
          break;
        case 'inactive':
          stats.inactive = row.count;
          break;
        case 'suspended':
          stats.suspended = row.count;
          break;
      }
    });

    // Process size stats
    sizeResults.forEach(row => {
      if (row.size) {
        stats.bySize[row.size as keyof typeof stats.bySize] = row.count;
      }
    });

    // Process subscription stats
    subscriptionResults.forEach(row => {
      if (row.tier) {
        stats.bySubscription[row.tier as keyof typeof stats.bySubscription] = row.count;
      }
    });

    // Process state stats
    stateResults.forEach(row => {
      if (row.state) {
        stats.byState[row.state] = row.count;
      }
    });

    return stats;
  }

  async countByFilters(filters: CompanyFilters, tenantId?: string): Promise<number> {
    const conditions = this.buildFilterConditions(filters, tenantId);

    const result = await db
      .select({ count: count() })
      .from(companies)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async cnpjExists(cnpj: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(companies.taxId, cnpj),
      eq(companies.tenantId, tenantId),
      eq(companies.isActive, true)
    ];

    if (excludeId) {
      conditions.push(eq(companies.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(companies)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async emailExists(email: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(companies.email, email),
      eq(companies.tenantId, tenantId),
      eq(companies.isActive, true)
    ];

    if (excludeId) {
      conditions.push(eq(companies.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(companies)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async nameExists(name: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      like(companies.name, `%${name}%`),
      eq(companies.tenantId, tenantId),
      eq(companies.isActive, true)
    ];

    if (excludeId) {
      conditions.push(eq(companies.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(companies)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async bulkUpdate(ids: string[], updates: Partial<Company>): Promise<Company[]> {
    const result = await db
      .update(companies)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(inArray(companies.id, ids))
      .returning();

    return result.map(row => this.mapToEntity(row));
  }

  async bulkChangeStatus(ids: string[], status: CompanyStatus): Promise<Company[]> {
    return await this.bulkUpdate(ids, { status });
  }

  async findByIndustry(industry: string, tenantId: string): Promise<Company[]> {
    const result = await db
      .select()
      .from(companies)
      .where(and(
        like(companies.description, `%${industry}%`), // Use description field as substitute
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true)
      ))
      .orderBy(asc(companies.name));

    return result.map(row => this.mapToEntity(row));
  }

  // Integration methods (would require additional tables/joins in real implementation)
  async findCompaniesByCustomerCount(minCustomers: number, tenantId: string): Promise<Company[]> {
    // This would require a join with customer_company_relationships table
    // For now, return empty array as it requires additional schema
    return [];
  }

  async findExpiredSubscriptions(tenantId: string): Promise<Company[]> {
    // This would require subscription expiry logic
    // For now, return empty array as it requires additional business logic
    return [];
  }

  async findCompaniesForNotification(tenantId: string): Promise<Company[]> {
    // This would require notification criteria logic
    // For now, return empty array as it requires additional business logic
    return [];
  }

  async findRecentCompanies(tenantId: string, days: number): Promise<Company[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const result = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true),
        gte(companies.createdAt, daysAgo)
      ))
      .orderBy(desc(companies.createdAt));

    return result.map(row => this.mapToEntity(row));
  }

  async findCompaniesByCustomerIds(customerIds: string[], tenantId: string): Promise<Company[]> {
    // This would require customer-company relationship table
    // For now, return empty array as it requires additional schema
    return [];
  }

  async getCompanyCustomerCount(companyId: string, tenantId: string): Promise<number> {
    // This would require customer-company relationship table
    // For now, return 0 as placeholder
    return 0;
  }

  async getCompanyTicketCount(companyId: string, tenantId: string): Promise<number> {
    // This would require ticket-company relationship or ticket.companyId field
    // For now, return 0 as placeholder
    return 0;
  }

  // Helper methods
  private buildFilterConditions(filters: CompanyFilters, tenantId?: string): any[] {
    const conditions = [];

    // Tenant filter
    if (tenantId) {
      conditions.push(eq(companies.tenantId, tenantId));
    }

    // Basic filters
    if (filters.name) {
      conditions.push(like(companies.name, `%${filters.name}%`));
    }

    if (filters.cnpj) {
      conditions.push(eq(companies.taxId, filters.cnpj));
    }

    if (filters.industry) {
      conditions.push(like(companies.description, `%${filters.industry}%`));
    }

    if (filters.state || filters.city) {
      const locationTerm = [filters.state, filters.city].filter(Boolean).join(' ');
      conditions.push(like(companies.address, `%${locationTerm}%`));
    }

    // Array filters
    if (filters.size && filters.size.length > 0) {
      conditions.push(inArray(companies.size, filters.size));
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(companies.status, filters.status));
    }

    if (filters.subscriptionTier && filters.subscriptionTier.length > 0) {
      conditions.push(inArray(companies.subscriptionTier, filters.subscriptionTier));
    }

    // Boolean filters
    if (filters.isActive !== undefined) {
      conditions.push(eq(companies.isActive, filters.isActive));
    } else {
      // Default to active companies only
      conditions.push(eq(companies.isActive, true));
    }

    // Date filters
    if (filters.dateFrom) {
      conditions.push(gte(companies.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(companies.createdAt, filters.dateTo));
    }

    // General search
    if (filters.search) {
      conditions.push(
        or(
          like(companies.name, `%${filters.search}%`),
          like(companies.displayName, `%${filters.search}%`),
          like(companies.taxId, `%${filters.search}%`),
          like(companies.email, `%${filters.search}%`),
          like(companies.description, `%${filters.search}%`)
        )
      );
    }

    return conditions;
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): any {
    const orderFunction = sortOrder === 'desc' ? desc : asc;

    switch (sortBy) {
      case 'name':
        return orderFunction(companies.name);
      case 'status':
        return orderFunction(companies.status);
      case 'size':
        return orderFunction(companies.size);
      case 'industry':
        return orderFunction(companies.description);
      case 'createdAt':
        return orderFunction(companies.createdAt);
      case 'updatedAt':
        return orderFunction(companies.updatedAt);
      default:
        return orderFunction(companies.name);
    }
  }

  private mapToEntity(row: any): Company {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      displayName: row.displayName || row.name,
      description: row.description || '',
      cnpj: row.cnpj || '', // Using actual cnpj column
      industry: row.industry || '', // Using actual industry column
      size: row.size || 'medium',
      status: row.status || 'active',
      subscriptionTier: row.subscriptionTier || 'basic',
      email: row.email || '',
      phone: row.phone || '',
      website: row.website || '', // Using actual website column
      address: row.address || '',
      addressNumber: '',
      neighborhood: '',
      city: row.city || '', // Using actual city column from database
      state: row.state || '', // Using actual state column from database
      zipCode: row.zipCode || '', // Using actual zip_code column (mapped as zipCode)
      country: row.country || '', // Adding country from database
      annualRevenue: row.annualRevenue || 0, // Adding annualRevenue from database
      employeeCount: row.employeeCount || 0, // Adding employeeCount from database
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}
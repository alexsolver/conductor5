/**
 * INFRASTRUCTURE LAYER - DRIZZLE COMPANY REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull } from 'drizzle-orm';
import { db } from '../../../../db';
import { customer_companies } from '@shared/schema';
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

  async findById(id: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(customer_companies)
      .where(eq(customer_companies.id, id))
      .limit(1);

    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(customer_companies)
      .where(and(
        eq(customer_companies.id, id),
        eq(customer_companies.tenant_id, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async create(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const [result] = await db
      .insert(customer_companies)
      .values({
        ...companyData,
        created_at: new Date(),
        updated_at: new Date()
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
    tenantId?: string
  ): Promise<CompanyListResult> {
    const conditions = this.buildFilterConditions(filters, tenantId);
    const offset = (pagination.page - 1) * pagination.limit;

    // Count total records
    const totalResult = await db
      .select({ count: count() })
      .from(customer_companies)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);

    const result = await db
      .select()
      .from(customer_companies)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(pagination.limit)
      .offset(offset);

    const companiesData = result.map(row => this.mapToEntity(row));

    return {
      companies: companiesData,
      total,
      page: pagination.page,
      totalPages: Math.ceil(total / pagination.limit)
    };
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
    const result = await db
      .select()
      .from(customer_companies)
      .where(and(
        eq(customer_companies.tenant_id, tenantId),
        eq(customer_companies.is_active, true)
      ))
      .orderBy(asc(customer_companies.company_name));

    return result.map(row => this.mapToEntity(row));
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
      conditions.push(eq(customer_companies.tenant_id, tenantId));
    }

    // Basic filters
    if (filters.name) {
      conditions.push(like(customer_companies.company_name, `%${filters.name}%`));
    }

    if (filters.cnpj) {
      conditions.push(eq(customer_companies.cnpj, filters.cnpj));
    }

    if (filters.industry) {
      conditions.push(like(customer_companies.description, `%${filters.industry}%`));
    }

    if (filters.state || filters.city) {
      const locationTerm = [filters.state, filters.city].filter(Boolean).join(' ');
      conditions.push(like(customer_companies.address, `%${locationTerm}%`));
    }

    // Boolean filters
    if (filters.isActive !== undefined) {
      conditions.push(eq(customer_companies.is_active, filters.isActive));
    } else {
      // Default to active companies only
      conditions.push(eq(customer_companies.is_active, true));
    }

    // Date filters
    if (filters.dateFrom) {
      conditions.push(gte(customer_companies.created_at, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(customer_companies.created_at, filters.dateTo));
    }

    // General search
    if (filters.search) {
      conditions.push(
        or(
          like(customer_companies.company_name, `%${filters.search}%`),
          like(customer_companies.cnpj, `%${filters.search}%`),
          like(customer_companies.email, `%${filters.search}%`),
          like(customer_companies.description, `%${filters.search}%`)
        )
      );
    }

    return conditions;
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): any {
    const orderFunction = sortOrder === 'desc' ? desc : asc;

    switch (sortBy) {
      case 'name':
        return orderFunction(customer_companies.company_name);
      case 'industry':
        return orderFunction(customer_companies.description);
      case 'createdAt':
        return orderFunction(customer_companies.created_at);
      case 'updatedAt':
        return orderFunction(customer_companies.updated_at);
      default:
        return orderFunction(customer_companies.company_name);
    }
  }

  private mapToEntity(row: any): Company {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.company_name,
      displayName: row.company_name,
      description: row.description || '',
      cnpj: row.cnpj || '',
      industry: row.description || '',
      size: 'medium',
      status: 'active',
      subscriptionTier: 'basic',
      email: row.email || '',
      phone: row.phone || '',
      website: '',
      address: row.address || '',
      addressNumber: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
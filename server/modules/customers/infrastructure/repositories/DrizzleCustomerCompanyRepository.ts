/**
 * Drizzle Customer Company Repository Implementation
 * Clean Architecture - Infrastructure Layer
 * Implements ICustomerCompanyRepository using Drizzle ORM
 */

import { eq, and, ilike, count, sql, or } from 'drizzle-orm';
import { CustomerCompany } from '../../domain/entities/CustomerCompany';
import { CustomerCompanyMembership } from '../../domain/entities/CustomerCompanyMembership';
import { 
  ICustomerCompanyRepository, 
  CustomerCompanyFilter,
  CustomerCompanyMembershipFilter 
} from '../../domain/ports/ICustomerCompanyRepository';
import { getTenantSpecificSchema } from '@shared/schema/tenant-specific';
import { schemaManager } from '../../../../db';

// Types will be inferred dynamically from tenant schema

export class DrizzleCustomerCompanyRepository implements ICustomerCompanyRepository {
  
  // Customer Company Operations
  async findById(id: string, tenantId: string): Promise<CustomerCompany | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const result = await tenantDb
      .select()
      .from(tenantSchema.customerCompanies)
      .where(eq(tenantSchema.customerCompanies.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toCompanyDomainEntity(result[0], tenantId);
  }

  async findByName(name: string, tenantId: string): Promise<CustomerCompany | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const result = await tenantDb
      .select()
      .from(tenantSchema.customerCompanies)
      .where(eq(tenantSchema.customerCompanies.name, name))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toCompanyDomainEntity(result[0], tenantId);
  }

  async findMany(filter: CustomerCompanyFilter): Promise<CustomerCompany[]> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    let query = tenantDb.select().from(tenantSchema.customerCompanies);

    // Apply filters
    const conditions = [];

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(tenantSchema.customerCompanies.name, searchPattern),
          ilike(tenantSchema.customerCompanies.displayName, searchPattern),
          ilike(tenantSchema.customerCompanies.description, searchPattern),
          ilike(tenantSchema.customerCompanies.email, searchPattern)
        )!
      );
    }

    if (filter.industry) {
      conditions.push(eq(tenantSchema.customerCompanies.industry, filter.industry));
    }

    if (filter.size) {
      conditions.push(eq(tenantSchema.customerCompanies.size, filter.size));
    }

    if (filter.status) {
      conditions.push(eq(tenantSchema.customerCompanies.status, filter.status));
    }

    if (filter.subscriptionTier) {
      conditions.push(eq(tenantSchema.customerCompanies.subscriptionTier, filter.subscriptionTier));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanies.isActive, filter.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const results = await query;
    return results.map(result => this.toCompanyDomainEntity(result, filter.tenantId));
  }

  async save(company: CustomerCompany): Promise<CustomerCompany> {
    const tenantConnection = await schemaManager.getTenantDb(company.getTenantId());
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    const companyData = this.toCompanyPersistenceData(company);

    // Check if company exists
    const existingCompany = await this.findById(company.getId(), company.getTenantId());

    if (existingCompany) {
      // Update existing company
      const [updated] = await tenantDb
        .update(tenantSchema.customerCompanies)
        .set({
          ...companyData,
          updatedAt: new Date()
        })
        .where(eq(tenantSchema.customerCompanies.id, company.getId()))
        .returning();

      return this.toCompanyDomainEntity(updated, company.getTenantId());
    } else {
      // Insert new company
      const [inserted] = await tenantDb
        .insert(tenantSchema.customerCompanies)
        .values(companyData)
        .returning();

      return this.toCompanyDomainEntity(inserted, company.getTenantId());
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const result = await tenantDb
      .delete(tenantSchema.customerCompanies)
      .where(eq(tenantSchema.customerCompanies.id, id));

    return result.rowCount > 0;
  }

  async count(filter: Omit<CustomerCompanyFilter, 'limit' | 'offset'>): Promise<number> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const conditions = [];

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(tenantSchema.customerCompanies.name, searchPattern),
          ilike(tenantSchema.customerCompanies.displayName, searchPattern),
          ilike(tenantSchema.customerCompanies.description, searchPattern),
          ilike(tenantSchema.customerCompanies.email, searchPattern)
        )!
      );
    }

    if (filter.industry) {
      conditions.push(eq(tenantSchema.customerCompanies.industry, filter.industry));
    }

    if (filter.size) {
      conditions.push(eq(tenantSchema.customerCompanies.size, filter.size));
    }

    if (filter.status) {
      conditions.push(eq(tenantSchema.customerCompanies.status, filter.status));
    }

    if (filter.subscriptionTier) {
      conditions.push(eq(tenantSchema.customerCompanies.subscriptionTier, filter.subscriptionTier));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanies.isActive, filter.isActive));
    }

    let query = tenantDb
      .select({ count: count() })
      .from(tenantSchema.customerCompanies);
      
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Debug logging to see what SQL is generated
    const { logInfo } = await import('../../../utils/logger');
    logInfo('Executing count query for customer companies', { 
      tenantId: this.tenantId,
      tableName: 'customer_companies',
      conditionsCount: conditions.length
    });
    
    const result = await query;
    return result[0]?.count || 0;
  }

  // Customer Company Membership Operations
  // Note: Membership operations need tenantId to determine which schema to use
  async findMembershipById(id: string, tenantId: string): Promise<CustomerCompanyMembership | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const result = await tenantDb
      .select()
      .from(tenantSchema.customerCompanyMemberships)
      .where(eq(tenantSchema.customerCompanyMemberships.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toMembershipDomainEntity(result[0]);
  }

  async findMembershipsByCustomer(customerId: string, tenantId: string): Promise<CustomerCompanyMembership[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const results = await tenantDb
      .select()
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))
      .where(eq(tenantSchema.customerCompanyMemberships.customerId, customerId));

    return results.map(result => this.toMembershipDomainEntity(result.customer_company_memberships));
  }

  async findMembershipsByCompany(companyId: string, tenantId: string): Promise<CustomerCompanyMembership[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const results = await tenantDb
      .select()
      .from(tenantSchema.customerCompanyMemberships)
      .where(eq(tenantSchema.customerCompanyMemberships.companyId, companyId));

    return results.map(result => this.toMembershipDomainEntity(result.customer_company_memberships));
  }

  async findMemberships(filter: CustomerCompanyMembershipFilter): Promise<CustomerCompanyMembership[]> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    let query = tenantDb.select({
      membership: tenantSchema.customerCompanyMemberships,
    })
    .from(tenantSchema.customerCompanyMemberships)
    .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id));

    const conditions = [];

    if (filter.customerId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.customerId, filter.customerId));
    }

    if (filter.companyId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.companyId, filter.companyId));
    }

    if (filter.role) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.role, filter.role));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isActive, filter.isActive));
    }

    if (filter.isPrimary !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isPrimary, filter.isPrimary));
    }

    if (filter.department) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.department, filter.department));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const results = await query;
    return results.map(result => this.toMembershipDomainEntity(result.membership));
  }

  async saveMembership(membership: CustomerCompanyMembership, tenantId: string): Promise<CustomerCompanyMembership> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    const membershipData = this.toMembershipPersistenceData(membership);

    // Check if membership exists
    const existingMembership = await this.findMembershipById(membership.getId(), tenantId);

    if (existingMembership) {
      // Update existing membership
      const [updated] = await tenantDb
        .update(tenantSchema.customerCompanyMemberships)
        .set(membershipData)
        .where(eq(tenantSchema.customerCompanyMemberships.id, membership.getId()))
        .returning();

      return this.toMembershipDomainEntity(updated);
    } else {
      // Insert new membership
      const [inserted] = await tenantDb
        .insert(tenantSchema.customerCompanyMemberships)
        .values(membershipData)
        .returning();

      return this.toMembershipDomainEntity(inserted);
    }
  }

  async deleteMembership(customerId: string, companyId: string, tenantId: string): Promise<boolean> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const result = await tenantDb
      .delete(tenantSchema.customerCompanyMemberships)
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.customerId, customerId),
        eq(tenantSchema.customerCompanyMemberships.companyId, companyId)
      ));

    return result.rowCount > 0;
  }

  async countMemberships(filter: Omit<CustomerCompanyMembershipFilter, 'limit' | 'offset'>): Promise<number> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const conditions = [];

    if (filter.customerId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.customerId, filter.customerId));
    }

    if (filter.companyId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.companyId, filter.companyId));
    }

    if (filter.role) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.role, filter.role));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isActive, filter.isActive));
    }

    if (filter.isPrimary !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isPrimary, filter.isPrimary));
    }

    if (filter.department) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.department, filter.department));
    }

    let query = tenantDb
      .select({ count: count() })
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id));
      
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  // Special queries
  async findPrimaryCompanyByCustomer(customerId: string, tenantId: string): Promise<CustomerCompany | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const result = await tenantDb
      .select({
        company: tenantSchema.customerCompanies,
      })
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.customerId, customerId),
        eq(tenantSchema.customerCompanyMemberships.isPrimary, true),
        eq(tenantSchema.customerCompanyMemberships.isActive, true)
      ))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toCompanyDomainEntity(result[0].company, tenantId);
  }

  async findCompaniesByCustomer(customerId: string, tenantId: string): Promise<CustomerCompany[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const results = await tenantDb
      .select({
        company: tenantSchema.customerCompanies,
      })
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.customerId, customerId),
        eq(tenantSchema.customerCompanyMemberships.isActive, true)
      ));

    return results.map(result => this.toCompanyDomainEntity(result.company, tenantId));
  }

  async findCustomersByCompany(companyId: string, tenantId: string): Promise<{ customerId: string; role: string; title?: string }[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    const results = await tenantDb
      .select({
        customerId: tenantSchema.customerCompanyMemberships.customerId,
        role: tenantSchema.customerCompanyMemberships.role,
        title: tenantSchema.customerCompanyMemberships.title,
      })
      .from(tenantSchema.customerCompanyMemberships)
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.companyId, companyId),
        eq(tenantSchema.customerCompanyMemberships.isActive, true)
      ));

    return results.map(result => ({
      customerId: result.customerId,
      role: result.role || 'member',
      title: result.title || undefined,
    }));
  }

  async getCompanyStats(companyId: string, tenantId: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalTickets?: number;
    openTickets?: number;
  }> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId);
    const { db: tenantDb, schema: tenantSchema } = tenantConnection;
    
    // Get customer counts
    const customerStats = await tenantDb
      .select({
        total: count(),
        active: count(sql`CASE WHEN ${tenantSchema.customerCompanyMemberships.isActive} = true THEN 1 END`),
      })
      .from(tenantSchema.customerCompanyMemberships)
      .where(eq(tenantSchema.customerCompanyMemberships.companyId, companyId));

    return {
      totalCustomers: customerStats[0]?.total || 0,
      activeCustomers: customerStats[0]?.active || 0,
      // TODO: Add ticket stats when ticket-company relationships are implemented
    };
  }

  // Private mapping methods
  private toCompanyDomainEntity(data: any, tenantId?: string): CustomerCompany {
    return CustomerCompany.fromPersistence({
      id: data.id,
      tenantId: tenantId || data.tenant_id, // Pass tenantId from context or data
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      industry: data.industry,
      size: data.size,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address || {},
      taxId: data.tax_id,
      registrationNumber: data.registration_number,
      subscriptionTier: data.subscription_tier || 'basic',
      contractType: data.contract_type,
      maxUsers: data.max_users,
      maxTickets: data.max_tickets,
      settings: data.settings || {},
      tags: data.tags || [],
      metadata: data.metadata || {},
      status: data.status || 'active',
      isActive: data.is_active !== false,
      isPrimary: data.is_primary || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    });
  }

  private toCompanyPersistenceData(company: CustomerCompany): any {
    return {
      id: company.getId(),
      // tenantId not needed - we're already in tenant-specific schema
      name: company.getName(),
      display_name: company.getDisplayName(),
      description: company.getDescription(),
      industry: company.getIndustry(),
      size: company.getSize(),
      email: company.getEmail(),
      phone: company.getPhone(),
      website: company.getWebsite(),
      address: company.getAddress(),
      tax_id: company.getTaxId(),
      registration_number: company.getRegistrationNumber(),
      subscription_tier: company.getSubscriptionTier(),
      contract_type: company.getContractType(),
      max_users: company.getMaxUsers(),
      max_tickets: company.getMaxTickets(),
      settings: company.getSettings(),
      tags: company.getTags(),
      metadata: company.getMetadata(),
      status: company.getStatus(),
      is_active: company.isActiveCompany(),
      is_primary: company.isPrimaryCompany(),
      created_at: company.getCreatedAt(),
      updated_at: company.getUpdatedAt(),
      created_by: company.getCreatedBy(),
      updated_by: company.getUpdatedBy(),
    };
  }

  private toMembershipDomainEntity(data: any): CustomerCompanyMembership {
    return CustomerCompanyMembership.fromPersistence({
      id: data.id,
      customerId: data.customer_id,
      companyId: data.company_id,
      role: data.role || 'member',
      title: data.title,
      department: data.department,
      permissions: data.permissions || {},
      isActive: data.is_active !== false,
      isPrimary: data.is_primary || false,
      joinedAt: data.joined_at,
      leftAt: data.left_at,
      addedBy: data.added_by,
    });
  }

  private toMembershipPersistenceData(membership: CustomerCompanyMembership): any {
    return {
      id: membership.getId(),
      customer_id: membership.getCustomerId(),
      company_id: membership.getCompanyId(),
      role: membership.getRole(),
      title: membership.getTitle(),
      department: membership.getDepartment(),
      permissions: membership.getPermissions(),
      is_active: membership.isActiveMembership(),
      is_primary: membership.isPrimaryMembership(),
      joined_at: membership.getJoinedAt(),
      left_at: membership.getLeftAt(),
      added_by: membership.getAddedBy(),
    };
  }
}
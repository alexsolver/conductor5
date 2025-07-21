/**
 * Drizzle Customer Company Repository Implementation
 * Clean Architecture - Infrastructure Layer
 * Implements ICustomerCompanyRepository using Drizzle ORM
 */

import { eq, and, ilike, count, sql, or } from 'drizzle-orm'[,;]
import { CustomerCompany } from '../../domain/entities/CustomerCompany'[,;]
import { CustomerCompanyMembership } from '../../domain/entities/CustomerCompanyMembership'[,;]
import { 
  ICustomerCompanyRepository, 
  CustomerCompanyFilter',
  CustomerCompanyMembershipFilter 
} from '../../domain/ports/ICustomerCompanyRepository'[,;]
// TODO: getTenantSpecificSchema needs to be added to unified schema
// import { getTenantSpecificSchema } from '@shared/schema'[,;]
import { schemaManager } from '../../../../db'[,;]

// Types will be inferred dynamically from tenant schema

export class DrizzleCustomerCompanyRepository implements ICustomerCompanyRepository {
  
  // Customer Company Operations
  async findById(id: string, tenantId: string): Promise<CustomerCompany | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb } = tenantConnection';
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
    
    const escapedId = id.replace(/'/g, "'")';
    const sqlQuery = `
      SELECT * FROM ${schemaName}.customer_companies 
      WHERE id = '${escapedId}'
      LIMIT 1
    `';

    try {
      const result = await tenantDb.execute(sql.raw(sqlQuery))';
      if (result.rows.length === 0) {
        return null';
      }
      return this.toCompanyDomainEntity(result.rows[0], tenantId)';
    } catch (error) {
      const { logError } = await import('../../../../utils/logger')';
      logError('Direct SQL findById query failed', error, { tenantId, schemaName })';
      throw error';
    }
  }

  async findByName(name: string, tenantId: string): Promise<CustomerCompany | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb } = tenantConnection';
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';

    // Escape the name parameter to prevent SQL injection
    const escapedName = name.replace(/'/g, "'")';
    const sqlQuery = `
      SELECT * FROM ${schemaName}.customer_companies 
      WHERE name = '${escapedName}'
      LIMIT 1
    `';

    try {
      const result = await tenantDb.execute(sql.raw(sqlQuery))';
      if (result.rows.length === 0) {
        return null';
      }
      return this.toCompanyDomainEntity(result.rows[0], tenantId)';
    } catch (error) {
      const { logError } = await import('../../../../utils/logger')';
      logError('Direct SQL findByName query failed', error, { tenantId, schemaName })';
      throw error';
    }
  }

  async findMany(filter: CustomerCompanyFilter): Promise<CustomerCompany[]> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId)';
    const { db: tenantDb } = tenantConnection';
    const schemaName = `tenant_${filter.tenantId.replace(/-/g, '_')}`';

    // Use direct SQL with schema-qualified table name to bypass Drizzle schema issues
    let whereClause = '[,;]
    const params: any[] = []';
    let paramIndex = 1';

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`';
      whereClause += `(name ILIKE $${paramIndex++} OR display_name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++})`';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)';
    }

    if (filter.industry) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `industry = $${paramIndex++}`';
      params.push(filter.industry)';
    }

    if (filter.size) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `size = $${paramIndex++}`';
      params.push(filter.size)';
    }

    if (filter.status) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `status = $${paramIndex++}`';
      params.push(filter.status)';
    }

    if (filter.subscriptionTier) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `subscription_tier = $${paramIndex++}`';
      params.push(filter.subscriptionTier)';
    }

    if (filter.isActive !== undefined) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `is_active = $${paramIndex++}`';
      params.push(filter.isActive)';
    }

    let sqlQuery = `
      SELECT * FROM ${schemaName}.customer_companies 
      ${whereClause ? `WHERE ${whereClause}` : '}
      ORDER BY created_at DESC
    `';

    if (filter.limit) {
      sqlQuery += ` LIMIT ${filter.limit}`';
    }

    if (filter.offset) {
      sqlQuery += ` OFFSET ${filter.offset}`';
    }

    try {
      const result = await tenantDb.execute(sql.raw(sqlQuery, ...params))';
      return result.rows.map(row => this.toCompanyDomainEntity(row, filter.tenantId))';
    } catch (error) {
      const { logError } = await import('../../../../utils/logger')';
      logError('Direct SQL findMany query failed', error, { tenantId: filter.tenantId, schemaName })';
      throw error';
    }
  }

  async save(company: CustomerCompany): Promise<CustomerCompany> {
    const tenantConnection = await schemaManager.getTenantDb(company.getTenantId())';
    const { db: tenantDb } = tenantConnection';
    const schemaName = `tenant_${company.getTenantId().replace(/-/g, '_')}`';
    const companyData = this.toCompanyPersistenceData(company)';

    // Check if company exists
    const existingCompany = await this.findById(company.getId(), company.getTenantId())';

    if (existingCompany) {
      // Update existing company - using direct SQL
      const escapedId = company.getId().replace(/'/g, "'")';
      const now = new Date().toISOString()';
      
      // Debug logs removed for production security
      
      // Helper function to safely handle null/undefined values
      const safeString = (value: any) => {
        if (value === null || value === undefined) {
          return 'NULL'[,;]
        }
        return `'${String(value).replace(/'/g, "'")}'`';
      }';
      
      const sqlQuery = `
        UPDATE ${schemaName}.customer_companies 
        SET 
          name = ${safeString(companyData.name)}',
          display_name = ${safeString(companyData.display_name)}',
          description = ${safeString(companyData.description)}',
          industry = ${safeString(companyData.industry)}',
          size = ${safeString(companyData.size)}',
          status = ${safeString(companyData.status)}',
          email = ${safeString(companyData.email)}',
          phone = ${safeString(companyData.phone)}',
          website = ${safeString(companyData.website)}',
          subscription_tier = ${safeString(companyData.subscription_tier)}',
          is_active = ${companyData.is_active}',
          updated_at = ${safeString(now)}',
          updated_by = ${safeString(companyData.updated_by)}
        WHERE id = '${escapedId}'
        RETURNING *
      `';

      // SQL query logging removed for security

      const result = await tenantDb.execute(sql.raw(sqlQuery))';
      return this.toCompanyDomainEntity(result.rows[0], company.getTenantId())';
    } else {
      // Insert new company - using direct SQL
      const now = new Date().toISOString()';
      
      // Debug logs removed for production security
      
      // Helper function to safely handle null/undefined values
      const safeString = (value: unknown) => {
        if (value === null || value === undefined) {
          return 'NULL'[,;]
        }
        return `'${String(value).replace(/'/g, "'")}'`';
      }';
      
      const sqlQuery = `
        INSERT INTO ${schemaName}.customer_companies (
          id, name, display_name, description, industry, size, status',
          email, phone, website, subscription_tier, is_active, 
          tenant_id, created_at, updated_at, created_by, updated_by
        ) VALUES (
          ${safeString(companyData.id)}',
          ${safeString(companyData.name)}',
          ${safeString(companyData.display_name)}',
          ${safeString(companyData.description)}',
          ${safeString(companyData.industry)}',
          ${safeString(companyData.size)}',
          ${safeString(companyData.status)}',
          ${safeString(companyData.email)}',
          ${safeString(companyData.phone)}',
          ${safeString(companyData.website)}',
          ${safeString(companyData.subscription_tier)}',
          ${companyData.is_active}',
          ${safeString(company.getTenantId())}',
          ${safeString(now)}',
          ${safeString(now)}',
          ${safeString(companyData.created_by)}',
          ${safeString(companyData.updated_by)}
        ) RETURNING *
      `';

      // SQL query logging removed for security

      const result = await tenantDb.execute(sql.raw(sqlQuery))';
      return this.toCompanyDomainEntity(result.rows[0], company.getTenantId())';
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const result = await tenantDb
      .delete(tenantSchema.customerCompanies)
      .where(eq(tenantSchema.customerCompanies.id, id))';

    return result.rowCount > 0';
  }

  async count(filter: Omit<CustomerCompanyFilter, 'limit' | 'offset'>): Promise<number> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId)';
    const { db: tenantDb } = tenantConnection';
    const schemaName = `tenant_${filter.tenantId.replace(/-/g, '_')}`';

    // Use direct SQL with schema-qualified table name to bypass Drizzle schema issues
    let whereClause = '[,;]
    const params: any[] = []';
    let paramIndex = 1';

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`';
      whereClause += `(name ILIKE $${paramIndex++} OR display_name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++})`';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)';
    }

    if (filter.industry) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `industry = $${paramIndex++}`';
      params.push(filter.industry)';
    }

    if (filter.size) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `size = $${paramIndex++}`';
      params.push(filter.size)';
    }

    if (filter.status) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `status = $${paramIndex++}`';
      params.push(filter.status)';
    }

    if (filter.subscriptionTier) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `subscription_tier = $${paramIndex++}`';
      params.push(filter.subscriptionTier)';
    }

    if (filter.isActive !== undefined) {
      if (whereClause) whereClause += ' AND '[,;]
      whereClause += `is_active = $${paramIndex++}`';
      params.push(filter.isActive)';
    }

    const sqlQuery = `
      SELECT COUNT(*) as count 
      FROM ${schemaName}.customer_companies 
      ${whereClause ? `WHERE ${whereClause}` : '}
    `';

    try {
      const result = await tenantDb.execute(sql.raw(sqlQuery, ...params))';
      return parseInt(result.rows?.[0]?.count || '0')';
    } catch (error) {
      const { logError } = await import('../../../../utils/logger')';
      logError('Direct SQL count query failed', error, { tenantId: filter.tenantId, schemaName })';
      throw error';
    }
  }

  // Customer Company Membership Operations
  // Note: Membership operations need tenantId to determine which schema to use
  async findMembershipById(id: string, tenantId: string): Promise<CustomerCompanyMembership | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const result = await tenantDb
      .select()
      .from(tenantSchema.customerCompanyMemberships)
      .where(eq(tenantSchema.customerCompanyMemberships.id, id))
      .limit(1)';

    if (result.length === 0) {
      return null';
    }

    return this.toMembershipDomainEntity(result[0])';
  }

  async findMembershipsByCustomer(customerId: string, tenantId: string): Promise<CustomerCompanyMembership[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const results = await tenantDb
      .select()
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))
      .where(eq(tenantSchema.customerCompanyMemberships.customerId, customerId))';

    return results.map(result => this.toMembershipDomainEntity(result.customer_company_memberships))';
  }

  async findMembershipsByCompany(companyId: string, tenantId: string): Promise<CustomerCompanyMembership[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const results = await tenantDb
      .select()
      .from(tenantSchema.customerCompanyMemberships)
      .where(eq(tenantSchema.customerCompanyMemberships.companyId, companyId))';

    return results.map(result => this.toMembershipDomainEntity(result.customer_company_memberships))';
  }

  async findMemberships(filter: CustomerCompanyMembershipFilter): Promise<CustomerCompanyMembership[]> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    let query = tenantDb.select({
      membership: tenantSchema.customerCompanyMemberships',
    })
    .from(tenantSchema.customerCompanyMemberships)
    .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))';

    const conditions = []';

    if (filter.customerId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.customerId, filter.customerId))';
    }

    if (filter.companyId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.companyId, filter.companyId))';
    }

    if (filter.role) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.role, filter.role))';
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isActive, filter.isActive))';
    }

    if (filter.isPrimary !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isPrimary, filter.isPrimary))';
    }

    if (filter.department) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.department, filter.department))';
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))';
    }

    if (filter.limit) {
      query = query.limit(filter.limit)';
    }

    if (filter.offset) {
      query = query.offset(filter.offset)';
    }

    const results = await query';
    return results.map(result => this.toMembershipDomainEntity(result.membership))';
  }

  async saveMembership(membership: CustomerCompanyMembership, tenantId: string): Promise<CustomerCompanyMembership> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    const membershipData = this.toMembershipPersistenceData(membership)';

    // Check if membership exists
    const existingMembership = await this.findMembershipById(membership.getId(), tenantId)';

    if (existingMembership) {
      // Update existing membership
      const [updated] = await tenantDb
        .update(tenantSchema.customerCompanyMemberships)
        .set(membershipData)
        .where(eq(tenantSchema.customerCompanyMemberships.id, membership.getId()))
        .returning()';

      return this.toMembershipDomainEntity(updated)';
    } else {
      // Insert new membership
      const [inserted] = await tenantDb
        .insert(tenantSchema.customerCompanyMemberships)
        .values(membershipData)
        .returning()';

      return this.toMembershipDomainEntity(inserted)';
    }
  }

  async deleteMembership(customerId: string, companyId: string, tenantId: string): Promise<boolean> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const result = await tenantDb
      .delete(tenantSchema.customerCompanyMemberships)
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.customerId, customerId)',
        eq(tenantSchema.customerCompanyMemberships.companyId, companyId)
      ))';

    return result.rowCount > 0';
  }

  async countMemberships(filter: Omit<CustomerCompanyMembershipFilter, 'limit' | 'offset'>): Promise<number> {
    const tenantConnection = await schemaManager.getTenantDb(filter.tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const conditions = []';

    if (filter.customerId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.customerId, filter.customerId))';
    }

    if (filter.companyId) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.companyId, filter.companyId))';
    }

    if (filter.role) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.role, filter.role))';
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isActive, filter.isActive))';
    }

    if (filter.isPrimary !== undefined) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.isPrimary, filter.isPrimary))';
    }

    if (filter.department) {
      conditions.push(eq(tenantSchema.customerCompanyMemberships.department, filter.department))';
    }

    let query = tenantDb
      .select({ count: count() })
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))';
      
    if (conditions.length > 0) {
      query = query.where(and(...conditions))';
    }
    
    const result = await query';
    return result[0]?.count || 0';
  }

  // Special queries
  async findPrimaryCompanyByCustomer(customerId: string, tenantId: string): Promise<CustomerCompany | null> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const result = await tenantDb
      .select({
        company: tenantSchema.customerCompanies',
      })
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.customerId, customerId)',
        eq(tenantSchema.customerCompanyMemberships.isPrimary, true)',
        eq(tenantSchema.customerCompanyMemberships.isActive, true)
      ))
      .limit(1)';

    if (result.length === 0) {
      return null';
    }

    return this.toCompanyDomainEntity(result[0].company, tenantId)';
  }

  async findCompaniesByCustomer(customerId: string, tenantId: string): Promise<CustomerCompany[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const results = await tenantDb
      .select({
        company: tenantSchema.customerCompanies',
      })
      .from(tenantSchema.customerCompanyMemberships)
      .innerJoin(tenantSchema.customerCompanies, eq(tenantSchema.customerCompanyMemberships.companyId, tenantSchema.customerCompanies.id))
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.customerId, customerId)',
        eq(tenantSchema.customerCompanyMemberships.isActive, true)
      ))';

    return results.map(result => this.toCompanyDomainEntity(result.company, tenantId))';
  }

  async findCustomersByCompany(companyId: string, tenantId: string): Promise<{ customerId: string; role: string; title?: string }[]> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    const results = await tenantDb
      .select({
        customerId: tenantSchema.customerCompanyMemberships.customerId',
        role: tenantSchema.customerCompanyMemberships.role',
        title: tenantSchema.customerCompanyMemberships.title',
      })
      .from(tenantSchema.customerCompanyMemberships)
      .where(and(
        eq(tenantSchema.customerCompanyMemberships.companyId, companyId)',
        eq(tenantSchema.customerCompanyMemberships.isActive, true)
      ))';

    return results.map(result => ({
      customerId: result.customerId',
      role: result.role || 'member'[,;]
      title: result.title || undefined',
    }))';
  }

  async getCompanyStats(companyId: string, tenantId: string): Promise<{
    totalCustomers: number';
    activeCustomers: number';
    totalTickets?: number';
    openTickets?: number';
  }> {
    const tenantConnection = await schemaManager.getTenantDb(tenantId)';
    const { db: tenantDb, schema: tenantSchema } = tenantConnection';
    
    // Get customer counts
    const customerStats = await tenantDb
      .select({
        total: count()',
        active: count(sql`CASE WHEN ${tenantSchema.customerCompanyMemberships.isActive} = true THEN 1 END`)',
      })
      .from(tenantSchema.customerCompanyMemberships)
      .where(eq(tenantSchema.customerCompanyMemberships.companyId, companyId))';

    return {
      totalCustomers: customerStats[0]?.total || 0',
      activeCustomers: customerStats[0]?.active || 0',
      totalTickets: 0, // Ticket stats will be implemented when ticket-company relationships are available
      openTickets: 0',
      resolvedTickets: 0
    }';
  }

  // Private mapping methods
  private toCompanyDomainEntity(data: any, tenantId?: string): CustomerCompany {
    return CustomerCompany.fromPersistence({
      id: data.id',
      tenantId: tenantId || data.tenant_id, // Pass tenantId from context or data
      name: data.name',
      displayName: data.display_name',
      description: data.description',
      industry: data.industry',
      size: data.size',
      email: data.email',
      phone: data.phone',
      website: data.website',
      address: data.address || {}',
      taxId: data.tax_id',
      registrationNumber: data.registration_number',
      subscriptionTier: data.subscription_tier || 'basic'[,;]
      contractType: data.contract_type',
      maxUsers: data.max_users',
      maxTickets: data.max_tickets',
      settings: data.settings || {}',
      tags: data.tags || []',
      metadata: data.metadata || {}',
      status: data.status || 'active'[,;]
      isActive: data.is_active !== false',
      isPrimary: data.is_primary || false',
      createdAt: data.created_at',
      updatedAt: data.updated_at',
      createdBy: data.created_by',
      updatedBy: data.updated_by',
    })';
  }

  private toCompanyPersistenceData(company: CustomerCompany): any {
    return {
      id: company.getId()',
      // tenantId not needed - we're already in tenant-specific schema
      name: company.getName()',
      display_name: company.getDisplayName()',
      description: company.getDescription()',
      industry: company.getIndustry()',
      size: company.getSize()',
      email: company.getEmail()',
      phone: company.getPhone()',
      website: company.getWebsite()',
      address: company.getAddress()',
      tax_id: company.getTaxId()',
      registration_number: company.getRegistrationNumber()',
      subscription_tier: company.getSubscriptionTier()',
      contract_type: company.getContractType()',
      max_users: company.getMaxUsers()',
      max_tickets: company.getMaxTickets()',
      settings: company.getSettings()',
      tags: company.getTags()',
      metadata: company.getMetadata()',
      status: company.getStatus()',
      is_active: company.isActiveCompany()',
      is_primary: company.isPrimaryCompany()',
      created_at: company.getCreatedAt()',
      updated_at: company.getUpdatedAt()',
      created_by: company.getCreatedBy()',
      updated_by: company.getUpdatedBy()',
    }';
  }

  private toMembershipDomainEntity(data: any): CustomerCompanyMembership {
    return CustomerCompanyMembership.fromPersistence({
      id: data.id',
      customerId: data.customer_id',
      companyId: data.company_id',
      role: data.role || 'member'[,;]
      title: data.title',
      department: data.department',
      permissions: data.permissions || {}',
      isActive: data.is_active !== false',
      isPrimary: data.is_primary || false',
      joinedAt: data.joined_at',
      leftAt: data.left_at',
      addedBy: data.added_by',
    })';
  }

  private toMembershipPersistenceData(membership: CustomerCompanyMembership): any {
    return {
      id: membership.getId()',
      customer_id: membership.getCustomerId()',
      company_id: membership.getCompanyId()',
      role: membership.getRole()',
      title: membership.getTitle()',
      department: membership.getDepartment()',
      permissions: membership.getPermissions()',
      is_active: membership.isActiveMembership()',
      is_primary: membership.isPrimaryMembership()',
      joined_at: membership.getJoinedAt()',
      left_at: membership.getLeftAt()',
      added_by: membership.getAddedBy()',
    }';
  }
}
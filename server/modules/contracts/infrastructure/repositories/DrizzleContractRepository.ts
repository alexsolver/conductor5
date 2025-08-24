// ✅ 1QA.MD COMPLIANCE: Drizzle Contract Repository - Clean Architecture Infrastructure Layer
// Database implementation following exact patterns from existing modules

import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { eq, and, desc, asc, like, between, count, sum } from 'drizzle-orm';
import { Contract } from '../../domain/entities/Contract';
import { IContractRepository, ContractFilters, ContractSummary } from '../../domain/repositories/IContractRepository';
import { ContractStatus } from '../../domain/entities/Contract';
// Import auditLogs from materials-services schema where it's actually defined
import { auditLogs } from '@shared/schema-materials-services';
import { contracts, type Contract as ContractRecord, type InsertContract as InsertContractType } from '@shared/schema-contracts';

export class DrizzleContractRepository implements IContractRepository {
  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }
  
  // ✅ Basic CRUD Operations
  async findById(id: string, tenantId: string): Promise<Contract | null> {
    console.log(`🔍 [ContractRepository] Finding contract by ID: ${id} for tenant: ${tenantId}`);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.id, id),
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true)
      ))
      .limit(1);

    if (result.length === 0) return null;

    return this.toDomainEntity(result[0]);
  }

  async findAll(tenantId: string, filters?: ContractFilters): Promise<Contract[]> {
    console.log(`🔍 [ContractRepository] Finding all contracts for tenant: ${tenantId}`, filters);
    
    const tenantDb = await this.getTenantDb(tenantId);
    let query = tenantDb
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.tenantId, tenantId),
          eq(contracts.isActive, true)
        )
      );

    // Apply filters
    if (filters) {
      const conditions = [
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, filters.isActive ?? true)
      ];

      if (filters.status) {
        conditions.push(eq(contracts.status, filters.status));
      }

      if (filters.contractType) {
        conditions.push(eq(contracts.contractType, filters.contractType));
      }

      if (filters.priority) {
        conditions.push(eq(contracts.priority, filters.priority));
      }

      if (filters.customerCompanyId) {
        conditions.push(eq(contracts.customerCompanyId, filters.customerCompanyId));
      }

      if (filters.managerId) {
        conditions.push(eq(contracts.managerId, filters.managerId));
      }

      if (filters.locationId) {
        conditions.push(eq(contracts.locationId, filters.locationId));
      }

      if (filters.startDateFrom) {
        conditions.push(between(contracts.startDate, filters.startDateFrom.toISOString().split('T')[0], filters.startDateTo?.toISOString().split('T')[0] || '2099-12-31'));
      }

      if (filters.endDateFrom) {
        conditions.push(between(contracts.endDate, filters.endDateFrom.toISOString().split('T')[0], filters.endDateTo?.toISOString().split('T')[0] || '2099-12-31'));
      }

      if (filters.search) {
        conditions.push(
          like(contracts.title, `%${filters.search}%`)
        );
      }

      // Rebuild query with all conditions
      query = tenantDb
        .select()
        .from(contracts)
        .where(and(...conditions));
    }

    const result = await query.orderBy(desc(contracts.createdAt));

    return result.map(record => this.toDomainEntity(record));
  }

  async create(contract: Contract, tenantId: string): Promise<Contract> {
    console.log(`✅ [ContractRepository] Creating contract for tenant: ${tenantId}`);

    const contractData: InsertContractType = {
      id: contract.id,
      tenantId,
      contractNumber: contract.contractNumber,
      title: contract.title,
      contractType: contract.contractType,
      status: contract.status,
      priority: contract.priority,
      customerCompanyId: contract.customerCompanyId,
      managerId: contract.managerId,
      technicalManagerId: contract.technicalManagerId,
      locationId: contract.locationId,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
      renewalDate: contract.renewalDate?.toISOString().split('T')[0],
      totalValue: contract.totalValue?.toString(),
      monthlyValue: contract.monthlyValue?.toString(),
      currency: contract.currency,
      paymentTerms: contract.paymentTerms,
      description: contract.description,
      termsConditions: contract.termsConditions,
      autoRenewal: contract.autoRenewal,
      renewalPeriodMonths: contract.renewalPeriodMonths,
      metadata: contract.metadata,
      createdById: contract.createdById,
      updatedById: contract.updatedById,
      isActive: contract.isActive
    };

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .insert(contracts)
      .values(contractData)
      .returning();

    return this.toDomainEntity(result[0]);
  }

  async update(contract: Contract, tenantId: string): Promise<Contract> {
    console.log(`🔄 [ContractRepository] Updating contract: ${contract.id} for tenant: ${tenantId}`);

    const updateData = {
      title: contract.title,
      contractType: contract.contractType,
      status: contract.status,
      priority: contract.priority,
      customerCompanyId: contract.customerCompanyId,
      managerId: contract.managerId,
      technicalManagerId: contract.technicalManagerId,
      locationId: contract.locationId,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
      renewalDate: contract.renewalDate?.toISOString().split('T')[0],
      totalValue: contract.totalValue?.toString(),
      monthlyValue: contract.monthlyValue?.toString(),
      currency: contract.currency,
      paymentTerms: contract.paymentTerms,
      description: contract.description,
      termsConditions: contract.termsConditions,
      autoRenewal: contract.autoRenewal,
      renewalPeriodMonths: contract.renewalPeriodMonths,
      metadata: contract.metadata,
      updatedAt: new Date(),
      updatedById: contract.updatedById
    };

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .update(contracts)
      .set(updateData)
      .where(and(
        eq(contracts.id, contract.id),
        eq(contracts.tenantId, tenantId)
      ))
      .returning();

    return this.toDomainEntity(result[0]);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    console.log(`🗑️ [ContractRepository] Soft-deleting contract: ${id} for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    await tenantDb
      .update(contracts)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(contracts.id, id),
        eq(contracts.tenantId, tenantId)
      ));
  }

  // ✅ Business Queries
  async findByContractNumber(contractNumber: string, tenantId: string): Promise<Contract | null> {
    console.log(`🔍 [ContractRepository] Finding contract by number: ${contractNumber} for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.contractNumber, contractNumber),
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true)
      ))
      .limit(1);

    if (result.length === 0) return null;

    return this.toDomainEntity(result[0]);
  }

  async findExpiring(tenantId: string, daysThreshold: number = 30): Promise<Contract[]> {
    console.log(`📅 [ContractRepository] Finding expiring contracts for tenant: ${tenantId}, threshold: ${daysThreshold} days`);

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.status, 'active'),
        eq(contracts.isActive, true),
        between(contracts.endDate, new Date().toISOString().split('T')[0], thresholdDate.toISOString().split('T')[0])
      ))
      .orderBy(asc(contracts.endDate));

    return result.map(record => this.toDomainEntity(record));
  }

  async findByCustomer(customerCompanyId: string, tenantId: string): Promise<Contract[]> {
    console.log(`🏢 [ContractRepository] Finding contracts by customer: ${customerCompanyId} for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.customerCompanyId, customerCompanyId),
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true)
      ))
      .orderBy(desc(contracts.createdAt));

    return result.map(record => this.toDomainEntity(record));
  }

  async findByManager(managerId: string, tenantId: string): Promise<Contract[]> {
    console.log(`👤 [ContractRepository] Finding contracts by manager: ${managerId} for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.managerId, managerId),
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true)
      ))
      .orderBy(desc(contracts.createdAt));

    return result.map(record => this.toDomainEntity(record));
  }

  async findByStatus(status: ContractStatus, tenantId: string): Promise<Contract[]> {
    console.log(`📊 [ContractRepository] Finding contracts by status: ${status} for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.status, status),
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true)
      ))
      .orderBy(desc(contracts.createdAt));

    return result.map(record => this.toDomainEntity(record));
  }

  // ✅ Analytics & Reporting
  async getSummary(tenantId: string): Promise<ContractSummary> {
    console.log(`📈 [ContractRepository] Getting contract summary for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    const [totalResult] = await tenantDb
      .select({ 
        count: count(),
        totalValue: sum(contracts.totalValue)
      })
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true)
      ));

    const [activeResult] = await tenantDb
      .select({ count: count() })
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.status, 'active'),
        eq(contracts.isActive, true)
      ));

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 30);

    const [expiringResult] = await tenantDb
      .select({ count: count() })
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.status, 'active'),
        eq(contracts.isActive, true),
        between(contracts.endDate, new Date().toISOString().split('T')[0], thresholdDate.toISOString().split('T')[0])
      ));

    const [mrrResult] = await tenantDb
      .select({ totalMonthly: sum(contracts.monthlyValue) })
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.status, 'active'),
        eq(contracts.isActive, true)
      ));

    return {
      totalContracts: totalResult.count || 0,
      activeContracts: activeResult.count || 0,
      expiringSoonContracts: expiringResult.count || 0,
      totalValue: parseFloat(totalResult.totalValue || '0'),
      monthlyRecurringRevenue: parseFloat(mrrResult.totalMonthly || '0')
    };
  }

  async getContractsByMonth(tenantId: string, year: number): Promise<Record<string, number>> {
    console.log(`📅 [ContractRepository] Getting contracts by month for tenant: ${tenantId}, year: ${year}`);

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select({ 
        month: contracts.startDate,
        count: count()
      })
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true),
        between(contracts.startDate, startDate, endDate)
      ))
      .groupBy(contracts.startDate);

    const monthData: Record<string, number> = {};
    
    for (let month = 1; month <= 12; month++) {
      const monthKey = month.toString().padStart(2, '0');
      monthData[monthKey] = 0;
    }

    result.forEach(row => {
      if (row.month) {
        const month = new Date(row.month).getMonth() + 1;
        const monthKey = month.toString().padStart(2, '0');
        monthData[monthKey] = (monthData[monthKey] || 0) + (row.count || 0);
      }
    });

    return monthData;
  }

  async getRevenueByMonth(tenantId: string, year: number): Promise<Record<string, number>> {
    console.log(`💰 [ContractRepository] Getting revenue by month for tenant: ${tenantId}, year: ${year}`);

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb
      .select({ 
        month: contracts.startDate,
        revenue: sum(contracts.totalValue)
      })
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true),
        between(contracts.startDate, startDate, endDate)
      ))
      .groupBy(contracts.startDate);

    const monthData: Record<string, number> = {};
    
    for (let month = 1; month <= 12; month++) {
      const monthKey = month.toString().padStart(2, '0');
      monthData[monthKey] = 0;
    }

    result.forEach(row => {
      if (row.month && row.revenue) {
        const month = new Date(row.month).getMonth() + 1;
        const monthKey = month.toString().padStart(2, '0');
        monthData[monthKey] = (monthData[monthKey] || 0) + parseFloat(row.revenue);
      }
    });

    return monthData;
  }

  // ✅ Audit Trail (Required by 1qa.md)
  async createAuditEntry(
    tenantId: string,
    userId: string,
    action: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    console.log(`📝 [ContractRepository] Creating audit entry for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    await tenantDb.insert(auditLogs).values({
      tenantId,
      userId,
      action,
      entityType: 'contract',
      entityId,
      oldValues,
      newValues,
      createdAt: new Date()
    });
  }

  // ✅ Private helper methods
  private toDomainEntity(record: ContractRecord): Contract {
    return new Contract(
      record.id,
      record.tenantId,
      record.contractNumber,
      record.title,
      record.contractType,
      record.status || 'draft',
      record.priority || 'medium',
      record.customerCompanyId,
      record.managerId,
      record.technicalManagerId,
      record.locationId,
      new Date(record.startDate),
      new Date(record.endDate),
      record.renewalDate ? new Date(record.renewalDate) : null,
      record.totalValue ? parseFloat(record.totalValue) : null,
      record.monthlyValue ? parseFloat(record.monthlyValue) : null,
      record.currency || 'BRL',
      record.paymentTerms,
      record.description,
      record.termsConditions,
      record.autoRenewal || false,
      record.renewalPeriodMonths,
      record.metadata,
      record.createdAt || new Date(),
      record.updatedAt || new Date(),
      record.createdById,
      record.updatedById,
      record.isActive || true
    );
  }
}
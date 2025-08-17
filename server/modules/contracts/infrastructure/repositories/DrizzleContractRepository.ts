/**
 * DrizzleContractRepository - Implementação do repositório de contratos usando Drizzle ORM
 * Seguindo Clean Architecture e 1qa.md compliance
 */

import { sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { Contract, InsertContract } from '../../domain/entities/Contract';
import { 
  IContractRepository, 
  ContractFilters, 
  ContractListOptions 
} from '../../domain/repositories/IContractRepository';

export class DrizzleContractRepository implements IContractRepository {
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async create(tenantId: string, contractData: InsertContract): Promise<Contract> {
    console.log('🔧 [DrizzleContractRepository] Creating contract:', contractData.title);
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      INSERT INTO ${sql.identifier(schemaName)}.contracts (
        tenant_id, contract_number, title, contract_type, status, priority,
        customer_company_id, manager_id, technical_manager_id, location_id,
        start_date, end_date, renewal_date, total_value, monthly_value,
        currency, payment_terms, description, terms_conditions, auto_renewal,
        renewal_period_months, created_by_id, updated_by_id, is_active
      ) VALUES (
        ${tenantId}, ${contractData.contractNumber}, ${contractData.title}, 
        ${contractData.contractType}, ${contractData.status || 'draft'}, 
        ${contractData.priority || 'medium'}, ${contractData.customerCompanyId || null},
        ${contractData.managerId}, ${contractData.technicalManagerId || null}, 
        ${contractData.locationId || null}, ${contractData.startDate}, 
        ${contractData.endDate}, ${contractData.renewalDate || null}, 
        ${contractData.totalValue}, ${contractData.monthlyValue}, 
        ${contractData.currency || 'BRL'}, ${contractData.paymentTerms || 30}, 
        ${contractData.description || null}, ${contractData.termsConditions || null}, 
        ${contractData.autoRenewal || false}, ${contractData.renewalPeriodMonths || 12}, 
        ${contractData.createdById}, ${contractData.updatedById}, 
        ${contractData.isActive ?? true}
      ) RETURNING *
    `) as any;

    const newContract = result.rows[0];
    console.log('✅ [DrizzleContractRepository] Contract created:', newContract.id);
    return newContract;
  }

  async findById(tenantId: string, id: string): Promise<Contract | null> {
    console.log('🔍 [DrizzleContractRepository] Finding contract by ID:', id);
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.contracts 
      WHERE tenant_id = ${tenantId} AND id = ${id} AND is_active = true 
      LIMIT 1
    `) as any;
    
    return result.rows?.[0] || null;
  }

  async findByNumber(tenantId: string, contractNumber: string): Promise<Contract | null> {
    console.log('🔍 [DrizzleContractRepository] Finding contract by number:', contractNumber);
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.contracts 
      WHERE tenant_id = ${tenantId} AND contract_number = ${contractNumber} AND is_active = true 
      LIMIT 1
    `) as any;
    
    return result.rows?.[0] || null;
  }

  async findMany(
    tenantId: string, 
    filters: ContractFilters = {}, 
    options: ContractListOptions = {}
  ): Promise<{ contracts: Contract[], total: number, page: number, limit: number }> {
    console.log('🔍 [DrizzleContractRepository] Finding contracts with filters:', filters);
    
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const schemaName = this.getSchemaName(tenantId);
    
    // Query base
    let whereClause = `WHERE tenant_id = '${tenantId}' AND is_active = true`;
    
    // Aplicar filtros
    if (filters.status) {
      whereClause += ` AND status = '${filters.status}'`;
    }
    
    if (filters.contractType) {
      whereClause += ` AND contract_type = '${filters.contractType}'`;
    }
    
    if (filters.priority) {
      whereClause += ` AND priority = '${filters.priority}'`;
    }
    
    if (filters.managerId) {
      whereClause += ` AND manager_id = '${filters.managerId}'`;
    }
    
    if (filters.customerCompanyId) {
      whereClause += ` AND customer_company_id = '${filters.customerCompanyId}'`;
    }
    
    if (filters.search) {
      whereClause += ` AND (title ILIKE '%${filters.search}%' OR contract_number ILIKE '%${filters.search}%' OR description ILIKE '%${filters.search}%')`;
    }
    
    if (filters.startDateFrom) {
      whereClause += ` AND start_date >= '${filters.startDateFrom}'`;
    }
    
    if (filters.startDateTo) {
      whereClause += ` AND start_date <= '${filters.startDateTo}'`;
    }
    
    if (filters.endDateFrom) {
      whereClause += ` AND end_date >= '${filters.endDateFrom}'`;
    }
    
    if (filters.endDateTo) {
      whereClause += ` AND end_date <= '${filters.endDateTo}'`;
    }
    
    if (filters.totalValueMin) {
      whereClause += ` AND total_value >= ${filters.totalValueMin}`;
    }
    
    if (filters.totalValueMax) {
      whereClause += ` AND total_value <= ${filters.totalValueMax}`;
    }
    
    const offset = (page - 1) * limit;
    const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.contracts 
      ${sql.raw(whereClause)}
      ${sql.raw(orderClause)}
      LIMIT ${limit} OFFSET ${offset}
    `) as any;
    
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(schemaName)}.contracts 
      ${sql.raw(whereClause)}
    `) as any;
    
    const contracts = result.rows || [];
    const total = parseInt(countResult.rows?.[0]?.count || '0');
    
    console.log(`✅ [DrizzleContractRepository] Found ${contracts.length} contracts`);
    
    return {
      contracts,
      total,
      page,
      limit
    };
  }

  async findByCustomer(tenantId: string, customerCompanyId: string): Promise<Contract[]> {
    console.log('🔍 [DrizzleContractRepository] Finding contracts by customer:', customerCompanyId);
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.contracts 
      WHERE tenant_id = ${tenantId} AND customer_company_id = ${customerCompanyId} AND is_active = true
      ORDER BY created_at DESC
    `) as any;

    return result.rows || [];
  }

  async findByManager(tenantId: string, managerId: string): Promise<Contract[]> {
    console.log('🔍 [DrizzleContractRepository] Finding contracts by manager:', managerId);
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.contracts 
      WHERE tenant_id = ${tenantId} AND manager_id = ${managerId} AND is_active = true
      ORDER BY created_at DESC
    `) as any;

    return result.rows || [];
  }

  async findExpiringSoon(tenantId: string, days: number): Promise<Contract[]> {
    console.log('🔍 [DrizzleContractRepository] Finding contracts expiring in', days, 'days');
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.contracts 
      WHERE tenant_id = ${tenantId} AND is_active = true
      AND end_date BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
      ORDER BY end_date ASC
    `) as any;

    return result.rows || [];
  }

  async findByStatus(tenantId: string, status: string): Promise<Contract[]> {
    console.log('🔍 [DrizzleContractRepository] Finding contracts by status:', status);
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.contracts 
      WHERE tenant_id = ${tenantId} AND status = ${status} AND is_active = true
      ORDER BY created_at DESC
    `) as any;

    return result.rows || [];
  }

  async update(tenantId: string, id: string, updateData: Partial<InsertContract>, updatedBy: string): Promise<Contract> {
    console.log('🔧 [DrizzleContractRepository] Updating contract:', id);
    
    const schemaName = this.getSchemaName(tenantId);
    
    // Construir cláusula SET dinamicamente
    const setFields = [];
    if (updateData.title) setFields.push(`title = '${updateData.title}'`);
    if (updateData.status) setFields.push(`status = '${updateData.status}'`);
    if (updateData.priority) setFields.push(`priority = '${updateData.priority}'`);
    if (updateData.description) setFields.push(`description = '${updateData.description}'`);
    if (updateData.totalValue) setFields.push(`total_value = ${updateData.totalValue}`);
    if (updateData.monthlyValue) setFields.push(`monthly_value = ${updateData.monthlyValue}`);
    if (updateData.endDate) setFields.push(`end_date = '${updateData.endDate}'`);
    
    setFields.push(`updated_by_id = '${updatedBy}'`);
    setFields.push(`updated_at = NOW()`);
    
    const setClause = setFields.join(', ');
    
    const result = await db.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.contracts 
      SET ${sql.raw(setClause)}
      WHERE tenant_id = ${tenantId} AND id = ${id}
      RETURNING *
    `) as any;

    const updatedContract = result.rows[0];
    console.log('✅ [DrizzleContractRepository] Contract updated:', updatedContract.id);
    return updatedContract;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    console.log('🗑️ [DrizzleContractRepository] Soft deleting contract:', id);
    
    const schemaName = this.getSchemaName(tenantId);
    await db.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.contracts 
      SET is_active = false, updated_at = NOW()
      WHERE tenant_id = ${tenantId} AND id = ${id}
    `);

    console.log('✅ [DrizzleContractRepository] Contract soft deleted');
  }

  async count(tenantId: string, filters: ContractFilters = {}): Promise<number> {
    console.log('🔍 [DrizzleContractRepository] Counting contracts with filters:', filters);
    
    const schemaName = this.getSchemaName(tenantId);
    let whereClause = `WHERE tenant_id = '${tenantId}' AND is_active = true`;
    
    // Aplicar filtros (mesmo lógica do findMany)
    if (filters.status) {
      whereClause += ` AND status = '${filters.status}'`;
    }
    
    if (filters.contractType) {
      whereClause += ` AND contract_type = '${filters.contractType}'`;
    }
    
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(schemaName)}.contracts 
      ${sql.raw(whereClause)}
    `) as any;

    return parseInt(result.rows?.[0]?.count || '0');
  }

  async generateContractNumber(tenantId: string, year: number): Promise<string> {
    console.log('🔢 [DrizzleContractRepository] Generating contract number for year:', year);
    
    const schemaName = this.getSchemaName(tenantId);
    const result = await db.execute(sql`
      SELECT COUNT(*) + 1 as next_number FROM ${sql.identifier(schemaName)}.contracts 
      WHERE tenant_id = ${tenantId} AND EXTRACT(YEAR FROM created_at) = ${year}
    `) as any;

    const nextNumber = parseInt(result.rows?.[0]?.next_number || '1');
    const contractNumber = `CONT-${year}-${nextNumber.toString().padStart(4, '0')}`;
    
    console.log('✅ [DrizzleContractRepository] Generated contract number:', contractNumber);
    return contractNumber;
  }

  async getFinancialSummary(tenantId: string, filters: ContractFilters = {}): Promise<{
    totalValue: number;
    monthlyRecurring: number;
    averageValue: number;
    totalContracts: number;
  }> {
    console.log('📊 [DrizzleContractRepository] Getting financial summary');
    
    const schemaName = this.getSchemaName(tenantId);
    let whereClause = `WHERE tenant_id = '${tenantId}' AND is_active = true`;
    
    // Aplicar filtros
    if (filters.status) {
      whereClause += ` AND status = '${filters.status}'`;
    }
    
    const result = await db.execute(sql`
      SELECT 
        COALESCE(SUM(total_value), 0) as total_value,
        COALESCE(SUM(monthly_value), 0) as monthly_recurring,
        COALESCE(AVG(total_value), 0) as average_value,
        COUNT(*) as total_contracts
      FROM ${sql.identifier(schemaName)}.contracts 
      ${sql.raw(whereClause)}
    `) as any;

    const summary = result.rows?.[0] || {
      total_value: 0,
      monthly_recurring: 0,
      average_value: 0,
      total_contracts: 0
    };

    return {
      totalValue: parseFloat(summary.total_value || '0'),
      monthlyRecurring: parseFloat(summary.monthly_recurring || '0'),
      averageValue: parseFloat(summary.average_value || '0'),
      totalContracts: parseInt(summary.total_contracts || '0')
    };
  }
}
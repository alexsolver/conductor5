import { schemaManager } from '../db';

export class ContractRepository {
  // ========================================
  // CONTRACTS CRUD OPERATIONS
  // ========================================
  
  async createContract(data: any, tenantId: string, userId: string) {
    // Generate contract number automatically
    const contractNumber = await this.generateContractNumber(tenantId);
    
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `INSERT INTO "${schemaName}"."contracts" 
       (tenant_id, contract_number, title, contract_type, status, priority, total_value, currency, start_date, end_date, customer_company_id, manager_id, description, created_by_id, updated_by_id, created_at, updated_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
       RETURNING *`,
      [tenantId, contractNumber, data.title, data.contractType, data.status, data.priority, data.totalValue, data.currency, data.startDate, data.endDate, data.customerCompanyId, data.managerId, data.description, userId, userId]
    );
    
    return result.rows[0];
  }

  private async generateContractNumber(tenantId: string): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const pool = schemaManager.getPool();
      const schemaName = schemaManager.getSchemaName(tenantId);
      
      // Get the count of contracts for this year
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM "${schemaName}"."contracts" 
         WHERE tenant_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
        [tenantId, currentYear]
      );
      
      const nextNumber = (parseInt(result.rows[0]?.count) || 0) + 1;
      return `CTR-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating contract number:', error);
      // Fallback to timestamp-based number if query fails
      const timestamp = Date.now().toString().slice(-6);
      return `CTR-${new Date().getFullYear()}-${timestamp}`;
    }
  }
  
  async getContracts(tenantId: string, filters?: {
    status?: string;
    contractType?: string;
    priority?: string;
    customerId?: string;
    managerId?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    let whereConditions = [`tenant_id = $1`];
    let values: any[] = [tenantId];
    let paramIndex = 2;
    
    if (filters?.status) {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.contractType) {
      whereConditions.push(`contract_type = $${paramIndex}`);
      values.push(filters.contractType);
      paramIndex++;
    }
    
    if (filters?.priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      values.push(filters.priority);
      paramIndex++;
    }
    
    if (filters?.customerId) {
      whereConditions.push(`customer_company_id = $${paramIndex}`);
      values.push(filters.customerId);
      paramIndex++;
    }
    
    if (filters?.managerId) {
      whereConditions.push(`manager_id = $${paramIndex}`);
      values.push(filters.managerId);
      paramIndex++;
    }
    
    if (filters?.searchTerm) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR contract_number ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      values.push(`%${filters.searchTerm}%`);
      paramIndex++;
    }
    
    let query = `SELECT * FROM "${schemaName}"."contracts" WHERE ${whereConditions.join(' AND ')} ORDER BY created_at DESC`;
    
    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;
    }
    
    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(filters.offset);
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  }
  
  async getContractById(id: string, tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `SELECT * FROM "${schemaName}"."contracts" WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    
    return result.rows[0] || null;
  }
  
  async updateContract(id: string, data: any, tenantId: string, userId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `UPDATE "${schemaName}"."contracts" 
       SET title = $3, contract_type = $4, status = $5, priority = $6, total_value = $7, currency = $8,
           start_date = $9, end_date = $10, customer_company_id = $11, manager_id = $12, description = $13,
           updated_by_id = $14, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2 
       RETURNING *`,
      [id, tenantId, data.title, data.contractType, data.status, data.priority, data.totalValue, data.currency, data.startDate, data.endDate, data.customerCompanyId, data.managerId, data.description, userId]
    );
    
    return result.rows[0];
  }
  
  async deleteContract(id: string, tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `UPDATE "${schemaName}"."contracts" SET is_active = false WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );
    
    return result.rows[0];
  }
  
  // ========================================
  // CONTRACT SLA OPERATIONS
  // ========================================
  
  async createContractSla(data: any, tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `INSERT INTO "${schemaName}"."contract_slas" (tenant_id, contract_id, service_name, target_resolution_time, penalty_amount, created_at, updated_at, is_active)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true) RETURNING *`,
      [tenantId, data.contractId, data.serviceName, data.targetResolutionTime, data.penaltyAmount]
    );
    
    return result.rows[0];
  }
  
  async getContractSlas(contractId: string, tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `SELECT * FROM "${schemaName}"."contract_slas" 
       WHERE contract_id = $1 AND tenant_id = $2 AND is_active = true 
       ORDER BY created_at DESC`,
      [contractId, tenantId]
    );
    
    return result.rows;
  }
  
  async updateContractSla(id: string, data: any, tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `UPDATE "${schemaName}"."contract_slas" 
       SET service_name = $3, target_resolution_time = $4, penalty_amount = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, data.serviceName, data.targetResolutionTime, data.penaltyAmount]
    );
    
    return result.rows[0];
  }
  
  async deleteContractSla(id: string, tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `UPDATE "${schemaName}"."contract_slas" SET is_active = false WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );
    
    return result.rows[0];
  }
  
  // ========================================
  // CONTRACT SERVICES OPERATIONS
  // ========================================
  
  async createContractService(data: any, tenantId: string) {
    const serviceData = {
      ...data,
      tenantId,
    };
    
    const [newService] = await db
      .insert(contractServices)
      .values(serviceData)
      .returning();
    
    return newService;
  }
  
  async getContractServices(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractServices)
      .where(and(eq(contractServices.contractId, contractId), eq(contractServices.tenantId, tenantId)))
      .orderBy(desc(contractServices.createdAt));
  }
  
  async updateContractService(id: string, data: any, tenantId: string) {
    const [updatedService] = await db
      .update(contractServices)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractServices.id, id), eq(contractServices.tenantId, tenantId)))
      .returning();
    
    return updatedService;
  }
  
  async deleteContractService(id: string, tenantId: string) {
    const [deletedService] = await db
      .update(contractServices)
      .set({ isActive: false })
      .where(and(eq(contractServices.id, id), eq(contractServices.tenantId, tenantId)))
      .returning();
    
    return deletedService;
  }
  
  // ========================================
  // CONTRACT DOCUMENTS OPERATIONS
  // ========================================
  
  async createContractDocument(data: any, tenantId: string, userId: string) {
    const documentData = {
      ...data,
      tenantId,
      uploadedById: userId,
    };
    
    const [newDocument] = await db
      .insert(contractDocuments)
      .values(documentData)
      .returning();
    
    return newDocument;
  }
  
  async getContractDocuments(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractDocuments)
      .where(and(eq(contractDocuments.contractId, contractId), eq(contractDocuments.tenantId, tenantId)))
      .orderBy(desc(contractDocuments.createdAt));
  }
  
  async updateContractDocument(id: string, data: any, tenantId: string) {
    const [updatedDocument] = await db
      .update(contractDocuments)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractDocuments.id, id), eq(contractDocuments.tenantId, tenantId)))
      .returning();
    
    return updatedDocument;
  }
  
  async deleteContractDocument(id: string, tenantId: string) {
    const [deletedDocument] = await db
      .update(contractDocuments)
      .set({ isActive: false })
      .where(and(eq(contractDocuments.id, id), eq(contractDocuments.tenantId, tenantId)))
      .returning();
    
    return deletedDocument;
  }
  
  // ========================================
  // CONTRACT RENEWAL OPERATIONS
  // ========================================
  
  async createContractRenewal(data: any, tenantId: string, userId: string) {
    const renewalData = {
      ...data,
      tenantId,
      requestedById: userId,
    };
    
    const [newRenewal] = await db
      .insert(contractRenewals)
      .values(renewalData)
      .returning();
    
    return newRenewal;
  }
  
  async getContractRenewals(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractRenewals)
      .where(and(eq(contractRenewals.contractId, contractId), eq(contractRenewals.tenantId, tenantId)))
      .orderBy(desc(contractRenewals.renewalDate));
  }
  
  async updateContractRenewal(id: string, data: any, tenantId: string) {
    const [updatedRenewal] = await db
      .update(contractRenewals)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractRenewals.id, id), eq(contractRenewals.tenantId, tenantId)))
      .returning();
    
    return updatedRenewal;
  }
  
  // ========================================
  // CONTRACT BILLING OPERATIONS
  // ========================================
  
  async createContractBilling(data: any, tenantId: string, userId: string) {
    const billingData = {
      ...data,
      tenantId,
      generatedById: userId,
    };
    
    const [newBilling] = await db
      .insert(contractBilling)
      .values(billingData)
      .returning();
    
    return newBilling;
  }
  
  async getContractBilling(contractId: string, tenantId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    paymentStatus?: string;
  }) {
    const whereConditions: any[] = [
      eq(contractBilling.contractId, contractId),
      eq(contractBilling.tenantId, tenantId)
    ];
    
    if (filters?.startDate && filters?.endDate) {
      whereConditions.push(between(contractBilling.billingPeriodStart, filters.startDate, filters.endDate));
    }
    
    if (filters?.paymentStatus) {
      whereConditions.push(eq(contractBilling.paymentStatus, filters.paymentStatus));
    }
    
    return await db
      .select()
      .from(contractBilling)
      .where(and(...whereConditions))
      .orderBy(desc(contractBilling.billingPeriodStart));
  }
  
  async updateContractBilling(id: string, data: any, tenantId: string) {
    const [updatedBilling] = await db
      .update(contractBilling)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractBilling.id, id), eq(contractBilling.tenantId, tenantId)))
      .returning();
    
    return updatedBilling;
  }
  
  // ========================================
  // CONTRACT EQUIPMENT OPERATIONS
  // ========================================
  
  async createContractEquipment(data: any, tenantId: string) {
    const equipmentData = {
      ...data,
      tenantId,
    };
    
    const [newEquipment] = await db
      .insert(contractEquipment)
      .values(equipmentData)
      .returning();
    
    return newEquipment;
  }
  
  async getContractEquipment(contractId: string, tenantId: string) {
    return await db
      .select()
      .from(contractEquipment)
      .where(and(eq(contractEquipment.contractId, contractId), eq(contractEquipment.tenantId, tenantId)))
      .orderBy(desc(contractEquipment.createdAt));
  }
  
  async updateContractEquipment(id: string, data: any, tenantId: string) {
    const [updatedEquipment] = await db
      .update(contractEquipment)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contractEquipment.id, id), eq(contractEquipment.tenantId, tenantId)))
      .returning();
    
    return updatedEquipment;
  }
  
  async deleteContractEquipment(id: string, tenantId: string) {
    const [deletedEquipment] = await db
      .update(contractEquipment)
      .set({ isActive: false })
      .where(and(eq(contractEquipment.id, id), eq(contractEquipment.tenantId, tenantId)))
      .returning();
    
    return deletedEquipment;
  }
  
  // ========================================
  // DASHBOARD AND ANALYTICS
  // ========================================
  
  async getContractStats(tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const totalContracts = await pool.query(
      `SELECT COUNT(*) as count FROM "${schemaName}"."contracts" WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );
    
    const activeContracts = await pool.query(
      `SELECT COUNT(*) as count FROM "${schemaName}"."contracts" WHERE tenant_id = $1 AND status = 'active' AND is_active = true`,
      [tenantId]
    );
    
    const contractsNearRenewal = await pool.query(
      `SELECT COUNT(*) as count FROM "${schemaName}"."contracts" 
       WHERE tenant_id = $1 AND is_active = true AND renewal_date <= NOW() + INTERVAL '30 days'`,
      [tenantId]
    );
    
    const totalValue = await pool.query(
      `SELECT COALESCE(SUM(total_value), 0) as sum FROM "${schemaName}"."contracts" 
       WHERE tenant_id = $1 AND status = 'active' AND is_active = true`,
      [tenantId]
    );
    
    const monthlyRecurring = await pool.query(
      `SELECT COALESCE(SUM(monthly_value), 0) as sum FROM "${schemaName}"."contracts" 
       WHERE tenant_id = $1 AND status = 'active' AND is_active = true`,
      [tenantId]
    );
    
    return {
      totalContracts: parseInt(totalContracts.rows[0]?.count) || 0,
      activeContracts: parseInt(activeContracts.rows[0]?.count) || 0,
      contractsNearRenewal: parseInt(contractsNearRenewal.rows[0]?.count) || 0,
      totalValue: parseFloat(totalValue.rows[0]?.sum) || 0,
      monthlyRecurring: parseFloat(monthlyRecurring.rows[0]?.sum) || 0,
    };
  }
  
  async getContractsByStatus(tenantId: string) {
    return await db
      .select({
        status: contracts.status,
        count: sql<number>`COUNT(*)`
      })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.isActive, true)))
      .groupBy(contracts.status);
  }
  
  async getContractsByType(tenantId: string) {
    return await db
      .select({
        contractType: contracts.contractType,
        count: sql<number>`COUNT(*)`
      })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.isActive, true)))
      .groupBy(contracts.contractType);
  }
  
  async getUpcomingRenewals(tenantId: string, days: number = 30) {
    return await db
      .select()
      .from(contracts)
      .where(and(
        eq(contracts.tenantId, tenantId),
        eq(contracts.isActive, true),
        sql`${contracts.renewalDate} <= NOW() + INTERVAL '${days} days'`
      ))
      .orderBy(asc(contracts.renewalDate));
  }
}
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
    
    if (filters?.status && filters.status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.contractType && filters.contractType !== 'all') {
      whereConditions.push(`contract_type = $${paramIndex}`);
      values.push(filters.contractType);
      paramIndex++;
    }
    
    if (filters?.priority && filters.priority !== 'all') {
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
    
    let query = `SELECT * FROM "${schemaName}"."contracts" WHERE ${whereConditions.join(' AND ')} AND is_active = true ORDER BY created_at DESC`;
    
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
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `SELECT status, COUNT(*) as count FROM "${schemaName}"."contracts" 
       WHERE tenant_id = $1 AND is_active = true 
       GROUP BY status`,
      [tenantId]
    );
    
    return result.rows;
  }
  
  async getContractsByType(tenantId: string) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `SELECT contract_type, COUNT(*) as count FROM "${schemaName}"."contracts" 
       WHERE tenant_id = $1 AND is_active = true 
       GROUP BY contract_type`,
      [tenantId]
    );
    
    return result.rows;
  }
  
  async getUpcomingRenewals(tenantId: string, days: number = 30) {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    const result = await pool.query(
      `SELECT * FROM "${schemaName}"."contracts" 
       WHERE tenant_id = $1 AND is_active = true AND renewal_date <= NOW() + INTERVAL '${days} days'
       ORDER BY renewal_date ASC`,
      [tenantId]
    );
    
    return result.rows;
  }
}
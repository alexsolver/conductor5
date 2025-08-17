import { Pool } from 'pg';
import { ApprovalRule } from '../../domain/entities/ApprovalRule';
import { IApprovalRuleRepository, ApprovalRuleFilters, ApprovalRuleStats } from '../../domain/repositories/IApprovalRuleRepository';
import { InsertApprovalRuleForm } from '../../../../../shared/schema-master';
import { randomUUID } from 'crypto';

export class PostgresApprovalRuleRepository implements IApprovalRuleRepository {
  constructor(private db: Pool) {}

  async findById(id: string, tenantId: string): Promise<ApprovalRule | null> {
    const query = `
      SELECT * FROM "${tenantId}".approval_rules 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findAll(tenantId: string, filters?: ApprovalRuleFilters): Promise<ApprovalRule[]> {
    let query = `
      SELECT * FROM "${tenantId}".approval_rules 
      WHERE is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.moduleType) {
      query += ` AND module_type = $${paramIndex}`;
      params.push(filters.moduleType);
      paramIndex++;
    }

    if (filters?.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters?.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY priority ASC, created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await this.db.query(query, params);
    
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByModuleType(tenantId: string, moduleType: string, isActive?: boolean): Promise<ApprovalRule[]> {
    let query = `
      SELECT * FROM "${tenantId}".approval_rules 
      WHERE module_type = $1
    `;
    
    const params: any[] = [moduleType];

    if (isActive !== undefined) {
      query += ` AND is_active = $2`;
      params.push(isActive);
    }

    query += ` ORDER BY priority ASC, created_at DESC`;

    const result = await this.db.query(query, params);
    
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findApplicableRules(tenantId: string, moduleType: string, entityData: Record<string, any>): Promise<ApprovalRule[]> {
    // First, get all active rules for the module type
    const rules = await this.findByModuleType(tenantId, moduleType, true);
    
    // Filter rules that match the entity data (done in memory for now)
    // In a more advanced implementation, this could be done with SQL queries
    return rules.filter(rule => rule.matchesEntity(entityData));
  }

  async create(tenantId: string, ruleData: InsertApprovalRuleForm, createdById: string): Promise<ApprovalRule> {
    const id = randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO "${tenantId}".approval_rules (
        id, tenant_id, name, description, module_type, query_conditions, 
        approval_steps, escalation_settings, sla_hours, business_hours_only, 
        auto_approval_conditions, priority, is_active, created_by_id, 
        updated_by_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *
    `;

    const params = [
      id,
      tenantId,
      ruleData.name,
      ruleData.description,
      ruleData.moduleType,
      JSON.stringify(ruleData.queryConditions),
      JSON.stringify(ruleData.approvalSteps),
      JSON.stringify(ruleData.escalationSettings),
      ruleData.slaHours,
      ruleData.businessHoursOnly,
      JSON.stringify(ruleData.autoApprovalConditions),
      ruleData.priority,
      ruleData.isActive,
      createdById,
      createdById,
      now,
      now
    ];

    const result = await this.db.query(query, params);
    
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, tenantId: string, ruleData: Partial<InsertApprovalRuleForm>, updatedById: string): Promise<ApprovalRule> {
    const now = new Date();
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (ruleData.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(ruleData.name);
      paramIndex++;
    }

    if (ruleData.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(ruleData.description);
      paramIndex++;
    }

    if (ruleData.moduleType !== undefined) {
      updates.push(`module_type = $${paramIndex}`);
      params.push(ruleData.moduleType);
      paramIndex++;
    }

    if (ruleData.queryConditions !== undefined) {
      updates.push(`query_conditions = $${paramIndex}`);
      params.push(JSON.stringify(ruleData.queryConditions));
      paramIndex++;
    }

    if (ruleData.approvalSteps !== undefined) {
      updates.push(`approval_steps = $${paramIndex}`);
      params.push(JSON.stringify(ruleData.approvalSteps));
      paramIndex++;
    }

    if (ruleData.escalationSettings !== undefined) {
      updates.push(`escalation_settings = $${paramIndex}`);
      params.push(JSON.stringify(ruleData.escalationSettings));
      paramIndex++;
    }

    if (ruleData.slaHours !== undefined) {
      updates.push(`sla_hours = $${paramIndex}`);
      params.push(ruleData.slaHours);
      paramIndex++;
    }

    if (ruleData.businessHoursOnly !== undefined) {
      updates.push(`business_hours_only = $${paramIndex}`);
      params.push(ruleData.businessHoursOnly);
      paramIndex++;
    }

    if (ruleData.autoApprovalConditions !== undefined) {
      updates.push(`auto_approval_conditions = $${paramIndex}`);
      params.push(JSON.stringify(ruleData.autoApprovalConditions));
      paramIndex++;
    }

    if (ruleData.priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(ruleData.priority);
      paramIndex++;
    }

    if (ruleData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(ruleData.isActive);
      paramIndex++;
    }

    updates.push(`updated_by_id = $${paramIndex}`);
    params.push(updatedById);
    paramIndex++;

    updates.push(`updated_at = $${paramIndex}`);
    params.push(now);
    paramIndex++;

    const query = `
      UPDATE "${tenantId}".approval_rules 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    params.push(id, tenantId);

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('Regra de aprovação não encontrada');
    }

    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const query = `
      UPDATE "${tenantId}".approval_rules 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await this.db.query(query, [id, tenantId]);

    if (result.rowCount === 0) {
      throw new Error('Regra de aprovação não encontrada');
    }
  }

  async getStats(tenantId: string): Promise<ApprovalRuleStats> {
    const query = `
      SELECT 
        COUNT(*) as total_rules,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_rules,
        module_type,
        COUNT(*) as count_by_module
      FROM "${tenantId}".approval_rules
      GROUP BY module_type
    `;

    const result = await this.db.query(query);
    
    let totalRules = 0;
    let activeRules = 0;
    const rulesByModule: Record<string, number> = {};

    for (const row of result.rows) {
      totalRules += parseInt(row.total_rules);
      activeRules += parseInt(row.active_rules);
      rulesByModule[row.module_type] = parseInt(row.count_by_module);
    }

    return {
      totalRules,
      activeRules,
      rulesByModule
    };
  }

  async validateUniqueName(tenantId: string, name: string, excludeId?: string): Promise<boolean> {
    let query = `
      SELECT id FROM "${tenantId}".approval_rules 
      WHERE name = $1 AND is_active = true
    `;
    
    const params: any[] = [name];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await this.db.query(query, params);
    
    return result.rows.length === 0;
  }

  private mapToEntity(row: any): ApprovalRule {
    return new ApprovalRule(
      row.id,
      row.tenant_id,
      row.name,
      row.description,
      row.module_type,
      row.query_conditions,
      row.approval_steps,
      row.escalation_settings,
      row.sla_hours,
      row.business_hours_only,
      row.auto_approval_conditions,
      row.priority,
      row.is_active,
      row.created_by_id,
      row.updated_by_id,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
import { Pool } from 'pg';
import { ApprovalInstance, ApprovalInstanceStatus, ModuleType } from '../../domain/entities/ApprovalInstance';
import { ApprovalDecision } from '../../domain/entities/ApprovalDecision';
import { IApprovalInstanceRepository, ApprovalInstanceFilters, ApprovalInstanceStats } from '../../domain/repositories/IApprovalInstanceRepository';
import { InsertApprovalInstanceForm, InsertApprovalDecisionForm } from '../../../../../shared/schema-master';
import { randomUUID } from 'crypto';

export class PostgresApprovalInstanceRepository implements IApprovalInstanceRepository {
  constructor(private db: Pool) {}

  async findById(id: string, tenantId: string): Promise<ApprovalInstance | null> {
    const query = `
      SELECT * FROM "${tenantId}".approval_instances 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return ApprovalInstance.fromDatabase(result.rows[0]);
  }

  async findAll(tenantId: string, filters?: ApprovalInstanceFilters): Promise<ApprovalInstance[]> {
    let query = `
      SELECT * FROM "${tenantId}".approval_instances 
      WHERE is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.entityType) {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(filters.entityType);
      paramIndex++;
    }

    if (filters?.requestedById) {
      query += ` AND requested_by_id = $${paramIndex}`;
      params.push(filters.requestedById);
      paramIndex++;
    }

    if (filters?.ruleId) {
      query += ` AND rule_id = $${paramIndex}`;
      params.push(filters.ruleId);
      paramIndex++;
    }

    if (filters?.slaStatus) {
      query += ` AND sla_status = $${paramIndex}`;
      params.push(filters.slaStatus);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (request_comments ILIKE $${paramIndex} OR final_comments ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

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
    
    return result.rows.map(row => ApprovalInstance.fromDatabase(row));
  }

  async findByEntityId(tenantId: string, entityType: ModuleType, entityId: string): Promise<ApprovalInstance[]> {
    const query = `
      SELECT * FROM "${tenantId}".approval_instances 
      WHERE entity_type = $1 AND entity_id = $2 AND is_active = true
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query, [entityType, entityId]);
    
    return result.rows.map(row => ApprovalInstance.fromDatabase(row));
  }

  async findPendingByUser(tenantId: string, userId: string): Promise<ApprovalInstance[]> {
    // This would require joining with approval steps to find instances where the user is an approver
    // For now, returning pending instances - would need to implement step logic
    const query = `
      SELECT * FROM "${tenantId}".approval_instances 
      WHERE status = 'pending' AND is_active = true
      ORDER BY sla_deadline ASC NULLS LAST
    `;
    
    const result = await this.db.query(query);
    
    return result.rows.map(row => ApprovalInstance.fromDatabase(row));
  }

  async findByStatus(tenantId: string, status: ApprovalInstanceStatus): Promise<ApprovalInstance[]> {
    const query = `
      SELECT * FROM "${tenantId}".approval_instances 
      WHERE status = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query, [status]);
    
    return result.rows.map(row => ApprovalInstance.fromDatabase(row));
  }

  async create(tenantId: string, instanceData: InsertApprovalInstanceForm): Promise<ApprovalInstance> {
    const id = randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO "${tenantId}".approval_instances (
        id, tenant_id, rule_id, entity_type, entity_id, entity_data,
        current_step_index, status, sla_deadline, sla_started, sla_elapsed_minutes,
        sla_status, request_comments, final_comments, last_escalation_at,
        reminders_sent, approved_at, rejected_at, completed_at, expired_at,
        requested_by_id, completed_by_id, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *
    `;

    const params = [
      id,
      instanceData.tenantId,
      instanceData.ruleId,
      instanceData.entityType,
      instanceData.entityId,
      JSON.stringify(instanceData.entityData),
      instanceData.currentStepIndex || 0,
      instanceData.status || 'pending',
      instanceData.slaDeadline,
      instanceData.slaStarted || now,
      instanceData.slaElapsedMinutes || 0,
      instanceData.slaStatus || 'active',
      instanceData.requestComments,
      instanceData.finalComments,
      instanceData.lastEscalationAt,
      instanceData.remindersSent || 0,
      instanceData.approvedAt,
      instanceData.rejectedAt,
      instanceData.completedAt,
      instanceData.expiredAt,
      instanceData.requestedById,
      instanceData.completedById,
      instanceData.isActive !== false,
      now,
      now
    ];

    const result = await this.db.query(query, params);
    
    return ApprovalInstance.fromDatabase(result.rows[0]);
  }

  async update(id: string, tenantId: string, instanceData: Partial<InsertApprovalInstanceForm>): Promise<ApprovalInstance> {
    const now = new Date();
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Dynamic update building
    Object.entries(instanceData).forEach(([key, value]) => {
      if (value !== undefined) {
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          updates.push(`${columnName} = $${paramIndex}`);
          params.push(JSON.stringify(value));
        } else {
          updates.push(`${columnName} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    });

    updates.push(`updated_at = $${paramIndex}`);
    params.push(now);
    paramIndex++;

    const query = `
      UPDATE "${tenantId}".approval_instances 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    params.push(id, tenantId);

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('Instância de aprovação não encontrada');
    }

    return ApprovalInstance.fromDatabase(result.rows[0]);
  }

  async updateStatus(id: string, tenantId: string, status: ApprovalInstanceStatus, completedById?: string): Promise<ApprovalInstance> {
    const now = new Date();
    
    const query = `
      UPDATE "${tenantId}".approval_instances 
      SET 
        status = $1, 
        completed_by_id = $2, 
        completed_at = $3,
        ${status === 'approved' ? 'approved_at = $3,' : ''}
        ${status === 'rejected' ? 'rejected_at = $3,' : ''}
        ${status === 'expired' ? 'expired_at = $3,' : ''}
        updated_at = $3
      WHERE id = $4 AND tenant_id = $5
      RETURNING *
    `;

    const result = await this.db.query(query, [status, completedById, now, id, tenantId]);
    
    if (result.rows.length === 0) {
      throw new Error('Instância de aprovação não encontrada');
    }

    return ApprovalInstance.fromDatabase(result.rows[0]);
  }

  async updateSlaStatus(id: string, tenantId: string, slaStatus: string, elapsedMinutes: number): Promise<void> {
    const query = `
      UPDATE "${tenantId}".approval_instances 
      SET sla_status = $1, sla_elapsed_minutes = $2, updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
    `;

    await this.db.query(query, [slaStatus, elapsedMinutes, id, tenantId]);
  }

  async incrementReminders(id: string, tenantId: string): Promise<void> {
    const query = `
      UPDATE "${tenantId}".approval_instances 
      SET reminders_sent = reminders_sent + 1, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    await this.db.query(query, [id, tenantId]);
  }

  async recordEscalation(id: string, tenantId: string): Promise<void> {
    const query = `
      UPDATE "${tenantId}".approval_instances 
      SET last_escalation_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    await this.db.query(query, [id, tenantId]);
  }

  async getStats(tenantId: string): Promise<ApprovalInstanceStats> {
    const query = `
      SELECT 
        COUNT(*) as total_instances,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_instances,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_instances,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_instances,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_instances,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) as avg_processing_time,
        entity_type,
        COUNT(*) as count_by_module,
        COUNT(CASE WHEN sla_status = 'breached' THEN 1 END) as sla_breaches
      FROM "${tenantId}".approval_instances
      WHERE is_active = true
      GROUP BY entity_type
    `;

    const result = await this.db.query(query);
    
    let totalInstances = 0;
    let pendingInstances = 0;
    let approvedInstances = 0;
    let rejectedInstances = 0;
    let expiredInstances = 0;
    let averageProcessingTime = 0;
    let slaBreaches = 0;
    const instancesByModule: Record<string, number> = {};

    for (const row of result.rows) {
      totalInstances += parseInt(row.total_instances);
      pendingInstances += parseInt(row.pending_instances);
      approvedInstances += parseInt(row.approved_instances);
      rejectedInstances += parseInt(row.rejected_instances);
      expiredInstances += parseInt(row.expired_instances);
      slaBreaches += parseInt(row.sla_breaches);
      instancesByModule[row.entity_type] = parseInt(row.count_by_module);
      if (row.avg_processing_time) {
        averageProcessingTime += parseFloat(row.avg_processing_time);
      }
    }

    return {
      totalInstances,
      pendingInstances,
      approvedInstances,
      rejectedInstances,
      expiredInstances,
      averageProcessingTime: averageProcessingTime / Object.keys(instancesByModule).length || 0,
      instancesByModule,
      slaBreaches
    };
  }

  async findExpiredInstances(tenantId: string): Promise<ApprovalInstance[]> {
    const query = `
      SELECT * FROM "${tenantId}".approval_instances 
      WHERE status = 'pending' 
        AND sla_deadline IS NOT NULL 
        AND sla_deadline < NOW()
        AND is_active = true
      ORDER BY sla_deadline ASC
    `;
    
    const result = await this.db.query(query);
    
    return result.rows.map(row => ApprovalInstance.fromDatabase(row));
  }

  async findInstancesForReminder(tenantId: string): Promise<ApprovalInstance[]> {
    const query = `
      SELECT * FROM "${tenantId}".approval_instances 
      WHERE status = 'pending' 
        AND sla_deadline IS NOT NULL
        AND sla_status IN ('active', 'warning')
        AND is_active = true
      ORDER BY sla_deadline ASC
    `;
    
    const result = await this.db.query(query);
    
    return result.rows.map(row => ApprovalInstance.fromDatabase(row));
  }

  // Decision methods
  async createDecision(tenantId: string, decisionData: InsertApprovalDecisionForm): Promise<ApprovalDecision> {
    const id = randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO "${tenantId}".approval_decisions (
        id, tenant_id, instance_id, step_id, approver_id, approver_type,
        approver_identifier, decision, comments, reason_code, delegated_to_id,
        delegation_reason, response_time_minutes, ip_address, user_agent,
        is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;

    const params = [
      id,
      decisionData.tenantId,
      decisionData.instanceId,
      decisionData.stepId,
      decisionData.approverId,
      decisionData.approverType,
      decisionData.approverIdentifier,
      decisionData.decision,
      decisionData.comments,
      decisionData.reasonCode,
      decisionData.delegatedToId,
      decisionData.delegationReason,
      decisionData.responseTimeMinutes,
      decisionData.ipAddress,
      decisionData.userAgent,
      decisionData.isActive !== false,
      now,
      now
    ];

    const result = await this.db.query(query, params);
    
    return ApprovalDecision.fromDatabase(result.rows[0]);
  }

  async findDecisionsByInstance(tenantId: string, instanceId: string): Promise<ApprovalDecision[]> {
    const query = `
      SELECT * FROM "${tenantId}".approval_decisions 
      WHERE instance_id = $1 AND is_active = true
      ORDER BY created_at ASC
    `;
    
    const result = await this.db.query(query, [instanceId]);
    
    return result.rows.map(row => ApprovalDecision.fromDatabase(row));
  }

  async findDecisionsByStep(tenantId: string, stepId: string): Promise<ApprovalDecision[]> {
    const query = `
      SELECT * FROM "${tenantId}".approval_decisions 
      WHERE step_id = $1 AND is_active = true
      ORDER BY created_at ASC
    `;
    
    const result = await this.db.query(query, [stepId]);
    
    return result.rows.map(row => ApprovalDecision.fromDatabase(row));
  }

  async findUserDecisions(tenantId: string, userId: string, limit?: number): Promise<ApprovalDecision[]> {
    let query = `
      SELECT * FROM "${tenantId}".approval_decisions 
      WHERE approver_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    
    const params: any[] = [userId];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }
    
    const result = await this.db.query(query, params);
    
    return result.rows.map(row => ApprovalDecision.fromDatabase(row));
  }
}
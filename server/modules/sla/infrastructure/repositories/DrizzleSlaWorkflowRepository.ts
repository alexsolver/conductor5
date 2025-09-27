// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW INFRASTRUCTURE REPOSITORY
// Database implementation for workflow persistence

import { db } from '../../../../db';
import { eq, and, desc, asc, lt, isNull, or } from 'drizzle-orm';
import { 
  slaWorkflows, 
  slaWorkflowExecutions,
  type SlaWorkflow as SlaWorkflowSchema,
  type SlaWorkflowExecution as SlaWorkflowExecutionSchema
} from '@shared/schema-sla';
import { SlaWorkflow, SlaWorkflowExecution } from '../../domain/entities/SlaWorkflow';
import { 
  ISlaWorkflowRepository,
  CreateSlaWorkflowDTO,
  UpdateSlaWorkflowDTO,
  CreateSlaWorkflowExecutionDTO,
  UpdateSlaWorkflowExecutionDTO
} from '../../domain/repositories/ISlaWorkflowRepository';

export class DrizzleSlaWorkflowRepository implements ISlaWorkflowRepository {

  async create(data: CreateSlaWorkflowDTO): Promise<SlaWorkflow> {
    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Check if a workflow with the same name already exists for this tenant
    const existingWorkflow = await this.findByName(data.name, data.tenantId);
    if (existingWorkflow) {
      throw new Error(`SLA workflow with name "${data.name}" already exists for this tenant.`);
    }

    const [workflow] = await db
      .insert(slaWorkflows)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        triggers: data.triggers,
        actions: data.actions,
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return this.mapToEntity(workflow);
  }

  async findById(id: string, tenantId: string): Promise<SlaWorkflow | null> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const [workflow] = await db
      .select()
      .from(slaWorkflows)
      .where(and(
        eq(slaWorkflows.id, id),
        eq(slaWorkflows.tenantId, tenantId)
      ));

    return workflow ? this.mapToEntity(workflow) : null;
  }

  async findByName(name: string, tenantId: string): Promise<SlaWorkflow | null> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const [workflow] = await db
      .select()
      .from(slaWorkflows)
      .where(and(
        eq(slaWorkflows.name, name),
        eq(slaWorkflows.tenantId, tenantId)
      ));

    return workflow ? this.mapToEntity(workflow) : null;
  }


  async findByTenant(tenantId: string): Promise<SlaWorkflow[]> {
    if (!tenantId) throw new Error('Tenant ID is required');

    try {
      const workflows = await db
        .select()
        .from(slaWorkflows)
        .where(eq(slaWorkflows.tenantId, tenantId))
        .orderBy(desc(slaWorkflows.createdAt));

      return workflows.map(this.mapToEntity);
    } catch (error) {
      console.error('[DrizzleSlaWorkflowRepository] Error fetching workflows:', error);
      return [];
    }
  }

  async findActiveTriggers(tenantId: string): Promise<SlaWorkflow[]> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const workflows = await db
      .select()
      .from(slaWorkflows)
      .where(and(
        eq(slaWorkflows.tenantId, tenantId),
        eq(slaWorkflows.isActive, true)
      ))
      .orderBy(asc(slaWorkflows.createdAt));

    return workflows.map(this.mapToEntity);
  }

  async update(id: string, tenantId: string, data: UpdateSlaWorkflowDTO): Promise<SlaWorkflow> {
    if (!tenantId) throw new Error('Tenant ID is required');

    // If the name is being updated, check for conflicts
    if (data.name !== undefined) {
      const existingWorkflow = await this.findByName(data.name, tenantId);
      if (existingWorkflow && existingWorkflow.id !== id) {
        throw new Error(`SLA workflow with name "${data.name}" already exists for this tenant.`);
      }
    }

    const [workflow] = await db
      .update(slaWorkflows)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(slaWorkflows.id, id),
        eq(slaWorkflows.tenantId, tenantId)
      ))
      .returning();

    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`);
    }

    return this.mapToEntity(workflow);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const result = await db
      .delete(slaWorkflows)
      .where(and(
        eq(slaWorkflows.id, id),
        eq(slaWorkflows.tenantId, tenantId)
      ));

    return (result.rowCount || 0) > 0;
  }

  // Workflow execution operations
  async createExecution(data: CreateSlaWorkflowExecutionDTO): Promise<SlaWorkflowExecution> {
    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    const [execution] = await db
      .insert(slaWorkflowExecutions)
      .values({
        workflowId: data.workflowId,
        tenantId: data.tenantId,
        triggeredBy: data.triggeredBy,
        triggeredAt: new Date(),
        status: 'pending',
        context: data.context,
        executedActions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return this.mapExecutionToEntity(execution);
  }

  async findExecutionById(id: string, tenantId: string): Promise<SlaWorkflowExecution | null> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const [execution] = await db
      .select()
      .from(slaWorkflowExecutions)
      .where(and(
        eq(slaWorkflowExecutions.id, id),
        eq(slaWorkflowExecutions.tenantId, tenantId)
      ));

    return execution ? this.mapExecutionToEntity(execution) : null;
  }

  async findExecutionsByWorkflow(workflowId: string, tenantId: string): Promise<SlaWorkflowExecution[]> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const executions = await db
      .select()
      .from(slaWorkflowExecutions)
      .where(and(
        eq(slaWorkflowExecutions.workflowId, workflowId),
        eq(slaWorkflowExecutions.tenantId, tenantId)
      ))
      .orderBy(desc(slaWorkflowExecutions.triggeredAt));

    return executions.map(this.mapExecutionToEntity);
  }

  async findPendingExecutions(tenantId: string): Promise<SlaWorkflowExecution[]> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const executions = await db
      .select()
      .from(slaWorkflowExecutions)
      .where(and(
        eq(slaWorkflowExecutions.tenantId, tenantId),
        or(
          eq(slaWorkflowExecutions.status, 'pending'),
          eq(slaWorkflowExecutions.status, 'running')
        )
      ))
      .orderBy(asc(slaWorkflowExecutions.triggeredAt));

    return executions.map(this.mapExecutionToEntity);
  }

  async updateExecution(id: string, tenantId: string, data: UpdateSlaWorkflowExecutionDTO): Promise<SlaWorkflowExecution> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const [execution] = await db
      .update(slaWorkflowExecutions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(slaWorkflowExecutions.id, id),
        eq(slaWorkflowExecutions.tenantId, tenantId)
      ))
      .returning();

    if (!execution) {
      throw new Error(`Workflow execution not found: ${id}`);
    }

    return this.mapExecutionToEntity(execution);
  }

  async getWorkflowStats(workflowId: string, tenantId: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: Date;
  }> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const executions = await db
      .select()
      .from(slaWorkflowExecutions)
      .where(and(
        eq(slaWorkflowExecutions.workflowId, workflowId),
        eq(slaWorkflowExecutions.tenantId, tenantId)
      ));

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;

    // Calculate average execution time for completed executions
    const completedExecutions = executions.filter(e => e.status === 'completed' && e.completedAt);
    const averageExecutionTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => {
          const duration = e.completedAt!.getTime() - e.triggeredAt.getTime();
          return sum + duration;
        }, 0) / completedExecutions.length
      : 0;

    const lastExecution = executions.length > 0
      ? executions.reduce((latest, current) => 
          current.triggeredAt > latest.triggeredAt ? current : latest
        ).triggeredAt
      : undefined;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      lastExecution
    };
  }

  async cleanupOldExecutions(tenantId: string, olderThanDays: number): Promise<number> {
    if (!tenantId) throw new Error('Tenant ID is required');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await db
      .delete(slaWorkflowExecutions)
      .where(and(
        eq(slaWorkflowExecutions.tenantId, tenantId),
        lt(slaWorkflowExecutions.triggeredAt, cutoffDate),
        or(
          eq(slaWorkflowExecutions.status, 'completed'),
          eq(slaWorkflowExecutions.status, 'failed'),
          eq(slaWorkflowExecutions.status, 'cancelled')
        )
      ));

    return result.rowCount ?? 0;
  }

  private mapToEntity(schema: SlaWorkflowSchema): SlaWorkflow {
    return new SlaWorkflow(
      schema.id,
      schema.tenantId,
      schema.name,
      schema.description || '',
      schema.isActive,
      Array.isArray(schema.triggers) ? schema.triggers : [],
      Array.isArray(schema.actions) ? schema.actions : [],
      schema.metadata || {},
      schema.createdAt,
      schema.updatedAt
    );
  }

  private mapExecutionToEntity(schema: SlaWorkflowExecutionSchema): SlaWorkflowExecution {
    return {
      id: schema.id,
      workflowId: schema.workflowId,
      tenantId: schema.tenantId,
      triggeredBy: schema.triggeredBy,
      triggeredAt: schema.triggeredAt,
      status: schema.status as any,
      context: schema.context || {},
      executedActions: Array.isArray(schema.executedActions) ? schema.executedActions : [],
      error: schema.error || undefined,
      completedAt: schema.completedAt || undefined
    };
  }
}
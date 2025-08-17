// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW REPOSITORY INTERFACE
// Domain interface for workflow persistence

import { SlaWorkflow, SlaWorkflowExecution } from '../entities/SlaWorkflow';

export interface CreateSlaWorkflowDTO {
  tenantId: string;
  name: string;
  description: string;
  isActive: boolean;
  triggers: any[];
  actions: any[];
  metadata: Record<string, any>;
}

export interface UpdateSlaWorkflowDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  triggers?: any[];
  actions?: any[];
  metadata?: Record<string, any>;
}

export interface CreateSlaWorkflowExecutionDTO {
  workflowId: string;
  tenantId: string;
  triggeredBy: string;
  context: Record<string, any>;
}

export interface UpdateSlaWorkflowExecutionDTO {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  executedActions?: string[];
  error?: string;
  completedAt?: Date;
}

export interface ISlaWorkflowRepository {
  // Workflow CRUD operations
  create(data: CreateSlaWorkflowDTO): Promise<SlaWorkflow>;
  findById(id: string, tenantId: string): Promise<SlaWorkflow | null>;
  findByTenant(tenantId: string): Promise<SlaWorkflow[]>;
  findActiveTriggers(tenantId: string): Promise<SlaWorkflow[]>;
  update(id: string, tenantId: string, data: UpdateSlaWorkflowDTO): Promise<SlaWorkflow>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Workflow execution operations
  createExecution(data: CreateSlaWorkflowExecutionDTO): Promise<SlaWorkflowExecution>;
  findExecutionById(id: string, tenantId: string): Promise<SlaWorkflowExecution | null>;
  findExecutionsByWorkflow(workflowId: string, tenantId: string): Promise<SlaWorkflowExecution[]>;
  findPendingExecutions(tenantId: string): Promise<SlaWorkflowExecution[]>;
  updateExecution(id: string, tenantId: string, data: UpdateSlaWorkflowExecutionDTO): Promise<SlaWorkflowExecution>;

  // Analytics and monitoring
  getWorkflowStats(workflowId: string, tenantId: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: Date;
  }>;

  // Cleanup operations
  cleanupOldExecutions(tenantId: string, olderThanDays: number): Promise<number>;
}
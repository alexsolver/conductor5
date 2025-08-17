import { ApprovalInstance, ApprovalInstanceStatus, ModuleType } from '../entities/ApprovalInstance';
import { ApprovalDecision } from '../entities/ApprovalDecision';
import { InsertApprovalInstanceForm, InsertApprovalDecisionForm } from '../../../../../shared/schema-master';

export interface ApprovalInstanceFilters {
  status?: ApprovalInstanceStatus;
  entityType?: ModuleType;
  requestedById?: string;
  ruleId?: string;
  slaStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ApprovalInstanceStats {
  totalInstances: number;
  pendingInstances: number;
  approvedInstances: number;
  rejectedInstances: number;
  expiredInstances: number;
  averageProcessingTime: number;
  instancesByModule: Record<string, number>;
  slaBreaches: number;
}

export interface IApprovalInstanceRepository {
  findById(id: string, tenantId: string): Promise<ApprovalInstance | null>;
  findAll(tenantId: string, filters?: ApprovalInstanceFilters): Promise<ApprovalInstance[]>;
  findByEntityId(tenantId: string, entityType: ModuleType, entityId: string): Promise<ApprovalInstance[]>;
  findPendingByUser(tenantId: string, userId: string): Promise<ApprovalInstance[]>;
  findByStatus(tenantId: string, status: ApprovalInstanceStatus): Promise<ApprovalInstance[]>;
  create(tenantId: string, instanceData: InsertApprovalInstanceForm): Promise<ApprovalInstance>;
  update(id: string, tenantId: string, instanceData: Partial<InsertApprovalInstanceForm>): Promise<ApprovalInstance>;
  updateStatus(id: string, tenantId: string, status: ApprovalInstanceStatus, completedById?: string): Promise<ApprovalInstance>;
  updateSlaStatus(id: string, tenantId: string, slaStatus: string, elapsedMinutes: number): Promise<void>;
  incrementReminders(id: string, tenantId: string): Promise<void>;
  recordEscalation(id: string, tenantId: string): Promise<void>;
  getStats(tenantId: string): Promise<ApprovalInstanceStats>;
  findExpiredInstances(tenantId: string): Promise<ApprovalInstance[]>;
  findInstancesForReminder(tenantId: string): Promise<ApprovalInstance[]>;
  
  // Decision methods
  createDecision(tenantId: string, decisionData: InsertApprovalDecisionForm): Promise<ApprovalDecision>;
  findDecisionsByInstance(tenantId: string, instanceId: string): Promise<ApprovalDecision[]>;
  findDecisionsByStep(tenantId: string, stepId: string): Promise<ApprovalDecision[]>;
  findUserDecisions(tenantId: string, userId: string, limit?: number): Promise<ApprovalDecision[]>;
}
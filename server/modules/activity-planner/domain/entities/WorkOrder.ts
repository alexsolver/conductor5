/**
 * WorkOrder Entity - Entidade de domínio para ordens de serviço
 * Representa trabalhos de manutenção a serem executados
 * Seguindo padrões Clean Architecture e 1qa.md
 */

export interface WorkOrderTask {
  id: string;
  workOrderId: string;
  sequence: number;
  name: string;
  description?: string;
  estimatedDuration: number; // em minutos
  requiredSkillsJson: string[];
  requiredCertificationsJson: string[];
  checklistJson: ChecklistItem[];
  requiredPartsJson?: WorkOrderPart[];
  dependencies: string[]; // IDs de outras tarefas
  status: TaskStatus;
  assignedTechnicianId?: string;
  actualStart?: Date;
  actualEnd?: Date;
  notes?: string;
  evidenceJson?: TaskEvidence[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  description: string;
  type: 'boolean' | 'numeric' | 'text' | 'photo' | 'signature';
  required: boolean;
  value?: any;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface WorkOrderPart {
  id: string;
  materialServiceId: string;
  quantityRequired: number;
  quantityReserved: number;
  quantityUsed: number;
  status: 'pending' | 'reserved' | 'issued' | 'consumed' | 'returned';
  isOptional: boolean;
}

export interface TaskEvidence {
  id: string;
  type: 'photo' | 'measurement' | 'signature' | 'document';
  filename?: string;
  url?: string;
  value?: any;
  description?: string;
  capturedAt: Date;
  capturedBy: string;
}

export type WorkOrderStatus = 
  | 'drafted' 
  | 'scheduled' 
  | 'in_progress' 
  | 'waiting_parts' 
  | 'waiting_window' 
  | 'waiting_client' 
  | 'completed' 
  | 'approved' 
  | 'closed' 
  | 'rejected' 
  | 'canceled';

export type TaskStatus = 'pending' | 'doing' | 'blocked' | 'done' | 'verified';

export type WorkOrderOrigin = 'pm' | 'incident' | 'manual' | 'condition';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

export interface WorkOrder {
  id: string;
  tenantId: string;
  assetId: string;
  ticketId?: string; // vinculado a um ticket se origem for incident
  maintenancePlanId?: string; // vinculado a um plano se origem for PM
  origin: WorkOrderOrigin;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  title: string;
  description?: string;
  estimatedDuration: number; // em minutos
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  slaTargetAt?: Date;
  idlePolicyJson?: IdleTimePolicy;
  assignedTechnicianId?: string;
  assignedTeamId?: string;
  locationId: string;
  contactPersonId?: string;
  requiresApproval: boolean;
  approvalWorkflowId?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  totalCost: number;
  laborCost: number;
  partsCost: number;
  externalCost: number;
  completionPercentage: number;
  notes?: string;
  riskAssessment?: RiskAssessment;
  permitsRequired: string[];
  safetyRequirements: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  // Relacionamentos
  tasks?: WorkOrderTask[];
  partsReservations?: WorkOrderPart[];
}

export interface IdleTimePolicy {
  warningThresholdMinutes: number; // ex: 240 (4h)
  escalationThresholdMinutes: number; // ex: 480 (8h)
  autoReassignThresholdMinutes: number; // ex: 720 (12h)
  notificationEmails: string[];
  escalationUserIds: string[];
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  hazards: string[];
  mitigationMeasures: string[];
  requiredPPE: string[];
  assessedBy: string;
  assessedAt: Date;
}

export interface InsertWorkOrder {
  tenantId: string;
  assetId: string;
  ticketId?: string;
  maintenancePlanId?: string;
  origin: WorkOrderOrigin;
  priority: WorkOrderPriority;
  title: string;
  description?: string;
  estimatedDuration: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  slaTargetAt?: Date;
  idlePolicyJson?: IdleTimePolicy;
  locationId: string;
  contactPersonId?: string;
  requiresApproval: boolean;
  approvalWorkflowId?: string;
  riskAssessment?: RiskAssessment;
  permitsRequired: string[];
  safetyRequirements: string[];
  createdBy: string;
}

export class WorkOrderEntity {
  constructor(private workOrder: WorkOrder) {}

  getId(): string {
    return this.workOrder.id;
  }

  getTenantId(): string {
    return this.workOrder.tenantId;
  }

  getAssetId(): string {
    return this.workOrder.assetId;
  }

  getStatus(): WorkOrderStatus {
    return this.workOrder.status;
  }

  getPriority(): WorkOrderPriority {
    return this.workOrder.priority;
  }

  getOrigin(): WorkOrderOrigin {
    return this.workOrder.origin;
  }

  getTitle(): string {
    return this.workOrder.title;
  }

  getEstimatedDuration(): number {
    return this.workOrder.estimatedDuration;
  }

  isScheduled(): boolean {
    return !!this.workOrder.scheduledStart && !!this.workOrder.scheduledEnd;
  }

  isOverdue(): boolean {
    if (!this.workOrder.slaTargetAt) return false;
    return new Date() > this.workOrder.slaTargetAt;
  }

  isInProgress(): boolean {
    return this.workOrder.status === 'in_progress';
  }

  isCompleted(): boolean {
    return ['completed', 'approved', 'closed'].includes(this.workOrder.status);
  }

  canStart(): boolean {
    return this.workOrder.status === 'scheduled' && !!this.workOrder.assignedTechnicianId;
  }

  canComplete(): boolean {
    return this.workOrder.status === 'in_progress' && this.workOrder.completionPercentage >= 100;
  }

  requiresApproval(): boolean {
    return this.workOrder.requiresApproval;
  }

  start(): void {
    if (!this.canStart()) {
      throw new Error('Work order cannot be started in current state');
    }
    this.workOrder.status = 'in_progress';
    this.workOrder.actualStart = new Date();
    this.workOrder.updatedAt = new Date();
  }

  pause(): void {
    if (!this.isInProgress()) {
      throw new Error('Work order is not in progress');
    }
    // Status permanece 'in_progress' mas pode adicionar flag de pause se necessário
    this.workOrder.updatedAt = new Date();
  }

  complete(): void {
    if (!this.canComplete()) {
      throw new Error('Work order cannot be completed in current state');
    }
    this.workOrder.status = 'completed';
    this.workOrder.actualEnd = new Date();
    this.workOrder.completionPercentage = 100;
    this.workOrder.updatedAt = new Date();
  }

  approve(): void {
    if (this.workOrder.status !== 'completed') {
      throw new Error('Work order must be completed before approval');
    }
    this.workOrder.status = 'approved';
    this.workOrder.approvalStatus = 'approved';
    this.workOrder.updatedAt = new Date();
  }

  reject(reason?: string): void {
    this.workOrder.status = 'rejected';
    this.workOrder.approvalStatus = 'rejected';
    if (reason) {
      this.workOrder.notes = (this.workOrder.notes || '') + `\n[REJECTED] ${reason}`;
    }
    this.workOrder.updatedAt = new Date();
  }

  cancel(reason?: string): void {
    this.workOrder.status = 'canceled';
    if (reason) {
      this.workOrder.notes = (this.workOrder.notes || '') + `\n[CANCELED] ${reason}`;
    }
    this.workOrder.updatedAt = new Date();
  }

  assignTechnician(technicianId: string): void {
    this.workOrder.assignedTechnicianId = technicianId;
    this.workOrder.updatedAt = new Date();
  }

  schedule(startDate: Date, endDate: Date): void {
    this.workOrder.scheduledStart = startDate;
    this.workOrder.scheduledEnd = endDate;
    this.workOrder.status = 'scheduled';
    this.workOrder.updatedAt = new Date();
  }

  updateProgress(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }
    this.workOrder.completionPercentage = percentage;
    this.workOrder.updatedAt = new Date();
  }

  addCost(laborCost: number, partsCost: number, externalCost: number): void {
    this.workOrder.laborCost += laborCost;
    this.workOrder.partsCost += partsCost;
    this.workOrder.externalCost += externalCost;
    this.workOrder.totalCost = this.workOrder.laborCost + this.workOrder.partsCost + this.workOrder.externalCost;
    this.workOrder.updatedAt = new Date();
  }

  calculateDuration(): number | null {
    if (!this.workOrder.actualStart || !this.workOrder.actualEnd) {
      return null;
    }
    return this.workOrder.actualEnd.getTime() - this.workOrder.actualStart.getTime();
  }

  isWithinSLA(): boolean {
    if (!this.workOrder.slaTargetAt) return true;
    if (!this.workOrder.actualEnd && !this.isCompleted()) {
      return new Date() <= this.workOrder.slaTargetAt;
    }
    return this.workOrder.actualEnd ? this.workOrder.actualEnd <= this.workOrder.slaTargetAt : true;
  }

  toPlainObject(): WorkOrder {
    return { ...this.workOrder };
  }
}
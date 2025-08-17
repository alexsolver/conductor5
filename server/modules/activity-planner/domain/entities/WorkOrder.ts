/**
 * WorkOrder Entity - Entidade de domínio para ordens de serviço
 * Representa ordens de trabalho de manutenção preventiva, corretiva ou preditiva
 * Seguindo padrões Clean Architecture e 1qa.md
 */

export interface IdleTimePolicy {
  stages: IdleTimeStage[];
  escalationRules: EscalationRule[];
}

export interface IdleTimeStage {
  name: string;
  thresholdMinutes: number;
  actions: IdleTimeAction[];
}

export interface IdleTimeAction {
  type: 'notification' | 'reassign' | 'escalate' | 'auto_approve';
  targetRoles?: string[];
  targetUsers?: string[];
  message?: string;
}

export interface EscalationRule {
  level: number;
  delayMinutes: number;
  targetRoles: string[];
  autoApprove?: boolean;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  hazards: string[];
  mitigationMeasures: string[];
  requiredPPE: string[];
  safetyPrecautions: string[];
  environmentalImpact?: string;
  requiresPermit: boolean;
  permitTypes?: string[];
}

export interface WorkOrderCosts {
  labor: number;
  parts: number;
  external: number;
  overhead?: number;
  total: number;
}

export interface WorkOrder {
  id: string;
  tenantId: string;
  assetId: string;
  ticketId: string | null; // vinculado a ticket se origem for incident
  maintenancePlanId: string | null; // vinculado a plano se origem for PM
  origin: 'pm' | 'incident' | 'manual' | 'condition';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  status: 'drafted' | 'scheduled' | 'in_progress' | 'waiting_parts' | 'waiting_window' | 'waiting_client' | 'completed' | 'approved' | 'closed' | 'rejected' | 'canceled';
  title: string;
  description: string | null;
  estimatedDuration: number; // em minutos
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  slaTargetAt: Date | null;
  idlePolicyJson: IdleTimePolicy | null;
  assignedTechnicianId: string | null;
  assignedTeamId: string | null;
  locationId: string;
  contactPersonId: string | null;
  requiresApproval: boolean;
  approvalWorkflowId: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  totalCost: number;
  laborCost: number;
  partsCost: number;
  externalCost: number;
  completionPercentage: number;
  notes: string | null;
  riskAssessmentJson: RiskAssessment | null;
  permitsRequiredJson: string[] | null;
  safetyRequirementsJson: string[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface InsertWorkOrder {
  tenantId: string;
  assetId: string;
  ticketId?: string;
  maintenancePlanId?: string;
  origin: 'pm' | 'incident' | 'manual' | 'condition';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  title: string;
  description?: string;
  estimatedDuration: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  slaTargetAt?: Date;
  idlePolicyJson?: IdleTimePolicy;
  assignedTechnicianId?: string;
  assignedTeamId?: string;
  locationId: string;
  contactPersonId?: string;
  requiresApproval?: boolean;
  approvalWorkflowId?: string;
  notes?: string;
  riskAssessmentJson?: RiskAssessment;
  permitsRequiredJson?: string[];
  safetyRequirementsJson?: string[];
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

  getTitle(): string {
    return this.workOrder.title;
  }

  getOrigin(): 'pm' | 'incident' | 'manual' | 'condition' {
    return this.workOrder.origin;
  }

  getPriority(): 'low' | 'medium' | 'high' | 'critical' | 'emergency' {
    return this.workOrder.priority;
  }

  getStatus(): 'drafted' | 'scheduled' | 'in_progress' | 'waiting_parts' | 'waiting_window' | 'waiting_client' | 'completed' | 'approved' | 'closed' | 'rejected' | 'canceled' {
    return this.workOrder.status;
  }

  getEstimatedDuration(): number {
    return this.workOrder.estimatedDuration;
  }

  getCompletionPercentage(): number {
    return this.workOrder.completionPercentage;
  }

  getTotalCost(): number {
    return this.workOrder.totalCost;
  }

  isActive(): boolean {
    return this.workOrder.isActive;
  }

  isScheduled(): boolean {
    return !!this.workOrder.scheduledStart && !!this.workOrder.scheduledEnd;
  }

  isInProgress(): boolean {
    return this.workOrder.status === 'in_progress';
  }

  isCompleted(): boolean {
    return ['completed', 'approved', 'closed'].includes(this.workOrder.status);
  }

  isCanceled(): boolean {
    return ['rejected', 'canceled'].includes(this.workOrder.status);
  }

  isOverdue(): boolean {
    if (!this.workOrder.slaTargetAt) return false;
    return new Date() > this.workOrder.slaTargetAt && !this.isCompleted();
  }

  isPastSchedule(): boolean {
    if (!this.workOrder.scheduledEnd) return false;
    return new Date() > this.workOrder.scheduledEnd && !this.isCompleted();
  }

  isHighPriority(): boolean {
    return ['high', 'critical', 'emergency'].includes(this.workOrder.priority);
  }

  requiresRiskAssessment(): boolean {
    return !!this.workOrder.riskAssessmentJson;
  }

  requiresPermits(): boolean {
    return !!this.workOrder.permitsRequiredJson && this.workOrder.permitsRequiredJson.length > 0;
  }

  requiresApproval(): boolean {
    return this.workOrder.requiresApproval;
  }

  isApproved(): boolean {
    return this.workOrder.approvalStatus === 'approved';
  }

  isPendingApproval(): boolean {
    return this.workOrder.approvalStatus === 'pending';
  }

  canStart(): boolean {
    if (!this.workOrder.isActive) return false;
    if (this.isCompleted() || this.isCanceled()) return false;
    if (this.requiresApproval() && !this.isApproved()) return false;
    return ['drafted', 'scheduled'].includes(this.workOrder.status);
  }

  canComplete(): boolean {
    return this.workOrder.status === 'in_progress' && this.workOrder.completionPercentage >= 100;
  }

  updateStatus(
    newStatus: 'drafted' | 'scheduled' | 'in_progress' | 'waiting_parts' | 'waiting_window' | 'waiting_client' | 'completed' | 'approved' | 'closed' | 'rejected' | 'canceled',
    updatedBy: string
  ): void {
    const oldStatus = this.workOrder.status;
    this.workOrder.status = newStatus;
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();

    // Atualizar timestamps baseado no status
    if (newStatus === 'in_progress' && !this.workOrder.actualStart) {
      this.workOrder.actualStart = new Date();
    }

    if (newStatus === 'completed' && !this.workOrder.actualEnd) {
      this.workOrder.actualEnd = new Date();
      this.workOrder.completionPercentage = 100;
    }

    console.log(`WorkOrder ${this.workOrder.id} status changed: ${oldStatus} → ${newStatus}`);
  }

  updateProgress(percentage: number, updatedBy: string): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Completion percentage must be between 0 and 100');
    }

    this.workOrder.completionPercentage = percentage;
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();

    if (percentage === 100 && this.workOrder.status === 'in_progress') {
      this.updateStatus('completed', updatedBy);
    }
  }

  updateCosts(costs: Partial<WorkOrderCosts>, updatedBy: string): void {
    if (costs.labor !== undefined) this.workOrder.laborCost = costs.labor;
    if (costs.parts !== undefined) this.workOrder.partsCost = costs.parts;
    if (costs.external !== undefined) this.workOrder.externalCost = costs.external;

    this.recalculateTotalCost();
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();
  }

  schedule(startDate: Date, endDate: Date, updatedBy: string): void {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    this.workOrder.scheduledStart = startDate;
    this.workOrder.scheduledEnd = endDate;
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();

    if (this.workOrder.status === 'drafted') {
      this.updateStatus('scheduled', updatedBy);
    }
  }

  assignTechnician(technicianId: string, updatedBy: string): void {
    this.workOrder.assignedTechnicianId = technicianId;
    this.workOrder.assignedTeamId = undefined; // Clear team assignment
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();
  }

  assignTeam(teamId: string, updatedBy: string): void {
    this.workOrder.assignedTeamId = teamId;
    this.workOrder.assignedTechnicianId = undefined; // Clear individual assignment
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();
  }

  updateRiskAssessment(riskAssessment: RiskAssessment, updatedBy: string): void {
    this.workOrder.riskAssessmentJson = riskAssessment;
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();
  }

  addPermitRequirement(permitType: string, updatedBy: string): void {
    if (!this.workOrder.permitsRequiredJson) {
      this.workOrder.permitsRequiredJson = [];
    }

    if (!this.workOrder.permitsRequiredJson.includes(permitType)) {
      this.workOrder.permitsRequiredJson.push(permitType);
      this.workOrder.updatedBy = updatedBy;
      this.workOrder.updatedAt = new Date();
    }
  }

  removePermitRequirement(permitType: string, updatedBy: string): void {
    if (this.workOrder.permitsRequiredJson) {
      const index = this.workOrder.permitsRequiredJson.indexOf(permitType);
      if (index > -1) {
        this.workOrder.permitsRequiredJson.splice(index, 1);
        this.workOrder.updatedBy = updatedBy;
        this.workOrder.updatedAt = new Date();
      }
    }
  }

  updateApprovalStatus(
    status: 'pending' | 'approved' | 'rejected',
    updatedBy: string
  ): void {
    this.workOrder.approvalStatus = status;
    this.workOrder.updatedBy = updatedBy;
    this.workOrder.updatedAt = new Date();

    if (status === 'rejected') {
      this.updateStatus('rejected', updatedBy);
    }
  }

  calculateActualDuration(): number | null {
    if (!this.workOrder.actualStart || !this.workOrder.actualEnd) {
      return null;
    }

    const durationMs = this.workOrder.actualEnd.getTime() - this.workOrder.actualStart.getTime();
    return Math.round(durationMs / (1000 * 60)); // converter para minutos
  }

  calculateScheduledDuration(): number | null {
    if (!this.workOrder.scheduledStart || !this.workOrder.scheduledEnd) {
      return null;
    }

    const durationMs = this.workOrder.scheduledEnd.getTime() - this.workOrder.scheduledStart.getTime();
    return Math.round(durationMs / (1000 * 60)); // converter para minutos
  }

  isWithinEstimate(): boolean {
    const actualDuration = this.calculateActualDuration();
    if (!actualDuration) return true;

    const tolerance = this.workOrder.estimatedDuration * 0.1; // 10% de tolerância
    return actualDuration <= (this.workOrder.estimatedDuration + tolerance);
  }

  getIdleTime(): number {
    if (!this.workOrder.actualStart) return 0;

    const now = new Date();
    const currentDurationMs = now.getTime() - this.workOrder.actualStart.getTime();
    const currentDurationMinutes = Math.round(currentDurationMs / (1000 * 60));

    // Tempo ocioso = tempo atual - progresso esperado baseado na porcentagem
    const expectedDuration = (this.workOrder.completionPercentage / 100) * this.workOrder.estimatedDuration;
    return Math.max(0, currentDurationMinutes - expectedDuration);
  }

  shouldEscalate(): boolean {
    if (!this.workOrder.idlePolicyJson) return false;

    const idleTime = this.getIdleTime();
    const policy = this.workOrder.idlePolicyJson;

    return policy.stages.some(stage => idleTime >= stage.thresholdMinutes);
  }

  getApplicableIdleStage(): IdleTimeStage | null {
    if (!this.workOrder.idlePolicyJson) return null;

    const idleTime = this.getIdleTime();
    const policy = this.workOrder.idlePolicyJson;

    // Retornar o estágio mais alto aplicável
    const applicableStages = policy.stages
      .filter(stage => idleTime >= stage.thresholdMinutes)
      .sort((a, b) => b.thresholdMinutes - a.thresholdMinutes);

    return applicableStages[0] || null;
  }

  private recalculateTotalCost(): void {
    this.workOrder.totalCost = this.workOrder.laborCost + this.workOrder.partsCost + this.workOrder.externalCost;
  }

  toPlainObject(): WorkOrder {
    return { ...this.workOrder };
  }
}
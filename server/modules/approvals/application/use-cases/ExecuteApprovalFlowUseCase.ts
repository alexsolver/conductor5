import { IApprovalRuleRepository } from '../../domain/repositories/IApprovalRuleRepository';
import { IApprovalInstanceRepository } from '../../domain/repositories/IApprovalInstanceRepository';
import { ApprovalInstance, ModuleType } from '../../domain/entities/ApprovalInstance';
import { ApprovalRuleEngine } from '../../domain/services/ApprovalRuleEngine';
import { randomUUID } from 'crypto';

export interface ExecuteApprovalRequest {
  entityType: ModuleType;
  entityId: string;
  entityData: Record<string, any>;
  requestComments?: string;
  requestedById: string;
}

export interface ExecuteApprovalResult {
  instance: ApprovalInstance | null;
  autoApproved: boolean;
  applicableRules: number;
  message: string;
}

export class ExecuteApprovalFlowUseCase {
  constructor(
    private approvalRuleRepository: IApprovalRuleRepository,
    private approvalInstanceRepository: IApprovalInstanceRepository,
    private ruleEngine: ApprovalRuleEngine
  ) {}

  async execute(
    tenantId: string,
    request: ExecuteApprovalRequest
  ): Promise<ExecuteApprovalResult> {
    // Find applicable rules
    const rules = await this.approvalRuleRepository.findByModuleType(
      tenantId,
      request.entityType,
      true // Only active rules
    );

    const applicableRules = this.ruleEngine.findApplicableRules(
      rules,
      request.entityType,
      request.entityData
    );

    if (applicableRules.length === 0) {
      return {
        instance: null,
        autoApproved: false,
        applicableRules: 0,
        message: 'Nenhuma regra de aprovação aplicável encontrada'
      };
    }

    // Get the best matching rule (highest priority)
    const bestMatch = applicableRules[0];

    // Check for auto-approval
    if (bestMatch.shouldAutoApprove) {
      return {
        instance: null,
        autoApproved: true,
        applicableRules: applicableRules.length,
        message: 'Aprovado automaticamente'
      };
    }

    // Create approval instance
    const slaDeadline = this.ruleEngine.calculateSlaDeadline(
      bestMatch.rule,
      new Date()
    );

    const instanceData = {
      tenantId,
      ruleId: bestMatch.rule.id,
      entityType: request.entityType,
      entityId: request.entityId,
      entityData: request.entityData,
      currentStepIndex: 0,
      status: 'pending' as const,
      slaDeadline,
      slaStarted: new Date(),
      slaElapsedMinutes: 0,
      slaStatus: 'active' as const,
      requestComments: request.requestComments || null,
      finalComments: null,
      lastEscalationAt: null,
      remindersSent: 0,
      approvedAt: null,
      rejectedAt: null,
      completedAt: null,
      expiredAt: null,
      requestedById: request.requestedById,
      completedById: null,
      isActive: true
    };

    const instance = await this.approvalInstanceRepository.create(
      tenantId,
      instanceData
    );

    // TODO: Create approval steps based on rule configuration
    // TODO: Send initial notifications to approvers
    // TODO: Schedule SLA reminders

    return {
      instance,
      autoApproved: false,
      applicableRules: applicableRules.length,
      message: 'Processo de aprovação iniciado'
    };
  }

  async checkExistingInstance(
    tenantId: string,
    entityType: ModuleType,
    entityId: string
  ): Promise<ApprovalInstance | null> {
    const existingInstances = await this.approvalInstanceRepository.findByEntityId(
      tenantId,
      entityType,
      entityId
    );

    // Return the most recent pending instance, if any
    const pendingInstance = existingInstances.find(instance => 
      instance.isPending()
    );

    return pendingInstance || null;
  }
}
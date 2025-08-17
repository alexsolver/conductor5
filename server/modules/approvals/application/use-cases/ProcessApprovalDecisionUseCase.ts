import { IApprovalInstanceRepository } from '../../domain/repositories/IApprovalInstanceRepository';
import { ApprovalInstance } from '../../domain/entities/ApprovalInstance';
import { ApprovalDecision, DecisionType } from '../../domain/entities/ApprovalDecision';
import { InsertApprovalDecisionForm } from '../../../../../shared/schema-master';

export interface ProcessDecisionRequest {
  instanceId: string;
  stepId: string;
  decision: DecisionType;
  comments: string;
  approverId?: string;
  approverType: 'user' | 'group' | 'external' | 'automated';
  approverIdentifier?: string;
  reasonCode?: string;
  delegatedToId?: string;
  delegationReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProcessDecisionResult {
  decision: ApprovalDecision;
  instance: ApprovalInstance;
  completed: boolean;
  nextStep: number | null;
  message: string;
}

export class ProcessApprovalDecisionUseCase {
  constructor(
    private approvalInstanceRepository: IApprovalInstanceRepository
  ) {}

  async execute(
    tenantId: string,
    request: ProcessDecisionRequest,
    startTime?: Date
  ): Promise<ProcessDecisionResult> {
    // Find the approval instance
    const instance = await this.approvalInstanceRepository.findById(
      request.instanceId,
      tenantId
    );

    if (!instance) {
      throw new Error('Instância de aprovação não encontrada');
    }

    if (!instance.isPending()) {
      throw new Error('Esta aprovação já foi processada');
    }

    // Calculate response time
    const responseTimeMinutes = startTime ? 
      Math.floor((new Date().getTime() - startTime.getTime()) / (1000 * 60)) : 
      null;

    // Create the decision record
    const decisionData: InsertApprovalDecisionForm = {
      tenantId,
      instanceId: request.instanceId,
      stepId: request.stepId,
      approverId: request.approverId || undefined,
      approverType: request.approverType,
      approverIdentifier: request.approverIdentifier || undefined,
      decision: request.decision,
      comments: request.comments,
      reasonCode: request.reasonCode || undefined,
      delegatedToId: request.delegatedToId || undefined,
      delegationReason: request.delegationReason || undefined,
      responseTimeMinutes,
      ipAddress: request.ipAddress || undefined,
      userAgent: request.userAgent || undefined,
      isActive: true
    };

    const decision = await this.approvalInstanceRepository.createDecision(
      tenantId,
      decisionData
    );

    // Process the decision
    let updatedInstance: ApprovalInstance;
    let completed = false;
    let nextStep: number | null = null;

    if (request.decision === 'approved') {
      // TODO: Check if all required approvers for current step have approved
      // TODO: Move to next step or complete the instance
      updatedInstance = await this.approvalInstanceRepository.updateStatus(
        request.instanceId,
        tenantId,
        'approved',
        request.approverId
      );
      completed = true;
    } else if (request.decision === 'rejected') {
      updatedInstance = await this.approvalInstanceRepository.updateStatus(
        request.instanceId,
        tenantId,
        'rejected',
        request.approverId
      );
      completed = true;
    } else if (request.decision === 'delegated') {
      // TODO: Handle delegation logic
      updatedInstance = instance;
      completed = false;
    } else {
      // Escalation
      await this.approvalInstanceRepository.recordEscalation(
        request.instanceId,
        tenantId
      );
      updatedInstance = instance;
      completed = false;
    }

    const message = this.getDecisionMessage(request.decision, completed);

    return {
      decision,
      instance: updatedInstance,
      completed,
      nextStep,
      message
    };
  }

  private getDecisionMessage(decision: DecisionType, completed: boolean): string {
    switch (decision) {
      case 'approved':
        return completed ? 'Aprovação concluída com sucesso' : 'Aprovado - aguardando próxima etapa';
      case 'rejected':
        return 'Aprovação rejeitada';
      case 'delegated':
        return 'Aprovação delegada com sucesso';
      case 'escalated':
        return 'Aprovação escalada para nível superior';
      default:
        return 'Decisão processada';
    }
  }

  async validateDecisionPermissions(
    tenantId: string,
    instanceId: string,
    userId: string
  ): Promise<boolean> {
    // TODO: Implement permission validation
    // Check if user is authorized to make decisions on this instance
    // Consider current step, approver assignments, delegation rules, etc.
    return true;
  }
}
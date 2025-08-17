import { IApprovalRuleRepository } from '../../domain/repositories/IApprovalRuleRepository';
import { ApprovalRule } from '../../domain/entities/ApprovalRule';
import { ApprovalRuleEngine } from '../../domain/services/ApprovalRuleEngine';
import { InsertApprovalRuleForm } from '../../../../../shared/schema-master';

export class CreateApprovalRuleUseCase {
  constructor(
    private approvalRuleRepository: IApprovalRuleRepository,
    private ruleEngine: ApprovalRuleEngine
  ) {}

  async execute(
    tenantId: string,
    ruleData: InsertApprovalRuleForm,
    createdById: string
  ): Promise<ApprovalRule> {
    // Validate unique name
    const isNameUnique = await this.approvalRuleRepository.validateUniqueName(
      tenantId,
      ruleData.name
    );

    if (!isNameUnique) {
      throw new Error('Uma regra com este nome já existe');
    }

    // Validate rule data structure
    this.validateRuleData(ruleData);

    // Create the rule
    const rule = await this.approvalRuleRepository.create(
      tenantId,
      ruleData,
      createdById
    );

    return rule;
  }

  private validateRuleData(ruleData: InsertApprovalRuleForm): void {
    // Validate query conditions
    if (!ruleData.queryConditions?.conditions || ruleData.queryConditions.conditions.length === 0) {
      throw new Error('Pelo menos uma condição de consulta é obrigatória');
    }

    // Validate approval steps
    if (!ruleData.approvalSteps || ruleData.approvalSteps.length === 0) {
      throw new Error('Pelo menos uma etapa de aprovação é obrigatória');
    }

    // Validate each condition
    ruleData.queryConditions.conditions.forEach((condition, index) => {
      if (!condition.field || condition.field.trim().length === 0) {
        throw new Error(`Campo é obrigatório na condição ${index + 1}`);
      }

      if (!condition.operator) {
        throw new Error(`Operador é obrigatório na condição ${index + 1}`);
      }

      if (condition.value === null || condition.value === undefined) {
        throw new Error(`Valor é obrigatório na condição ${index + 1}`);
      }
    });

    // Validate each approval step
    ruleData.approvalSteps.forEach((step, index) => {
      if (!step.stepName || step.stepName.trim().length === 0) {
        throw new Error(`Nome da etapa é obrigatório na etapa ${index + 1}`);
      }

      if (!step.approvers || step.approvers.length === 0) {
        throw new Error(`Pelo menos um aprovador é obrigatório na etapa ${index + 1}`);
      }

      step.approvers.forEach((approver, approverIndex) => {
        if (!approver.identifier || approver.identifier.trim().length === 0) {
          throw new Error(`Identificador do aprovador é obrigatório na etapa ${index + 1}, aprovador ${approverIndex + 1}`);
        }

        if (!approver.type) {
          throw new Error(`Tipo do aprovador é obrigatório na etapa ${index + 1}, aprovador ${approverIndex + 1}`);
        }
      });
    });

    // Validate SLA
    if (ruleData.slaHours && ruleData.slaHours <= 0) {
      throw new Error('SLA deve ser maior que 0 horas');
    }

    // Validate priority
    if (ruleData.priority && (ruleData.priority < 1 || ruleData.priority > 999)) {
      throw new Error('Prioridade deve estar entre 1 e 999');
    }
  }
}
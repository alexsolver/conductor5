// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Application Command: UpdateApprovalRuleCommand - Use case for updating approval rules

import { ApprovalRule } from '../../domain/entities/ApprovalRule';
import { IApprovalRuleRepository } from '../../domain/repositories/IApprovalRuleRepository';
import { ApprovalRuleEngine } from '../../domain/services/ApprovalRuleEngine';

export interface UpdateApprovalRuleRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  queryConditions?: any;
  approvalSteps?: any[];
  defaultSlaHours?: number;
  escalationEnabled?: boolean;
  autoApprovalEnabled?: boolean;
  autoApprovalConditions?: any;
  isActive?: boolean;
  priority?: number;
  updatedById: string;
}

export interface UpdateApprovalRuleResponse {
  success: boolean;
  data?: ApprovalRule;
  error?: string;
  validationErrors?: string[];
}

export class UpdateApprovalRuleCommand {
  constructor(
    private readonly approvalRuleRepository: IApprovalRuleRepository,
    private readonly approvalRuleEngine: ApprovalRuleEngine
  ) {}

  async execute(request: UpdateApprovalRuleRequest): Promise<UpdateApprovalRuleResponse> {
    try {
      // Validate the request
      const validationErrors = await this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          validationErrors,
        };
      }

      // Check if the rule exists
      const existingRule = await this.approvalRuleRepository.findById(
        request.id,
        request.tenantId
      );

      if (!existingRule) {
        return {
          success: false,
          error: 'Regra de aprovação não encontrada',
        };
      }

      // Check if name is unique (if name is being updated)
      if (request.name && request.name !== existingRule.name) {
        const isNameUnique = await this.approvalRuleRepository.checkNameUniqueness(
          request.name,
          request.tenantId,
          request.id
        );

        if (!isNameUnique) {
          return {
            success: false,
            error: 'Uma regra de aprovação com este nome já existe',
          };
        }
      }

      // Validate approval steps configuration (if being updated)
      if (request.approvalSteps) {
        const stepValidation = this.approvalRuleEngine.validateApprovalSteps(
          request.approvalSteps
        );

        if (!stepValidation.isValid) {
          return {
            success: false,
            error: stepValidation.error,
            validationErrors: stepValidation.details,
          };
        }
      }

      // Validate query conditions (if being updated)
      if (request.queryConditions) {
        const conditionsValidation = this.approvalRuleEngine.validateQueryConditions(
          request.queryConditions
        );

        if (!conditionsValidation.isValid) {
          return {
            success: false,
            error: conditionsValidation.error,
            validationErrors: conditionsValidation.details,
          };
        }
      }

      // Update the approval rule
      const updatedRule = await this.approvalRuleRepository.update(request.id, {
        name: request.name,
        description: request.description,
        queryConditions: request.queryConditions,
        approvalSteps: request.approvalSteps,
        defaultSlaHours: request.defaultSlaHours,
        escalationEnabled: request.escalationEnabled,
        autoApprovalEnabled: request.autoApprovalEnabled,
        autoApprovalConditions: request.autoApprovalConditions,
        isActive: request.isActive,
        priority: request.priority,
        updatedById: request.updatedById,
      });

      // Check for potential conflicts with existing rules (if priority changed)
      if (request.priority !== undefined) {
        const conflicts = await this.approvalRuleRepository.findConflictingRules(updatedRule);
        
        if (conflicts.length > 0) {
          console.warn(`Rule updated but conflicts detected with ${conflicts.length} existing rules`);
        }
      }

      return {
        success: true,
        data: updatedRule,
      };

    } catch (error) {
      console.error('Error updating approval rule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      };
    }
  }

  private async validateRequest(request: UpdateApprovalRuleRequest): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (!request.id?.trim()) {
      errors.push('ID da regra é obrigatório');
    }

    if (!request.tenantId?.trim()) {
      errors.push('ID do tenant é obrigatório');
    }

    if (!request.updatedById?.trim()) {
      errors.push('ID do usuário atualizador é obrigatório');
    }

    // Business rules validation
    if (request.name !== undefined) {
      if (!request.name?.trim()) {
        errors.push('Nome da regra não pode ser vazio');
      } else if (request.name.length > 255) {
        errors.push('Nome da regra não pode ter mais de 255 caracteres');
      }
    }

    if (request.description !== undefined && request.description && request.description.length > 1000) {
      errors.push('Descrição não pode ter mais de 1000 caracteres');
    }

    if (request.defaultSlaHours !== undefined && (request.defaultSlaHours < 1)) {
      errors.push('SLA deve ser pelo menos 1 hora');
    }

    if (request.priority !== undefined && (request.priority < 1 || request.priority > 999)) {
      errors.push('Prioridade deve estar entre 1 e 999');
    }

    if (request.queryConditions !== undefined) {
      if (!request.queryConditions || (Array.isArray(request.queryConditions) && request.queryConditions.length === 0)) {
        errors.push('Pelo menos uma condição de consulta é obrigatória');
      }
    }

    if (request.approvalSteps !== undefined) {
      if (!request.approvalSteps || request.approvalSteps.length === 0) {
        errors.push('Pelo menos uma etapa de aprovação é obrigatória');
      }
    }

    return errors;
  }
}
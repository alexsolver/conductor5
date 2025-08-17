// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Application Command: CreateApprovalRuleCommand - Use case for creating approval rules

import { ApprovalRule } from '../../domain/entities/ApprovalRule';
import { IApprovalRuleRepository } from '../../domain/repositories/IApprovalRuleRepository';
import { ApprovalRuleEngine } from '../../domain/services/ApprovalRuleEngine';

export interface CreateApprovalRuleRequest {
  tenantId: string;
  name: string;
  description?: string;
  moduleType: 'tickets' | 'materials' | 'knowledge_base' | 'timecard' | 'contracts';
  entityType: string;
  queryConditions: any;
  approvalSteps: any[];
  defaultSlaHours: number;
  escalationEnabled?: boolean;
  autoApprovalEnabled?: boolean;
  autoApprovalConditions?: any;
  priority?: number;
  createdById: string;
}

export interface CreateApprovalRuleResponse {
  success: boolean;
  data?: ApprovalRule;
  error?: string;
  validationErrors?: string[];
}

export class CreateApprovalRuleCommand {
  constructor(
    private readonly approvalRuleRepository: IApprovalRuleRepository,
    private readonly approvalRuleEngine: ApprovalRuleEngine
  ) {}

  async execute(request: CreateApprovalRuleRequest): Promise<CreateApprovalRuleResponse> {
    try {
      // Validate the request
      const validationErrors = await this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          validationErrors,
        };
      }

      // Check if name is unique
      const isNameUnique = await this.approvalRuleRepository.checkNameUniqueness(
        request.name,
        request.tenantId
      );

      if (!isNameUnique) {
        return {
          success: false,
          error: 'Uma regra de aprovação com este nome já existe',
        };
      }

      // Validate approval steps configuration
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

      // Validate query conditions
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

      // Create the approval rule
      const approvalRule = await this.approvalRuleRepository.create({
        tenantId: request.tenantId,
        name: request.name,
        description: request.description,
        moduleType: request.moduleType,
        entityType: request.entityType,
        queryConditions: request.queryConditions,
        approvalSteps: request.approvalSteps,
        defaultSlaHours: request.defaultSlaHours,
        escalationEnabled: request.escalationEnabled ?? false,
        autoApprovalEnabled: request.autoApprovalEnabled ?? false,
        autoApprovalConditions: request.autoApprovalConditions,
        isActive: true,
        priority: request.priority ?? 100,
        createdById: request.createdById,
      });

      // Check for potential conflicts with existing rules
      const conflicts = await this.approvalRuleRepository.findConflictingRules(approvalRule);
      
      if (conflicts.length > 0) {
        console.warn(`Rule created but conflicts detected with ${conflicts.length} existing rules`);
      }

      return {
        success: true,
        data: approvalRule,
      };

    } catch (error) {
      console.error('Error creating approval rule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      };
    }
  }

  private async validateRequest(request: CreateApprovalRuleRequest): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (!request.name?.trim()) {
      errors.push('Nome da regra é obrigatório');
    }

    if (!request.tenantId?.trim()) {
      errors.push('ID do tenant é obrigatório');
    }

    if (!request.moduleType) {
      errors.push('Tipo de módulo é obrigatório');
    }

    if (!request.entityType?.trim()) {
      errors.push('Tipo de entidade é obrigatório');
    }

    if (!request.createdById?.trim()) {
      errors.push('ID do usuário criador é obrigatório');
    }

    if (!request.defaultSlaHours || request.defaultSlaHours < 1) {
      errors.push('SLA deve ser pelo menos 1 hora');
    }

    // Business rules validation
    if (request.name && request.name.length > 255) {
      errors.push('Nome da regra não pode ter mais de 255 caracteres');
    }

    if (request.description && request.description.length > 1000) {
      errors.push('Descrição não pode ter mais de 1000 caracteres');
    }

    if (request.priority !== undefined && (request.priority < 1 || request.priority > 999)) {
      errors.push('Prioridade deve estar entre 1 e 999');
    }

    if (!request.queryConditions || (Array.isArray(request.queryConditions) && request.queryConditions.length === 0)) {
      errors.push('Pelo menos uma condição de consulta é obrigatória');
    }

    if (!request.approvalSteps || request.approvalSteps.length === 0) {
      errors.push('Pelo menos uma etapa de aprovação é obrigatória');
    }

    // Validate module type
    const validModuleTypes = ['tickets', 'materials', 'knowledge_base', 'timecard', 'contracts'];
    if (request.moduleType && !validModuleTypes.includes(request.moduleType)) {
      errors.push('Tipo de módulo inválido');
    }

    return errors;
  }
}
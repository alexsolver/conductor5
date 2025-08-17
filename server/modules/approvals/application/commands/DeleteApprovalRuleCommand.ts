// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Application Command: DeleteApprovalRuleCommand - Use case for deleting approval rules

import { IApprovalRuleRepository } from '../../domain/repositories/IApprovalRuleRepository';
import { IApprovalInstanceRepository } from '../../domain/repositories/IApprovalInstanceRepository';

export interface DeleteApprovalRuleRequest {
  id: string;
  tenantId: string;
  deletedById: string;
  force?: boolean; // Force delete even if there are related instances
}

export interface DeleteApprovalRuleResponse {
  success: boolean;
  error?: string;
  warning?: string;
  relatedInstancesCount?: number;
}

export class DeleteApprovalRuleCommand {
  constructor(
    private readonly approvalRuleRepository: IApprovalRuleRepository,
    private readonly approvalInstanceRepository: IApprovalInstanceRepository
  ) {}

  async execute(request: DeleteApprovalRuleRequest): Promise<DeleteApprovalRuleResponse> {
    try {
      // Validate the request
      const validationErrors = await this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(', '),
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

      // Check for related approval instances
      const relatedInstances = await this.approvalInstanceRepository.findByRule(
        request.tenantId,
        request.id
      );

      if (relatedInstances.length > 0 && !request.force) {
        return {
          success: false,
          error: `Não é possível excluir a regra. Existem ${relatedInstances.length} instâncias de aprovação relacionadas`,
          relatedInstancesCount: relatedInstances.length,
        };
      }

      // Check for pending instances that would be affected
      const pendingInstances = relatedInstances.filter(
        instance => instance.status === 'pending'
      );

      if (pendingInstances.length > 0 && !request.force) {
        return {
          success: false,
          error: `Não é possível excluir a regra. Existem ${pendingInstances.length} aprovações pendentes que seriam afetadas`,
          relatedInstancesCount: pendingInstances.length,
        };
      }

      // If force delete is enabled and there are related instances, log a warning
      let warning: string | undefined;
      if (request.force && relatedInstances.length > 0) {
        warning = `Regra excluída com ${relatedInstances.length} instâncias relacionadas. ${pendingInstances.length} eram pendentes.`;
        console.warn(`Force deletion of approval rule ${request.id} with ${relatedInstances.length} related instances`);
      }

      // Delete the approval rule
      await this.approvalRuleRepository.delete(request.id, request.tenantId);

      return {
        success: true,
        warning,
        relatedInstancesCount: relatedInstances.length,
      };

    } catch (error) {
      console.error('Error deleting approval rule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      };
    }
  }

  private async validateRequest(request: DeleteApprovalRuleRequest): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (!request.id?.trim()) {
      errors.push('ID da regra é obrigatório');
    }

    if (!request.tenantId?.trim()) {
      errors.push('ID do tenant é obrigatório');
    }

    if (!request.deletedById?.trim()) {
      errors.push('ID do usuário que está excluindo é obrigatório');
    }

    return errors;
  }
}
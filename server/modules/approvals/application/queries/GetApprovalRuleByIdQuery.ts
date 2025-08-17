// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Application Query: GetApprovalRuleByIdQuery - Use case for retrieving a specific approval rule

import { ApprovalRule } from '../../domain/entities/ApprovalRule';
import { IApprovalRuleRepository } from '../../domain/repositories/IApprovalRuleRepository';

export interface GetApprovalRuleByIdRequest {
  id: string;
  tenantId: string;
}

export interface GetApprovalRuleByIdResponse {
  success: boolean;
  data?: ApprovalRule;
  error?: string;
}

export class GetApprovalRuleByIdQuery {
  constructor(
    private readonly approvalRuleRepository: IApprovalRuleRepository
  ) {}

  async execute(request: GetApprovalRuleByIdRequest): Promise<GetApprovalRuleByIdResponse> {
    try {
      // Validate the request
      const validationErrors = await this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(', '),
        };
      }

      // Get the approval rule
      const approvalRule = await this.approvalRuleRepository.findById(
        request.id,
        request.tenantId
      );

      if (!approvalRule) {
        return {
          success: false,
          error: 'Regra de aprovação não encontrada',
        };
      }

      return {
        success: true,
        data: approvalRule,
      };

    } catch (error) {
      console.error('Error retrieving approval rule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      };
    }
  }

  private async validateRequest(request: GetApprovalRuleByIdRequest): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (!request.id?.trim()) {
      errors.push('ID da regra é obrigatório');
    }

    if (!request.tenantId?.trim()) {
      errors.push('ID do tenant é obrigatório');
    }

    return errors;
  }
}
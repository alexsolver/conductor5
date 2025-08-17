// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Application Query: GetApprovalRulesQuery - Use case for retrieving approval rules

import { ApprovalRule } from '../../domain/entities/ApprovalRule';
import { IApprovalRuleRepository, ApprovalRuleFilters } from '../../domain/repositories/IApprovalRuleRepository';

export interface GetApprovalRulesRequest {
  tenantId: string;
  moduleType?: string;
  entityType?: string;
  isActive?: boolean;
  createdById?: string;
  search?: string;
}

export interface GetApprovalRulesResponse {
  success: boolean;
  data?: ApprovalRule[];
  error?: string;
  total?: number;
}

export class GetApprovalRulesQuery {
  constructor(
    private readonly approvalRuleRepository: IApprovalRuleRepository
  ) {}

  async execute(request: GetApprovalRulesRequest): Promise<GetApprovalRulesResponse> {
    try {
      // Validate the request
      const validationErrors = await this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(', '),
        };
      }

      // Build filters from request
      const filters: ApprovalRuleFilters = {
        tenantId: request.tenantId,
        moduleType: request.moduleType,
        entityType: request.entityType,
        isActive: request.isActive,
        createdById: request.createdById,
        search: request.search,
      };

      // Get approval rules based on filters
      const approvalRules = await this.approvalRuleRepository.findByFilters(filters);

      return {
        success: true,
        data: approvalRules,
        total: approvalRules.length,
      };

    } catch (error) {
      console.error('Error retrieving approval rules:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      };
    }
  }

  private async validateRequest(request: GetApprovalRulesRequest): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (!request.tenantId?.trim()) {
      errors.push('ID do tenant é obrigatório');
    }

    // Validate module type if provided
    if (request.moduleType) {
      const validModuleTypes = ['tickets', 'materials', 'knowledge_base', 'timecard', 'contracts'];
      if (!validModuleTypes.includes(request.moduleType)) {
        errors.push('Tipo de módulo inválido');
      }
    }

    return errors;
  }
}
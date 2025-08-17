// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Application Query: GetApprovalInstancesQuery - Use case for retrieving approval instances

import { ApprovalInstance } from '../../domain/entities/ApprovalInstance';
import { 
  IApprovalInstanceRepository, 
  ApprovalInstanceFilters,
  ApprovalInstanceWithDetails 
} from '../../domain/repositories/IApprovalInstanceRepository';

export interface GetApprovalInstancesRequest {
  tenantId: string;
  status?: string | string[];
  entityType?: string;
  entityId?: string;
  requestedById?: string;
  ruleId?: string;
  urgencyLevel?: number;
  slaViolated?: boolean;
  overdueOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  includeDetails?: boolean;
}

export interface GetApprovalInstancesResponse {
  success: boolean;
  data?: ApprovalInstance[] | ApprovalInstanceWithDetails[];
  error?: string;
  total?: number;
  totalPages?: number;
  currentPage?: number;
}

export class GetApprovalInstancesQuery {
  constructor(
    private readonly approvalInstanceRepository: IApprovalInstanceRepository
  ) {}

  async execute(request: GetApprovalInstancesRequest): Promise<GetApprovalInstancesResponse> {
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
      const filters: ApprovalInstanceFilters = {
        tenantId: request.tenantId,
        status: request.status,
        entityType: request.entityType,
        entityId: request.entityId,
        requestedById: request.requestedById,
        ruleId: request.ruleId,
        urgencyLevel: request.urgencyLevel,
        slaViolated: request.slaViolated,
        overdueOnly: request.overdueOnly,
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
      };

      // Handle pagination
      if (request.page && request.limit) {
        const paginatedResult = await this.approvalInstanceRepository.findPaginated(
          filters,
          request.page,
          request.limit
        );

        return {
          success: true,
          data: paginatedResult.instances,
          total: paginatedResult.total,
          totalPages: paginatedResult.totalPages,
          currentPage: paginatedResult.currentPage,
        };
      }

      // Get approval instances based on filters
      let approvalInstances;
      
      if (request.includeDetails) {
        // This would need a method to get instances with details in batch
        // For now, we'll use the basic method and note this limitation
        const basicInstances = await this.approvalInstanceRepository.findByFilters(filters);
        approvalInstances = basicInstances;
      } else {
        approvalInstances = await this.approvalInstanceRepository.findByFilters(filters);
      }

      return {
        success: true,
        data: approvalInstances,
        total: approvalInstances.length,
      };

    } catch (error) {
      console.error('Error retrieving approval instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      };
    }
  }

  private async validateRequest(request: GetApprovalInstancesRequest): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (!request.tenantId?.trim()) {
      errors.push('ID do tenant é obrigatório');
    }

    // Validate entity type if provided
    if (request.entityType) {
      const validEntityTypes = ['tickets', 'materials', 'knowledge_base', 'timecard', 'contracts'];
      if (!validEntityTypes.includes(request.entityType)) {
        errors.push('Tipo de entidade inválido');
      }
    }

    // Validate status if provided
    if (request.status) {
      const validStatuses = ['pending', 'approved', 'rejected', 'expired', 'cancelled'];
      const statusesToCheck = Array.isArray(request.status) ? request.status : [request.status];
      
      for (const status of statusesToCheck) {
        if (!validStatuses.includes(status)) {
          errors.push(`Status inválido: ${status}`);
        }
      }
    }

    // Validate urgency level if provided
    if (request.urgencyLevel !== undefined && (request.urgencyLevel < 1 || request.urgencyLevel > 5)) {
      errors.push('Nível de urgência deve estar entre 1 e 5');
    }

    // Validate pagination parameters
    if (request.page !== undefined && request.page < 1) {
      errors.push('Número da página deve ser maior que 0');
    }

    if (request.limit !== undefined && (request.limit < 1 || request.limit > 100)) {
      errors.push('Limite deve estar entre 1 e 100');
    }

    // Validate date range
    if (request.dateFrom && request.dateTo && request.dateFrom > request.dateTo) {
      errors.push('Data inicial deve ser anterior à data final');
    }

    return errors;
  }
}
/**
 * Get All Tenants Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetAllTenantsUseCase
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

import { ISaasAdminRepository } from '../../domain/repositories/ISaasAdminRepository';
import { TenantManagement, SaasAdminDomainService } from '../../domain/entities/SaasAdmin';

export interface GetAllTenantsRequest {
  adminId: string;
  adminRole: string;
  filters?: {
    status?: string;
    plan?: string;
    healthStatus?: string;
    search?: string;
  };
}

export interface GetAllTenantsResponse {
  success: boolean;
  data?: Array<TenantManagement & {
    healthStatus: 'healthy' | 'warning' | 'critical';
    utilization: {
      users: number;
      tickets: number;
      storage: number;
      integrations: number;
      overall: number;
    };
    limitsExceeded: string[];
  }>;
  errors?: string[];
}

export class GetAllTenantsUseCase {
  constructor(private saasAdminRepository: ISaasAdminRepository) {}

  async execute(request: GetAllTenantsRequest): Promise<GetAllTenantsResponse> {
    try {
      // Validate permissions
      if (!SaasAdminDomainService.hasSaasAdminPermission(request.adminRole)) {
        return {
          success: false,
          errors: ['Acesso negado. Permissões de SaaS Admin necessárias.']
        };
      }

      // Get tenants with filters
      const tenants = await this.saasAdminRepository.getAllTenants(request.filters);

      // Enrich tenant data with health status and utilization
      const enrichedTenants = tenants.map(tenant => {
        const healthStatus = SaasAdminDomainService.getTenantHealthStatus(tenant);
        const utilization = SaasAdminDomainService.calculateTenantUtilization(tenant);
        const limitsValidation = SaasAdminDomainService.validateTenantLimits(tenant);

        return {
          ...tenant,
          healthStatus,
          utilization,
          limitsExceeded: limitsValidation.errors
        };
      });

      // Apply health status filter if provided
      let filteredTenants = enrichedTenants;
      if (request.filters?.healthStatus) {
        filteredTenants = enrichedTenants.filter(
          tenant => tenant.healthStatus === request.filters!.healthStatus
        );
      }

      return {
        success: true,
        data: filteredTenants
      };

    } catch (error) {
      console.error('[GetAllTenantsUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}
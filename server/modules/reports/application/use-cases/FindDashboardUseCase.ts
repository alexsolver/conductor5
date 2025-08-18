// ✅ 1QA.MD COMPLIANCE: FIND DASHBOARD USE CASE
// Application Layer - Business Logic for Dashboard Retrieval

import type { IReportsRepository } from '../../domain/repositories/IReportsRepository';
import { dashboards } from '../../../../../shared/schema-reports';

// ✅ 1QA.MD COMPLIANCE: TYPE FROM SCHEMA
type Dashboard = typeof dashboards.$inferSelect;

interface FindDashboardRequest {
  filters?: {
    name?: string;
    isPublic?: boolean;
    ownerId?: string;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  };
  userId: string;
  userRoles: string[];
  tenantId: string;
}

interface FindDashboardResponse {
  success: boolean;
  data?: {
    dashboards: Dashboard[];
    total: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  errors?: string[];
  message: string;
}

export class FindDashboardUseCase {
  constructor(private reportsRepository: IReportsRepository) {}

  async execute(request: FindDashboardRequest): Promise<FindDashboardResponse> {
    try {
      // Validate tenant isolation
      if (!request.tenantId) {
        return {
          success: false,
          message: 'Tenant ID is required',
          errors: ['Multi-tenant isolation violation']
        };
      }

      // Prepare filters with defaults
      const filters = {
        ...request.filters,
        sortBy: request.filters?.sortBy || 'createdAt',
        sortOrder: request.filters?.sortOrder || 'desc',
        limit: request.filters?.limit || 10,
        offset: request.filters?.offset || 0
      };

      // Execute repository operation
      const result = await this.reportsRepository.findDashboards(filters, request.tenantId);

      // Calculate pagination info
      const limit = filters.limit;
      const page = Math.floor(filters.offset / limit) + 1;
      const totalPages = Math.ceil(result.total / limit);

      return {
        success: true,
        message: 'Dashboards retrieved successfully',
        data: {
          dashboards: result.dashboards,
          total: result.total,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages
          }
        }
      };

    } catch (error: unknown) {
      console.error('[FindDashboardUseCase] Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve dashboards',
        errors: ['Internal server error during dashboard retrieval']
      };
    }
  }
}
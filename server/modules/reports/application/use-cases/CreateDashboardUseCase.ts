// ✅ 1QA.MD COMPLIANCE: CREATE DASHBOARD USE CASE
// Application Layer - Business Logic for Dashboard Creation

import type { IReportsRepository } from '../../domain/repositories/IReportsRepository';
import { dashboards } from '../../../../../shared/schema-reports';

// ✅ 1QA.MD COMPLIANCE: TYPE FROM SCHEMA
type Dashboard = typeof dashboards.$inferSelect;

interface CreateDashboardRequest {
  data: {
    name: string;
    description?: string;
    layout: any;
    isPublic?: boolean;
    allowedRoles?: string[];
    refreshInterval?: number;
    metadata?: any;
  };
  userId: string;
  userRoles: string[];
  tenantId: string;
}

interface CreateDashboardResponse {
  success: boolean;
  data?: Dashboard;
  errors?: string[];
  message: string;
}

export class CreateDashboardUseCase {
  constructor(private reportsRepository: IReportsRepository) {}

  async execute(request: CreateDashboardRequest): Promise<CreateDashboardResponse> {
    try {
      // Validate tenant isolation
      if (!request.tenantId) {
        return {
          success: false,
          message: 'Tenant ID is required',
          errors: ['Multi-tenant isolation violation']
        };
      }

      // Validate user authorization
      if (!request.userId) {
        return {
          success: false,
          message: 'User ID is required',
          errors: ['User authentication required']
        };
      }

      // Create dashboard data
      const dashboardData = {
        ...request.data,
        ownerId: request.userId,
        isPublic: request.data.isPublic ?? false,
        refreshInterval: request.data.refreshInterval ?? 300,
        metadata: request.data.metadata ?? {}
      };

      // Execute repository operation
      const dashboard = await this.reportsRepository.createDashboard(dashboardData, request.tenantId);

      return {
        success: true,
        message: 'Dashboard created successfully',
        data: dashboard
      };

    } catch (error: unknown) {
      console.error('[CreateDashboardUseCase] Error:', error);
      return {
        success: false,
        message: 'Failed to create dashboard',
        errors: ['Internal server error during dashboard creation']
      };
    }
  }
}
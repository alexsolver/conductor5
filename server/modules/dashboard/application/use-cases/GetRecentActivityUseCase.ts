/**
 * Get Recent Activity Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetRecentActivityUseCase
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { ActivityItem, DashboardDomainService } from '../../domain/entities/Dashboard';

export interface GetRecentActivityRequest {
  tenantId: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  timeRange?: string;
}

export interface GetRecentActivityResponse {
  success: boolean;
  data?: ActivityItem[];
  errors?: string[];
}

export class GetRecentActivityUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(request: GetRecentActivityRequest): Promise<GetRecentActivityResponse> {
    try {
      // Validate request
      if (!request.tenantId) {
        return {
          success: false,
          errors: ['Tenant ID é obrigatório']
        };
      }

      let activities: ActivityItem[];

      if (request.userId) {
        // Get activity for specific user
        activities = await this.dashboardRepository.getActivityByUser(
          request.userId,
          request.tenantId,
          request.limit || 20
        );
      } else if (request.entityType && request.entityId) {
        // Get activity for specific entity
        activities = await this.dashboardRepository.getActivityByEntity(
          request.entityType,
          request.entityId,
          request.tenantId
        );
      } else {
        // Get general recent activity
        activities = await this.dashboardRepository.getRecentActivity(
          request.tenantId,
          request.limit || 20,
          request.timeRange
        );
      }

      // Filter by time range if specified
      if (request.timeRange) {
        activities = DashboardDomainService.filterActivitiesByTimeRange(activities, request.timeRange);
      }

      return {
        success: true,
        data: activities
      };

    } catch (error) {
      console.error('[GetRecentActivityUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}
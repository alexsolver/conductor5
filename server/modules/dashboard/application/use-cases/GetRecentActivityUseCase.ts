/**
 * GetRecentActivityUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for recent activity business logic
 */

import { ActivityItem } from '../../domain/entities/ActivityItem';

interface ActivityRepositoryInterface {
  getRecentActivity(tenantId: string, limit: number): Promise<ActivityItem[]>;
}

export interface GetRecentActivityRequest {
  tenantId: string;
  limit?: number;
}

export interface GetRecentActivityResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    userId: string;
    entityType: string;
    entityId: string;
  }>;
  filters: {
    limit: number;
    tenantId: string;
  };
}

export class GetRecentActivityUseCase {
  constructor(
    private readonly activityRepository: ActivityRepositoryInterface
  ) {}

  async execute(request: GetRecentActivityRequest): Promise<GetRecentActivityResponse> {
    const limit = request.limit || 10;
    const activities = await this.activityRepository.getRecentActivity(
      request.tenantId,
      limit
    );

    return {
      success: true,
      message: 'Recent activity retrieved successfully',
      data: activities.map(activity => ({
        id: activity.getId(),
        type: activity.getType(),
        description: activity.getDescription(),
        timestamp: activity.getTimestamp(),
        userId: activity.getUserId(),
        entityType: activity.getEntityType(),
        entityId: activity.getEntityId()
      })),
      filters: {
        limit,
        tenantId: request.tenantId
      }
    };
  }
}
/**
 * Create Activity Item Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateActivityItemUseCase
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { ActivityItem, DashboardDomainService } from '../../domain/entities/Dashboard';

export interface CreateActivityItemRequest {
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'ticket' | 'customer' | 'user' | 'company' | 'location' | 'timecard' | 'other';
  entityId: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateActivityItemResponse {
  success: boolean;
  data?: ActivityItem;
  errors?: string[];
}

export class CreateActivityItemUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(request: CreateActivityItemRequest): Promise<CreateActivityItemResponse> {
    try {
      // Validate business rules
      const validation = DashboardDomainService.validateActivityItem(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Create activity item
      const activityItem = await this.dashboardRepository.createActivityItem({
        tenantId: request.tenantId,
        userId: request.userId,
        userName: request.userName,
        action: request.action,
        entityType: request.entityType,
        entityId: request.entityId,
        entityName: request.entityName,
        description: request.description,
        metadata: request.metadata || {},
        timestamp: new Date(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        isActive: true
      });

      return {
        success: true,
        data: activityItem
      };

    } catch (error) {
      console.error('[CreateActivityItemUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}
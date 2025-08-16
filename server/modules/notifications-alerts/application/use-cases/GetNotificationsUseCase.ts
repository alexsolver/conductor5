// APPLICATION USE CASE - Clean Architecture
// Application layer - Query notifications

import { INotificationRepository, NotificationFilters } from '../../domain/repositories/INotificationRepository';
import { NotificationEntity } from '../../domain/entities/Notification';
import { NotificationStatus, NotificationSeverity, NotificationType } from '@shared/schema-notifications';

export interface GetNotificationsRequest {
  userId?: string;
  status?: NotificationStatus[];
  type?: NotificationType[];
  severity?: NotificationSeverity[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  dateFrom?: string;
  dateTo?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'scheduledAt' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

export interface GetNotificationsResponse {
  success: boolean;
  data?: {
    notifications: Array<{
      id: string;
      type: string;
      severity: NotificationSeverity;
      status: NotificationStatus;
      title: string;
      message: string;
      metadata: Record<string, any>;
      channels: string[];
      userId: string | null;
      relatedEntityType: string | null;
      relatedEntityId: string | null;
      scheduledAt: Date;
      sentAt: Date | null;
      deliveredAt: Date | null;
      readAt: Date | null;
      createdAt: Date;
      isExpired: boolean;
      canBeSent: boolean;
      requiresEscalation: boolean;
    }>;
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  error?: string;
}

export class GetNotificationsUseCase {
  constructor(
    private notificationRepository: INotificationRepository
  ) {}

  async execute(
    request: GetNotificationsRequest,
    tenantId: string
  ): Promise<GetNotificationsResponse> {
    try {
      // Build filters
      const filters: NotificationFilters = {};
      
      if (request.status && request.status.length > 0) {
        filters.status = request.status;
      }
      
      if (request.type && request.type.length > 0) {
        filters.type = request.type;
      }
      
      if (request.severity && request.severity.length > 0) {
        filters.severity = request.severity;
      }
      
      if (request.userId) {
        filters.userId = request.userId;
      }
      
      if (request.relatedEntityType) {
        filters.relatedEntityType = request.relatedEntityType;
      }
      
      if (request.relatedEntityId) {
        filters.relatedEntityId = request.relatedEntityId;
      }
      
      if (request.dateFrom) {
        filters.createdAfter = new Date(request.dateFrom);
      }
      
      if (request.dateTo) {
        filters.createdBefore = new Date(request.dateTo);
      }

      // Pagination
      const page = request.page || 1;
      const pageSize = Math.min(request.pageSize || 50, 100); // Max 100 per page
      const offset = (page - 1) * pageSize;

      // Get notifications and total count
      const [notifications, total] = await Promise.all([
        this.notificationRepository.findMany(filters, tenantId, pageSize, offset),
        this.notificationRepository.count(filters, tenantId)
      ]);

      // Map entities to response format
      const notificationsData = notifications.map(notification => this.mapToResponse(notification));

      return {
        success: true,
        data: {
          notifications: notificationsData,
          pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get notifications'
      };
    }
  }

  private mapToResponse(notification: NotificationEntity) {
    return {
      id: notification.getId(),
      type: notification.getType(),
      severity: notification.getSeverity(),
      status: notification.getStatus(),
      title: notification.getTitle(),
      message: notification.getMessage(),
      metadata: notification.getMetadata(),
      channels: notification.getChannels(),
      userId: notification.getUserId(),
      relatedEntityType: notification.getRelatedEntityType(),
      relatedEntityId: notification.getRelatedEntityId(),
      scheduledAt: notification.getScheduledAt(),
      sentAt: notification.getSentAt(),
      deliveredAt: notification.getDeliveredAt(),
      readAt: null, // TODO: Implement read tracking
      createdAt: notification.getCreatedAt(),
      isExpired: notification.isExpired(),
      canBeSent: notification.canBeSent(),
      requiresEscalation: notification.requiresEscalation()
    };
  }
}
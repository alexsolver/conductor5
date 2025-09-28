// APPLICATION USE CASE - Clean Architecture
// Application layer - Orchestrates domain logic

import { NotificationEntity } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationDomainService } from '../../domain/services/NotificationDomainService';
import { 
  NotificationType, 
  NotificationSeverity, 
  NotificationChannelType 
} from '@shared/schema-notifications';
import { v4 as uuidv4 } from 'uuid';

export interface CreateNotificationRequest {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  channels?: NotificationChannelType[];
  scheduledAt?: Date;
  expiresAt?: Date;
  userId?: string;
  userIds?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  templateVariables?: Record<string, any>;
}

export interface CreateNotificationResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    scheduledAt: Date;
    channels: NotificationChannelType[];
  };
  error?: string;
  violations?: string[];
}

export class CreateNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private domainService: NotificationDomainService
  ) {}

  async execute(
    request: CreateNotificationRequest, 
    tenantId: string,
    createdBy?: string
  ): Promise<CreateNotificationResponse> {
    try {
      // Determine optimal channels if not provided
      const channels = request.channels || 
        this.domainService.determineOptimalChannels(
          request.type, 
          request.severity
        );

      // Handle template variables if provided
      let title = request.title;
      let message = request.message;
      
      if (request.templateVariables) {
        const content = this.domainService.generateNotificationContent(
          title, 
          message, 
          request.templateVariables
        );
        title = content.title;
        message = content.message;
      }

      // Create notification entity
      const notificationId = uuidv4();
      const scheduledAt = request.scheduledAt || new Date();
      const expiresAt = request.expiresAt;

      // Handle multiple recipients
      const notifications: NotificationEntity[] = [];
      
      if (request.userIds && request.userIds.length > 0) {
        // Create individual notifications for each user
        for (const userId of request.userIds) {
          const notification = this.createNotificationEntity({
            id: uuidv4(),
            tenantId,
            type: request.type,
            severity: request.severity,
            title,
            message,
            metadata: request.metadata || {},
            channels,
            scheduledAt,
            expiresAt,
            userId,
            relatedEntityType: request.relatedEntityType,
            relatedEntityId: request.relatedEntityId
          });

          notifications.push(notification);
        }
      } else {
        // Single notification
        const notification = this.createNotificationEntity({
          id: notificationId,
          tenantId,
          type: request.type,
          severity: request.severity,
          title,
          message,
          metadata: request.metadata || {},
          channels,
          scheduledAt,
          expiresAt,
          userId: request.userId,
          relatedEntityType: request.relatedEntityType,
          relatedEntityId: request.relatedEntityId
        });

        notifications.push(notification);
      }

      // Validate business rules for all notifications
      for (const notification of notifications) {
        const validation = this.domainService.validateNotificationRules(notification);
        if (!validation.isValid) {
          return {
            success: false,
            error: 'Notification validation failed',
            violations: validation.violations
          };
        }
      }

      // Persist notifications
      const createdNotifications: NotificationEntity[] = [];
      for (const notification of notifications) {
        // Debug: Log metadata before creating notification
        console.log('🔍 [CreateNotificationUseCase] Creating notification with metadata:', {
          notificationId: notification.getId(),
          metadata: notification.getMetadata(),
          metadataType: typeof notification.getMetadata(),
          metadataKeys: Object.keys(notification.getMetadata()),
          metadataStringified: JSON.stringify(notification.getMetadata())
        });
        
        const created = await this.notificationRepository.create(notification, tenantId);
        createdNotifications.push(created);
      }

      // Return response for the primary notification
      const primaryNotification = createdNotifications[0];
      
      return {
        success: true,
        data: {
          id: primaryNotification.getId(),
          status: primaryNotification.getStatus(),
          scheduledAt: primaryNotification.getScheduledAt(),
          channels: primaryNotification.getChannels()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create notification'
      };
    }
  }

  private createNotificationEntity(params: {
    id: string;
    tenantId: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    message: string;
    metadata: Record<string, any>;
    channels: NotificationChannelType[];
    scheduledAt: Date;
    expiresAt?: Date | null;
    userId?: string | null;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
  }): NotificationEntity {
    return new NotificationEntity(
      params.id,
      params.tenantId,
      params.type,
      params.severity,
      params.title,
      params.message,
      params.metadata,
      params.channels,
      'pending',
      params.scheduledAt,
      params.expiresAt || null,
      null, // sentAt
      null, // deliveredAt
      null, // failedAt
      params.relatedEntityType || null,
      params.relatedEntityId || null,
      params.userId || null,
      0, // retryCount
      3, // maxRetries
      new Date(),
      new Date()
    );
  }
}
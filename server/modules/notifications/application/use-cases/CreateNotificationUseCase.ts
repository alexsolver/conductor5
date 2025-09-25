// ✅ 1QA.MD COMPLIANCE: CREATE NOTIFICATION USE CASE
// Application layer - Business logic for creating notifications

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { INotificationPreferenceRepository } from '../../domain/repositories/INotificationPreferenceRepository';
import { Notification, NotificationType, NotificationChannel, NotificationPriority } from '../../domain/entities/Notification';

export interface CreateNotificationRequest {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduledAt?: Date;
  expiresAt?: Date;
  sourceId?: string;
  sourceType?: string;
  createdBy?: string;
}

export interface CreateNotificationResponse {
  success: boolean;
  notificationId?: string;
  message: string;
  errors?: string[];
}

export class CreateNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private preferenceRepository: INotificationPreferenceRepository
  ) {}

  async execute(request: CreateNotificationRequest): Promise<CreateNotificationResponse> {
    try {
      // Validate input
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        };
      }

      // Get user notification preferences
      const userPreferences = await this.preferenceRepository.getUserPreferences(
        request.userId,
        request.tenantId
      );

      // Determine channels based on user preferences and request
      const channels = this.determineChannels(request, userPreferences);

      if (channels.length === 0) {
        return {
          success: false,
          message: 'No enabled channels for this notification type'
        };
      }

      // Create notifications for each channel
      const notifications: Notification[] = [];
      const errors: string[] = [];

      for (const channel of channels) {
        try {
          const notificationData = {
            tenantId: request.tenantId,
            userId: request.userId,
            type: request.type,
            channel: channel,
            title: request.title,
            message: request.message,
            data: request.data || {},
            status: 'pending' as const,
            priority: request.priority || 'medium',
            scheduledAt: request.scheduledAt,
            expiresAt: request.expiresAt,
            sourceId: request.sourceId,
            sourceType: request.sourceType,
            retryCount: 0,
            maxRetries: this.getMaxRetries(channel),
            isActive: true,
            createdBy: request.createdBy
          };

          const notification = await this.notificationRepository.create(notificationData);
          notifications.push(notification);
        } catch (error) {
          errors.push(`Failed to create notification for channel ${channel}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (notifications.length === 0) {
        return {
          success: false,
          message: 'Failed to create any notifications',
          errors
        };
      }

      return {
        success: true,
        notificationId: notifications[0].id, // Return ID of first notification
        message: `Created ${notifications.length} notification(s) across ${channels.length} channel(s)`,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private validateRequest(request: CreateNotificationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.tenantId) {
      errors.push('Tenant ID is required');
    }

    // Ensure userId is set - use system user for automation if not provided
    if (!request.userId) {
      if (request.type === 'automation_notification') {
        // Auto-assign system automation user
        (request as any).userId = '550e8400-e29b-41d4-a716-446655440001';
      } else {
        errors.push('User ID is required');
      }
    }

    if (!request.type) {
      errors.push('Notification type is required');
    }

    if (!request.title || request.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!request.message || request.message.trim().length === 0) {
      errors.push('Message is required');
    }

    if (request.title && request.title.length > 255) {
      errors.push('Title must be 255 characters or less');
    }

    if (request.scheduledAt && request.scheduledAt < new Date()) {
      errors.push('Scheduled time cannot be in the past');
    }

    if (request.expiresAt && request.expiresAt < new Date()) {
      errors.push('Expiration time cannot be in the past');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private determineChannels(
    request: CreateNotificationRequest,
    userPreferences: any
  ): NotificationChannel[] {
    // If specific channels are requested, use those
    if (request.channels && request.channels.length > 0) {
      return request.channels;
    }

    // Get channels from user preferences for this notification type
    const typePreference = userPreferences.preferences[request.type];
    if (typePreference && typePreference.enabled) {
      return typePreference.channels || [];
    }

    // Default fallback channels based on priority
    switch (request.priority) {
      case 'critical':
        return ['in_app', 'email', 'sms'];
      case 'high':
        return ['in_app', 'email'];
      case 'medium':
        return ['in_app'];
      case 'low':
      default:
        return ['in_app'];
    }
  }

  private getMaxRetries(channel: NotificationChannel): number {
    switch (channel) {
      case 'email':
        return 3;
      case 'sms':
        return 2;
      case 'webhook':
        return 5;
      case 'slack':
        return 3;
      case 'in_app':
      default:
        return 1; // In-app notifications don't need retries
    }
  }
}
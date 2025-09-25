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
  data?: Notification; // Added for consistency with the original intent of returning data
}

export class CreateNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private preferenceRepository: INotificationPreferenceRepository
  ) {}

  async execute(request: CreateNotificationRequest): Promise<CreateNotificationResponse> {
    try {
      console.log('🔔 [CreateNotificationUseCase] Creating notification:', {
        tenantId: request.tenantId,
        userId: request.userId,
        type: request.type,
        title: request.title?.substring(0, 50)
      });

      // ✅ 1QA.MD: Validate required fields
      if (!request.tenantId || !request.userId || !request.title || !request.message) {
        console.error('❌ [CreateNotificationUseCase] Missing required fields');
        return {
          success: false,
          message: 'Missing required fields: tenantId, userId, title, message'
        };
      }

      // ✅ 1QA.MD: Get user preferences following domain patterns
      let preferences;
      try {
        // Assuming findByUserId returns preferences that might include notificationType and channels
        preferences = await this.preferenceRepository.findByUserId(
          request.userId,
          request.tenantId
        );
        console.log('📋 [CreateNotificationUseCase] User preferences loaded:', preferences?.length || 0);
      } catch (error) {
        console.warn('⚠️ [CreateNotificationUseCase] Could not load user preferences, using defaults:', error);
        preferences = null;
      }

      // ✅ 1QA.MD: Determine channels to use based on request and preferences
      let channelsToUse = request.channels || ['in_app'];

      if (preferences && Array.isArray(preferences)) {
        // Filter channels based on user preferences for the specific notification type
        channelsToUse = channelsToUse.filter(channel => {
          const pref = preferences.find(p => p.notificationType === request.type);
          // If preference exists and is enabled, use its channels. Otherwise, consider the channel allowed.
          return pref ? pref.channels.includes(channel) : true;
        });
      }

      if (channelsToUse.length === 0) {
        channelsToUse = ['in_app']; // Fallback to in-app notifications if no channels are enabled or determined
      }

      console.log('📡 [CreateNotificationUseCase] Using channels:', channelsToUse);

      // ✅ 1QA.MD: Create notifications for each channel
      const createdNotifications = [];

      for (const channel of channelsToUse) {
        try {
          const notification = await this.notificationRepository.create({
            tenantId: request.tenantId,
            userId: request.userId,
            type: request.type,
            title: request.title,
            message: request.message,
            channel,
            priority: request.priority || 'medium',
            data: request.data || {},
            scheduledAt: request.scheduledAt,
            expiresAt: request.expiresAt,
            sourceId: request.sourceId,
            sourceType: request.sourceType,
            isActive: true,
            status: 'pending', // Assuming default status is pending
            retryCount: 0, // Assuming default retry count is 0
            maxRetries: this.getMaxRetries(channel) // Get max retries based on channel
          });

          createdNotifications.push(notification);
          console.log(`✅ [CreateNotificationUseCase] Notification created for channel ${channel}:`, notification.id);
        } catch (channelError) {
          console.error(`❌ [CreateNotificationUseCase] Failed to create notification for channel ${channel}:`, channelError);
          // Continue with other channels instead of failing completely
        }
      }

      if (createdNotifications.length === 0) {
        console.error('❌ [CreateNotificationUseCase] Failed to create notifications for any channel');
        return {
          success: false,
          message: 'Failed to create notifications for any channel'
        };
      }

      console.log(`✅ [CreateNotificationUseCase] Successfully created ${createdNotifications.length} notifications`);

      return {
        success: true,
        notificationId: createdNotifications[0].id, // Return ID of first created notification
        message: `Notification created successfully for ${createdNotifications.length} channel(s)`,
        data: createdNotifications[0] // Return first notification as primary
      };

    } catch (error) {
      console.error('❌ [CreateNotificationUseCase] Error creating notification:', error);
      return {
        success: false,
        message: `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Helper method to get max retries based on channel, conforming to 1QA.MD standards if applicable
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
        return 1; // Default retry count for in-app notifications
    }
  }
}
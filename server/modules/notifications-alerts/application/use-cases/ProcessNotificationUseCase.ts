// APPLICATION USE CASE - Clean Architecture
// Application layer - Process and send notifications

import { NotificationEntity } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationDomainService } from '../../domain/services/NotificationDomainService';
import { INotificationDeliveryService } from '../../infrastructure/services/INotificationDeliveryService';

export interface ProcessNotificationResponse {
  processed: number;
  sent: number;
  failed: number;
  expired: number;
  details: Array<{
    id: string;
    status: 'sent' | 'failed' | 'expired' | 'skipped';
    reason?: string;
    channels?: string[];
  }>;
  notifications?: any[];
}

export class ProcessNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private domainService: NotificationDomainService,
    private deliveryService: INotificationDeliveryService
  ) {}

  async execute(tenantId: string, limit: number = 50, options?: { urgentOnly?: boolean }): Promise<ProcessNotificationResponse> {
    const response: ProcessNotificationResponse = {
      processed: 0,
      sent: 0,
      failed: 0,
      expired: 0,
      details: [],
      notifications: []
    };

    try {
      // 1. Buscar notificações pendentes (urgentes ou normais)
      const pendingNotifications = await this.notificationRepository.findPendingNotifications(
        tenantId,
        limit,
        options?.urgentOnly ? { minPriority: 8 } : undefined
      );

      const processedNotifications: any[] = [];

      for (const notification of pendingNotifications) {
        response.processed++;

        try {
          // Check if notification is expired
          if (notification.isExpired()) {
            notification.markAsExpired();
            await this.notificationRepository.update(notification, tenantId);

            response.expired++;
            response.details.push({
              id: notification.getId(),
              status: 'expired',
              reason: 'Notification expired before processing'
            });
            continue;
          }

          // Check if notification can be sent
          if (!notification.canBeSent()) {
            response.details.push({
              id: notification.getId(),
              status: 'skipped',
              reason: 'Notification not ready for sending'
            });
            continue;
          }

          // Check delivery window for non-critical notifications
          if (!this.domainService.isWithinDeliveryWindow(notification)) {
            response.details.push({
              id: notification.getId(),
              status: 'skipped',
              reason: 'Outside delivery window'
            });
            continue;
          }

          // Process the notification
          const sendResult = await this.processNotification(notification, tenantId);

          if (sendResult.success) {
            response.sent++;
            response.details.push({
              id: notification.getId(),
              status: 'sent',
              channels: sendResult.channels
            });
            processedNotifications.push({ id: notification.getId(), status: 'sent', channels: sendResult.channels, tenantId: tenantId });
          } else {
            response.failed++;
            response.details.push({
              id: notification.getId(),
              status: 'failed',
              reason: sendResult.error,
              channels: sendResult.attemptedChannels
            });
            processedNotifications.push({ id: notification.getId(), status: 'failed', error: sendResult.error, tenantId: tenantId });
          }

        } catch (error) {
          response.failed++;
          response.details.push({
            id: notification.getId(),
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown processing error'
          });
          processedNotifications.push({ id: notification.getId(), status: 'failed', error: error instanceof Error ? error.message : 'Unknown processing error', tenantId: tenantId });
        }
      }

      // Also process expired notifications cleanup
      await this.processExpiredNotifications(tenantId);

      // Process escalations
      await this.processEscalations(tenantId);

      return {
        processed: response.processed,
        sent: response.sent,
        failed: response.failed,
        expired: response.expired,
        notifications: processedNotifications
      };

    } catch (error) {
      throw new Error(`Failed to process notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processNotification(
    notification: NotificationEntity,
    tenantId: string
  ): Promise<{
    success: boolean;
    channels?: string[];
    attemptedChannels?: string[];
    error?: string;
  }> {
    try {
      const channels = notification.getChannels();
      const successfulChannels: string[] = [];
      const attemptedChannels: string[] = [];

      let hasAnySuccess = false;

      // Try to send through all channels
      for (const channel of channels) {
        attemptedChannels.push(channel);

        try {
          const channelResult = await this.deliveryService.sendNotification(
            notification,
            channel,
            tenantId
          );

          if (channelResult.success) {
            successfulChannels.push(channel);
            hasAnySuccess = true;
          }
        } catch (channelError) {
          // Log channel-specific error but continue with other channels
          console.error(`Channel ${channel} failed for notification ${notification.getId()}:`, channelError);
        }
      }

      // Update notification status based on results
      if (hasAnySuccess) {
        notification.markAsSent(new Date());
        await this.notificationRepository.update(notification, tenantId);

        return {
          success: true,
          channels: successfulChannels
        };
      } else {
        // All channels failed
        notification.markAsFailed(new Date(), 'All delivery channels failed');
        await this.notificationRepository.update(notification, tenantId);

        return {
          success: false,
          attemptedChannels,
          error: 'All delivery channels failed'
        };
      }

    } catch (error) {
      // Mark as failed and update
      notification.markAsFailed(
        new Date(),
        error instanceof Error ? error.message : 'Processing error'
      );
      await this.notificationRepository.update(notification, tenantId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing error'
      };
    }
  }

  private async processExpiredNotifications(tenantId: string): Promise<void> {
    try {
      const expiredNotifications = await this.notificationRepository
        .findExpiredNotifications(tenantId);

      for (const notification of expiredNotifications) {
        notification.markAsExpired();
        await this.notificationRepository.update(notification, tenantId);
      }
    } catch (error) {
      console.error('Failed to process expired notifications:', error);
    }
  }

  private async processEscalations(tenantId: string): Promise<void> {
    try {
      const notificationsRequiringEscalation = await this.notificationRepository
        .findNotificationsRequiringEscalation(tenantId);

      for (const notification of notificationsRequiringEscalation) {
        const escalationCheck = this.domainService.shouldEscalateNotification(notification);

        if (escalationCheck.shouldEscalate) {
          // Create escalation notification
          const escalationNotification = NotificationEntity.createSystemAlert(
            `escalation-${notification.getId()}`,
            tenantId,
            'system_notification_escalation',
            `ESCALATION: ${notification.getTitle()}`,
            `Original notification failed to deliver: ${notification.getMessage()}`,
            'critical',
            {
              originalNotificationId: notification.getId(),
              escalationReason: escalationCheck.escalationReason,
              originalType: notification.getType(),
              originalSeverity: notification.getSeverity()
            }
          );

          await this.notificationRepository.create(escalationNotification, tenantId);

          // Update original notification
          if (escalationCheck.newSeverity) {
            notification.escalateSeverity();
            await this.notificationRepository.update(notification, tenantId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to process escalations:', error);
    }
  }
}
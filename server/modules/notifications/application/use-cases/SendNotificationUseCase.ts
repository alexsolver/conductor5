// ✅ 1QA.MD COMPLIANCE: SEND NOTIFICATION USE CASE
// Application layer - Business logic for sending notifications through channels

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification, NotificationChannel } from '../../domain/entities/Notification';

export interface SendNotificationRequest {
  notificationId: string;
  tenantId: string;
  forceResend?: boolean;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  deliveryStatus?: {
    channel: string;
    status: 'sent' | 'failed';
    details?: string;
  };
}

export interface INotificationChannelService {
  sendEmail(notification: Notification, recipientEmail: string): Promise<{ success: boolean; details?: string }>;
  sendSMS(notification: Notification, recipientPhone: string): Promise<{ success: boolean; details?: string }>;
  sendInApp(notification: Notification): Promise<{ success: boolean; details?: string }>;
  sendWebhook(notification: Notification, webhookUrl: string): Promise<{ success: boolean; details?: string }>;
  sendSlack(notification: Notification, slackUserId: string): Promise<{ success: boolean; details?: string }>;
}

export class SendNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private channelService: INotificationChannelService
  ) {}

  async execute(request: SendNotificationRequest): Promise<SendNotificationResponse> {
    try {
      // Find the notification
      const notification = await this.notificationRepository.findById(
        request.notificationId,
        request.tenantId
      );

      if (!notification) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      // Check if notification can be sent
      if (!request.forceResend && !this.canSendNotification(notification)) {
        return {
          success: false,
          message: `Notification cannot be sent. Status: ${notification.status}, Retry count: ${notification.retryCount}/${notification.maxRetries}`
        };
      }

      // Send through appropriate channel
      const result = await this.sendThroughChannel(notification);

      // Update notification status based on result
      if (result.success) {
        await this.notificationRepository.update(
          notification.id,
          notification.tenantId,
          {
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date()
          }
        );
      } else {
        await this.notificationRepository.update(
          notification.id,
          notification.tenantId,
          {
            status: 'failed',
            failureReason: result.details || 'Unknown error',
            retryCount: notification.retryCount + 1,
            updatedAt: new Date()
          }
        );
      }

      return {
        success: result.success,
        message: result.success 
          ? `Notification sent successfully via ${notification.channel}`
          : `Failed to send notification via ${notification.channel}: ${result.details}`,
        deliveryStatus: {
          channel: notification.channel,
          status: result.success ? 'sent' : 'failed',
          details: result.details
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private canSendNotification(notification: Notification): boolean {
    // Check if notification is active
    if (!notification.isActive) return false;

    // Check if already sent successfully
    if (notification.status === 'sent' || notification.status === 'delivered') return false;

    // Check if cancelled or expired
    if (notification.status === 'cancelled') return false;

    // Check expiration
    if (notification.expiresAt && notification.expiresAt < new Date()) return false;

    // Check retry limits
    if (notification.status === 'failed' && notification.retryCount >= notification.maxRetries) {
      return false;
    }

    // Check if scheduled for future
    if (notification.scheduledAt && notification.scheduledAt > new Date()) return false;

    return true;
  }

  private async sendThroughChannel(notification: Notification): Promise<{ success: boolean; details?: string }> {
    try {
      switch (notification.channel) {
        case 'email':
          return await this.sendEmailNotification(notification);
        
        case 'sms':
          return await this.sendSMSNotification(notification);
        
        case 'in_app':
          return await this.channelService.sendInApp(notification);
        
        case 'webhook':
          return await this.sendWebhookNotification(notification);
        
        case 'slack':
          return await this.sendSlackNotification(notification);
        
        default:
          return {
            success: false,
            details: `Unsupported channel: ${notification.channel}`
          };
      }
    } catch (error) {
      return {
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<{ success: boolean; details?: string }> {
    // Extract email from notification data or user preferences
    const recipientEmail = notification.data?.email || notification.data?.recipientEmail;
    
    if (!recipientEmail) {
      return {
        success: false,
        details: 'No email address found for recipient'
      };
    }

    return await this.channelService.sendEmail(notification, recipientEmail);
  }

  private async sendSMSNotification(notification: Notification): Promise<{ success: boolean; details?: string }> {
    // Extract phone from notification data or user preferences
    const recipientPhone = notification.data?.phone || notification.data?.recipientPhone;
    
    if (!recipientPhone) {
      return {
        success: false,
        details: 'No phone number found for recipient'
      };
    }

    return await this.channelService.sendSMS(notification, recipientPhone);
  }

  private async sendWebhookNotification(notification: Notification): Promise<{ success: boolean; details?: string }> {
    // Extract webhook URL from notification data or user preferences
    const webhookUrl = notification.data?.webhookUrl;
    
    if (!webhookUrl) {
      return {
        success: false,
        details: 'No webhook URL found'
      };
    }

    return await this.channelService.sendWebhook(notification, webhookUrl);
  }

  private async sendSlackNotification(notification: Notification): Promise<{ success: boolean; details?: string }> {
    // Extract Slack user ID from notification data or user preferences
    const slackUserId = notification.data?.slackUserId;
    
    if (!slackUserId) {
      return {
        success: false,
        details: 'No Slack user ID found'
      };
    }

    return await this.channelService.sendSlack(notification, slackUserId);
  }
}
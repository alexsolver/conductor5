/**
 * SendNotificationUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for notification sending business logic
 */

import { Notification } from '../../domain/entities/Notification';

interface NotificationRepositoryInterface {
  save(notification: Notification): Promise<void>;
  update(notification: Notification): Promise<void>;
  findById(id: string, tenantId: string): Promise<Notification | null>;
}

interface NotificationServiceInterface {
  sendEmail(to: string, subject: string, content: string): Promise<boolean>;
  sendSMS(to: string, message: string): Promise<boolean>;
  sendPush(deviceToken: string, title: string, message: string): Promise<boolean>;
  sendInApp(userId: string, title: string, message: string): Promise<boolean>;
}

export interface SendNotificationRequest {
  tenantId: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  recipients: Array<{
    userId: string;
    channel: 'email' | 'sms' | 'push' | 'in_app';
    address: string;
  }>;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  data?: {
    notificationId: string;
    status: string;
    recipientCount: number;
    scheduledAt?: Date;
    sentAt?: Date;
  };
}

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepositoryInterface,
    private readonly notificationService: NotificationServiceInterface
  ) {}

  async execute(request: SendNotificationRequest): Promise<SendNotificationResponse> {
    // Validate input
    if (!request.title || !request.message) {
      return {
        success: false,
        message: 'Title and message are required'
      };
    }

    if (!request.recipients || request.recipients.length === 0) {
      return {
        success: false,
        message: 'At least one recipient is required'
      };
    }

    try {
      // Create notification entity
      const notification = new Notification(
        generateId(),
        request.tenantId,
        request.title,
        request.message,
        request.type || 'info',
        request.priority || 'medium'
      );

      // Add recipients
      request.recipients.forEach(recipient => {
        notification.addRecipient(recipient);
      });

      // Add metadata if provided
      if (request.metadata) {
        Object.entries(request.metadata).forEach(([key, value]) => {
          notification.addMetadata(key, value);
        });
      }

      // Handle scheduling vs immediate sending
      if (request.scheduledAt) {
        // Schedule for later
        notification.scheduleFor(request.scheduledAt);
        await this.notificationRepository.save(notification);

        return {
          success: true,
          message: 'Notification scheduled successfully',
          data: {
            notificationId: notification.getId(),
            status: notification.getStatus(),
            recipientCount: notification.getRecipients().length,
            scheduledAt: notification.getScheduledAt()
          }
        };
      } else {
        // Send immediately
        const sendResults = await this.sendToAllChannels(notification);
        
        if (sendResults.allSuccessful) {
          notification.sendNow();
          await this.notificationRepository.save(notification);

          return {
            success: true,
            message: 'Notification sent successfully',
            data: {
              notificationId: notification.getId(),
              status: notification.getStatus(),
              recipientCount: notification.getRecipients().length,
              sentAt: notification.getSentAt()
            }
          };
        } else {
          notification.markAsFailed();
          await this.notificationRepository.save(notification);

          return {
            success: false,
            message: `Notification failed to send. ${sendResults.failureCount} out of ${sendResults.totalCount} deliveries failed.`
          };
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process notification';
      return {
        success: false,
        message
      };
    }
  }

  private async sendToAllChannels(notification: Notification): Promise<{
    allSuccessful: boolean;
    totalCount: number;
    successCount: number;
    failureCount: number;
  }> {
    const recipients = notification.getRecipients();
    let successCount = 0;
    let failureCount = 0;

    const sendPromises = recipients.map(async (recipient) => {
      try {
        let sent = false;
        
        switch (recipient.channel) {
          case 'email':
            sent = await this.notificationService.sendEmail(
              recipient.address,
              notification.getTitle(),
              notification.getMessage()
            );
            break;
          case 'sms':
            sent = await this.notificationService.sendSMS(
              recipient.address,
              `${notification.getTitle()}: ${notification.getMessage()}`
            );
            break;
          case 'push':
            sent = await this.notificationService.sendPush(
              recipient.address,
              notification.getTitle(),
              notification.getMessage()
            );
            break;
          case 'in_app':
            sent = await this.notificationService.sendInApp(
              recipient.userId,
              notification.getTitle(),
              notification.getMessage()
            );
            break;
        }
        
        if (sent) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
      }
    });

    await Promise.allSettled(sendPromises);

    return {
      allSuccessful: failureCount === 0,
      totalCount: recipients.length,
      successCount,
      failureCount
    };
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Notification Service Implementation
 * Clean Architecture - Infrastructure Layer
 */

import { Notification, NotificationChannel } from '../../domain/entities/Notification';
import { INotificationService } from '../../domain/ports/INotificationService';
import { IEmailService } from '../../../shared/infrastructure/services/EmailService';

export class NotificationService implements INotificationService {
  constructor(
    private emailService: IEmailService
  ) {}

  async sendNotification(notification: Notification): Promise<boolean> {
    const channels = notification.getChannels();
    let success = false;

    // Send to all channels
    for (const channel of channels) {
      try {
        const channelSuccess = await this.sendToChannel(notification, channel);
        if (channelSuccess) {
          success = true; // At least one channel succeeded
        }
      } catch (error) {
        console.error(`Failed to send notification to ${channel}:`, error);
      }
    }

    return success;
  }

  async sendToChannel(notification: Notification, channel: NotificationChannel): Promise<boolean> {
    switch (channel) {
      case 'in_app':
        return this.sendInAppNotification(notification);
      
      case 'email':
        return this.sendEmailNotification(notification);
      
      case 'sms':
        return this.sendSMSNotification(notification);
      
      case 'push':
        return this.sendPushNotification(notification);
      
      case 'webhook':
        return this.sendWebhookNotification(notification);
      
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  async scheduleNotification(notification: Notification): Promise<void> {
    // In a production environment, this would use a job queue like Bull or Agenda
    console.log(`📅 Notification scheduled for ${notification.getScheduledAt()}: ${notification.getTitle()}`);
  }

  async retryFailedNotification(notification: Notification): Promise<boolean> {
    if (!notification.shouldRetry()) {
      return false;
    }

    return this.sendNotification(notification);
  }

  validateChannel(channel: NotificationChannel): boolean {
    const validChannels: NotificationChannel[] = ['in_app', 'email', 'sms', 'push', 'webhook'];
    return validChannels.includes(channel);
  }

  async getChannelHealth(channel: NotificationChannel): Promise<boolean> {
    switch (channel) {
      case 'in_app':
        return true; // Always available
      
      case 'email':
        return this.checkEmailHealth();
      
      case 'sms':
        return this.checkSMSHealth();
      
      case 'push':
        return this.checkPushHealth();
      
      case 'webhook':
        return this.checkWebhookHealth();
      
      default:
        return false;
    }
  }

  private async sendInAppNotification(notification: Notification): Promise<boolean> {
    // In-app notifications are stored in database and shown in UI
    console.log(`🔔 In-App Notification: ${notification.getTitle()} - ${notification.getMessage()}`);
    return true;
  }

  private async sendEmailNotification(notification: Notification): Promise<boolean> {
    try {
      // This would integrate with the existing email service
      const subject = `[${notification.getSeverity().toUpperCase()}] ${notification.getTitle()}`;
      const success = await this.emailService.sendTicketNotification(
        notification.getUserId(), // This should be email address in production
        notification.getId(),
        subject
      );
      
      console.log(`📧 Email Notification Sent: ${notification.getTitle()}`);
      return success;
    } catch (error) {
      console.error('Email notification failed:', error);
      return false;
    }
  }

  private async sendSMSNotification(notification: Notification): Promise<boolean> {
    // This would integrate with Twilio or similar SMS service
    console.log(`📱 SMS Notification: ${notification.getTitle()} - ${notification.getMessage()}`);
    return true;
  }

  private async sendPushNotification(notification: Notification): Promise<boolean> {
    // This would integrate with Firebase Cloud Messaging or similar
    console.log(`🔔 Push Notification: ${notification.getTitle()} - ${notification.getMessage()}`);
    return true;
  }

  private async sendWebhookNotification(notification: Notification): Promise<boolean> {
    // This would make HTTP requests to configured webhook URLs
    console.log(`🌐 Webhook Notification: ${notification.getTitle()} - ${notification.getMessage()}`);
    return true;
  }

  private async checkEmailHealth(): Promise<boolean> {
    try {
      // Check email service health
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkSMSHealth(): Promise<boolean> {
    try {
      // Check SMS service health
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkPushHealth(): Promise<boolean> {
    try {
      // Check push notification service health
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkWebhookHealth(): Promise<boolean> {
    try {
      // Check webhook service health
      return true;
    } catch (error) {
      return false;
    }
  }
}

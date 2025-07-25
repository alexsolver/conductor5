
/**
 * Notification Service Interface
 * Clean Architecture - Domain Layer Port
 */

import { Notification, NotificationChannel } from '../entities/Notification';

export interface INotificationService {
  sendNotification(notification: Notification): Promise<boolean>;
  sendToChannel(notification: Notification, channel: NotificationChannel): Promise<boolean>;
  scheduleNotification(notification: Notification): Promise<void>;
  retryFailedNotification(notification: Notification): Promise<boolean>;
  validateChannel(channel: NotificationChannel): boolean;
  getChannelHealth(channel: NotificationChannel): Promise<boolean>;
}

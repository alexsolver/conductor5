// INFRASTRUCTURE SERVICE INTERFACE - Clean Architecture
// Infrastructure layer - Notification delivery contract

import { NotificationEntity } from '../../domain/entities/Notification';
import { NotificationChannelType } from '@shared/schema-notifications';

export interface DeliveryResult {
  success: boolean;
  channel: NotificationChannelType;
  deliveryId?: string;
  timestamp: Date;
  error?: string;
  retryable?: boolean;
}

export interface INotificationDeliveryService {
  sendNotification(
    notification: NotificationEntity,
    channel: NotificationChannelType,
    tenantId: string
  ): Promise<DeliveryResult>;

  validateChannelHealth(
    channel: NotificationChannelType,
    tenantId: string
  ): Promise<boolean>;

  getChannelCapabilities(
    channel: NotificationChannelType
  ): {
    supportsRichContent: boolean;
    maxContentLength: number;
    supportsBatch: boolean;
    averageDeliveryTime: number;
  };
}
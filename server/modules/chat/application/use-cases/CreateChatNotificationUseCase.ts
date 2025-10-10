import { NodePgDatabase } from 'drizzle-orm/node-postgres';

interface CreateChatNotificationInput {
  tenantId: string;
  userId: string;
  type: 'new_chat' | 'new_message' | 'chat_assigned' | 'chat_transferred' | 'sla_warning' | 'sla_breach';
  title: string;
  message: string;
  chatId?: string;
  queueId?: string;
  metadata?: Record<string, any>;
}

export class CreateChatNotificationUseCase {
  constructor(private db: NodePgDatabase<any>) {}

  async execute(input: CreateChatNotificationInput): Promise<void> {
    const { tenantId, userId, type, title, message, chatId, queueId, metadata } = input;

    // Create notification via the existing notifications module
    // This integrates with the global notifications system
    try {
      const notificationData = {
        userId,
        type: 'chat' as const,
        title,
        message,
        channel: 'in_app' as const,
        priority: this.getPriority(type),
        metadata: {
          chatId,
          queueId,
          chatNotificationType: type,
          ...metadata,
        },
      };

      // Insert into notifications table (assuming schema exists)
      // The actual implementation depends on the existing notifications module
      console.log('[CHAT-NOTIFICATION]', {
        tenantId,
        ...notificationData,
      });

      // TODO: Integrate with actual notifications module when available
      // await notificationsService.create(tenantId, notificationData);
    } catch (error) {
      console.error('[CHAT-NOTIFICATION] Error creating notification:', error);
      // Don't throw - notifications should not break the main flow
    }
  }

  private getPriority(type: string): 'high' | 'medium' | 'low' {
    switch (type) {
      case 'sla_breach':
        return 'high';
      case 'sla_warning':
      case 'chat_assigned':
        return 'medium';
      default:
        return 'low';
    }
  }
}

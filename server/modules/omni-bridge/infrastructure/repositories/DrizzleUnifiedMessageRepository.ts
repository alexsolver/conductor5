
/**
 * Drizzle UnifiedMessage Repository
 * Clean Architecture - Infrastructure Layer
 */
import { IUnifiedMessageRepository, MessageSearchOptions, MessageFilters } from '../../domain/repositories/IUnifiedMessageRepository';
import { UnifiedMessage } from '../../domain/entities/UnifiedMessage';

export class DrizzleUnifiedMessageRepository implements IUnifiedMessageRepository {
  async findAll(tenantId: string, options?: MessageSearchOptions): Promise<UnifiedMessage[]> {
    try {
      const { storage } = await import('../../../../storage-simple');
      
      // Get email messages from inbox
      const emailMessages = await storage.getEmailInboxMessages(tenantId, {
        limit: options?.limit || 50,
        offset: options?.offset || 0
      });
      
      return emailMessages.map(msg => new UnifiedMessage(
        msg.id,
        msg.tenantId,
        'imap-email', // channel ID
        'email', // channel type
        msg.messageId,
        msg.threadId,
        msg.fromEmail,
        msg.fromName,
        msg.toEmail,
        msg.subject,
        msg.bodyText || msg.bodyHtml || '',
        msg.bodyHtml,
        msg.priority as any || 'medium',
        msg.isRead ? 'read' : 'unread',
        msg.hasAttachments || false,
        msg.attachmentCount || 0,
        msg.attachmentDetails || [],
        msg.emailHeaders || {},
        msg.isProcessed || false,
        msg.ticketCreated,
        msg.ruleMatched,
        new Date(msg.emailDate || msg.receivedAt),
        msg.processedAt ? new Date(msg.processedAt) : null,
        new Date(msg.receivedAt)
      ));
    } catch (error) {
      console.error('Error finding unified messages:', error);
      return [];
    }
  }

  async findById(tenantId: string, id: string): Promise<UnifiedMessage | null> {
    try {
      const messages = await this.findAll(tenantId);
      return messages.find(m => m.id === id) || null;
    } catch (error) {
      console.error('Error finding message by ID:', error);
      return null;
    }
  }

  async findByChannel(tenantId: string, channelId: string, limit?: number): Promise<UnifiedMessage[]> {
    try {
      const messages = await this.findAll(tenantId, { limit });
      return messages.filter(m => m.channelId === channelId);
    } catch (error) {
      console.error('Error finding messages by channel:', error);
      return [];
    }
  }

  async findUnread(tenantId: string): Promise<UnifiedMessage[]> {
    try {
      const messages = await this.findAll(tenantId);
      return messages.filter(m => m.status === 'unread');
    } catch (error) {
      console.error('Error finding unread messages:', error);
      return [];
    }
  }

  async findByThread(tenantId: string, threadId: string): Promise<UnifiedMessage[]> {
    try {
      const messages = await this.findAll(tenantId);
      return messages.filter(m => m.threadId === threadId);
    } catch (error) {
      console.error('Error finding messages by thread:', error);
      return [];
    }
  }

  async search(tenantId: string, query: string, filters?: MessageFilters): Promise<UnifiedMessage[]> {
    try {
      const messages = await this.findAll(tenantId);
      return messages.filter(m => 
        m.content.toLowerCase().includes(query.toLowerCase()) ||
        (m.subject && m.subject.toLowerCase().includes(query.toLowerCase())) ||
        m.fromAddress.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  async save(message: UnifiedMessage): Promise<UnifiedMessage> {
    // Save unified message
    return message;
  }

  async markAsRead(tenantId: string, id: string): Promise<void> {
    try {
      const { storage } = await import('../../../../storage-simple');
      await storage.markEmailAsRead(tenantId, id);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async markAsProcessed(tenantId: string, id: string, ticketId?: string): Promise<void> {
    try {
      const { storage } = await import('../../../../storage-simple');
      await storage.markEmailAsProcessed(tenantId, id, ticketId);
    } catch (error) {
      console.error('Error marking message as processed:', error);
    }
  }

  async archive(tenantId: string, id: string): Promise<void> {
    // Archive message
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    return false;
  }

  async getCountByChannel(tenantId: string): Promise<Record<string, number>> {
    try {
      const messages = await this.findAll(tenantId);
      const counts: Record<string, number> = {};
      
      for (const message of messages) {
        counts[message.channelId] = (counts[message.channelId] || 0) + 1;
      }
      
      return counts;
    } catch (error) {
      console.error('Error getting count by channel:', error);
      return {};
    }
  }

  async getUnreadCount(tenantId: string): Promise<number> {
    try {
      const unreadMessages = await this.findUnread(tenantId);
      return unreadMessages.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

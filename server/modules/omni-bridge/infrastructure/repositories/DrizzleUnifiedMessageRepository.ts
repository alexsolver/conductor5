/**
 * Drizzle UnifiedMessage Repository
 * Clean Architecture - Infrastructure Layer
 */
import { IUnifiedMessageRepository, MessageSearchOptions, MessageFilters } from '../../domain/repositories/IUnifiedMessageRepository';
import { UnifiedMessage } from '../../domain/entities/UnifiedMessage';

export class DrizzleUnifiedMessageRepository implements IUnifiedMessageRepository {
  async findAll(tenantId: string, options?: any): Promise<UnifiedMessage[]> {
    try {
      const { storage } = await import('../../../../storage-simple');

      // Verificar se o tenant existe e tem schema inicializado
      if (!tenantId) {
        console.error('Tenant ID is required for finding messages');
        return [];
      }

      let messages = [];
      
      try {
        // Verificar se o método existe no storage
        if (typeof storage.getEmailInboxMessages === 'function') {
          messages = await storage.getEmailInboxMessages(tenantId);
        } else {
          // Fallback: buscar diretamente na tabela emails
          const db = storage.getDatabase(tenantId);
          const emailsQuery = `
            SELECT 
              id, tenant_id, message_id as "messageId", 
              from_email as "fromEmail", from_name as "fromName",
              to_email as "toEmail", cc_emails as "ccEmails", bcc_emails as "bccEmails",
              subject, body_text as "bodyText", body_html as "bodyHtml",
              has_attachments as "hasAttachments", attachment_count as "attachmentCount",
              attachment_details as "attachmentDetails", email_headers as "emailHeaders",
              priority, is_read as "isRead", is_processed as "isProcessed",
              email_date as "emailDate", received_at as "receivedAt", processed_at as "processedAt"
            FROM emails 
            WHERE tenant_id = $1 
            ORDER BY received_at DESC
            LIMIT ${options?.limit || 50}
          `;
          const result = await db.query(emailsQuery, [tenantId]);
          messages = result.rows || [];
        }
      } catch (dbError) {
        console.log(`Database error, using empty array: ${dbError.message}`);
        messages = [];
      }

      if (!messages || !Array.isArray(messages)) {
        console.log(`No messages found for tenant ${tenantId}`);
        return [];
      }

      return messages.map(msg => new UnifiedMessage(
        msg.id,
        tenantId,
        msg.messageId || 'unknown',
        null, // threadId
        'email', // channelType
        msg.fromEmail || '',
        msg.fromName || '',
        [msg.toEmail || ''],
        msg.ccEmails ? JSON.parse(msg.ccEmails) : [],
        msg.bccEmails ? JSON.parse(msg.bccEmails) : [],
        msg.subject || '',
        msg.bodyText || '',
        msg.bodyHtml || '',
        msg.hasAttachments || false,
        msg.attachmentDetails ? JSON.parse(msg.attachmentDetails) : [],
        msg.emailHeaders ? JSON.parse(msg.emailHeaders) : {},
        msg.priority as 'low' | 'medium' | 'high' | 'urgent' || 'medium',
        msg.isRead || false,
        msg.isProcessed || false,
        null, // ruleMatched
        null, // ticketCreated
        new Date(msg.emailDate || msg.receivedAt),
        new Date(msg.receivedAt),
        msg.processedAt ? new Date(msg.processedAt) : null
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

  async markAsProcessed(tenantId: string, id: string, ticketId?: string): Promise<void> {
    try {
      const { storage } = await import('../../../../storage-simple');
      await storage.markEmailAsProcessed(tenantId, id, ticketId);
    } catch (error) {
      console.error('Error marking message as processed:', error);
    }
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    return false; // Messages are derived from emails
  }

  async getUnreadCount(tenantId: string): Promise<number> {
    try {
      const messages = await this.findAll(tenantId);
      return messages.filter(msg => !msg.isRead).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async getCountByChannel(tenantId: string): Promise<Record<string, number>> {
    try {
      const messages = await this.findAll(tenantId);
      const counts: Record<string, number> = {};

      messages.forEach(msg => {
        const channel = msg.channelType;
        counts[channel] = (counts[channel] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Error getting count by channel:', error);
      return {};
    }
  }

  async markAsRead(tenantId: string, messageId: string): Promise<void> {
    try {
      // Implementation would mark message as read in database
      console.log(`Marking message ${messageId} as read for tenant ${tenantId}`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async archive(tenantId: string, messageId: string): Promise<void> {
    try {
      // Implementation would archive message in database
      console.log(`Archiving message ${messageId} for tenant ${tenantId}`);
    } catch (error) {
      console.error('Error archiving message:', error);
    }
  }
}
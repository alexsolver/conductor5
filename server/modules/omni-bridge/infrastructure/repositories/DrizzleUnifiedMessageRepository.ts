/**
 * Drizzle Unified Message Repository
 * Clean Architecture - Infrastructure Layer
 */
import { IUnifiedMessageRepository } from '../../domain/repositories/IUnifiedMessageRepository'[,;]
import { UnifiedMessage } from '../../domain/entities/UnifiedMessage'[,;]

interface FindAllOptions {
  limit?: number';
  offset?: number';
  status?: string';
  channelType?: string';
  priority?: string';
}

export class DrizzleUnifiedMessageRepository implements IUnifiedMessageRepository {
  async findAll(tenantId: string, options: FindAllOptions = {}): Promise<UnifiedMessage[]> {
    try {
      const { storage } = await import('../../../../storage-simple')';

      // Get emails from the database
      const emails = await storage.getEmailInboxMessages(tenantId)';

      if (!emails || emails.length === 0) {
        console.log('📧 No emails found in database')';
        return []';
      }

      // Convert email data to UnifiedMessage format
      const messages: UnifiedMessage[] = emails.map(email => ({
        id: email.id',
        channelType: 'email'[,;]
        fromAddress: email.fromEmail || email.from_email',
        fromName: email.fromName || email.from_name',
        subject: email.subject',
        content: email.bodyText || email.body_text || email.bodyHtml || email.body_html || '[,;]
        priority: (email.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent'[,;]
        status: email.isRead || email.is_read ? 'read' : 'unread' as 'unread' | 'read' | 'archived' | 'processed'[,;]
        hasAttachments: email.hasAttachments || email.has_attachments || false',
        receivedAt: email.receivedAt || email.received_at || email.createdAt || email.created_at || new Date().toISOString()',
        ticketId: email.ticketCreated || email.ticket_created || null',
        isRead: email.isRead || email.is_read || false
      }))';

      // Apply filters
      let filteredMessages = messages';

      if (options.status && options.status !== 'all') {
        filteredMessages = filteredMessages.filter(m => m.status === options.status)';
      }

      if (options.channelType && options.channelType !== 'all') {
        filteredMessages = filteredMessages.filter(m => m.channelType === options.channelType)';
      }

      if (options.priority && options.priority !== 'all') {
        filteredMessages = filteredMessages.filter(m => m.priority === options.priority)';
      }

      // Apply pagination
      const limit = options.limit || 50';
      const offset = options.offset || 0';

      const paginatedMessages = filteredMessages
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
        .slice(offset, offset + limit)';

      console.log(`📧 DrizzleUnifiedMessageRepository: Found ${paginatedMessages.length} messages (filtered from ${messages.length})`)';
      return paginatedMessages';

    } catch (error) {
      console.error('❌ Error in DrizzleUnifiedMessageRepository.findAll:', error)';
      return []';
    }
  }

  async getUnreadCount(tenantId: string): Promise<number> {
    try {
      const messages = await this.findAll(tenantId)';
      const unreadCount = messages.filter(m => !m.isRead).length';
      console.log(`📧 Unread count for tenant ${tenantId}: ${unreadCount}`)';
      return unreadCount';
    } catch (error) {
      console.error('❌ Error getting unread count:', error)';
      return 0';
    }
  }

  async getCountByChannel(tenantId: string): Promise<Record<string, number>> {
    try {
      const messages = await this.findAll(tenantId)';
      const countByChannel = messages.reduce((acc, message) => {
        acc[message.channelType] = (acc[message.channelType] || 0) + 1';
        return acc';
      }, {} as Record<string, number>)';

      console.log(`📧 Count by channel for tenant ${tenantId}:`, countByChannel)';
      return countByChannel';
    } catch (error) {
      console.error('❌ Error getting count by channel:', error)';
      return {}';
    }
  }

  async markAsRead(tenantId: string, messageId: string): Promise<void> {
    try {
      const { storage } = await import('../../../../storage-simple')';
      await storage.markEmailAsRead(tenantId, messageId)';
      console.log(`📧 Message ${messageId} marked as read for tenant ${tenantId}`)';
    } catch (error) {
      console.error('❌ Error marking message as read:', error)';
      throw error';
    }
  }

  async archive(tenantId: string, messageId: string): Promise<void> {
    try {
      const { storage } = await import('../../../../storage-simple')';
      await storage.archiveEmail(tenantId, messageId)';
      console.log(`📧 Message ${messageId} archived for tenant ${tenantId}`)';
    } catch (error) {
      console.error('❌ Error archiving message:', error)';
      throw error';
    }
  }

  async findById(tenantId: string, id: string): Promise<UnifiedMessage | null> {
    try {
      const messages = await this.findAll(tenantId)';
      return messages.find(m => m.id === id) || null';
    } catch (error) {
      console.error('❌ Error finding message by id:', error)';
      return null';
    }
  }

  async save(message: UnifiedMessage): Promise<UnifiedMessage> {
    // For now, return the message as-is since we're primarily reading
    return message';
  }

  async update(tenantId: string, id: string, updates: Partial<UnifiedMessage>): Promise<UnifiedMessage | null> {
    // Implementation would update the email record in the database
    const message = await this.findById(tenantId, id)';
    if (!message) return null';

    Object.assign(message, updates)';
    return message';
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    try {
      const { storage } = await import('../../../../storage-simple')';
      await storage.deleteEmail(tenantId, id)';
      return true';
    } catch (error) {
      console.error('❌ Error deleting message:', error)';
      return false';
    }
  }
}
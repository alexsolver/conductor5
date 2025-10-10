import { eq, and, gte, lte, ilike, or, sql, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { chatMessages, chats } from '@shared/schema-chat';

interface SearchMessagesInput {
  tenantId: string;
  query?: string;
  chatId?: string;
  senderId?: string;
  senderName?: string;
  queueId?: string;
  startDate?: Date;
  endDate?: Date;
  messageType?: 'text' | 'file' | 'image' | 'system';
  limit?: number;
  offset?: number;
}

interface SearchMessagesOutput {
  messages: any[];
  total: number;
  hasMore: boolean;
}

export class SearchMessagesUseCase {
  constructor(private db: NodePgDatabase<any>) {}

  async execute(input: SearchMessagesInput): Promise<SearchMessagesOutput> {
    const {
      query,
      chatId,
      senderId,
      senderName,
      queueId,
      startDate,
      endDate,
      messageType,
      limit = 50,
      offset = 0,
    } = input;

    const conditions = [];

    // Full-text search on message content
    if (query) {
      conditions.push(
        or(
          ilike(chatMessages.content, `%${query}%`),
          ilike(chatMessages.senderName, `%${query}%`),
          ilike(chatMessages.attachmentName, `%${query}%`)
        )
      );
    }

    // Filter by chat
    if (chatId) {
      conditions.push(eq(chatMessages.chatId, chatId));
    }

    // Filter by sender
    if (senderId) {
      conditions.push(eq(chatMessages.senderId, senderId));
    }

    // Filter by sender name
    if (senderName) {
      conditions.push(ilike(chatMessages.senderName, `%${senderName}%`));
    }

    // Filter by message type
    if (messageType) {
      conditions.push(eq(chatMessages.type, messageType));
    }

    // Filter by date range
    if (startDate) {
      conditions.push(gte(chatMessages.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(chatMessages.createdAt, endDate));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute search with pagination
    const messages = await this.db
      .select({
        id: chatMessages.id,
        chatId: chatMessages.chatId,
        senderId: chatMessages.senderId,
        senderName: chatMessages.senderName,
        type: chatMessages.type,
        content: chatMessages.content,
        attachmentUrl: chatMessages.attachmentUrl,
        attachmentType: chatMessages.attachmentType,
        attachmentName: chatMessages.attachmentName,
        isRead: chatMessages.isRead,
        readAt: chatMessages.readAt,
        createdAt: chatMessages.createdAt,
        isEdited: chatMessages.isEdited,
        channel: sql<string>`${chats}.channel`.as('channel'),
        queueId: sql<string>`${chats}.queue_id`.as('queueId'),
      })
      .from(chatMessages)
      .leftJoin(chats, eq(chatMessages.chatId, chats.id))
      .where(whereClause)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit + 1) // Fetch one extra to check if there are more
      .offset(offset);

    // Filter by queue if specified (done after join)
    let filteredMessages = messages;
    if (queueId) {
      filteredMessages = messages.filter((m) => m.queueId === queueId);
    }

    // Check if there are more results
    const hasMore = filteredMessages.length > limit;
    const resultMessages = hasMore ? filteredMessages.slice(0, limit) : filteredMessages;

    // Get total count (for pagination info)
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .leftJoin(chats, eq(chatMessages.chatId, chats.id))
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return {
      messages: resultMessages,
      total,
      hasMore,
    };
  }
}

/**
 * DOMAIN LAYER - MESSAGE ENTITY
 * Seguindo Clean Architecture - Chat Messages
 */

export type MessageType = "text" | "file" | "image" | "system";

export interface Message {
  id: string;
  tenantId: string;
  chatId: string;
  senderId?: string;
  senderName?: string;
  type: MessageType;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  readBy?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isEdited: boolean;
}

export interface MessageReaction {
  id: string;
  tenantId: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export class MessageDomainService {
  /**
   * Validates message business rules
   */
  validate(message: Partial<Message>): boolean {
    if (!message.type) {
      throw new Error('Message type is required');
    }

    const validTypes: MessageType[] = ["text", "file", "image", "system"];
    if (!validTypes.includes(message.type)) {
      throw new Error('Invalid message type');
    }

    if (message.type === 'text' && (!message.content || message.content.trim().length === 0)) {
      throw new Error('Text message requires content');
    }

    if ((message.type === 'file' || message.type === 'image') && !message.attachmentUrl) {
      throw new Error('File/Image message requires attachment URL');
    }

    return true;
  }

  /**
   * Mark message as read by user
   */
  markAsRead(message: Message, userId: string): Message {
    const readBy = message.readBy || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    return {
      ...message,
      isRead: true,
      readAt: new Date(),
      readBy
    };
  }

  /**
   * Check if message is editable
   */
  isEditable(message: Message): boolean {
    if (message.deletedAt) {
      return false;
    }

    if (message.type !== 'text') {
      return false;
    }

    // Can only edit within 15 minutes
    const minutesOld = (Date.now() - message.createdAt.getTime()) / (1000 * 60);
    return minutesOld <= 15;
  }

  /**
   * Edit message content
   */
  edit(message: Message, newContent: string): Message {
    if (!this.isEditable(message)) {
      throw new Error('Message cannot be edited');
    }

    return {
      ...message,
      content: newContent,
      isEdited: true,
      updatedAt: new Date()
    };
  }
}

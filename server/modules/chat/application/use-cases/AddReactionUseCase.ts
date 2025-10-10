/**
 * ADD REACTION USE CASE
 * Application Layer - Add emoji reaction to message
 */

import { v4 as uuidv4 } from 'uuid';
import { MessageReaction } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';

export interface AddReactionRequest {
  tenantId: string;
  messageId: string;
  userId: string;
  emoji: string;
}

export class AddReactionUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(request: AddReactionRequest): Promise<MessageReaction> {
    // 1. Validate message exists
    const message = await this.messageRepository.findMessageById(
      request.messageId,
      request.tenantId
    );

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.deletedAt) {
      throw new Error('Cannot react to deleted message');
    }

    // 2. Check if user already reacted with this emoji
    const existingReactions = await this.messageRepository.findReactions(
      request.messageId,
      request.tenantId
    );

    const duplicateReaction = existingReactions.find(
      r => r.userId === request.userId && r.emoji === request.emoji
    );

    if (duplicateReaction) {
      throw new Error('User already reacted with this emoji');
    }

    // 3. Create reaction
    const reaction: MessageReaction = {
      id: uuidv4(),
      tenantId: request.tenantId,
      messageId: request.messageId,
      userId: request.userId,
      emoji: request.emoji,
      createdAt: new Date(),
    };

    // 4. Save reaction
    return await this.messageRepository.addReaction(reaction);
  }
}

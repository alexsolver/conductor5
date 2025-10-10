/**
 * ADD PARTICIPANT USE CASE
 * Application Layer - Add participant to chat
 */

import { v4 as uuidv4 } from 'uuid';
import { ChatParticipant } from '../../domain/entities/Chat';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

export interface AddParticipantRequest {
  tenantId: string;
  chatId: string;
  userId: string;
  role?: string;
}

export class AddParticipantUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(request: AddParticipantRequest): Promise<ChatParticipant> {
    // 1. Validate chat exists and is active
    const chat = await this.chatRepository.findChatById(request.chatId, request.tenantId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.status !== 'active') {
      throw new Error('Cannot add participant to inactive chat');
    }

    // 2. Check if user is already a participant
    const existingParticipants = await this.chatRepository.findParticipants(
      request.chatId,
      request.tenantId
    );

    const alreadyParticipant = existingParticipants.find(
      p => p.userId === request.userId && p.isActive
    );

    if (alreadyParticipant) {
      throw new Error('User is already a participant');
    }

    // 3. Create participant
    const participant: ChatParticipant = {
      id: uuidv4(),
      tenantId: request.tenantId,
      chatId: request.chatId,
      userId: request.userId,
      role: request.role || 'participant',
      joinedAt: new Date(),
      isActive: true,
    };

    // 4. Save participant
    const createdParticipant = await this.chatRepository.addParticipant(participant);

    // 5. Update chat's updatedAt
    await this.chatRepository.updateChat(chat.id, {
      updatedAt: new Date(),
    });

    return createdParticipant;
  }
}

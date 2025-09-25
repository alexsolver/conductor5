import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { ConversationalAgentEngine, MessageContext, ConversationResponse } from '../../infrastructure/services/ConversationalAgentEngine';

export interface ProcessConversationRequest {
  tenantId: string;
  userId: string;
  channelId: string;
  channelType: string;
  content: string;
  metadata?: any;
}

export interface ProcessConversationResponse {
  success: boolean;
  response?: ConversationResponse;
  error?: string;
}

export class ProcessConversationUseCase {
  constructor(
    private agentRepository: IAiAgentRepository,
    private conversationEngine: ConversationalAgentEngine
  ) {}

  async execute(request: ProcessConversationRequest): Promise<ProcessConversationResponse> {
    try {
      console.log(`🤖 [ProcessConversation] Processing message from ${request.userId} on ${request.channelType}`);

      // Preparar contexto da mensagem
      const messageContext: MessageContext = {
        tenantId: request.tenantId,
        userId: request.userId,
        channelId: request.channelId,
        channelType: request.channelType,
        content: request.content,
        metadata: request.metadata
      };

      // Processar através do motor conversacional
      const response = await this.conversationEngine.processMessage(messageContext);

      console.log(`✅ [ProcessConversation] Response generated: ${response.message.substring(0, 100)}...`);

      return {
        success: true,
        response
      };

    } catch (error) {
      console.error('❌ [ProcessConversation] Error processing conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
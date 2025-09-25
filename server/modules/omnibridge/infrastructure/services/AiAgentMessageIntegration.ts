import { ConversationalAgentEngine, MessageContext } from './ConversationalAgentEngine';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { MessageEntity } from '../../domain/entities/Message';

/**
 * Serviço de integração entre mensagens do OmniBridge e agentes IA conversacionais
 */
export class AiAgentMessageIntegration {
  constructor(
    private agentRepository: IAiAgentRepository,
    private conversationEngine: ConversationalAgentEngine
  ) {}

  /**
   * Processa mensagem através dos agentes IA disponíveis
   */
  async processMessageWithAgents(message: MessageEntity): Promise<void> {
    console.log(`🤖 [AiAgentIntegration] Processing message ${message.id} with AI agents`);

    try {
      // Verificar se existem agentes disponíveis para o canal
      const availableAgents = await this.agentRepository.findByChannel(
        message.channelType, 
        message.tenantId
      );

      if (availableAgents.length === 0) {
        console.log(`🤖 [AiAgentIntegration] No AI agents available for channel: ${message.channelType}`);
        return;
      }

      console.log(`🤖 [AiAgentIntegration] Found ${availableAgents.length} available agents for ${message.channelType}`);

      // Preparar contexto da mensagem
      const messageContext: MessageContext = {
        tenantId: message.tenantId,
        userId: message.fromAddress, // Email ou identificador do remetente
        channelId: message.channelId,
        channelType: message.channelType,
        content: message.content,
        metadata: {
          subject: message.subject,
          originalMessageId: message.id,
          priority: message.priority,
          receivedAt: message.receivedAt,
          ...message.metadata
        }
      };

      // Processar através do motor conversacional
      const response = await this.conversationEngine.processMessage(messageContext);

      console.log(`✅ [AiAgentIntegration] Agent processed message ${message.id}:`);
      console.log(`   - Response: ${response.message.substring(0, 100)}...`);
      console.log(`   - Action executed: ${response.actionExecuted || false}`);
      console.log(`   - Conversation complete: ${response.conversationComplete || false}`);
      console.log(`   - Escalated: ${response.escalated || false}`);

      // Se a conversa foi escalada ou completou, marcar mensagem como processada
      if (response.conversationComplete || response.escalated) {
        await this.markMessageAsProcessed(message);
      }

    } catch (error) {
      console.error(`❌ [AiAgentIntegration] Error processing message ${message.id} with AI agents:`, error);
      // Não propagar erro para não interromper fluxo principal de mensagens
    }
  }

  /**
   * Verifica se uma mensagem deve ser processada por agentes IA
   */
  shouldProcessWithAi(message: MessageEntity): boolean {
    // Processar apenas mensagens não lidas e de canais suportados
    const supportedChannels = ['email', 'whatsapp', 'telegram', 'slack', 'sms'];
    
    return message.status === 'unread' && 
           supportedChannels.includes(message.channelType) &&
           !message.processedAt; // Não foi processada ainda
  }

  /**
   * Marca mensagem como processada por IA
   */
  private async markMessageAsProcessed(message: MessageEntity): Promise<void> {
    try {
      message.status = 'processed';
      message.processedAt = new Date();
      
      // Adicionar tag indicando processamento por IA
      if (!message.tags.includes('ai-processed')) {
        message.tags = [...message.tags, 'ai-processed'];
      }

      console.log(`🏷️ [AiAgentIntegration] Message ${message.id} marked as AI processed`);
      
    } catch (error) {
      console.error(`❌ [AiAgentIntegration] Error marking message as processed:`, error);
    }
  }

  /**
   * Envia resposta do agente através do canal apropriado
   */
  async sendAgentResponse(
    messageContext: MessageContext, 
    response: string, 
    menuOptions?: any[]
  ): Promise<void> {
    console.log(`📤 [AiAgentIntegration] Sending agent response via ${messageContext.channelType}`);

    try {
      // TODO: Implementar envio de resposta baseado no tipo de canal
      switch (messageContext.channelType) {
        case 'email':
          await this.sendEmailResponse(messageContext, response);
          break;
        case 'whatsapp':
          await this.sendWhatsAppResponse(messageContext, response, menuOptions);
          break;
        case 'telegram':
          await this.sendTelegramResponse(messageContext, response, menuOptions);
          break;
        default:
          console.log(`⚠️ [AiAgentIntegration] Response sending not implemented for ${messageContext.channelType}`);
      }

    } catch (error) {
      console.error(`❌ [AiAgentIntegration] Error sending agent response:`, error);
    }
  }

  private async sendEmailResponse(context: MessageContext, response: string): Promise<void> {
    // TODO: Integrar com serviço de email para enviar resposta automática
    console.log(`📧 [AiAgentIntegration] Would send email response to ${context.userId}: ${response.substring(0, 50)}...`);
  }

  private async sendWhatsAppResponse(
    context: MessageContext, 
    response: string, 
    menuOptions?: any[]
  ): Promise<void> {
    // TODO: Integrar com WhatsApp Business API
    console.log(`📱 [AiAgentIntegration] Would send WhatsApp response to ${context.userId}: ${response.substring(0, 50)}...`);
    if (menuOptions && menuOptions.length > 0) {
      console.log(`📱 [AiAgentIntegration] With menu options: ${menuOptions.map(o => o.text).join(', ')}`);
    }
  }

  private async sendTelegramResponse(
    context: MessageContext, 
    response: string, 
    menuOptions?: any[]
  ): Promise<void> {
    // TODO: Integrar com Telegram Bot API
    console.log(`📨 [AiAgentIntegration] Would send Telegram response to ${context.userId}: ${response.substring(0, 50)}...`);
    if (menuOptions && menuOptions.length > 0) {
      console.log(`📨 [AiAgentIntegration] With menu options: ${menuOptions.map(o => o.text).join(', ')}`);
    }
  }
}
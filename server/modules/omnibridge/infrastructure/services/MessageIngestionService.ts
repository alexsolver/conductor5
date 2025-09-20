import { MessageEntity } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import crypto from 'crypto';

export interface IncomingMessage {
  channelId: string;
  channelType: 'telegram' | 'email' | 'whatsapp' | 'sms';
  from: string;
  to?: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tenantId: string;
}

/**
 * Service responsável por capturar mensagens dos canais ativos e salvá-las no inbox do OmniBridge
 * Seguindo Clean Architecture - Infrastructure Layer
 */
export class MessageIngestionService {
  constructor(private messageRepository: IMessageRepository) {}

  /**
   * Processa mensagem recebida de qualquer canal e salva no inbox
   */
  async ingestMessage(incomingMessage: IncomingMessage): Promise<MessageEntity> {
    console.log(`📨 [MESSAGE-INGESTION] Processing ${incomingMessage.channelType} message from ${incomingMessage.from}`);

    try {
      // Criar entidade de mensagem
      const messageEntity = new MessageEntity(
        this.generateMessageId(incomingMessage),
        incomingMessage.channelId,
        incomingMessage.channelType,
        incomingMessage.from,
        incomingMessage.content,
        incomingMessage.tenantId,
        incomingMessage.to,
        incomingMessage.subject,
        incomingMessage.metadata || {},
        'unread',
        incomingMessage.priority || 'medium',
        undefined, // category
        [], // tags
        new Date(), // receivedAt
        undefined, // processedAt
        new Date(), // createdAt
        new Date()  // updatedAt
      );

      // Salvar no repositório
      const savedMessage = await this.messageRepository.create(messageEntity);
      
      console.log(`✅ [MESSAGE-INGESTION] Message saved to inbox: ${savedMessage.id}`);
      return savedMessage;
    } catch (error) {
      console.error(`❌ [MESSAGE-INGESTION] Failed to ingest message:`, error);
      throw error;
    }
  }

  /**
   * Processa webhook do Telegram
   */
  async processTelegramWebhook(webhookData: any, tenantId: string): Promise<{ success: boolean; processed: number }> {
    let processedCount = 0;

    try {
      console.log(`📨 [TELEGRAM-INGESTION] Processing webhook for tenant: ${tenantId}`);

      const message = webhookData.message;
      if (!message) return { success: false, processed: 0 };

      // Extrair dados da mensagem do Telegram
      const incomingMessage: IncomingMessage = {
        channelId: 'telegram',
        channelType: 'telegram',
        from: `telegram:${message.from.id}`,
        to: `bot:${webhookData.bot?.id || 'unknown'}`,
        subject: `Telegram - ${message.from.first_name || message.from.username || 'Unknown'}`,
        content: message.text || message.caption || '[Mensagem não textual]',
        metadata: {
          telegramMessageId: message.message_id,
          chatId: message.chat.id,
          fromUser: message.from,
          chatType: message.chat.type,
          timestamp: message.date
        },
        priority: 'medium',
        tenantId
      };

      const savedMessage = await this.ingestMessage(incomingMessage);
      processedCount++;

      console.log(`✅ [TELEGRAM-INGESTION] Message saved with ID: ${savedMessage.id}`);
      console.log(`✅ [TELEGRAM-INGESTION] Message content: ${incomingMessage.content}`);
      console.log(`✅ [TELEGRAM-INGESTION] From: ${incomingMessage.from}`);
      console.log(`✅ [TELEGRAM-INGESTION] Webhook processed: ${processedCount} messages`);
      
      return { success: true, processed: processedCount };
    } catch (error) {
      console.error(`❌ [TELEGRAM-INGESTION] Webhook processing error:`, error);
      return { success: false, processed: processedCount };
    }
  }

  /**
   * Processa email do IMAP
   */
  async processImapEmail(emailData: any, tenantId: string): Promise<MessageEntity> {
    console.log(`📨 [IMAP-INGESTION] Processing email for tenant: ${tenantId}`);

    const incomingMessage: IncomingMessage = {
      channelId: 'imap-email',
      channelType: 'email',
      from: emailData.from?.value?.[0]?.address || emailData.from || 'unknown',
      to: emailData.to?.value?.[0]?.address || emailData.to || 'imap-inbox',
      subject: emailData.subject || 'Sem assunto',
      content: emailData.text || emailData.html || '[Conteúdo indisponível]',
      metadata: {
        messageId: emailData.messageId,
        date: emailData.date,
        headers: emailData.headers,
        hasAttachments: Boolean(emailData.attachments?.length)
      },
      priority: emailData.priority === 'high' ? 'high' : 'medium',
      tenantId
    };

    return await this.ingestMessage(incomingMessage);
  }

  /**
   * Gera ID único para mensagem
   */
  private generateMessageId(message: IncomingMessage): string {
    const source = `${message.channelType}-${message.from}-${message.tenantId}-${Date.now()}`;
    return crypto.createHash('sha256').update(source).digest('hex').substring(0, 16);
  }
}
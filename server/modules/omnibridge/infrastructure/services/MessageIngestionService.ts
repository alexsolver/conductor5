import { MessageEntity } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { ProcessMessageUseCase } from '../../application/use-cases/ProcessMessageUseCase';
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
  constructor(
    private messageRepository: IMessageRepository,
    private processMessageUseCase?: ProcessMessageUseCase
  ) {}

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
      console.log(`📨 [TELEGRAM-INGESTION] Webhook data:`, JSON.stringify(webhookData, null, 2));

      const message = webhookData.message;
      if (!message) {
        console.log(`❌ [TELEGRAM-INGESTION] No message found in webhook data`);
        return { success: false, processed: 0 };
      }

      console.log(`📨 [TELEGRAM-INGESTION] Message found:`, JSON.stringify(message, null, 2));

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

      // 🤖 CRITICAL FIX: Processar regras de automação após salvar mensagem
      if (this.processMessageUseCase) {
        console.log(`🤖 [TELEGRAM-INGESTION] Triggering automation rules for message ${savedMessage.id}`);
        try {
          const automationResult = await this.processMessageUseCase.processDirectMessage(
            {
              id: savedMessage.id,
              content: incomingMessage.content,
              sender: incomingMessage.from,
              subject: incomingMessage.subject,
              channel: incomingMessage.channelType,
              timestamp: new Date().toISOString(),
              metadata: incomingMessage.metadata
            }, 
            tenantId
          );
          console.log(`✅ [TELEGRAM-INGESTION] Automation result:`, automationResult);
        } catch (automationError) {
          console.error(`❌ [TELEGRAM-INGESTION] Automation processing failed:`, automationError);
          // Não falhar o webhook por causa de erro na automação
        }
      } else {
        console.log(`⚠️ [TELEGRAM-INGESTION] ProcessMessageUseCase not available - skipping automation`);
      }

      console.log(`✅ [TELEGRAM-INGESTION] Webhook processed: ${processedCount} messages`);
      
      return { success: true, processed: processedCount };
    } catch (error) {
      console.error(`❌ [TELEGRAM-INGESTION] Webhook processing error:`, error);
      return { success: false, processed: processedCount };
    }
  }

  /**
   * Processa email do IMAP para OmniBridge inbox
   */
  async processImapEmail(emailData: any, tenantId: string): Promise<MessageEntity> {
    console.log(`📨 [IMAP-INGESTION] Processing email for OmniBridge inbox - tenant: ${tenantId}`);
    console.log(`📨 [IMAP-INGESTION] Email from: ${emailData.from}`);
    console.log(`📨 [IMAP-INGESTION] Email subject: ${emailData.subject}`);

    // ✅ 1QA.MD: Extract email address properly 
    const extractEmail = (emailField: any) => {
      if (typeof emailField === 'string') {
        const match = emailField.match(/<(.+?)>/) || [null, emailField];
        return match[1] || emailField;
      }
      return emailField?.value?.[0]?.address || emailField || 'unknown';
    };

    const fromEmail = extractEmail(emailData.from);
    const toEmail = extractEmail(emailData.to);

    // 🎯 TICKET CONTEXT TRACKING: Extrair ticket_id de headers de email
    const ticketId = this.extractTicketIdFromEmailHeaders(emailData);
    if (ticketId) {
      console.log(`🎫 [IMAP-INGESTION] Detected ticket context: ${ticketId} - will bypass automation`);
    }

    const incomingMessage: IncomingMessage = {
      channelId: emailData.metadata?.channelId || 'imap-email',
      channelType: 'email',
      from: fromEmail,
      to: toEmail,
      subject: emailData.subject || 'Sem assunto',
      content: emailData.text || emailData.html || '[Email recebido via IMAP - conteúdo não disponível]',
      metadata: {
        messageId: emailData.messageId,
        originalMessageId: emailData.messageId,
        date: emailData.date,
        ticketId, // 🎯 Incluir ticket_id se encontrado
        inReplyTo: emailData.headers?.['in-reply-to']?.[0],
        references: emailData.headers?.references,
        headers: emailData.headers || {},
        hasAttachments: Boolean(emailData.attachments?.length),
        imapProcessed: true,
        processedAt: new Date().toISOString(),
        ingestionSource: 'message-ingestion-service-imap',
        originalFrom: emailData.from,
        priority: emailData.priority,
        gmailServiceSource: emailData.metadata?.gmailServiceSource || false
      },
      priority: emailData.priority || 'medium',
      tenantId
    };

    console.log(`📥 [IMAP-INGESTION] Ingesting message into OmniBridge inbox`);
    const result = await this.ingestMessage(incomingMessage);
    console.log(`✅ [IMAP-INGESTION] Email successfully added to OmniBridge inbox with ID: ${result.id}`);
    
    // ✅ 1QA.MD: Process automation rules after successful ingestion
    if (this.processMessageUseCase) {
      console.log(`🤖 [IMAP-INGESTION] Triggering automation rules for message ${result.id}`);
      try {
        const automationResult = await this.processMessageUseCase.processDirectMessage(
          {
            id: result.id,
            content: incomingMessage.content,
            sender: incomingMessage.from,
            subject: incomingMessage.subject,
            channel: incomingMessage.channelType,
            timestamp: new Date().toISOString(),
            metadata: incomingMessage.metadata
          }, 
          tenantId
        );
        console.log(`✅ [IMAP-INGESTION] Automation rules processed:`, automationResult);
      } catch (automationError) {
        console.error(`❌ [IMAP-INGESTION] Automation processing failed (non-critical):`, automationError);
      }
    }
    
    console.log(`🎯 [IMAP-INGESTION] Email successfully processed and available in OmniBridge inbox`);
    return result;
  }

  /**
   * 🎯 TICKET CONTEXT TRACKING: Extrai ticket_id de headers de email
   * Verifica os headers: X-Ticket-ID, In-Reply-To, References
   */
  private extractTicketIdFromEmailHeaders(emailData: any): string | null {
    try {
      const headers = emailData.headers || {};
      
      // 1. Verificar header customizado X-Ticket-ID (mais confiável)
      const xTicketId = headers['x-ticket-id']?.[0] || headers['X-Ticket-ID']?.[0];
      if (xTicketId) {
        console.log(`🎫 [TICKET-TRACKING] Found X-Ticket-ID: ${xTicketId}`);
        return xTicketId;
      }

      // 2. Verificar In-Reply-To para extrair ticket_id do Message-ID anterior
      const inReplyTo = headers['in-reply-to']?.[0];
      if (inReplyTo) {
        // Message-ID format: <ticket-{ticketId}.{timestamp}@conductor.system>
        const ticketMatch = inReplyTo.match(/ticket-([a-f0-9-]+)\./i);
        if (ticketMatch) {
          console.log(`🎫 [TICKET-TRACKING] Extracted ticket_id from In-Reply-To: ${ticketMatch[1]}`);
          return ticketMatch[1];
        }
      }

      // 3. Verificar References (último Message-ID na thread)
      const references = headers['references']?.[0] || headers['References']?.[0];
      if (references) {
        const refArray = references.split(/\s+/);
        for (const ref of refArray.reverse()) {
          const ticketMatch = ref.match(/ticket-([a-f0-9-]+)\./i);
          if (ticketMatch) {
            console.log(`🎫 [TICKET-TRACKING] Extracted ticket_id from References: ${ticketMatch[1]}`);
            return ticketMatch[1];
          }
        }
      }

      console.log(`📭 [TICKET-TRACKING] No ticket context found in email headers`);
      return null;
    } catch (error) {
      console.error(`❌ [TICKET-TRACKING] Error extracting ticket_id:`, error);
      return null;
    }
  }

  /**
   * Gera ID único para mensagem
   */
  private generateMessageId(message: IncomingMessage): string {
    const source = `${message.channelType}-${message.from}-${message.tenantId}-${Date.now()}`;
    return crypto.createHash('sha256').update(source).digest('hex').substring(0, 16);
  }
}
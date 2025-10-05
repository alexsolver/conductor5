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

      // 🎯 TICKET CONTEXT TRACKING: Verificar se mensagem tem contexto de ticket
      const metadata = {
        telegramMessageId: message.message_id,
        chatId: message.chat.id,
        fromUser: message.from,
        chatType: message.chat.type,
        timestamp: message.date,
        conversationId: `telegram-${message.chat.id}`, // Usar chatId como conversationId
        threadId: message.reply_to_message?.message_id ? `telegram-thread-${message.reply_to_message.message_id}` : undefined
      };

      const ticketId = await this.extractTicketIdFromChatMetadata(metadata, tenantId);
      if (ticketId) {
        metadata.ticketId = ticketId;
        console.log(`🎫 [TELEGRAM-INGESTION] Detected ticket context: ${ticketId} - will bypass automation`);
      }

      // Extrair dados da mensagem do Telegram
      const incomingMessage: IncomingMessage = {
        channelId: 'telegram',
        channelType: 'telegram',
        from: `telegram:${message.from.id}`,
        to: `bot:${webhookData.bot?.id || 'unknown'}`,
        subject: `Telegram - ${message.from.first_name || message.from.username || 'Unknown'}`,
        content: message.text || message.caption || '[Mensagem não textual]',
        metadata,
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
   * Processa webhook do WhatsApp
   */
  async processWhatsAppWebhook(message: any, tenantId: string): Promise<{ success: boolean; processed: number }> {
    let processedCount = 0;

    try {
      console.log(`📱 [WHATSAPP-INGESTION] Processing message for tenant: ${tenantId}`);
      console.log(`📱 [WHATSAPP-INGESTION] Message data:`, JSON.stringify(message, null, 2));

      if (!message || !message.from) {
        console.log(`❌ [WHATSAPP-INGESTION] Invalid message data`);
        return { success: false, processed: 0 };
      }

      // 🎯 TICKET CONTEXT TRACKING: Criar metadata com chatId para link automático
      const metadata = {
        whatsappMessageId: message.id,
        chatId: message.from, // WhatsApp usa 'from' como identificador único do chat
        fromUser: message.profile?.name || message.from,
        messageType: message.type,
        timestamp: message.timestamp,
        conversationId: `whatsapp-${message.from}`, // Usar 'from' como conversationId
      };

      const ticketId = await this.extractTicketIdFromChatMetadata(metadata, tenantId);
      if (ticketId) {
        metadata.ticketId = ticketId;
        console.log(`🎫 [WHATSAPP-INGESTION] Detected ticket context: ${ticketId} - will bypass automation`);
      }

      // Extrair dados da mensagem do WhatsApp
      const incomingMessage: IncomingMessage = {
        channelId: 'whatsapp',
        channelType: 'whatsapp',
        from: `whatsapp:${message.from}`,
        to: 'whatsapp-business@conductor.com',
        subject: `WhatsApp - ${message.profile?.name || message.from}`,
        content: message.text?.body || '[Mensagem não textual]',
        metadata,
        priority: 'medium',
        tenantId
      };

      const savedMessage = await this.ingestMessage(incomingMessage);
      processedCount++;

      console.log(`✅ [WHATSAPP-INGESTION] Message saved with ID: ${savedMessage.id}`);
      console.log(`✅ [WHATSAPP-INGESTION] Message content: ${incomingMessage.content}`);
      console.log(`✅ [WHATSAPP-INGESTION] From: ${incomingMessage.from}`);

      // 🤖 CRITICAL FIX: Processar regras de automação após salvar mensagem
      if (this.processMessageUseCase) {
        console.log(`🤖 [WHATSAPP-INGESTION] Triggering automation rules for message ${savedMessage.id}`);
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
          console.log(`✅ [WHATSAPP-INGESTION] Automation result:`, automationResult);
        } catch (automationError) {
          console.error(`❌ [WHATSAPP-INGESTION] Automation processing failed:`, automationError);
          // Não falhar o webhook por causa de erro na automação
        }
      } else {
        console.log(`⚠️ [WHATSAPP-INGESTION] ProcessMessageUseCase not available - skipping automation`);
      }

      console.log(`✅ [WHATSAPP-INGESTION] Webhook processed: ${processedCount} messages`);
      
      return { success: true, processed: processedCount };
    } catch (error) {
      console.error(`❌ [WHATSAPP-INGESTION] Webhook processing error:`, error);
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

      // 4. Verificar subject para padrão [Ticket #12345]
      if (emailData.subject) {
        const subjectMatch = emailData.subject.match(/\[Ticket\s+#?([a-f0-9-]+)\]/i);
        if (subjectMatch) {
          console.log(`🎫 [TICKET-TRACKING] Extracted ticket_id from Subject: ${subjectMatch[1]}`);
          return subjectMatch[1];
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
   * 🎯 TICKET CONTEXT TRACKING: Extrai ticket_id de metadata de chat
   * Verifica threadId, conversationId e replyTo para WhatsApp, Telegram, Slack
   */
  private async extractTicketIdFromChatMetadata(metadata: any, tenantId: string): Promise<string | null> {
    try {
      // 1. Verificar se há threadId/conversationId vinculado a um ticket
      if (metadata?.threadId) {
        console.log(`🎫 [TICKET-TRACKING] Checking threadId: ${metadata.threadId}`);
        const ticketId = await this.findTicketByThreadId(metadata.threadId, tenantId);
        if (ticketId) {
          console.log(`🎫 [TICKET-TRACKING] Found ticket via threadId: ${ticketId}`);
          return ticketId;
        }
      }

      // 2. Verificar conversationId
      if (metadata?.conversationId) {
        console.log(`🎫 [TICKET-TRACKING] Checking conversationId: ${metadata.conversationId}`);
        const ticketId = await this.findTicketByConversationId(metadata.conversationId, tenantId);
        if (ticketId) {
          console.log(`🎫 [TICKET-TRACKING] Found ticket via conversationId: ${ticketId}`);
          return ticketId;
        }
      }

      // 3. Verificar se há chatId para Telegram
      if (metadata?.chatId) {
        console.log(`🎫 [TICKET-TRACKING] Checking chatId: ${metadata.chatId}`);
        const ticketId = await this.findTicketByChatId(metadata.chatId, tenantId);
        if (ticketId) {
          console.log(`🎫 [TICKET-TRACKING] Found ticket via chatId: ${ticketId}`);
          return ticketId;
        }
      }

      console.log(`📭 [TICKET-TRACKING] No ticket context found in chat metadata`);
      return null;
    } catch (error) {
      console.error(`❌ [TICKET-TRACKING] Error extracting ticket_id from chat:`, error);
      return null;
    }
  }

  /**
   * Busca ticket por threadId em metadata
   */
  private async findTicketByThreadId(threadId: string, tenantId: string): Promise<string | null> {
    try {
      const { pool } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await pool.query(`
        SELECT id FROM "${schemaName}".tickets 
        WHERE metadata->>'threadId' = $1
        LIMIT 1
      `, [threadId]);

      return result.rows[0]?.id || null;
    } catch (error) {
      console.error(`❌ [TICKET-TRACKING] Error finding ticket by threadId:`, error);
      return null;
    }
  }

  /**
   * Busca ticket por conversationId em metadata
   * ✨ CONVERSATION ID = ID ÚNICO por conversa (100% preciso)
   * Diferente de chatId, conversationId é gerado UMA VEZ por thread de conversa
   */
  private async findTicketByConversationId(conversationId: string, tenantId: string): Promise<string | null> {
    try {
      const { pool } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // ConversationId é ÚNICO - retorna o ticket EXATO (não precisa filtrar por status)
      const result = await pool.query(`
        SELECT id FROM "${schemaName}".tickets 
        WHERE metadata->>'conversationId' = $1
        LIMIT 1
      `, [conversationId]);

      if (result.rows[0]) {
        console.log(`✅ [CONVERSATION-TRACKING] Found EXACT ticket by conversationId ${conversationId}: ${result.rows[0].id}`);
        return result.rows[0].id;
      }

      console.log(`📭 [CONVERSATION-TRACKING] No ticket found for conversationId: ${conversationId}`);
      return null;
    } catch (error) {
      console.error(`❌ [TICKET-TRACKING] Error finding ticket by conversationId:`, error);
      return null;
    }
  }

  /**
   * Busca ticket por chatId (Telegram/WhatsApp) em metadata
   * CRITICAL FIX: Busca o ticket ABERTO mais recente, não qualquer ticket
   */
  private async findTicketByChatId(chatId: string, tenantId: string): Promise<string | null> {
    try {
      const { pool } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // 1. Primeiro: buscar ticket ABERTO mais recente
      const openResult = await pool.query(`
        SELECT id FROM "${schemaName}".tickets 
        WHERE metadata->>'chatId' = $1
          AND status IN ('open', 'pending', 'in_progress')
        ORDER BY created_at DESC
        LIMIT 1
      `, [chatId]);

      if (openResult.rows[0]) {
        console.log(`🎫 [TICKET-TRACKING] Found OPEN ticket for chatId ${chatId}: ${openResult.rows[0].id}`);
        return openResult.rows[0].id;
      }

      // 2. Se não houver aberto: buscar qualquer ticket mais recente
      const anyResult = await pool.query(`
        SELECT id FROM "${schemaName}".tickets 
        WHERE metadata->>'chatId' = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [chatId]);

      if (anyResult.rows[0]) {
        console.log(`🎫 [TICKET-TRACKING] Found MOST RECENT ticket for chatId ${chatId}: ${anyResult.rows[0].id}`);
        return anyResult.rows[0].id;
      }

      return null;
    } catch (error) {
      console.error(`❌ [TICKET-TRACKING] Error finding ticket by chatId:`, error);
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
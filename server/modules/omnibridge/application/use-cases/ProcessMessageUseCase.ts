import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { MessageEntity } from '../../domain/entities/Message';
import { GlobalAutomationManager } from '../../infrastructure/services/AutomationEngine';
import { AutomationEngine } from '../../infrastructure/services/AutomationEngine'; // Import AutomationEngine
import { MessageAnalysis } from '../../domain/entities/MessageAnalysis'; // Assuming MessageAnalysis is defined elsewhere

export interface ProcessMessageRequest {
  messageId: string;
  tenantId: string;
  action?: 'read' | 'processed' | 'analyze_and_automate';
}

export class ProcessMessageUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(request: ProcessMessageRequest): Promise<{
    success: boolean;
    aiAnalysis?: any;
    automationResults?: any;
    message?: string;
  }> {
    const { messageId, tenantId, action = 'analyze_and_automate' } = request;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!messageId) {
      throw new Error('Message ID is required');
    }

    console.log(`🔧 [ProcessMessageUseCase] Processing message ${messageId} for tenant ${tenantId} with action: ${action}`);

    // Buscar mensagem no repositório
    const message = await this.messageRepository.findById(messageId, tenantId);
    if (!message) {
      throw new Error('Message not found');
    }

    console.log(`📨 [ProcessMessageUseCase] Found message from ${message.fromAddress} via ${message.channelType}`);

    // Executar ação solicitada
    switch (action) {
      case 'read':
        const readResult = await this.messageRepository.markAsRead(messageId, tenantId);
        return {
          success: readResult,
          message: 'Message marked as read'
        };

      case 'processed':
        const processedResult = await this.messageRepository.markAsProcessed(messageId, tenantId);
        return {
          success: processedResult,
          message: 'Message marked as processed'
        };

      case 'analyze_and_automate':
        return await this.analyzeAndAutomate(message, tenantId);

      default:
        throw new Error('Invalid action');
    }
  }

  private async analyzeAndAutomate(message: MessageEntity, tenantId: string): Promise<{
    success: boolean;
    aiAnalysis?: any;
    automationResults?: any;
    message?: string;
  }> {
    try {
      console.log(`🤖 [ProcessMessageUseCase] Starting AI analysis and automation for message ${message.id}`);

      // 🎯 TICKET CONTEXT TRACKING: Verificar se mensagem possui ticket_id
      const ticketId = message.metadata?.ticketId;
      if (ticketId) {
        console.log(`🎫 [ProcessMessageUseCase] Message has ticket context: ${ticketId} - BYPASSING AUTOMATION`);
        
        // Adicionar mensagem diretamente ao ticket existente
        try {
          await this.addMessageToTicket(ticketId, message, tenantId);
          console.log(`✅ [ProcessMessageUseCase] Message added to ticket ${ticketId}`);
        } catch (ticketError) {
          console.error(`❌ [ProcessMessageUseCase] Failed to add message to ticket:`, ticketError);
        }
        
        await this.messageRepository.markAsProcessed(message.id, tenantId);
        
        return {
          success: true,
          message: `Message linked to existing ticket ${ticketId} - automation bypassed`,
          automationResults: {
            rulesExecuted: 0,
            actionsTriggered: 0,
            bypassed: true,
            linkedTicketId: ticketId
          }
        };
      }

      // Preparar dados da mensagem para o motor de automação
      const messageData = {
        id: message.id,
        content: message.content,
        body: message.content, // Alias para compatibilidade
        sender: message.fromAddress,
        from: message.fromAddress, // Alias
        recipient: message.toAddress,
        to: message.toAddress, // Alias
        subject: message.subject,
        channel: message.channelType,
        channelType: message.channelType, // Alias
        timestamp: message.timestamp?.toISOString() || new Date().toISOString(),
        status: message.status,
        priority: message.priority,
        tags: message.tags || [],
        attachments: message.attachments,
        metadata: message.metadata || {}
      };

      // Executar processamento através do AutomationEngine
      const { GlobalAutomationManager } = await import('../../infrastructure/services/AutomationEngine');
      const automationManager = GlobalAutomationManager.getInstance();
      const automationEngine = await automationManager.getEngine(tenantId);

      console.log(`⚙️ [ProcessMessageUseCase] Delegating to AutomationEngine for tenant ${tenantId}`);

      // Ensure rules are loaded and synced
      await automationEngine.loadRulesFromDatabase();

      // Processar mensagem através do engine de automação
      await automationEngine.processMessage(messageData);

      // Obter métricas da execução
      const metrics = automationEngine.getMetrics();

      // Marcar mensagem como processada
      await this.messageRepository.markAsProcessed(message.id, tenantId);

      console.log(`✅ [ProcessMessageUseCase] Message processed successfully. Rules executed: ${metrics.rulesExecuted}, Actions triggered: ${metrics.actionsTriggered}`);

      return {
        success: true,
        automationResults: {
          rulesExecuted: metrics.rulesExecuted,
          actionsTriggered: metrics.actionsTriggered,
          avgExecutionTime: metrics.avgExecutionTime,
          lastExecution: metrics.lastExecution
        },
        message: `Message processed successfully. ${metrics.rulesExecuted} automation rules evaluated, ${metrics.actionsTriggered} actions triggered.`
      };

    } catch (error) {
      console.error(`❌ [ProcessMessageUseCase] Error in automation processing:`, error);

      // Mesmo em caso de erro, marcar como processada para evitar loops
      try {
        await this.messageRepository.markAsProcessed(message.id, tenantId);
      } catch (markError) {
        console.error(`❌ [ProcessMessageUseCase] Error marking message as processed:`, markError);
      }

      return {
        success: false,
        message: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Método para processamento manual/direto de mensagens (sem buscar no repository)
  async processDirectMessage(messageData: any, tenantId: string): Promise<{
    success: boolean;
    message: string;
    aiAnalysis?: MessageAnalysis;
    automationResults?: any;
  }> {
    try {
      console.log(`🎯 [ProcessMessageUseCase] Processing direct message for tenant ${tenantId}`);
      console.log(`📨 [ProcessMessageUseCase] Message data:`, {
        content: messageData.content || messageData.body,
        sender: messageData.sender || messageData.from,
        channel: messageData.channel || messageData.channelType
      });

      // 🎯 TICKET CONTEXT TRACKING: Verificar se mensagem possui ticket_id em metadata
      const ticketId = messageData.metadata?.ticketId;
      if (ticketId) {
        console.log(`🎫 [ProcessMessageUseCase] Direct message has ticket context: ${ticketId} - BYPASSING AUTOMATION`);
        
        // Adicionar mensagem diretamente ao ticket existente
        try {
          const messageEntity = {
            id: messageData.id,
            fromAddress: messageData.sender || messageData.from,
            toAddress: messageData.recipient || messageData.to,
            subject: messageData.subject,
            content: messageData.content || messageData.body,
            channelType: messageData.channel || messageData.channelType,
            metadata: messageData.metadata
          } as any; // Cast para compatibilidade
          
          await this.addMessageToTicket(ticketId, messageEntity, tenantId);
          console.log(`✅ [ProcessMessageUseCase] Direct message added to ticket ${ticketId}`);
        } catch (ticketError) {
          console.error(`❌ [ProcessMessageUseCase] Failed to add direct message to ticket:`, ticketError);
        }
        
        return {
          success: true,
          message: `Message linked to existing ticket ${ticketId} - automation bypassed`,
          automationResults: {
            rulesExecuted: 0,
            actionsTriggered: 0,
            bypassed: true,
            linkedTicketId: ticketId
          }
        };
      }

      // Initialize automation engine for tenant using GlobalAutomationManager
      const { GlobalAutomationManager } = await import('../../infrastructure/services/AutomationEngine');
      const automationManager = GlobalAutomationManager.getInstance();
      const automationEngine = await automationManager.getEngine(tenantId);

      // Wait for rules to be loaded from database
      await automationEngine.loadRulesFromDatabase();

      console.log(`⚙️ [ProcessMessageUseCase] Processing direct message through AutomationEngine`);

      // Ensure message data has the correct format expected by automation engine
      const normalizedMessageData = {
        id: messageData.id || `msg_${Date.now()}`,
        content: messageData.content || messageData.body || '',
        sender: messageData.sender || messageData.from || 'unknown',
        channel: messageData.channel || messageData.channelType || 'direct',
        channelType: messageData.channelType || messageData.channel || 'direct',
        timestamp: messageData.timestamp || new Date().toISOString(),
        tenantId: tenantId
      };

      console.log(`📋 [ProcessMessageUseCase] Normalized message data:`, normalizedMessageData);

      // Process through automation engine
      await automationEngine.processMessage(normalizedMessageData);

      const metrics = automationEngine.getMetrics();

      console.log(`📊 [ProcessMessageUseCase] Automation metrics:`, metrics);

      return {
        success: true,
        message: `Direct message processed successfully. ${metrics.rulesExecuted} automation rules evaluated, ${metrics.actionsTriggered} actions triggered.`,
        automationResults: metrics
      };
    } catch (error) {
      console.error(`❌ [ProcessMessageUseCase] Error processing direct message:`, error);
      return {
        success: false,
        message: `Failed to process direct message: ${error.message}`
      };
    }
  }

  // Método para testar regras de automação
  async testAutomationRule(ruleId: string, testMessage: any, tenantId: string): Promise<{
    success: boolean;
    result?: any;
    message?: string;
  }> {
    try {
      console.log(`🧪 [ProcessMessageUseCase] Testing automation rule ${ruleId} for tenant ${tenantId}`);

      const automationManager = GlobalAutomationManager.getInstance();
      const automationEngine = await automationManager.getEngine(tenantId);

      const testResult = await automationEngine.testRule(ruleId, testMessage);

      return {
        success: true,
        result: testResult,
        message: `Rule test completed. Matched: ${testResult.matched}, Execution time: ${testResult.executionTime}ms`
      };

    } catch (error) {
      console.error(`❌ [ProcessMessageUseCase] Error testing automation rule:`, error);

      return {
        success: false,
        message: `Error testing rule: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 🎯 TICKET CONTEXT TRACKING: Adiciona mensagem diretamente a um ticket existente
   * Usado quando mensagem é resposta de um ticket (bypass de automação)
   * 😊 SENTIMENT DETECTION: Detecta sentimento automaticamente em todas as mensagens
   */
  private async addMessageToTicket(ticketId: string, message: any, tenantId: string): Promise<void> {
    try {
      const { pool } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`🎫 [TICKET-CONTEXT] Adding message to ticket ${ticketId} in schema ${schemaName}`);

      // Determinar sender_id (usar 'system' se não houver usuário identificado)
      const senderId = message.metadata?.userId || message.metadata?.authorId || 'system';
      
      // Determinar tipo de mensagem baseado no canal
      const messageType = message.channelType === 'email' ? 'email' : 'comment';
      
      // Formatar conteúdo da mensagem
      const messageContent = `**[${message.channelType?.toUpperCase() || 'SYSTEM'}]** ${message.subject ? `${message.subject}\n\n` : ''}${message.content || message.body || ''}`;

      // 😊 SENTIMENT DETECTION: Detectar sentimento da mensagem
      let sentimentData = null;
      try {
        const { getSentimentService } = await import('../../infrastructure/services/SentimentDetectionService');
        const sentimentService = getSentimentService();
        const sentiment = await sentimentService.detectSentiment(
          message.content || message.body || '',
          {
            subject: message.subject,
            previousMessages: [] // TODO: Buscar histórico de mensagens do ticket
          }
        );
        
        sentimentData = sentiment;
        console.log(`😊 [SENTIMENT] Detected: ${sentiment.sentiment} (score: ${sentiment.score}, emotion: ${sentiment.emotion})`);
        
        // Verificar se deve disparar alerta
        if (sentimentService.shouldTriggerAlert(sentiment)) {
          console.log(`⚠️ [SENTIMENT-ALERT] Negative sentiment detected (score: ${sentiment.score}) - should notify team`);
          // TODO: Disparar notificação para equipe
        }
      } catch (sentimentError) {
        console.error(`❌ [SENTIMENT] Error detecting sentiment:`, sentimentError);
        // Não falhar por causa de erro no sentimento
      }

      // Preparar metadata com sentimento
      const metadata = {
        ...(message.metadata || {}),
        sentiment: sentimentData,
        channelType: message.channelType,
        originalFrom: message.fromAddress,
        detectedAt: new Date().toISOString()
      };

      await pool.query(`
        INSERT INTO "${schemaName}".ticket_messages 
        (id, tenant_id, ticket_id, sender_id, content, is_internal, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        tenantId,
        ticketId,
        senderId,
        messageContent,
        false // is_internal
      ]);

      console.log(`✅ [TICKET-CONTEXT] Message successfully added to ticket ${ticketId} with sentiment analysis`);
    } catch (error) {
      console.error(`❌ [TICKET-CONTEXT] Error adding message to ticket:`, error);
      throw error;
    }
  }
}
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
      const automationEngine = automationManager.getEngine(tenantId);

      console.log(`⚙️ [ProcessMessageUseCase] Delegating to AutomationEngine for tenant ${tenantId}`);

      // Ensure rules are loaded and synced
      await automationEngine.syncRulesWithDatabase();

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

      // Initialize automation engine for tenant using GlobalAutomationManager
      const { GlobalAutomationManager } = await import('../../infrastructure/services/AutomationEngine');
      const automationManager = GlobalAutomationManager.getInstance();
      const automationEngine = automationManager.getEngine(tenantId);

      // Wait for rules to be loaded from database
      await automationEngine.syncRulesWithDatabase();

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
      const automationEngine = automationManager.getEngine(tenantId);

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
}
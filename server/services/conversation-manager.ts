// ========================================
// CONVERSATION MANAGER SERVICE
// ========================================
// Manages multi-turn conversations, context, and action execution flow

import { unifiedStorage } from '../storage-master';
import { aiEngine } from './ai-engine';
import type { 
  AiAgent, AiConversation, AiAction,
  InsertAiConversationMessage, InsertAiConversationLog
} from '@shared/schema';

// ========================================
// TYPES
// ========================================

export interface ProcessMessageResult {
  conversationId: string;
  agentResponse: string;
  status: string;
  nextStep: string;
  actionExecuted?: {
    actionType: string;
    result: any;
  };
}

// ========================================
// CONVERSATION MANAGER CLASS
// ========================================

export class ConversationManager {
  
  /**
   * Process incoming message from user
   */
  async processMessage(
    tenantId: string,
    agentId: string,
    userId: string,
    userMessage: string,
    channelType: string = 'chat',
    channelId?: string
  ): Promise<ProcessMessageResult> {
    
    // Get agent
    const agent = await unifiedStorage.getAiAgent(tenantId, agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get or create conversation
    let conversation = await this.getOrCreateConversation(
      tenantId,
      agentId,
      userId,
      channelType,
      channelId
    );

    try {
      // Save user message
      await this.saveMessage(conversation.id, 'user', userMessage);
      await this.log(conversation.id, 'info', 'message_received', { userMessage });

      // Analyze sentiment
      const sentiment = await aiEngine.analyzeSentiment(
        userMessage,
        agent,
        agent.behaviorRules.autoEscalateKeywords
      );
      
      await this.log(conversation.id, 'info', 'sentiment_analysis', sentiment);

      // Update conversation sentiment
      await unifiedStorage.updateAiConversation(conversation.id, {
        overallSentiment: sentiment.sentiment,
        sentimentHistory: [
          ...(conversation.sentimentHistory || []),
          {
            timestamp: new Date().toISOString(),
            sentiment: sentiment.sentiment,
            confidence: sentiment.confidence
          }
        ]
      });

      // Check if should escalate
      if (sentiment.urgencyDetected || sentiment.escalationKeywords.length > 0) {
        return await this.escalateToHuman(conversation, agent, userMessage, sentiment);
      }

      // Route based on current step
      let result: ProcessMessageResult;
      
      switch (conversation.currentStep) {
        case 'greeting':
          result = await this.handleGreeting(conversation, agent, userMessage);
          break;
          
        case 'detecting_intent':
          result = await this.handleIntentDetection(conversation, agent, userMessage);
          break;
          
        case 'collecting_params':
          result = await this.handleParamCollection(conversation, agent, userMessage);
          break;
          
        case 'confirming_action':
          result = await this.handleActionConfirmation(conversation, agent, userMessage);
          break;
          
        default:
          result = await this.handleGenericMessage(conversation, agent, userMessage);
      }

      // Save agent response
      await this.saveMessage(conversation.id, 'agent', result.agentResponse);
      
      // Update conversation state
      await unifiedStorage.updateAiConversation(conversation.id, {
        currentStep: result.nextStep,
        turnCount: (conversation.turnCount || 0) + 1,
        lastMessageAt: new Date()
      });

      return result;
      
    } catch (error) {
      await this.log(conversation.id, 'error', 'processing_error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        conversationId: conversation.id,
        agentResponse: agent.personality.fallbackMessage,
        status: 'error',
        nextStep: 'error_recovery'
      };
    }
  }

  /**
   * Get existing conversation or create new one
   */
  private async getOrCreateConversation(
    tenantId: string,
    agentId: string,
    userId: string,
    channelType: string,
    channelId?: string
  ): Promise<AiConversation> {
    
    // Try to find active conversation
    const existingConversations = await unifiedStorage.getAiConversations(tenantId, {
      agentId,
      userId,
      status: 'active',
      limit: 1
    });

    if (existingConversations.length > 0) {
      return existingConversations[0];
    }

    // Create new conversation
    return await unifiedStorage.createAiConversation({
      tenantId,
      agentId,
      userId,
      channelType,
      channelId,
      status: 'active',
      currentStep: 'greeting',
      collectedParams: {},
      missingParams: [],
      context: {},
      turnCount: 0
    });
  }

  /**
   * Handle greeting/initial message
   */
  private async handleGreeting(
    conversation: AiConversation,
    agent: AiAgent,
    userMessage: string
  ): Promise<ProcessMessageResult> {
    
    await this.log(conversation.id, 'info', 'greeting_step', {});

    // Detect intent from first message
    const availableActions = await unifiedStorage.getAiActions();
    const enabledActions = availableActions.filter(a => 
      agent.enabledActions?.includes(a.actionType) || false
    );

    const intent = await aiEngine.detectIntent(
      userMessage,
      agent,
      enabledActions
    );

    await this.log(conversation.id, 'info', 'intent_detected', intent);

    if (!intent.suggestedAction || intent.confidence < 0.5) {
      // Low confidence, ask for clarification
      const response = await aiEngine.generateResponse(
        agent,
        [{ role: 'user', content: userMessage }],
        'needs_clarification',
        'User intent is unclear'
      );

      return {
        conversationId: conversation.id,
        agentResponse: response,
        status: 'needs_clarification',
        nextStep: 'detecting_intent'
      };
    }

    // Update conversation with detected intent
    await unifiedStorage.updateAiConversation(conversation.id, {
      detectedIntent: intent.intent,
      intendedAction: intent.suggestedAction
    });

    // Start parameter collection
    const action = enabledActions.find(a => a.actionType === intent.suggestedAction);
    if (!action) {
      return {
        conversationId: conversation.id,
        agentResponse: agent.personality.fallbackMessage,
        status: 'action_not_found',
        nextStep: 'greeting'
      };
    }

    return await this.startParamCollection(conversation, agent, action, userMessage);
  }

  /**
   * Handle intent detection when unclear
   */
  private async handleIntentDetection(
    conversation: AiConversation,
    agent: AiAgent,
    userMessage: string
  ): Promise<ProcessMessageResult> {
    
    const availableActions = await unifiedStorage.getAiActions();
    const enabledActions = availableActions.filter(a => 
      agent.enabledActions?.includes(a.actionType) || false
    );

    const conversationHistory = await unifiedStorage.getAiConversationMessages(conversation.id);
    
    const intent = await aiEngine.detectIntent(
      userMessage,
      agent,
      enabledActions,
      {
        conversationHistory: conversationHistory.map(m => ({
          role: m.role as any,
          content: m.content
        }))
      }
    );

    if (!intent.suggestedAction || intent.confidence < 0.6) {
      const response = await aiEngine.generateResponse(
        agent,
        conversationHistory.map(m => ({ role: m.role, content: m.content })),
        'still_unclear',
        'Still unable to determine user intent'
      );

      return {
        conversationId: conversation.id,
        agentResponse: response,
        status: 'needs_clarification',
        nextStep: 'detecting_intent'
      };
    }

    const action = enabledActions.find(a => a.actionType === intent.suggestedAction);
    if (!action) {
      return {
        conversationId: conversation.id,
        agentResponse: 'Desculpe, não consigo executar esta ação.',
        status: 'action_not_available',
        nextStep: 'greeting'
      };
    }

    await unifiedStorage.updateAiConversation(conversation.id, {
      detectedIntent: intent.intent,
      intendedAction: intent.suggestedAction
    });

    return await this.startParamCollection(conversation, agent, action, userMessage);
  }

  /**
   * Start collecting required parameters for action
   */
  private async startParamCollection(
    conversation: AiConversation,
    agent: AiAgent,
    action: AiAction,
    initialMessage: string
  ): Promise<ProcessMessageResult> {
    
    await this.log(conversation.id, 'info', 'starting_param_collection', { 
      action: action.actionType 
    });

    // Try to extract params from initial message
    const extracted = await aiEngine.extractEntities(
      initialMessage,
      action,
      agent,
      conversation.collectedParams || {}
    );

    const collectedParams = {
      ...(conversation.collectedParams || {}),
      ...extracted.entities
    };

    await this.log(conversation.id, 'info', 'entities_extracted', {
      extracted: extracted.entities,
      total: collectedParams
    });

    // Identify missing params
    const missingParams = aiEngine.identifyMissingParams(action, collectedParams);

    await unifiedStorage.updateAiConversation(conversation.id, {
      collectedParams,
      missingParams
    });

    if (missingParams.length === 0) {
      // All params collected, go to confirmation
      return await this.requestConfirmation(conversation, agent, action, collectedParams);
    }

    // Ask for first missing param
    const question = await aiEngine.generateCollectionQuestion(
      agent,
      action,
      missingParams[0]
    );

    return {
      conversationId: conversation.id,
      agentResponse: question,
      status: 'collecting_params',
      nextStep: 'collecting_params'
    };
  }

  /**
   * Handle parameter collection
   */
  private async handleParamCollection(
    conversation: AiConversation,
    agent: AiAgent,
    userMessage: string
  ): Promise<ProcessMessageResult> {
    
    if (!conversation.intendedAction) {
      return await this.handleGreeting(conversation, agent, userMessage);
    }

    const action = await unifiedStorage.getAiAction(conversation.intendedAction);
    if (!action) {
      return {
        conversationId: conversation.id,
        agentResponse: 'Erro ao processar ação.',
        status: 'error',
        nextStep: 'greeting'
      };
    }

    // Extract entities from current message
    const extracted = await aiEngine.extractEntities(
      userMessage,
      action,
      agent,
      conversation.collectedParams || {}
    );

    const collectedParams = {
      ...(conversation.collectedParams || {}),
      ...extracted.entities
    };

    await this.log(conversation.id, 'info', 'params_updated', { collectedParams });

    // Update collected params
    const missingParams = aiEngine.identifyMissingParams(action, collectedParams);

    await unifiedStorage.updateAiConversation(conversation.id, {
      collectedParams,
      missingParams
    });

    if (missingParams.length === 0) {
      // All collected, request confirmation
      return await this.requestConfirmation(conversation, agent, action, collectedParams);
    }

    // Ask for next missing param
    const question = await aiEngine.generateCollectionQuestion(
      agent,
      action,
      missingParams[0]
    );

    return {
      conversationId: conversation.id,
      agentResponse: question,
      status: 'collecting_params',
      nextStep: 'collecting_params'
    };
  }

  /**
   * Request confirmation before executing action
   */
  private async requestConfirmation(
    conversation: AiConversation,
    agent: AiAgent,
    action: AiAction,
    collectedParams: Record<string, any>
  ): Promise<ProcessMessageResult> {
    
    await this.log(conversation.id, 'info', 'requesting_confirmation', { collectedParams });

    const confirmationMessage = await aiEngine.generateConfirmation(
      agent,
      action,
      collectedParams
    );

    return {
      conversationId: conversation.id,
      agentResponse: confirmationMessage,
      status: 'waiting_confirmation',
      nextStep: 'confirming_action'
    };
  }

  /**
   * Handle action confirmation
   */
  private async handleActionConfirmation(
    conversation: AiConversation,
    agent: AiAgent,
    userMessage: string
  ): Promise<ProcessMessageResult> {
    
    const confirmed = await aiEngine.parseConfirmation(
      userMessage,
      agent.personality.language
    );

    if (confirmed === null) {
      // Ambiguous response
      return {
        conversationId: conversation.id,
        agentResponse: 'Desculpe, não entendi. Por favor, responda "Sim" para confirmar ou "Não" para cancelar.',
        status: 'waiting_confirmation',
        nextStep: 'confirming_action'
      };
    }

    if (!confirmed) {
      // User cancelled
      await this.log(conversation.id, 'info', 'action_cancelled_by_user', {});
      
      await unifiedStorage.updateAiConversation(conversation.id, {
        status: 'completed',
        currentStep: 'cancelled'
      });

      return {
        conversationId: conversation.id,
        agentResponse: 'Ação cancelada. Posso ajudar com mais alguma coisa?',
        status: 'cancelled',
        nextStep: 'greeting'
      };
    }

    // Execute action
    await this.log(conversation.id, 'info', 'action_confirmed', {});
    
    // TODO: Execute action via ActionExecutor
    // For now, just log and return success
    
    await unifiedStorage.updateAiConversation(conversation.id, {
      status: 'completed',
      currentStep: 'completed'
    });

    return {
      conversationId: conversation.id,
      agentResponse: 'Ação executada com sucesso!',
      status: 'completed',
      nextStep: 'completed'
    };
  }

  /**
   * Handle generic message
   */
  private async handleGenericMessage(
    conversation: AiConversation,
    agent: AiAgent,
    userMessage: string
  ): Promise<ProcessMessageResult> {
    
    const conversationHistory = await unifiedStorage.getAiConversationMessages(conversation.id);
    
    const response = await aiEngine.generateResponse(
      agent,
      conversationHistory.map(m => ({ role: m.role, content: m.content })),
      conversation.currentStep || 'general',
      undefined
    );

    return {
      conversationId: conversation.id,
      agentResponse: response,
      status: 'active',
      nextStep: conversation.currentStep || 'greeting'
    };
  }

  /**
   * Escalate conversation to human
   */
  private async escalateToHuman(
    conversation: AiConversation,
    agent: AiAgent,
    userMessage: string,
    sentiment: any
  ): Promise<ProcessMessageResult> {
    
    await this.log(conversation.id, 'warning', 'escalating_to_human', { 
      reason: sentiment 
    });

    await unifiedStorage.updateAiConversation(conversation.id, {
      status: 'escalated',
      currentStep: 'escalated'
    });

    const response = `Entendo sua urgência. Vou transferir seu atendimento para um especialista humano que poderá ajudá-lo melhor.`;

    return {
      conversationId: conversation.id,
      agentResponse: response,
      status: 'escalated',
      nextStep: 'escalated'
    };
  }

  /**
   * Save message to conversation
   */
  private async saveMessage(
    conversationId: string,
    role: 'user' | 'agent' | 'system',
    content: string
  ): Promise<void> {
    await unifiedStorage.createAiConversationMessage({
      conversationId,
      role,
      content,
      metadata: {}
    });
  }

  /**
   * Log conversation event
   */
  private async log(
    conversationId: string,
    level: 'debug' | 'info' | 'warning' | 'error' | 'critical',
    category: string,
    details: any
  ): Promise<void> {
    await unifiedStorage.createAiConversationLog({
      conversationId,
      level,
      category,
      message: `[${category}] ${JSON.stringify(details)}`,
      details
    });
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();

// ========================================
// AI ENGINE SERVICE
// ========================================
// Core AI processing service for the conversational agent
// Uses OpenAI for intent detection, entity extraction, and sentiment analysis
// CONTEXT-AWARE: Uses SaaS Admin global AI keys for all AI operations

import OpenAI from 'openai';
import type { AiAgent, AiAction } from '@shared/schema';
import { SaaSAdminAIConfigService } from './saas-admin-ai-config';

// ========================================
// TYPES
// ========================================

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  suggestedAction?: string;
  reasoning: string;
}

export interface EntityExtractionResult {
  entities: {
    [key: string]: any;
  };
  confidence: number;
}

export interface SentimentAnalysisResult {
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' | 'urgent';
  confidence: number;
  urgencyDetected: boolean;
  escalationKeywords: string[];
}

export interface ConversationContext {
  conversationHistory: Array<{
    role: 'user' | 'agent' | 'system';
    content: string;
  }>;
  collectedParams?: Record<string, any>;
  currentStep?: string;
}

// ========================================
// AI ENGINE CLASS
// ========================================

export class AIEngine {
  
  /**
   * Get OpenAI client using SaaS Admin global AI keys
   * AI Engine uses global keys for all operations (not tenant-specific)
   */
  private async getOpenAIClient(): Promise<OpenAI> {
    console.log('🔑 [AI-ENGINE] Getting OpenAI client from SaaS Admin integrations');
    
    const saasAdminService = new SaaSAdminAIConfigService();
    const preferredConfig = await saasAdminService.getPreferredAIProvider();
    
    if (!preferredConfig) {
      console.error('❌ [AI-ENGINE] No AI provider configured in SaaS Admin integrations');
      throw new Error('AI provider not configured. Please configure AI keys in SaaS Admin → Integrations');
    }
    
    console.log(`✅ [AI-ENGINE] Using AI provider: ${preferredConfig.provider} (from SaaS Admin)`);
    
    return new OpenAI({
      apiKey: preferredConfig.apiKey,
      baseURL: preferredConfig.baseURL
    });
  }
  
  /**
   * Detect user intent from message
   */
  async detectIntent(
    message: string,
    agent: AiAgent,
    availableActions: AiAction[],
    context?: ConversationContext
  ): Promise<IntentDetectionResult> {
    try {
      const actionList = availableActions
        .map(a => `- ${a.actionType}: ${a.description}`)
        .join('\n');

      const systemPrompt = `You are an intent classification AI for a conversational agent.
Agent personality: ${agent.personality.tone}
Available actions:
${actionList}

Analyze the user's message and identify their intent. Match it to one of the available actions.
Return your analysis in JSON format:
{
  "intent": "brief description of what user wants",
  "suggestedAction": "action_type from the list above",
  "confidence": 0-1 score,
  "reasoning": "brief explanation"
}`;

      const contextStr = context ? `\nConversation context: ${JSON.stringify(context, null, 2)}` : '';

      const openai = await this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: agent.aiConfig.model,
        temperature: agent.aiConfig.temperature,
        max_tokens: agent.aiConfig.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User message: "${message}"${contextStr}` }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        intent: result.intent || 'unknown',
        confidence: result.confidence || 0,
        suggestedAction: result.suggestedAction,
        reasoning: result.reasoning || 'No reasoning provided'
      };
    } catch (error) {
      console.error('Intent detection error:', error);
      return {
        intent: 'unknown',
        confidence: 0,
        reasoning: 'Failed to detect intent'
      };
    }
  }

  /**
   * Extract entities and parameters from message
   */
  async extractEntities(
    message: string,
    action: AiAction,
    agent: AiAgent,
    collectedParams: Record<string, any> = {}
  ): Promise<EntityExtractionResult> {
    try {
      const requiredParams = action.requiredParams.map(p => ({
        name: p.name,
        type: p.type,
        description: p.description,
        alreadyCollected: !!collectedParams[p.name]
      }));

      const systemPrompt = `You are a data extraction AI for a conversational agent.
Extract the following parameters from the user's message:
${JSON.stringify(requiredParams, null, 2)}

Return extracted data in JSON format:
{
  "entities": {
    "paramName": "extracted value",
    ...
  },
  "confidence": 0-1 score
}

Only include parameters you can confidently extract. Leave out uncertain extractions.`;

      const openai = await this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: agent.aiConfig.model,
        temperature: 0.3, // Lower temperature for more consistent extraction
        max_tokens: agent.aiConfig.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User message: "${message}"\nAlready collected: ${JSON.stringify(collectedParams)}` }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        entities: result.entities || {},
        confidence: result.confidence || 0
      };
    } catch (error) {
      console.error('Entity extraction error:', error);
      return {
        entities: {},
        confidence: 0
      };
    }
  }

  /**
   * Analyze sentiment of message
   */
  async analyzeSentiment(
    message: string,
    agent: AiAgent,
    escalationKeywords: string[] = []
  ): Promise<SentimentAnalysisResult> {
    try {
      const systemPrompt = `You are a sentiment analysis AI.
Analyze the user's message for:
1. Overall sentiment (very_positive, positive, neutral, negative, very_negative)
2. Urgency level (does it require immediate attention?)
3. Escalation keywords detected from this list: ${escalationKeywords.join(', ')}

Return analysis in JSON format:
{
  "sentiment": "sentiment_value",
  "confidence": 0-1 score,
  "urgencyDetected": true/false,
  "escalationKeywords": ["detected", "keywords"]
}`;

      const openai = await this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: agent.aiConfig.model,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Message: "${message}"` }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        sentiment: result.sentiment || 'neutral',
        confidence: result.confidence || 0,
        urgencyDetected: result.urgencyDetected || false,
        escalationKeywords: result.escalationKeywords || []
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: 'neutral',
        confidence: 0,
        urgencyDetected: false,
        escalationKeywords: []
      };
    }
  }

  /**
   * Generate agent response based on context
   */
  async generateResponse(
    agent: AiAgent,
    conversationHistory: Array<{ role: string; content: string }>,
    currentStep: string,
    additionalContext?: string
  ): Promise<string> {
    try {
      const systemPrompt = `${agent.aiConfig.systemPrompt}

Agent personality: ${JSON.stringify(agent.personality, null, 2)}
Current conversation step: ${currentStep}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Generate an appropriate response following the agent's personality and the conversation context.
Be helpful, clear, and match the configured tone.`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'agent' ? 'assistant' as const : msg.role as 'user' | 'system',
          content: msg.content
        }))
      ];

      const openai = await this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: agent.aiConfig.model,
        temperature: agent.aiConfig.temperature,
        max_tokens: agent.aiConfig.maxTokens,
        messages
      });

      return response.choices[0].message.content || agent.personality.fallbackMessage;
    } catch (error) {
      console.error('Response generation error:', error);
      return agent.personality.fallbackMessage;
    }
  }

  /**
   * Generate confirmation message for action
   */
  async generateConfirmation(
    agent: AiAgent,
    action: AiAction,
    collectedParams: Record<string, any>
  ): Promise<string> {
    try {
      // Use action's confirmation template if available
      if (action.confirmationTemplate) {
        let message = action.confirmationTemplate;
        // Simple template variable replacement
        Object.entries(collectedParams).forEach(([key, value]) => {
          message = message.replace(new RegExp(`{${key}}`, 'g'), String(value));
        });
        return message;
      }

      // Generate confirmation using AI
      const systemPrompt = `Generate a confirmation message for the user.
Agent personality: ${agent.personality.tone}
Confirmation style: ${agent.personality.confirmationStyle}

Action: ${action.name}
Collected data: ${JSON.stringify(collectedParams, null, 2)}

Create a clear confirmation message that:
1. Summarizes what will be done
2. Shows the collected data
3. Asks for confirmation
4. Matches the agent's personality`;

      const openai = await this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: agent.aiConfig.model,
        temperature: 0.7,
        max_tokens: 500,
        messages: [{ role: 'system', content: systemPrompt }]
      });

      return response.choices[0].message.content || 
        `I will execute: ${action.name}. Confirm? (Yes/No)`;
    } catch (error) {
      console.error('Confirmation generation error:', error);
      return `Proceed with ${action.name}? (Yes/No)`;
    }
  }

  /**
   * Identify missing required parameters
   */
  identifyMissingParams(
    action: AiAction,
    collectedParams: Record<string, any>
  ): string[] {
    return action.requiredParams
      .filter(param => !collectedParams[param.name])
      .map(param => param.name);
  }

  /**
   * Generate question to collect missing parameter
   */
  async generateCollectionQuestion(
    agent: AiAgent,
    action: AiAction,
    paramName: string
  ): Promise<string> {
    const param = action.requiredParams.find(p => p.name === paramName);
    
    if (!param) {
      return `Please provide ${paramName}.`;
    }

    try {
      const systemPrompt = `Generate a natural question to collect information from the user.
Agent personality: ${agent.personality.tone}
Language: ${agent.personality.language}

Parameter to collect:
- Name: ${param.name}
- Type: ${param.type}
- Description: ${param.description}

Create a friendly, clear question that asks for this information.`;

      const openai = await this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: agent.aiConfig.model,
        temperature: 0.7,
        max_tokens: 200,
        messages: [{ role: 'system', content: systemPrompt }]
      });

      return response.choices[0].message.content || param.description;
    } catch (error) {
      console.error('Question generation error:', error);
      return param.description;
    }
  }

  /**
   * Parse user confirmation (yes/no)
   */
  async parseConfirmation(message: string, language: string = 'pt-BR'): Promise<boolean | null> {
    const messageLower = message.toLowerCase().trim();
    
    // Simple keyword matching
    const yesKeywords: Record<string, string[]> = {
      'pt-BR': ['sim', 'confirmo', 'ok', 'confirmar', 'pode', 'yes'],
      'en': ['yes', 'confirm', 'ok', 'sure', 'proceed'],
      'es': ['sí', 'si', 'confirmo', 'ok', 'vale']
    };

    const noKeywords: Record<string, string[]> = {
      'pt-BR': ['não', 'nao', 'cancelar', 'não confirmo', 'no'],
      'en': ['no', 'cancel', 'stop', 'don\'t'],
      'es': ['no', 'cancelar', 'detener']
    };

    const langYes = yesKeywords[language] || yesKeywords['en'];
    const langNo = noKeywords[language] || noKeywords['en'];

    if (langYes.some(keyword => messageLower.includes(keyword))) {
      return true;
    }
    
    if (langNo.some(keyword => messageLower.includes(keyword))) {
      return false;
    }

    // Ambiguous response
    return null;
  }
}

// Export singleton instance
export const aiEngine = new AIEngine();

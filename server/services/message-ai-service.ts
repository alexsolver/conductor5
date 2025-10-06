// ========================================
// MESSAGE AI SERVICE
// ========================================
// AI-powered message assistance features

import { TenantAIConfigService } from './tenant-ai-config';
import type { IStorage } from '../storage-simple';

export interface SpellCheckResult {
  correctedText: string;
  suggestions: Array<{
    original: string;
    suggestion: string;
    reason: string;
  }>;
}

export interface RewriteResult {
  rewrittenText: string;
  tone: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  targetLanguage: string;
}

export interface SummaryResult {
  summary: string;
  type: 'short' | 'expanded';
}

export interface QuickReplyResult {
  suggestions: string[];
}

export class MessageAIService {
  private aiConfigService: TenantAIConfigService;

  constructor(storage: IStorage) {
    this.aiConfigService = new TenantAIConfigService(storage);
  }

  /**
   * Spell check and grammar correction
   */
  async spellCheck(tenantId: string, text: string): Promise<SpellCheckResult> {
    const providerConfig = await this.aiConfigService.getPreferredAIProvider(tenantId);
    
    if (!providerConfig) {
      throw new Error('No AI provider configured');
    }

    const prompt = `Analyze the following text for spelling and grammar errors. Return a JSON object with:
1. "correctedText": The fully corrected text
2. "suggestions": Array of objects with "original", "suggestion", and "reason" fields

Text to analyze:
"${text}"

Return ONLY the JSON object, no additional text.`;

    const result = await this.callAI(providerConfig, prompt);
    
    try {
      return JSON.parse(result);
    } catch {
      return {
        correctedText: text,
        suggestions: []
      };
    }
  }

  /**
   * Rewrite text with specific tone
   */
  async rewriteWithTone(tenantId: string, text: string, tone: 'professional' | 'friendly' | 'empathetic' | 'technical' | 'concise'): Promise<RewriteResult> {
    const providerConfig = await this.aiConfigService.getPreferredAIProvider(tenantId);
    
    if (!providerConfig) {
      throw new Error('No AI provider configured');
    }

    const toneInstructions = {
      professional: 'formal and professional language, suitable for business communications',
      friendly: 'warm, casual and approachable language',
      empathetic: 'compassionate and understanding language that shows care',
      technical: 'precise technical language with industry terminology',
      concise: 'brief and to-the-point language, removing unnecessary words'
    };

    const prompt = `Rewrite the following text using ${toneInstructions[tone]}. 
Maintain the core message and intent, but adjust the tone and style.
Return ONLY the rewritten text, no explanations or additional commentary.

Original text:
"${text}"`;

    const rewrittenText = await this.callAI(providerConfig, prompt);
    
    return {
      rewrittenText: rewrittenText.trim().replace(/^["']|["']$/g, ''),
      tone
    };
  }

  /**
   * Translate text to target language
   */
  async translate(tenantId: string, text: string, targetLanguage: string): Promise<TranslationResult> {
    const providerConfig = await this.aiConfigService.getPreferredAIProvider(tenantId);
    
    if (!providerConfig) {
      throw new Error('No AI provider configured');
    }

    const prompt = `Translate the following text to ${targetLanguage}. 
Maintain technical terms and context appropriately.
Return a JSON object with:
1. "translatedText": The translated text
2. "detectedLanguage": The detected source language (ISO code)
3. "targetLanguage": "${targetLanguage}"

Text to translate:
"${text}"

Return ONLY the JSON object.`;

    const result = await this.callAI(providerConfig, prompt);
    
    try {
      return JSON.parse(result);
    } catch {
      return {
        translatedText: text,
        detectedLanguage: 'unknown',
        targetLanguage
      };
    }
  }

  /**
   * Create summary or expand text
   */
  async summarize(tenantId: string, text: string, type: 'short' | 'expanded'): Promise<SummaryResult> {
    const providerConfig = await this.aiConfigService.getPreferredAIProvider(tenantId);
    
    if (!providerConfig) {
      throw new Error('No AI provider configured');
    }

    const instructions = type === 'short' 
      ? 'Create a concise summary of the following text, capturing only the key points'
      : 'Expand the following text with more details and context while maintaining the core message';

    const prompt = `${instructions}.
Return ONLY the ${type === 'short' ? 'summary' : 'expanded version'}, no additional commentary.

Text:
"${text}"`;

    const summary = await this.callAI(providerConfig, prompt);
    
    return {
      summary: summary.trim().replace(/^["']|["']$/g, ''),
      type
    };
  }

  /**
   * Generate quick reply suggestions
   */
  async generateQuickReplies(tenantId: string, conversationContext: string): Promise<QuickReplyResult> {
    const providerConfig = await this.aiConfigService.getPreferredAIProvider(tenantId);
    
    if (!providerConfig) {
      throw new Error('No AI provider configured');
    }

    const prompt = `Based on the following conversation context, generate 3 appropriate quick reply suggestions.
Return a JSON object with a "suggestions" array containing the 3 reply options as strings.

Conversation context:
"${conversationContext}"

Return ONLY the JSON object with format: {"suggestions": ["reply1", "reply2", "reply3"]}`;

    const result = await this.callAI(providerConfig, prompt);
    
    try {
      return JSON.parse(result);
    } catch {
      return {
        suggestions: []
      };
    }
  }

  /**
   * Call AI provider
   */
  private async callAI(providerConfig: any, prompt: string): Promise<string> {
    const { provider, apiKey, model } = providerConfig;

    switch (provider) {
      case 'openai':
        return this.callOpenAI(apiKey, model, prompt);
      case 'deepseek':
        return this.callDeepSeek(apiKey, model, prompt);
      case 'googleai':
        return this.callGoogleAI(apiKey, model, prompt);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async callOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant for text processing and message assistance.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callDeepSeek(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant for text processing and message assistance.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGoogleAI(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful assistant for text processing and message assistance.\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

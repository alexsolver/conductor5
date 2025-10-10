// ========================================
// MESSAGE AI SERVICE
// ========================================
// AI-powered message assistance features

import { getSaaSAdminAIConfigService } from './saas-admin-ai-config';
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
  length: 'short' | 'long';
}

export interface QuickReplyResult {
  suggestions: string[];
}

export class MessageAIService {
  constructor(storage: IStorage) {
    // No longer storing aiConfigService - will use SaaS Admin service directly
  }

  /**
   * Spell check and grammar correction
   */
  async spellCheck(tenantId: string, text: string): Promise<SpellCheckResult> {
    console.log('🔍 [SPELL-CHECK] Input text:', text);
    console.log('🔍 [SPELL-CHECK] Using SAAS ADMIN AI config service');
    
    // Use SaaS Admin AI configuration (global)
    const aiConfigService = getSaaSAdminAIConfigService();
    const providerConfig = await aiConfigService.getPreferredAIProvider();
    
    console.log('🔍 [SPELL-CHECK] Provider config:', providerConfig);
    
    if (!providerConfig) {
      throw new Error('No AI provider configured in SaaS Admin');
    }

    const prompt = `You are a professional spelling and grammar correction assistant. Your task is to fix ALL spelling and grammar mistakes in the text below.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. ALWAYS correct obvious spelling errors (e.g., "Caza" → "Casa", "marela" → "amarela", "progreso" if in Portuguese → "progresso")
2. Fix ALL grammar mistakes
3. Preserve the original language (Portuguese, Spanish, English, etc.)
4. If the text is very short, still correct any errors found
5. NEVER return text unchanged if there are errors

EXAMPLES OF WHAT TO CORRECT:
- "Caza marela" → "Casa amarela" (Portuguese spelling errors)
- "Caza progreso" → "Casa progreso" (Spanish - Caza is wrong, should be Casa)
- "teh cat" → "the cat" (English spelling error)

Text to analyze and correct:
"${text}"

YOU MUST return a JSON object with this structure:
{
  "correctedText": "the CORRECTED text (fix all errors!)",
  "suggestions": [
    {
      "original": "incorrect word",
      "suggestion": "correct word", 
      "reason": "spelling error/grammar issue"
    }
  ]
}

IMPORTANT: If you find ANY errors, the "correctedText" MUST be different from the original text.
Return ONLY the JSON, no other text.`;

    const result = await this.callAI(providerConfig, prompt);
    console.log('🤖 [SPELL-CHECK] AI raw response:', result);
    
    try {
      const parsed = JSON.parse(result);
      console.log('✅ [SPELL-CHECK] Parsed result:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ [SPELL-CHECK] JSON parse failed:', error);
      console.log('🔄 [SPELL-CHECK] Returning original text');
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
    console.log('🔍 [REWRITE] Input:', { textLength: text?.length || 0, text: text?.substring(0, 100), tone });
    
    // Use SaaS Admin AI configuration (global)
    const aiConfigService = getSaaSAdminAIConfigService();
    const providerConfig = await aiConfigService.getPreferredAIProvider();
    
    if (!providerConfig) {
      throw new Error('No AI provider configured in SaaS Admin');
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
    console.log('🤖 [REWRITE] AI raw response:', rewrittenText?.substring(0, 100));
    
    return {
      rewrittenText: rewrittenText.trim().replace(/^["']|["']$/g, ''),
      tone
    };
  }

  /**
   * Translate text to target language
   */
  async translate(tenantId: string, text: string, targetLanguage: string): Promise<TranslationResult> {
    // Use SaaS Admin AI configuration (global)
    const aiConfigService = getSaaSAdminAIConfigService();
    const providerConfig = await aiConfigService.getPreferredAIProvider();
    
    if (!providerConfig) {
      throw new Error('No AI provider configured in SaaS Admin');
    }

    const prompt = `You are a professional translator. Translate the following text from its current language to ${targetLanguage}.

IMPORTANT: The translated text MUST be in ${targetLanguage}. Do NOT return the original text.

Return ONLY a JSON object in this exact format:
{
  "translatedText": "the text translated to ${targetLanguage}",
  "detectedLanguage": "ISO code of source language",
  "targetLanguage": "${targetLanguage}"
}

Text to translate:
"${text}"`;

    const result = await this.callAI(providerConfig, prompt);
    console.log('🌍 [TRANSLATE] AI raw response:', result?.substring(0, 200));
    
    try {
      const parsed = JSON.parse(result);
      console.log('✅ [TRANSLATE] Parsed result:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ [TRANSLATE] JSON parse failed:', error);
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
  async summarize(tenantId: string, text: string, length: 'short' | 'long'): Promise<SummaryResult> {
    // Use SaaS Admin AI configuration (global)
    const aiConfigService = getSaaSAdminAIConfigService();
    const providerConfig = await aiConfigService.getPreferredAIProvider();
    
    if (!providerConfig) {
      throw new Error('No AI provider configured in SaaS Admin');
    }

    const instructions = length === 'short' 
      ? 'Create a concise summary of the following text, capturing only the key points'
      : 'Expand the following text with more details and context while maintaining the core message';

    const prompt = `${instructions}.
Return ONLY the ${length === 'short' ? 'summary' : 'expanded version'}, no additional commentary.

Text:
"${text}"`;

    const summary = await this.callAI(providerConfig, prompt);
    
    return {
      summary: summary.trim().replace(/^["']|["']$/g, ''),
      length
    };
  }

  /**
   * Generate quick reply suggestions
   */
  async generateQuickReplies(tenantId: string, text: string): Promise<QuickReplyResult> {
    // Use SaaS Admin AI configuration (global)
    const aiConfigService = getSaaSAdminAIConfigService();
    const providerConfig = await aiConfigService.getPreferredAIProvider();
    
    if (!providerConfig) {
      throw new Error('No AI provider configured in SaaS Admin');
    }

    const prompt = `Based on the following conversation context, generate 3 appropriate quick reply suggestions.
Return a JSON object with a "suggestions" array containing the 3 reply options as strings.

Conversation context:
"${text}"

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
    console.log('🔑 [OPENAI-CALL] Making request with:', {
      apiKeyLength: apiKey?.length,
      apiKeyPreview: apiKey?.substring(0, 20),
      model: model
    });
    
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
      console.error('❌ [OPENAI-CALL] Error response:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [OPENAI-CALL] Success');
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

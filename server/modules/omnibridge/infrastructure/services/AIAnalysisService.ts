import OpenAI from "openai";
import { IAIAnalysisPort, MessageData, MessageAnalysis } from '../../domain/ports/IAIAnalysisPort';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

export interface AIPromptConfig {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  enabled: boolean;
  category: 'analysis' | 'response' | 'classification';
  createdAt: Date;
  updatedAt: Date;
}

export class AIAnalysisService implements IAIAnalysisPort {
  private openai: OpenAI;
  private defaultPrompts: Map<string, AIPromptConfig> = new Map();

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    this.initializeDefaultPrompts();
  }

  private initializeDefaultPrompts(): void {
    // Prompt padrão para análise de mensagens
    const analysisPrompt: AIPromptConfig = {
      id: 'default-analysis',
      tenantId: 'system',
      name: 'Análise Padrão de Mensagem',
      description: 'Analisa mensagens recebidas para classificar intenção, sentimento e urgência',
      systemPrompt: `Você é um especialista em análise de atendimento ao cliente. Analise a mensagem fornecida e retorne uma análise estruturada em JSON.

Considere:
- A intenção do usuário (reclamação, pergunta, solicitação, emergência, elogio, outros)
- O sentimento (positivo, negativo, neutro)
- O nível de urgência (baixo, médio, alto, crítico)
- A categoria do assunto
- Palavras-chave importantes
- Se deve criar um ticket automaticamente
- Ações sugeridas para o atendimento
- Um resumo conciso da mensagem

Responda SEMPRE em formato JSON válido.`,
      userPromptTemplate: `Analise esta mensagem de atendimento:

CANAL: {channel}
REMETENTE: {sender}
ASSUNTO: {subject}
CONTEÚDO: {content}
DATA: {timestamp}

Forneça a análise no seguinte formato JSON:
{
  "intent": "complaint|question|request|emergency|compliment|other",
  "sentiment": "positive|negative|neutral", 
  "urgency": "low|medium|high|critical",
  "category": "categoria do assunto",
  "keywords": ["palavra1", "palavra2", "palavra3"],
  "suggestedActions": ["ação1", "ação2"],
  "confidence": 0.85,
  "summary": "resumo conciso da mensagem",
  "shouldCreateTicket": true|false,
  "suggestedResponse": "resposta sugerida (opcional)"
}`,
      enabled: true,
      category: 'analysis',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.defaultPrompts.set('analysis', analysisPrompt);

    // Prompt para geração de respostas automáticas
    const responsePrompt: AIPromptConfig = {
      id: 'default-response',
      tenantId: 'system', 
      name: 'Geração de Resposta Automática',
      description: 'Gera respostas contextuais para mensagens de clientes',
      systemPrompt: `Você é um assistente de atendimento ao cliente profissional e empático. 

Gere respostas que sejam:
- Cordiais e profissionais
- Empáticas ao contexto do cliente
- Claras e objetivas
- Adequadas ao canal de comunicação
- Em português brasileiro

Evite:
- Promessas que não podem ser cumpridas
- Linguagem muito técnica
- Respostas genéricas demais`,
      userPromptTemplate: `Com base na análise da mensagem, gere uma resposta adequada:

ANÁLISE: {analysis}
MENSAGEM ORIGINAL: {originalMessage}
CANAL: {channel}
CONTEXTO ADICIONAL: {context}

Gere uma resposta profissional e empática em português.`,
      enabled: true,
      category: 'response',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.defaultPrompts.set('response', responsePrompt);
  }

  async analyzeMessage(messageData: MessageData, customPrompt?: AIPromptConfig): Promise<MessageAnalysis> {
    try {
      const prompt = customPrompt || this.defaultPrompts.get('analysis')!;
      
      // Substituir variáveis no template do prompt
      const userPrompt = prompt.userPromptTemplate
        .replace('{channel}', messageData.channel || 'Desconhecido')
        .replace('{sender}', messageData.sender || 'Anônimo')
        .replace('{subject}', messageData.subject || 'Sem assunto')
        .replace('{content}', messageData.content)
        .replace('{timestamp}', messageData.timestamp || new Date().toISOString());

      console.log(`🤖 [AI-ANALYSIS] Analyzing message from ${messageData.sender} via ${messageData.channel}`);

      const response = await this.openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: prompt.systemPrompt
          },
          {
            role: "user", 
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validar e normalizar a resposta
      const normalizedAnalysis: MessageAnalysis = {
        intent: analysis.intent || 'other',
        sentiment: analysis.sentiment || 'neutral',
        urgency: analysis.urgency || 'medium',
        category: analysis.category || 'Geral',
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
        summary: analysis.summary || 'Mensagem recebida',
        suggestedResponse: analysis.suggestedResponse || undefined,
        requiresHumanAttention: Boolean(analysis.shouldCreateTicket || analysis.urgency === 'critical' || analysis.intent === 'emergency'),
        language: analysis.language || 'pt-BR'
      };

      console.log(`✅ [AI-ANALYSIS] Analysis completed - Intent: ${normalizedAnalysis.intent}, Urgency: ${normalizedAnalysis.urgency}`);

      return normalizedAnalysis;
    } catch (error) {
      console.error('❌ [AI-ANALYSIS] Error analyzing message:', error);
      
      // Retorna análise básica em caso de erro
      return {
        intent: 'other',
        sentiment: 'neutral',
        urgency: 'medium',
        category: 'Geral',
        keywords: [],
        confidence: 0,
        summary: 'Erro na análise automática',
        suggestedResponse: undefined,
        requiresHumanAttention: true,
        language: 'pt-BR'
      };
    }
  }

  async generateResponse(analysisData: MessageAnalysis, originalMessage: string, context?: any, customPrompt?: AIPromptConfig): Promise<string> {
    try {
      const prompt = customPrompt || this.defaultPrompts.get('response')!;
      
      // Enhanced system prompt based on context
      let enhancedSystemPrompt = prompt.systemPrompt;
      
      if (context?.customInstructions) {
        enhancedSystemPrompt += `\n\nINSTRUÇÕES ESPECÍFICAS: ${context.customInstructions}`;
      }

      if (context?.tone) {
        const toneInstructions = {
          professional: 'Mantenha um tom profissional e respeitoso.',
          friendly: 'Use um tom amigável e caloroso, mas ainda profissional.',
          technical: 'Use linguagem técnica precisa, mas acessível.',
          sales: 'Foque em benefícios e valor, com call-to-action quando apropriado.',
          empathetic: 'Demonstre empatia genuína e compreensão.',
          formal: 'Use linguagem formal e protocolar.'
        };
        enhancedSystemPrompt += `\n\nTOM: ${toneInstructions[context.tone as keyof typeof toneInstructions] || toneInstructions.professional}`;
      }

      if (context?.language) {
        const languageInstructions = {
          'pt-BR': 'Responda em português brasileiro.',
          'en-US': 'Respond in American English.',
          'es-ES': 'Responde en español.',
          'fr-FR': 'Répondez en français.'
        };
        enhancedSystemPrompt += `\n\nIDIOMA: ${languageInstructions[context.language as keyof typeof languageInstructions] || languageInstructions['pt-BR']}`;
      }

      const userPrompt = prompt.userPromptTemplate
        .replace('{analysis}', JSON.stringify(analysisData, null, 2))
        .replace('{originalMessage}', originalMessage)
        .replace('{channel}', context?.channel || 'Desconhecido')
        .replace('{context}', context ? JSON.stringify(context, null, 2) : 'Nenhum contexto adicional');

      console.log(`🤖 [AI-RESPONSE] Generating response for ${analysisData.intent} message with tone: ${context?.tone || 'default'}`);

      const response = await this.openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: enhancedSystemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: context?.maxResponseLength ? Math.min(context.maxResponseLength * 2, 2000) : 1000,
        temperature: context?.tone === 'technical' ? 0.3 : context?.tone === 'sales' ? 0.7 : 0.5
      });

      let generatedResponse = response.choices[0].message.content || 'Obrigado pelo seu contato. Nossa equipe analisará sua mensagem.';

      // Apply length limit if specified
      if (context?.maxResponseLength && generatedResponse.length > context.maxResponseLength) {
        generatedResponse = generatedResponse.substring(0, context.maxResponseLength - 3) + '...';
      }

      // Include original message if requested
      if (context?.includeOriginalMessage) {
        generatedResponse = `Referente à sua mensagem: "${originalMessage}"\n\n${generatedResponse}`;
      }

      console.log(`✅ [AI-RESPONSE] Response generated successfully (${generatedResponse.length} chars)`);

      return generatedResponse;
    } catch (error) {
      console.error('❌ [AI-RESPONSE] Error generating response:', error);
      return 'Obrigado pelo seu contato. Nossa equipe analisará sua mensagem e retornará o mais breve possível.';
    }
  }

  async classifyIntent(text: string): Promise<{intent: string, confidence: number}> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "Classifique a intenção desta mensagem em uma das categorias: complaint, question, request, emergency, compliment, other. Responda em JSON com intent e confidence."
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"intent": "other", "confidence": 0.5}');
      return {
        intent: result.intent || 'other',
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5
      };
    } catch (error) {
      console.error('❌ [AI-CLASSIFICATION] Error classifying intent:', error);
      return { intent: 'other', confidence: 0 };
    }
  }

  getDefaultPrompt(type: 'analysis' | 'response'): AIPromptConfig | undefined {
    return this.defaultPrompts.get(type);
  }

  setCustomPrompt(tenantId: string, promptConfig: AIPromptConfig): void {
    const key = `${tenantId}-${promptConfig.category}`;
    this.defaultPrompts.set(key, promptConfig);
    console.log(`✅ [AI-PROMPTS] Custom prompt configured for tenant ${tenantId}: ${promptConfig.name}`);
  }

  getCustomPrompt(tenantId: string, category: string): AIPromptConfig | undefined {
    return this.defaultPrompts.get(`${tenantId}-${category}`);
  }
}
import OpenAI from 'openai';
import { getTenantAIConfigService } from '../../../../services/tenant-ai-config';
import { storageSimple } from '../../../../storage-simple';

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 a +1
  emotion?: 'happy' | 'satisfied' | 'neutral' | 'frustrated' | 'angry' | 'confused';
  confidence: number; // 0 a 1
  indicators?: string[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Serviço de detecção de sentimento usando IA
 * Analisa mensagens e retorna sentimento, emoção e urgência
 */
export class SentimentDetectionService {
  /**
   * Detecta sentimento em uma mensagem usando AI configurada por tenant
   */
  async detectSentiment(
    messageContent: string, 
    tenantId: string,
    context?: {
      subject?: string;
      previousMessages?: string[];
    }
  ): Promise<SentimentAnalysis> {
    try {
      // Buscar configuração de AI do tenant
      const aiConfigService = getTenantAIConfigService(storageSimple as any);
      const aiProvider = await aiConfigService.getPreferredAIProvider(tenantId);

      // Se não houver configuração de AI, usar detecção básica por palavras-chave
      if (!aiProvider) {
        console.warn(`⚠️ [SENTIMENT] No AI provider configured for tenant ${tenantId} - using fallback`);
        return this.fallbackSentimentDetection(messageContent);
      }

      console.log(`😊 [SENTIMENT] Using ${aiProvider.provider} for tenant ${tenantId} - Analyzing sentiment for message (${messageContent.length} chars)`);

      // Criar cliente OpenAI com configuração do tenant
      const openai = new OpenAI({
        apiKey: aiProvider.apiKey,
      });

      // Preparar contexto adicional
      const contextInfo = context?.subject ? `Assunto: ${context.subject}\n` : '';
      const historyInfo = context?.previousMessages?.length 
        ? `Mensagens anteriores:\n${context.previousMessages.join('\n')}\n\n` 
        : '';

      // Chamar OpenAI para análise de sentimento
      const response = await openai.chat.completions.create({
        model: aiProvider.model,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise de sentimento para atendimento ao cliente.
Analise a mensagem e retorne um JSON com:
- sentiment: 'positive', 'neutral' ou 'negative'
- score: número de -1 (muito negativo) a +1 (muito positivo)
- emotion: 'happy', 'satisfied', 'neutral', 'frustrated', 'angry' ou 'confused'
- confidence: 0 a 1 (confiança na análise)
- indicators: array de strings explicando indicadores encontrados
- urgency: 'low', 'medium', 'high' ou 'critical'

Considere:
- Palavras negativas, frustração, urgência
- Tom da mensagem (educado, agressivo, neutro)
- Contexto do atendimento ao cliente
- Indicadores de satisfação ou insatisfação`
          },
          {
            role: 'user',
            content: `${contextInfo}${historyInfo}Mensagem: ${messageContent}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      const analysis: SentimentAnalysis = {
        sentiment: result.sentiment || 'neutral',
        score: result.score !== undefined ? result.score : 0,
        emotion: result.emotion || 'neutral',
        confidence: result.confidence !== undefined ? result.confidence : 0.5,
        indicators: result.indicators || [],
        urgency: result.urgency || 'medium'
      };

      console.log(`✅ [SENTIMENT] Analysis complete: ${analysis.sentiment} (score: ${analysis.score}, emotion: ${analysis.emotion})`);
      
      return analysis;
    } catch (error) {
      console.error(`❌ [SENTIMENT] Error detecting sentiment:`, error);
      // Retornar análise neutra em caso de erro
      return this.fallbackSentimentDetection(messageContent);
    }
  }

  /**
   * Detecção de sentimento básica por palavras-chave (fallback)
   */
  private fallbackSentimentDetection(messageContent: string): SentimentAnalysis {
    const lowerContent = messageContent.toLowerCase();
    
    // Palavras positivas
    const positiveWords = [
      'obrigado', 'obrigada', 'agradeço', 'excelente', 'ótimo', 'perfeito', 
      'muito bom', 'parabéns', 'satisfeito', 'feliz', 'adorei', 'amei'
    ];
    
    // Palavras negativas
    const negativeWords = [
      'problema', 'erro', 'não funciona', 'ruim', 'péssimo', 'horrível',
      'frustrado', 'irritado', 'decepcionado', 'insatisfeito', 'demora',
      'lento', 'travando', 'bug', 'defeito', 'reclamação'
    ];
    
    // Palavras de urgência
    const urgentWords = [
      'urgente', 'emergência', 'crítico', 'imediato', 'agora', 'rápido',
      'parado', 'travado', 'down', 'fora do ar'
    ];

    let score = 0;
    const indicators: string[] = [];
    
    // Contar palavras positivas
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    if (positiveCount > 0) {
      score += positiveCount * 0.3;
      indicators.push(`${positiveCount} palavra(s) positiva(s) encontrada(s)`);
    }
    
    // Contar palavras negativas
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    if (negativeCount > 0) {
      score -= negativeCount * 0.3;
      indicators.push(`${negativeCount} palavra(s) negativa(s) encontrada(s)`);
    }
    
    // Verificar urgência
    const urgentCount = urgentWords.filter(word => lowerContent.includes(word)).length;
    const urgency: SentimentAnalysis['urgency'] = 
      urgentCount >= 2 ? 'critical' : 
      urgentCount === 1 ? 'high' : 
      negativeCount > 2 ? 'high' :
      'medium';
    
    if (urgentCount > 0) {
      indicators.push(`${urgentCount} indicador(es) de urgência`);
    }

    // Normalizar score entre -1 e 1
    score = Math.max(-1, Math.min(1, score));
    
    // Determinar sentimento
    const sentiment: SentimentAnalysis['sentiment'] = 
      score > 0.3 ? 'positive' : 
      score < -0.3 ? 'negative' : 
      'neutral';
    
    // Determinar emoção
    const emotion: SentimentAnalysis['emotion'] =
      score > 0.5 ? 'happy' :
      score > 0 ? 'satisfied' :
      score > -0.5 ? 'neutral' :
      score > -0.8 ? 'frustrated' :
      'angry';

    console.log(`✅ [SENTIMENT] Fallback analysis: ${sentiment} (score: ${score})`);

    return {
      sentiment,
      score,
      emotion,
      confidence: 0.6, // Menor confiança no fallback
      indicators: indicators.length > 0 ? indicators : ['Análise baseada em palavras-chave'],
      urgency
    };
  }

  /**
   * Detecta sentimento em batch (múltiplas mensagens)
   */
  async detectSentimentBatch(
    messages: Array<{
      id: string;
      content: string;
      subject?: string;
    }>,
    tenantId: string
  ): Promise<Map<string, SentimentAnalysis>> {
    const results = new Map<string, SentimentAnalysis>();
    
    // Processar em paralelo (máximo 5 por vez para não sobrecarregar API)
    const batchSize = 5;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const analyses = await Promise.all(
        batch.map(msg => this.detectSentiment(msg.content, tenantId, { subject: msg.subject }))
      );
      
      batch.forEach((msg, index) => {
        results.set(msg.id, analyses[index]);
      });
    }
    
    return results;
  }

  /**
   * Verifica se sentimento requer alerta (muito negativo ou urgente)
   */
  shouldTriggerAlert(analysis: SentimentAnalysis, threshold = -0.7): boolean {
    return (
      analysis.score <= threshold || 
      analysis.urgency === 'critical' ||
      (analysis.sentiment === 'negative' && analysis.urgency === 'high')
    );
  }

  /**
   * Gera relatório de sentimento para histórico de mensagens
   */
  generateSentimentReport(analyses: SentimentAnalysis[]): {
    averageScore: number;
    sentimentDistribution: Record<string, number>;
    emotionDistribution: Record<string, number>;
    alertCount: number;
    trend: 'improving' | 'stable' | 'deteriorating';
  } {
    if (analyses.length === 0) {
      return {
        averageScore: 0,
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        emotionDistribution: {},
        alertCount: 0,
        trend: 'stable'
      };
    }

    const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
    
    const sentimentDistribution = {
      positive: analyses.filter(a => a.sentiment === 'positive').length,
      neutral: analyses.filter(a => a.sentiment === 'neutral').length,
      negative: analyses.filter(a => a.sentiment === 'negative').length
    };
    
    const emotionDistribution: Record<string, number> = {};
    analyses.forEach(a => {
      if (a.emotion) {
        emotionDistribution[a.emotion] = (emotionDistribution[a.emotion] || 0) + 1;
      }
    });
    
    const alertCount = analyses.filter(a => this.shouldTriggerAlert(a)).length;
    
    // Determinar tendência (comparar primeira metade com segunda metade)
    const midpoint = Math.floor(analyses.length / 2);
    const firstHalfAvg = analyses.slice(0, midpoint).reduce((sum, a) => sum + a.score, 0) / midpoint;
    const secondHalfAvg = analyses.slice(midpoint).reduce((sum, a) => sum + a.score, 0) / (analyses.length - midpoint);
    
    const trend: 'improving' | 'stable' | 'deteriorating' =
      secondHalfAvg - firstHalfAvg > 0.2 ? 'improving' :
      firstHalfAvg - secondHalfAvg > 0.2 ? 'deteriorating' :
      'stable';

    return {
      averageScore,
      sentimentDistribution,
      emotionDistribution,
      alertCount,
      trend
    };
  }
}

// Singleton instance
let sentimentServiceInstance: SentimentDetectionService | null = null;

export function getSentimentService(): SentimentDetectionService {
  if (!sentimentServiceInstance) {
    sentimentServiceInstance = new SentimentDetectionService();
  }
  return sentimentServiceInstance;
}

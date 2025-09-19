export interface MessageData {
  content: string;
  sender: string;
  subject?: string;
  channel: string;
  timestamp?: string;
}

export interface MessageAnalysis {
  intent: 'question' | 'complaint' | 'request' | 'emergency' | 'compliment' | 'spam' | 'other';
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  summary: string;
  keywords: string[];
  confidence: number;
  suggestedResponse?: string;
  requiresHumanAttention: boolean;
  language: string;
}

export interface IAIAnalysisPort {
  analyzeMessage(messageData: MessageData): Promise<MessageAnalysis>;
  generateResponse(analysis: MessageAnalysis, originalMessage: string, context?: any): Promise<string>;
}
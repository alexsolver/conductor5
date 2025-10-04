// ========================================
// LEARNING SYSTEM SERVICE
// ========================================
// Improves agent responses based on user feedback and conversation history

import { unifiedStorage } from '../storage-master';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// ========================================
// TYPES
// ========================================

export interface LearningInsight {
  pattern: string;
  occurrences: number;
  avgSatisfaction: number;
  recommendation: string;
}

export interface AgentPerformance {
  totalConversations: number;
  successRate: number;
  avgSatisfaction: number;
  commonIssues: string[];
  improvementSuggestions: string[];
}

// ========================================
// LEARNING SYSTEM CLASS
// ========================================

export class LearningSystem {
  
  /**
   * Process feedback and update agent learning
   */
  async processFeedback(
    conversationId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      console.log('[LEARNING] Processing feedback:', { conversationId, rating });

      // Save feedback
      await unifiedStorage.createAiConversationFeedback({
        conversationId,
        rating,
        comment: comment || null,
        helpful: rating >= 4
      });

      // Get conversation details
      const conversation = await unifiedStorage.getAiConversation(conversationId);
      if (!conversation) {
        console.warn('[LEARNING] Conversation not found');
        return;
      }

      // Update conversation satisfaction
      await unifiedStorage.updateAiConversation(conversationId, {
        satisfactionRating: rating
      });

      // Analyze and learn from this feedback
      await this.analyzeFeedback(conversation, rating, comment);

      console.log('[LEARNING] Feedback processed successfully');
    } catch (error) {
      console.error('[LEARNING] Error processing feedback:', error);
    }
  }

  /**
   * Analyze feedback and extract insights
   */
  private async analyzeFeedback(
    conversation: any,
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      // Only analyze low ratings for improvement
      if (rating >= 4) {
        return; // Positive feedback, nothing to learn
      }

      console.log('[LEARNING] Analyzing negative feedback for improvements');

      // Get conversation messages
      const messages = await unifiedStorage.getAiConversationMessages(conversation.id);

      // Use AI to analyze what went wrong
      const analysis = await this.analyzeConversationIssues(
        messages.map(m => ({ role: m.role, content: m.content })),
        comment
      );

      // Create knowledge base entry if useful insight found
      if (analysis.shouldCreateArticle) {
        await this.createImprovementArticle(
          conversation.tenantId,
          analysis.issue,
          analysis.solution
        );
      }

      console.log('[LEARNING] Analysis complete:', analysis);
    } catch (error) {
      console.error('[LEARNING] Error analyzing feedback:', error);
    }
  }

  /**
   * Analyze conversation to identify issues
   */
  private async analyzeConversationIssues(
    messages: Array<{ role: string; content: string }>,
    userComment?: string
  ): Promise<{
    issue: string;
    solution: string;
    shouldCreateArticle: boolean;
  }> {
    try {
      const systemPrompt = `You are an AI quality analyst reviewing a conversation that received negative feedback.
Analyze what went wrong and suggest improvements.

Return JSON:
{
  "issue": "What went wrong (brief description)",
  "solution": "How to handle this better in the future",
  "shouldCreateArticle": true/false (only if this is a recurring issue worth documenting)
}`;

      const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const userInput = userComment 
        ? `Conversation:\n${conversationText}\n\nUser feedback: "${userComment}"`
        : `Conversation:\n${conversationText}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('[LEARNING] Error analyzing issues:', error);
      return {
        issue: 'Analysis failed',
        solution: 'Unable to determine',
        shouldCreateArticle: false
      };
    }
  }

  /**
   * Create knowledge base article from learning
   */
  private async createImprovementArticle(
    tenantId: string,
    issue: string,
    solution: string
  ): Promise<void> {
    try {
      const { knowledgeBase } = require('./knowledge-base');

      await knowledgeBase.addArticle(tenantId, {
        title: `How to handle: ${issue}`,
        content: solution,
        category: 'agent_improvements',
        tags: ['auto-generated', 'learning', 'improvement']
      });

      console.log('[LEARNING] Created improvement article');
    } catch (error) {
      console.error('[LEARNING] Error creating article:', error);
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(
    tenantId: string,
    agentId: string,
    days: number = 30
  ): Promise<AgentPerformance> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get conversations
      const conversations = await unifiedStorage.getAiConversations(tenantId, {
        agentId,
        since
      });

      if (conversations.length === 0) {
        return {
          totalConversations: 0,
          successRate: 0,
          avgSatisfaction: 0,
          commonIssues: [],
          improvementSuggestions: []
        };
      }

      // Calculate metrics
      const completed = conversations.filter(c => c.status === 'completed').length;
      const failed = conversations.filter(c => c.status === 'failed').length;
      const escalated = conversations.filter(c => c.status === 'escalated').length;

      const successRate = completed / conversations.length;

      // Get satisfaction ratings
      const ratings = conversations
        .map(c => c.satisfactionRating)
        .filter(r => r !== null && r !== undefined) as number[];

      const avgSatisfaction = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

      // Analyze common issues
      const insights = await this.extractInsights(conversations);

      return {
        totalConversations: conversations.length,
        successRate,
        avgSatisfaction,
        commonIssues: insights.commonIssues,
        improvementSuggestions: insights.suggestions
      };
    } catch (error) {
      console.error('[LEARNING] Error getting performance:', error);
      return {
        totalConversations: 0,
        successRate: 0,
        avgSatisfaction: 0,
        commonIssues: [],
        improvementSuggestions: []
      };
    }
  }

  /**
   * Extract insights from conversations
   */
  private async extractInsights(conversations: any[]): Promise<{
    commonIssues: string[];
    suggestions: string[];
  }> {
    try {
      // Count failure reasons
      const failedConvs = conversations.filter(c => 
        c.status === 'failed' || c.status === 'escalated'
      );

      // Get recent logs for failed conversations
      const issues: string[] = [];
      
      for (const conv of failedConvs.slice(0, 10)) { // Analyze last 10 failures
        const logs = await unifiedStorage.getAiConversationLogs(conv.id);
        const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'warning');
        
        errorLogs.forEach(log => {
          if (log.category && !issues.includes(log.category)) {
            issues.push(log.category);
          }
        });
      }

      // Generate improvement suggestions
      const suggestions: string[] = [];

      if (issues.includes('action_failed')) {
        suggestions.push('Review action prerequisites and error handling');
      }

      if (issues.includes('escalating_to_human')) {
        suggestions.push('Improve intent detection to reduce escalations');
      }

      if (issues.includes('sentiment_analysis')) {
        suggestions.push('Enhance response tone to match user sentiment');
      }

      return {
        commonIssues: issues.slice(0, 5),
        suggestions
      };
    } catch (error) {
      console.error('[LEARNING] Error extracting insights:', error);
      return {
        commonIssues: [],
        suggestions: []
      };
    }
  }

  /**
   * Generate system prompt improvements based on learning
   */
  async generateSystemPromptImprovements(
    tenantId: string,
    agentId: string
  ): Promise<string> {
    try {
      const performance = await this.getAgentPerformance(tenantId, agentId, 30);

      if (performance.improvementSuggestions.length === 0) {
        return 'No improvements needed at this time.';
      }

      const suggestions = performance.improvementSuggestions.join('\n- ');
      
      return `Based on recent performance analysis:\n\nSuggested improvements:\n- ${suggestions}\n\nConsider updating the agent's system prompt to address these areas.`;
    } catch (error) {
      console.error('[LEARNING] Error generating improvements:', error);
      return 'Unable to generate improvements at this time.';
    }
  }
}

// Export singleton instance
export const learningSystem = new LearningSystem();

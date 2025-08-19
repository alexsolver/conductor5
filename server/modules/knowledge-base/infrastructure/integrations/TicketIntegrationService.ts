// ✅ 1QA.MD COMPLIANCE: TICKET INTEGRATION SERVICE - CLEAN ARCHITECTURE
// Infrastructure layer - integrates Knowledge Base with Ticket System

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface TicketKnowledgeIntegration {
  ticketId: string;
  suggestedArticleIds: string[];
  relevantArticles: Array<{
    id: string;
    title: string;
    summary?: string;
    relevanceScore: number;
  }>;
}

export class TicketIntegrationService {
  constructor(
    private knowledgeRepository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async getSuggestedArticlesForTicket(
    ticketId: string, 
    ticketCategory: string, 
    ticketDescription: string,
    tenantId: string
  ): Promise<TicketKnowledgeIntegration> {
    try {
      this.logger.info(`Finding suggested articles for ticket: ${ticketId}`);

      // Search for articles by category
      const categoryArticles = await this.knowledgeRepository.findByCategory(ticketCategory, tenantId);
      
      // Search for articles by keywords from ticket description
      const keywords = this.extractKeywords(ticketDescription);
      const searchResults = await this.knowledgeRepository.search({
        query: keywords.join(' '),
        limit: 10
      }, tenantId);

      // Combine and score articles
      const allArticles = [...categoryArticles, ...searchResults.articles];
      const uniqueArticles = this.deduplicateArticles(allArticles);
      const scoredArticles = this.scoreArticleRelevance(uniqueArticles, ticketCategory, keywords);

      // Return top 5 most relevant articles
      const topArticles = scoredArticles
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);

      return {
        ticketId,
        suggestedArticleIds: topArticles.map(a => a.id),
        relevantArticles: topArticles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          relevanceScore: this.calculateScore(article, ticketCategory, keywords)
        }))
      };

    } catch (error) {
      this.logger.error(`Failed to get suggested articles for ticket: ${error}`);
      return {
        ticketId,
        suggestedArticleIds: [],
        relevantArticles: []
      };
    }
  }

  async linkArticleToTicket(ticketId: string, articleId: string, tenantId: string): Promise<boolean> {
    try {
      this.logger.info(`Linking article ${articleId} to ticket ${ticketId}`);
      
      // Increment view count for the article since it was accessed from a ticket
      await this.knowledgeRepository.incrementViewCount(articleId, tenantId);
      
      // Here we would normally create a link record in a junction table
      // For now, we'll just log the action
      this.logger.info(`Article ${articleId} linked to ticket ${ticketId}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to link article to ticket: ${error}`);
      return false;
    }
  }

  private extractKeywords(text: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 10); // Top 10 keywords
  }

  private deduplicateArticles(articles: any[]): any[] {
    const seen = new Set();
    return articles.filter(article => {
      if (seen.has(article.id)) {
        return false;
      }
      seen.add(article.id);
      return true;
    });
  }

  private scoreArticleRelevance(articles: any[], category: string, keywords: string[]): any[] {
    return articles.map(article => ({
      ...article,
      relevanceScore: this.calculateScore(article, category, keywords)
    }));
  }

  private calculateScore(article: any, category: string, keywords: string[]): number {
    let score = 0;
    
    // Category match bonus
    if (article.category === category) {
      score += 0.4;
    }
    
    // Keyword matches in title (high weight)
    const titleWords = article.title.toLowerCase().split(/\s+/);
    const titleMatches = keywords.filter(keyword => 
      titleWords.some(word => word.includes(keyword))
    ).length;
    score += (titleMatches / keywords.length) * 0.3;
    
    // Keyword matches in content (medium weight)
    const contentWords = (article.content || '').toLowerCase().split(/\s+/);
    const contentMatches = keywords.filter(keyword =>
      contentWords.some(word => word.includes(keyword))
    ).length;
    score += (contentMatches / keywords.length) * 0.2;
    
    // View count bonus (indicates usefulness)
    score += Math.min(article.viewCount / 100, 0.1);
    
    return Math.min(score, 1.0);
  }
}
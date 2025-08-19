// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE DASHBOARD WIDGET - CLEAN ARCHITECTURE
// Infrastructure layer - provides dashboard widgets for Knowledge Base analytics

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface KnowledgeBaseDashboardData {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  pendingApprovalArticles: number;
  topViewedArticles: Array<{
    id: string;
    title: string;
    viewCount: number;
    category: string;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    action: string;
    timestamp: Date;
    author: string;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  weeklyStats: {
    articlesCreated: number;
    articlesUpdated: number;
    totalViews: number;
    averageRating: number;
  };
}

export class KnowledgeBaseDashboardWidget {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async getDashboardData(tenantId: string): Promise<KnowledgeBaseDashboardData> {
    try {
      this.logger.info(`Generating Knowledge Base dashboard data for tenant: ${tenantId}`);

      // Get all articles for analysis
      const allArticles = await this.repository.search({ limit: 1000 }, tenantId);
      const articles = allArticles.articles;

      // Calculate basic stats
      const totalArticles = articles.length;
      const publishedArticles = articles.filter(a => a.status === 'published').length;
      const draftArticles = articles.filter(a => a.status === 'draft').length;
      const pendingApprovalArticles = articles.filter(a => a.approvalStatus === 'pending_approval').length;

      // Get top viewed articles
      const topViewedArticles = await this.repository.getPopularArticles(5, tenantId);

      // Get recent activity
      const recentActivity = await this.repository.getRecentActivity(10, tenantId);

      // Calculate category distribution
      const categoryDistribution = this.calculateCategoryDistribution(articles);

      // Calculate weekly stats (mock for now)
      const weeklyStats = {
        articlesCreated: this.getWeeklyCount(articles, 'created'),
        articlesUpdated: this.getWeeklyCount(articles, 'updated'),
        totalViews: articles.reduce((sum, article) => sum + (article.viewCount || 0), 0),
        averageRating: this.calculateAverageRating(articles)
      };

      const dashboardData: KnowledgeBaseDashboardData = {
        totalArticles,
        publishedArticles,
        draftArticles,
        pendingApprovalArticles,
        topViewedArticles: topViewedArticles.map(article => ({
          id: article.id,
          title: article.title,
          viewCount: article.viewCount || 0,
          category: article.category
        })),
        recentActivity: recentActivity.map(article => ({
          id: article.id,
          title: article.title,
          action: this.getActivityAction(article),
          timestamp: article.updatedAt,
          author: article.authorId
        })),
        categoryDistribution,
        weeklyStats
      };

      this.logger.info(`Dashboard data generated successfully for ${totalArticles} articles`);
      return dashboardData;

    } catch (error) {
      this.logger.error(`Failed to generate Knowledge Base dashboard data: ${error}`);
      
      // Return empty data structure on error
      return {
        totalArticles: 0,
        publishedArticles: 0,
        draftArticles: 0,
        pendingApprovalArticles: 0,
        topViewedArticles: [],
        recentActivity: [],
        categoryDistribution: [],
        weeklyStats: {
          articlesCreated: 0,
          articlesUpdated: 0,
          totalViews: 0,
          averageRating: 0
        }
      };
    }
  }

  private calculateCategoryDistribution(articles: any[]): Array<{category: string; count: number; percentage: number}> {
    const categoryCounts = articles.reduce((acc, article) => {
      const category = article.category || 'Outros';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = articles.length || 1;
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  private getWeeklyCount(articles: any[], type: 'created' | 'updated'): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return articles.filter(article => {
      const date = type === 'created' ? article.createdAt : article.updatedAt;
      return new Date(date) >= oneWeekAgo;
    }).length;
  }

  private calculateAverageRating(articles: any[]): number {
    const ratedArticles = articles.filter(article => article.ratingCount && article.ratingCount > 0);
    if (ratedArticles.length === 0) return 0;

    const totalRating = ratedArticles.reduce((sum, article) => sum + (article.rating || 0), 0);
    return Math.round((totalRating / ratedArticles.length) * 10) / 10;
  }

  private getActivityAction(article: any): string {
    const now = new Date();
    const updated = new Date(article.updatedAt);
    const created = new Date(article.createdAt);
    
    const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 3600 * 24);
    
    if (Math.abs(updated.getTime() - created.getTime()) < 1000 * 60) { // Within a minute
      return 'Criado';
    } else if (daysDiff < 1) {
      return 'Atualizado';
    } else {
      return 'Modificado';
    }
  }
}
// APPLICATION USE CASE - Clean Architecture
// Application layer - Get notification statistics and analytics

import { INotificationRepository, NotificationStats } from '../../domain/repositories/INotificationRepository';

export interface GetNotificationStatsRequest {
  dateRange?: {
    from: string;
    to: string;
  };
  includeChannelStats?: boolean;
  includeEngagementStats?: boolean;
}

export interface GetNotificationStatsResponse {
  success: boolean;
  data?: {
    overview: {
      total: number;
      pending: number;
      sent: number;
      delivered: number;
      failed: number;
      expired: number;
    };
    distribution: {
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
      byChannel?: Record<string, number>;
    };
    recentActivity: {
      last24Hours: number;
      lastWeek: number;
      lastMonth: number;
    };
    trends: {
      dailyStats: Array<{
        date: string;
        total: number;
        sent: number;
        failed: number;
      }>;
    };
    channelHealth?: Array<{
      channel: string;
      successRate: number;
      totalSent: number;
      lastUsed: Date | null;
    }>;
    engagement?: {
      openRate: number;
      clickRate: number;
      avgDeliveryTime: number;
    };
  };
  error?: string;
}

export class GetNotificationStatsUseCase {
  constructor(
    private notificationRepository: INotificationRepository
  ) {}

  async execute(
    request: GetNotificationStatsRequest,
    tenantId: string
  ): Promise<GetNotificationStatsResponse> {
    try {
      // Parse date range if provided
      let dateRange: { from: Date; to: Date } | undefined;
      if (request.dateRange) {
        dateRange = {
          from: new Date(request.dateRange.from),
          to: new Date(request.dateRange.to)
        };
      }

      // Get main statistics
      const stats = await this.notificationRepository.getNotificationStats(tenantId, dateRange);

      // Get channel health if requested
      let channelHealth;
      if (request.includeChannelStats) {
        channelHealth = await this.notificationRepository.getChannelHealthStats(tenantId);
      }

      // Get engagement stats if requested
      let engagement;
      if (request.includeEngagementStats) {
        engagement = await this.notificationRepository.getEngagementStats(tenantId);
      }

      // Calculate trends (daily stats for the last 30 days)
      const trends = await this.calculateDailyTrends(tenantId, dateRange);

      return {
        success: true,
        data: {
          overview: {
            total: stats.total,
            pending: stats.pending,
            sent: stats.sent,
            delivered: stats.delivered,
            failed: stats.failed,
            expired: stats.expired
          },
          distribution: {
            byType: stats.byType,
            bySeverity: stats.bySeverity,
            byChannel: stats.byChannel
          },
          recentActivity: stats.recentActivity,
          trends,
          channelHealth,
          engagement
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get notification statistics'
      };
    }
  }

  private async calculateDailyTrends(
    tenantId: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<{
    dailyStats: Array<{
      date: string;
      total: number;
      sent: number;
      failed: number;
    }>;
  }> {
    // Default to last 30 days if no date range provided
    const endDate = dateRange?.to || new Date();
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyStats: Array<{
      date: string;
      total: number;
      sent: number;
      failed: number;
    }> = [];

    // Generate daily statistics
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      try {
        const dayStats = await this.notificationRepository.getNotificationStats(
          tenantId,
          { from: dayStart, to: dayEnd }
        );

        dailyStats.push({
          date: currentDate.toISOString().split('T')[0],
          total: dayStats.total,
          sent: dayStats.sent,
          failed: dayStats.failed
        });
      } catch (error) {
        // If daily stats fail, add empty entry
        dailyStats.push({
          date: currentDate.toISOString().split('T')[0],
          total: 0,
          sent: 0,
          failed: 0
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { dailyStats };
  }
}
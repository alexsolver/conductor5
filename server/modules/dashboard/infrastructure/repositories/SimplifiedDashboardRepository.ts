/**
 * Simplified Dashboard Repository
 * Clean Architecture - Infrastructure Layer
 * 
 * Phase 17 simplified implementation for immediate working functionality
 * 
 * @module SimplifiedDashboardRepository
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardStats, ActivityItem, PerformanceMetrics, DashboardWidget } from '../../domain/entities/Dashboard';

export class SimplifiedDashboardRepository implements IDashboardRepository {
  private dashboardStatsCache = new Map<string, DashboardStats>();
  private activityItemsCache: ActivityItem[] = [];
  private performanceMetricsCache = new Map<string, PerformanceMetrics>();
  private dashboardWidgetsCache: DashboardWidget[] = [];

  async getDashboardStats(tenantId: string, timeRange?: string): Promise<DashboardStats | null> {
    const cacheKey = `${tenantId}-${timeRange || '24h'}`;
    return this.dashboardStatsCache.get(cacheKey) || null;
  }

  async createDashboardStats(stats: Omit<DashboardStats, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardStats> {
    const dashboardStats: DashboardStats = {
      ...stats,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const cacheKey = `${stats.tenantId}-${stats.timeRange}`;
    this.dashboardStatsCache.set(cacheKey, dashboardStats);
    return dashboardStats;
  }

  async updateDashboardStats(id: string, updates: Partial<DashboardStats>, tenantId: string): Promise<DashboardStats | null> {
    // Find existing stats
    for (const [key, stats] of Array.from(this.dashboardStatsCache.entries())) {
      if (stats.id === id && stats.tenantId === tenantId) {
        const updatedStats = { ...stats, ...updates, updatedAt: new Date() };
        this.dashboardStatsCache.set(key, updatedStats);
        return updatedStats;
      }
    }
    return null;
  }

  async getRecentActivity(tenantId: string, limit: number = 20, timeRange?: string): Promise<ActivityItem[]> {
    let activities = this.activityItemsCache.filter(activity => activity.tenantId === tenantId);
    
    if (timeRange) {
      const cutoffDate = this.getTimeRangeCutoff(timeRange);
      activities = activities.filter(activity => activity.timestamp >= cutoffDate);
    }

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createActivityItem(activity: Omit<ActivityItem, 'id' | 'createdAt'>): Promise<ActivityItem> {
    const activityItem: ActivityItem = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.activityItemsCache.push(activityItem);
    
    // Keep only last 1000 activities to prevent memory issues
    if (this.activityItemsCache.length > 1000) {
      this.activityItemsCache = this.activityItemsCache.slice(-1000);
    }

    return activityItem;
  }

  async getActivityByUser(userId: string, tenantId: string, limit: number = 20): Promise<ActivityItem[]> {
    return this.activityItemsCache
      .filter(activity => activity.userId === userId && activity.tenantId === tenantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getActivityByEntity(entityType: string, entityId: string, tenantId: string): Promise<ActivityItem[]> {
    return this.activityItemsCache
      .filter(activity => 
        activity.entityType === entityType && 
        activity.entityId === entityId && 
        activity.tenantId === tenantId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getPerformanceMetrics(tenantId: string): Promise<PerformanceMetrics | null> {
    return this.performanceMetricsCache.get(tenantId) || null;
  }

  async updatePerformanceMetrics(metrics: PerformanceMetrics, tenantId: string): Promise<PerformanceMetrics> {
    this.performanceMetricsCache.set(tenantId, metrics);
    return metrics;
  }

  async getDashboardWidgets(tenantId: string, userId?: string): Promise<DashboardWidget[]> {
    return this.dashboardWidgetsCache.filter(widget => 
      widget.tenantId === tenantId && 
      (userId ? widget.userId === userId || widget.userId === null : true)
    );
  }

  async createDashboardWidget(widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardWidget> {
    const dashboardWidget: DashboardWidget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dashboardWidgetsCache.push(dashboardWidget);
    return dashboardWidget;
  }

  async updateDashboardWidget(id: string, updates: Partial<DashboardWidget>, tenantId: string): Promise<DashboardWidget | null> {
    const widgetIndex = this.dashboardWidgetsCache.findIndex(widget => 
      widget.id === id && widget.tenantId === tenantId
    );

    if (widgetIndex === -1) return null;

    this.dashboardWidgetsCache[widgetIndex] = {
      ...this.dashboardWidgetsCache[widgetIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.dashboardWidgetsCache[widgetIndex];
  }

  async deleteDashboardWidget(id: string, tenantId: string): Promise<boolean> {
    const initialLength = this.dashboardWidgetsCache.length;
    this.dashboardWidgetsCache = this.dashboardWidgetsCache.filter(widget => 
      !(widget.id === id && widget.tenantId === tenantId)
    );
    return this.dashboardWidgetsCache.length < initialLength;
  }

  // Mock implementations for stats - in real implementation these would query actual database tables
  async getTicketStats(tenantId: string, timeRange?: string) {
    return {
      total: Math.floor(Math.random() * 1000) + 100,
      open: Math.floor(Math.random() * 200) + 10,
      resolved: Math.floor(Math.random() * 500) + 50,
      pending: Math.floor(Math.random() * 100) + 5,
      inProgress: Math.floor(Math.random() * 150) + 15,
      closed: Math.floor(Math.random() * 300) + 30,
      resolutionRate: Math.floor(Math.random() * 40) + 60,
      averageResolutionTime: Math.floor(Math.random() * 24) + 2
    };
  }

  async getUserStats(tenantId: string) {
    return {
      total: Math.floor(Math.random() * 100) + 20,
      active: Math.floor(Math.random() * 50) + 10,
      lastLoginStats: {
        today: Math.floor(Math.random() * 20) + 5,
        thisWeek: Math.floor(Math.random() * 40) + 15,
        thisMonth: Math.floor(Math.random() * 80) + 20
      }
    };
  }

  async getCustomerStats(tenantId: string) {
    return {
      total: Math.floor(Math.random() * 500) + 100,
      active: Math.floor(Math.random() * 300) + 50,
      byType: {
        PF: Math.floor(Math.random() * 200) + 50,
        PJ: Math.floor(Math.random() * 100) + 25
      }
    };
  }

  async getCompanyStats(tenantId: string) {
    return {
      total: Math.floor(Math.random() * 50) + 10,
      active: Math.floor(Math.random() * 30) + 8,
      bySize: {
        small: Math.floor(Math.random() * 15) + 3,
        medium: Math.floor(Math.random() * 20) + 5,
        large: Math.floor(Math.random() * 10) + 2
      },
      byIndustry: {
        technology: Math.floor(Math.random() * 10) + 2,
        healthcare: Math.floor(Math.random() * 8) + 1,
        finance: Math.floor(Math.random() * 6) + 1,
        other: Math.floor(Math.random() * 15) + 3
      }
    };
  }

  async getLocationStats(tenantId: string) {
    return {
      total: Math.floor(Math.random() * 100) + 20,
      byType: {
        headquarters: Math.floor(Math.random() * 5) + 1,
        branch: Math.floor(Math.random() * 30) + 10,
        warehouse: Math.floor(Math.random() * 15) + 5,
        other: Math.floor(Math.random() * 20) + 5
      },
      byStatus: {
        active: Math.floor(Math.random() * 80) + 15,
        inactive: Math.floor(Math.random() * 10) + 2
      }
    };
  }

  async getTimecardStats(tenantId: string, timeRange?: string) {
    return {
      totalEntries: Math.floor(Math.random() * 1000) + 200,
      pendingApprovals: Math.floor(Math.random() * 50) + 5,
      totalHoursWorked: Math.floor(Math.random() * 10000) + 2000,
      overtimeHours: Math.floor(Math.random() * 500) + 100,
      averageWorkingHours: Math.floor(Math.random() * 4) + 7
    };
  }

  async getSystemStats() {
    return {
      responseTime: Math.random() * 100 + 50,
      systemLoad: Math.random() * 100,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      diskUsage: Math.random() * 100,
      databaseConnections: Math.floor(Math.random() * 50) + 10,
      activeUsers: Math.floor(Math.random() * 100) + 20,
      requestsPerMinute: Math.floor(Math.random() * 1000) + 200,
      errorRate: Math.random() * 5,
      uptime: process.uptime()
    };
  }

  private getTimeRangeCutoff(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}
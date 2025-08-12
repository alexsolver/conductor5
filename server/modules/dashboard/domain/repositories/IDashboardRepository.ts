/**
 * Dashboard Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module IDashboardRepository
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { DashboardStats, ActivityItem, PerformanceMetrics, DashboardWidget } from '../entities/Dashboard';

export interface IDashboardRepository {
  // Dashboard Stats
  getDashboardStats(tenantId: string, timeRange?: string): Promise<DashboardStats | null>;
  createDashboardStats(stats: Omit<DashboardStats, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardStats>;
  updateDashboardStats(id: string, updates: Partial<DashboardStats>, tenantId: string): Promise<DashboardStats | null>;

  // Activity Items
  getRecentActivity(tenantId: string, limit?: number, timeRange?: string): Promise<ActivityItem[]>;
  createActivityItem(activity: Omit<ActivityItem, 'id' | 'createdAt'>): Promise<ActivityItem>;
  getActivityByUser(userId: string, tenantId: string, limit?: number): Promise<ActivityItem[]>;
  getActivityByEntity(entityType: string, entityId: string, tenantId: string): Promise<ActivityItem[]>;
  
  // Performance Metrics
  getPerformanceMetrics(tenantId: string): Promise<PerformanceMetrics | null>;
  updatePerformanceMetrics(metrics: PerformanceMetrics, tenantId: string): Promise<PerformanceMetrics>;
  
  // Dashboard Widgets
  getDashboardWidgets(tenantId: string, userId?: string): Promise<DashboardWidget[]>;
  createDashboardWidget(widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardWidget>;
  updateDashboardWidget(id: string, updates: Partial<DashboardWidget>, tenantId: string): Promise<DashboardWidget | null>;
  deleteDashboardWidget(id: string, tenantId: string): Promise<boolean>;
  
  // Statistics Aggregations
  getTicketStats(tenantId: string, timeRange?: string): Promise<{
    total: number;
    open: number;
    resolved: number;
    pending: number;
    inProgress: number;
    closed: number;
    resolutionRate: number;
    averageResolutionTime: number;
  }>;
  
  getUserStats(tenantId: string): Promise<{
    total: number;
    active: number;
    lastLoginStats: Record<string, number>;
  }>;
  
  getCustomerStats(tenantId: string): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }>;
  
  getCompanyStats(tenantId: string): Promise<{
    total: number;
    active: number;
    bySize: Record<string, number>;
    byIndustry: Record<string, number>;
  }>;
  
  getLocationStats(tenantId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
  
  getTimecardStats(tenantId: string, timeRange?: string): Promise<{
    totalEntries: number;
    pendingApprovals: number;
    totalHoursWorked: number;
    overtimeHours: number;
    averageWorkingHours: number;
  }>;
  
  // System Performance
  getSystemStats(): Promise<{
    responseTime: number;
    systemLoad: number;
    memoryUsage: number;
    diskUsage: number;
    databaseConnections: number;
    activeUsers: number;
    requestsPerMinute: number;
    errorRate: number;
    uptime: number;
  }>;
}
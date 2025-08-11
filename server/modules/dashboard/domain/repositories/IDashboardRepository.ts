/**
 * Dashboard Repository Interface
 * Clean Architecture - Domain Layer
 */

import { DashboardMetrics } from '../entities/DashboardMetrics';

export interface IDashboardRepository {
  getMetrics(tenantId: string): Promise<DashboardMetrics>;
  getTicketStats(tenantId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }>;
  getUserStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
  }>;
  getActivityStats(tenantId: string): Promise<{
    todayTickets: number;
    weekTickets: number;
    monthTickets: number;
  }>;
  getPerformanceStats(tenantId: string): Promise<{
    avgResolutionTime: number;
    avgResponseTime: number;
    satisfactionScore: number;
  }>;
}
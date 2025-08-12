/**
 * Get Dashboard Stats Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetDashboardStatsUseCase
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardStats } from '../../domain/entities/Dashboard';

export interface GetDashboardStatsRequest {
  tenantId: string;
  timeRange?: string;
  includePerformanceMetrics?: boolean;
}

export interface GetDashboardStatsResponse {
  success: boolean;
  data?: DashboardStats;
  errors?: string[];
}

export class GetDashboardStatsUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(request: GetDashboardStatsRequest): Promise<GetDashboardStatsResponse> {
    try {
      // Validate request
      if (!request.tenantId) {
        return {
          success: false,
          errors: ['Tenant ID é obrigatório']
        };
      }

      // Get or generate dashboard stats
      let stats = await this.dashboardRepository.getDashboardStats(request.tenantId, request.timeRange);
      
      if (!stats) {
        // Generate fresh stats if none exist
        stats = await this.generateDashboardStats(request.tenantId, request.timeRange);
      }

      // Include performance metrics if requested
      if (request.includePerformanceMetrics) {
        const performanceMetrics = await this.dashboardRepository.getPerformanceMetrics(request.tenantId);
        if (performanceMetrics) {
          stats.performanceMetrics = performanceMetrics;
        }
      }

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('[GetDashboardStatsUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }

  private async generateDashboardStats(tenantId: string, timeRange?: string): Promise<DashboardStats> {
    // Get all required stats
    const [ticketStats, userStats, customerStats, companyStats, locationStats, timecardStats, recentActivity] = await Promise.all([
      this.dashboardRepository.getTicketStats(tenantId, timeRange),
      this.dashboardRepository.getUserStats(tenantId),
      this.dashboardRepository.getCustomerStats(tenantId),
      this.dashboardRepository.getCompanyStats(tenantId),
      this.dashboardRepository.getLocationStats(tenantId),
      this.dashboardRepository.getTimecardStats(tenantId, timeRange),
      this.dashboardRepository.getRecentActivity(tenantId, 10, timeRange)
    ]);

    // Create dashboard stats object
    const dashboardStats: Omit<DashboardStats, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId,
      totalTickets: ticketStats.total,
      openTickets: ticketStats.open,
      resolvedTickets: ticketStats.resolved,
      pendingTickets: ticketStats.pending,
      inProgressTickets: ticketStats.inProgress,
      closedTickets: ticketStats.closed,
      ticketResolutionRate: ticketStats.resolutionRate,
      averageResolutionTime: ticketStats.averageResolutionTime,
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      totalCustomers: customerStats.total,
      activeCustomers: customerStats.active,
      totalCompanies: companyStats.total,
      activeCompanies: companyStats.active,
      totalLocations: locationStats.total,
      recentActivity,
      performanceMetrics: {
        responseTime: 0,
        systemLoad: 0,
        memoryUsage: 0,
        diskUsage: 0,
        databaseConnections: 0,
        activeUsers: userStats.active,
        requestsPerMinute: 0,
        errorRate: 0,
        uptime: process.uptime(),
        lastUpdated: new Date()
      },
      timeRange: timeRange || '24h',
      generatedAt: new Date(),
      isActive: true
    };

    // Save generated stats
    return await this.dashboardRepository.createDashboardStats(dashboardStats);
  }
}
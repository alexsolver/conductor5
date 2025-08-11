/**
 * Dashboard Metrics Domain Entity
 * Clean Architecture - Domain Layer
 */

export class DashboardMetrics {
  constructor(
    public readonly tenantId: string,
    public readonly ticketStats: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
    },
    public readonly userStats: {
      total: number;
      active: number;
      inactive: number;
    },
    public readonly activityStats: {
      todayTickets: number;
      weekTickets: number;
      monthTickets: number;
    },
    public readonly performanceStats: {
      avgResolutionTime: number;
      avgResponseTime: number;
      satisfactionScore: number;
    },
    public readonly generatedAt: Date = new Date()
  ) {
    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }
  }

  // Business methods
  getTicketCompletionRate(): number {
    if (this.ticketStats.total === 0) return 0;
    return ((this.ticketStats.resolved + this.ticketStats.closed) / this.ticketStats.total) * 100;
  }

  getActiveUserPercentage(): number {
    if (this.userStats.total === 0) return 0;
    return (this.userStats.active / this.userStats.total) * 100;
  }

  getGrowthTrend(): 'up' | 'down' | 'stable' {
    const weeklyGrowth = this.activityStats.weekTickets - this.activityStats.todayTickets * 7;
    if (weeklyGrowth > 0) return 'up';
    if (weeklyGrowth < 0) return 'down';
    return 'stable';
  }
}
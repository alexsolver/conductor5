/**
 * DashboardSummary Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for dashboard
 */

export class DashboardSummary {
  constructor(
    private readonly tenantId: string,
    private readonly userId: string,
    private totalTickets: number = 0,
    private openTickets: number = 0,
    private resolvedTickets: number = 0,
    private pendingTickets: number = 0,
    private myTickets: number = 0,
    private urgentTickets: number = 0,
    private customerSatisfaction: number = 0,
    private avgResolutionTime: number = 0,
    private readonly generatedAt: Date = new Date()
  ) {}

  // Getters
  getTenantId(): string { return this.tenantId; }
  getUserId(): string { return this.userId; }
  getTotalTickets(): number { return this.totalTickets; }
  getOpenTickets(): number { return this.openTickets; }
  getResolvedTickets(): number { return this.resolvedTickets; }
  getPendingTickets(): number { return this.pendingTickets; }
  getMyTickets(): number { return this.myTickets; }
  getUrgentTickets(): number { return this.urgentTickets; }
  getCustomerSatisfaction(): number { return this.customerSatisfaction; }
  getAvgResolutionTime(): number { return this.avgResolutionTime; }
  getGeneratedAt(): Date { return this.generatedAt; }

  // Business methods
  getCompletionRate(): number {
    if (this.totalTickets === 0) return 0;
    return Math.round((this.resolvedTickets / this.totalTickets) * 100);
  }

  getWorkload(): 'light' | 'moderate' | 'heavy' | 'critical' {
    if (this.myTickets <= 5) return 'light';
    if (this.myTickets <= 15) return 'moderate';
    if (this.myTickets <= 30) return 'heavy';
    return 'critical';
  }

  hasUrgentIssues(): boolean {
    return this.urgentTickets > 0;
  }

  getPerformanceScore(): number {
    const completionWeight = 0.4;
    const satisfactionWeight = 0.3;
    const responseWeight = 0.3;

    const completionScore = this.getCompletionRate();
    const satisfactionScore = this.customerSatisfaction;
    const responseScore = this.avgResolutionTime > 0 ? Math.max(0, 100 - this.avgResolutionTime) : 0;

    return Math.round(
      (completionScore * completionWeight) +
      (satisfactionScore * satisfactionWeight) +
      (responseScore * responseWeight)
    );
  }
}
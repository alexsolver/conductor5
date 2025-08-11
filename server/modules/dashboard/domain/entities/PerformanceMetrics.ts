/**
 * PerformanceMetrics Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for performance metrics
 */

export class PerformanceMetrics {
  constructor(
    private readonly tenantId: string,
    private readonly period: string,
    private averageResolutionTime: number = 0,
    private firstResponseTime: number = 0,
    private customerSatisfaction: number = 0,
    private agentUtilization: number = 0,
    private ticketVolume: number = 0,
    private readonly calculatedAt: Date = new Date()
  ) {}

  // Getters
  getTenantId(): string { return this.tenantId; }
  getPeriod(): string { return this.period; }
  getAverageResolutionTime(): number { return this.averageResolutionTime; }
  getFirstResponseTime(): number { return this.firstResponseTime; }
  getCustomerSatisfaction(): number { return this.customerSatisfaction; }
  getAgentUtilization(): number { return this.agentUtilization; }
  getTicketVolume(): number { return this.ticketVolume; }
  getCalculatedAt(): Date { return this.calculatedAt; }

  // Business methods
  updateMetrics(
    avgResolution: number,
    firstResponse: number,
    satisfaction: number,
    utilization: number,
    volume: number
  ): void {
    this.averageResolutionTime = avgResolution;
    this.firstResponseTime = firstResponse;
    this.customerSatisfaction = satisfaction;
    this.agentUtilization = utilization;
    this.ticketVolume = volume;
  }

  getPerformanceRating(): 'excellent' | 'good' | 'average' | 'poor' {
    const score = this.calculateOverallScore();
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }

  private calculateOverallScore(): number {
    // Weight factors for different metrics
    const resolutionWeight = 0.3;
    const responseWeight = 0.3;
    const satisfactionWeight = 0.3;
    const utilizationWeight = 0.1;

    // Normalize scores (assuming 100 is best for satisfaction, lower is better for times)
    const resolutionScore = Math.max(0, 100 - this.averageResolutionTime);
    const responseScore = Math.max(0, 100 - this.firstResponseTime);
    const satisfactionScore = this.customerSatisfaction;
    const utilizationScore = this.agentUtilization;

    return (
      resolutionScore * resolutionWeight +
      responseScore * responseWeight +
      satisfactionScore * satisfactionWeight +
      utilizationScore * utilizationWeight
    );
  }

  isImproving(previousMetrics: PerformanceMetrics): boolean {
    return this.calculateOverallScore() > previousMetrics.calculateOverallScore();
  }

  getVolumeGrowth(previousMetrics: PerformanceMetrics): number {
    if (previousMetrics.ticketVolume === 0) return 0;
    return ((this.ticketVolume - previousMetrics.ticketVolume) / previousMetrics.ticketVolume) * 100;
  }
}
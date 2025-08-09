
import { DashboardMetric } from '../entities/DashboardMetric';

export class DashboardDomainService {
  validateMetric(metricType: string, value: number): boolean {
    return metricType.trim().length > 0 && !isNaN(value) && isFinite(value);
  }

  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  formatMetricValue(value: number, type: string): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  }
}

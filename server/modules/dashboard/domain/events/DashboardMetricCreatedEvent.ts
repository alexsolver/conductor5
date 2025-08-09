
export interface DashboardMetricCreatedEvent {
  id: string;
  metricType: string;
  value: number;
  timestamp: Date;
  tenantId: string;
}

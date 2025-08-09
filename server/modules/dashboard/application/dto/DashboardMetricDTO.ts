
export interface CreateDashboardMetricDTO {
  metricType: string;
  value: number;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface DashboardMetricResponseDTO {
  id: string;
  metricType: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

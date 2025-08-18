/**
 * Get GDPR Compliance Metrics Use Case - Application Layer
 * Clean Architecture - Business logic implementation  
 * Following 1qa.md enterprise patterns
 */

import { IGdprReportRepository, GdprComplianceMetrics, StatusDistribution, TrendDataPoint } from '../../domain/repositories/IGdprReportRepository';

export interface GetGdprComplianceMetricsRequest {
  tenantId: string;
  includeTrendData?: boolean;
  trendDays?: number;
}

export interface GetGdprComplianceMetricsResponse {
  success: boolean;
  data?: {
    metrics: GdprComplianceMetrics;
    statusDistribution: StatusDistribution[];
    trendData?: TrendDataPoint[];
  };
  error?: string;
}

export class GetGdprComplianceMetricsUseCase {
  constructor(
    private gdprReportRepository: IGdprReportRepository
  ) {}

  async execute(request: GetGdprComplianceMetricsRequest): Promise<GetGdprComplianceMetricsResponse> {
    try {
      if (!request.tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required'
        };
      }

      // Get metrics and status distribution in parallel
      const [metrics, statusDistribution] = await Promise.all([
        this.gdprReportRepository.getComplianceMetrics(request.tenantId),
        this.gdprReportRepository.getReportStatusDistribution(request.tenantId)
      ]);

      const response: GetGdprComplianceMetricsResponse = {
        success: true,
        data: {
          metrics,
          statusDistribution
        }
      };

      // Add trend data if requested
      if (request.includeTrendData) {
        const days = request.trendDays || 30;
        const trendData = await this.gdprReportRepository.getTrendData(request.tenantId, days);
        response.data!.trendData = trendData;
      }

      return response;

    } catch (error) {
      console.error('[GetGdprComplianceMetricsUseCase] Error:', error);
      return {
        success: false,
        error: 'Failed to retrieve GDPR compliance metrics'
      };
    }
  }
}
/**
 * Get GDPR Reports Use Case - Application Layer
 * Clean Architecture - Business logic implementation
 * Following 1qa.md enterprise patterns
 */

import { IGdprReportRepository, GdprReportFilters } from '../../domain/repositories/IGdprReportRepository';
import { GdprReportEntity } from '../../domain/entities/GdprReport';

export interface GetGdprReportsRequest {
  tenantId: string;
  filters?: GdprReportFilters;
}

export interface GetGdprReportsResponse {
  success: boolean;
  data?: GdprReportEntity[];
  error?: string;
}

export class GetGdprReportsUseCase {
  constructor(
    private gdprReportRepository: IGdprReportRepository
  ) {}

  async execute(request: GetGdprReportsRequest): Promise<GetGdprReportsResponse> {
    try {
      if (!request.tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required'
        };
      }

      const reports = await this.gdprReportRepository.findByTenantId(
        request.tenantId,
        request.filters
      );

      return {
        success: true,
        data: reports
      };

    } catch (error) {
      console.error('[GetGdprReportsUseCase] Error:', error);
      return {
        success: false,
        error: 'Failed to retrieve GDPR reports'
      };
    }
  }
}
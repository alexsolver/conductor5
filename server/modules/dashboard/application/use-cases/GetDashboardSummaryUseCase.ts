/**
 * GetDashboardSummaryUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for dashboard business logic
 */

import { DashboardSummary } from '../../domain/entities/DashboardSummary';

interface DashboardRepositoryInterface {
  getSummaryData(tenantId: string, userId: string): Promise<DashboardSummary>;
}

export interface GetDashboardSummaryRequest {
  tenantId: string;
  userId: string;
}

export interface GetDashboardSummaryResponse {
  success: boolean;
  message: string;
  data: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    pendingTickets: number;
    myTickets: number;
    urgentTickets: number;
    customerSatisfaction: number;
    avgResolutionTime: number;
  };
}

export class GetDashboardSummaryUseCase {
  constructor(
    private readonly dashboardRepository: DashboardRepositoryInterface
  ) {}

  async execute(request: GetDashboardSummaryRequest): Promise<GetDashboardSummaryResponse> {
    const summaryData = await this.dashboardRepository.getSummaryData(
      request.tenantId,
      request.userId
    );

    return {
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalTickets: summaryData.getTotalTickets(),
        openTickets: summaryData.getOpenTickets(),
        resolvedTickets: summaryData.getResolvedTickets(),
        pendingTickets: summaryData.getPendingTickets(),
        myTickets: summaryData.getMyTickets(),
        urgentTickets: summaryData.getUrgentTickets(),
        customerSatisfaction: summaryData.getCustomerSatisfaction(),
        avgResolutionTime: summaryData.getAvgResolutionTime()
      }
    };
  }
}
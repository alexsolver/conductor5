// ✅ 1QA.MD: Application Use Case - Location history retrieval
import { IAgentLocationRepository } from '../../domain/repositories/IFieldAgentRepository';

export class GetAgentLocationHistoryUseCase {
  constructor(
    private agentLocationRepository: IAgentLocationRepository
  ) {
    console.log('🗺️ [GET-AGENT-LOCATION-HISTORY-USECASE] Use case initialized following Clean Architecture');
  }

  async execute(tenantId: string, agentId: string, fromDate: Date, toDate: Date): Promise<any[]> {
    console.log('🗺️ [GET-AGENT-LOCATION-HISTORY-USECASE] === EXECUTE CALLED ===', {
      tenantId,
      agentId,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      timestamp: new Date().toISOString()
    });

    try {
      // ✅ 1QA.MD: Validate date range
      if (fromDate >= toDate) {
        throw new Error('fromDate must be before toDate');
      }

      // ✅ 1QA.MD: Limit to reasonable time range to prevent performance issues
      const maxDaysRange = 30;
      const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > maxDaysRange) {
        throw new Error(`Date range cannot exceed ${maxDaysRange} days`);
      }

      const history = await this.agentLocationRepository.getLocationHistory(
        agentId,
        fromDate,
        toDate,
        tenantId
      );

      console.log('🗺️ [GET-AGENT-LOCATION-HISTORY-USECASE] History retrieved successfully', {
        agentId,
        historyCount: history.length,
        dateRange: `${fromDate.toISOString()} to ${toDate.toISOString()}`
      });

      return history;
    } catch (error) {
      console.error('🗺️ [GET-AGENT-LOCATION-HISTORY-USECASE-ERROR] Execute failed:', error);
      throw new Error(`Failed to get agent location history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
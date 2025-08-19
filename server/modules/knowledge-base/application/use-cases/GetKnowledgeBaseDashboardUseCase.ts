// ✅ 1QA.MD COMPLIANCE: GET KNOWLEDGE BASE DASHBOARD USE CASE - CLEAN ARCHITECTURE
// Application layer - orchestrates dashboard data generation

import { KnowledgeBaseDashboardWidget, KnowledgeBaseDashboardData } from '../../infrastructure/widgets/KnowledgeBaseDashboardWidget';
import { Logger } from 'winston';

export class GetKnowledgeBaseDashboardUseCase {
  constructor(
    private dashboardWidget: KnowledgeBaseDashboardWidget,
    private logger: Logger
  ) {}

  async execute(tenantId: string): Promise<KnowledgeBaseDashboardData> {
    try {
      this.logger.info(`Generating Knowledge Base dashboard for tenant: ${tenantId}`);
      
      const dashboardData = await this.dashboardWidget.getDashboardData(tenantId);
      
      this.logger.info(`Knowledge Base dashboard generated successfully`);
      return dashboardData;
      
    } catch (error) {
      this.logger.error(`Failed to generate Knowledge Base dashboard: ${error}`);
      throw error;
    }
  }
}
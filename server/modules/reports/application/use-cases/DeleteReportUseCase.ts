import { Logger } from 'winston';
import { IReportsRepository } from '../../domain/repositories/IReportsRepository';

export class DeleteReportUseCase {
  constructor(
    private reportsRepository: IReportsRepository,
    private logger: Logger
  ) {}

  async execute(reportId: string, tenantId: string): Promise<void> {
    try {
      this.logger.info('Deleting report', { reportId, tenantId });

      await this.reportsRepository.delete(reportId, tenantId);
      
      this.logger.info('Successfully deleted report', { 
        reportId, 
        tenantId 
      });
    } catch (error) {
      this.logger.error('Error deleting report', { error, reportId, tenantId });
      throw error;
    }
  }
}
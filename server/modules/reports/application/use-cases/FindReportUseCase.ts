import { Logger } from 'winston';
import { IReportsRepository } from '../../domain/repositories/IReportsRepository';
import { Report } from '../../domain/entities/Report';

export class FindReportUseCase {
  constructor(
    private reportsRepository: IReportsRepository,
    private logger: Logger
  ) {}

  async execute(filters: any, tenantId: string): Promise<Report[]> {
    try {
      this.logger.info('Finding reports', { filters, tenantId });

      const reportFilters = { ...filters, tenantId };
      const reports = await this.reportsRepository.findAll(reportFilters);
      
      this.logger.info('Successfully found reports', { 
        count: reports.length, 
        tenantId 
      });

      return reports;
    } catch (error) {
      this.logger.error('Error finding reports', { error, filters, tenantId });
      throw error;
    }
  }
}
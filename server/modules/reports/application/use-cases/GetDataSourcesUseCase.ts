import { Logger } from 'winston';
import { ModuleDataSource, SYSTEM_DATA_SOURCES } from '../../domain/entities/ReportTemplate';

export class GetDataSourcesUseCase {
  constructor(private logger: Logger) {}

  async execute(moduleId?: string): Promise<ModuleDataSource[]> {
    try {
      this.logger.info('Getting data sources', { moduleId });

      // Se moduleId for especificado, retorna fonte de dados desse módulo
      if (moduleId) {
        const dataSource = SYSTEM_DATA_SOURCES[moduleId];
        if (!dataSource) {
          this.logger.warn('Data source not found for module', { moduleId });
          return [];
        }
        return [dataSource];
      }

      // Caso contrário, retorna todas as fontes de dados
      const allDataSources = Object.values(SYSTEM_DATA_SOURCES);
      
      this.logger.info('Successfully retrieved data sources', { 
        count: allDataSources.length, 
        modules: Object.keys(SYSTEM_DATA_SOURCES) 
      });

      return allDataSources;
    } catch (error) {
      this.logger.error('Error getting data sources', { error, moduleId });
      throw error;
    }
  }
}
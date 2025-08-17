import { Logger } from 'winston';
import { ReportTemplate, MODULE_TEMPLATES } from '../../domain/entities/ReportTemplate';

export class GetModuleTemplatesUseCase {
  constructor(private logger: Logger) {}

  async execute(moduleId?: string, tenantId?: string): Promise<ReportTemplate[]> {
    try {
      this.logger.info('Getting module templates', { moduleId, tenantId });

      // Se moduleId for especificado, retorna templates desse módulo
      if (moduleId) {
        const templates = MODULE_TEMPLATES[moduleId] || [];
        return templates.map(template => ({
          ...template,
          tenantId: tenantId || template.tenantId
        }));
      }

      // Caso contrário, retorna todos os templates
      const allTemplates: ReportTemplate[] = [];
      Object.values(MODULE_TEMPLATES).forEach(moduleTemplates => {
        moduleTemplates.forEach(template => {
          allTemplates.push({
            ...template,
            tenantId: tenantId || template.tenantId
          });
        });
      });

      this.logger.info('Successfully retrieved module templates', { 
        count: allTemplates.length, 
        modules: Object.keys(MODULE_TEMPLATES) 
      });

      return allTemplates;
    } catch (error) {
      this.logger.error('Error getting module templates', { error, moduleId, tenantId });
      throw error;
    }
  }
}
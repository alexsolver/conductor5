export class TemplateAuditApplicationService {
  constructor(
    private createAuditLogUseCase: CreateAuditLogUseCase
  ) {}

  async createAuditLog(data: CreateAuditLogDTO): Promise<TemplateAudit> {
    return await this.createAuditLogUseCase.execute(data);
  }

  async getAuditLogs(templateId: string): Promise<TemplateAudit[]> {
    // Implementation here
    return [];
  }

  async getAuditHistory(templateId: string, limit = 50): Promise<TemplateAudit[]> {
    // Implementation here
    return [];
  }
}
import { CreateAuditLogUseCase } from '../use-cases/CreateAuditLogUseCase';
import { CreateAuditLogDTO } from '../dto/CreateAuditLogDTO';
import { TemplateAudit } from '../../domain/entities/TemplateAudit';

export class TemplateAuditApplicationService {
  constructor(
    private createAuditLogUseCase: CreateAuditLogUseCase
  ) {}

  async createAuditLog(data: CreateAuditLogDTO): Promise<TemplateAudit> {
    return await this.createAuditLogUseCase.execute(data);
  }

  async getAuditLogs(templateId: string): Promise<TemplateAudit[]> {
    // Implementation here
    return [];
  }

  async getAuditHistory(templateId: string, limit = 50): Promise<TemplateAudit[]> {
    // Implementation here
    return [];
  }
}
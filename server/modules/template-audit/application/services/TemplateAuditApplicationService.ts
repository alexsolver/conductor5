
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
}

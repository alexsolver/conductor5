
import { TemplateAudit } from '../entities/TemplateAudit';

export interface ITemplateAuditRepository {
  create(audit: TemplateAudit): Promise<TemplateAudit>;
  findByTemplate(templateId: string): Promise<TemplateAudit[]>;
  findByUser(userId: string): Promise<TemplateAudit[]>;
}

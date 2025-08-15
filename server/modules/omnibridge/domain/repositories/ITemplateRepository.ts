
import { TemplateEntity } from '../entities/Template';

export interface ITemplateRepository {
  findById(id: string, tenantId: string): Promise<TemplateEntity | null>;
  findByTenant(tenantId: string): Promise<TemplateEntity[]>;
  findByCategory(category: string, tenantId: string): Promise<TemplateEntity[]>;
  findActiveByTenant(tenantId: string): Promise<TemplateEntity[]>;
  create(template: TemplateEntity): Promise<TemplateEntity>;
  update(template: TemplateEntity): Promise<TemplateEntity>;
  delete(id: string, tenantId: string): Promise<boolean>;
  incrementUsage(id: string, tenantId: string): Promise<boolean>;
}

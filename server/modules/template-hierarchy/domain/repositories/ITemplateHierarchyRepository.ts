
<line_number>1</line_number>
import { TemplateHierarchy } from '../entities/TemplateHierarchy';

export interface ITemplateHierarchyRepository {
  findById(id: string, tenantId: string): Promise<TemplateHierarchy | null>;
  findAll(tenantId: string): Promise<TemplateHierarchy[]>;
  create(hierarchy: TemplateHierarchy): Promise<TemplateHierarchy>;
  update(id: string, hierarchy: Partial<TemplateHierarchy>, tenantId: string): Promise<TemplateHierarchy | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByParentId(parentId: string, tenantId: string): Promise<TemplateHierarchy[]>;
  findChildren(templateId: string, tenantId: string): Promise<TemplateHierarchy[]>;
}

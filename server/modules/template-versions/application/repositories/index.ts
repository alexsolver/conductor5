/**
 * Template Versions Repository Interfaces
 * Clean Architecture - Application Layer
 */

export interface ITemplateVersionRepository {
  findById(id: string, tenantId: string): Promise<any | null>;
  findAll(tenantId: string): Promise<any[]>;
  findByTemplateId(templateId: string, tenantId: string): Promise<any[]>;
  create(version: any, tenantId: string): Promise<any>;
  update(id: string, version: Partial<any>, tenantId: string): Promise<any | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  getLatestVersion(templateId: string, tenantId: string): Promise<any | null>;
}
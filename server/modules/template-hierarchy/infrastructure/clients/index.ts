/**
 * Template Hierarchy Infrastructure Clients
 * Clean Architecture - Infrastructure Layer
 */

export interface ITemplateHierarchyClient {
  validateHierarchy(hierarchy: any): Promise<{ valid: boolean; errors: string[] }>;
  exportHierarchy(tenantId: string): Promise<string>;
  importHierarchy(data: string, tenantId: string): Promise<boolean>;
  synchronizeWithExternal(externalSystemId: string): Promise<boolean>;
}
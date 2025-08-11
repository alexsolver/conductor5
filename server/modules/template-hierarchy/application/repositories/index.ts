/**
 * Template Hierarchy Repository Interfaces
 * Clean Architecture - Application Layer
 */

export interface ITemplateHierarchyRepository {
  findById(id: string, tenantId: string): Promise<any | null>;
  findAll(tenantId: string): Promise<any[]>;
  findByParentId(parentId: string, tenantId: string): Promise<any[]>;
  findRootTemplates(tenantId: string): Promise<any[]>;
  create(hierarchy: any, tenantId: string): Promise<any>;
  update(id: string, hierarchy: Partial<any>, tenantId: string): Promise<any | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  moveNode(nodeId: string, newParentId: string, tenantId: string): Promise<boolean>;
  getHierarchyPath(nodeId: string, tenantId: string): Promise<any[]>;
}
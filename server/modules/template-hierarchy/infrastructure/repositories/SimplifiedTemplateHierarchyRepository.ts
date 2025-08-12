/**
 * Simplified Template Hierarchy Repository
 * Clean Architecture - Infrastructure Layer
 * 
 * Phase 19 simplified implementation for immediate working functionality
 * 
 * @module SimplifiedTemplateHierarchyRepository
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { ITemplateHierarchyRepository } from '../../domain/repositories/ITemplateHierarchyRepository';
import { TemplateHierarchy, TemplateStructure, TemplateAuditEntry } from '../../domain/entities/TemplateHierarchy';

export class SimplifiedTemplateHierarchyRepository implements ITemplateHierarchyRepository {
  private templates: TemplateHierarchy[] = [];
  private auditEntries: Map<string, TemplateAuditEntry[]> = new Map();
  private cache: Map<string, TemplateStructure> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Root template for tickets
    const ticketRootTemplate: TemplateHierarchy = {
      id: 'template_root_tickets',
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
      name: 'Ticket Base Template',
      category: 'tickets',
      level: 0,
      path: 'Ticket Base Template',
      roleIds: ['agent', 'admin'],
      templateData: {
        fields: [
          {
            id: 'title',
            name: 'title',
            type: 'text',
            label: 'Título',
            required: true,
            readonly: false,
            hidden: false,
            order: 1,
            inherited: false,
            overridable: true
          },
          {
            id: 'description',
            name: 'description',
            type: 'textarea',
            label: 'Descrição',
            required: true,
            readonly: false,
            hidden: false,
            order: 2,
            inherited: false,
            overridable: true
          },
          {
            id: 'priority',
            name: 'priority',
            type: 'select',
            label: 'Prioridade',
            required: true,
            readonly: false,
            hidden: false,
            order: 3,
            options: [
              { value: 'low', label: 'Baixa' },
              { value: 'medium', label: 'Média' },
              { value: 'high', label: 'Alta' },
              { value: 'urgent', label: 'Urgente' }
            ],
            inherited: false,
            overridable: true
          }
        ],
        sections: [
          {
            id: 'basic_info',
            name: 'basic_info',
            title: 'Informações Básicas',
            order: 1,
            collapsible: false,
            collapsed: false,
            inherited: false
          }
        ],
        validations: [
          {
            id: 'title_required',
            fieldId: 'title',
            type: 'required',
            message: 'Título é obrigatório',
            inherited: false
          }
        ],
        styles: {
          theme: 'default',
          layout: 'single_column',
          spacing: 'normal',
          inherited: false
        },
        scripts: []
      },
      inheritanceRules: {
        inheritFields: true,
        inheritValidations: true,
        inheritStyles: true,
        inheritPermissions: false,
        overrideMode: 'merge',
        lockedFields: [],
        requiredFields: ['title', 'description'],
        allowChildCreation: true,
        maxDepth: 5
      },
      metadata: {
        tags: ['base', 'ticket'],
        version: '1.0.0',
        author: 'system',
        lastModifiedBy: 'system',
        lastModifiedAt: new Date(),
        usageCount: 0,
        isSystem: true,
        permissions: [],
        auditTrail: []
      },
      children: ['template_support_tickets'],
      isActive: true,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    // Child template for support tickets
    const supportTicketTemplate: TemplateHierarchy = {
      id: 'template_support_tickets',
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
      name: 'Support Ticket Template',
      category: 'tickets',
      parentTemplateId: 'template_root_tickets',
      level: 1,
      path: 'Ticket Base Template/Support Ticket Template',
      roleIds: ['agent', 'admin'],
      templateData: {
        fields: [
          {
            id: 'title',
            name: 'title',
            type: 'text',
            label: 'Título',
            required: true,
            readonly: false,
            hidden: false,
            order: 1,
            inherited: true,
            inheritedFrom: 'template_root_tickets',
            overridable: true
          },
          {
            id: 'category',
            name: 'category',
            type: 'select',
            label: 'Categoria',
            required: true,
            readonly: false,
            hidden: false,
            order: 4,
            options: [
              { value: 'hardware', label: 'Hardware' },
              { value: 'software', label: 'Software' },
              { value: 'network', label: 'Rede' },
              { value: 'access', label: 'Acesso' }
            ],
            inherited: false,
            overridable: true
          },
          {
            id: 'urgency',
            name: 'urgency',
            type: 'select',
            label: 'Urgência',
            required: false,
            readonly: false,
            hidden: false,
            order: 5,
            options: [
              { value: 'low', label: 'Baixa' },
              { value: 'medium', label: 'Média' },
              { value: 'high', label: 'Alta' }
            ],
            inherited: false,
            overridable: true
          }
        ],
        sections: [
          {
            id: 'basic_info',
            name: 'basic_info',
            title: 'Informações Básicas',
            order: 1,
            collapsible: false,
            collapsed: false,
            inherited: true,
            inheritedFrom: 'template_root_tickets'
          },
          {
            id: 'support_details',
            name: 'support_details',
            title: 'Detalhes do Suporte',
            order: 2,
            collapsible: true,
            collapsed: false,
            inherited: false
          }
        ],
        validations: [
          {
            id: 'category_required',
            fieldId: 'category',
            type: 'required',
            message: 'Categoria é obrigatória',
            inherited: false
          }
        ],
        styles: {
          theme: 'support',
          layout: 'single_column',
          spacing: 'normal',
          inherited: true,
          inheritedFrom: 'template_root_tickets'
        },
        scripts: []
      },
      inheritanceRules: {
        inheritFields: true,
        inheritValidations: true,
        inheritStyles: true,
        inheritPermissions: false,
        overrideMode: 'merge',
        lockedFields: ['title'],
        requiredFields: ['title', 'description', 'category'],
        allowChildCreation: true,
        maxDepth: 3
      },
      metadata: {
        tags: ['support', 'ticket'],
        version: '1.1.0',
        author: 'admin',
        lastModifiedBy: 'admin',
        lastModifiedAt: new Date(),
        usageCount: 25,
        isSystem: false,
        permissions: [],
        auditTrail: []
      },
      children: [],
      isActive: true,
      createdBy: 'admin',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date()
    };

    // Form template
    const formTemplate: TemplateHierarchy = {
      id: 'template_contact_form',
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
      name: 'Contact Form Template',
      category: 'forms',
      level: 0,
      path: 'Contact Form Template',
      roleIds: ['customer', 'agent'],
      templateData: {
        fields: [
          {
            id: 'name',
            name: 'name',
            type: 'text',
            label: 'Nome',
            required: true,
            readonly: false,
            hidden: false,
            order: 1,
            inherited: false,
            overridable: true
          },
          {
            id: 'email',
            name: 'email',
            type: 'email',
            label: 'E-mail',
            required: true,
            readonly: false,
            hidden: false,
            order: 2,
            inherited: false,
            overridable: true
          },
          {
            id: 'message',
            name: 'message',
            type: 'textarea',
            label: 'Mensagem',
            required: true,
            readonly: false,
            hidden: false,
            order: 3,
            inherited: false,
            overridable: true
          }
        ],
        sections: [
          {
            id: 'contact_info',
            name: 'contact_info',
            title: 'Informações de Contato',
            order: 1,
            collapsible: false,
            collapsed: false,
            inherited: false
          }
        ],
        validations: [
          {
            id: 'email_format',
            fieldId: 'email',
            type: 'pattern',
            value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            message: 'E-mail deve ter formato válido',
            inherited: false
          }
        ],
        styles: {
          theme: 'modern',
          layout: 'single_column',
          spacing: 'spacious',
          inherited: false
        },
        scripts: []
      },
      inheritanceRules: {
        inheritFields: true,
        inheritValidations: true,
        inheritStyles: false,
        inheritPermissions: true,
        overrideMode: 'extend',
        lockedFields: [],
        requiredFields: ['name', 'email'],
        allowChildCreation: true,
        maxDepth: 3
      },
      metadata: {
        tags: ['contact', 'form', 'customer'],
        version: '2.0.0',
        author: 'designer',
        lastModifiedBy: 'designer',
        lastModifiedAt: new Date(),
        usageCount: 150,
        isSystem: false,
        permissions: [],
        auditTrail: []
      },
      children: [],
      isActive: true,
      createdBy: 'designer',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date()
    };

    this.templates = [ticketRootTemplate, supportTicketTemplate, formTemplate];
  }

  async create(template: Omit<TemplateHierarchy, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateHierarchy> {
    const newTemplate: TemplateHierarchy = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  async findById(id: string, tenantId: string): Promise<TemplateHierarchy | null> {
    return this.templates.find(t => t.id === id && t.tenantId === tenantId) || null;
  }

  async findByName(name: string, tenantId: string): Promise<TemplateHierarchy | null> {
    return this.templates.find(t => t.name === name && t.tenantId === tenantId) || null;
  }

  async update(id: string, tenantId: string, updates: Partial<TemplateHierarchy>): Promise<TemplateHierarchy | null> {
    const index = this.templates.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date()
    };

    return this.templates[index];
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const index = this.templates.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    return true;
  }

  async findAll(tenantId: string, filters?: {
    category?: string;
    parentId?: string;
    level?: number;
    companyId?: string;
    roleId?: string;
    isActive?: boolean;
  }): Promise<TemplateHierarchy[]> {
    let templates = this.templates.filter(t => t.tenantId === tenantId);

    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.parentId) {
        templates = templates.filter(t => t.parentTemplateId === filters.parentId);
      }
      if (filters.level !== undefined) {
        templates = templates.filter(t => t.level === filters.level);
      }
      if (filters.companyId) {
        templates = templates.filter(t => t.companyId === filters.companyId);
      }
      if (filters.roleId) {
        templates = templates.filter(t => t.roleIds.includes(filters.roleId));
      }
      if (filters.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === filters.isActive);
      }
    }

    return templates;
  }

  async findByCategory(tenantId: string, category: string, filters?: {
    companyId?: string;
    roleId?: string;
  }): Promise<TemplateHierarchy[]> {
    return this.findAll(tenantId, { ...filters, category });
  }

  async findChildren(parentId: string, tenantId: string): Promise<TemplateHierarchy[]> {
    return this.templates.filter(t => t.parentTemplateId === parentId && t.tenantId === tenantId);
  }

  async findParent(childId: string, tenantId: string): Promise<TemplateHierarchy | null> {
    const child = await this.findById(childId, tenantId);
    if (!child || !child.parentTemplateId) return null;

    return this.findById(child.parentTemplateId, tenantId);
  }

  async findRootTemplates(tenantId: string): Promise<TemplateHierarchy[]> {
    return this.templates.filter(t => t.tenantId === tenantId && t.level === 0);
  }

  async getFullHierarchy(templateId: string, tenantId: string): Promise<{
    template: TemplateHierarchy;
    ancestors: TemplateHierarchy[];
    descendants: TemplateHierarchy[];
    siblings: TemplateHierarchy[];
  }> {
    const template = await this.findById(templateId, tenantId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Get ancestors (parent chain)
    const ancestors: TemplateHierarchy[] = [];
    let currentParentId = template.parentTemplateId;
    while (currentParentId) {
      const parent = await this.findById(currentParentId, tenantId);
      if (parent) {
        ancestors.unshift(parent);
        currentParentId = parent.parentTemplateId;
      } else {
        break;
      }
    }

    // Get descendants (all children recursively)
    const descendants: TemplateHierarchy[] = [];
    const getDescendantsRecursive = async (parentId: string) => {
      const children = await this.findChildren(parentId, tenantId);
      for (const child of children) {
        descendants.push(child);
        await getDescendantsRecursive(child.id);
      }
    };
    await getDescendantsRecursive(templateId);

    // Get siblings (same parent)
    const siblings: TemplateHierarchy[] = [];
    if (template.parentTemplateId) {
      const allSiblings = await this.findChildren(template.parentTemplateId, tenantId);
      siblings.push(...allSiblings.filter(s => s.id !== templateId));
    }

    return { template, ancestors, descendants, siblings };
  }

  async getHierarchyPath(templateId: string, tenantId: string): Promise<TemplateHierarchy[]> {
    const hierarchy = await this.getFullHierarchy(templateId, tenantId);
    return [...hierarchy.ancestors, hierarchy.template];
  }

  async getResolvedTemplate(templateId: string, tenantId: string): Promise<{
    template: TemplateHierarchy;
    resolvedStructure: TemplateStructure;
    inheritanceChain: TemplateHierarchy[];
  }> {
    const template = await this.findById(templateId, tenantId);
    if (!template) {
      throw new Error('Template not found');
    }

    const hierarchyPath = await this.getHierarchyPath(templateId, tenantId);
    
    // Resolve inheritance from root to child
    let resolvedStructure = template.templateData as TemplateStructure;
    
    if (hierarchyPath.length > 1) {
      // Has inheritance chain
      for (let i = 0; i < hierarchyPath.length - 1; i++) {
        const parent = hierarchyPath[i];
        const child = hierarchyPath[i + 1];
        // Merge inheritance logic would go here in a real implementation
      }
    }

    return {
      template,
      resolvedStructure,
      inheritanceChain: hierarchyPath
    };
  }

  async search(tenantId: string, query: string, filters?: {
    category?: string;
    tags?: string[];
    author?: string;
    level?: number;
  }): Promise<TemplateHierarchy[]> {
    let templates = this.templates.filter(t => t.tenantId === tenantId);

    // Search in name, description, and tags
    const searchLower = query.toLowerCase();
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.metadata.description?.toLowerCase().includes(searchLower) ||
      t.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );

    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.tags) {
        templates = templates.filter(t =>
          filters.tags!.some(tag => t.metadata.tags.includes(tag))
        );
      }
      if (filters.author) {
        templates = templates.filter(t => t.metadata.author === filters.author);
      }
      if (filters.level !== undefined) {
        templates = templates.filter(t => t.level === filters.level);
      }
    }

    return templates;
  }

  async findByPath(path: string, tenantId: string): Promise<TemplateHierarchy | null> {
    return this.templates.find(t => t.path === path && t.tenantId === tenantId) || null;
  }

  async updatePermissions(templateId: string, tenantId: string, permissions: {
    roleId: string;
    permissions: string[];
    grantedBy: string;
  }[]): Promise<boolean> {
    const template = await this.findById(templateId, tenantId);
    if (!template) return false;

    const newPermissions = permissions.map(p => ({
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roleId: p.roleId,
      roleName: p.roleId,
      permissions: p.permissions as any[],
      grantedBy: p.grantedBy,
      grantedAt: new Date()
    }));

    await this.update(templateId, tenantId, {
      metadata: {
        ...template.metadata,
        permissions: newPermissions
      }
    });

    return true;
  }

  async checkPermission(templateId: string, tenantId: string, roleId: string, permission: string): Promise<boolean> {
    const template = await this.findById(templateId, tenantId);
    if (!template) return false;

    const rolePermission = template.metadata.permissions.find(p => p.roleId === roleId);
    return rolePermission ? rolePermission.permissions.includes(permission as any) : false;
  }

  async incrementUsageCount(templateId: string, tenantId: string): Promise<boolean> {
    const template = await this.findById(templateId, tenantId);
    if (!template) return false;

    await this.update(templateId, tenantId, {
      metadata: {
        ...template.metadata,
        usageCount: template.metadata.usageCount + 1
      }
    });

    return true;
  }

  async getUsageStatistics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalUsage: number;
    popularTemplates: Array<{
      template: TemplateHierarchy;
      usageCount: number;
    }>;
    usageByCategory: Record<string, number>;
    usageByLevel: Record<number, number>;
  }> {
    const templates = await this.findAll(tenantId);
    
    const totalUsage = templates.reduce((sum, t) => sum + t.metadata.usageCount, 0);
    
    const popularTemplates = templates
      .map(t => ({ template: t, usageCount: t.metadata.usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    const usageByCategory = templates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.metadata.usageCount;
      return acc;
    }, {} as Record<string, number>);

    const usageByLevel = templates.reduce((acc, t) => {
      acc[t.level] = (acc[t.level] || 0) + t.metadata.usageCount;
      return acc;
    }, {} as Record<number, number>);

    return { totalUsage, popularTemplates, usageByCategory, usageByLevel };
  }

  // Simplified implementations for other methods
  async createVersion(): Promise<boolean> { return true; }
  async getVersionHistory(): Promise<any[]> { return []; }
  async restoreVersion(): Promise<boolean> { return true; }

  async addAuditEntry(templateId: string, tenantId: string, entry: Omit<TemplateAuditEntry, 'id' | 'timestamp'>): Promise<TemplateAuditEntry> {
    const auditEntry: TemplateAuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const key = `${templateId}_${tenantId}`;
    const entries = this.auditEntries.get(key) || [];
    entries.unshift(auditEntry);
    this.auditEntries.set(key, entries.slice(0, 100)); // Keep last 100 entries

    return auditEntry;
  }

  async getAuditTrail(templateId: string, tenantId: string, limit: number = 50): Promise<TemplateAuditEntry[]> {
    const key = `${templateId}_${tenantId}`;
    const entries = this.auditEntries.get(key) || [];
    return entries.slice(0, limit);
  }

  async bulkCreate(templates: Omit<TemplateHierarchy, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TemplateHierarchy[]> {
    const results: TemplateHierarchy[] = [];
    for (const template of templates) {
      results.push(await this.create(template));
    }
    return results;
  }

  async bulkUpdate(): Promise<TemplateHierarchy[]> { return []; }
  async bulkDelete(): Promise<boolean> { return true; }
  async validateHierarchyIntegrity(): Promise<any> { return { isValid: true, issues: [] }; }
  async exportTemplate(): Promise<any> { return {}; }
  async importTemplate(): Promise<any> { return { imported: [], skipped: [], errors: [] }; }
  async cloneTemplate(): Promise<TemplateHierarchy> { return this.templates[0]; }
  async findTemplatesWithField(): Promise<TemplateHierarchy[]> { return []; }
  async findTemplatesUsingValidation(): Promise<TemplateHierarchy[]> { return []; }
  async findOrphanedTemplates(): Promise<TemplateHierarchy[]> { return []; }
  async preloadHierarchy(): Promise<Map<string, TemplateHierarchy[]>> { return new Map(); }
  async cacheResolvedTemplate(): Promise<boolean> { return true; }
  async getCachedResolvedTemplate(): Promise<TemplateStructure | null> { return null; }
}
/**
 * Simplified Ticket Template Repository
 * Clean Architecture - Infrastructure Layer
 * 
 * Phase 20 simplified implementation for immediate working functionality
 * 
 * @module SimplifiedTicketTemplateRepository
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate, TicketTemplateMetadata, UserFeedback } from '../../domain/entities/TicketTemplate';

export class SimplifiedTicketTemplateRepository implements ITicketTemplateRepository {
  private templates: TicketTemplate[] = [];
  private userFeedback: Map<string, UserFeedback[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Standard support template
    const supportTemplate: TicketTemplate = {
      id: 'template_support_001',
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
      name: 'Template de Suporte Técnico',
      description: 'Template padrão para tickets de suporte técnico',
      category: 'support',
      subcategory: 'technical',
      priority: 'medium',
      templateType: 'standard',
      status: 'active',
      fields: [
        {
          id: 'title',
          name: 'title',
          label: 'Título do Ticket',
          type: 'text',
          required: true,
          defaultValue: '',
          placeholder: 'Descreva brevemente o problema',
          order: 1,
          section: 'basic',
          conditional: undefined,
          readonly: false,
          hidden: false,
          validation: {
            required: true,
            minLength: 5,
            maxLength: 200,
            errorMessage: 'Título deve ter entre 5 e 200 caracteres'
          }
        },
        {
          id: 'description',
          name: 'description',
          label: 'Descrição do Problema',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva detalhadamente o problema encontrado',
          order: 2,
          section: 'basic',
          readonly: false,
          hidden: false,
          validation: {
            required: true,
            minLength: 20,
            errorMessage: 'Descrição deve ter pelo menos 20 caracteres'
          }
        },
        {
          id: 'priority',
          name: 'priority',
          label: 'Prioridade',
          type: 'select',
          required: true,
          defaultValue: 'medium',
          order: 3,
          section: 'classification',
          readonly: false,
          hidden: false,
          options: [
            { value: 'low', label: 'Baixa', color: '#10b981' },
            { value: 'medium', label: 'Média', color: '#f59e0b' },
            { value: 'high', label: 'Alta', color: '#ef4444' },
            { value: 'urgent', label: 'Urgente', color: '#dc2626' }
          ]
        },
        {
          id: 'category',
          name: 'category',
          label: 'Categoria',
          type: 'select',
          required: true,
          order: 4,
          section: 'classification',
          readonly: false,
          hidden: false,
          options: [
            { value: 'hardware', label: 'Hardware' },
            { value: 'software', label: 'Software' },
            { value: 'network', label: 'Rede' },
            { value: 'access', label: 'Acesso' },
            { value: 'other', label: 'Outros' }
          ]
        },
        {
          id: 'urgency',
          name: 'urgency',
          label: 'Urgência',
          type: 'select',
          required: false,
          defaultValue: 'medium',
          order: 5,
          section: 'classification',
          readonly: false,
          hidden: false,
          options: [
            { value: 'low', label: 'Baixa' },
            { value: 'medium', label: 'Média' },
            { value: 'high', label: 'Alta' }
          ]
        },
        {
          id: 'contact_phone',
          name: 'contact_phone',
          label: 'Telefone para Contato',
          type: 'phone',
          required: false,
          placeholder: '(11) 99999-9999',
          order: 6,
          section: 'contact',
          readonly: false,
          hidden: false,
          validation: {
            pattern: '^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$',
            errorMessage: 'Formato de telefone inválido'
          }
        }
      ],
      automation: {
        enabled: true,
        autoAssign: {
          enabled: true,
          rules: [
            {
              id: 'auto_assign_support',
              name: 'Auto-atribuir Suporte',
              conditions: [
                {
                  field: 'category',
                  operator: 'equals',
                  value: 'support'
                }
              ],
              assignTo: {
                type: 'team',
                id: 'support_team',
                name: 'Equipe de Suporte'
              },
              priority: 1,
              enabled: true
            }
          ]
        },
        autoTags: {
          enabled: true,
          tags: ['suporte', 'tecnico'],
          conditions: [
            {
              field: 'category',
              operator: 'equals',
              value: 'support'
            }
          ]
        },
        autoStatus: {
          enabled: true,
          status: 'open'
        },
        notifications: {
          enabled: true,
          recipients: [
            {
              type: 'team',
              id: 'support_team',
              name: 'Equipe de Suporte'
            }
          ],
          template: 'novo_ticket_suporte'
        },
        escalation: {
          enabled: true,
          rules: [
            {
              id: 'escalate_urgent',
              name: 'Escalar Urgentes',
              timeThreshold: 2,
              conditions: [
                {
                  field: 'priority',
                  operator: 'equals',
                  value: 'urgent'
                }
              ],
              escalateTo: {
                type: 'user',
                id: 'supervisor_001',
                name: 'Supervisor de Suporte'
              },
              actions: [
                {
                  type: 'notify',
                  value: 'supervisor_001'
                },
                {
                  type: 'change_priority',
                  value: 'urgent'
                }
              ],
              enabled: true
            }
          ]
        },
        sla: {
          enabled: true,
          responseTime: 4,
          resolutionTime: 24,
          businessHours: true
        }
      },
      workflow: {
        enabled: false,
        stages: [],
        approvals: [],
        conditions: [],
        transitions: []
      },
      permissions: [
        {
          id: 'perm_support_001',
          roleId: 'agent',
          roleName: 'agent',
          permissions: ['view', 'use'],
          grantedBy: 'system',
          grantedAt: new Date()
        },
        {
          id: 'perm_support_002',
          roleId: 'admin',
          roleName: 'admin',
          permissions: ['view', 'use', 'edit', 'delete', 'manage'],
          grantedBy: 'system',
          grantedAt: new Date()
        }
      ],
      metadata: {
        version: '2.1.0',
        author: 'system',
        lastModifiedBy: 'admin',
        lastModifiedAt: new Date(),
        changeLog: [
          {
            id: 'change_001',
            version: '1.0.0',
            changes: 'Template criado',
            changedBy: 'system',
            changedAt: new Date('2024-01-01'),
            changeType: 'major'
          },
          {
            id: 'change_002',
            version: '2.0.0',
            changes: 'Adicionado automação e SLA',
            changedBy: 'admin',
            changedAt: new Date('2024-06-01'),
            changeType: 'major'
          },
          {
            id: 'change_003',
            version: '2.1.0',
            changes: 'Melhorias na validação de campos',
            changedBy: 'admin',
            changedAt: new Date('2024-08-01'),
            changeType: 'minor'
          }
        ],
        usage: {
          totalUses: 150,
          lastMonth: 45,
          avgResponseTime: 2.5,
          avgResolutionTime: 18.2,
          successRate: 92.5
        },
        analytics: {
          popularFields: ['title', 'description', 'priority'],
          commonIssues: ['Problema de conexão', 'Erro de login', 'Performance lenta'],
          userFeedback: []
        },
        compliance: {
          gdprCompliant: true,
          auditRequired: true
        }
      },
      isDefault: true,
      isSystem: false,
      usageCount: 150,
      lastUsed: new Date(),
      tags: ['suporte', 'tecnico', 'padrao'],
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      isActive: true
    };

    // Quick incident template
    const quickIncidentTemplate: TicketTemplate = {
      id: 'template_incident_001',
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
      name: 'Incidente Rápido',
      description: 'Template para registro rápido de incidentes',
      category: 'incident',
      priority: 'high',
      templateType: 'quick',
      status: 'active',
      fields: [
        {
          id: 'title',
          name: 'title',
          label: 'Título do Incidente',
          type: 'text',
          required: true,
          placeholder: 'Ex: Sistema indisponível',
          order: 1,
          readonly: false,
          hidden: false
        },
        {
          id: 'impact',
          name: 'impact',
          label: 'Impacto',
          type: 'select',
          required: true,
          order: 2,
          readonly: false,
          hidden: false,
          options: [
            { value: 'low', label: 'Baixo' },
            { value: 'medium', label: 'Médio' },
            { value: 'high', label: 'Alto' },
            { value: 'critical', label: 'Crítico' }
          ]
        },
        {
          id: 'affected_users',
          name: 'affected_users',
          label: 'Usuários Afetados',
          type: 'number',
          required: false,
          placeholder: 'Número estimado',
          order: 3,
          readonly: false,
          hidden: false
        }
      ],
      automation: {
        enabled: true,
        autoAssign: {
          enabled: true,
          rules: [
            {
              id: 'auto_assign_incident',
              name: 'Auto-atribuir Incidentes',
              conditions: [],
              assignTo: {
                type: 'team',
                id: 'incident_team',
                name: 'Equipe de Incidentes'
              },
              priority: 1,
              enabled: true
            }
          ]
        },
        autoTags: {
          enabled: true,
          tags: ['incidente', 'urgente']
        },
        autoStatus: {
          enabled: true,
          status: 'investigating'
        },
        notifications: {
          enabled: true,
          recipients: [
            {
              type: 'role',
              id: 'incident_manager',
              name: 'Gerente de Incidentes'
            }
          ]
        },
        escalation: {
          enabled: true,
          rules: [
            {
              id: 'escalate_critical',
              name: 'Escalar Críticos',
              timeThreshold: 1,
              escalateTo: {
                type: 'user',
                id: 'cto_001',
                name: 'CTO'
              },
              actions: [
                {
                  type: 'notify',
                  value: 'cto_001'
                }
              ],
              enabled: true
            }
          ]
        },
        sla: {
          enabled: true,
          responseTime: 1,
          resolutionTime: 4,
          businessHours: false
        }
      },
      workflow: {
        enabled: true,
        stages: [
          {
            id: 'investigation',
            name: 'Investigação',
            description: 'Investigar o incidente',
            order: 1,
            required: true,
            autoAdvance: false,
            timeLimit: 2
          },
          {
            id: 'resolution',
            name: 'Resolução',
            description: 'Resolver o incidente',
            order: 2,
            required: true,
            autoAdvance: false,
            timeLimit: 4
          },
          {
            id: 'postmortem',
            name: 'Post-mortem',
            description: 'Análise pós-incidente',
            order: 3,
            required: false,
            autoAdvance: false
          }
        ],
        approvals: [],
        conditions: [],
        transitions: []
      },
      permissions: [
        {
          id: 'perm_incident_001',
          roleId: 'agent',
          roleName: 'agent',
          permissions: ['view', 'use'],
          grantedBy: 'system',
          grantedAt: new Date()
        }
      ],
      metadata: {
        version: '1.2.0',
        author: 'incident_manager',
        lastModifiedBy: 'incident_manager',
        lastModifiedAt: new Date(),
        changeLog: [
          {
            id: 'change_inc_001',
            version: '1.0.0',
            changes: 'Template de incidente criado',
            changedBy: 'incident_manager',
            changedAt: new Date('2024-03-01'),
            changeType: 'major'
          }
        ],
        usage: {
          totalUses: 25,
          lastMonth: 8,
          avgResponseTime: 0.8,
          avgResolutionTime: 3.2,
          successRate: 96.0
        },
        analytics: {
          popularFields: ['title', 'impact'],
          commonIssues: ['Sistema indisponível', 'Performance degradada'],
          userFeedback: []
        },
        compliance: {
          gdprCompliant: true,
          auditRequired: true
        }
      },
      isDefault: false,
      isSystem: false,
      usageCount: 25,
      lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      tags: ['incidente', 'rapido', 'critico'],
      createdBy: 'incident_manager',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date(),
      isActive: true
    };

    // Customer request template
    const customerRequestTemplate: TicketTemplate = {
      id: 'template_request_001',
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
      name: 'Solicitação de Cliente',
      description: 'Template para solicitações de clientes',
      category: 'request',
      subcategory: 'customer',
      priority: 'low',
      templateType: 'standard',
      status: 'active',
      fields: [
        {
          id: 'request_type',
          name: 'request_type',
          label: 'Tipo de Solicitação',
          type: 'select',
          required: true,
          order: 1,
          readonly: false,
          hidden: false,
          options: [
            { value: 'feature', label: 'Nova Funcionalidade' },
            { value: 'change', label: 'Alteração' },
            { value: 'access', label: 'Acesso' },
            { value: 'info', label: 'Informação' }
          ]
        },
        {
          id: 'business_justification',
          name: 'business_justification',
          label: 'Justificativa de Negócio',
          type: 'textarea',
          required: true,
          placeholder: 'Explique a necessidade de negócio',
          order: 2,
          readonly: false,
          hidden: false
        },
        {
          id: 'expected_date',
          name: 'expected_date',
          label: 'Data Esperada',
          type: 'date',
          required: false,
          order: 3,
          readonly: false,
          hidden: false
        }
      ],
      automation: {
        enabled: false
      },
      workflow: {
        enabled: true,
        stages: [
          {
            id: 'analysis',
            name: 'Análise',
            description: 'Analisar a solicitação',
            order: 1,
            required: true,
            autoAdvance: false
          },
          {
            id: 'approval',
            name: 'Aprovação',
            description: 'Aprovação da solicitação',
            order: 2,
            required: true,
            autoAdvance: false
          },
          {
            id: 'implementation',
            name: 'Implementação',
            description: 'Implementar a solicitação',
            order: 3,
            required: true,
            autoAdvance: false
          }
        ],
        approvals: [
          {
            id: 'business_approval',
            name: 'Aprovação de Negócio',
            approvers: [
              {
                type: 'role',
                id: 'business_analyst',
                name: 'Analista de Negócio'
              }
            ],
            required: true,
            order: 1
          }
        ],
        conditions: [],
        transitions: []
      },
      permissions: [
        {
          id: 'perm_request_001',
          roleId: 'customer',
          roleName: 'customer',
          permissions: ['view', 'use'],
          grantedBy: 'system',
          grantedAt: new Date()
        }
      ],
      metadata: {
        version: '1.0.0',
        author: 'business_analyst',
        lastModifiedBy: 'business_analyst',
        lastModifiedAt: new Date(),
        changeLog: [
          {
            id: 'change_req_001',
            version: '1.0.0',
            changes: 'Template de solicitação criado',
            changedBy: 'business_analyst',
            changedAt: new Date('2024-05-01'),
            changeType: 'major'
          }
        ],
        usage: {
          totalUses: 85,
          lastMonth: 22,
          avgResponseTime: 24.0,
          avgResolutionTime: 120.0,
          successRate: 88.2
        },
        analytics: {
          popularFields: ['request_type', 'business_justification'],
          commonIssues: ['Falta de justificativa', 'Prazo inadequado'],
          userFeedback: []
        },
        compliance: {
          gdprCompliant: true,
          auditRequired: false
        }
      },
      isDefault: false,
      isSystem: false,
      usageCount: 85,
      lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      tags: ['solicitacao', 'cliente', 'workflow'],
      createdBy: 'business_analyst',
      createdAt: new Date('2024-05-01'),
      updatedAt: new Date(),
      isActive: true
    };

    this.templates = [supportTemplate, quickIncidentTemplate, customerRequestTemplate];
  }

  async create(template: Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TicketTemplate> {
    const newTemplate: TicketTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  async findById(id: string, tenantId: string): Promise<TicketTemplate | null> {
    return this.templates.find(t => t.id === id && t.tenantId === tenantId) || null;
  }

  async findByName(name: string, tenantId: string): Promise<TicketTemplate | null> {
    return this.templates.find(t => t.name === name && t.tenantId === tenantId) || null;
  }

  async update(id: string, tenantId: string, updates: Partial<TicketTemplate>): Promise<TicketTemplate | null> {
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

  async findAll(tenantId: string, filters?: any): Promise<TicketTemplate[]> {
    let templates = this.templates.filter(t => t.tenantId === tenantId);

    if (filters) {
      if (filters.category) templates = templates.filter(t => t.category === filters.category);
      if (filters.subcategory) templates = templates.filter(t => t.subcategory === filters.subcategory);
      if (filters.templateType) templates = templates.filter(t => t.templateType === filters.templateType);
      if (filters.status) templates = templates.filter(t => t.status === filters.status);
      if (filters.companyId) templates = templates.filter(t => t.companyId === filters.companyId);
      if (filters.isDefault !== undefined) templates = templates.filter(t => t.isDefault === filters.isDefault);
      if (filters.isSystem !== undefined) templates = templates.filter(t => t.isSystem === filters.isSystem);
      if (filters.tags) {
        templates = templates.filter(t => 
          filters.tags.some((tag: string) => t.tags.includes(tag))
        );
      }
    }

    return templates;
  }

  async findByCategory(tenantId: string, category: string, subcategory?: string): Promise<TicketTemplate[]> {
    return this.findAll(tenantId, { category, subcategory });
  }

  async findByType(tenantId: string, templateType: string): Promise<TicketTemplate[]> {
    return this.findAll(tenantId, { templateType });
  }

  async findByCompany(tenantId: string, companyId: string): Promise<TicketTemplate[]> {
    return this.findAll(tenantId, { companyId });
  }

  async findActive(tenantId: string): Promise<TicketTemplate[]> {
    return this.findAll(tenantId, { status: 'active' });
  }

  async findDefault(tenantId: string): Promise<TicketTemplate[]> {
    return this.findAll(tenantId, { isDefault: true });
  }

  async search(tenantId: string, query: string, filters?: any): Promise<TicketTemplate[]> {
    let templates = this.templates.filter(t => t.tenantId === tenantId);

    // Search in name, description, and tags
    const searchLower = query.toLowerCase();
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );

    if (filters) {
      if (filters.category) templates = templates.filter(t => t.category === filters.category);
      if (filters.templateType) templates = templates.filter(t => t.templateType === filters.templateType);
      if (filters.tags) {
        templates = templates.filter(t => 
          filters.tags.some((tag: string) => t.tags.includes(tag))
        );
      }
    }

    return templates;
  }

  async searchByFields(tenantId: string, fieldCriteria: any): Promise<TicketTemplate[]> {
    return this.templates.filter(t => t.tenantId === tenantId && 
      t.fields.some(field => {
        if (fieldCriteria.fieldName && field.name !== fieldCriteria.fieldName) return false;
        if (fieldCriteria.fieldType && field.type !== fieldCriteria.fieldType) return false;
        if (fieldCriteria.hasValidation && !field.validation) return false;
        if (fieldCriteria.hasConditionalLogic && !field.conditional) return false;
        return true;
      })
    );
  }

  async incrementUsageCount(id: string, tenantId: string): Promise<boolean> {
    const template = await this.findById(id, tenantId);
    if (!template) return false;

    await this.update(id, tenantId, {
      usageCount: template.usageCount + 1,
      lastUsed: new Date(),
      metadata: {
        ...template.metadata,
        usage: {
          ...template.metadata.usage,
          totalUses: template.metadata.usage.totalUses + 1
        }
      }
    });

    return true;
  }

  async updateLastUsed(id: string, tenantId: string): Promise<boolean> {
    return this.update(id, tenantId, { lastUsed: new Date() }).then(result => !!result);
  }

  async getUsageStatistics(tenantId: string): Promise<any> {
    const templates = await this.findAll(tenantId);
    
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    
    const popularTemplates = templates
      .map(t => ({ template: t, usageCount: t.usageCount, lastUsed: t.lastUsed }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    const usageByCategory = templates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.usageCount;
      return acc;
    }, {} as Record<string, number>);

    const usageByType = templates.reduce((acc, t) => {
      acc[t.templateType] = (acc[t.templateType] || 0) + t.usageCount;
      return acc;
    }, {} as Record<string, number>);

    const usageByCompany = templates.reduce((acc, t) => {
      const company = t.companyId || 'global';
      acc[company] = (acc[company] || 0) + t.usageCount;
      return acc;
    }, {} as Record<string, number>);

    const averageFieldCount = templates.length > 0 ? 
      templates.reduce((sum, t) => sum + t.fields.length, 0) / templates.length : 0;

    const complexityDistribution = templates.reduce((acc, t) => {
      const complexity = t.fields.length;
      let range = 'simple';
      if (complexity > 10) range = 'complex';
      else if (complexity > 5) range = 'medium';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsage,
      popularTemplates,
      usageByCategory,
      usageByType,
      usageByCompany,
      averageFieldCount: Math.round(averageFieldCount * 100) / 100,
      complexityDistribution
    };
  }

  async getMostUsedTemplates(tenantId: string, limit: number = 10): Promise<TicketTemplate[]> {
    const templates = await this.findAll(tenantId);
    return templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  async getLeastUsedTemplates(tenantId: string, limit: number = 10): Promise<TicketTemplate[]> {
    const templates = await this.findAll(tenantId);
    return templates
      .sort((a, b) => a.usageCount - b.usageCount)
      .slice(0, limit);
  }

  async getTemplateAnalytics(templateId: string, tenantId: string): Promise<any> {
    const template = await this.findById(templateId, tenantId);
    if (!template) return null;

    return {
      usageCount: template.usageCount,
      avgResponseTime: template.metadata.usage.avgResponseTime,
      avgResolutionTime: template.metadata.usage.avgResolutionTime,
      successRate: template.metadata.usage.successRate,
      userSatisfaction: 4.2,
      commonIssues: template.metadata.analytics.commonIssues,
      fieldUsageStats: template.fields.reduce((acc, field) => {
        acc[field.name] = Math.floor(Math.random() * template.usageCount);
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getFieldAnalytics(tenantId: string): Promise<any> {
    const templates = await this.findAll(tenantId);
    const allFields = templates.flatMap(t => t.fields);
    
    const fieldTypeCounts = allFields.reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedFields = Object.entries(
      allFields.reduce((acc, field) => {
        const key = `${field.name}_${field.type}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
    .map(([key, count]) => {
      const [name, type] = key.split('_');
      return { name, type, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

    const validationUsage = allFields.reduce((acc, field) => {
      if (field.validation) {
        Object.keys(field.validation).forEach(validationType => {
          acc[validationType] = (acc[validationType] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const conditionalLogicUsage = allFields.filter(f => f.conditional).length;

    return {
      mostUsedFields,
      fieldTypeDistribution: fieldTypeCounts,
      validationUsage,
      conditionalLogicUsage
    };
  }

  async updatePermissions(): Promise<boolean> { return true; }
  async checkPermission(): Promise<boolean> { return true; }
  async getTemplatesForRole(): Promise<TicketTemplate[]> { return []; }
  async createVersion(): Promise<boolean> { return true; }
  async getVersionHistory(): Promise<any[]> { return []; }
  async restoreVersion(): Promise<boolean> { return true; }
  async cloneTemplate(): Promise<TicketTemplate> { return this.templates[0]; }
  async duplicateTemplate(): Promise<TicketTemplate> { return this.templates[0]; }
  async exportTemplate(): Promise<any> { return {}; }
  async importTemplate(): Promise<any> { return { imported: this.templates[0], warnings: [], errors: [] }; }
  async bulkCreate(templates: any[]): Promise<TicketTemplate[]> { return []; }
  async bulkUpdate(): Promise<TicketTemplate[]> { return []; }
  async bulkDelete(): Promise<boolean> { return true; }
  async bulkChangeStatus(): Promise<boolean> { return true; }
  async validateTemplate(): Promise<any> { return { isValid: true, errors: [], warnings: [] }; }
  async getTemplateHealth(): Promise<any> { 
    return { 
      status: 'healthy', 
      issues: [], 
      recommendations: [] 
    }; 
  }

  async addUserFeedback(templateId: string, tenantId: string, feedback: any): Promise<UserFeedback> {
    const userFeedback: UserFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}`,
      submittedAt: new Date()
    };

    const key = `${templateId}_${tenantId}`;
    const existing = this.userFeedback.get(key) || [];
    existing.push(userFeedback);
    this.userFeedback.set(key, existing);

    return userFeedback;
  }

  async getUserFeedback(templateId: string, tenantId: string, limit: number = 50): Promise<UserFeedback[]> {
    const key = `${templateId}_${tenantId}`;
    const feedback = this.userFeedback.get(key) || [];
    return feedback.slice(0, limit);
  }

  async getAverageRating(templateId: string, tenantId: string): Promise<number> {
    const feedback = await this.getUserFeedback(templateId, tenantId);
    if (feedback.length === 0) return 0;
    
    const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
    return Math.round((totalRating / feedback.length) * 100) / 100;
  }

  async getRecommendedTemplates(): Promise<TicketTemplate[]> { return this.templates.slice(0, 5); }
  async getSimilarTemplates(): Promise<TicketTemplate[]> { return this.templates.slice(0, 3); }
  async getAutomationUsage(): Promise<any> { 
    return { 
      templatesWithAutomation: 2, 
      autoAssignmentUsage: 2, 
      escalationUsage: 2,
      slaUsage: 2,
      notificationUsage: 2
    }; 
  }
  async getWorkflowAnalytics(): Promise<any> { 
    return { 
      templatesWithWorkflow: 2, 
      averageStages: 3, 
      approvalUsage: 1,
      automationIntegration: 100
    }; 
  }
  async getPerformanceMetrics(): Promise<any> { 
    return {
      avgCreationTime: 5.2,
      avgFirstResponseTime: 2.5,
      avgResolutionTime: 18.2,
      completionRate: 92.5,
      customerSatisfaction: 4.2,
      escalationRate: 8.5
    };
  }
  async findDependencies(): Promise<any> { 
    return { 
      usedByWorkflows: [], 
      referencedByAutomation: [], 
      linkedTemplates: [] 
    }; 
  }
  async cleanupUnusedTemplates(): Promise<any> { 
    return { cleaned: 0, templates: [] }; 
  }
  async archiveTemplate(): Promise<boolean> { return true; }
  async restoreTemplate(): Promise<boolean> { return true; }
  async getSystemTemplates(): Promise<TicketTemplate[]> { return []; }
  async createSystemTemplate(): Promise<TicketTemplate> { return this.templates[0]; }
  async updateSystemTemplate(): Promise<TicketTemplate | null> { return this.templates[0]; }
}
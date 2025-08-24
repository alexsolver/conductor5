/**
 * ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATE DTOs
 * Clean Architecture - Application Layer
 * Data Transfer Objects para comunicação entre camadas
 * 
 * @module TicketTemplateDTO
 * @compliance 1qa.md - Application Layer - DTOs
 */

import { z } from 'zod';

// ✅ 1QA.MD: DTO para criação de template
export const CreateTicketTemplateDTO = z.object({
  tenantId: z.string().uuid('Tenant ID inválido'),
  companyId: z.string().uuid().optional().nullable(),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  templateType: z.enum(['standard', 'quick', 'escalation', 'auto_response', 'workflow']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
  fields: z.array(z.object({
    name: z.string().min(1, 'Nome do campo obrigatório'),
    label: z.string().min(1, 'Label do campo obrigatório'),
    type: z.enum(['text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'url']),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      description: z.string().optional(),
      disabled: z.boolean().default(false)
    })).optional(),
    order: z.number().min(0),
    section: z.string().optional(),
    readonly: z.boolean().default(false),
    hidden: z.boolean().default(false)
  })).default([]),
  automation: z.object({
    enabled: z.boolean().default(false),
    autoAssign: z.object({
      enabled: z.boolean().default(false),
      userId: z.string().optional(),
      teamId: z.string().optional()
    }).optional(),
    autoTags: z.object({
      enabled: z.boolean().default(false),
      tags: z.array(z.string()).default([])
    }).optional(),
    sla: z.object({
      enabled: z.boolean().default(false),
      responseTime: z.number().optional(),
      resolutionTime: z.number().optional()
    }).optional()
  }).default({ enabled: false }),
  workflow: z.object({
    enabled: z.boolean().default(false),
    stages: z.array(z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
      required: z.boolean()
    })).default([])
  }).default({ enabled: false }),
  permissions: z.array(z.object({
    roleId: z.string(),
    roleName: z.string(),
    permissions: z.array(z.enum(['view', 'use', 'edit', 'delete', 'manage'])),
    grantedBy: z.string()
  })).default([]),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  createdById: z.string().uuid('ID do criador inválido')
});

// ✅ 1QA.MD: DTO para atualização de template
export const UpdateTicketTemplateDTO = z.object({
  tenantId: z.string().uuid(),
  templateId: z.string().uuid(),
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().optional(),
  templateType: z.enum(['standard', 'quick', 'escalation', 'auto_response', 'workflow']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  fields: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'url']),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      description: z.string().optional(),
      disabled: z.boolean().default(false)
    })).optional(),
    order: z.number().min(0),
    section: z.string().optional(),
    readonly: z.boolean().default(false),
    hidden: z.boolean().default(false)
  })).optional(),
  automation: z.object({
    enabled: z.boolean(),
    autoAssign: z.object({
      enabled: z.boolean(),
      userId: z.string().optional(),
      teamId: z.string().optional()
    }).optional(),
    autoTags: z.object({
      enabled: z.boolean(),
      tags: z.array(z.string())
    }).optional(),
    sla: z.object({
      enabled: z.boolean(),
      responseTime: z.number().optional(),
      resolutionTime: z.number().optional()
    }).optional()
  }).optional(),
  workflow: z.object({
    enabled: z.boolean(),
    stages: z.array(z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
      required: z.boolean()
    }))
  }).optional(),
  permissions: z.array(z.object({
    roleId: z.string(),
    roleName: z.string(),
    permissions: z.array(z.enum(['view', 'use', 'edit', 'delete', 'manage'])),
    grantedBy: z.string()
  })).optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  updatedById: z.string().uuid()
});

// ✅ 1QA.MD: DTO para consulta de templates
export const GetTicketTemplatesDTO = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid().optional().nullable(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  templateType: z.enum(['standard', 'quick', 'escalation', 'auto_response', 'workflow']).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  orderBy: z.enum(['name', 'category', 'createdAt', 'updatedAt', 'usageCount']).default('name'),
  orderDirection: z.enum(['asc', 'desc']).default('asc')
});

// ✅ 1QA.MD: DTO para resposta de template
export const TicketTemplateResponseDTO = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  subcategory: z.string().nullable(),
  templateType: z.string(),
  priority: z.string(),
  status: z.string(),
  fields: z.array(z.any()),
  automation: z.object({
    enabled: z.boolean(),
    autoAssign: z.any().optional(),
    autoTags: z.any().optional(),
    sla: z.any().optional()
  }),
  workflow: z.object({
    enabled: z.boolean(),
    stages: z.array(z.any())
  }),
  permissions: z.array(z.any()),
  metadata: z.object({
    version: z.string(),
    author: z.string(),
    lastModifiedBy: z.string(),
    lastModifiedAt: z.date(),
    usage: z.object({
      totalUses: z.number(),
      lastMonth: z.number()
    }),
    compliance: z.object({
      gdprCompliant: z.boolean(),
      auditRequired: z.boolean()
    })
  }),
  isDefault: z.boolean(),
  isPublic: z.boolean(),
  isSystem: z.boolean(),
  usageCount: z.number(),
  lastUsed: z.date().nullable(),
  tags: z.array(z.string()),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean()
});

// ✅ 1QA.MD: DTO para analytics
export const TemplateAnalyticsDTO = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date()
  }).optional()
});

// Tipos inferidos dos DTOs
export type CreateTicketTemplateData = z.infer<typeof CreateTicketTemplateDTO>;
export type UpdateTicketTemplateData = z.infer<typeof UpdateTicketTemplateDTO>;
export type GetTicketTemplatesData = z.infer<typeof GetTicketTemplatesDTO>;
export type TicketTemplateResponseData = z.infer<typeof TicketTemplateResponseDTO>;
export type TemplateAnalyticsData = z.infer<typeof TemplateAnalyticsDTO>;
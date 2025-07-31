/**
 * CORREÇÃO CRÍTICA 2: Schema Zod Unificado - Fonte Única de Verdade
 * Resolve divergência entre shared/ticket-validation.ts e TicketDetails.tsx
 */

import { z } from 'zod';

// Enums padronizados para toda a aplicação
export const TicketStatusEnum = z.enum(['new', 'open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled']);
export const TicketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent', 'critical']);
export const TicketImpactEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const TicketUrgencyEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export const TicketCategoryEnum = z.enum(['support', 'incident', 'request', 'change', 'problem', 'maintenance']);
export const CallerTypeEnum = z.enum(['user', 'customer', 'system']);
export const ContactTypeEnum = z.enum(['email', 'phone', 'chat', 'portal', 'api']);

/**
 * SCHEMA PRINCIPAL - Fonte única de verdade
 * Contém TODOS os campos identificados na análise QA
 */
export const ticketFormSchema = z.object({
  // CORE FIELDS - Campos obrigatórios básicos
  subject: z.string().min(1, "Subject is required"), // Serve como título e assunto do ticket
  description: z.string().min(1, "Description is required"),
  priority: TicketPriorityEnum.default('medium'),
  status: TicketStatusEnum.default('open'),
  category: TicketCategoryEnum.optional(),
  subcategory: z.string().optional(),
  
  // ASSIGNMENT FIELDS - Campos de atribuição
  callerId: z.string().uuid().optional(),
  beneficiaryId: z.string().uuid().optional(), 
  assignedToId: z.string().uuid().optional(),
  customerCompanyId: z.string().uuid().optional(), // Note: maps to customer_id in backend
  
  // LOCATION FIELD - Resolvendo inconsistência crítica 3
  location: z.string().optional(), // Definido como texto livre (não FK)
  locationId: z.string().optional(), // Para compatibilidade, será convertido para 'location'
  
  // BUSINESS FIELDS
  impact: TicketImpactEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  callerType: CallerTypeEnum.optional(),
  beneficiaryType: CallerTypeEnum.optional(),
  contactType: ContactTypeEnum.optional(),
  assignmentGroup: z.string().optional(),
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  costCenter: z.string().optional(), // Centro de Custo
  
  // SLA FIELDS
  dueDate: z.string().datetime().optional(), // Data de vencimento do ticket
  
  // TEMPLATE/ENVIRONMENT FIELDS
  environment: z.string().optional(),
  templateName: z.string().optional(),
  templateAlternative: z.string().optional(),
  callerNameResponsible: z.string().optional(),
  callType: z.string().optional(),
  callUrl: z.string().optional(),
  environmentError: z.string().optional(),
  callNumber: z.string().optional(),
  groupField: z.string().optional(),
  serviceVersion: z.string().optional(),
  summary: z.string().optional(),
  publicationPriority: z.string().optional(),
  responsibleTeam: z.string().optional(),
  infrastructure: z.string().optional(),
  environmentPublication: z.string().optional(),
  closeToPublish: z.boolean().optional(),
  
  // ARRAYS
  followers: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string()).default([]),
  
  // METADATA
  tenantId: z.string().uuid().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * SCHEMAS DERIVADOS - Para casos específicos
 */

// Schema simplificado para criação de ticket
export const ticketCreateSchema = ticketFormSchema.pick({
  subject: true,
  description: true,
  priority: true,
  status: true,
  category: true,
  callerId: true,
  assignedToId: true,
  location: true,
  tags: true
});

// Schema para atualização de ticket
export const ticketUpdateSchema = ticketFormSchema.partial();

// Schema para frontend (apenas campos necessários na interface)
export const ticketFrontendSchema = ticketFormSchema.pick({
  subject: true,
  description: true,
  priority: true,
  status: true,
  category: true,
  subcategory: true,
  callerId: true,
  beneficiaryId: true,
  assignedToId: true,
  customerCompanyId: true,
  location: true,
  impact: true,
  urgency: true,
  businessImpact: true,
  symptoms: true,
  workaround: true,
  followers: true,
  tags: true
});

// Schema para validação backend (com campos snake_case)
export const ticketBackendSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: TicketPriorityEnum,
  status: TicketStatusEnum,
  category: TicketCategoryEnum.optional(),
  subcategory: z.string().optional(),
  
  // Backend usa snake_case
  caller_id: z.string().uuid().optional(),
  beneficiary_id: z.string().uuid().optional(),
  assigned_to_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(), // customerCompanyId → customer_id
  
  location: z.string().optional(), // Campo correto no banco
  
  impact: TicketImpactEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  caller_type: CallerTypeEnum.optional(),
  beneficiary_type: CallerTypeEnum.optional(),
  contact_type: ContactTypeEnum.optional(),
  assignment_group: z.string().optional(),
  business_impact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  cost_center: z.string().optional(), // Centro de Custo (snake_case para backend)
  
  // SLA fields (snake_case para backend)
  due_date: z.string().datetime().optional(), // Data de vencimento
  
  followers: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string()).default([]),
  
  tenant_id: z.string().uuid(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Types TypeScript derivados
export type TicketFormData = z.infer<typeof ticketFormSchema>;
export type TicketCreateData = z.infer<typeof ticketCreateSchema>;  
export type TicketUpdateData = z.infer<typeof ticketUpdateSchema>;
export type TicketFrontendData = z.infer<typeof ticketFrontendSchema>;
export type TicketBackendData = z.infer<typeof ticketBackendSchema>;
/**
 * UNIFIED TICKET SCHEMA MASTER - Single Source of Truth
 * Consolidates shared/ticket-validation.ts and shared/unified-ticket-schema.ts
 * Resolves PROBLEMA 1: INCONSISTÊNCIAS DE SCHEMA (CRÍTICO)
 */

import { z } from 'zod';

// ====================
// CORE ENUMS - Static Base Values (Will be extended dynamically)
// ====================
export const TicketStatusEnum = z.enum(['new', 'open', 'in_progress', 'resolved', 'closed']);
export const TicketPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const TicketImpactEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const TicketUrgencyEnum = z.enum(['low', 'medium', 'high']);
export const TicketCategoryEnum = z.enum(['support', 'incident', 'request', 'change', 'problem', 'maintenance']);
export const CallerTypeEnum = z.enum(['user', 'customer', 'system']);
export const ContactTypeEnum = z.enum(['email', 'phone', 'chat', 'portal', 'api']);
export const LinkTypeEnum = z.enum(['relates_to', 'blocks', 'blocked_by', 'duplicates', 'caused_by', 'parent_child', 'related']);

// ====================
// DYNAMIC FIELD TYPES - For API-driven configurations
// ====================
export type DynamicFieldType = 'status' | 'priority' | 'category' | 'subcategory' | 'action' | 'impact' | 'urgency' | 'assignmentGroup';

export interface DynamicFieldOption {
  id: string;
  value: string;
  label: string;
  color?: string;
  order?: number;
  isActive: boolean;
  tenantId: string;
  companyId?: string;
  fieldName: DynamicFieldType;
  dependsOn?: string;
}

// ====================
// BASE SCHEMA - Without refinements for .pick() and .partial() compatibility
// ====================
const baseTicketSchemaObject = z.object({
  // ===== CORE REQUIRED FIELDS =====
  subject: z.string()
    .min(3, "Assunto deve ter pelo menos 3 caracteres")
    .max(255, "Assunto não pode exceder 255 caracteres"),
  
  description: z.string()
    .max(4000, "Descrição não pode exceder 4000 caracteres")
    .optional(),

  // ===== STATUS & PRIORITY FIELDS =====
  // DYNAMIC: These will be validated against API-driven field options
  status: z.string().default('new'), // Dynamic validation via useFieldOptions
  priority: z.string().default('medium'), // Dynamic validation via useFieldOptions
  impact: z.string().optional(), // Dynamic validation via useFieldOptions
  urgency: z.string().optional(), // Dynamic validation via useFieldOptions

  // ===== CATEGORIZATION FIELDS =====
  // DYNAMIC: Category hierarchy (category → subcategory → action)
  category: z.string().optional(), // Dynamic validation via useFieldOptions
  subcategory: z.string().optional(), // Dynamic validation via useFieldOptions
  action: z.string().optional(), // Dynamic validation via useFieldOptions

  // ===== ASSIGNMENT FIELDS =====
  callerId: z.string()
    .refine(val => !val || z.string().uuid().safeParse(val).success, "ID do solicitante deve ser um UUID válido")
    .optional(),
  callerType: z.string().default('customer'), // Dynamic validation
  beneficiaryId: z.string()
    .refine(val => !val || z.string().uuid().safeParse(val).success, "ID do beneficiário deve ser um UUID válido")
    .optional(),
  beneficiaryType: z.string().default('customer'), // Dynamic validation
  responsibleId: z.string()
    .refine(val => !val || z.string().uuid().safeParse(val).success, "ID do responsável deve ser um UUID válido")
    .optional(),
  assignmentGroup: z.string().max(100).optional(), // Dynamic validation

  // ===== COMPANY & LOCATION FIELDS =====
  customerCompanyId: z.string()
    .refine(val => !val || z.string().uuid().safeParse(val).success, "ID da empresa deve ser um UUID válido")
    .optional(),
  location: z.string().optional(), // Free text field, not FK
  locationId: z.string().optional(), // For compatibility, converted to 'location'

  // ===== CONTACT & COMMUNICATION FIELDS =====
  contactType: z.string().default('email'), // Dynamic validation
  businessImpact: z.string().max(500).optional(),
  symptoms: z.string().max(1000).optional(),
  workaround: z.string().max(1000).optional(),
  resolution: z.string().max(2000).optional(),

  // ===== SLA & TIME TRACKING FIELDS =====
  dueDate: z.string()
    .datetime("Data de vencimento deve estar em formato ISO válido")
    .optional(),
  estimatedHours: z.number()
    .min(0, "Horas estimadas devem ser positivas")
    .max(999, "Horas estimadas não podem exceder 999")
    .optional(),
  actualHours: z.number()
    .min(0, "Horas reais devem ser positivas")
    .max(999, "Horas reais não podem exceder 999")
    .optional(),

  // ===== TEMPLATE & ENVIRONMENT FIELDS =====
  environment: z.string().max(100).optional(),
  templateName: z.string().optional(), // From unified-ticket-schema.ts
  templateAlternative: z.string().max(200).optional(), // From ticket-validation.ts
  
  // ===== ADDITIONAL TEMPLATE FIELDS (from unified-ticket-schema.ts) =====
  callerNameResponsible: z.string().optional(),
  callType: z.string().optional(), // From unified-ticket-schema.ts
  callUrl: z.string().optional(),
  callNumber: z.string().optional(),
  environmentError: z.string().optional(),
  groupField: z.string().optional(),
  serviceVersion: z.string().optional(),
  summary: z.string().optional(),
  costCenter: z.string().optional(),

  // ===== LINKING FIELDS =====
  linkTicketNumber: z.string().max(50).optional(), // From ticket-validation.ts
  linkType: z.string()
    .refine(val => !val || LinkTypeEnum.safeParse(val).success, "Tipo de link inválido")
    .optional(),
  linkComment: z.string().max(500).optional(),

  // ===== ARRAYS & COLLECTIONS =====
  followers: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string().max(50)).default([]),

  // ===== METADATA FIELDS =====
  tenantId: z.string().uuid().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ====================
// MASTER SCHEMA WITH VALIDATIONS - Main schema with refinements
// ====================
export const ticketFormSchema = baseTicketSchemaObject
.refine((data) => {
  // Conditional validation: if linkTicketNumber exists, linkType is required
  if (data.linkTicketNumber && !data.linkType) {
    return false;
  }
  return true;
}, {
  message: "Tipo de link é obrigatório quando número do ticket relacionado é fornecido",
  path: ["linkType"]
})
.refine((data) => {
  // Conditional validation: impact and urgency must exist together for priority calculation
  if ((data.impact && !data.urgency) || (!data.impact && data.urgency)) {
    return false;
  }
  return true;
}, {
  message: "Impacto e urgência devem ser definidos juntos",
  path: ["impact", "urgency"]
});

// ====================
// DERIVED SCHEMAS - For specific use cases
// ====================

// Schema for ticket creation (simplified)
export const ticketCreateSchema = baseTicketSchemaObject.pick({
  subject: true,
  description: true,
  priority: true,
  status: true,
  category: true,
  subcategory: true,
  action: true,
  callerId: true,
  beneficiaryId: true,
  responsibleId: true,
  customerCompanyId: true,
  location: true,
  contactType: true,
  followers: true,
  tags: true,
});

// Schema for ticket updates (all fields optional)
export const ticketUpdateSchema = baseTicketSchemaObject.partial();

// Schema for frontend validation (camelCase fields)
export const ticketFrontendSchema = baseTicketSchemaObject;

// Schema for backend validation (fields that map to snake_case)
export const ticketBackendSchema = baseTicketSchemaObject;

// Enhanced schema for new ticket modal with stricter validation
export const newTicketModalSchema = z.object({
  // Required company and customer
  companyId: z.string().uuid("Empresa é obrigatória").min(1, "Empresa é obrigatória"),
  customerId: z.string().uuid("Cliente é obrigatório").min(1, "Cliente é obrigatório"),
  
  // Optional beneficiary
  beneficiaryId: z.string().uuid("ID do favorecido deve ser um UUID válido").optional(),
  
  // Required ticket details
  subject: z.string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(255, "Título não pode exceder 255 caracteres"),
  category: z.string().min(1, "Categoria é obrigatória"),
  subcategory: z.string().min(1, "Sub categoria é obrigatória"),
  action: z.string().min(1, "Ação é obrigatória"),
  priority: z.string().min(1, "Prioridade é obrigatória"),
  urgency: z.string().min(1, "Urgência é obrigatória"),
  
  // Required description
  description: z.string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(4000, "Descrição não pode exceder 4000 caracteres"),
  
  // Optional fields
  symptoms: z.string().max(1000, "Sintomas não podem exceder 1000 caracteres").optional(),
  businessImpact: z.string().max(500, "Impacto no negócio não pode exceder 500 caracteres").optional(),
  workaround: z.string().max(1000, "Solução temporária não pode exceder 1000 caracteres").optional(),
  location: z.string().optional(),
  environment: z.string().optional(),
});

// Form validation schema for frontend forms (accepts both Portuguese and English values)
export const ticketFormValidationSchema = z.object({
  subject: z.string().min(3, "Assunto deve ter pelo menos 3 caracteres").max(255),
  description: z.string().max(4000).optional(),
  
  // Status accepts both backend (English) and frontend (Portuguese) values
  status: z.enum(['new', 'open', 'in_progress', 'resolved', 'closed', 'novo', 'aberto', 'em_andamento', 'resolvido', 'fechado'], {
    errorMap: () => ({ message: "Status inválido" })
  }).default('new'),
  
  priority: z.string(), // Dynamic validation via useFieldOptions
  impact: z.string().optional(), // Dynamic validation via useFieldOptions  
  urgency: z.string().optional(), // Dynamic validation via useFieldOptions
  category: z.string().optional(),
  subcategory: z.string().optional(),
  action: z.string().optional(),
  callerId: z.string().optional(),
  callerType: z.enum(['user', 'customer']).default('customer'),
  beneficiaryId: z.string().optional(),
  beneficiaryType: z.enum(['user', 'customer']).default('customer'),
  responsibleId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),
  contactType: z.enum(['email', 'phone', 'chat', 'portal']).default('email'),
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  resolution: z.string().optional(),
  environment: z.string().optional(),
  templateAlternative: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  followers: z.array(z.string()).default([]),
  customerCompanyId: z.string().optional(),
});

// ====================
// TYPE EXPORTS - For TypeScript usage
// ====================
export type TicketFormData = z.infer<typeof ticketFormSchema>;
export type TicketCreateData = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateData = z.infer<typeof ticketUpdateSchema>;
export type TicketFrontendData = z.infer<typeof ticketFrontendSchema>;
export type TicketBackendData = z.infer<typeof ticketBackendSchema>;
export type NewTicketModalData = z.infer<typeof newTicketModalSchema>;
export type TicketFormValidationData = z.infer<typeof ticketFormValidationSchema>;

// ====================
// LEGACY COMPATIBILITY EXPORTS
// ====================
// Export the main schemas with legacy names for backward compatibility
export { ticketFormSchema as baseTicketSchema };
export { ticketCreateSchema as createTicketSchema };

// Static enum exports for components that need them
export const STATIC_STATUS_OPTIONS = ['new', 'open', 'in_progress', 'resolved', 'closed'] as const;
export const STATIC_PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
export const STATIC_IMPACT_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
export const STATIC_URGENCY_OPTIONS = ['low', 'medium', 'high'] as const;
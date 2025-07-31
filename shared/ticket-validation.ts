// PROBLEMA 10 RESOLVIDO: Schema Zod completo para validação de tickets
import { z } from 'zod';

// Enums alinhados com dados reais do banco de dados (valores em inglês)
export const TicketStatusEnum = z.enum(['new', 'open', 'in_progress', 'resolved', 'closed']);
export const TicketPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const TicketImpactEnum = z.enum(['low', 'medium', 'high']);
export const TicketUrgencyEnum = z.enum(['low', 'medium', 'high']);

// Schema para validação de formulário - aceita valores do banco
export const ticketFormValidationSchema = z.object({
  subject: z.string().min(3, "Assunto deve ter pelo menos 3 caracteres").max(255),
  description: z.string().max(4000).optional(),
  status: z.enum(['new', 'open', 'in_progress', 'resolved', 'closed']).default('new'),
  priority: TicketPriorityEnum,
  impact: TicketImpactEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  callerId: z.string().optional(),
  callerType: z.enum(['user', 'customer']).default('customer'),
  beneficiaryId: z.string().optional(),
  beneficiaryType: z.enum(['user', 'customer']).default('customer'),
  assignedToId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),
  contactType: z.enum(['email', 'phone', 'chat', 'portal']).default('email'),
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  resolution: z.string().optional(),
  environment: z.string().optional(),
  templateAlternative: z.string().optional(),
  linkTicketNumber: z.string().optional(),
  linkType: z.string().optional(),
  linkComment: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  followers: z.array(z.string()).default([]),
  customerCompanyId: z.string().optional(),
});
export const TicketCategoryEnum = z.enum(['support', 'incident', 'request', 'change', 'problem', 'maintenance']);
export const CallerTypeEnum = z.enum(['user', 'customer', 'system']);
export const ContactTypeEnum = z.enum(['email', 'phone', 'chat', 'portal', 'api']);
export const LinkTypeEnum = z.enum(['relates_to', 'blocks', 'blocked_by', 'duplicates', 'caused_by']);

// Schema base para ticket com todos os campos obrigatórios marcados
export const ticketFormSchema = z.object({
  // Campos obrigatórios
  subject: z.string()
    .min(3, "Assunto deve ter pelo menos 3 caracteres")
    .max(255, "Assunto não pode exceder 255 caracteres"),

  // Campos opcionais mas validados
  description: z.string()
    .max(4000, "Descrição não pode exceder 4000 caracteres")
    .optional(),

  // Enums com validação (valores em inglês para compatibilidade com banco)
  status: TicketStatusEnum.default('new'),
  priority: TicketPriorityEnum.default('medium'),
  impact: TicketImpactEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  category: z.string().refine(val => !val || TicketCategoryEnum.safeParse(val).success, "Categoria inválida").optional(),

  // Subcategoria dependente da categoria
  subcategory: z.string().max(100).optional(),

  // Campos de pessoa com validação UUID (aceita string vazia)
  callerId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "ID do solicitante deve ser um UUID válido").optional(),
  callerType: CallerTypeEnum.default('customer'),
  beneficiaryId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "ID do beneficiário deve ser um UUID válido").optional(),
  beneficiaryType: CallerTypeEnum.default('customer'),
  assignedToId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "ID do responsável deve ser um UUID válido").optional(),

  // Campo de localização (aceita string vazia)
  location: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "Localização deve ser um UUID válido").optional(),

  // Grupo de atribuição
  assignmentGroup: z.string().max(100).optional(),

  // Contato
  contactType: ContactTypeEnum.default('email'),

  // Campos de negócio
  businessImpact: z.string().max(500).optional(),
  symptoms: z.string().max(1000).optional(),
  workaround: z.string().max(1000).optional(),
  resolution: z.string().max(2000).optional(),

  // Horas estimadas/reais
  estimatedHours: z.number()
    .min(0, "Horas estimadas devem ser positivas")
    .max(999, "Horas estimadas não podem exceder 999")
    .optional(),
  actualHours: z.number()
    .min(0, "Horas reais devem ser positivas")
    .max(999, "Horas reais não podem exceder 999")
    .optional(),

  // SLA e Vencimento
  dueDate: z.string()
    .datetime("Data de vencimento deve estar em formato ISO válido")
    .optional(),

  // Arrays JSON
  followers: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string().max(50)).default([]),

  // Relacionamento com empresa cliente
  customerCompanyId: z.string().refine(val => !val || z.string().uuid().safeParse(val).success, "ID da empresa deve ser um UUID válido").optional(),

  // Ambiente
  environment: z.string().max(100).optional(),

  // Template alternativo
  templateAlternative: z.string().max(200).optional(),

  // Campos de linking
  linkTicketNumber: z.string().max(50).optional(),
  linkType: z.string().refine(val => !val || LinkTypeEnum.safeParse(val).success, "Tipo de link inválido").optional(),
  linkComment: z.string().max(500).optional(),
})
.refine((data) => {
  // Validação condicional: se linkTicketNumber existe, linkType é obrigatório
  if (data.linkTicketNumber && !data.linkType) {
    return false;
  }
  return true;
}, {
  message: "Tipo de link é obrigatório quando número do ticket relacionado é fornecido",
  path: ["linkType"]
})
.refine((data) => {
  // Validação condicional: impact e urgency devem existir juntos para calcular prioridade
  if ((data.impact && !data.urgency) || (!data.impact && data.urgency)) {
    return false;
  }
  return true;
}, {
  message: "Impacto e urgência devem ser definidos juntos",
  path: ["impact", "urgency"]
});

// Schema para criação de ticket sem refine (não suporta omit/partial)
const baseTicketSchema = z.object({
  // Campos obrigatórios
  subject: z.string()
    .min(3, "Assunto deve ter pelo menos 3 caracteres")
    .max(255, "Assunto não pode exceder 255 caracteres"),
  description: z.string()
    .max(4000, "Descrição não pode exceder 4000 caracteres")
    .optional(),
  status: TicketStatusEnum.default('open'),
  priority: TicketPriorityEnum.default('medium'),
  impact: TicketImpactEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  category: TicketCategoryEnum.optional(),
  subcategory: z.string().max(100).optional(),
  callerId: z.string().uuid().optional(),
  callerType: CallerTypeEnum.default('customer'),
  beneficiaryId: z.string().uuid().optional(),
  beneficiaryType: CallerTypeEnum.default('customer'),
  assignedToId: z.string().uuid().optional(),
  location: z.union([
    z.string().uuid(),
    z.literal("unspecified")
  ]).optional(),
  assignmentGroup: z.string().max(100).optional(),
  contactType: ContactTypeEnum.default('email'),
  businessImpact: z.string().max(500).optional(),
  symptoms: z.string().max(1000).optional(),
  workaround: z.string().max(1000).optional(),
  resolution: z.string().max(2000).optional(),
  estimatedHours: z.number().min(0).max(999).optional(),
  actualHours: z.number().min(0).max(999).optional(),
  dueDate: z.string().datetime().optional(),
  followers: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string().max(50)).default([]),
  customerCompanyId: z.string().uuid().optional(),
  environment: z.string().max(100).optional(),
  linkTicketNumber: z.string().max(50).optional(),
  linkType: LinkTypeEnum.optional(),
  linkComment: z.string().max(500).optional(),
});

// Schema para criação de ticket
export const createTicketSchema = baseTicketSchema.extend({
  customerId: z.string().uuid("ID do cliente é obrigatório")
});

// Schema refatorado para o novo modal de criação de tickets
export const newTicketModalSchema = z.object({
  // Empresa (obrigatório)
  companyId: z.string().uuid("Empresa é obrigatória").min(1, "Empresa é obrigatória"),
  // Cliente (obrigatório)
  customerId: z.string().uuid("Cliente é obrigatório").min(1, "Cliente é obrigatória"),
  // Favorecido (opcional)
  beneficiaryId: z.string().uuid("ID do favorecido deve ser um UUID válido").optional(),
  // Título do Ticket (obrigatório)
  subject: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(255, "Título não pode exceder 255 caracteres"),
  // Categoria (obrigatório)
  category: z.string().min(1, "Categoria é obrigatória"),
  // Sub Categoria (obrigatório)
  subcategory: z.string().min(1, "Sub categoria é obrigatória"),
  // Ação (obrigatório)
  action: z.string().min(1, "Ação é obrigatória"),
  // Prioridade (obrigatório) - usando enum para validação correta
  priority: TicketPriorityEnum,
  // Urgência (obrigatório) - usando enum para validação correta  
  urgency: TicketUrgencyEnum,
  // Descrição Detalhada (obrigatório)
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres").max(4000, "Descrição não pode exceder 4000 caracteres"),
  // Sintomas (opcional)
  symptoms: z.string().max(1000, "Sintomas não podem exceder 1000 caracteres").optional(),
  // Impacto no Negócio (opcional)
  businessImpact: z.string().max(500, "Impacto no negócio não pode exceder 500 caracteres").optional(),
  // Solução Temporária (opcional)
  workaround: z.string().max(1000, "Solução temporária não pode exceder 1000 caracteres").optional(),
  // Local (opcional)
  location: z.string().optional()
});

// Schema para atualização de ticket (todos os campos opcionais)
export const updateTicketSchema = baseTicketSchema.partial();

// Tipos TypeScript derivados dos schemas
export type TicketFormData = z.infer<typeof ticketFormSchema>;
export type CreateTicketData = z.infer<typeof createTicketSchema>;
export type UpdateTicketData = z.infer<typeof updateTicketSchema>;
export type NewTicketModalData = z.infer<typeof newTicketModalSchema>;

// Schema para validação de filtros na tabela
export const ticketFiltersSchema = z.object({
  status: z.union([TicketStatusEnum, z.literal("all")]).default("all"),
  priority: z.union([TicketPriorityEnum, z.literal("all")]).default("all"),
  category: z.union([TicketCategoryEnum, z.literal("all")]).default("all"),
  assignedToId: z.string().uuid().optional(),
  customerCompanyId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(255).optional()
});

export type TicketFiltersData = z.infer<typeof ticketFiltersSchema>;

// Helper functions para validação
export const validateTicketForm = (data: unknown) => {
  return ticketFormSchema.safeParse(data);
};

export const validateCreateTicket = (data: unknown) => {
  return createTicketSchema.safeParse(data);
};

export const validateUpdateTicket = (data: unknown) => {
  return updateTicketSchema.safeParse(data);
};

export const validateTicketFilters = (data: unknown) => {
  return ticketFiltersSchema.safeParse(data);
};
// TICKET TEMPLATES SCHEMA: Templates for standardized ticket creation
import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Ticket Templates table for standardized ticket creation
export const ticketTemplates = pgTable('ticket_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low, medium, high, urgent
  urgency: varchar('urgency', { length: 20 }).notNull().default('medium'), // low, medium, high, critical
  impact: varchar('impact', { length: 20 }).notNull().default('medium'), // low, medium, high, critical
  defaultTitle: varchar('default_title', { length: 500 }),
  defaultDescription: text('default_description'),
  defaultTags: text('default_tags'), // JSON array of tags
  estimatedHours: integer('estimated_hours').default(0),
  requiresApproval: boolean('requires_approval').default(false),
  autoAssign: boolean('auto_assign').default(false),
  defaultAssigneeRole: varchar('default_assignee_role', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Zod schemas for validation
export const insertTicketTemplateSchema = createInsertSchema(ticketTemplates, {
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória").max(100, "Categoria muito longa"),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: "Prioridade é obrigatória"
  }),
  urgency: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: "Urgência é obrigatória"
  }),
  impact: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: "Impacto é obrigatório"
  }),
  defaultTitle: z.string().max(500, "Título padrão muito longo").optional(),
  defaultDescription: z.string().optional(),
  defaultTags: z.string().optional(), // Will store JSON string
  estimatedHours: z.number().min(0, "Horas estimadas devem ser positivas").optional(),
  requiresApproval: z.boolean().optional(),
  autoAssign: z.boolean().optional(),
  defaultAssigneeRole: z.string().max(50, "Role muito longo").optional(),
  isActive: z.boolean().optional()
}).omit({
  id: true,
  tenantId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true
});

export const updateTicketTemplateSchema = insertTicketTemplateSchema.partial();

// TypeScript types
export type TicketTemplate = typeof ticketTemplates.$inferSelect;
export type InsertTicketTemplate = z.infer<typeof insertTicketTemplateSchema>;
export type UpdateTicketTemplate = z.infer<typeof updateTicketTemplateSchema>;

// Template application schema - for creating tickets from templates
export const applyTemplateSchema = z.object({
  templateId: z.string().uuid("ID do template inválido"),
  customTitle: z.string().min(1, "Título é obrigatório").max(500, "Título muito longo").optional(),
  customDescription: z.string().optional(),
  additionalTags: z.array(z.string()).optional(),
  customAssignee: z.string().uuid("ID do responsável inválido").optional(),
  customPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  customUrgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  customImpact: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

export type ApplyTemplate = z.infer<typeof applyTemplateSchema>;

// Template categories enum
export const templateCategories = [
  'Suporte Técnico',
  'Problemas de Sistema',
  'Solicitações de Acesso',
  'Manutenção Preventiva',
  'Bugs e Defeitos',
  'Mudanças e Melhorias',
  'Incidentes de Segurança',
  'Treinamento e Capacitação',
  'Hardware',
  'Software',
  'Rede e Conectividade',
  'Outros'
] as const;

export type TemplateCategory = typeof templateCategories[number];

import { z } from 'zod';

// Enums
export const ProjectStatusEnum = z.enum([
  'planning',     // Planejamento
  'approved',     // Aprovado
  'in_progress',  // Em Execução
  'on_hold',      // Em Espera
  'review',       // Em Revisão
  'completed',    // Concluído
  'cancelled'     // Cancelado
]);

export const ProjectPriorityEnum = z.enum([
  'low',
  'medium', 
  'high',
  'critical'
]);

export const ProjectActionTypeEnum = z.enum([
  'internal_meeting',      // Reunião Interna
  'internal_approval',     // Aprovação Interna
  'internal_review',       // Revisão Interna
  'internal_task',         // Tarefa Interna
  'external_delivery',     // Entrega Externa
  'external_validation',   // Validação Externa
  'external_meeting',      // Reunião com Cliente
  'external_feedback',     // Feedback Externo
  'milestone',            // Marco do Projeto
  'checkpoint'            // Ponto de Controle
]);

export const ActionStatusEnum = z.enum([
  'pending',
  'in_progress', 
  'completed',
  'cancelled',
  'blocked'
]);

// Project Schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: ProjectStatusEnum,
  priority: ProjectPriorityEnum,
  
  // Dates
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().default(0),
  
  // Financial
  budget: z.number().optional(),
  actualCost: z.number().default(0),
  
  // People
  projectManagerId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  teamMemberIds: z.array(z.string().uuid()).default([]),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid()
});

// Project Action Schema
export const ProjectActionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  projectId: z.string().uuid(),
  
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: ProjectActionTypeEnum,
  status: ActionStatusEnum,
  
  // Scheduling
  scheduledDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().default(0),
  
  // Assignment
  assignedToId: z.string().uuid().optional(),
  responsibleIds: z.array(z.string().uuid()).default([]),
  
  // External Actions
  clientContactId: z.string().uuid().optional(),
  externalReference: z.string().optional(),
  deliveryMethod: z.string().optional(),
  
  // Dependencies
  dependsOnActionIds: z.array(z.string().uuid()).default([]),
  blockedByActionIds: z.array(z.string().uuid()).default([]),
  
  // Metadata
  priority: ProjectPriorityEnum.default('medium'),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  notes: z.string().optional(),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid()
});

// Project Timeline Entry
export const ProjectTimelineSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  projectId: z.string().uuid(),
  
  eventType: z.enum(['project_created', 'status_changed', 'action_completed', 'milestone_reached', 'budget_updated', 'team_changed']),
  title: z.string(),
  description: z.string().optional(),
  
  // References
  actionId: z.string().uuid().optional(),
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
  
  // Data
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  
  createdAt: z.string().datetime(),
  createdBy: z.string().uuid()
});

// Request/Response Schemas
export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  tenantId: true,
  actualHours: true,
  actualCost: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreateProjectActionSchema = ProjectActionSchema.omit({
  id: true,
  tenantId: true,
  actualHours: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdateProjectActionSchema = CreateProjectActionSchema.partial();

// Filter/Query Schemas
export const ProjectFiltersSchema = z.object({
  status: ProjectStatusEnum.optional(),
  priority: ProjectPriorityEnum.optional(),
  projectManagerId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional()
});

export const ProjectActionFiltersSchema = z.object({
  projectId: z.string().uuid().optional(),
  type: ProjectActionTypeEnum.optional(),
  status: ActionStatusEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  search: z.string().optional()
});

// Types
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;

export type ProjectAction = z.infer<typeof ProjectActionSchema>;
export type CreateProjectAction = z.infer<typeof CreateProjectActionSchema>;
export type UpdateProjectAction = z.infer<typeof UpdateProjectActionSchema>;

export type ProjectTimeline = z.infer<typeof ProjectTimelineSchema>;

export type ProjectFilters = z.infer<typeof ProjectFiltersSchema>;
export type ProjectActionFilters = z.infer<typeof ProjectActionFiltersSchema>;

export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type ProjectPriority = z.infer<typeof ProjectPriorityEnum>;
export type ProjectActionType = z.infer<typeof ProjectActionTypeEnum>;
export type ActionStatus = z.infer<typeof ActionStatusEnum>;

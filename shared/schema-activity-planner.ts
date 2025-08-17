/**
 * Activity Planner Schema - Schema de banco de dados para o módulo de planejamento de atividades
 * Seguindo padrões Drizzle ORM e 1qa.md
 */

import { pgTable, varchar, uuid, timestamp, text, integer, decimal, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Assets - Ativos que requerem manutenção
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  locationId: uuid('location_id').notNull(), // referência ao módulo locations
  parentAssetId: uuid('parent_asset_id'),
  tag: varchar('tag', { length: 100 }).notNull(), // identificador único do ativo
  name: varchar('name', { length: 255 }).notNull(),
  model: varchar('model', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  criticality: varchar('criticality', { length: 20 }).notNull().$type<'low' | 'medium' | 'high' | 'critical'>(),
  status: varchar('status', { length: 20 }).notNull().$type<'active' | 'inactive' | 'maintenance' | 'decommissioned'>(),
  metersJson: jsonb('meters_json'), // horímetros, odômetros, etc.
  mtbf: integer('mtbf'), // Mean Time Between Failures (hours)
  mttr: integer('mttr'), // Mean Time To Repair (hours)
  failureCodesJson: jsonb('failure_codes_json').$type<string[]>(),
  specifications: jsonb('specifications'),
  installationDate: timestamp('installation_date'),
  warrantyExpiryDate: timestamp('warranty_expiry_date'),
  lastMaintenanceDate: timestamp('last_maintenance_date'),
  nextMaintenanceDate: timestamp('next_maintenance_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull()
}, (table) => ({
  tenantIdx: index('assets_tenant_idx').on(table.tenantId),
  locationIdx: index('assets_location_idx').on(table.locationId),
  tagIdx: index('assets_tag_idx').on(table.tag),
  criticality_idx: index('assets_criticality_idx').on(table.criticality),
  nextMaintenanceIdx: index('assets_next_maintenance_idx').on(table.nextMaintenanceDate),
}));

// Maintenance Plans - Planos de manutenção preventiva
export const maintenancePlans = pgTable('maintenance_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  triggerType: varchar('trigger_type', { length: 20 }).notNull().$type<'time' | 'meter' | 'condition'>(),
  frequencyJson: jsonb('frequency_json').notNull(), // MaintenanceFrequency
  tasksTemplateJson: jsonb('tasks_template_json').notNull(), // MaintenanceTask[]
  slaPolicy: varchar('sla_policy', { length: 255 }),
  priority: varchar('priority', { length: 20 }).notNull().$type<'low' | 'medium' | 'high' | 'critical'>(),
  estimatedDuration: integer('estimated_duration').notNull(), // em minutos
  leadTime: integer('lead_time').notNull().default(24), // antecedência em horas
  seasonalAdjustmentsJson: jsonb('seasonal_adjustments_json'),
  isActive: boolean('is_active').notNull().default(true),
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  lastGeneratedAt: timestamp('last_generated_at'),
  nextScheduledAt: timestamp('next_scheduled_at'),
  generationCount: integer('generation_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull()
}, (table) => ({
  tenantIdx: index('maintenance_plans_tenant_idx').on(table.tenantId),
  assetIdx: index('maintenance_plans_asset_idx').on(table.assetId),
  triggerIdx: index('maintenance_plans_trigger_idx').on(table.triggerType),
  nextScheduledIdx: index('maintenance_plans_next_scheduled_idx').on(table.nextScheduledAt),
  activeIdx: index('maintenance_plans_active_idx').on(table.isActive),
}));

// Work Orders - Ordens de serviço
export const workOrders = pgTable('work_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  assetId: uuid('asset_id').notNull(),
  ticketId: uuid('ticket_id'), // vinculado a ticket se origem for incident
  maintenancePlanId: uuid('maintenance_plan_id'), // vinculado a plano se origem for PM
  origin: varchar('origin', { length: 20 }).notNull().$type<'pm' | 'incident' | 'manual' | 'condition'>(),
  priority: varchar('priority', { length: 20 }).notNull().$type<'low' | 'medium' | 'high' | 'critical' | 'emergency'>(),
  status: varchar('status', { length: 20 }).notNull().$type<'drafted' | 'scheduled' | 'in_progress' | 'waiting_parts' | 'waiting_window' | 'waiting_client' | 'completed' | 'approved' | 'closed' | 'rejected' | 'canceled'>(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  estimatedDuration: integer('estimated_duration').notNull(), // em minutos
  scheduledStart: timestamp('scheduled_start'),
  scheduledEnd: timestamp('scheduled_end'),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  slaTargetAt: timestamp('sla_target_at'),
  idlePolicyJson: jsonb('idle_policy_json'), // IdleTimePolicy
  assignedTechnicianId: uuid('assigned_technician_id'),
  assignedTeamId: uuid('assigned_team_id'),
  locationId: uuid('location_id').notNull(),
  contactPersonId: uuid('contact_person_id'),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  approvalWorkflowId: uuid('approval_workflow_id'),
  approvalStatus: varchar('approval_status', { length: 20 }).$type<'pending' | 'approved' | 'rejected'>(),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  laborCost: decimal('labor_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  partsCost: decimal('parts_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  externalCost: decimal('external_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  completionPercentage: integer('completion_percentage').notNull().default(0),
  notes: text('notes'),
  riskAssessmentJson: jsonb('risk_assessment_json'), // RiskAssessment
  permitsRequiredJson: jsonb('permits_required_json').$type<string[]>(),
  safetyRequirementsJson: jsonb('safety_requirements_json').$type<string[]>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull()
}, (table) => ({
  tenantIdx: index('work_orders_tenant_idx').on(table.tenantId),
  assetIdx: index('work_orders_asset_idx').on(table.assetId),
  statusIdx: index('work_orders_status_idx').on(table.status),
  priorityIdx: index('work_orders_priority_idx').on(table.priority),
  assignedTechnicianIdx: index('work_orders_assigned_technician_idx').on(table.assignedTechnicianId),
  scheduledStartIdx: index('work_orders_scheduled_start_idx').on(table.scheduledStart),
  slaTargetIdx: index('work_orders_sla_target_idx').on(table.slaTargetAt),
  originIdx: index('work_orders_origin_idx').on(table.origin),
}));

// Work Order Tasks - Tarefas das ordens de serviço
export const workOrderTasks = pgTable('work_order_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  workOrderId: uuid('work_order_id').notNull(),
  sequence: integer('sequence').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  estimatedDuration: integer('estimated_duration').notNull(), // em minutos
  requiredSkillsJson: jsonb('required_skills_json').$type<string[]>(),
  requiredCertificationsJson: jsonb('required_certifications_json'),
  checklistJson: jsonb('checklist_json'),
  requiredPartsJson: jsonb('required_parts_json'),
  dependenciesJson: jsonb('dependencies_json').$type<string[]>(), // IDs de outras tarefas
  status: varchar('status', { length: 20 }).notNull().$type<'pending' | 'doing' | 'blocked' | 'done' | 'verified'>(),
  assignedTechnicianId: uuid('assigned_technician_id'),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  notes: text('notes'),
  evidenceJson: jsonb('evidence_json'), // TaskEvidence[]
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('work_order_tasks_tenant_idx').on(table.tenantId),
  workOrderIdx: index('work_order_tasks_work_order_idx').on(table.workOrderId),
  statusIdx: index('work_order_tasks_status_idx').on(table.status),
  sequenceIdx: index('work_order_tasks_sequence_idx').on(table.sequence),
  assignedTechnicianIdx: index('work_order_tasks_assigned_technician_idx').on(table.assignedTechnicianId),
}));

// Technicians - Técnicos/Recursos humanos
export const technicians = pgTable('technicians', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(), // referência ao user do sistema
  employeeId: varchar('employee_id', { length: 50 }),
  skillsJson: jsonb('skills_json').$type<string[]>().notNull(),
  certificationsJson: jsonb('certifications_json').notNull(), // TechnicianCertification[]
  shiftId: uuid('shift_id'),
  homeBaseLocationId: uuid('home_base_location_id').notNull(),
  availabilityJson: jsonb('availability_json').notNull(), // TechnicianAvailability
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('technicians_tenant_idx').on(table.tenantId),
  userIdx: index('technicians_user_idx').on(table.userId),
  shiftIdx: index('technicians_shift_idx').on(table.shiftId),
  homeBaseIdx: index('technicians_home_base_idx').on(table.homeBaseLocationId),
  activeIdx: index('technicians_active_idx').on(table.isActive),
}));

// Work Shifts - Turnos de trabalho
export const workShifts = pgTable('work_shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  pattern: varchar('pattern', { length: 20 }).notNull().$type<'8x5' | '12x12' | '24x48' | 'custom'>(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:mm
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:mm
  workDaysJson: jsonb('work_days_json').$type<number[]>().notNull(), // 0=domingo, 1=segunda, etc.
  duration: integer('duration').notNull(), // em horas
  breakDuration: integer('break_duration').notNull().default(0), // em minutos
  calendarJson: jsonb('calendar_json').notNull(), // ShiftCalendar
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('work_shifts_tenant_idx').on(table.tenantId),
  patternIdx: index('work_shifts_pattern_idx').on(table.pattern),
  activeIdx: index('work_shifts_active_idx').on(table.isActive),
}));

// Schedules - Programação de trabalhos
export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  workOrderId: uuid('work_order_id').notNull(),
  technicianId: uuid('technician_id').notNull(),
  plannedStart: timestamp('planned_start').notNull(),
  plannedEnd: timestamp('planned_end').notNull(),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  status: varchar('status', { length: 20 }).notNull().$type<'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'canceled' | 'rescheduled'>(),
  routeSequence: integer('route_sequence'),
  travelTime: integer('travel_time').notNull().default(0), // em minutos
  setupTime: integer('setup_time').notNull().default(0), // em minutos
  estimatedEffort: integer('estimated_effort').notNull(), // em minutos
  actualEffort: integer('actual_effort'), // em minutos
  priority: integer('priority').notNull().default(5), // 1 = mais alta
  notes: text('notes'),
  constraintsJson: jsonb('constraints_json').notNull(), // SchedulingConstraint[]
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull()
}, (table) => ({
  tenantIdx: index('schedules_tenant_idx').on(table.tenantId),
  workOrderIdx: index('schedules_work_order_idx').on(table.workOrderId),
  technicianIdx: index('schedules_technician_idx').on(table.technicianId),
  plannedStartIdx: index('schedules_planned_start_idx').on(table.plannedStart),
  statusIdx: index('schedules_status_idx').on(table.status),
  priorityIdx: index('schedules_priority_idx').on(table.priority),
}));

// Parts Reservations - Reservas de peças
export const partsReservations = pgTable('parts_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  workOrderId: uuid('work_order_id').notNull(),
  materialServiceId: uuid('material_service_id').notNull(), // referência ao módulo materials-services
  quantityRequired: decimal('quantity_required', { precision: 10, scale: 3 }).notNull(),
  quantityReserved: decimal('quantity_reserved', { precision: 10, scale: 3 }).notNull().default('0'),
  quantityUsed: decimal('quantity_used', { precision: 10, scale: 3 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().$type<'pending' | 'reserved' | 'issued' | 'consumed' | 'returned'>(),
  isOptional: boolean('is_optional').notNull().default(false),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  reservedAt: timestamp('reserved_at'),
  issuedAt: timestamp('issued_at'),
  consumedAt: timestamp('consumed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('parts_reservations_tenant_idx').on(table.tenantId),
  workOrderIdx: index('parts_reservations_work_order_idx').on(table.workOrderId),
  materialServiceIdx: index('parts_reservations_material_service_idx').on(table.materialServiceId),
  statusIdx: index('parts_reservations_status_idx').on(table.status),
}));

// Time Entries - Registros de tempo
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  workOrderId: uuid('work_order_id').notNull(),
  technicianId: uuid('technician_id').notNull(),
  taskId: uuid('task_id'), // opcional, se específico para uma tarefa
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  type: varchar('type', { length: 20 }).notNull().$type<'travel' | 'work' | 'wait' | 'break' | 'setup'>(),
  notes: text('notes'),
  locationSnapshot: jsonb('location_snapshot'), // GPS coordinates se aplicável
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('time_entries_tenant_idx').on(table.tenantId),
  workOrderIdx: index('time_entries_work_order_idx').on(table.workOrderId),
  technicianIdx: index('time_entries_technician_idx').on(table.technicianId),
  typeIdx: index('time_entries_type_idx').on(table.type),
  startTimeIdx: index('time_entries_start_time_idx').on(table.startTime),
}));

// SLA Policies - Políticas de SLA
export const slaPolicies = pgTable('sla_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scopeJson: jsonb('scope_json').notNull(), // critérios de aplicação
  startConditionsJson: jsonb('start_conditions_json').notNull(),
  pauseConditionsJson: jsonb('pause_conditions_json'),
  stopConditionsJson: jsonb('stop_conditions_json').notNull(),
  targetMinutes: integer('target_minutes').notNull(),
  warningThresholdPercent: integer('warning_threshold_percent').notNull().default(80),
  escalationRulesJson: jsonb('escalation_rules_json'),
  calendarId: uuid('calendar_id'), // referência a calendário de trabalho
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull()
}, (table) => ({
  tenantIdx: index('sla_policies_tenant_idx').on(table.tenantId),
  activeIdx: index('sla_policies_active_idx').on(table.isActive),
}));

// Risk Permits - Permissões de risco
export const riskPermits = pgTable('risk_permits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  workOrderId: uuid('work_order_id').notNull(),
  permitType: varchar('permit_type', { length: 20 }).notNull().$type<'LOTO' | 'NR10' | 'NR35' | 'altura' | 'espaco_confinado' | 'soldagem'>(),
  status: varchar('status', { length: 20 }).notNull().$type<'pending' | 'issued' | 'active' | 'expired' | 'canceled'>(),
  issuedBy: uuid('issued_by').notNull(),
  approvedBy: uuid('approved_by'),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  hazardsJson: jsonb('hazards_json').$type<string[]>(),
  mitigationMeasuresJson: jsonb('mitigation_measures_json').$type<string[]>(),
  requiredPPEJson: jsonb('required_ppe_json').$type<string[]>(),
  documentsJson: jsonb('documents_json'), // anexos/certificados
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('risk_permits_tenant_idx').on(table.tenantId),
  workOrderIdx: index('risk_permits_work_order_idx').on(table.workOrderId),
  permitTypeIdx: index('risk_permits_permit_type_idx').on(table.permitType),
  statusIdx: index('risk_permits_status_idx').on(table.status),
  validUntilIdx: index('risk_permits_valid_until_idx').on(table.validUntil),
}));

// Zod Schemas para validação
export const insertAssetSchema = createInsertSchema(assets).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  updatedBy: true 
}).extend({
  parentAssetId: z.string().uuid().optional()
});

export const insertMaintenancePlanSchema = createInsertSchema(maintenancePlans).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  updatedBy: true,
  lastGeneratedAt: true,
  nextScheduledAt: true,
  generationCount: true
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  updatedBy: true,
  totalCost: true,
  laborCost: true,
  partsCost: true,
  externalCost: true,
  completionPercentage: true
});

export const insertTechnicianSchema = createInsertSchema(technicians).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true
});

// Tipos TypeScript
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type MaintenancePlan = typeof maintenancePlans.$inferSelect;
export type InsertMaintenancePlan = z.infer<typeof insertMaintenancePlanSchema>;

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;

export type WorkOrderTask = typeof workOrderTasks.$inferSelect;

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;

export type WorkShift = typeof workShifts.$inferSelect;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type PartsReservation = typeof partsReservations.$inferSelect;

export type TimeEntry = typeof timeEntries.$inferSelect;

export type SLAPolicy = typeof slaPolicies.$inferSelect;

export type RiskPermit = typeof riskPermits.$inferSelect;
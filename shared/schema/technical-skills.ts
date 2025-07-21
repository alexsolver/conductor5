import { pgTable, text, varchar, integer, decimal, timestamp, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './base';

// Tabela de Habilidades
export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // elétrica, redes, atendimento, etc.
  minLevelRequired: integer('min_level_required').default(1), // 1-5
  suggestedCertification: varchar('suggested_certification', { length: 255 }),
  certificationValidityMonths: integer('certification_validity_months'), // validade em meses
  description: text('description'),
  observations: text('observations'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// Tabela de Certificações
export const certifications = pgTable('certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  issuingOrganization: varchar('issuing_organization', { length: 255 }),
  description: text('description'),
  validityMonths: integer('validity_months'), // validade padrão em meses
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela pivot: Técnico x Habilidade
export const userSkills = pgTable('user_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  skillId: uuid('skill_id').references(() => skills.id).notNull(),
  proficiencyLevel: integer('proficiency_level').notNull(), // 1-5
  certificationId: uuid('certification_id').references(() => certifications.id),
  certificationNumber: varchar('certification_number', { length: 100 }),
  certificationIssuedAt: timestamp('certification_issued_at'),
  certificationExpiresAt: timestamp('certification_expires_at'),
  certificationFile: text('certification_file'), // URL/path do arquivo
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'), // média de avaliações
  totalEvaluations: integer('total_evaluations').default(0),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: uuid('assigned_by').references(() => users.id).notNull(),
  justification: text('justification'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de Avaliações de Habilidades por Cliente
export const skillEvaluations = pgTable('skill_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userSkillId: uuid('user_skill_id').references(() => userSkills.id).notNull(),
  ticketId: uuid('ticket_id'), // referência ao ticket que gerou a avaliação
  customerId: uuid('customer_id'), // quem avaliou
  rating: integer('rating').notNull(), // 1-5 estrelas
  comment: text('comment'),
  serviceDate: timestamp('service_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de Log de Alterações
export const skillChangeLogs = pgTable('skill_change_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userSkillId: uuid('user_skill_id').references(() => userSkills.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'created', 'updated', 'level_changed', 'certification_added', etc.
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  changedBy: uuid('changed_by').references(() => users.id).notNull(),
  reason: text('reason'),
  automaticChange: boolean('automatic_change').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schemas Zod para validação
export const insertSkillSchema = createInsertSchema(skills, {
  name: z.string().min(1, "Nome é obrigatório").max(255),
  category: z.string().min(1, "Categoria é obrigatória").max(100),
  minLevelRequired: z.number().int().min(1).max(5).default(1),
  certificationValidityMonths: z.number().int().positive().optional(),
  description: z.string().optional(),
  observations: z.string().optional(),
});

export const insertCertificationSchema = createInsertSchema(certifications, {
  name: z.string().min(1, "Nome é obrigatório").max(255),
  issuingOrganization: z.string().max(255).optional(),
  description: z.string().optional(),
  validityMonths: z.number().int().positive().optional(),
});

export const insertUserSkillSchema = createInsertSchema(userSkills, {
  userId: z.string().uuid("ID do usuário inválido"),
  skillId: z.string().uuid("ID da habilidade inválido"),
  proficiencyLevel: z.number().int().min(1, "Nível mínimo é 1").max(5, "Nível máximo é 5"),
  certificationId: z.string().uuid().optional(),
  certificationNumber: z.string().max(100).optional(),
  certificationIssuedAt: z.date().optional(),
  certificationExpiresAt: z.date().optional(),
  justification: z.string().optional(),
});

export const insertSkillEvaluationSchema = createInsertSchema(skillEvaluations, {
  userSkillId: z.string().uuid("ID da habilidade do usuário inválido"),
  ticketId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  rating: z.number().int().min(1, "Avaliação mínima é 1").max(5, "Avaliação máxima é 5"),
  comment: z.string().optional(),
  serviceDate: z.date(),
});

// Tipos TypeScript
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;

export type SkillEvaluation = typeof skillEvaluations.$inferSelect;
export type InsertSkillEvaluation = z.infer<typeof insertSkillEvaluationSchema>;

export type SkillChangeLog = typeof skillChangeLogs.$inferSelect;

// Enums e constantes
export const PROFICIENCY_LEVELS = {
  1: { name: 'Básico', description: 'Conhecimento introdutório, precisa de supervisão', stars: 1 },
  2: { name: 'Intermediário', description: 'Executa tarefas com alguma autonomia', stars: 2 },
  3: { name: 'Avançado', description: 'Executa com autonomia, lida com situações variadas', stars: 3 },
  4: { name: 'Especialista', description: 'Referência técnica interna, resolve problemas críticos', stars: 4 },
  5: { name: 'Excelência', description: 'Comprovada por resultados e avaliações de clientes', stars: 5 },
} as const;

export const SKILL_CATEGORIES = [
  'elétrica',
  'redes',
  'atendimento',
  'hardware',
  'software',
  'segurança',
  'instalação',
  'manutenção',
  'suporte',
  'certificação',
] as const;

// Helpers para validação automática de nível 5
export const AUTO_LEVEL_5_CRITERIA = {
  minAverageRating: 4.8,
  minEvaluations: 10,
  maxSlaBreaches: 0,
} as const;
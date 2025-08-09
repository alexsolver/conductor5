import { z } from 'zod';

// Schema para criação de entrada de timecard
export const createTimecardEntrySchema = z.object({
  userId: z.string().uuid().optional(), // Será preenchido pelo backend via JWT
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  breakStart: z.string().datetime().optional(),
  breakEnd: z.string().datetime().optional(),
  totalHours: z.number().positive().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  isManualEntry: z.boolean().default(false),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

// Schema para solicitação de ausência
export const createAbsenceRequestSchema = z.object({
  userId: z.string().uuid(),
  absenceType: z.enum(['vacation', 'sick_leave', 'maternity', 'personal', 'training']),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  medicalCertificate: z.string().optional(),
  coverUserId: z.string().uuid().optional(),
});

// Schema para template de escala
export const createScheduleTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  scheduleType: z.string(),
  workDays: z.array(z.number().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido').optional(),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido').optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido').optional(),
  breakDurationMinutes: z.number().min(0).max(480).optional(),
  useWeeklySchedule: z.boolean().optional().default(false),
  weeklySchedule: z.record(z.object({
    startTime: z.string(),
    endTime: z.string(),
    breakDurationMinutes: z.number()
  })).optional(),
  category: z.enum(['default', 'custom']).optional().default('custom'),
  flexibilityWindow: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Schema para arranjo de trabalho flexível
export const createFlexibleWorkArrangementSchema = z.object({
  userId: z.string().uuid(),
  arrangementType: z.enum(['remote_work', 'flexible_hours', 'compressed_week']),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  workingHours: z.string().optional(),
  workLocation: z.string().optional(),
  justification: z.string().min(1, 'Justificativa é obrigatória'),
});

export type CreateTimecardEntryInput = z.infer<typeof createTimecardEntrySchema>;
export type CreateAbsenceRequestInput = z.infer<typeof createAbsenceRequestSchema>;
export type CreateScheduleTemplateInput = z.infer<typeof createScheduleTemplateSchema>;
export type CreateFlexibleWorkArrangementInput = z.infer<typeof createFlexibleWorkArrangementSchema>;

const dayScheduleSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  breakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  breakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  breakDurationMinutes: z.number().min(0).max(480).default(60)
});

const weeklyScheduleSchema = z.object({
  monday: dayScheduleSchema.optional(),
  tuesday: dayScheduleSchema.optional(),
  wednesday: dayScheduleSchema.optional(),
  thursday: dayScheduleSchema.optional(),
  friday: dayScheduleSchema.optional(),
  saturday: dayScheduleSchema.optional(),
  sunday: dayScheduleSchema.optional()
});

export const createWorkScheduleSchema = z.object({
  userId: z.string().uuid(),
  scheduleName: z.string().min(1, 'Nome da escala é obrigatório'),
  scheduleType: z.enum(['5x2', '6x1', '12x36', 'shift', 'flexible', 'intermittent']),
  startDate: z.string(),
  endDate: z.string().optional(),
  workDays: z.array(z.string()),
  // Campos legados (opcionais se useWeeklySchedule = true)
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  breakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  breakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  breakDurationMinutes: z.number().min(0).max(480).default(60),
  // Novos campos
  useWeeklySchedule: z.boolean().default(false),
  weeklySchedule: weeklyScheduleSchema.optional()
}).refine((data) => {
  // Se usar horário semanal, weeklySchedule deve estar presente
  if (data.useWeeklySchedule) {
    return data.weeklySchedule && Object.keys(data.weeklySchedule).length > 0;
  }
  // Se não usar horário semanal, campos legados devem estar presentes
  return data.startTime && data.endTime;
}, {
  message: "Horários são obrigatórios"
});

export type CreateWorkScheduleInput = z.infer<typeof createWorkScheduleSchema>;
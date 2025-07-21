import { pgTable, text, varchar, timestamp, integer, boolean, decimal, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabela principal de registros de ponto
export const timeRecords = pgTable("time_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  
  // Dados do registro
  recordDateTime: timestamp("record_date_time").notNull(),
  recordType: varchar("record_type", { length: 20 }).notNull(), // 'clock_in', 'clock_out', 'break_start', 'break_end'
  deviceType: varchar("device_type", { length: 20 }).notNull(), // 'web', 'mobile', 'totem', 'api', 'biometric'
  
  // Localização e segurança
  ipAddress: varchar("ip_address", { length: 45 }),
  location: json("location").$type<{ latitude: number; longitude: number; address?: string }>(),
  biometricHash: varchar("biometric_hash", { length: 255 }), // Hash da biometria para LGPD
  faceRecognitionData: json("face_recognition_data"), // Dados do reconhecimento facial
  
  // Compliance e auditoria
  isOfflineRecord: boolean("is_offline_record").default(false),
  syncedAt: timestamp("synced_at"),
  originalDeviceId: varchar("original_device_id", { length: 100 }),
  
  // Justificativas e aprovações
  notes: text("notes"),
  isAdjusted: boolean("is_adjusted").default(false),
  adjustedBy: varchar("adjusted_by", { length: 36 }),
  adjustedReason: text("adjusted_reason"),
  approvedBy: varchar("approved_by", { length: 36 }),
  approvedAt: timestamp("approved_at"),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Espelho de ponto diário
export const dailyTimesheet = pgTable("daily_timesheet", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  
  // Data de referência
  workDate: timestamp("work_date").notNull(),
  
  // Horários registrados
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  breakStart: timestamp("break_start"),
  breakEnd: timestamp("break_end"),
  lunchStart: timestamp("lunch_start"),
  lunchEnd: timestamp("lunch_end"),
  
  // Cálculos de horas
  totalWorkedHours: varchar("total_worked_hours", { length: 10 }),
  regularHours: varchar("regular_hours", { length: 10 }),
  overtimeHours: varchar("overtime_hours", { length: 10 }),
  nightShiftHours: varchar("night_shift_hours", { length: 10 }),
  breakMinutes: integer("break_minutes"),
  
  // Status e validação
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'validated', 'inconsistent', 'approved'
  hasInconsistencies: boolean("has_inconsistencies").default(false),
  inconsistencyReasons: json("inconsistency_reasons").$type<string[]>(),
  
  // Workflow de aprovação
  requiresApproval: boolean("requires_approval").default(false),
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by", { length: 36 }),
  approvedAt: timestamp("approved_at"),
  
  // Assinatura digital
  digitalSignature: varchar("digital_signature", { length: 500 }),
  signedAt: timestamp("signed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Banco de horas
export const hourBank = pgTable("hour_bank", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  
  // Período de referência
  referenceDate: timestamp("reference_date").notNull(),
  
  // Saldos
  balanceHours: varchar("balance_hours", { length: 10 }).notNull(),
  accumulatedHours: varchar("accumulated_hours", { length: 10 }).default("0"),
  usedHours: varchar("used_hours", { length: 10 }).default("0"),
  expiredHours: varchar("expired_hours", { length: 10 }).default("0"),
  
  // Regras de vencimento
  expirationPolicy: varchar("expiration_policy", { length: 20 }).default("6_months"), // '6_months', '12_months', 'no_expiration'
  expirationDate: timestamp("expiration_date"),
  
  // Tipo de movimento
  movementType: varchar("movement_type", { length: 20 }).notNull(), // 'credit', 'debit', 'adjustment', 'expiration'
  description: text("description"),
  relatedTimesheetId: varchar("related_timesheet_id", { length: 36 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jornadas e escalas de trabalho
export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  
  // Identificação
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  
  // Tipo de escala
  scheduleType: varchar("schedule_type", { length: 20 }).notNull(), // '5x2', '6x1', '12x36', 'plantao', 'intermitente'
  
  // Configurações de horário
  workDaysPerWeek: integer("work_days_per_week").notNull(),
  hoursPerDay: varchar("hours_per_day", { length: 8 }).notNull(),
  hoursPerWeek: varchar("hours_per_week", { length: 8 }).notNull(),
  
  // Horários padrão
  standardStart: varchar("standard_start", { length: 5 }), // HH:MM
  standardEnd: varchar("standard_end", { length: 5 }), // HH:MM
  breakDuration: integer("break_duration"), // minutos
  lunchDuration: integer("lunch_duration"), // minutos
  
  // Regras específicas
  allowsFlexTime: boolean("allows_flex_time").default(false),
  flexTimeToleranceMinutes: integer("flex_time_tolerance_minutes").default(0),
  nightShiftStart: varchar("night_shift_start", { length: 5 }), // HH:MM
  nightShiftEnd: varchar("night_shift_end", { length: 5 }), // HH:MM
  
  // Regras de banco de horas
  allowsHourBank: boolean("allows_hour_bank").default(true),
  hourBankLimit: varchar("hour_bank_limit", { length: 8 }),
  overtimeMultiplier: varchar("overtime_multiplier", { length: 6 }).default("1.5"),
  
  // Configurações avançadas
  configuration: json("configuration"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alertas e inconsistências
export const timeAlerts = pgTable("time_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  
  // Tipo de alerta
  alertType: varchar("alert_type", { length: 30 }).notNull(), // 'missing_record', 'duplicate_record', 'overtime_exceeded', 'incomplete_shift'
  severity: varchar("severity", { length: 10 }).notNull(), // 'low', 'medium', 'high', 'critical'
  
  // Dados do alerta
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  relatedDate: timestamp("related_date"),
  relatedRecordId: varchar("related_record_id", { length: 36 }),
  
  // Status
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'acknowledged', 'resolved', 'dismissed'
  resolvedBy: varchar("resolved_by", { length: 36 }),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Notificações
  notifiedManagers: json("notified_managers").$type<string[]>(),
  notifiedHR: boolean("notified_hr").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Logs de auditoria imutáveis
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  
  // Identificação da ação
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'time_record', 'timesheet', 'hour_bank'
  entityId: varchar("entity_id", { length: 36 }).notNull(),
  action: varchar("action", { length: 20 }).notNull(), // 'create', 'update', 'delete', 'approve', 'adjust'
  
  // Dados da alteração
  userId: varchar("user_id", { length: 36 }).notNull(),
  userRole: varchar("user_role", { length: 50 }),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  
  // Contexto
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceInfo: json("device_info"),
  
  // Compliance
  legalJustification: text("legal_justification"),
  approvalRequired: boolean("approval_required").default(false),
  approvedBy: varchar("approved_by", { length: 36 }),
  
  // Assinatura digital para imutabilidade
  digitalHash: varchar("digital_hash", { length: 255 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Esquemas Zod para validação
export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyTimesheetSchema = createInsertSchema(dailyTimesheet).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHourBankSchema = createInsertSchema(hourBank).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkScheduleSchema = createInsertSchema(workSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeAlertSchema = createInsertSchema(timeAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos TypeScript
export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;

export type DailyTimesheet = typeof dailyTimesheet.$inferSelect;
export type InsertDailyTimesheet = z.infer<typeof insertDailyTimesheetSchema>;

export type HourBank = typeof hourBank.$inferSelect;
export type InsertHourBank = z.infer<typeof insertHourBankSchema>;

export type WorkSchedule = typeof workSchedules.$inferSelect;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;

export type TimeAlert = typeof timeAlerts.$inferSelect;
export type InsertTimeAlert = z.infer<typeof insertTimeAlertSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
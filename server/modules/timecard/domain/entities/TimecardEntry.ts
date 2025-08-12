/**
 * TimecardEntry Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module TimecardEntryEntity
 * @created 2025-08-12 - Phase 16 Clean Architecture Implementation
 */

export interface TimecardEntry {
  id: string;
  tenantId: string;
  userId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalWorkedMinutes: number;
  breakDurationMinutes: number;
  overtimeMinutes: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  location?: string;
  ipAddress?: string;
  device?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSchedule {
  id: string;
  tenantId: string;
  userId: string;
  scheduleName: string;
  scheduleType: '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent';
  startDate: Date;
  endDate?: Date;
  workDays: number[]; // 0-6 (Sunday to Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakDurationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HourBank {
  id: string;
  tenantId: string;
  userId: string;
  month: string; // YYYY-MM format
  accumulatedMinutes: number;
  usedMinutes: number;
  balanceMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AbsenceRequest {
  id: string;
  tenantId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: 'vacation' | 'sick' | 'personal' | 'emergency' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Timecard Business Rules and Validations
 */
export class TimecardDomainService {
  /**
   * Validate timecard entry business rules
   */
  static validateTimecardEntry(entry: Partial<TimecardEntry>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry.tenantId) errors.push('Tenant ID é obrigatório');
    if (!entry.userId) errors.push('User ID é obrigatório');
    if (!entry.date) errors.push('Data é obrigatória');

    // Check-in must be before check-out
    if (entry.checkIn && entry.checkOut && entry.checkIn >= entry.checkOut) {
      errors.push('Horário de entrada deve ser anterior ao horário de saída');
    }

    // Break validation
    if (entry.breakStart && entry.breakEnd) {
      if (entry.breakStart >= entry.breakEnd) {
        errors.push('Início do intervalo deve ser anterior ao fim do intervalo');
      }

      if (entry.checkIn && entry.breakStart < entry.checkIn) {
        errors.push('Intervalo não pode começar antes da entrada');
      }

      if (entry.checkOut && entry.breakEnd > entry.checkOut) {
        errors.push('Intervalo não pode terminar depois da saída');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate worked minutes
   */
  static calculateWorkedMinutes(checkIn: Date, checkOut: Date, breakDurationMinutes: number = 0): number {
    const totalMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
    return Math.max(0, totalMinutes - breakDurationMinutes);
  }

  /**
   * Calculate overtime minutes
   */
  static calculateOvertimeMinutes(workedMinutes: number, scheduledMinutes: number = 480): number {
    return Math.max(0, workedMinutes - scheduledMinutes);
  }

  /**
   * Validate work schedule
   */
  static validateWorkSchedule(schedule: Partial<WorkSchedule>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schedule.tenantId) errors.push('Tenant ID é obrigatório');
    if (!schedule.userId) errors.push('User ID é obrigatório');
    if (!schedule.scheduleName) errors.push('Nome do cronograma é obrigatório');
    if (!schedule.scheduleType) errors.push('Tipo de cronograma é obrigatório');
    if (!schedule.startDate) errors.push('Data de início é obrigatória');
    if (!schedule.workDays || schedule.workDays.length === 0) {
      errors.push('Pelo menos um dia da semana deve ser selecionado');
    }

    // Time format validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (schedule.startTime && !timeRegex.test(schedule.startTime)) {
      errors.push('Formato de horário de início inválido');
    }
    if (schedule.endTime && !timeRegex.test(schedule.endTime)) {
      errors.push('Formato de horário de fim inválido');
    }

    // Start time must be before end time
    if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) {
      errors.push('Horário de início deve ser anterior ao horário de fim');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Check if date is a work day according to schedule
   */
  static isWorkDay(date: Date, workDays: number[]): boolean {
    const dayOfWeek = date.getDay();
    return workDays.includes(dayOfWeek);
  }

  /**
   * Calculate expected work minutes for a day
   */
  static calculateExpectedWorkMinutes(startTime: string, endTime: string, breakDurationMinutes: number = 0): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    const totalMinutes = endMinutes - startMinutes;
    return Math.max(0, totalMinutes - breakDurationMinutes);
  }
}
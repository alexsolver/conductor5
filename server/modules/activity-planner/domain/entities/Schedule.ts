/**
 * Schedule Entity - Entidade de domínio para programação de trabalhos
 * Representa alocação de recursos e tempo para ordens de serviço
 * Seguindo padrões Clean Architecture e 1qa.md
 */

export interface Technician {
  id: string;
  tenantId: string;
  userId: string;
  employeeId?: string;
  skillsJson: string[];
  certificationsJson: TechnicianCertification[];
  shiftId?: string;
  homeBaseLocationId: string;
  availabilityJson: TechnicianAvailability;
  hourlyRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnicianCertification {
  name: string;
  level: string;
  expiryDate?: Date;
  issuedBy: string;
  certificateNumber?: string;
}

export interface TechnicianAvailability {
  timezone: string;
  workingHours: {
    [day: string]: { start: string; end: string; }; // 'monday': { start: '08:00', end: '17:00' }
  };
  vacations: TimeRange[];
  unavailable: TimeRange[];
  preferences: {
    preferredShifts?: string[];
    maxWorkingHours?: number;
    preferredLocations?: string[];
  };
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface WorkShift {
  id: string;
  tenantId: string;
  name: string;
  pattern: '8x5' | '12x12' | '24x48' | 'custom';
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  workDays: number[]; // 0=domingo, 1=segunda, etc.
  duration: number; // em horas
  breakDuration: number; // em minutos
  calendarJson: ShiftCalendar;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftCalendar {
  holidays: Date[];
  specialDays: { date: Date; type: 'overtime' | 'reduced' | 'off'; };
  rotationCycle?: number; // dias para completar o ciclo
}

export interface Schedule {
  id: string;
  tenantId: string;
  workOrderId: string;
  technicianId: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: ScheduleStatus;
  routeSequence?: number; // ordem na rota do técnico
  travelTime: number; // em minutos
  setupTime: number; // em minutos
  estimatedEffort: number; // em minutos
  actualEffort?: number; // em minutos
  priority: number; // para ordenação (1 = mais alta)
  notes?: string;
  constraints: SchedulingConstraint[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type ScheduleStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'canceled' 
  | 'rescheduled';

export interface SchedulingConstraint {
  type: 'time_window' | 'skill_required' | 'certification_required' | 'location_proximity' | 'equipment_required';
  value: any;
  isMandatory: boolean;
  description?: string;
}

export interface RouteOptimization {
  technicianId: string;
  date: Date;
  schedules: Schedule[];
  totalTravelTime: number; // em minutos
  totalDistance: number; // em km
  optimizationScore: number; // 0-100
  suggestions?: string[];
}

export interface SchedulingConflict {
  type: 'double_booking' | 'skill_mismatch' | 'certification_expired' | 'travel_time_exceeded' | 'overtime_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSchedules: string[];
  description: string;
  suggestions: string[];
}

export interface InsertSchedule {
  tenantId: string;
  workOrderId: string;
  technicianId: string;
  plannedStart: Date;
  plannedEnd: Date;
  routeSequence?: number;
  travelTime: number;
  setupTime: number;
  estimatedEffort: number;
  priority: number;
  notes?: string;
  constraints: SchedulingConstraint[];
  createdBy: string;
}

export class ScheduleEntity {
  constructor(private schedule: Schedule) {}

  getId(): string {
    return this.schedule.id;
  }

  getTenantId(): string {
    return this.schedule.tenantId;
  }

  getWorkOrderId(): string {
    return this.schedule.workOrderId;
  }

  getTechnicianId(): string {
    return this.schedule.technicianId;
  }

  getStatus(): ScheduleStatus {
    return this.schedule.status;
  }

  getPlannedStart(): Date {
    return this.schedule.plannedStart;
  }

  getPlannedEnd(): Date {
    return this.schedule.plannedEnd;
  }

  getEstimatedEffort(): number {
    return this.schedule.estimatedEffort;
  }

  getTravelTime(): number {
    return this.schedule.travelTime;
  }

  getPriority(): number {
    return this.schedule.priority;
  }

  isScheduled(): boolean {
    return this.schedule.status === 'scheduled';
  }

  isInProgress(): boolean {
    return this.schedule.status === 'in_progress';
  }

  isCompleted(): boolean {
    return this.schedule.status === 'completed';
  }

  canStart(): boolean {
    return this.schedule.status === 'scheduled' || this.schedule.status === 'confirmed';
  }

  canReschedule(): boolean {
    return !['completed', 'canceled'].includes(this.schedule.status);
  }

  start(): void {
    if (!this.canStart()) {
      throw new Error('Schedule cannot be started in current state');
    }
    this.schedule.status = 'in_progress';
    this.schedule.actualStart = new Date();
    this.schedule.updatedAt = new Date();
  }

  complete(): void {
    if (this.schedule.status !== 'in_progress') {
      throw new Error('Schedule must be in progress to complete');
    }
    this.schedule.status = 'completed';
    this.schedule.actualEnd = new Date();
    this.schedule.updatedAt = new Date();
  }

  cancel(reason?: string): void {
    if (!this.canReschedule()) {
      throw new Error('Schedule cannot be canceled in current state');
    }
    this.schedule.status = 'canceled';
    if (reason) {
      this.schedule.notes = (this.schedule.notes || '') + `\n[CANCELED] ${reason}`;
    }
    this.schedule.updatedAt = new Date();
  }

  reschedule(newStart: Date, newEnd: Date): void {
    if (!this.canReschedule()) {
      throw new Error('Schedule cannot be rescheduled in current state');
    }
    this.schedule.plannedStart = newStart;
    this.schedule.plannedEnd = newEnd;
    this.schedule.status = 'rescheduled';
    this.schedule.updatedAt = new Date();
  }

  confirm(): void {
    if (this.schedule.status !== 'scheduled') {
      throw new Error('Only scheduled items can be confirmed');
    }
    this.schedule.status = 'confirmed';
    this.schedule.updatedAt = new Date();
  }

  calculateDuration(): number {
    const start = this.schedule.actualStart || this.schedule.plannedStart;
    const end = this.schedule.actualEnd || this.schedule.plannedEnd;
    return end.getTime() - start.getTime();
  }

  calculateEfficiency(): number | null {
    if (!this.schedule.actualEffort) return null;
    return (this.schedule.estimatedEffort / this.schedule.actualEffort) * 100;
  }

  isOverdue(): boolean {
    if (this.schedule.status === 'completed') return false;
    return new Date() > this.schedule.plannedEnd;
  }

  getConstraints(): SchedulingConstraint[] {
    return this.schedule.constraints;
  }

  hasConstraint(type: string): boolean {
    return this.schedule.constraints.some(c => c.type === type);
  }

  getMandatoryConstraints(): SchedulingConstraint[] {
    return this.schedule.constraints.filter(c => c.isMandatory);
  }

  validateConstraints(technician: Technician, workOrder: any): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];

    this.schedule.constraints.forEach(constraint => {
      switch (constraint.type) {
        case 'skill_required':
          if (!technician.skillsJson.includes(constraint.value)) {
            conflicts.push({
              type: 'skill_mismatch',
              severity: constraint.isMandatory ? 'critical' : 'medium',
              affectedSchedules: [this.schedule.id],
              description: `Técnico não possui a habilidade: ${constraint.value}`,
              suggestions: ['Atribuir outro técnico', 'Providenciar treinamento']
            });
          }
          break;

        case 'certification_required':
          const cert = technician.certificationsJson.find(c => c.name === constraint.value);
          if (!cert) {
            conflicts.push({
              type: 'certification_expired',
              severity: 'critical',
              affectedSchedules: [this.schedule.id],
              description: `Técnico não possui certificação: ${constraint.value}`,
              suggestions: ['Atribuir técnico certificado', 'Renovar certificação']
            });
          } else if (cert.expiryDate && cert.expiryDate < new Date()) {
            conflicts.push({
              type: 'certification_expired',
              severity: 'critical',
              affectedSchedules: [this.schedule.id],
              description: `Certificação expirada: ${constraint.value}`,
              suggestions: ['Renovar certificação', 'Atribuir outro técnico']
            });
          }
          break;
      }
    });

    return conflicts;
  }

  toPlainObject(): Schedule {
    return { ...this.schedule };
  }
}
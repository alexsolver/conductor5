// Domain entities should not depend on ORM libraries

export interface Schedule {
  id: string;
  agentId: string;
  scheduleDate: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleEntity implements Schedule {
  constructor(
    public id: string,
    public agentId: string,
    public scheduleDate: Date,
    public startTime: string,
    public endTime: string,
    public isAvailable: boolean,
    public tenantId: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  makeAvailable(): void {
    this.isAvailable = true;
    this.updatedAt = new Date();
  }

  makeUnavailable(): void {
    this.isAvailable = false;
    this.updatedAt = new Date();
  }

  updateSchedule(startTime: string, endTime: string): void {
    this.startTime = startTime;
    this.endTime = endTime;
    this.updatedAt = new Date();
  }
}

export interface ActivityTypeEntity {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  color: string; // Hex color
  duration: number; // Default duration in minutes
  category: 'visita_tecnica' | 'instalacao' | 'manutencao' | 'suporte';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentAvailabilityEntity {
  id: string;
  tenantId: string;
  agentId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakStartTime?: string;
  breakEndTime?: string;
  isAvailable: boolean;
  maxAppointments: number;
  preferredZones?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConflictEntity {
  id: string;
  tenantId: string;
  scheduleId: string;
  conflictWithScheduleId?: string;
  conflictType: 'time_overlap' | 'agent_unavailable' | 'location_conflict';
  conflictDetails?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  resolutionNotes?: string;
  createdAt: Date;
  resolvedAt?: Date;
}
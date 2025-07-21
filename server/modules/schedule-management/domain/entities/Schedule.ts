// Schedule Entity - Domain Layer
export interface ScheduleEntity {
  id: string;
  tenantId: string;
  agentId: string;
  customerId?: string;
  activityTypeId: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  locationAddress?: string;
  coordinates?: { lat: number; lng: number };
  internalNotes?: string;
  clientNotes?: string;
  estimatedTravelTime?: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  isRecurring: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  parentScheduleId?: string;
  createdAt: Date;
  updatedAt: Date;
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
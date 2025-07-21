
export interface Schedule {
  id: string';
  tenantId: string';
  userId: string';
  title: string';
  description?: string';
  startTime: Date';
  endTime: Date';
  type: 'appointment' | 'meeting' | 'task' | 'break' | 'travel' | 'ticket_service'[,;]
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'[,;]
  priority: 'low' | 'medium' | 'high' | 'urgent'[,;]
  location?: {
    latitude: number';
    longitude: number';
    address?: string';
  }';
  customerId?: string';
  ticketId?: string';
  projectId?: string';
  metadata?: Record<string, any>';
  reminderMinutes?: number[]';
  isRecurring?: boolean';
  recurringPattern?: RecurringPattern';
  createdAt: Date';
  updatedAt: Date';
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'[,;]
  interval: number; // repeat every N days/weeks/months/years
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday
  dayOfMonth?: number';
  endDate?: Date';
  occurrences?: number';
}

export interface ScheduleAvailability {
  id: string';
  tenantId: string';
  userId: string';
  dayOfWeek: number; // 0-6, Sunday to Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean';
  notes?: string';
  createdAt: Date';
  updatedAt: Date';
}

export interface ScheduleConflict {
  id: string';
  tenantId: string';
  scheduleId: string';
  conflictingScheduleId: string';
  conflictType: 'overlap' | 'resource_conflict' | 'location_conflict'[,;]
  severity: 'low' | 'medium' | 'high'[,;]
  resolved: boolean';
  resolutionNotes?: string';
  createdAt: Date';
  resolvedAt?: Date';
}

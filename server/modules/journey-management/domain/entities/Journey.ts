
export interface Journey {
  id: string;
  tenantId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  totalHours?: number;
  breakMinutes?: number;
  overtimeHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyCheckpoint {
  id: string;
  journeyId: string;
  tenantId: string;
  type: 'check_in' | 'check_out' | 'break_start' | 'break_end' | 'location_update';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface JourneyMetrics {
  id: string;
  journeyId: string;
  tenantId: string;
  date: Date;
  totalWorkingHours: number;
  breakHours: number;
  overtimeHours: number;
  productivity: number;
  distanceTraveled?: number;
  ticketsCompleted?: number;
  customerVisits?: number;
  createdAt: Date;
}

// Domain entities should not depend on ORM libraries

export interface Timecard {
  id: string;
  tenantId: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime?: string;
  totalHours?: number;
  status: string;
  notes?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTimecard {
  tenantId: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime?: string;
  totalHours?: number;
  status: string;
  notes?: string;
  location?: string;
}

export interface TimecardApproval {
  id: string;
  tenantId: string;
  timecardId: string;
  approverId: string;
  status: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTimecardApproval {
  tenantId: string;
  timecardId: string;
  approverId: string;
  status: string;
  approvedAt?: Date;
  notes?: string;
}

export interface WeeklySchedule {
  id: string;
  tenantId: string;
  userId: string;
  weekStartDate: Date;
  scheduleData: string;
  totalHours: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewWeeklySchedule {
  tenantId: string;
  userId: string;
  weekStartDate: Date;
  scheduleData: string;
  totalHours: number;
  status: string;
}

export * from './Timecard';
export * from './WorkSchedule';
export * from './TimecardEntry';
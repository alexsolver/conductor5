// Domain entities should not depend on ORM libraries

export { Timecard } from './Timecard';

export interface Timecard {
  id: string;
  tenantId: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakDuration: number;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TimecardEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly clockIn: Date,
    public readonly clockOut?: Date,
    public readonly status: string = 'active'
  ) {}

  // Pure data structure - business logic moved to domain services
}
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

export class TimecardEntity implements Timecard {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly date: Date;
  public readonly startTime: string;
  public readonly endTime: string;
  public readonly breakDuration: number;
  public readonly status: 'pending' | 'approved' | 'rejected';
  public readonly description?: string;
  public readonly location?: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(timecard: Timecard) {
    this.id = timecard.id;
    this.tenantId = timecard.tenantId;
    this.userId = timecard.userId;
    this.date = timecard.date;
    this.startTime = timecard.startTime;
    this.endTime = timecard.endTime;
    this.breakDuration = timecard.breakDuration;
    this.status = timecard.status;
    this.description = timecard.description;
    this.location = timecard.location;
    this.createdAt = timecard.createdAt;
    this.updatedAt = timecard.updatedAt;
  }

  public getTotalHours(): number {
    const start = new Date(`1970-01-01T${this.startTime}`);
    const end = new Date(`1970-01-01T${this.endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - (this.breakDuration / 60));
  }

  public isValidTimeRange(): boolean {
    const start = new Date(`1970-01-01T${this.startTime}`);
    const end = new Date(`1970-01-01T${this.endTime}`);
    return start < end;
  }

  public canBeApproved(): boolean {
    return this.status === 'pending' && this.isValidTimeRange();
  }
}
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

export interface TimecardProps {
  userId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  breakTime: number;
  status: string;
  tenantId: string;
}

export class TimecardEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly date: Date,
    public startTime: Date,
    public endTime: Date,
    public breakTime: number,
    public status: string,
    public readonly tenantId: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(props: TimecardProps, id: string): TimecardEntity {
    return new TimecardEntity(
      id,
      props.userId,
      props.date,
      props.startTime,
      props.endTime,
      props.breakTime,
      props.status,
      props.tenantId
    );
  }

  calculateWorkHours(): number {
    const diff = this.endTime.getTime() - this.startTime.getTime();
    const hours = diff / (1000 * 60 * 60);
    return Math.max(0, hours - (this.breakTime / 60));
  }

  isValid(): boolean {
    return !!(this.userId && this.date && this.startTime && this.endTime && this.tenantId);
  }
}
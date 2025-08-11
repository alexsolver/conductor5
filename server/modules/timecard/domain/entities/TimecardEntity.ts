// CLEAN ARCHITECTURE: Pure domain entity with business rules

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
    public modifiedAt: Date = new Date()
  ) {}

  // CLEANED: Factory method removed - creation logic moved to repository layer

  calculateWorkHours(): number {
    const diff = this.endTime.getTime() - this.startTime.getTime();
    const hours = diff / (1000 * 60 * 60);
    return Math.max(0, hours - (this.breakTime / 60));
  }

  isValid(): boolean {
    return !!(this.userId && this.date && this.startTime && this.endTime && this.tenantId);
  }
}
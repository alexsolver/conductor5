// Domain entity - no external dependencies
export class Timecard {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly date: Date,
    public readonly clockIn?: Date,
    public readonly clockOut?: Date,
    public readonly breakStart?: Date,
    public readonly breakEnd?: Date,
    public readonly totalHours?: number,
    public readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' = 'draft',
    public readonly notes?: string,
    public readonly location?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  public getTotalWorkedHours(): number {
    if (!this.clockIn || !this.clockOut) return 0;

    const workTime = this.clockOut.getTime() - this.clockIn.getTime();
    const breakTime = this.breakStart && this.breakEnd
      ? this.breakEnd.getTime() - this.breakStart.getTime()
      : 0;

    return (workTime - breakTime) / (1000 * 60 * 60); // Convert to hours
  }

  public isCompleted(): boolean {
    return this.clockIn !== undefined && this.clockOut !== undefined;
  }

  public canBeApproved(): boolean {
    return this.status === 'submitted' && this.isCompleted();
  }
}
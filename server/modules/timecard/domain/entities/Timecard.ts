
export class Timecard {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly date: Date,
    public readonly checkIn?: Date,
    public readonly checkOut?: Date,
    public readonly breakStart?: Date,
    public readonly breakEnd?: Date,
    public readonly notes?: string,
    public readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' = 'draft',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    userId: string,
    date: Date,
    checkIn?: Date,
    checkOut?: Date,
    breakStart?: Date,
    breakEnd?: Date,
    notes?: string
  ): Timecard {
    return new Timecard(id, tenantId, userId, date, checkIn, checkOut, breakStart, breakEnd, notes);
  }

  isValid(): boolean {
    return this.userId.length > 0 && this.tenantId.length > 0;
  }

  calculateWorkedHours(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    
    const workTime = this.checkOut.getTime() - this.checkIn.getTime();
    const breakTime = (this.breakStart && this.breakEnd) 
      ? this.breakEnd.getTime() - this.breakStart.getTime() 
      : 0;
    
    return Math.max(0, (workTime - breakTime) / (1000 * 60 * 60));
  }
}

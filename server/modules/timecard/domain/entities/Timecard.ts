// Domain layer não deve importar ORM diretamente
// Removed drizzle-orm dependency - Domain Layer should not depend on infrastructure
export class Timecard {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly date: Date,
    public readonly startTime?: Date,
    public readonly endTime?: Date,
    public readonly breakTime?: number,
    public readonly totalHours?: number,
    public readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' = 'draft',
    public readonly notes?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // CLEANED: Factory method removed - creation logic moved to application layer

  calculateTotalHours(): number {
    if (!this.startTime || !this.endTime) {
      return 0;
    }

    const diffMs = this.endTime.getTime() - this.startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const breakHours = (this.breakTime || 0) / 60;

    return Math.max(0, diffHours - breakHours);
  }

  validate(): boolean {
    return !!(this.userId && this.tenantId && this.date);
  }

  canBeSubmitted(): boolean {
    return this.status === 'draft' && !!this.startTime && !!this.endTime;
  }
}
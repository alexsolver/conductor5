
export class Schedule {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly title: string,
    public readonly description?: string,
    public readonly location?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  // Regras de negócio da entidade Schedule
  public isActive(): boolean {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime;
  }

  public isUpcoming(): boolean {
    const now = new Date();
    return now < this.startTime;
  }

  public duration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }
}

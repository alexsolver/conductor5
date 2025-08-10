
export class WorkingHours {
  private constructor(
    private readonly startTime: Date,
    private readonly endTime: Date
  ) {
    this.validate();
  }

  static create(startTime: Date, endTime: Date): WorkingHours {
    return new WorkingHours(startTime, endTime);
  }

  private validate(): void {
    if (this.startTime >= this.endTime) {
      throw new Error('Start time must be before end time');
    }

    const hoursDiff = (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      throw new Error('Working hours cannot exceed 24 hours');
    }
  }

  getTotalHours(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
  }

  getTotalMinutes(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
  }

  getStartTime(): Date {
    return new Date(this.startTime);
  }

  getEndTime(): Date {
    return new Date(this.endTime);
  }

  isOvertime(standardHours: number = 8): boolean {
    return this.getTotalHours() > standardHours;
  }

  getOvertimeHours(standardHours: number = 8): number {
    const total = this.getTotalHours();
    return total > standardHours ? total - standardHours : 0;
  }
}

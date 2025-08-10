
export class TimecardDate {
  private constructor(private readonly value: Date) {
    this.validate();
  }

  static create(date: string | Date): TimecardDate {
    const dateValue = typeof date === 'string' ? new Date(date) : date;
    return new TimecardDate(dateValue);
  }

  private validate(): void {
    if (isNaN(this.value.getTime())) {
      throw new Error('Invalid timecard date');
    }
  }

  getValue(): Date {
    return new Date(this.value);
  }

  toISOString(): string {
    return this.value.toISOString();
  }

  toDateString(): string {
    return this.value.toISOString().split('T')[0];
  }

  equals(other: TimecardDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}

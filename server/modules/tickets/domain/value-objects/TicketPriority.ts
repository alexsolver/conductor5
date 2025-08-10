
export class TicketPriority {
  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(value: string): TicketPriority {
    return new TicketPriority(value);
  }

  static readonly LOW = new TicketPriority('low');
  static readonly MEDIUM = new TicketPriority('medium');
  static readonly HIGH = new TicketPriority('high');
  static readonly CRITICAL = new TicketPriority('critical');

  private validate(value: string): void {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(value)) {
      throw new Error(`Invalid ticket priority: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TicketPriority): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

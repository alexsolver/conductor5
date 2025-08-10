
export class TicketStatus {
  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(value: string): TicketStatus {
    return new TicketStatus(value);
  }

  static readonly OPEN = new TicketStatus('open');
  static readonly IN_PROGRESS = new TicketStatus('in_progress');
  static readonly RESOLVED = new TicketStatus('resolved');
  static readonly CLOSED = new TicketStatus('closed');

  private validate(value: string): void {
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid ticket status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TicketStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

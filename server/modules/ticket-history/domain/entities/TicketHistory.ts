export interface ITicketHistory {
  id: string;
  ticketId: string;
  action: string;
  description: string;
  userId: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class TicketHistory {
  constructor(
    public readonly id: string,
    public readonly ticketId: string,
    public readonly action: string,
    public readonly description: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly metadata?: Record<string, any>
  ) {}

  static create(data: Omit<ITicketHistory, 'id' | 'createdAt'>): TicketHistory {
    return new TicketHistory(
      crypto.randomUUID(),
      data.ticketId,
      data.action,
      data.description,
      data.userId,
      new Date(),
      data.metadata
    );
  }
}
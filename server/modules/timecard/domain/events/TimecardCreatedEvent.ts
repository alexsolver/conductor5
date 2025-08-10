
export class TimecardCreatedEvent {
  constructor(
    public readonly timecardId: string,
    public readonly userId: string,
    public readonly date: Date,
    public readonly createdAt: Date = new Date()
  ) {}
}

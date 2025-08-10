
export class ScheduleCreatedEvent {
  constructor(
    public readonly scheduleId: string,
    public readonly customerId: string,
    public readonly scheduledAt: Date,
    public readonly createdAt: Date = new Date()
  ) {}
}

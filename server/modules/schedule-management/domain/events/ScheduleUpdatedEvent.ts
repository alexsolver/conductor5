
export class ScheduleUpdatedEvent {
  constructor(
    public readonly scheduleId: string,
    public readonly changes: Record<string, any>,
    public readonly updatedAt: Date = new Date()
  ) {}
}

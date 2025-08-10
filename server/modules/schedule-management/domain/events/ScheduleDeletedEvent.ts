
export class ScheduleDeletedEvent {
  constructor(
    public readonly scheduleId: string,
    public readonly deletedAt: Date = new Date()
  ) {}
}

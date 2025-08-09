
export class PersonCreatedEvent {
  constructor(
    public readonly personId: string,
    public readonly tenantId: string,
    public readonly occurredAt: Date = new Date()
  ) {}
}

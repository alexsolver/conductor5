
export class CustomFieldCreatedEvent {
  constructor(
    public readonly customFieldId: string,
    public readonly tenantId: string,
    public readonly occurredAt: Date = new Date()
  ) {}
}

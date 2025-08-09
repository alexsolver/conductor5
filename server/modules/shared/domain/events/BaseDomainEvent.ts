
export abstract class BaseDomainEvent {
  public readonly occurredOn: Date;
  public readonly eventType: string;

  constructor(eventType: string) {
    this.occurredOn = new Date();
    this.eventType = eventType;
  }
}

/**
 * User Created Domain Event
 * Clean Architecture - Domain Layer
 */

import { IDomainEvent } from '../../../shared/domain/IDomainEvent';

export class UserCreatedEvent implements IDomainEvent {
  public readonly eventName = 'UserCreated';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string,
    public readonly tenantId: string | null,
    public readonly passwordHash: string,
    public readonly firstName: string | null = null,
    public readonly lastName: string | null = null,
    occurredOn?: Date
  ) {
    this.aggregateId = userId;
    this.occurredOn = occurredOn || new Date();
  }

  getEventData(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      role: this.role,
      tenantId: this.tenantId,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      occurredOn: this.occurredOn
    };
  }
}
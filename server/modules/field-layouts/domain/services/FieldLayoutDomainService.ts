
import { FieldLayoutCreatedEvent } from '../events/FieldLayoutCreatedEvent';

export class FieldLayoutDomainService {
  validateFieldLayout(config: any): boolean {
    // Domain validation logic
    return config && typeof config === 'object';
  }

  createFieldLayoutEvent(fieldLayoutId: string, name: string, config: any, tenantId: string): FieldLayoutCreatedEvent {
    return {
      id: crypto.randomUUID(),
      fieldLayoutId,
      name,
      config,
      tenantId,
      createdAt: new Date(),
      eventType: 'FieldLayoutCreated'
    };
  }
}

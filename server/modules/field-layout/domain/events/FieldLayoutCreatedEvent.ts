
export interface FieldLayoutCreatedEvent {
  type: 'FieldLayoutCreated';
  aggregateId: string;
  tenantId: string;
  name: string;
  layout: any;
  timestamp: Date;
}

export const createFieldLayoutCreatedEvent = (
  aggregateId: string,
  tenantId: string,
  name: string,
  layout: any
): FieldLayoutCreatedEvent => ({
  type: 'FieldLayoutCreated',
  aggregateId,
  tenantId,
  name,
  layout,
  timestamp: new Date()
});

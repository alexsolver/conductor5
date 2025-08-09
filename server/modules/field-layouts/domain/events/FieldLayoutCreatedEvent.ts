
export interface FieldLayoutCreatedEvent {
  id: string;
  fieldLayoutId: string;
  name: string;
  config: any;
  tenantId: string;
  createdAt: Date;
  eventType: 'FieldLayoutCreated';
}

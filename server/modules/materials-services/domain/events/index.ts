
export interface MaterialCreatedEvent {
  id: string;
  name: string;
  createdAt: Date;
  tenantId: string;
}

export interface ServiceCreatedEvent {
  id: string;
  name: string;
  createdAt: Date;
  tenantId: string;
}

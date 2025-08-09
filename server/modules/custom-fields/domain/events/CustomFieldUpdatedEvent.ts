
export interface CustomFieldUpdatedEvent {
  id: string;
  customFieldId: string;
  changes: Record<string, any>;
  updatedBy: string;
  updatedAt: Date;
  tenantId: string;
}

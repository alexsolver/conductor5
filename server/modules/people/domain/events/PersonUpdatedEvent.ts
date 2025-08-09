
export interface PersonUpdatedEvent {
  id: string;
  personId: string;
  changes: Record<string, any>;
  updatedBy: string;
  updatedAt: Date;
  tenantId: string;
}

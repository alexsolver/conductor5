
export interface CustomFieldDeletedEvent {
  id: string;
  customFieldId: string;
  deletedBy: string;
  deletedAt: Date;
  tenantId: string;
}

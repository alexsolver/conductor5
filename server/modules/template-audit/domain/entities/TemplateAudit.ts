
export interface TemplateAudit {
  id: string;
  templateId: string;
  action: 'added' | 'changed' | 'removed';
  userId: string;
  changes: TemplateChanges;
  timestamp: Date;
  tenantId: string;
}

export interface TemplateChanges {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

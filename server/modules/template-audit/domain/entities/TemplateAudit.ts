
export interface TemplateAudit {
  id: string;
  templateId: string;
  action: 'created' | 'modified' | 'deleted';
  userId: string;
  changes: Record<string, any>;
  timestamp: Date;
  tenantId: string;
}

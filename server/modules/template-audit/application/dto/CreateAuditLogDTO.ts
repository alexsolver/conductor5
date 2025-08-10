
export interface CreateAuditLogDTO {
  templateId: string;
  action: string;
  userId: string;
  changes: Record<string, any>;
  tenantId: string;
}

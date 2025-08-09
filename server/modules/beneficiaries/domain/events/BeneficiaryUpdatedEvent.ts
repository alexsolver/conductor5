
export interface BeneficiaryUpdatedEvent {
  id: string;
  beneficiaryId: string;
  changes: Record<string, any>;
  updatedBy: string;
  updatedAt: Date;
  tenantId: string;
}

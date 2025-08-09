
export interface BeneficiaryDeletedEvent {
  id: string;
  beneficiaryId: string;
  deletedBy: string;
  deletedAt: Date;
  tenantId: string;
}

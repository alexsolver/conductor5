
export interface BeneficiaryCreatedEvent {
  type: 'BENEFICIARY_CREATED';
  aggregateId: string;
  payload: {
    beneficiaryId: string;
    name: string;
    email: string;
    createdAt: Date;
    tenantId: string;
  };
  occurredAt: Date;
}

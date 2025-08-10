
import { BaseDomainEvent } from '../../../shared/domain/events/BaseDomainEvent';

export interface BeneficiaryAssignedEventData {
  beneficiaryId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
}

export class BeneficiaryAssignedEvent extends BaseDomainEvent<BeneficiaryAssignedEventData> {
  constructor(data: BeneficiaryAssignedEventData) {
    super('BeneficiaryAssigned', data);
  }
}

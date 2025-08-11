import { BeneficiaryDeletedEvent } from '../../domain/events/BeneficiaryDeletedEvent';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export interface DeleteBeneficiaryRequest {
  id: string;
  deletedBy: string;
  tenantId: string;
}

export class DeleteBeneficiaryUseCase {
  constructor(
    private beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(id: string, tenantId: string): Promise<boolean> {
    const beneficiary = await this.beneficiaryRepository.findById(id);

    if (!beneficiary) {
      return false; // Indicate that the beneficiary was not found
    }

    await this.beneficiaryRepository.delete(id);

    const event: BeneficiaryDeletedEvent = {
      id: crypto.randomUUID(),
      beneficiaryId: id,
      deletedBy: 'system', // Placeholder, actual user info would come from context or another parameter
      deletedAt: new Date(),
      tenantId: tenantId
    };

    // Publish event logic would go here
    console.log('BeneficiaryDeletedEvent published:', event); // Placeholder for actual event publishing

    return true; // Indicate successful deletion
  }
}
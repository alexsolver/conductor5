
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

  async execute(request: DeleteBeneficiaryRequest): Promise<void> {
    const beneficiary = await this.beneficiaryRepository.findById(request.id);
    
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    await this.beneficiaryRepository.delete(request.id);

    const event: BeneficiaryDeletedEvent = {
      id: crypto.randomUUID(),
      beneficiaryId: request.id,
      deletedBy: request.deletedBy,
      deletedAt: new Date(),
      tenantId: request.tenantId
    };

    // Publish event logic would go here
  }
}
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export class DeleteBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const existingBeneficiary = await this.beneficiaryRepository.findById(id);
    if (!existingBeneficiary) {
      return false;
    }

    return await this.beneficiaryRepository.delete(id);
  }
}

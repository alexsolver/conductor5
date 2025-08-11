
/**
 * GetAllBeneficiariesUseCase - Clean Architecture Application Layer
 * Renamed from index.ts to follow [Action]UseCase pattern
 */

import { Beneficiary } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/ports/IBeneficiaryRepository';

export class GetAllBeneficiariesUseCase {
  constructor(
    private beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(tenantId: string): Promise<Beneficiary[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.beneficiaryRepository.findAll(tenantId);
  }
}


import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { Beneficiary } from '../../domain/entities/Beneficiary';

export class GetBeneficiariesUseCase {
  constructor(private beneficiaryRepository: IBeneficiaryRepository) {}

  async execute(tenantId: string, customerId?: string): Promise<Beneficiary[]> {
    if (customerId) {
      return await this.beneficiaryRepository.findByCustomerId(customerId, tenantId);
    }
    return await this.beneficiaryRepository.findAll(tenantId);
  }
}

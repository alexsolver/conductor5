
/**
 * APPLICATION USE CASE - DELETE BENEFICIARY
 * Clean Architecture: Application layer use case
 */

import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export class DeleteBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(id: string, tenantId: string): Promise<boolean> {
    if (!id?.trim()) {
      throw new Error('ID é obrigatório');
    }

    if (!tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório');
    }

    // Check if beneficiary exists
    const beneficiary = await this.beneficiaryRepository.findById(id, tenantId);

    if (!beneficiary) {
      throw new Error('Favorecido não encontrado');
    }

    // Delete the beneficiary
    await this.beneficiaryRepository.delete(id, tenantId);

    return true;
  }
}

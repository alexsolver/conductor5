
/**
 * APPLICATION USE CASE - UPDATE BENEFICIARY
 * Clean Architecture: Application layer use case
 */

import { Beneficiary } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { UpdateBeneficiaryDTO, BeneficiaryResponseDTO } from '../dto/CreateBeneficiaryDTO';

export class UpdateBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(
    id: string, 
    data: UpdateBeneficiaryDTO, 
    tenantId: string
  ): Promise<BeneficiaryResponseDTO | null> {
    
    // Find existing beneficiary
    const beneficiary = await this.beneficiaryRepository.findById(id, tenantId);

    if (!beneficiary) {
      throw new Error('Favorecido não encontrado');
    }

    // Validate email uniqueness if email is being changed
    if (data.email && data.email !== beneficiary.email) {
      const existingWithEmail = await this.beneficiaryRepository.existsByEmail(
        data.email,
        tenantId,
        id
      );

      if (existingWithEmail) {
        throw new Error('Já existe um favorecido com este email');
      }
    }

    // Create updated entity using domain method
    const updatedBeneficiary = beneficiary.update(data);

    // Validate email format if changed
    if (data.email && !updatedBeneficiary.validateEmail()) {
      throw new Error('Formato de email inválido');
    }

    // Persist changes
    await this.beneficiaryRepository.update(updatedBeneficiary);

    // Return response DTO
    return this.mapToResponseDTO(updatedBeneficiary);
  }

  private mapToResponseDTO(beneficiary: Beneficiary): BeneficiaryResponseDTO {
    return {
      id: beneficiary.id,
      tenantId: beneficiary.tenantId,
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      fullName: beneficiary.fullName,
      email: beneficiary.email,
      birthDate: beneficiary.birthDate,
      rg: beneficiary.rg,
      cpfCnpj: beneficiary.cpfCnpj,
      isActive: beneficiary.isActive,
      customerCode: beneficiary.customerCode,
      customerId: beneficiary.customerId,
      phone: beneficiary.phone,
      cellPhone: beneficiary.cellPhone,
      contactPerson: beneficiary.contactPerson,
      contactPhone: beneficiary.contactPhone,
      createdAt: beneficiary.createdAt.toISOString(),
      updatedAt: beneficiary.updatedAt.toISOString()
    };
  }
}

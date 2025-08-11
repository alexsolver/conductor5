
/**
 * APPLICATION USE CASE - CREATE BENEFICIARY
 * Clean Architecture: Application layer use case
 */

import { Beneficiary } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { CreateBeneficiaryDTO, BeneficiaryResponseDTO } from '../dto/CreateBeneficiaryDTO';

export class CreateBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(request: CreateBeneficiaryDTO): Promise<BeneficiaryResponseDTO> {
    // Business validation
    if (!request.firstName?.trim()) {
      throw new Error('Nome é obrigatório');
    }
    
    if (!request.lastName?.trim()) {
      throw new Error('Sobrenome é obrigatório');
    }
    
    if (!request.email?.trim()) {
      throw new Error('Email é obrigatório');
    }

    if (!request.tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório');
    }

    // Check if email already exists
    const existingBeneficiary = await this.beneficiaryRepository.findByEmail(
      request.email,
      request.tenantId
    );

    if (existingBeneficiary) {
      throw new Error('Já existe um favorecido com este email');
    }

    // Create domain entity
    const beneficiary = Beneficiary.create(
      request.tenantId,
      request.firstName.trim(),
      request.lastName.trim(),
      request.email.trim(),
      request.birthDate,
      request.rg,
      request.cpfCnpj,
      request.customerCode,
      request.customerId,
      request.phone,
      request.cellPhone,
      request.contactPerson,
      request.contactPhone
    );

    // Validate email format
    if (!beneficiary.validateEmail()) {
      throw new Error('Formato de email inválido');
    }

    // Persist through repository
    await this.beneficiaryRepository.save(beneficiary);

    // Return response DTO
    return this.mapToResponseDTO(beneficiary);
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

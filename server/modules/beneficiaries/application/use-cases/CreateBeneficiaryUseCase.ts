
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { Beneficiary } from '../../domain/entities/Beneficiary';
import { BeneficiaryDomainService } from '../../domain/services/BeneficiaryDomainService';
import { CreateBeneficiaryDTO } from '../dto/CreateBeneficiaryDTO';
import { randomUUID } from 'crypto';

export class CreateBeneficiaryUseCase {
  constructor(
    private beneficiaryRepository: IBeneficiaryRepository,
    private beneficiaryDomainService: BeneficiaryDomainService
  ) {}

  async execute(data: CreateBeneficiaryDTO): Promise<Beneficiary> {
    // Validate business rules
    await this.beneficiaryDomainService.validateBeneficiaryData(data);

    // Create beneficiary entity
    const beneficiary = new Beneficiary(
      randomUUID(),
      data.tenantId,
      data.name,
      data.email,
      data.phone,
      data.document,
      data.status || 'active',
      data.metadata || {},
      new Date(),
      new Date()
    );

    // Save to repository
    return await this.beneficiaryRepository.create(beneficiary);
  }
}

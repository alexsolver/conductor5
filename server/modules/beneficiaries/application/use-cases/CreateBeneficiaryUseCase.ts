
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { Beneficiary } from '../../domain/entities/Beneficiary';
import { BeneficiaryDomainService } from '../../domain/services/BeneficiaryDomainService';
import { CreateBeneficiaryDTO } from '../dto/CreateBeneficiaryDTO';

export class CreateBeneficiaryUseCase {
  constructor(
    private beneficiaryRepository: IBeneficiaryRepository,
    private beneficiaryDomainService: BeneficiaryDomainService
  ) {}

  async execute(data: CreateBeneficiaryDTO): Promise<Beneficiary> {
    // Validate business rules
    await this.beneficiaryDomainService.validateBeneficiaryData(data);

    // Create beneficiary entity
    const beneficiary = new Beneficiary({
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save to repository
    return await this.beneficiaryRepository.create(beneficiary);
  }
}

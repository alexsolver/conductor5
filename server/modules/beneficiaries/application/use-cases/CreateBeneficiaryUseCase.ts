/**
 * CreateBeneficiaryUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases to handle business logic
 */

// Removed express dependencies - Clean Architecture compliance

import { Beneficiary } from '../../domain/entities/Beneficiary';
import { CreateBeneficiaryDTO } from '../dtos/CreateBeneficiaryDTO'; // Assuming CreateBeneficiaryDTO is defined elsewhere

interface BeneficiaryRepositoryInterface {
  save(beneficiary: Beneficiary): Promise<void>;
}

// The original CreateBeneficiaryRequest and CreateBeneficiaryResponse interfaces are now represented by DTOs.
// Assuming CreateBeneficiaryDTO is defined in a separate file like ../dtos/CreateBeneficiaryDTO.ts

export class CreateBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: BeneficiaryRepositoryInterface
  ) {}

  async execute(request: CreateBeneficiaryDTO): Promise<Beneficiary> {
    // Business logic: Validate required fields
    if (!request.firstName || !request.lastName || !request.customerId) {
      throw new Error('First name, last name, and customer ID are required');
    }

    // Create domain entity
    const beneficiary = new Beneficiary(
      generateId(),
      request.tenantId,
      request.firstName,
      request.lastName,
      request.email,
      request.phone,
      request.customerId,
      request.relationshipType
    );

    function generateId(): string {
      return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Persist through repository
    await this.beneficiaryRepository.save(beneficiary);

    // Return the domain entity itself, as the Use Case should not be concerned with presentation
    return beneficiary;
  }
}
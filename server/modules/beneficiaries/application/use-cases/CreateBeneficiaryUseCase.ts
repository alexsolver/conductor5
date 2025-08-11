/**
 * CreateBeneficiaryUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases to handle business logic
 */

import { Beneficiary } from '../../domain/entities/Beneficiary';
interface BeneficiaryRepositoryInterface {
  save(beneficiary: Beneficiary): Promise<void>;
}

export interface CreateBeneficiaryRequest {
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  customerId: string;
  relationshipType: string;
}

export interface CreateBeneficiaryResponse {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  customerId?: string;
  relationshipType?: string;
}

export class CreateBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: BeneficiaryRepositoryInterface
  ) {}

  async execute(request: CreateBeneficiaryRequest): Promise<CreateBeneficiaryResponse> {
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

    return {
      id: beneficiary.getId(),
      firstName: beneficiary.getFirstName(),
      lastName: beneficiary.getLastName(),
      email: beneficiary.getEmail(),
      phone: beneficiary.getPhone(),
      customerId: beneficiary.getCustomerId(),
      relationshipType: beneficiary.getRelationshipType()
    };
  }
}
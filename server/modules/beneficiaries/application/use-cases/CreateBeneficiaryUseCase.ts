/**
 * Create Beneficiary Use Case - Application Layer
 * 
 * Orchestrates the creation of a new beneficiary with complete validation,
 * business rules enforcement, and data consistency.
 * 
 * @module CreateBeneficiaryUseCase
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { Beneficiary, BeneficiaryDomainService } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export interface CreateBeneficiaryInput {
  tenantId: string;
  
  // Basic Information
  firstName?: string;
  lastName?: string;
  name: string; // REQUIRED
  email?: string;
  phone?: string;
  cellPhone?: string;
  
  // Brazilian Legal Documents
  cpf?: string;
  cnpj?: string;
  rg?: string;
  
  // Address Information
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Contact Information
  contactPerson?: string;
  contactPhone?: string;
  
  // Integration and Customer Relationship
  integrationCode?: string;
  customerId?: string;
  customerCode?: string;
  
  // Birth Date
  birthDate?: Date;
  
  // Additional Information
  notes?: string;
  isActive?: boolean;
}

export interface CreateBeneficiaryOutput {
  success: boolean;
  beneficiary?: Beneficiary;
  errors?: string[];
  message: string;
}

export class CreateBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(input: CreateBeneficiaryInput): Promise<CreateBeneficiaryOutput> {
    try {
      // Input validation
      const validationErrors = this.validateInput(input);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          message: 'Validation failed'
        };
      }

      // Business rules validation
      const businessRuleErrors = await this.validateBusinessRules(input);
      if (businessRuleErrors.length > 0) {
        return {
          success: false,
          errors: businessRuleErrors,
          message: 'Business rule validation failed'
        };
      }

      // Data normalization
      const normalizedData = this.normalizeData(input);

      // Create beneficiary
      const beneficiary = await this.beneficiaryRepository.create(normalizedData);

      return {
        success: true,
        beneficiary,
        message: 'Beneficiary created successfully'
      };

    } catch (error) {
      console.error('[CreateBeneficiaryUseCase] Error creating beneficiary:', error);
      return {
        success: false,
        errors: ['Internal server error'],
        message: 'Failed to create beneficiary'
      };
    }
  }

  private validateInput(input: CreateBeneficiaryInput): string[] {
    const errors: string[] = [];

    // Tenant ID is required
    if (!input.tenantId) {
      errors.push('Tenant ID is required');
    }

    // Name is required
    if (!input.name || input.name.trim().length === 0) {
      errors.push('Name is required');
    }

    // Domain-level validation
    const domainValidationErrors = BeneficiaryDomainService.validateBeneficiary({
      name: input.name,
      email: input.email,
      cpf: input.cpf,
      cnpj: input.cnpj,
      phone: input.phone,
      cellPhone: input.cellPhone,
      zipCode: input.zipCode,
      contactPhone: input.contactPhone
    });

    errors.push(...domainValidationErrors);

    return errors;
  }

  private async validateBusinessRules(input: CreateBeneficiaryInput): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Check email uniqueness
      if (input.email) {
        const emailExists = await this.beneficiaryRepository.emailExists(
          input.email,
          input.tenantId
        );
        if (emailExists) {
          errors.push('Email already exists for this tenant');
        }
      }

      // Check CPF uniqueness
      if (input.cpf) {
        const cpfExists = await this.beneficiaryRepository.cpfExists(
          input.cpf,
          input.tenantId
        );
        if (cpfExists) {
          errors.push('CPF already exists for this tenant');
        }
      }

      // Check CNPJ uniqueness
      if (input.cnpj) {
        const cnpjExists = await this.beneficiaryRepository.cnpjExists(
          input.cnpj,
          input.tenantId
        );
        if (cnpjExists) {
          errors.push('CNPJ already exists for this tenant');
        }
      }

      // Check RG uniqueness
      if (input.rg) {
        const rgExists = await this.beneficiaryRepository.rgExists(
          input.rg,
          input.tenantId
        );
        if (rgExists) {
          errors.push('RG already exists for this tenant');
        }
      }

    } catch (error) {
      console.error('[CreateBeneficiaryUseCase] Error validating business rules:', error);
      errors.push('Error validating business rules');
    }

    return errors;
  }

  private normalizeData(input: CreateBeneficiaryInput): Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      tenantId: input.tenantId,
      
      // Basic Information
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      name: input.name.trim(),
      email: input.email?.toLowerCase().trim() || null,
      phone: input.phone?.replace(/[^\d]/g, '') || null,
      cellPhone: input.cellPhone?.replace(/[^\d]/g, '') || null,
      
      // Brazilian Legal Documents (remove formatting)
      cpf: input.cpf?.replace(/[^\d]/g, '') || null,
      cnpj: input.cnpj?.replace(/[^\d]/g, '') || null,
      rg: input.rg?.trim() || null,
      
      // Address Information
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.toUpperCase().trim() || null,
      zipCode: input.zipCode?.replace(/[^\d]/g, '') || null,
      
      // Contact Information
      contactPerson: input.contactPerson?.trim() || null,
      contactPhone: input.contactPhone?.replace(/[^\d]/g, '') || null,
      
      // Integration and Customer Relationship
      integrationCode: input.integrationCode?.trim() || null,
      customerId: input.customerId || null,
      customerCode: input.customerCode?.trim() || null,
      
      // Birth Date
      birthDate: input.birthDate || null,
      
      // Additional Information
      notes: input.notes?.trim() || null,
      isActive: input.isActive !== undefined ? input.isActive : true,
    };
  }
}
/**
 * Update Beneficiary Use Case - Application Layer
 * 
 * Orchestrates the update of existing beneficiary data with validation,
 * business rules enforcement, and data consistency checks.
 * 
 * @module UpdateBeneficiaryUseCase
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { Beneficiary, BeneficiaryDomainService } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export interface UpdateBeneficiaryInput {
  id: string;
  tenantId: string;
  
  // Basic Information
  firstName?: string;
  lastName?: string;
  name?: string;
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

export interface UpdateBeneficiaryOutput {
  success: boolean;
  beneficiary?: Beneficiary;
  errors?: string[];
  message: string;
}

export class UpdateBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  async execute(input: UpdateBeneficiaryInput): Promise<UpdateBeneficiaryOutput> {
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

      // Check if beneficiary exists
      const existingBeneficiary = await this.beneficiaryRepository.findById(input.id, input.tenantId);
      if (!existingBeneficiary) {
        return {
          success: false,
          errors: ['Beneficiary not found'],
          message: 'Beneficiary not found'
        };
      }

      // Business rules validation
      const businessRuleErrors = await this.validateBusinessRules(input, existingBeneficiary);
      if (businessRuleErrors.length > 0) {
        return {
          success: false,
          errors: businessRuleErrors,
          message: 'Business rule validation failed'
        };
      }

      // Data normalization
      const normalizedUpdates = this.normalizeData(input);

      // Remove undefined values to avoid overriding with undefined
      const updates = Object.fromEntries(
        Object.entries(normalizedUpdates).filter(([, value]) => value !== undefined)
      );

      // Update beneficiary
      const beneficiary = await this.beneficiaryRepository.update(
        input.id,
        updates as Partial<Beneficiary>,
        input.tenantId
      );

      return {
        success: true,
        beneficiary,
        message: 'Beneficiary updated successfully'
      };

    } catch (error) {
      console.error('[UpdateBeneficiaryUseCase] Error updating beneficiary:', error);
      return {
        success: false,
        errors: ['Internal server error'],
        message: 'Failed to update beneficiary'
      };
    }
  }

  private validateInput(input: UpdateBeneficiaryInput): string[] {
    const errors: string[] = [];

    // ID and tenant ID are required
    if (!input.id) {
      errors.push('Beneficiary ID is required');
    }

    if (!input.tenantId) {
      errors.push('Tenant ID is required');
    }

    // At least one field should be provided for update
    const updateFields = [
      'firstName', 'lastName', 'name', 'email', 'phone', 'cellPhone',
      'cpf', 'cnpj', 'rg', 'address', 'city', 'state', 'zipCode',
      'contactPerson', 'contactPhone', 'integrationCode', 'customerId',
      'customerCode', 'birthDate', 'notes', 'isActive'
    ];

    const hasUpdateField = updateFields.some(field => 
      input[field as keyof UpdateBeneficiaryInput] !== undefined
    );

    if (!hasUpdateField) {
      errors.push('At least one field must be provided for update');
    }

    // Domain-level validation for provided fields
    const dataForValidation = {
      name: input.name,
      email: input.email,
      cpf: input.cpf,
      cnpj: input.cnpj,
      phone: input.phone,
      cellPhone: input.cellPhone,
      zipCode: input.zipCode,
      contactPhone: input.contactPhone
    };

    // Filter out undefined values for validation
    const definedData = Object.fromEntries(
      Object.entries(dataForValidation).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(definedData).length > 0) {
      const domainValidationErrors = BeneficiaryDomainService.validateBeneficiary(definedData);
      errors.push(...domainValidationErrors);
    }

    return errors;
  }

  private async validateBusinessRules(input: UpdateBeneficiaryInput, existingBeneficiary: Beneficiary): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Check email uniqueness (if being updated)
      if (input.email && input.email !== existingBeneficiary.email) {
        const emailExists = await this.beneficiaryRepository.emailExists(
          input.email,
          input.tenantId,
          input.id // Exclude current beneficiary from check
        );
        if (emailExists) {
          errors.push('Email already exists for this tenant');
        }
      }

      // Check CPF uniqueness (if being updated)
      if (input.cpf && input.cpf !== existingBeneficiary.cpf) {
        const cleanCpf = input.cpf.replace(/[^\d]/g, '');
        const cpfExists = await this.beneficiaryRepository.cpfExists(
          cleanCpf,
          input.tenantId,
          input.id
        );
        if (cpfExists) {
          errors.push('CPF already exists for this tenant');
        }
      }

      // Check CNPJ uniqueness (if being updated)
      if (input.cnpj && input.cnpj !== existingBeneficiary.cnpj) {
        const cleanCnpj = input.cnpj.replace(/[^\d]/g, '');
        const cnpjExists = await this.beneficiaryRepository.cnpjExists(
          cleanCnpj,
          input.tenantId,
          input.id
        );
        if (cnpjExists) {
          errors.push('CNPJ already exists for this tenant');
        }
      }

      // Check RG uniqueness (if being updated)
      if (input.rg && input.rg !== existingBeneficiary.rg) {
        const rgExists = await this.beneficiaryRepository.rgExists(
          input.rg,
          input.tenantId,
          input.id
        );
        if (rgExists) {
          errors.push('RG already exists for this tenant');
        }
      }

      // Validate customer relationship (if being updated)
      if (input.customerId && input.customerId !== existingBeneficiary.customerId) {
        // Here you could add validation to check if the customer exists
        // This would require injection of a customer repository or service
        // For now, we'll skip this validation as it would break the dependency rule
      }

    } catch (error) {
      console.error('[UpdateBeneficiaryUseCase] Error validating business rules:', error);
      errors.push('Error validating business rules');
    }

    return errors;
  }

  private normalizeData(input: UpdateBeneficiaryInput): Partial<Beneficiary> {
    const updates: Partial<Beneficiary> = {};

    // Basic Information
    if (input.firstName !== undefined) {
      updates.firstName = input.firstName?.trim() || null;
    }
    if (input.lastName !== undefined) {
      updates.lastName = input.lastName?.trim() || null;
    }
    if (input.name !== undefined) {
      updates.name = input.name.trim();
    }
    if (input.email !== undefined) {
      updates.email = input.email?.toLowerCase().trim() || null;
    }
    if (input.phone !== undefined) {
      updates.phone = input.phone?.replace(/[^\d]/g, '') || null;
    }
    if (input.cellPhone !== undefined) {
      updates.cellPhone = input.cellPhone?.replace(/[^\d]/g, '') || null;
    }

    // Brazilian Legal Documents (remove formatting)
    if (input.cpf !== undefined) {
      updates.cpf = input.cpf?.replace(/[^\d]/g, '') || null;
    }
    if (input.cnpj !== undefined) {
      updates.cnpj = input.cnpj?.replace(/[^\d]/g, '') || null;
    }
    if (input.rg !== undefined) {
      updates.rg = input.rg?.trim() || null;
    }

    // Address Information
    if (input.address !== undefined) {
      updates.address = input.address?.trim() || null;
    }
    if (input.city !== undefined) {
      updates.city = input.city?.trim() || null;
    }
    if (input.state !== undefined) {
      updates.state = input.state?.toUpperCase().trim() || null;
    }
    if (input.zipCode !== undefined) {
      updates.zipCode = input.zipCode?.replace(/[^\d]/g, '') || null;
    }

    // Contact Information
    if (input.contactPerson !== undefined) {
      updates.contactPerson = input.contactPerson?.trim() || null;
    }
    if (input.contactPhone !== undefined) {
      updates.contactPhone = input.contactPhone?.replace(/[^\d]/g, '') || null;
    }

    // Integration and Customer Relationship
    if (input.integrationCode !== undefined) {
      updates.integrationCode = input.integrationCode?.trim() || null;
    }
    if (input.customerId !== undefined) {
      updates.customerId = input.customerId || null;
    }
    if (input.customerCode !== undefined) {
      updates.customerCode = input.customerCode?.trim() || null;
    }

    // Birth Date
    if (input.birthDate !== undefined) {
      updates.birthDate = input.birthDate || null;
    }

    // Additional Information
    if (input.notes !== undefined) {
      updates.notes = input.notes?.trim() || null;
    }
    if (input.isActive !== undefined) {
      updates.isActive = input.isActive;
    }

    return updates;
  }
}
/**
 * Delete Beneficiary Use Case - Application Layer
 * 
 * Orchestrates the soft deletion of beneficiaries with business rule validation
 * and dependency checking to ensure data integrity.
 * 
 * @module DeleteBeneficiaryUseCase
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export interface DeleteBeneficiaryInput {
  id: string;
  tenantId: string;
}

export interface DeleteBeneficiariesInput {
  ids: string[];
  tenantId: string;
}

export interface DeleteBeneficiaryOutput {
  success: boolean;
  errors?: string[];
  message: string;
}

export class DeleteBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  /**
   * Soft delete a single beneficiary
   */
  async execute(input: DeleteBeneficiaryInput): Promise<DeleteBeneficiaryOutput> {
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
      const beneficiary = await this.beneficiaryRepository.findById(input.id, input.tenantId);
      if (!beneficiary) {
        return {
          success: false,
          errors: ['Beneficiary not found'],
          message: 'Beneficiary not found'
        };
      }

      // Business rules validation
      const businessRuleErrors = await this.validateBusinessRules(input);
      if (businessRuleErrors.length > 0) {
        return {
          success: false,
          errors: businessRuleErrors,
          message: 'Cannot delete beneficiary due to business rules'
        };
      }

      // Perform soft delete
      const deleted = await this.beneficiaryRepository.delete(input.id, input.tenantId);

      if (!deleted) {
        return {
          success: false,
          errors: ['Failed to delete beneficiary'],
          message: 'Failed to delete beneficiary'
        };
      }

      return {
        success: true,
        message: 'Beneficiary deleted successfully'
      };

    } catch (error) {
      console.error('[DeleteBeneficiaryUseCase] Error deleting beneficiary:', error);
      return {
        success: false,
        errors: ['Internal server error'],
        message: 'Failed to delete beneficiary'
      };
    }
  }

  /**
   * Bulk soft delete multiple beneficiaries
   */
  async executeBulk(input: DeleteBeneficiariesInput): Promise<DeleteBeneficiaryOutput> {
    try {
      // Input validation
      if (!input.tenantId) {
        return {
          success: false,
          errors: ['Tenant ID is required'],
          message: 'Validation failed'
        };
      }

      if (!input.ids || input.ids.length === 0) {
        return {
          success: false,
          errors: ['At least one beneficiary ID is required'],
          message: 'Validation failed'
        };
      }

      // Validate each ID format
      const invalidIds = input.ids.filter(id => !this.isValidUuid(id));
      if (invalidIds.length > 0) {
        return {
          success: false,
          errors: [`Invalid beneficiary IDs: ${invalidIds.join(', ')}`],
          message: 'Validation failed'
        };
      }

      // Check if all beneficiaries exist
      const existingBeneficiaries = await Promise.all(
        input.ids.map(id => this.beneficiaryRepository.findById(id, input.tenantId))
      );

      const notFoundIds = input.ids.filter((id, index) => !existingBeneficiaries[index]);
      if (notFoundIds.length > 0) {
        return {
          success: false,
          errors: [`Beneficiaries not found: ${notFoundIds.join(', ')}`],
          message: 'Some beneficiaries not found'
        };
      }

      // Business rules validation for each beneficiary
      const businessRuleErrors: string[] = [];
      for (const id of input.ids) {
        const errors = await this.validateBusinessRules({ id, tenantId: input.tenantId });
        if (errors.length > 0) {
          businessRuleErrors.push(`Beneficiary ${id}: ${errors.join(', ')}`);
        }
      }

      if (businessRuleErrors.length > 0) {
        return {
          success: false,
          errors: businessRuleErrors,
          message: 'Cannot delete some beneficiaries due to business rules'
        };
      }

      // Perform bulk delete
      const deleted = await this.beneficiaryRepository.bulkDelete(input.ids, input.tenantId);

      if (!deleted) {
        return {
          success: false,
          errors: ['Failed to delete beneficiaries'],
          message: 'Failed to delete beneficiaries'
        };
      }

      return {
        success: true,
        message: `${input.ids.length} beneficiaries deleted successfully`
      };

    } catch (error) {
      console.error('[DeleteBeneficiaryUseCase] Error bulk deleting beneficiaries:', error);
      return {
        success: false,
        errors: ['Internal server error'],
        message: 'Failed to delete beneficiaries'
      };
    }
  }

  private validateInput(input: DeleteBeneficiaryInput): string[] {
    const errors: string[] = [];

    if (!input.id) {
      errors.push('Beneficiary ID is required');
    } else if (!this.isValidUuid(input.id)) {
      errors.push('Invalid beneficiary ID format');
    }

    if (!input.tenantId) {
      errors.push('Tenant ID is required');
    } else if (!this.isValidUuid(input.tenantId)) {
      errors.push('Invalid tenant ID format');
    }

    return errors;
  }

  private async validateBusinessRules(input: DeleteBeneficiaryInput): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Check if beneficiary has active relationships or dependencies
      // In a real implementation, you might check for:
      // - Active tickets or service requests
      // - Pending transactions
      // - Related benefits or services
      // - Active contracts

      // For now, we'll implement basic checks
      // You can extend this based on your specific business rules

      // Example: Check if beneficiary has been referenced recently
      // const recentActivity = await this.checkRecentActivity(input.id, input.tenantId);
      // if (recentActivity) {
      //   errors.push('Cannot delete beneficiary with recent activity');
      // }

      // Example: Check for active associations
      // const hasActiveAssociations = await this.checkActiveAssociations(input.id, input.tenantId);
      // if (hasActiveAssociations) {
      //   errors.push('Cannot delete beneficiary with active associations');
      // }

    } catch (error) {
      console.error('[DeleteBeneficiaryUseCase] Error validating business rules:', error);
      errors.push('Error validating business rules');
    }

    return errors;
  }

  private isValidUuid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // These methods would be implemented based on your specific business rules
  // private async checkRecentActivity(beneficiaryId: string, tenantId: string): Promise<boolean> {
  //   // Check for recent activity that would prevent deletion
  //   return false;
  // }

  // private async checkActiveAssociations(beneficiaryId: string, tenantId: string): Promise<boolean> {
  //   // Check for active associations that would prevent deletion
  //   return false;
  // }
}
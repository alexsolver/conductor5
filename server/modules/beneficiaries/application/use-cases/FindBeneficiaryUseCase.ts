/**
 * Find Beneficiary Use Case - Application Layer
 * 
 * Orchestrates beneficiary search and retrieval operations with complete
 * filtering capabilities and tenant isolation.
 * 
 * @module FindBeneficiaryUseCase
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { Beneficiary, BeneficiaryFilterCriteria, BeneficiaryStats } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export interface FindBeneficiaryByIdInput {
  id: string;
  tenantId: string;
}

export interface FindBeneficiariesInput {
  tenantId: string;
  limit?: number;
  offset?: number;
  search?: string;
  customerCode?: string;
  customerId?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasCpf?: boolean;
  hasCnpj?: boolean;
  birthDateFrom?: Date;
  birthDateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface FindBeneficiaryOutput {
  success: boolean;
  beneficiary?: Beneficiary;
  error?: string;
  message: string;
}

export interface FindBeneficiariesOutput {
  success: boolean;
  beneficiaries?: Beneficiary[];
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
  error?: string;
  message: string;
}

export interface BeneficiaryStatsOutput {
  success: boolean;
  stats?: BeneficiaryStats;
  error?: string;
  message: string;
}

export class FindBeneficiaryUseCase {
  constructor(
    private readonly beneficiaryRepository: IBeneficiaryRepository
  ) {}

  /**
   * Find beneficiary by ID with tenant isolation
   */
  async findById(input: FindBeneficiaryByIdInput): Promise<FindBeneficiaryOutput> {
    try {
      // Input validation
      if (!input.id) {
        return {
          success: false,
          error: 'Beneficiary ID is required',
          message: 'Invalid input'
        };
      }

      if (!input.tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required',
          message: 'Invalid input'
        };
      }

      // Find beneficiary
      const beneficiary = await this.beneficiaryRepository.findById(input.id, input.tenantId);

      if (!beneficiary) {
        return {
          success: false,
          error: 'Beneficiary not found',
          message: 'Beneficiary not found'
        };
      }

      return {
        success: true,
        beneficiary,
        message: 'Beneficiary retrieved successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error finding beneficiary by ID:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiary'
      };
    }
  }

  /**
   * Find beneficiaries with filtering and pagination
   */
  async findMany(input: FindBeneficiariesInput): Promise<FindBeneficiariesOutput> {
    try {
      // Input validation
      if (!input.tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required',
          message: 'Invalid input'
        };
      }

      // Build filter criteria
      const criteria: BeneficiaryFilterCriteria = {
        tenantId: input.tenantId,
        search: input.search,
        customerCode: input.customerCode,
        customerId: input.customerId,
        city: input.city,
        state: input.state,
        isActive: input.isActive,
        hasEmail: input.hasEmail,
        hasPhone: input.hasPhone,
        hasCpf: input.hasCpf,
        hasCnpj: input.hasCnpj,
        birthDateFrom: input.birthDateFrom,
        birthDateTo: input.birthDateTo,
        createdFrom: input.createdFrom,
        createdTo: input.createdTo,
        page: input.page || 1,
        limit: input.limit || 20,
        sortBy: input.sortBy || 'name',
        sortOrder: input.sortOrder || 'asc'
      };

      // Find beneficiaries with filters
      const result = await this.beneficiaryRepository.findByFilters(criteria);

      return {
        success: true,
        beneficiaries: result.beneficiaries,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: criteria.limit || 20
        },
        message: 'Beneficiaries retrieved successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error finding beneficiaries:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiaries'
      };
    }
  }

  /**
   * Search beneficiaries by text
   */
  async search(tenantId: string, searchTerm: string, limit?: number, offset?: number): Promise<FindBeneficiariesOutput> {
    try {
      // Input validation
      if (!tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required',
          message: 'Invalid input'
        };
      }

      if (!searchTerm || searchTerm.trim().length === 0) {
        return {
          success: false,
          error: 'Search term is required',
          message: 'Invalid input'
        };
      }

      // Search beneficiaries
      const beneficiaries = await this.beneficiaryRepository.searchBeneficiaries(
        tenantId,
        searchTerm.trim(),
        limit,
        offset
      );

      return {
        success: true,
        beneficiaries,
        message: 'Search completed successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error searching beneficiaries:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to search beneficiaries'
      };
    }
  }

  /**
   * Find beneficiary by email
   */
  async findByEmail(email: string, tenantId: string): Promise<FindBeneficiaryOutput> {
    try {
      if (!email || !tenantId) {
        return {
          success: false,
          error: 'Email and tenant ID are required',
          message: 'Invalid input'
        };
      }

      const beneficiary = await this.beneficiaryRepository.findByEmail(email, tenantId);

      if (!beneficiary) {
        return {
          success: false,
          error: 'Beneficiary not found',
          message: 'Beneficiary not found with this email'
        };
      }

      return {
        success: true,
        beneficiary,
        message: 'Beneficiary retrieved successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error finding beneficiary by email:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiary'
      };
    }
  }

  /**
   * Find beneficiary by CPF
   */
  async findByCpf(cpf: string, tenantId: string): Promise<FindBeneficiaryOutput> {
    try {
      if (!cpf || !tenantId) {
        return {
          success: false,
          error: 'CPF and tenant ID are required',
          message: 'Invalid input'
        };
      }

      // Normalize CPF (remove formatting)
      const cleanCpf = cpf.replace(/[^\d]/g, '');

      const beneficiary = await this.beneficiaryRepository.findByCpf(cleanCpf, tenantId);

      if (!beneficiary) {
        return {
          success: false,
          error: 'Beneficiary not found',
          message: 'Beneficiary not found with this CPF'
        };
      }

      return {
        success: true,
        beneficiary,
        message: 'Beneficiary retrieved successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error finding beneficiary by CPF:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiary'
      };
    }
  }

  /**
   * Find beneficiaries by customer ID
   */
  async findByCustomerId(customerId: string, tenantId: string): Promise<FindBeneficiariesOutput> {
    try {
      if (!customerId || !tenantId) {
        return {
          success: false,
          error: 'Customer ID and tenant ID are required',
          message: 'Invalid input'
        };
      }

      const beneficiaries = await this.beneficiaryRepository.findByCustomerId(customerId, tenantId);

      return {
        success: true,
        beneficiaries,
        message: 'Beneficiaries retrieved successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error finding beneficiaries by customer ID:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiaries'
      };
    }
  }

  /**
   * Get beneficiary statistics
   */
  async getStats(tenantId: string): Promise<BeneficiaryStatsOutput> {
    try {
      if (!tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required',
          message: 'Invalid input'
        };
      }

      const stats = await this.beneficiaryRepository.getBeneficiaryStats(tenantId);

      return {
        success: true,
        stats,
        message: 'Statistics retrieved successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error getting beneficiary statistics:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve statistics'
      };
    }
  }

  /**
   * Get recent beneficiaries
   */
  async getRecent(tenantId: string, days: number = 30, limit: number = 10): Promise<FindBeneficiariesOutput> {
    try {
      if (!tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required',
          message: 'Invalid input'
        };
      }

      const beneficiaries = await this.beneficiaryRepository.getRecentBeneficiaries(tenantId, days, limit);

      return {
        success: true,
        beneficiaries,
        message: 'Recent beneficiaries retrieved successfully'
      };

    } catch (error) {
      console.error('[FindBeneficiaryUseCase] Error getting recent beneficiaries:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve recent beneficiaries'
      };
    }
  }
}
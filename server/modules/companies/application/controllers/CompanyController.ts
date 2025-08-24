/**
 * APPLICATION LAYER - COMPANY CONTROLLER
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/jwtAuth';
import { CreateCompanyUseCase } from '../use-cases/CreateCompanyUseCase';
import { UpdateCompanyUseCase } from '../use-cases/UpdateCompanyUseCase';
import { FindCompanyUseCase } from '../use-cases/FindCompanyUseCase';
import { DeleteCompanyUseCase } from '../use-cases/DeleteCompanyUseCase';
import { CompanyDomainService } from '../../domain/entities/Company';
import {
  CreateCompanyDTO,
  UpdateCompanyDTO,
  CompanyResponseDTO,
  CompanyListResponseDTO,
  CompanyFiltersDTO,
  CompanyStatsDTO
} from '../dto/CompanyDTO';
import { PaginationOptions } from '../../domain/repositories/ICompanyRepository';

export class CompanyController {
  constructor(
    private createCompanyUseCase: CreateCompanyUseCase,
    private updateCompanyUseCase: UpdateCompanyUseCase,
    private findCompanyUseCase: FindCompanyUseCase,
    private deleteCompanyUseCase: DeleteCompanyUseCase,
    private companyDomainService: CompanyDomainService
  ) {}

  async createCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const createDTO: CreateCompanyDTO = {
        ...req.body,
        tenantId: req.user?.tenantId,
        createdById: req.user?.id
      };

      const company = await this.createCompanyUseCase.execute(createDTO);

      const responseDTO: CompanyResponseDTO = this.mapToResponseDTO(company);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: responseDTO
      });
    } catch (error) {
      console.error('[CREATE-COMPANY-CONTROLLER]', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create company',
        code: 'CREATE_COMPANY_ERROR'
      });
    }
  }

  async updateCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateDTO: UpdateCompanyDTO = {
        ...req.body,
        updatedById: req.user?.id
      };

      const company = await this.updateCompanyUseCase.updateByTenantScope(
        id,
        req.user?.tenantId || '',
        updateDTO
      );

      const responseDTO: CompanyResponseDTO = this.mapToResponseDTO(company);

      res.json({
        success: true,
        message: 'Company updated successfully',
        data: responseDTO
      });
    } catch (error) {
      console.error('[UPDATE-COMPANY-CONTROLLER]', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update company',
        code: 'UPDATE_COMPANY_ERROR'
      });
    }
  }

  async getCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const company = await this.findCompanyUseCase.findById(id, req.user?.tenantId);

      if (!company) {
        res.status(404).json({
          success: false,
          message: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      const responseDTO: CompanyResponseDTO = this.mapToResponseDTO(company);

      res.json({
        success: true,
        message: 'Company retrieved successfully',
        data: responseDTO
      });
    } catch (error) {
      console.error('[GET-COMPANY-CONTROLLER]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve company',
        code: 'GET_COMPANY_ERROR'
      });
    }
  }

  async getCompanyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const companyProfile = await this.findCompanyUseCase.getCompanyProfile(
        id,
        req.user?.tenantId || ''
      );

      if (!companyProfile) {
        res.status(404).json({
          success: false,
          message: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Company profile retrieved successfully',
        data: companyProfile
      });
    } catch (error) {
      console.error('[GET-COMPANY-PROFILE-CONTROLLER]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve company profile',
        code: 'GET_COMPANY_PROFILE_ERROR'
      });
    }
  }

  async listCompanies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters: CompanyFiltersDTO = this.extractFilters(req.query);
      const pagination: PaginationOptions = this.extractPagination(req.query);

      const result = await this.findCompanyUseCase.findWithFilters(
        this.convertFiltersToEntityFilters(filters),
        pagination,
        req.user?.tenantId
      );

      const responseDTOs: CompanyResponseDTO[] = result.companies.map(company =>
        this.mapToResponseDTO(company)
      );

      const response: CompanyListResponseDTO = {
        success: true,
        message: `Found ${result.total} companies`,
        data: responseDTOs,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: pagination.limit
        }
      };

      return res.json({
        success: true,
        message: 'Companies retrieved successfully',
        data: result.data || []
      });
    } catch (error) {
      console.error('[LIST-COMPANIES-CONTROLLER]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list companies',
        code: 'LIST_COMPANIES_ERROR'
      });
    }
  }

  async searchCompanies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search } = req.query;

      if (!search || typeof search !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search term is required',
          code: 'SEARCH_TERM_REQUIRED'
        });
        return;
      }

      const pagination: PaginationOptions = this.extractPagination(req.query);

      const result = await this.findCompanyUseCase.searchCompanies(
        search,
        req.user?.tenantId,
        pagination
      );

      const responseDTOs: CompanyResponseDTO[] = result.companies.map(company =>
        this.mapToResponseDTO(company)
      );

      const response: CompanyListResponseDTO = {
        success: true,
        message: `Found ${result.total} companies matching "${search}"`,
        data: responseDTOs,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: pagination.limit
        }
      };

      res.json(response);
    } catch (error) {
      console.error('[SEARCH-COMPANIES-CONTROLLER]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search companies',
        code: 'SEARCH_COMPANIES_ERROR'
      });
    }
  }

  async getCompanyStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await this.findCompanyUseCase.getStatistics(req.user?.tenantId);

      const responseDTO: CompanyStatsDTO = {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        suspended: stats.suspended,
        pending: 0, // Would be calculated from stats
        bySize: {
          micro: stats.bySize.micro || 0,
          small: stats.bySize.small || 0,
          medium: stats.bySize.medium || 0,
          large: stats.bySize.large || 0,
          enterprise: stats.bySize.enterprise || 0
        },
        bySubscription: {
          free: stats.bySubscription.free || 0,
          basic: stats.bySubscription.basic || 0,
          premium: stats.bySubscription.premium || 0,
          enterprise: stats.bySubscription.enterprise || 0
        },
        byState: Object.entries(stats.byState).map(([state, count]) => ({
          state,
          count
        })),
        byIndustry: Object.entries(stats.byIndustry).map(([industry, count]) => ({
          industry,
          count
        })),
        recentCompanies: stats.recentCompanies,
        growthRate: this.calculateGrowthRate(stats.total, stats.recentCompanies),
        averageCustomersPerCompany: 0, // Would be calculated from relationships
        averageTicketsPerCompany: 0    // Would be calculated from relationships
      };

      res.json({
        success: true,
        message: 'Company statistics retrieved successfully',
        data: responseDTO
      });
    } catch (error) {
      console.error('[GET-COMPANY-STATS-CONTROLLER]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve statistics',
        code: 'GET_COMPANY_STATS_ERROR'
      });
    }
  }

  async deleteCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.deleteCompanyUseCase.deleteByTenantScope(
        id,
        req.user?.tenantId || '',
        req.user?.id
      );

      res.json({
        success: true,
        message: 'Company deleted successfully'
      });
    } catch (error) {
      console.error('[DELETE-COMPANY-CONTROLLER]', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete company',
        code: 'DELETE_COMPANY_ERROR'
      });
    }
  }

  async restoreCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const company = await this.deleteCompanyUseCase.restore(
        id,
        req.user?.tenantId,
        req.user?.id
      );

      const responseDTO: CompanyResponseDTO = this.mapToResponseDTO(company);

      res.json({
        success: true,
        message: 'Company restored successfully',
        data: responseDTO
      });
    } catch (error) {
      console.error('[RESTORE-COMPANY-CONTROLLER]', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to restore company',
        code: 'RESTORE_COMPANY_ERROR'
      });
    }
  }

  async bulkUpdateCompanies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyIds, updates } = req.body;

      if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Company IDs are required',
          code: 'COMPANY_IDS_REQUIRED'
        });
        return;
      }

      const companies = await this.updateCompanyUseCase.bulkUpdate(companyIds, {
        ...updates,
        updatedById: req.user?.id
      });

      const responseDTOs: CompanyResponseDTO[] = companies.map(company =>
        this.mapToResponseDTO(company)
      );

      res.json({
        success: true,
        message: `Updated ${companies.length} companies successfully`,
        data: responseDTOs
      });
    } catch (error) {
      console.error('[BULK-UPDATE-COMPANIES-CONTROLLER]', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to bulk update companies',
        code: 'BULK_UPDATE_COMPANIES_ERROR'
      });
    }
  }

  async validateCompanyData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params; // 'create' or 'update'
      const { companyId } = req.query;

      let validation;

      if (type === 'create') {
        const createDTO: CreateCompanyDTO = {
          ...req.body,
          tenantId: req.user?.tenantId
        };
        validation = await this.createCompanyUseCase.validateCreateData(createDTO);
      } else if (type === 'update' && companyId) {
        const updateDTO: UpdateCompanyDTO = req.body;
        validation = await this.updateCompanyUseCase.validateUpdateData(
          companyId as string,
          updateDTO
        );
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid validation type or missing company ID',
          code: 'INVALID_VALIDATION_REQUEST'
        });
        return;
      }

      res.json({
        success: true,
        message: validation.isValid ? 'Data is valid' : 'Data validation failed',
        data: {
          isValid: validation.isValid,
          errors: validation.errors
        }
      });
    } catch (error) {
      console.error('[VALIDATE-COMPANY-DATA-CONTROLLER]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  }

  // Helper methods
  private mapToResponseDTO(company: any): CompanyResponseDTO {
    const displayData = this.companyDomainService.formatCompanyDisplay(company);

    return {
      id: company.id,
      tenantId: company.tenantId,
      name: company.name,
      displayName: displayData.displayName,
      description: company.description,
      cnpj: company.cnpj,
      formattedCNPJ: displayData.formattedCNPJ,
      industry: company.industry,
      size: company.size,
      status: company.status,
      subscriptionTier: company.subscriptionTier,
      email: company.email,
      phone: company.phone,
      formattedPhone: displayData.formattedPhone,
      website: company.website,
      address: company.address,
      addressNumber: company.addressNumber,
      complement: company.complement,
      neighborhood: company.neighborhood,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      formattedZipCode: displayData.formattedZipCode,
      fullAddress: displayData.fullAddress,
      companyCode: this.companyDomainService.generateCompanyCode(company.name, company.cnpj),
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      customerCount: 0, // Would be populated from relationships
      ticketCount: 0    // Would be populated from relationships
    };
  }

  private extractFilters(query: any): CompanyFiltersDTO {
    return {
      name: query.name,
      cnpj: query.cnpj,
      industry: query.industry,
      size: query.size ? (Array.isArray(query.size) ? query.size : [query.size]) : undefined,
      status: query.status ? (Array.isArray(query.status) ? query.status : [query.status]) : undefined,
      subscriptionTier: query.subscriptionTier ? (Array.isArray(query.subscriptionTier) ? query.subscriptionTier : [query.subscriptionTier]) : undefined,
      state: query.state,
      city: query.city,
      isActive: query.isActive ? query.isActive === 'true' : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search
    };
  }

  private extractPagination(query: any): PaginationOptions {
    return {
      page: parseInt(query.page || '1'),
      limit: Math.min(parseInt(query.limit || '50'), 1000),
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc'
    };
  }

  private calculateGrowthRate(total: number, recent: number): number {
    if (total === 0) return 0;
    return Math.round((recent / total) * 100 * 100) / 100; // Round to 2 decimal places
  }

  private convertFiltersToEntityFilters(filters: CompanyFiltersDTO): any {
    return {
      ...filters,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };
  }
}
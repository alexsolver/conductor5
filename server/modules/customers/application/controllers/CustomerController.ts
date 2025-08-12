/**
 * APPLICATION LAYER - CUSTOMER CONTROLLER
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Request, Response } from 'express';
import { CreateCustomerUseCase } from '../use-cases/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '../use-cases/UpdateCustomerUseCase';
import { FindCustomerUseCase } from '../use-cases/FindCustomerUseCase';
import { DeleteCustomerUseCase } from '../use-cases/DeleteCustomerUseCase';
import { CustomerDomainService } from '../../domain/entities/Customer';
import { 
  CreateCustomerDTO, 
  UpdateCustomerDTO, 
  CustomerFiltersDTO,
  CustomerSearchDTO 
} from '../dto/CustomerDTO';

export class CustomerController {
  constructor(
    private createCustomerUseCase: CreateCustomerUseCase,
    private updateCustomerUseCase: UpdateCustomerUseCase,
    private findCustomerUseCase: FindCustomerUseCase,
    private deleteCustomerUseCase: DeleteCustomerUseCase,
    private customerDomainService: CustomerDomainService
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateCustomerDTO = req.body;
      const tenantId = req.user?.tenantId;
      const createdById = req.user?.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      // Set audit fields
      dto.tenantId = tenantId;
      dto.createdById = createdById;

      const customer = await this.createCustomerUseCase.execute(dto);

      // Convert to response format
      const customerResponse = this.formatCustomerResponse(customer);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customerResponse
      });
    } catch (error: any) {
      const statusCode = this.getErrorStatusCode(error.message);
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create customer',
        error: error.message
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateCustomerDTO = req.body;
      const updatedById = req.user?.id;

      // Set audit fields
      dto.updatedById = updatedById;

      const customer = await this.updateCustomerUseCase.execute(id, dto);

      // Convert to response format
      const customerResponse = this.formatCustomerResponse(customer);

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customerResponse
      });
    } catch (error: any) {
      const statusCode = this.getErrorStatusCode(error.message);
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update customer',
        error: error.message
      });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      const customer = await this.findCustomerUseCase.findById(id, tenantId);

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      const customerResponse = this.formatCustomerResponse(customer);

      res.json({
        success: true,
        data: customerResponse
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find customer',
        error: error.message
      });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      // Extract filters and pagination from query
      const {
        customerType, isActive, state, city, search,
        dateFrom, dateTo,
        page = 1, limit = 50, sortBy = 'firstName', sortOrder = 'asc'
      } = req.query;

      // Build filters
      const filters: any = {};
      if (customerType) {
        filters.customerType = Array.isArray(customerType) ? customerType : [customerType];
      }
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }
      if (state) filters.state = state as string;
      if (city) filters.city = city as string;
      if (search) filters.search = search as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const pagination = {
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 1000), // Max 1000 per page
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.findCustomerUseCase.findWithFilters(filters, pagination, tenantId);

      // Format customers
      const customersResponse = result.customers.map(customer => 
        this.formatCustomerResponse(customer)
      );

      res.json({
        success: true,
        message: 'Customers retrieved successfully',
        data: customersResponse,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: pagination.limit
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve customers',
        error: error.message
      });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const { q: searchTerm, customerType, state, city, page = 1, limit = 50 } = req.query;
      const tenantId = req.user?.tenantId;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }

      const pagination = {
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 1000),
        sortBy: 'firstName',
        sortOrder: 'asc' as const
      };

      const result = await this.findCustomerUseCase.searchCustomers(
        searchTerm as string,
        tenantId,
        pagination
      );

      const customersResponse = result.customers.map(customer => 
        this.formatCustomerResponse(customer)
      );

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: customersResponse,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: pagination.limit
        },
        searchTerm: searchTerm as string
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Search failed',
        error: error.message
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      const profile = await this.findCustomerUseCase.getCustomerProfile(id, tenantId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found'
        });
        return;
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get customer profile',
        error: error.message
      });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      // Determine tenant scope based on user role
      const searchTenantId = userRole === 'saas_admin' ? undefined : tenantId;

      const stats = await this.findCustomerUseCase.getStatistics(searchTenantId);

      // Format statistics for response
      const formattedStats = {
        ...stats,
        topStates: Object.entries(stats.byState)
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        byType: {
          PF: stats.byType.PF || 0,
          PJ: stats.byType.PJ || 0
        }
      };

      res.json({
        success: true,
        data: formattedStats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get statistics',
        error: error.message
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedById = req.user?.id;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await this.deleteCustomerUseCase.deleteByTenantScope(id, tenantId, deletedById);

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error: any) {
      const statusCode = this.getErrorStatusCode(error.message);
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete customer',
        error: error.message
      });
    }
  }

  async findByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      if (!['PF', 'PJ'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid customer type. Must be PF or PJ'
        });
        return;
      }

      const customers = await this.findCustomerUseCase.findByType(type as 'PF' | 'PJ', tenantId);

      const customersResponse = customers.map(customer => 
        this.formatCustomerResponse(customer)
      );

      res.json({
        success: true,
        data: customersResponse
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find customers by type',
        error: error.message
      });
    }
  }

  private formatCustomerResponse(customer: any) {
    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: this.customerDomainService.createFullName(customer.firstName, customer.lastName),
      displayName: this.customerDomainService.getDisplayName(customer),
      email: customer.email,
      phone: customer.phone,
      mobilePhone: customer.mobilePhone,
      customerType: customer.customerType,
      cpf: customer.cpf,
      cnpj: customer.cnpj,
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      
      // Address
      state: customer.state,
      address: customer.address,
      addressNumber: customer.addressNumber,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      zipCode: customer.zipCode,
      
      // Formatted fields
      formattedPhone: this.customerDomainService.formatPhone(customer.phone),
      formattedMobilePhone: this.customerDomainService.formatPhone(customer.mobilePhone),
      formattedCPF: this.customerDomainService.formatCPF(customer.cpf),
      formattedCNPJ: this.customerDomainService.formatCNPJ(customer.cnpj),
      
      // System fields
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    };
  }

  private getErrorStatusCode(errorMessage: string): number {
    if (errorMessage.includes('not found')) return 404;
    if (errorMessage.includes('already exists')) return 409;
    if (errorMessage.includes('required')) return 400;
    if (errorMessage.includes('invalid') || errorMessage.includes('must be')) return 400;
    return 500;
  }
}
// Using interface-based approach instead of direct Express dependency

// Defining interfaces for HttpRequest and HttpResponse, assuming they are compatible with Express types
// For a real Express application, you would use Request and Response directly from 'express'
interface HttpRequest {
  body: any;
  params: any;
  query: any;
  headers: {
    'x-tenant-id'?: string;
    'x-user-id'?: string;
  };
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(data: any): void;
}

// Remove Express dependency - use DTOs and interfaces instead
import { CreateCustomerUseCase } from '../use-cases/CreateCustomerUseCase';
import { GetCustomersUseCase } from '../use-cases/GetCustomersUseCase';
import { UpdateCustomerUseCase } from '../usecases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../usecases/DeleteCustomerUseCase';
import { transformToCustomerDTO } from '../dto/CustomerResponseDTO';

export class CustomerController {
  constructor(
    private customerApplicationService: any, // Placeholder, as the original code uses this and the changes introduce use cases
    private createCustomerUseCase: CreateCustomerUseCase,
    private getCustomersUseCase: GetCustomersUseCase,
    private updateCustomerUseCase: UpdateCustomerUseCase,
    private deleteCustomerUseCase: DeleteCustomerUseCase
  ) {}

  async createCustomer(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { logInfo, logError } = await import('../../../../utils/logger');
      const { body, user } = req as any;
      const tenantId = user?.tenantId;
      const userId = user?.id;

      // Log operation start
      logInfo('Customer creation started', {
        tenantId,
        userId,
        customerType: body.customerType,
        operation: 'CREATE_CUSTOMER'
      });

      if (!tenantId) {
        logError('Customer creation failed - missing tenant ID', new Error('Missing tenant ID'), {
          userId,
          operation: 'CREATE_CUSTOMER'
        });
        res.status(400).json({
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        });
        return;
      }

      const result = await this.customerApplicationService.createCustomer({
        ...body,
        tenantId
      });

      // Log successful creation
      logInfo('Customer created successfully', {
        tenantId,
        userId,
        customerId: result.customer.id,
        customerType: result.customer.customerType,
        operation: 'CREATE_CUSTOMER'
      });

      res.status(201).json({
        success: true,
        data: transformToCustomerDTO(result.customer),
        message: 'Customer created successfully'
      });
    } catch (error) {
      const { logError } = await import('../../../../utils/logger');
      logError('Customer creation failed', error, {
        operation: 'CREATE_CUSTOMER',
        tenantId: req.headers['x-tenant-id'] as string | undefined,
        userId: req.headers['x-user-id'] as string | undefined
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCustomers(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const userId = user?.id;

      console.log('🔍 [CUSTOMER-CONTROLLER] getCustomers called:', {
        hasUser: !!user,
        userId: user?.id,
        tenantId: user?.tenantId,
        userRole: user?.role,
        headers: req.headers
      });

      if (!tenantId) {
        console.error('❌ [CUSTOMER-CONTROLLER] Missing tenantId:', {
          user: user ? { id: user.id, email: user.email, role: user.role } : null
        });
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const customers = await this.getCustomersUseCase.execute({
        tenantId: tenantId as string,
        userId: userId as string
      });

      const customerDTOs = customers.map(transformToCustomerDTO);

      res.json({
        success: true,
        data: customerDTOs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateCustomer(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const customer = await this.updateCustomerUseCase.execute({
        id,
        tenantId: tenantId as string,
        ...req.body
      });

      const customerDTO = transformToCustomerDTO(customer);

      res.json({
        success: true,
        data: customerDTO
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteCustomer(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      await this.deleteCustomerUseCase.execute({
        id,
        tenantId: tenantId as string
      });

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAllCustomers(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        });
        return;
      }

      const result = await this.customerApplicationService.getCustomers({
        tenantId,
        page,
        limit
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          customers: result.customers?.map(transformToCustomerDTO) || [],
          total: result.total || 0,
          page,
          limit,
          totalPages: Math.ceil((result.total || 0) / limit)
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: 'FETCH_FAILED'
        });
      }
    } catch (error) {
      console.error('[CONTROLLER] Get customers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
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
import { transformToCustomerDTO } from '../dto/CustomerResponseDTO';

export class CustomerController {
  constructor(
    private customerApplicationService: any // Keep using the application service for compatibility
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

  async getCustomers(req: HttpRequest, res:HttpResponse): Promise<void> {
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

      const result = await this.customerApplicationService.getCustomers({
        tenantId,
        page: 1,
        limit: 50
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          customers: result.customers?.map(transformToCustomerDTO) || [],
          total: result.total || 0
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('[CUSTOMER-CONTROLLER] Error in getCustomers:', error);
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

      const result = await this.customerApplicationService.updateCustomer({
        id,
        tenantId,
        ...req.body
      });

      if (result.success) {
        res.json({
          success: true,
          data: transformToCustomerDTO(result.customer)
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
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

      const result = await this.customerApplicationService.deleteCustomer({
        id,
        tenantId
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Customer deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
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

      const result = await this.customerApplicationService.getCustomers(tenantId, {
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
<line_number>1</line_number>
import { Request, Response } from 'express';
import { standardResponse } from '../../../utils/standardResponse';
import { GetCustomersUseCase } from '../use-cases/GetCustomersUseCase';
import { CreateCustomerUseCase } from '../use-cases/CreateCustomerUseCase';

export class CustomerController {
  constructor(
    private getCustomersUseCase: GetCustomersUseCase,
    private createCustomerUseCase: CreateCustomerUseCase
  ) {}

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      const customers = await this.getCustomersUseCase.execute(tenantId);
      res.status(200).json(standardResponse(true, 'Clientes obtidos com sucesso', customers));
    } catch (error) {
      console.error('Erro ao obter clientes:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      const customer = await this.createCustomerUseCase.execute({ ...req.body, tenantId });
      res.status(201).json(standardResponse(true, 'Cliente criado com sucesso', customer));
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // Implementation would use a GetCustomerByIdUseCase
      res.status(200).json(standardResponse(true, 'Cliente encontrado', {}));
    } catch (error) {
      console.error('Erro ao obter cliente:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // Implementation would use an UpdateCustomerUseCase
      res.status(200).json(standardResponse(true, 'Cliente atualizado com sucesso', {}));
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // Implementation would use a DeleteCustomerUseCase
      res.status(200).json(standardResponse(true, 'Cliente excluído com sucesso'));
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }
}

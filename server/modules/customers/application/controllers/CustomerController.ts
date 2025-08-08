
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { CustomerApplicationService } from '../services/CustomerApplicationService';
import { transformToCustomerDTO } from '../dto/CustomerResponseDTO';

export class CustomerController {
  constructor(
    private customerApplicationService: CustomerApplicationService
  ) {}

  async createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        });
        return;
      }

      const customerData = {
        ...req.body,
        tenantId: req.user.tenantId
      };

      const result = await this.customerApplicationService.createCustomer(customerData);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: transformToCustomerDTO(result.customer),
          message: 'Customer created successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: 'CREATION_FAILED'
        });
      }
    } catch (error) {
      console.error('[CONTROLLER] Create customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        });
        return;
      }

      const customerId = req.params.id;
      const updateData = {
        ...req.body,
        tenantId: req.user.tenantId
      };

      const result = await this.customerApplicationService.updateCustomer({
        id: customerId,
        ...updateData
      });

      if (result.success) {
        res.json({
          success: true,
          data: transformToCustomerDTO(result.customer),
          message: 'Customer updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: 'UPDATE_FAILED'
        });
      }
    } catch (error) {
      console.error('[CONTROLLER] Update customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        });
        return;
      }

      const customerId = req.params.id;

      const result = await this.customerApplicationService.deleteCustomer({
        id: customerId,
        tenantId: req.user.tenantId
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Customer deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: 'DELETE_FAILED'
        });
      }
    } catch (error) {
      console.error('[CONTROLLER] Delete customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await this.customerApplicationService.getCustomers({
        tenantId: req.user.tenantId,
        page,
        limit
      });

      if (result.success) {
        res.json({
          success: true,
          customers: result.customers?.map(transformToCustomerDTO) || [],
          total: result.total || 0,
          page,
          limit,
          totalPages: Math.ceil((result.total || 0) / limit)
        });
      } else {
        res.status(500).json({
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

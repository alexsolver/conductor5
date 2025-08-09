// Removido import do express - Application layer não deve depender de frameworks específicos
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { CustomerApplicationService } from '../services/CustomerApplicationService';
import { transformToCustomerDTO } from '../dto/CustomerResponseDTO';

export class CustomerController {
  constructor(
    private customerApplicationService: CustomerApplicationService
  ) {}

  async createCustomer(customerData: any, tenantId?: string, userId?: string): Promise<any> {
    try {
      const { logInfo, logError } = await import('../../../../utils/logger');

      // Log operation start
      logInfo('Customer creation started', {
        tenantId,
        userId,
        customerType: customerData.customerType,
        operation: 'CREATE_CUSTOMER'
      });

      if (!tenantId) {
        logError('Customer creation failed - missing tenant ID', new Error('Missing tenant ID'), {
          userId,
          operation: 'CREATE_CUSTOMER'
        });
        return {
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        };
      }

      const result = await this.customerApplicationService.createCustomer({
        ...customerData,
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

      return {
        success: true,
        data: transformToCustomerDTO(result.customer),
        message: 'Customer created successfully'
      };
    } catch (error) {
      const { logError } = await import('../../../../utils/logger');
      logError('Customer creation failed', error, {
        operation: 'CREATE_CUSTOMER',
        tenantId,
        userId
      });

      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateCustomer(customerId: string, updateData: any, tenantId?: string, userId?: string): Promise<any> {
    try {
      if (!tenantId) {
        return {
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        };
      }

      const result = await this.customerApplicationService.updateCustomer({
        id: customerId,
        ...updateData,
        tenantId
      });

      if (result.success) {
        return {
          success: true,
          data: transformToCustomerDTO(result.customer),
          message: 'Customer updated successfully'
        };
      } else {
        return {
          success: false,
          error: result.error,
          code: 'UPDATE_FAILED'
        };
      }
    } catch (error) {
      console.error('[CONTROLLER] Update customer error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteCustomer(customerId: string, tenantId?: string, userId?: string): Promise<any> {
    try {
      if (!tenantId) {
        return {
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        };
      }

      const result = await this.customerApplicationService.deleteCustomer({
        id: customerId,
        tenantId
      });

      if (result.success) {
        return {
          success: true,
          message: 'Customer deleted successfully'
        };
      } else {
        return {
          success: false,
          error: result.error,
          code: 'DELETE_FAILED'
        };
      }
    } catch (error) {
      console.error('[CONTROLLER] Delete customer error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCustomers(tenantId?: string, page: number = 1, limit: number = 50): Promise<any> {
    try {
      if (!tenantId) {
        return {
          success: false,
          error: 'Tenant access required',
          code: 'MISSING_TENANT_ACCESS'
        };
      }

      const result = await this.customerApplicationService.getCustomers({
        tenantId,
        page,
        limit
      });

      if (result.success) {
        return {
          success: true,
          customers: result.customers?.map(transformToCustomerDTO) || [],
          total: result.total || 0,
          page,
          limit,
          totalPages: Math.ceil((result.total || 0) / limit)
        };
      } else {
        return {
          success: false,
          error: result.error,
          code: 'FETCH_FAILED'
        };
      }
    } catch (error) {
      console.error('[CONTROLLER] Get customers error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
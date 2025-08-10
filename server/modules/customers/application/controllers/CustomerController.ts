// Clean interfaces for HTTP abstraction
// Using interfaces instead of direct express dependency
interface ControllerRequest {
  user?: any;
  params: any;
  body: any;
  query: any;
}

interface ControllerResponse {
  status: (code: number) => ControllerResponse;
  json: (data: any) => void;
}

export class CustomerController {
  constructor(
    private customerApplicationService: CustomerApplicationService,
    private customerRepository: ICustomerRepository // Added repository dependency
  ) {}

  async createCustomer(req: ControllerRequest, res: ControllerResponse): Promise<void> {
    try {
      const { body, user } = req;
      const tenantId = user?.tenantId;
      const userId = user?.userId;

      if (!tenantId) {
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

      res.status(201).json({
        success: true,
        data: transformToCustomerDTO(result.customer),
        message: 'Customer created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCustomers(req: ControllerRequest, res: ControllerResponse): Promise<void> {
    try {
      const user = req.user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
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
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateCustomer(req: ControllerRequest, res: ControllerResponse): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;
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

  async deleteCustomer(req: ControllerRequest, res: ControllerResponse): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;
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

  async getAllCustomers(req: ControllerRequest, res: ControllerResponse): Promise<void> {
    try {
      const user = req.user;
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
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Dummy DTO transformation and repository interface for compilation
function transformToCustomerDTO(customer: any): any {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

interface CustomerApplicationService {
  createCustomer(data: any): Promise<{ customer: any }>;
  getCustomers(params: { tenantId: string; page: number; limit: number }): Promise<{ success: boolean; customers?: any[]; total?: number; error?: string }>;
  updateCustomer(data: any): Promise<{ success: boolean; customer?: any; error?: string }>;
  deleteCustomer(data: { id: string; tenantId: string }): Promise<{ success: boolean; error?: string }>;
}
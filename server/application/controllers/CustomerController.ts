// Application Controller - Clean Architecture
import { Request, Response } from "express";
import { CreateCustomerUseCase, CreateCustomerRequest } from "../usecases/CreateCustomerUseCase";
import { GetCustomersUseCase, GetCustomersRequest } from "../usecases/GetCustomersUseCase";
import { CustomerRepository } from "../../infrastructure/repositories/CustomerRepository";
import { DomainEventPublisher } from "../../infrastructure/events/DomainEventPublisher";
import { insertCustomerSchema } from '@shared/schema';
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";

export class CustomerController {
  private createCustomerUseCase: CreateCustomerUseCase;
  private getCustomersUseCase: GetCustomersUseCase;

  constructor() {
    // Dependency injection
    const customerRepository = new CustomerRepository();
    const eventPublisher = new DomainEventPublisher();
    
    this.createCustomerUseCase = new CreateCustomerUseCase(customerRepository, eventPublisher);
    this.getCustomersUseCase = new GetCustomersUseCase(customerRepository);
  }

  async getCustomers(req: any, res: Response): Promise<void> {
    try {
      // Extract tenant context from authenticated user
      const user = req.user;
      if (!user?.tenantId) {
        sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
        return;
      }

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const request: GetCustomersRequest = {
        tenantId: user.tenantId,
        page,
        limit
      };

      // Execute use case
      const result = await this.getCustomersUseCase.execute(request);

      if (!result.success) {
        sendError(res, result.error, result.error, 500);
        return;
      }

      sendSuccess(res, {
        customers: result.customers.map(customer => ({
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          fullName: customer.fullName,
          phone: customer.phone,
          company: customer.company,
          tags: customer.tags,
          metadata: customer.metadata,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          tenantId: customer.tenantId
        })),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }, "Customers retrieved successfully");

    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError("Error in getCustomers controller", error as any);
      sendError(res, error as any, "Failed to fetch customers", 500);
    }
  }

  async getCustomer(req: any, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user?.tenantId) {
        sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
        return;
      }

      const customerId = req.params.id;
      const customerRepository = new CustomerRepository();
      
      const customer = await customerRepository.findById(customerId, user.tenantId);
      
      if (!customer) {
        sendError(res, "Customer not found", "Customer not found", 404);
        return;
      }

      sendSuccess(res, {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        fullName: customer.fullName,
        phone: customer.phone,
        company: customer.company,
        tags: customer.tags,
        metadata: customer.metadata,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        tenantId: customer.tenantId
      }, "Customer retrieved successfully");

    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError("Error in getCustomer controller", error as any);
      sendError(res, error as any, "Failed to fetch customer", 500);
    }
  }

  async createCustomer(req: any, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user?.tenantId) {
        sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
        return;
      }

      // Validate request body
      const validation = insertCustomerSchema.safeParse(req.body);
      if (!validation.success) {
        sendValidationError(res, validation.error.errors.map(e => e.message), "Invalid customer data");
        return;
      }

      const customerData = validation.data;
      
      const request: CreateCustomerRequest = {
        tenantId: user.tenantId,
        email: customerData.email,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        company: customerData.company,
        tags: customerData.tags,
        metadata: customerData.metadata
      };

      // Execute use case
      const result = await this.createCustomerUseCase.execute(request);

      if (!result.success) {
        sendError(res, result.error, result.error, 400);
        return;
      }

      const customer = result.customer;
      sendSuccess(res, {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        fullName: customer.fullName,
        phone: customer.phone,
        company: customer.company,
        tags: customer.tags,
        metadata: customer.metadata,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        tenantId: customer.tenantId
      }, "Customer created successfully", 201);

    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError("Error in createCustomer controller", error as any);
      sendError(res, error as any, "Failed to create customer", 500);
    }
  }
}
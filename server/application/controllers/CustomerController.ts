// Application Controller - Clean Architecture
import { Request, Response } from "express";
import { CreateCustomerUseCase, CreateCustomerRequest } from "../usecases/CreateCustomerUseCase";
import { GetCustomersUseCase, GetCustomersRequest } from "../usecases/GetCustomersUseCase";
import { CustomerRepository } from "../../infrastructure/repositories/CustomerRepository";
import { DomainEventPublisher } from "../../infrastructure/events/DomainEventPublisher";
import { insertCustomerSchema } from "../../../shared/schema";

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
        res.status(400).json({ message: "User not associated with a tenant" });
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
        res.status(500).json({ message: result.error });
        return;
      }

      res.json({
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
      });

    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError("Error in getCustomers controller", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  }

  async getCustomer(req: any, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      const customerId = req.params.id;
      const customerRepository = new CustomerRepository();
      
      const customer = await customerRepository.findById(customerId, user.tenantId);
      
      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }

      res.json({
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
      });

    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError("Error in getCustomer controller", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  }

  async createCustomer(req: any, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      // Validate request body
      const validation = insertCustomerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          message: "Invalid customer data",
          errors: validation.error.errors
        });
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
        res.status(400).json({ message: result.error });
        return;
      }

      const customer = result.customer;
      res.status(201).json({
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
      });

    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError("Error in createCustomer controller", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  }
}
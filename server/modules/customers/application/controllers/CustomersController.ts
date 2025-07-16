// Application Layer - Controller
import { Request, Response } from "express";
import { CreateCustomerUseCase } from "../use-cases/CreateCustomerUseCase";
import { GetCustomersUseCase } from "../use-cases/GetCustomersUseCase";
import { DrizzleCustomerRepository } from "../../infrastructure/repositories/DrizzleCustomerRepository";
import { DomainEventPublisher } from "../../../shared/infrastructure/DomainEventPublisher";

export class CustomersController {
  private createCustomerUseCase: CreateCustomerUseCase;
  private getCustomersUseCase: GetCustomersUseCase;

  constructor() {
    const customerRepository = new DrizzleCustomerRepository();
    const eventPublisher = new DomainEventPublisher();
    
    this.createCustomerUseCase = new CreateCustomerUseCase(customerRepository, eventPublisher);
    this.getCustomersUseCase = new GetCustomersUseCase(customerRepository);
  }

  async getCustomers(req: Request & { user?: any }, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const result = await this.getCustomersUseCase.execute({
        tenantId: req.user.tenantId,
        limit,
        offset,
        verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        company: req.query.company as string,
      });

      res.json({
        customers: result.customers,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  }

  async createCustomer(req: Request & { user?: any }, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const customer = await this.createCustomerUseCase.execute({
        tenantId: req.user.tenantId,
        ...req.body,
      });

      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      
      if (error.message === 'Customer with this email already exists') {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to create customer" });
    }
  }

  async getCustomer(req: Request & { user?: any }, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const customerRepository = new DrizzleCustomerRepository();
      const customer = await customerRepository.findById(req.params.id, req.user.tenantId);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  }

  async updateCustomer(req: Request & { user?: any }, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const customerRepository = new DrizzleCustomerRepository();
      const existingCustomer = await customerRepository.findById(req.params.id, req.user.tenantId);

      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const updatedCustomer = existingCustomer.updateProfile(req.body);
      const result = await customerRepository.update(req.params.id, req.user.tenantId, updatedCustomer);

      res.json(result);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  }

  async deleteCustomer(req: Request & { user?: any }, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const customerRepository = new DrizzleCustomerRepository();
      const success = await customerRepository.delete(req.params.id, req.user.tenantId);

      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  }
}
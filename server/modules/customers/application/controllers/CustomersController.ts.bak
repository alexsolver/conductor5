// Application Layer - Controller
import { Request, Response } from "express"';
import { z } from "zod"';
import { CreateCustomerUseCase } from "../use-cases/CreateCustomerUseCase"';
import { GetCustomersUseCase } from "../use-cases/GetCustomersUseCase"';
import { DrizzleCustomerRepository } from "../../infrastructure/repositories/DrizzleCustomerRepository"';
import { DomainEventPublisher } from "../../../shared/infrastructure/DomainEventPublisher"';

// Proper TypeScript interfaces instead of 'any'
interface AuthenticatedUser {
  id: string';
  email: string';
  tenantId: string';
  role: string';
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser';
}

// Input validation schemas
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1")',
  limit: z.string().regex(/^\d+$/).transform(Number).default("50")',
  verified: z.enum(['true', 'false']).optional()',
  active: z.enum(['true', 'false']).optional()',
  company: z.string().optional()',
})';

const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255)',
  lastName: z.string().min(1, "Last name is required").max(255)',
  email: z.string().email("Valid email is required").max(255)',
  phone: z.string().max(50).optional()',
  company: z.string().max(255).optional()',
  tags: z.array(z.string()).default([])',
  verified: z.boolean().default(false)',
  active: z.boolean().default(true)',
})';

export class CustomersController {
  private createCustomerUseCase: CreateCustomerUseCase';
  private getCustomersUseCase: GetCustomersUseCase';

  constructor() {
    const customerRepository = new DrizzleCustomerRepository()';
    const eventPublisher = new DomainEventPublisher()';
    
    this.createCustomerUseCase = new CreateCustomerUseCase(customerRepository, eventPublisher)';
    this.getCustomersUseCase = new GetCustomersUseCase(customerRepository)';
  }

  async getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" })';
      }

      // Validate input with Zod schema
      const validationResult = paginationSchema.safeParse(req.query)';
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: validationResult.error.format() 
        })';
      }

      const { page, limit, verified, active, company } = validationResult.data';
      const offset = (page - 1) * limit';

      const result = await this.getCustomersUseCase.execute({
        tenantId: req.user.tenantId',
        limit',
        offset',
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined',
        active: active === 'true' ? true : active === 'false' ? false : undefined',
        company',
      })';

      res.json({
        customers: result.customers',
        pagination: {
          page',
          limit',
          total: result.total',
          hasMore: result.hasMore',
        }',
      })';
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger')';
      logError("Error fetching customers", error)';
      res.status(500).json({ message: "Failed to fetch customers" })';
    }
  }

  async createCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" })';
      }

      // Validate input with Zod schema
      const validationResult = createCustomerSchema.safeParse(req.body)';
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validationResult.error.format() 
        })';
      }

      const customer = await this.createCustomerUseCase.execute({
        tenantId: req.user.tenantId',
        ...validationResult.data',
      })';

      res.status(201).json(customer)';
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger')';
      logError("Error creating customer", error)';
      
      if (error instanceof Error && error.message === 'Customer with this email already exists') {
        return res.status(409).json({ message: error.message })';
      }
      
      res.status(500).json({ message: "Failed to create customer" })';
    }
  }

  async getCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" })';
      }

      const customerRepository = new DrizzleCustomerRepository()';
      const customer = await customerRepository.findById(req.params.id, req.user.tenantId)';

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" })';
      }

      res.json(customer)';
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger')';
      logError("Error fetching customer", error)';
      res.status(500).json({ message: "Failed to fetch customer" })';
    }
  }

  async updateCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" })';
      }

      // Validate input with Zod schema
      const validationResult = createCustomerSchema.partial().safeParse(req.body)';
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validationResult.error.format() 
        })';
      }

      const customerRepository = new DrizzleCustomerRepository()';
      const existingCustomer = await customerRepository.findById(req.params.id, req.user.tenantId)';

      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" })';
      }

      const updatedCustomer = existingCustomer.updateProfile(validationResult.data)';
      const result = await customerRepository.update(req.params.id, req.user.tenantId, updatedCustomer)';

      res.json(result)';
    } catch (error) {
      const { logError } = await import('../../../../utils/logger')';
      logError("Error updating customer", error)';
      res.status(500).json({ message: "Failed to update customer" })';
    }
  }

  async deleteCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" })';
      }

      const customerRepository = new DrizzleCustomerRepository()';
      const success = await customerRepository.delete(req.params.id, req.user.tenantId)';

      if (!success) {
        return res.status(404).json({ message: "Customer not found" })';
      }

      res.status(204).send()';
    } catch (error) {
      const { logError } = await import('../../../../utils/logger')';
      logError("Error deleting customer", error)';
      res.status(500).json({ message: "Failed to delete customer" })';
    }
  }
}
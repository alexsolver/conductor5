/**
 * Customer Controller
 * Clean Architecture - Application Layer
 * Handles HTTP requests and delegates to Application Service
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { CustomerApplicationService } from '../services/CustomerApplicationService';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

// Input validation schemas
const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Valid email is required").max(255),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  tags: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  active: z.boolean().default(true),
  timezone: z.string().max(50).default("UTC"),
  locale: z.string().max(10).default("en-US"),
  language: z.string().max(5).default("en"),
});

const queryParamsSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  verified: z.enum(['true', 'false']).optional(),
});

export class CustomerController {
  constructor(
    private customerApplicationService: CustomerApplicationService
  ) {}

  async createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      // Validate input with Zod schema
      const validationResult = createCustomerSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ 
          message: "Invalid input data", 
          errors: validationResult.error.format() 
        });
        return;
      }

      const input = {
        tenantId: req.user.tenantId,
        ...validationResult.data
      };

      const result = await this.customerApplicationService.createCustomer(input);

      if (result.success) {
        res.status(201).json(result.customer);
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error: unknown) {
      const { logError } = await import('../../../utils/logger');
      logError("Error creating customer", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  }

  async getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      // Validate query parameters with Zod schema
      const validationResult = queryParamsSchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: validationResult.error.format() 
        });
        return;
      }

      const { limit, offset, search, active, verified } = validationResult.data;

      const input = {
        tenantId: req.user.tenantId,
        limit,
        offset,
        search,
        active: active ? active === 'true' : undefined,
        verified: verified ? verified === 'true' : undefined
      };

      const result = await this.customerApplicationService.getCustomers(input);

      if (result.success) {
        res.json({
          customers: result.customers,
          total: result.total
        });
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error: unknown) {
      const { logError } = await import('../../../utils/logger');
      logError("Error fetching customers", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  }

  async updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      // Validate input with Zod schema
      const updateCustomerSchema = createCustomerSchema.partial();
      const validationResult = updateCustomerSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ 
          message: "Invalid input data", 
          errors: validationResult.error.format() 
        });
        return;
      }

      const input = {
        id: req.params.id,
        tenantId: req.user.tenantId,
        ...validationResult.data
      };

      const result = await this.customerApplicationService.updateCustomer(input);

      if (result.success) {
        res.json(result.customer);
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error: unknown) {
      const { logError } = await import('../../../utils/logger');
      logError("Error updating customer", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  }

  async deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      const input = {
        id: req.params.id,
        tenantId: req.user.tenantId
      };

      const result = await this.customerApplicationService.deleteCustomer(input);

      if (result.success) {
        res.status(204).send();
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      const { logError } = await import('../../../utils/logger');
      logError("Error deleting customer", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  }
}
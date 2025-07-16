/**
 * Customer Controller
 * Clean Architecture - Application Layer
 * Handles HTTP requests and delegates to Application Service
 */

import { Request, Response } from 'express';
import { CustomerApplicationService } from '../services/CustomerApplicationService';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

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

      const input = {
        tenantId: req.user.tenantId,
        ...req.body
      };

      const result = await this.customerApplicationService.createCustomer(input);

      if (result.success) {
        res.status(201).json(result.customer);
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  }

  async getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      const { limit, offset, search, active, verified } = req.query;

      const input = {
        tenantId: req.user.tenantId,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string,
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
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  }

  async updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(400).json({ message: "User not associated with a tenant" });
        return;
      }

      const input = {
        id: req.params.id,
        tenantId: req.user.tenantId,
        ...req.body
      };

      const result = await this.customerApplicationService.updateCustomer(input);

      if (result.success) {
        res.json(result.customer);
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error("Error updating customer:", error);
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
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  }
}
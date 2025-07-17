import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { storage } from "../../storage";
import { insertCustomerSchema } from "@shared/schema";
import { z } from "zod";

export const customersRouter = Router();

// Get all customers
customersRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Validate query parameters
    const { limit, offset } = req.query;
    const parsedLimit = limit ? Math.max(1, Math.min(100, parseInt(limit as string) || 50)) : 50;
    const parsedOffset = offset ? Math.max(0, parseInt(offset as string) || 0) : 0;
    
    // Performance optimization: Use cache-aware method
    const customers = await storage.getCustomers(
      req.user.tenantId,
      parsedLimit,
      parsedOffset
    );

    res.json({ customers });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching customers", error, { 
      tenantId: req.user?.tenantId,
      limit: parsedLimit,
      offset: parsedOffset 
    });
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// Create new customer
customersRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { logInfo } = await import('../../utils/logger');
    logInfo("Creating customer", { 
      tenantId: req.user.tenantId,
      bodyKeys: Object.keys(req.body)
    });

    // Validate input using the schema
    const dataToValidate = {
      ...req.body,
      tenantId: req.user.tenantId
    };
    
    const validatedData = insertCustomerSchema.parse(dataToValidate);

    const customer = await storage.createCustomer(validatedData);
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    const { logError } = await import('../../utils/logger');
    logError("Error creating customer", error, { tenantId: req.user?.tenantId });
    res.status(500).json({ message: "Failed to create customer" });
  }
});

// Update customer
customersRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Validate ID parameter
    const customerId = req.params.id;
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // Validate input data using partial schema (exclude required fields for updates)
    const updateSchema = insertCustomerSchema.partial().omit({ tenantId: true });
    const validatedData = updateSchema.parse(req.body);

    const customer = await storage.updateCustomer(customerId, req.user.tenantId, validatedData);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    const { logError } = await import('../../utils/logger');
    logError("Error updating customer", error, { 
      customerId: req.params.id,
      tenantId: req.user?.tenantId 
    });
    res.status(500).json({ message: "Failed to update customer" });
  }
});

// Delete customer
customersRouter.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Validate ID parameter
    const customerId = req.params.id;
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const deleted = await storage.deleteCustomer(customerId, req.user.tenantId);
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(204).send();
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error deleting customer", error, { 
      customerId: req.params.id,
      tenantId: req.user?.tenantId 
    });
    res.status(500).json({ message: "Failed to delete customer" });
  }
});
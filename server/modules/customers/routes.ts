import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { storageSimple } from "../../storage-simple";
import { insertCustomerSchema } from "@shared/schema";
import { z } from "zod";
import { getCustomerCompanyController } from "./infrastructure/setup/CustomerDependencySetup";

export const customersRouter = Router();

// Get all customers
customersRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  // Validate query parameters first (outside try block to be accessible in catch)
  const { limit, offset } = req.query;
  const parsedLimit = limit ? Math.max(1, Math.min(100, parseInt(limit as string) || 50)) : 50;
  const parsedOffset = offset ? Math.max(0, parseInt(offset as string) || 0) : 0;

  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    
    // Performance optimization: Use cache-aware method
    const customers = await storageSimple.getCustomers(req.user.tenantId, {
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({ customers });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching customers", error, { 
      tenantId: req.user?.tenantId,
      options: { limit: parsedLimit, offset: parsedOffset }
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

    const customer = await storageSimple.createCustomer(req.user.tenantId, validatedData);
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

    const customer = await storageSimple.updateCustomer(customerId, req.user.tenantId, validatedData);
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

    const deleted = await storageSimple.deleteCustomer(customerId, req.user.tenantId);
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

// Get customer company controller instance
const customerCompanyController = getCustomerCompanyController();

// Customer Company Routes
// GET /api/customers/companies - Get all customer companies
customersRouter.get('/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    // Use direct SQL query to avoid schema issues
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);
    
    const result = await pool.query(
      `SELECT * FROM "${schemaName}"."customer_companies" WHERE tenant_id = $1 ORDER BY name`,
      [req.user.tenantId]
    );

    const companies = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      size: row.size,
      subscriptionTier: row.subscription_tier,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching customer companies:', error);
    res.status(500).json({ message: 'Failed to fetch customer companies' });
  }
});

// POST /api/customers/companies - Create new customer company
customersRouter.post('/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const { name, displayName, description, size, subscriptionTier } = req.body;
    
    const pool = (await import('../../db')).schemaManager.getPool();
    const result = await pool.query(
      `INSERT INTO "${(await import('../../db')).schemaManager.getSchemaName(req.user.tenantId)}"."customer_companies" 
       (tenant_id, name, display_name, description, size, subscription_tier, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7) 
       RETURNING *`,
      [req.user.tenantId, name, displayName, description, size, subscriptionTier, req.user.id]
    );

    const company = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        displayName: company.display_name,
        description: company.description,
        size: company.size,
        subscriptionTier: company.subscription_tier,
        status: company.status,
        createdAt: company.created_at,
        updatedAt: company.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating customer company:', error);
    res.status(500).json({ message: 'Failed to create customer company' });
  }
});

// GET /api/customers/:customerId/companies - Get companies for a customer
customersRouter.get('/:customerId/companies', jwtAuth, (req: AuthenticatedRequest, res) => {
  customerCompanyController.getCustomerMemberships(req, res);
});

// GET /api/customers/companies/:companyId/members - Get members of a company
customersRouter.get('/companies/:companyId/members', jwtAuth, (req: AuthenticatedRequest, res) => {
  customerCompanyController.getCompanyMemberships(req, res);
});
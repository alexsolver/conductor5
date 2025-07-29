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
  const { limit, offset, search } = req.query;
  const parsedLimit = limit ? Math.max(1, Math.min(100, parseInt(limit as string) || 50)) : 50;
  const parsedOffset = offset ? Math.max(0, parseInt(offset as string) || 0) : 0;
  const searchTerm = search as string;

  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Direct database query for better reliability
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    let query = `
      SELECT 
        id,
        tenant_id,
        customer_type,
        email,
        first_name,
        last_name,
        company_name,
        cpf,
        cnpj,
        phone,
        mobile_phone,
        contact_person,
        responsible,
        position,
        supervisor,
        coordinator,
        manager,
        description,
        internal_code,
        status,
        created_at,
        updated_at
      FROM "${schemaName}".customers
      WHERE tenant_id = $1
    `;

    const queryParams: any[] = [req.user.tenantId];
    let paramIndex = 2;

    // Add search functionality
    if (searchTerm && searchTerm.trim()) {
      query += ` AND (
        LOWER(first_name) LIKE LOWER($${paramIndex}) OR
        LOWER(last_name) LIKE LOWER($${paramIndex}) OR
        LOWER(company_name) LIKE LOWER($${paramIndex}) OR
        LOWER(email) LIKE LOWER($${paramIndex}) OR
        LOWER(contact_person) LIKE LOWER($${paramIndex})
      )`;
      queryParams.push(`%${searchTerm.trim()}%`);
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE 
        WHEN customer_type = 'PF' THEN COALESCE(first_name, email)
        ELSE COALESCE(company_name, email)
      END
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parsedLimit, parsedOffset);

    const result = await pool.query(query, queryParams);

    const customers = result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      customerType: row.customer_type,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.company_name,
      cpf: row.cpf,
      cnpj: row.cnpj,
      phone: row.phone,
      mobilePhone: row.mobile_phone,
      contactPerson: row.contact_person,
      responsible: row.responsible,
      position: row.position,
      supervisor: row.supervisor,
      coordinator: row.coordinator,
      manager: row.manager,
      description: row.description,
      internalCode: row.internal_code,
      status: row.status || 'Ativo',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Computed fields for compatibility
      name: row.customer_type === 'PJ' 
        ? row.company_name || row.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email,
      fullName: row.customer_type === 'PJ' 
        ? row.company_name || row.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email
    }));

    console.log(`Found ${customers.length} customers for tenant ${req.user.tenantId}`);

    res.json({ 
      success: true,
      customers,
      count: customers.length,
      total: customers.length
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching customers", error, { 
      tenantId: req.user?.tenantId,
      options: { limit: parsedLimit, offset: parsedOffset, search: searchTerm }
    });
    console.error('Error in customers API:', error);
    res.status(500).json({ message: "Failed to fetch customers", error: error.message });
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

// PUT /api/customers/companies/:id - Update customer company
customersRouter.put('/companies/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.id;
    const { name, displayName, description, size, subscriptionTier, status } = req.body;

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const result = await pool.query(
      `UPDATE "${schemaName}"."customer_companies" 
       SET name = $1, display_name = $2, description = $3, size = $4, 
           subscription_tier = $5, status = $6, updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8
       RETURNING *`,
      [name, displayName, description, size, subscriptionTier, status, companyId, req.user.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const company = result.rows[0];
    res.json({
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
    console.error('Error updating customer company:', error);
    res.status(500).json({ message: 'Failed to update customer company' });
  }
});

// DELETE /api/customers/companies/:id - Delete customer company
customersRouter.delete('/companies/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.id;

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Check if company has associated customers
    const membershipsCheck = await pool.query(
      `SELECT COUNT(*) as count FROM "${schemaName}"."customer_company_memberships" 
       WHERE company_id = $1 AND tenant_id = $2`,
      [companyId, req.user.tenantId]
    );

    if (Number(membershipsCheck.rows[0]?.count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir empresa que possui clientes associados'
      });
    }

    // Check if company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, req.user.tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Company not found' 
      });
    }

    // Delete the company
    const result = await pool.query(
      `DELETE FROM "${schemaName}"."customer_companies" 
       WHERE id = $1 AND tenant_id = $2`,
      [companyId, req.user.tenantId]
    );

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer company:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete customer company' 
    });
  }
});

// GET /api/customers/:customerId/companies - Get companies for a customer
customersRouter.get('/:customerId/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const customerId = req.params.customerId;

    // Use direct SQL query to get customer companies
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const result = await pool.query(
      `SELECT 
        ccm.id as membership_id,
        ccm.role,
        ccm.is_primary,
        ccm.title,
        ccm.department,
        cc.id as company_id,
        cc.name as company_name,
        cc.display_name,
        cc.description,
        cc.size,
        cc.subscription_tier,
        cc.status
       FROM "${schemaName}"."customer_company_memberships" ccm
       JOIN "${schemaName}"."customer_companies" cc ON ccm.company_id = cc.id
       WHERE ccm.customer_id = $1 AND ccm.tenant_id = $2
       ORDER BY ccm.is_primary DESC, cc.name`,
      [customerId, req.user.tenantId]
    );

    const memberships = result.rows.map(row => ({
      membership_id: row.membership_id,
      company_id: row.company_id,
      company_name: row.company_name,
      display_name: row.display_name,
      role: row.role,
      is_primary: row.is_primary,
      title: row.title,
      department: row.department,
      description: row.description,
      size: row.size,
      subscription_tier: row.subscription_tier,
      status: row.status
    }));

    res.json(memberships);
  } catch (error) {
    console.error('Error fetching customer companies:', error);
    res.status(500).json({ message: 'Failed to fetch customer companies' });
  }
});

// GET /api/companies/:companyId/customers - Get customers for a specific company
customersRouter.get('/companies/:companyId/customers', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.companyId;

    console.log('Fetching customers for company:', companyId, 'in tenant', req.user.tenantId);

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Check if this is actually a customer ID being used as company
    const customerQuery = `
      SELECT 
        c.id,
        c.tenant_id,
        c.customer_type,
        c.email,
        c.first_name,
        c.last_name,
        c.company_name,
        c.cpf,
        c.cnpj,
        c.phone,
        c.mobile_phone,
        c.contact_person,
        c.responsible,
        c.position,
        c.supervisor,
        c.coordinator,
        c.manager,
        c.description,
        c.internal_code,
        c.status,
        c.created_at,
        c.updated_at
      FROM "${schemaName}".customers c
      WHERE c.id = $1 AND c.tenant_id = $2
    `;

    const customerResult = await pool.query(customerQuery, [companyId, req.user.tenantId]);

    if (customerResult.rows.length > 0) {
      // This is a customer, return it as a single-item array
      const customer = customerResult.rows[0];
      const customerData = {
        id: customer.id,
        tenantId: customer.tenant_id,
        customerType: customer.customer_type,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        companyName: customer.company_name,
        cpf: customer.cpf,
        cnpj: customer.cnpj,
        phone: customer.phone,
        mobilePhone: customer.mobile_phone,
        contactPerson: customer.contact_person,
        responsible: customer.responsible,
        position: customer.position,
        supervisor: customer.supervisor,
        coordinator: customer.coordinator,
        manager: customer.manager,
        description: customer.description,
        internalCode: customer.internal_code,
        status: customer.status || 'Ativo',
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        name: customer.customer_type === 'PJ' 
          ? customer.company_name || customer.email
          : [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email,
        fullName: customer.customer_type === 'PJ' 
          ? customer.company_name || customer.email
          : [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email
      };

      console.log(`Found 1 customer for company ${companyId}`);

      return res.json({
        success: true,
        customers: [customerData],
        count: 1
      });
    }

    // If not a customer, try to find it as a company
    const companyMembersQuery = `
      SELECT 
        c.id,
        c.tenant_id,
        c.customer_type,
        c.email,
        c.first_name,
        c.last_name,
        c.company_name,
        c.cpf,
        c.cnpj,
        c.phone,
        c.mobile_phone,
        c.contact_person,
        c.responsible,
        c.position,
        c.supervisor,
        c.coordinator,
        c.manager,
        c.description,
        c.internal_code,
        c.status,
        c.created_at,
        c.updated_at,
        ccm.role,
        ccm.is_primary
      FROM "${schemaName}".customers c
      JOIN "${schemaName}"."customer_company_memberships" ccm ON c.id = ccm.customer_id
      WHERE ccm.company_id = $1 AND ccm.tenant_id = $2
      ORDER BY ccm.is_primary DESC, 
        CASE 
          WHEN c.customer_type = 'PF' THEN COALESCE(c.first_name, c.email)
          ELSE COALESCE(c.company_name, c.email)
        END
    `;

    const result = await pool.query(companyMembersQuery, [companyId, req.user.tenantId]);

    const customers = result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      customerType: row.customer_type,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.company_name,
      cpf: row.cpf,
      cnpj: row.cnpj,
      phone: row.phone,
      mobilePhone: row.mobile_phone,
      contactPerson: row.contact_person,
      responsible: row.responsible,
      position: row.position,
      supervisor: row.supervisor,
      coordinator: row.coordinator,
      manager: row.manager,
      description: row.description,
      internalCode: row.internal_code,
      status: row.status || 'Ativo',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      role: row.role,
      isPrimary: row.is_primary,
      name: row.customer_type === 'PJ' 
        ? row.company_name || row.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email,
      fullName: row.customer_type === 'PJ' 
        ? row.company_name || row.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email
    }));

    console.log(`Found ${customers.length} customers for company ${companyId}`);

    res.json({
      success: true,
      customers,
      count: customers.length
    });
  } catch (error: any) {
    console.error('Error fetching customers for company:', {
      error: error.message,
      stack: error.stack,
      companyId: req.params.companyId,
      tenantId: req.user?.tenantId
    });

    res.status(500).json({ 
      success: false,
      message: 'Erro ao carregar clientes da empresa',
      error: error.message
    });
  }
});

// GET /api/customers/companies/:companyId/available - Get customers not associated with company
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.companyId;

    console.log('Fetching available customers for company:', companyId, 'tenant:', req.user.tenantId);

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First check if the company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, req.user.tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Company not found' 
      });
    }

    // Get customers not associated with this company
    const result = await pool.query(
      `SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.customer_type,
        c.company_name,
        c.status
       FROM "${schemaName}".customers c
       WHERE c.tenant_id = $1
       AND c.id NOT IN (
         SELECT ccm.customer_id 
         FROM "${schemaName}"."customer_company_memberships" ccm 
         WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
       )
       ORDER BY 
         CASE WHEN c.first_name IS NOT NULL THEN c.first_name ELSE c.company_name END,
         c.last_name`,
      [req.user.tenantId, companyId]
    );

    console.log(`Found ${result.rows.length} available customers`);

    const availableCustomers = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      customerType: row.customer_type,
      companyName: row.company_name,
      status: row.status || 'active'
    }));

    res.json({
      success: true,
      data: availableCustomers
    });
  } catch (error: any) {
    console.error('Error fetching available customers:', {
      error: error.message,
      stack: error.stack,
      companyId: req.params.companyId,
      tenantId: req.user?.tenantId
    });

    res.status(500).json({ 
      success: false,
      message: 'Erro ao carregar clientes disponíveis',
      error: error.message
    });
  }
});

// GET /api/customers/companies/:companyId/members - Get members of a company
customersRouter.get('/companies/:companyId/members', jwtAuth, (req: AuthenticatedRequest, res) => {
  customerCompanyController.getCompanyMemberships(req, res);
});

// POST /api/customers/:customerId/companies - Add customer to company
customersRouter.post('/:customerId/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const customerId = req.params.customerId;
    const { companyId, role = 'member', isPrimary = false } = req.body;

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Check if membership already exists
    const existingResult = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_company_memberships" 
       WHERE customer_id = $1 AND company_id = $2 AND tenant_id = $3`,
      [customerId, companyId, req.user.tenantId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'Customer is already a member of this company' });
    }

    // Insert new membership
    const result = await pool.query(
      `INSERT INTO "${schemaName}"."customer_company_memberships" 
       (customer_id, company_id, role, is_primary, tenant_id, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [customerId, companyId, role, isPrimary, req.user.tenantId, req.user.id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding customer to company:', error);
    res.status(500).json({ message: 'Failed to add customer to company' });
  }
});

// POST /api/customers/companies/:companyId/associate-multiple - Associate multiple customers to a company
customersRouter.post('/companies/:companyId/associate-multiple', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.companyId;
    const { customerIds, role = 'member', isPrimary = false } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ message: 'Customer IDs array is required' });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Verify company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, req.user.tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check for existing memberships
    const existingQuery = `
      SELECT customer_id FROM "${schemaName}"."customer_company_memberships" 
      WHERE company_id = $1 AND customer_id = ANY($2::uuid[]) AND tenant_id = $3
    `;

    const existingResult = await pool.query(existingQuery, [companyId, customerIds, req.user.tenantId]);
    const existingCustomerIds = existingResult.rows.map(row => row.customer_id);

    // Filter out customers that are already associated
    const newCustomerIds = customerIds.filter(id => !existingCustomerIds.includes(id));

    if (newCustomerIds.length === 0) {
      return res.status(400).json({ 
        message: 'All selected customers are already associated with this company',
        existingAssociations: existingCustomerIds.length
      });
    }

    // Insert new memberships
    const insertValues = newCustomerIds.map((customerId, index) => {
      const paramOffset = index * 6;
      return `($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6})`;
    }).join(', ');

    const insertParams = newCustomerIds.flatMap(customerId => [
      customerId,
      companyId,
      role,
      isPrimary,
      req.user.tenantId,
      req.user.id
    ]);

    const insertQuery = `
      INSERT INTO "${schemaName}"."customer_company_memberships" 
      (customer_id, company_id, role, is_primary, tenant_id, created_by)
      VALUES ${insertValues}
      RETURNING *
    `;

    const result = await pool.query(insertQuery, insertParams);

    res.status(201).json({
      success: true,
      message: `Successfully associated ${result.rowCount} customers to company`,
      data: {
        companyId,
        associatedCustomers: result.rowCount,
        skippedExisting: existingCustomerIds.length,
        memberships: result.rows.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          companyId: row.company_id,
          role: row.role,
          isPrimary: row.is_primary
        }))
      }
    });
  } catch (error: any) {
    console.error('Error associating multiple customers to company:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to associate customers to company',
      error: error.message
    });
  }
});

// DELETE /api/customers/:customerId/companies/:companyId - Remove customer from company
customersRouter.delete('/:customerId/companies/:companyId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      console.error('Delete company association: Missing tenant context');
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const customerId = req.params.customerId;
    const companyId = req.params.companyId;

    console.log('Attempting to delete company association:', {
      customerId,
      companyId,
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    if (!customerId || !companyId) {
      console.error('Delete company association: Missing required parameters');
      return res.status(400).json({ message: 'Customer ID and Company ID are required' });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First, check if the membership exists
    const checkQuery = `
      SELECT * FROM "${schemaName}"."customer_company_memberships" 
      WHERE customer_id = $1 AND company_id = $2 AND tenant_id = $3
    `;

    const checkResult = await pool.query(checkQuery, [customerId, companyId, req.user.tenantId]);

    console.log('Membership check result:', {
      found: checkResult.rows.length > 0,
      membership: checkResult.rows[0] || null
    });

    if (checkResult.rows.length === 0) {
      console.warn('Membership not found for deletion:', { customerId, companyId });
      return res.status(404).json({ 
        success: false,
        message: 'Membership not found',
        details: { customerId, companyId }
      });
    }

    // Delete the membership
    const deleteQuery = `
      DELETE FROM "${schemaName}"."customer_company_memberships" 
      WHERE customer_id = $1 AND company_id = $2 AND tenant_id = $3
    `;

    const result = await pool.query(deleteQuery, [customerId, companyId, req.user.tenantId]);

    console.log('Delete operation result:', {
      rowCount: result.rowCount,
      success: result.rowCount > 0
    });

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Membership not found or already deleted' 
      });
    }

    res.json({ 
      success: true,
      message: 'Company association removed successfully',
      deletedCount: result.rowCount
    });
  } catch (error: any) {
    console.error('Error removing customer from company:', {
      error: error.message,
      stack: error.stack,
      customerId: req.params.customerId,
      companyId: req.params.companyId,
      tenantId: req.user?.tenantId
    });

    res.status(500).json({ 
      success: false,
      message: 'Failed to remove customer from company',
      error: error.message
    });
  }
});

// GET /api/customers/companies/:companyId/customers - Get customers for a specific company
customersRouter.get('/companies/:companyId/customers', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.companyId;

    console.log('Fetching customers for company:', companyId, 'in tenant', req.user.tenantId);

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Check if this is actually a customer ID being used as company
    const customerQuery = `
      SELECT 
        c.id,
        c.tenant_id,
        c.customer_type,
        c.email,
        c.first_name,
        c.last_name,
        c.company_name,
        c.cpf,
        c.cnpj,
        c.phone,
        c.mobile_phone,
        c.contact_person,
        c.responsible,
        c.position,
        c.supervisor,
        c.coordinator,
        c.manager,
        c.description,
        c.internal_code,
        c.status,
        c.created_at,
        c.updated_at
      FROM "${schemaName}".customers c
      WHERE c.id = $1 AND c.tenant_id = $2
    `;

    const customerResult = await pool.query(customerQuery, [companyId, req.user.tenantId]);

    if (customerResult.rows.length > 0) {
      // This is a customer, return it as a single-item array
      const customer = customerResult.rows[0];
      const customerData = {
        id: customer.id,
        tenantId: customer.tenant_id,
        customerType: customer.customer_type,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        companyName: customer.company_name,
        cpf: customer.cpf,
        cnpj: customer.cnpj,
        phone: customer.phone,
        mobilePhone: customer.mobile_phone,
        contactPerson: customer.contact_person,
        responsible: customer.responsible,
        position: customer.position,
        supervisor: customer.supervisor,
        coordinator: customer.coordinator,
        manager: customer.manager,
        description: customer.description,
        internalCode: customer.internal_code,
        status: customer.status || 'Ativo',
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        name: customer.customer_type === 'PJ' 
          ? customer.company_name || customer.email
          : [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email,
        fullName: customer.customer_type === 'PJ' 
          ? customer.company_name || customer.email
          : [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email
      };

      console.log(`Found 1 customer for company ${companyId}`);

      return res.json({
        success: true,
        customers: [customerData],
        count: 1
      });
    }

    // If not a customer, try to find it as a company
    const companyMembersQuery = `
      SELECT 
        c.id,
        c.tenant_id,
        c.customer_type,
        c.email,
        c.first_name,
        c.last_name,
        c.company_name,
        c.cpf,
        c.cnpj,
        c.phone,
        c.mobile_phone,
        c.contact_person,
        c.responsible,
        c.position,
        c.supervisor,
        c.coordinator,
        c.manager,
        c.description,
        c.internal_code,
        c.status,
        c.created_at,
        c.updated_at,
        ccm.role,
        ccm.is_primary
      FROM "${schemaName}".customers c
      JOIN "${schemaName}"."customer_company_memberships" ccm ON c.id = ccm.customer_id
      WHERE ccm.company_id = $1 AND ccm.tenant_id = $2
      ORDER BY ccm.is_primary DESC, 
        CASE 
          WHEN c.customer_type = 'PF' THEN COALESCE(c.first_name, c.email)
          ELSE COALESCE(c.company_name, c.email)
        END
    `;

    const result = await pool.query(companyMembersQuery, [companyId, req.user.tenantId]);

    const customers = result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      customerType: row.customer_type,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.company_name,
      cpf: row.cpf,
      cnpj: row.cnpj,
      phone: row.phone,
      mobilePhone: row.mobile_phone,
      contactPerson: row.contact_person,
      responsible: row.responsible,
      position: row.position,
      supervisor: row.supervisor,
      coordinator: row.coordinator,
      manager: row.manager,
      description: row.description,
      internalCode: row.internal_code,
      status: row.status || 'Ativo',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      role: row.role,
      isPrimary: row.is_primary,
      name: row.customer_type === 'PJ' 
        ? row.company_name || row.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || customer.email,
      fullName: row.customer_type === 'PJ' 
        ? customer.company_name || customer.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || customer.email
    }));

    console.log(`Found ${customers.length} customers for company ${companyId}`);

    res.json({
      success: true,
      customers,
      count: customers.length
    });
  } catch (error: any) {
    console.error('Error fetching customers for company:', {
      error: error.message,
      stack: error.stack,
      companyId: req.params.companyId,
      tenantId: req.user?.tenantId
    });

    res.status(500).json({ 
      success: false,
      message: 'Erro ao carregar clientes da empresa',
      error: error.message
    });
  }
});

// GET /api/customers/companies/:companyId/available - Get customers not associated with company
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.companyId;

    console.log('Fetching available customers for company:', companyId, 'tenant:', req.user.tenantId);

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First check if the company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, req.user.tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Company not found' 
      });
    }

    // Get customers not associated with this company
    const result = await pool.query(
      `SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.customer_type,
        c.company_name,
        c.status
       FROM "${schemaName}".customers c
       WHERE c.tenant_id = $1
       AND c.id NOT IN (
         SELECT ccm.customer_id 
         FROM "${schemaName}"."customer_company_memberships" ccm 
         WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
       )
       ORDER BY 
         CASE WHEN c.first_name IS NOT NULL THEN c.first_name ELSE c.company_name END,
         c.last_name`,
      [req.user.tenantId, companyId]
    );

    console.log(`Found ${result.rows.length} available customers`);

    const availableCustomers = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      customerType: row.customer_type,
      companyName: row.company_name,
      status: row.status || 'active'
    }));

    res.json({
      success: true,
      data: availableCustomers
    });
  } catch (error: any) {
    console.error('Error fetching available customers:', {
      error: error.message,
      stack: error.stack,
      companyId: req.params.companyId,
      tenantId: req.user?.tenantId
    });

    res.status(500).json({ 
      success: false,
      message: 'Erro ao carregar clientes disponíveis',
      error: error.message
    });
  }
});

// GET /api/customers/companies/:companyId/members - Get members of a company
customersRouter.get('/companies/:companyId/members', jwtAuth, (req: AuthenticatedRequest, res) => {
  customerCompanyController.getCompanyMemberships(req, res);
});

// POST /api/customers/:customerId/companies - Add customer to company
customersRouter.post('/:customerId/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const customerId = req.params.customerId;
    const { companyId, role = 'member', isPrimary = false } = req.body;

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Check if membership already exists
    const existingResult = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_company_memberships" 
       WHERE customer_id = $1 AND company_id = $2 AND tenant_id = $3`,
      [customerId, companyId, req.user.tenantId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'Customer is already a member of this company' });
    }

    // Insert new membership
    const result = await pool.query(
      `INSERT INTO "${schemaName}"."customer_company_memberships" 
       (customer_id, company_id, role, is_primary, tenant_id, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [customerId, companyId, role, isPrimary, req.user.tenantId, req.user.id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding customer to company:', error);
    res.status(500).json({ message: 'Failed to add customer to company' });
  }
});

// POST /api/customers/companies/:companyId/associate-multiple - Associate multiple customers to a company
customersRouter.post('/companies/:companyId/associate-multiple', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.companyId;
    const { customerIds, role = 'member', isPrimary = false } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ message: 'Customer IDs array is required' });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Verify company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, req.user.tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check for existing memberships
    const existingQuery = `
      SELECT customer_id FROM "${schemaName}"."customer_company_memberships" 
      WHERE company_id = $1 AND customer_id = ANY($2::uuid[]) AND tenant_id = $3
    `;

    const existingResult = await pool.query(existingQuery, [companyId, customerIds, req.user.tenantId]);
    const existingCustomerIds = existingResult.rows.map(row => row.customer_id);

    // Filter out customers that are already associated
    const newCustomerIds = customerIds.filter(id => !existingCustomerIds.includes(id));

    if (newCustomerIds.length === 0) {
      return res.status(400).json({ 
        message: 'All selected customers are already associated with this company',
        existingAssociations: existingCustomerIds.length
      });
    }

    // Insert new memberships
    const insertValues = newCustomerIds.map((customerId, index) => {
      const paramOffset = index * 6;
      return `($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6})`;
    }).join(', ');

    const insertParams = newCustomerIds.flatMap(customerId => [
      customerId,
      companyId,
      role,
      isPrimary,
      req.user.tenantId,
      req.user.id
    ]);

    const insertQuery = `
      INSERT INTO "${schemaName}"."customer_company_memberships" 
      (customer_id, company_id, role, is_primary, tenant_id, created_by)
      VALUES ${insertValues}
      RETURNING *
    `;

    const result = await pool.query(insertQuery, insertParams);

    res.status(201).json({
      success: true,
      message: `Successfully associated ${result.rowCount} customers to company`,
      data: {
        companyId,
        associatedCustomers: result.rowCount,
        skippedExisting: existingCustomerIds.length,
        memberships: result.rows.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          companyId: row.company_id,
          role: row.role,
          isPrimary: row.is_primary
        }))
      }
    });
  } catch (error: any) {
    console.error('Error associating multiple customers to company:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to associate customers to company',
      error: error.message
    });
  }
});

// DELETE /api/customers/:customerId/companies/:companyId - Remove customer from company
customersRouter.delete('/:customerId/companies/:companyId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      console.error('Delete company association: Missing tenant context');
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const customerId = req.params.customerId;
    const companyId = req.params.companyId;

    console.log('Attempting to delete company association:', {
      customerId,
      companyId,
      tenantId: req.user.tenantId,
      userId: req.user.id
    });

    if (!customerId || !companyId) {
      console.error('Delete company association: Missing required parameters');
      return res.status(400).json({ message: 'Customer ID and Company ID are required' });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First, check if the membership exists
    const checkQuery = `
      SELECT * FROM "${schemaName}"."customer_company_memberships" 
      WHERE customer_id = $1 AND company_id = $2 AND tenant_id = $3
    `;

    const checkResult = await pool.query(checkQuery, [customerId, companyId, req.user.tenantId]);

    console.log('Membership check result:', {
      found: checkResult.rows.length > 0,
      membership: checkResult.rows[0] || null
    });

    if (checkResult.rows.length === 0) {
      console.warn('Membership not found for deletion:', { customerId, companyId });
      return res.status(404).json({ 
        success: false,
        message: 'Membership not found',
        details: { customerId, companyId }
      });
    }

    // Delete the membership
    const deleteQuery = `
      DELETE FROM "${schemaName}"."customer_company_memberships" 
      WHERE customer_id = $1 AND company_id = $2 AND tenant_id = $3
    `;

    const result = await pool.query(deleteQuery, [customerId, companyId, req.user.tenantId]);

    console.log('Delete operation result:', {
      rowCount: result.rowCount,
      success: result.rowCount > 0
    });

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Membership not found or already deleted' 
      });
    }

    res.json({ 
      success: true,
      message: 'Company association removed successfully',
      deletedCount: result.rowCount
    });
  } catch (error: any) {
    console.error('Error removing customer from company:', {
      error: error.message,
      stack: error.stack,
      customerId: req.params.customerId,
      companyId: req.params.companyId,
      tenantId: req.user?.tenantId
    });

    res.status(500).json({ 
      success: false,
      message: 'Failed to remove customer from company',
      error: error.message
    });
  }
});
// Direct endpoint for getting customers by company (used by PersonSelector)
customersRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
        const pool = schemaManager.getPool();
        const schemaName = schemaManager.getSchemaName(req.user.tenantId);

        const result = await pool.query(`SELECT * FROM "${schemaName}".customers`);

        res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error in customers route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/customers/companies/:companyId/customers - Get customers for a specific company
customersRouter.get('/companies/:companyId/customers', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const companyId = req.params.companyId;

    console.log('Fetching customers for company:', companyId, 'in tenant', req.user.tenantId);

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Check if this is actually a customer ID being used as company
    const customerQuery = `
      SELECT 
        c.id,
        c.tenant_id,
        c.customer_type,
        c.email,
        c.first_name,
        c.last_name,
        c.company_name,
        c.cpf,
        c.cnpj,
        c.phone,
        c.mobile_phone,
        c.contact_person,
        c.responsible,
        c.position,
        c.supervisor,
        c.coordinator,
        c.manager,
        c.description,
        c.internal_code,
        c.status,
        c.created_at,
        c.updated_at
      FROM "${schemaName}".customers c
      INNER JOIN "${schemaName}".customer_company_memberships ccm ON c.id = ccm.customer_id
      WHERE ccm.company_id = $1 AND ccm.tenant_id = $2
    `;

    const result = await pool.query(customerQuery, [companyId, req.user.tenantId]);

    const customers = result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      customerType: row.customer_type,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.company_name,
      cpf: row.cpf,
      cnpj: row.cnpj,
      phone: row.phone,
      mobilePhone: row.mobile_phone,
      contactPerson: row.contact_person,
      responsible: row.responsible,
      position: row.position,
      supervisor: row.supervisor,
      coordinator: row.coordinator,
      manager: row.manager,
      description: row.description,
      internalCode: row.internal_code,
      status: row.status || 'Ativo',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      name: row.customer_type === 'PJ' 
        ? row.company_name || row.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || customer.email,
      fullName: row.customer_type === 'PJ' 
        ? row.company_name || customer.email
        : [row.first_name, row.last_name].filter(Boolean).join(' ') || customer.email
    }));

    console.log(`Found ${customers.length} customers for company ${companyId}`);

    res.json({
      success: true,
      customers,
      count: customers.length
    });
  } catch (error: any) {
    console.error('Error fetching customers for company:', {
      error: error.message,
      stack: error.stack,
      companyId: req.params.companyId,
      tenantId: req.user?.tenantId
    });

    res.status(500).json({ 
      success: false,
      message: 'Erro ao carregar clientes da empresa',
      error: error.message
    });
  }
});

export { customersRouter };
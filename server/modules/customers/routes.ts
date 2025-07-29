import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { requirePermission } from "../../middleware/rbacMiddleware";
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
      first_name: row.first_name, // Keep both for compatibility
      last_name: row.last_name,   // Keep both for compatibility
      companyName: row.company_name,
      company: row.company_name || row.company || null, // Add company field for compatibility
      cpf: row.cpf,
      cnpj: row.cnpj,
      phone: row.phone || row.mobile_phone || null, // Use phone or mobile_phone
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
      isActive: (row.status || 'Ativo') === 'Ativo', // Add isActive boolean field
      role: row.position, // Add role field for compatibility
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

    res.json(companies);
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
customersRouter.delete('/companies/:id', jwtAuth, requirePermission('customer', 'delete'), async (req: AuthenticatedRequest, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    console.log(`[DELETE-${requestId}] ====== DELETION REQUEST STARTED ======`);
    console.log(`[DELETE-${requestId}] Timestamp: ${new Date().toISOString()}`);

    if (!req.user?.tenantId) {
      console.log(`[DELETE-${requestId}] FAILED: Missing tenant context`);
      return res.status(401).json({ message: 'Tenant context required' });
    }

    const { id: companyId } = req.params;
    if (!companyId) {
      console.log(`[DELETE-${requestId}] FAILED: Missing company ID`);
      return res.status(400).json({ message: 'Company ID is required' });
    }

    console.log(`[DELETE-${requestId}] Company ID: ${companyId}`);
    console.log(`[DELETE-${requestId}] User: ${req.user.id}, Tenant: ${req.user.tenantId}`);

    const { schemaManager } = await import('../../db');
    // Get tenant database connection
    console.log(`[DELETE-${requestId}] Getting tenant database connection...`);
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log(`[DELETE-${requestId}] Database connection obtained`);

    // Start transaction
    console.log(`[DELETE-${requestId}] Starting database transaction...`);
    console.log('🗑️ [DELETE] Starting company deletion:', { companyId, tenantId: req.user.tenantId });
    await pool.query('BEGIN');
    console.log(`[DELETE-${requestId}] Transaction started`);
    try {
      // Check if company exists first
      console.log(`[DELETE-${requestId}] Checking if company exists: ${companyId}`);
      const companyCheck = await pool.query(
        `SELECT id, name FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
        [companyId, req.user.tenantId]
      );

      console.log(`[DELETE-${requestId}] Company search result: ${companyCheck.rows.length} companies found`);

      if (companyCheck.rows.length === 0) {
        console.log(`[DELETE-${requestId}] FAILED: Company not found`);
        console.log('❌ [DELETE] Company not found in database');
        await pool.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      const companyName = companyCheck.rows[0].name;
      console.log(`[DELETE-${requestId}] Company found:`, {
        id: companyCheck.rows[0].id,
        name: companyCheck.rows[0].name,
        tenantId: req.user.tenantId
      });
      console.log('✅ [DELETE] Company found:', { companyName });

      // Check if company has associated customers
      console.log(`[DELETE-${requestId}] Checking for associated customers...`);
      const membershipsCheck = await pool.query(
        `SELECT COUNT(*) as count FROM "${schemaName}"."customer_company_memberships" 
         WHERE company_id = $1 AND tenant_id = $2`,
        [companyId, req.user.tenantId]
      );

      const membershipCount = Number(membershipsCheck.rows[0]?.count);
      console.log(`[DELETE-${requestId}] Associated customers check: ${membershipCount} customers found`);
      console.log('📊 [DELETE] Membership count:', membershipCount);

      if (membershipCount > 0) {
        console.log(`[DELETE-${requestId}] FAILED: Company has ${membershipCount} associated customers`);
        console.log('🚫 [DELETE] Cannot delete company with associated customers');
        await pool.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir empresa que possui clientes associados'
        });
      }

      console.log(`[DELETE-${requestId}] No associated customers found. Proceeding with deletion.`);

      // Delete any orphaned memberships first (just in case)
      console.log(`[DELETE-${requestId}] Executing DELETE operation for memberships...`);
      const membershipDeleteResult = await pool.query(
        `DELETE FROM "${schemaName}"."customer_company_memberships" 
         WHERE company_id = $1 AND tenant_id = $2`,
        [companyId, req.user.tenantId]
      );
      console.log('🧹 [DELETE] Cleaned memberships:', membershipDeleteResult.rowCount);

      // Delete the company
      console.log(`[DELETE-${requestId}] Executing DELETE operation for company...`);
      const result = await pool.query(
        `DELETE FROM "${schemaName}"."customer_companies" 
         WHERE id = $1 AND tenant_id = $2`,
        [companyId, req.user.tenantId]
      );

      console.log(`[DELETE-${requestId}] Delete operation completed. Result:`, {
        rowsAffected: result.rowCount || 'unknown'
      });
      console.log('💀 [DELETE] Company deletion executed:', {
        rowCount: result.rowCount,
        companyId
      });

      // COMPREHENSIVE VERIFICATION: Check if company still exists in ALL possible states
      console.log(`[DELETE-${requestId}] Verifying deletion...`);
      const verificationCheck = await pool.query(
        `SELECT id, name, status, created_at, updated_at FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
        [companyId, req.user.tenantId]
      );

      // Additional check: Count total companies for this tenant
      const totalCountCheck = await pool.query(
        `SELECT 
        COUNT(*) as total_companies,
        COUNT(CASE WHEN id = $1 THEN 1 END) as target_company_count
       FROM "${schemaName}"."customer_companies" WHERE tenant_id = $2`,
        [companyId, req.user.tenantId]
      );

      console.log('🔍 [DELETE] COMPREHENSIVE Post-deletion verification:', {
        targetCompanyExists: verificationCheck.rows.length > 0,
        targetCompanyData: verificationCheck.rows[0] || null,
        totalCompaniesInTenant: totalCountCheck.rows[0]?.total_companies || 0,
        targetCompanyStillCounted: totalCountCheck.rows[0]?.target_company_still_counted || 0,
        deletionRowCount: result.rowCount,
        schemaName,
        companyId,
        tenantId: req.user.tenantId
      });
      console.log(`[DELETE-${requestId}] Verification check - companies found after deletion: ${verificationCheck.rows.length}`);

      if (verificationCheck.rows.length > 0) {
        console.log(`[DELETE-${requestId}] CRITICAL ERROR: Company still exists after deletion!`);
        console.error('🚨 [DELETE] CRITICAL: Company still exists after deletion!');
        await pool.query('ROLLBACK');
        return res.status(500).json({
          success: false,
          message: 'Deletion failed - company still exists in database',
          debug: {
            rowCount: result.rowCount,
            stillExists: true
          }
        });
      }
      await pool.query('COMMIT');
      console.log('✅ [DELETE] Transaction committed successfully');
      console.log(`[DELETE-${requestId}] Deletion verified successfully`);

      if (result.rowCount === 0) {
        console.log(`[DELETE-${requestId}] No rows affected by deletion`);
        console.log('⚠️ [DELETE] No rows affected by deletion');
        await pool.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Company not found or already deleted'
        });
      }

      // Set cache headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      console.log('🎉 [DELETE] Company deleted successfully:', { companyId, companyName });
      const duration = Date.now() - startTime;
      console.log(`[DELETE-${requestId}] Transaction completed successfully in ${duration}ms:`, result);
      console.log(`[DELETE-${requestId}] ====== DELETION SUCCESS ====== (Total: ${duration}ms)`);
      res.status(200).json({
        success: true,
        message: 'Company deleted successfully',
        deletedId: companyId,
        deletedName: companyName,
        debug: {
          rowCount: result.rowCount,
          verificationPassed: true
        }
      });
    } catch (transactionError) {
      console.error('💥 [DELETE] Transaction error:', transactionError);
      console.error(`[DELETE-${requestId}] Transaction error:`, {
        message: transactionError.message,
        stack: transactionError.stack,
        name: transactionError.name
      });
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('💥 [DELETE] Critical deletion error:', error);
    console.error(`[DELETE-${requestId}] ====== DELETION FAILED ====== (Total: ${duration}ms)`);
    console.error(`[DELETE-${requestId}] Error:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer company',
      error: error.message
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
      JOIN "${schemaName}".customer_company_memberships ccm ON c.id = ccm.customer_id
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

// GET /api/customers/companies/:companyId/available - Get customers not associated with company
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const tenantId = req.user?.tenantId;

    console.log('Available customers request:', { companyId, tenantId });

    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant required' });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First verify the company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    // Get customers that are NOT already associated with this company
    const query = `
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.customer_type as "customerType", c.company_name as "companyName", 
             c.status
      FROM "${schemaName}"."customers" c
      WHERE c.tenant_id = $1
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schemaName}"."customer_company_memberships" ccm
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
      )
      ORDER BY c.first_name, c.last_name
    `;

    const result = await pool.query(query, [tenantId, companyId]);

    console.log('Available customers found:', result.rows.length);

    res.json({
      success: true,
      message: 'Available customers retrieved successfully',
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available customers',
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
    const { companyId } = req.params;
    const { customerIds, isPrimary = false } = req.body;
    const tenantId = req.user?.tenantId;

    console.log('Associate multiple customers request:', { companyId, customerIds, isPrimary, tenantId });

    if (!tenantId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tenant required' 
      });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer IDs array is required' 
      });
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
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
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
        success: false,
        message: 'All selected customers are already associated with this company',
        data: {
          existingAssociations: existingCustomerIds.length,
          totalRequested: customerIds.length
        }
      });
    }

    // Insert new memberships one by one to avoid parameter issues
    const results = [];
    for (const customerId of newCustomerIds) {
      const insertQuery = `
        INSERT INTO "${schemaName}"."customer_company_memberships" 
        (customer_id, company_id, role, is_primary, tenant_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        customerId,
        companyId,
        'member',
        isPrimary,
        tenantId
      ]);

      results.push(result.rows[0]);
    }

    console.log('Successfully associated customers:', results.length);

    res.json({
      success: true,
      message: 'Customers associated successfully',
      data: {
        associatedCustomers: results.length,
        skippedExisting: existingCustomerIds.length,
        totalRequested: customerIds.length,
        memberships: results.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          companyId: row.company_id,
          role: row.role,
          isPrimary: row.is_primary
        }))
      }
    });

  } catch (error: any) {
    console.error('Error associating multiple customers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to associate customers',
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

// GET /api/customers/companies/:companyId/available - Get customers not associated with company
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const tenantId = req.user?.tenantId;

    console.log('Available customers request:', { companyId, tenantId });

    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant required' });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First verify the company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    // Get customers that are NOT already associated with this company
    const query = `
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.customer_type as "customerType", c.company_name as "companyName", 
             c.status
      FROM "${schemaName}"."customers" c
      WHERE c.tenant_id = $1
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schemaName}"."customer_company_memberships" ccm
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
      )
      ORDER BY c.first_name, c.last_name
    `;

    const result = await pool.query(query, [tenantId, companyId]);

    console.log('Available customers found:', result.rows.length);

    res.json({
      success: true,
      message: 'Available customers retrieved successfully',
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available customers',
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
    const { companyId } = req.params;
    const { customerIds, isPrimary = false } = req.body;
    const tenantId = req.user?.tenantId;

    console.log('Associate multiple customers request:', { companyId, customerIds, isPrimary, tenantId });

    if (!tenantId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tenant required' 
      });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer IDs array is required' 
      });
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
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
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
        success: false,
        message: 'All selected customers are already associated with this company',
        data: {
          existingAssociations: existingCustomerIds.length,
          totalRequested: customerIds.length
        }
      });
    }

    // Insert new memberships one by one to avoid parameter issues
    const results = [];
    for (const customerId of newCustomerIds) {
      const insertQuery = `
        INSERT INTO "${schemaName}"."customer_company_memberships" 
        (customer_id, company_id, role, is_primary, tenant_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        customerId,
        companyId,
        'member',
        isPrimary,
        tenantId
      ]);

      results.push(result.rows[0]);
    }

    console.log('Successfully associated customers:', results.length);

    res.json({
      success: true,
      message: 'Customers associated successfully',
      data: {
        associatedCustomers: results.length,
        skippedExisting: existingCustomerIds.length,
        totalRequested: customerIds.length,
        memberships: results.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          companyId: row.company_id,
          role: row.role,
          isPrimary: row.is_primary
        }))
      }
    });

  } catch (error: any) {
    console.error('Error associating multiple customers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to associate customers',
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

// GET /api/customers/companies/:companyId/available - Get customers not associated with company
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const tenantId = req.user?.tenantId;

    console.log('Available customers request:', { companyId, tenantId });

    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant required' });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First verify the company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    // Get customers that are NOT already associated with this company
    const query = `
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.customer_type as "customerType", c.company_name as "companyName", 
             c.status
      FROM "${schemaName}"."customers" c
      WHERE c.tenant_id = $1
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schemaName}"."customer_company_memberships" ccm
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
      )
      ORDER BY c.first_name, c.last_name
    `;

    const result = await pool.query(query, [tenantId, companyId]);

    console.log('Available customers found:', result.rows.length);

    res.json({
      success: true,
      message: 'Available customers retrieved successfully',
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available customers',
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

    const { schemaManager } =```text
await import('../../db');
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
    const { companyId } = req.params;
    const { customerIds, isPrimary = false } = req.body;
    const tenantId = req.user?.tenantId;

    console.log('Associate multiple customers request:', { companyId, customerIds, isPrimary, tenantId });

    if (!tenantId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tenant required' 
      });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer IDs array is required' 
      });
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
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
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
        success: false,
        message: 'All selected customers are already associated with this company',
        data: {
          existingAssociations: existingCustomerIds.length,
          totalRequested: customerIds.length
        }
      });
    }

    // Insert new memberships one by one to avoid parameter issues
    const results = [];
    for (const customerId of newCustomerIds) {
      const insertQuery = `
        INSERT INTO "${schemaName}"."customer_company_memberships" 
        (customer_id, company_id, role, is_primary, tenant_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        customerId,
        companyId,
        'member',
        isPrimary,
        tenantId
      ]);

      results.push(result.rows[0]);
    }

    console.log('Successfully associated customers:', results.length);

    res.json({
      success: true,
      message: 'Customers associated successfully',
      data: {
        associatedCustomers: results.length,
        skippedExisting: existingCustomerIds.length,
        totalRequested: customerIds.length,
        memberships: results.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          companyId: row.company_id,
          role: row.role,
          isPrimary: row.is_primary
        }))
      }
    });

  } catch (error: any) {
    console.error('Error associating multiple customers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to associate customers',
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

// GET /api/customers/companies/:companyId/available - Get customers not associated with company
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const tenantId = req.user?.tenantId;

    console.log('Available customers request:', { companyId, tenantId });

    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant required' });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First verify the company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    // Get customers that are NOT already associated with this company
    const query = `
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.customer_type as "customerType", c.company_name as "companyName", 
             c.status
      FROM "${schemaName}"."customers" c
      WHERE c.tenant_id = $1
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schemaName}"."customer_company_memberships" ccm
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
      )
      ORDER BY c.first_name, c.last_name
    `;

    const result = await pool.query(query, [tenantId, companyId]);

    console.log('Available customers found:', result.rows.length);

    res.json({
      success: true,
      message: 'Available customers retrieved successfully',
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available customers',
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
    const { companyId } = req.params;
    const { customerIds, isPrimary = false } = req.body;
    const tenantId = req.user?.tenantId;

    console.log('Associate multiple customers request:', { companyId, customerIds, isPrimary, tenantId });

    if (!tenantId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tenant required' 
      });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer IDs array is required' 
      });
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
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
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
        success: false,
        message: 'All selected customers are already associated with this company',
        data: {
          existingAssociations: existingCustomerIds.length,
          totalRequested: customerIds.length
        }
      });
    }

    // Insert new memberships one by one to avoid parameter issues
    const results = [];
    for (const customerId of newCustomerIds) {
      const insertQuery = `
        INSERT INTO "${schemaName}"."customer_company_memberships" 
        (customer_id, company_id, role, is_primary, tenant_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        customerId,
        companyId,
        'member',
        isPrimary,
        tenantId
      ]);

      results.push(result.rows[0]);
    }

    console.log('Successfully associated customers:', results.length);

    res.json({
      success: true,
      message: 'Customers associated successfully',
      data: {
        associatedCustomers: results.length,
        skippedExisting: existingCustomerIds.length,
        totalRequested: customerIds.length,
        memberships: results.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          companyId: row.company_id,
          role: row.role,
          isPrimary: row.is_primary
        }))
      }
    });

  } catch (error: any) {
    console.error('Error associating multiple customers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to associate customers',
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

// GET /api/customers/companies/:companyId/available - Get customers not associated with company
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const tenantId = req.user?.tenantId;

    console.log('Available customers request:', { companyId, tenantId });

    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant required' });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // First verify the company exists
    const companyCheck = await pool.query(
      `SELECT id FROM "${schemaName}"."customer_companies" WHERE id = $1 AND tenant_id = $2`,
      [companyId, tenantId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    // Get customers that are NOT already associated with this company
    const query = `
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.customer_type as "customerType", c.company_name as "companyName", 
             c.status
      FROM "${schemaName}"."customers" c
      WHERE c.tenant_id = $1
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schemaName}"."customer_company_memberships" ccm
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
      )
      ORDER BY c.first_name, c.last_name
    `;

    const result = await pool.query(query, [tenantId, companyId]);

    console.log('Available customers found:', result.rows.length);

    res.json({
      success: true,
      message: 'Available customers retrieved successfully',
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available customers',
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
    const { companyId } = req.params;
    const { customerIds, isPrimary = false } = req.body;
    const tenantId = req.user?.tenantId;

    console.log('Associate multiple customers request:', { companyId, customerIds, isPrimary, tenantId });

    if (!tenantId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tenant required' 
      });
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid company ID is required' 
      });
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer IDs array is required' 
      });
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
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
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
        success: false,
        message: 'All selected customers are already associated with this company',
        data: {
          existingAssociations: existingCustomerIds.length,
          totalRequested: customerIds.length
        }
      });
    }

    // Insert new memberships one by one to avoid parameter issues
    const results = [];
    for (const customerId of newCustomerIds) {
      const insertQuery = `
        INSERT INTO "${schemaName}"."customer_company_memberships" 
        (customer_id, company_id, role, is_primary, tenant_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        customerId,
        companyId,
        'member',
        isPrimary,
        tenantId
      ]);

      results.push(result.rows[0]);
    }

    console.log('Successfully associated customers:', results.length);

    res.json({
      success: true,
      message: 'Customers associated successfully',
      data: {
        associatedCustomers: results.length,
        skippedExisting: existingCustomerIds.length,
        totalRequested: customerIds.length,
        memberships: results.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          companyId: row.company_id,
          role: row.role,
          isPrimary: row.is_primary
        }))
      }
    });

  } catch (error: any) {
    console.error('Error associating multiple customers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to associate customers',
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

export { customersRouter };
import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../../middleware/jwtAuth';

const customersRouter = Router();

// GET /api/customers - Get all customers
customersRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log('[GET-CUSTOMERS] Fetching customers for tenant:', req.user.tenantId);

    const result = await pool.query(`
      SELECT id, first_name, last_name, email, phone, company, 
             is_active, created_at, updated_at
      FROM "${schemaName}".customers 
      ORDER BY first_name, last_name
    `);

    console.log('[GET-CUSTOMERS] Found', result.rows.length, 'customers');

    res.status(200).json({
      success: true,
      customers: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/customers/companies - Get all companies
customersRouter.get('/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const result = await pool.query(`
      SELECT * FROM "${schemaName}".customer_companies 
      WHERE tenant_id = $1
      ORDER BY name
    `, [req.user.tenantId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// GET /api/customers/companies/:companyId/associated - Get customers associated with a company
customersRouter.get('/companies/:companyId/associated', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log('[ASSOCIATED-CUSTOMERS] Getting associated customers for company', companyId);

    const query = `
      SELECT c.*, ccm.role, ccm.is_primary, ccm.is_active as membership_active
      FROM "${schemaName}".customers c
      JOIN "${schemaName}".customer_company_memberships ccm ON c.id = ccm.customer_id
      WHERE ccm.company_id = $1 AND ccm.tenant_id = $2 AND ccm.is_active = true
      ORDER BY ccm.is_primary DESC, c.first_name, c.last_name
    `;

    const result = await pool.query(query, [companyId, req.user.tenantId]);

    console.log('[ASSOCIATED-CUSTOMERS] Found', result.rows.length, 'associated customers');

    res.json({
      success: true,
      message: 'Associated customers retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching associated customers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch associated customers',
      error: error.message 
    });
  }
});

// GET /api/customers/companies/:companyId/available - Get customers available for association
customersRouter.get('/companies/:companyId/available', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log('[AVAILABLE-CUSTOMERS] Getting available customers for company', companyId);

    const query = `
      SELECT c.*
      FROM "${schemaName}".customers c
      WHERE c.tenant_id = $1 
      AND c.id NOT IN (
        SELECT ccm.customer_id 
        FROM "${schemaName}".customer_company_memberships ccm 
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1 AND ccm.is_active = true
      )
      ORDER BY c.first_name, c.last_name
    `;

    const result = await pool.query(query, [req.user.tenantId, companyId]);

    console.log('[AVAILABLE-CUSTOMERS] Found', result.rows.length, 'available customers');

    res.json({
      success: true,
      message: 'Available customers retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch available customers',
      error: error.message 
    });
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

// POST /api/customers/companies - Create a new company
customersRouter.post('/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, document, phone, email, address } = req.body;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const result = await pool.query(`
      INSERT INTO "${schemaName}".customer_companies 
      (name, document, phone, email, address, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [name, document, phone, email, address, req.user.tenantId]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Failed to create company' });
  }
});

// PUT /api/customers/companies/:id - Update a company
customersRouter.put('/companies/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, displayName, document, phone, email, address, status, subscriptionTier, description } = req.body;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log(`[UPDATE-COMPANY] Updating company ${id} with full data:`, { 
      name, displayName, status, subscriptionTier, document, phone, email 
    });

    // Verify company exists first
    const existingCompany = await pool.query(`
      SELECT * FROM "${schemaName}".customer_companies 
      WHERE id = $1 AND tenant_id = $2
    `, [id, req.user.tenantId]);

    if (existingCompany.rows.length === 0) {
      console.log(`[UPDATE-COMPANY] Company not found: ${id}`);
      return res.status(404).json({ message: 'Company not found' });
    }

    console.log(`[UPDATE-COMPANY] Current company:`, {
      id: existingCompany.rows[0].id,
      name: existingCompany.rows[0].name,
      displayName: existingCompany.rows[0].display_name,
      status: existingCompany.rows[0].status
    });

    // Use existing values if not provided
    const updateName = name !== undefined ? name : existingCompany.rows[0].name;
    const updateDisplayName = displayName !== undefined ? displayName : existingCompany.rows[0].display_name;
    const updateDocument = document !== undefined ? document : existingCompany.rows[0].document;
    const updatePhone = phone !== undefined ? phone : existingCompany.rows[0].phone;
    const updateEmail = email !== undefined ? email : existingCompany.rows[0].email;
    const updateAddress = address !== undefined ? address : existingCompany.rows[0].address;
    const updateStatus = status !== undefined ? status : existingCompany.rows[0].status;
    const updateSubscriptionTier = subscriptionTier !== undefined ? subscriptionTier : existingCompany.rows[0].subscription_tier;
    const updateDescription = description !== undefined ? description : existingCompany.rows[0].description;

    const result = await pool.query(`
      UPDATE "${schemaName}".customer_companies 
      SET name = $1, display_name = $2, document = $3, phone = $4, email = $5, 
          address = $6, status = $7, subscription_tier = $8, description = $9, updated_at = NOW()
      WHERE id = $10 AND tenant_id = $11
      RETURNING *
    `, [
      updateName, updateDisplayName, updateDocument, updatePhone, updateEmail, 
      updateAddress, updateStatus, updateSubscriptionTier, updateDescription, 
      id, req.user.tenantId
    ]);

    console.log(`[UPDATE-COMPANY] Company updated successfully:`, {
      id: result.rows[0].id,
      name: result.rows[0].name,
      displayName: result.rows[0].display_name,
      oldStatus: existingCompany.rows[0].status,
      newStatus: result.rows[0].status,
      subscriptionTier: result.rows[0].subscription_tier
    });

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Failed to update company' });
  }
});

export { customersRouter };
import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../../middleware/jwtAuth';
import crypto from 'crypto'; // Assuming crypto is needed for UUID generation

const customersRouter = Router();

// GET /api/customers - Get all customers (optimized)
customersRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Validate tenant ID
    if (!req.user.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    // Optimized query with all standard fields
    const result = await pool.query(`
      SELECT 
        id,
        tenant_id,
        first_name,
        last_name,
        email,
        phone,
        mobile_phone,
        COALESCE(customer_type, 'PF') as customer_type,
        cpf,
        cnpj,
        company_name,
        contact_person,
        state,
        address,
        address_number,
        complement,
        neighborhood,
        city,
        zip_code,
        COALESCE(is_active, true) as is_active,
        created_at,
        updated_at
      FROM "${schemaName}".customers 
      WHERE COALESCE(is_active, true) = true
        AND tenant_id = $1


// POST /api/customers - Create new customer
customersRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Validate tenant ID
    if (!req.user.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    // Extract and validate data
    const {
      firstName,
      lastName,
      email,
      phone,
      mobilePhone,
      customerType = 'PF',
      cpf,
      cnpj,
      companyName,
      contactPerson,
      state,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      zipCode
    } = req.body;

    // Validation
    const errors = [];
    if (!firstName || !lastName) {
      errors.push('Nome e sobrenome são obrigatórios');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email válido é obrigatório');
    }
    if (customerType === 'PJ' && !companyName) {
      errors.push('Nome da empresa é obrigatório para Pessoa Jurídica');
    }
    if (cpf && cpf.replace(/\D/g, '').length !== 11) {
      errors.push('CPF deve ter 11 dígitos');
    }
    if (cnpj && cnpj.replace(/\D/g, '').length !== 14) {
      errors.push('CNPJ deve ter 14 dígitos');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors
      });
    }

    // Check if email already exists
    const existingCustomer = await pool.query(`
      SELECT id FROM "${schemaName}".customers 
      WHERE email = $1 AND tenant_id = $2
    `, [email, req.user.tenantId]);

    if (existingCustomer.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email já está em uso',
        code: 'EMAIL_EXISTS'
      });
    }

    // Create customer
    const customerId = crypto.randomUUID();
    const result = await pool.query(`
      INSERT INTO "${schemaName}".customers (
        id, tenant_id, first_name, last_name, email, phone, mobile_phone,
        customer_type, cpf, cnpj, company_name, contact_person, state,
        address, address_number, complement, neighborhood, city, zip_code,
        is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, true, NOW(), NOW()
      ) RETURNING *
    `, [
      customerId, req.user.tenantId, firstName, lastName, email, phone, mobilePhone,
      customerType, cpf, cnpj, companyName, contactPerson, state,
      address, addressNumber, complement, neighborhood, city, zipCode
    ]);

    res.status(201).json({
      success: true,
      customer: result.rows[0],
      message: 'Cliente criado com sucesso'
    });

  } catch (error: any) {
    console.error('[CREATE-CUSTOMER] Error:', error);

    const errorResponse = {
      success: false,
      error: 'Erro ao criar cliente',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.message;
    }

    res.status(500).json(errorResponse);
  }
});

// PUT /api/customers/:id - Update customer
customersRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);
    const customerId = req.params.id;

    // Validate tenant ID
    if (!req.user.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    // Check if customer exists
    const existingCustomer = await pool.query(`
      SELECT * FROM "${schemaName}".customers 
      WHERE id = $1 AND tenant_id = $2
    `, [customerId, req.user.tenantId]);

    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    const current = existingCustomer.rows[0];
    const updateData = { ...current, ...req.body, updated_at: new Date() };

    // Validation
    const errors = [];
    if (updateData.customerType === 'PJ' && !updateData.company_name) {
      errors.push('Nome da empresa é obrigatório para Pessoa Jurídica');
    }
    if (updateData.cpf && updateData.cpf.replace(/\D/g, '').length !== 11) {
      errors.push('CPF deve ter 11 dígitos');
    }
    if (updateData.cnpj && updateData.cnpj.replace(/\D/g, '').length !== 14) {
      errors.push('CNPJ deve ter 14 dígitos');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors
      });
    }

    // Update customer
    const result = await pool.query(`
      UPDATE "${schemaName}".customers SET
        first_name = $3, last_name = $4, phone = $5, mobile_phone = $6,
        customer_type = $7, cpf = $8, cnpj = $9, company_name = $10,
        contact_person = $11, state = $12, address = $13, address_number = $14,
        complement = $15, neighborhood = $16, city = $17, zip_code = $18,
        is_active = $19, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [
      customerId, req.user.tenantId, updateData.first_name, updateData.last_name,
      updateData.phone, updateData.mobile_phone, updateData.customer_type,
      updateData.cpf, updateData.cnpj, updateData.company_name, updateData.contact_person,
      updateData.state, updateData.address, updateData.address_number,
      updateData.complement, updateData.neighborhood, updateData.city, updateData.zip_code,
      updateData.is_active
    ]);

    res.json({
      success: true,
      customer: result.rows[0],
      message: 'Cliente atualizado com sucesso'
    });

  } catch (error: any) {
    console.error('[UPDATE-CUSTOMER] Error:', error);

    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar cliente',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

      ORDER BY first_name NULLS LAST, last_name NULLS LAST
      LIMIT 100
    `, [req.user.tenantId]);

    // Get associated companies in batch for better performance
    const customerIds = result.rows.map(r => r.id);
    let companiesMap = new Map();

    if (customerIds.length > 0) {
      try {
        const companiesResult = await pool.query(`
          SELECT 
            cm.customer_id,
            string_agg(COALESCE(c.display_name, c.name), ', ' ORDER BY c.name) as company_names
          FROM "${schemaName}".company_memberships cm
          JOIN "${schemaName}".companies c ON cm.company_id = c.id
          WHERE cm.customer_id = ANY($1::uuid[]) 
            AND cm.tenant_id = $2 
            AND COALESCE(c.is_active, true) = true
          GROUP BY cm.customer_id
        `, [customerIds, req.user.tenantId]);

        companiesResult.rows.forEach(row => {
          companiesMap.set(row.customer_id, row.company_names);
        });
      } catch (companyError) {
        console.warn('[GET-CUSTOMERS] Error fetching companies:', companyError.message);
      }
    }

    // Add associated companies to customers
    const customersWithCompanies = result.rows.map(customer => ({
      ...customer,
      associated_companies: companiesMap.get(customer.id) || null
    }));

    res.status(200).json({
      success: true,
      customers: customersWithCompanies,
      total: result.rows.length,
      metadata: {
        tenant_id: req.user.tenantId,
        schema: schemaName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[GET-CUSTOMERS] Error:', error);

    const errorResponse = {
      success: false,
      error: 'Failed to fetch customers',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      tenant_id: req.user?.tenantId
    };

    // Specific error handling
    if (error.code === '42P01') {
      errorResponse.error = 'Customers table not found';
      errorResponse.code = 'TABLE_NOT_FOUND';
      return res.status(500).json(errorResponse);
    }

    if (error.code === '42703') {
      errorResponse.error = 'Database schema mismatch';
      errorResponse.code = 'SCHEMA_MISMATCH';
      return res.status(500).json(errorResponse);
    }

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.message;
    }

    res.status(500).json(errorResponse);
  }
});

// GET /api/customers/companies - Get all companies
customersRouter.get('/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const result = await pool.query(`
      SELECT * FROM "${schemaName}".companies 
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

    // Check if is_active column exists first
    const columnCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'customers' AND column_name = 'is_active'
    `, [schemaName]);

    let customerActiveFilter = '';
    if (columnCheck.rows.length > 0) {
      customerActiveFilter = 'AND COALESCE(c.is_active, true) = true';
    }

    const query = `
      SELECT c.*, ccm.role
      FROM "${schemaName}".customers c
      JOIN "${schemaName}".company_memberships ccm ON c.id = ccm.customer_id
      WHERE ccm.company_id = $1 AND ccm.tenant_id = $2 
      ${customerActiveFilter}
      ORDER BY c.first_name, c.last_name
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
      error: (error as Error).message 
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
        FROM "${schemaName}".company_memberships ccm 
        WHERE ccm.company_id = $2 AND ccm.tenant_id = $1
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
      error: (error as Error).message 
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
      `SELECT id FROM "${schemaName}"."companies" WHERE id = $1 AND tenant_id = $2`,
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
      SELECT customer_id FROM "${schemaName}"."company_memberships" 
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
        INSERT INTO "${schemaName}"."company_memberships" 
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

// GET /api/customers/:customerId/beneficiaries - Get beneficiaries for a specific customer
customersRouter.get('/:customerId/beneficiaries', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { customerId } = req.params;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log(`[BENEFICIARIES-API] 🔍 Fetching beneficiaries for customer ${customerId} in tenant ${req.user.tenantId}`);

    const result = await pool.query(`
      SELECT DISTINCT 
        b.id, 
        b.first_name, 
        b.last_name, 
        COALESCE(NULLIF(TRIM(b.first_name || ' ' || b.last_name), ''), b.email) as name,
        b.email, 
        b.phone, 
        b.cpf_cnpj, 
        b.customer_id
      FROM "${schemaName}".beneficiaries b
      LEFT JOIN "${schemaName}".beneficiary_customer_relationships bcr ON b.id = bcr.beneficiary_id
      WHERE b.customer_id = $1 OR bcr.customer_id = $1
      ORDER BY b.first_name, b.last_name
    `, [customerId]);

    const formattedBeneficiaries = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      name: row.name,
      email: row.email,
      phone: row.phone,
      cpfCnpj: row.cpf_cnpj,
      customerId: row.customer_id
    }));

    console.log(`[BENEFICIARIES-API] ✅ Found ${result.rows.length} beneficiaries for customer ${customerId}:`, formattedBeneficiaries);

    res.json({
      success: true,
      beneficiaries: formattedBeneficiaries,
      count: formattedBeneficiaries.length
    });
  } catch (error) {
    console.error('[BENEFICIARIES-API] ❌ Error fetching customer beneficiaries:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch customer beneficiaries',
      message: error instanceof Error ? error.message : 'Unknown error'
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
      INSERT INTO "${schemaName}".companies 
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
    const { 
      name, displayName, description, industry, size, email, phone, website, 
      subscriptionTier, status, document, address 
    } = req.body;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log(`[UPDATE-COMPANY] Updating company ${id} with data:`, { 
      name, displayName, industry, size, email, phone, website, subscriptionTier, status,
      description, document, address
    });

    // Verify company exists first
    const existingCompany = await pool.query(`
      SELECT * FROM "${schemaName}".companies 
      WHERE id = $1 AND tenant_id = $2
    `, [id, req.user.tenantId]);

    if (existingCompany.rows.length === 0) {
      console.log(`[UPDATE-COMPANY] Company not found: ${id}`);
      return res.status(404).json({ message: 'Company not found' });
    }

    console.log(`[UPDATE-COMPANY] Current company data:`, {
      id: existingCompany.rows[0].id,
      name: existingCompany.rows[0].name,
      displayName: existingCompany.rows[0].display_name,
      industry: existingCompany.rows[0].industry,
      size: existingCompany.rows[0].size,
      status: existingCompany.rows[0].status
    });

    // Use existing values if not provided (preserving all fields)
    const updateName = name !== undefined ? name : existingCompany.rows[0].name;
    const updateDisplayName = displayName !== undefined ? displayName : existingCompany.rows[0].display_name;
    const updateDescription = description !== undefined ? description : existingCompany.rows[0].description;
    const updateIndustry = industry !== undefined ? industry : existingCompany.rows[0].industry;
    const updateSize = size !== undefined ? size : existingCompany.rows[0].size;
    const updateEmail = email !== undefined ? email : existingCompany.rows[0].email;
    const updatePhone = phone !== undefined ? phone : existingCompany.rows[0].phone;
    const updateWebsite = website !== undefined ? website : existingCompany.rows[0].website;
    const updateSubscriptionTier = subscriptionTier !== undefined ? subscriptionTier : existingCompany.rows[0].subscription_tier;
    const updateStatus = status !== undefined ? status : existingCompany.rows[0].status;
    const updateDocument = document !== undefined ? document : existingCompany.rows[0].cnpj;
    const updateAddress = address !== undefined ? address : existingCompany.rows[0].address;

    console.log(`[UPDATE-COMPANY] About to execute UPDATE with values:`, {
      updateName, updateDisplayName, updateDescription, updateIndustry, updateSize,
      updateEmail, updatePhone, updateWebsite, updateSubscriptionTier, updateStatus,
      updateDocument, updateAddress, id, tenantId: req.user.tenantId
    });

    const result = await pool.query(`
      UPDATE "${schemaName}".companies 
      SET name = $1, display_name = $2, description = $3, industry = $4, size = $5, 
          email = $6, phone = $7, website = $8, subscription_tier = $9, status = $10,
          cnpj = $11, address = $12, updated_at = NOW()
      WHERE id = $13 AND tenant_id = $14
      RETURNING *
    `, [
      updateName, updateDisplayName, updateDescription, updateIndustry, updateSize,
      updateEmail, updatePhone, updateWebsite, updateSubscriptionTier, updateStatus,
      updateDocument, updateAddress, id, req.user.tenantId
    ]);

    console.log(`[UPDATE-COMPANY] Query executed, affected rows:`, result.rowCount);
    console.log(`[UPDATE-COMPANY] Returned data:`, result.rows[0]);

    console.log(`[UPDATE-COMPANY] Company updated successfully:`, {
      id: result.rows[0].id,
      name: result.rows[0].name,
      displayName: result.rows[0].display_name,
      industry: result.rows[0].industry,
      size: result.rows[0].size,
      status: result.rows[0].status,
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
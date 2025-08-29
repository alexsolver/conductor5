import { Router, Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../../middleware/jwtAuth';
import { z } from 'zod';

// Temporarily comment out Clean Architecture imports until fully integrated
// import { CustomerController } from './application/controllers/CustomerController';
// import { CustomerApplicationService } from './application/services/CustomerApplicationService';
// import { CreateCustomerUseCase } from './application/usecases/CreateCustomerUseCase';
// import { GetCustomersUseCase } from './application/usecases/GetCustomersUseCase';
// import { UpdateCustomerUseCase } from './application/usecases/UpdateCustomerUseCase';
// import { DeleteCustomerUseCase } from './application/usecases/DeleteCustomerUseCase';
// import { CustomerRepository } from '../../infrastructure/repositories/CustomerRepository';
// import { CustomerListResponseDTO } from './application/dto/CustomerResponseDTO';
// import { validateCreateCustomer, validateUpdateCustomer } from './middleware/customerValidation';

const customersRouter = Router();

// Temporarily comment out Clean Architecture initialization
// const customerRepository = new CustomerRepository();
// const createCustomerUseCase = new CreateCustomerUseCase(customerRepository);
// const getCustomersUseCase = new GetCustomersUseCase(customerRepository);
// const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepository);
// const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepository);
// const customerApplicationService = new CustomerApplicationService(
//   createCustomerUseCase,
//   getCustomersUseCase,
//   updateCustomerUseCase,
//   deleteCustomerUseCase
// );
// const customerController = new CustomerController(customerApplicationService);

// Validation middleware for query parameters
const validateGetCustomers = (req: Request, res: Response, next: NextFunction) => {
  const querySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 100),
    search: z.string().optional(),
    customerType: z.enum(['PF', 'PJ']).optional()
  });

  try {
    const validation = querySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
        code: 'QUERY_VALIDATION_ERROR'
      });
    }
    req.query = validation.data;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Query validation error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/customers - Get all customers with proper validation
customersRouter.get('/', jwtAuth, validateGetCustomers, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    console.log('[GET-CUSTOMERS] Fetching customers for tenant:', req.user.tenantId);

    // Validate tenant ID
    if (!req.user.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    // First check if table exists and get available columns
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'customers'
      ORDER BY ordinal_position
    `, [schemaName]);

    if (tableCheck.rows.length === 0) {
      console.error('[GET-CUSTOMERS] Customers table does not exist in schema:', schemaName);
      return res.status(500).json({
        success: false,
        error: 'Customers table not found',
        code: 'TABLE_NOT_FOUND',
        suggestion: 'Run database migration to create the customers table'
      });
    }

    const availableColumns = tableCheck.rows.map(row => row.column_name);
    console.log('[GET-CUSTOMERS] Available columns:', availableColumns);

    // Build dynamic query based on available columns with proper validation
    const requiredColumns = ['id', 'first_name', 'last_name', 'email', 'created_at', 'updated_at'];
    const missingRequired = requiredColumns.filter(col => !availableColumns.includes(col));

    if (missingRequired.length > 0) {
      return res.status(500).json({
        success: false,
        error: 'Required columns missing from customers table',
        code: 'MISSING_COLUMNS',
        details: missingRequired,
        suggestion: 'Run database migration to add missing columns'
      });
    }

    const optionalColumns = [
      'phone', 'mobile_phone', 'customer_type', 'cpf', 'cnpj', 'company_name',
      'contact_person', 'state', 'address', 'address_number', 'complement',
      'neighborhood', 'city', 'zip_code', 'is_active'
    ];

    const selectColumns = [
      ...requiredColumns,
      ...optionalColumns.filter(col => availableColumns.includes(col))
    ];

    // Add fallback for is_active and customer_type with proper defaults
    const isActiveSelect = availableColumns.includes('is_active') 
      ? 'COALESCE(is_active, true) as is_active'
      : 'true as is_active';

    const customerTypeSelect = availableColumns.includes('customer_type')
      ? 'COALESCE(customer_type, \'PF\') as customer_type'
      : '\'PF\' as customer_type';

    const finalColumns = selectColumns.join(', ') + ', ' + isActiveSelect + ', ' + customerTypeSelect;

    // Enhanced query with better error handling
    const result = await pool.query(`
      SELECT ${finalColumns}
      FROM "${schemaName}".customers 
      WHERE ${availableColumns.includes('is_active') ? 'COALESCE(is_active, true) = true' : '1=1'}
        AND ${availableColumns.includes('customer_type') ? 'COALESCE(customer_type, \'PF\') IN (\'PF\', \'PJ\')' : '1=1'}
      ORDER BY first_name NULLS LAST, last_name NULLS LAST
      LIMIT 100
    `);

    console.log('[GET-CUSTOMERS] Found', result.rows.length, 'customers');

    // Add computed field for associated companies with better error handling
    const customersWithCompanies = await Promise.all(
      result.rows.map(async (customer) => {
        try {
          // First try companies_relationships (current structure)
          console.log(`[GET-CUSTOMERS] Checking companies_relationships for customer ${customer.id}`);
          let companiesResult = await pool.query(`
            SELECT DISTINCT c.name, c.display_name
            FROM "${schemaName}".companies_relationships cr
            JOIN "${schemaName}".companies c ON cr.company_id = c.id
            WHERE cr.customer_id = $1 AND c.is_active = true
            ORDER BY c.display_name, c.name
            LIMIT 3
          `, [customer.id]);

          console.log(`[GET-CUSTOMERS] Found ${companiesResult.rows.length} companies for customer ${customer.id}:`, 
            companiesResult.rows.map(r => r.name || r.display_name));

          // Fallback to company_memberships if companies_relationships doesn't exist or has no data
          if (companiesResult.rows.length === 0) {
            const membershipTableExists = await pool.query(`
              SELECT 1 FROM information_schema.tables 
              WHERE table_schema = $1 AND table_name = 'company_memberships'
            `, [schemaName]);

            if (membershipTableExists.rows.length > 0) {
              companiesResult = await pool.query(`
                SELECT DISTINCT c.name, c.display_name
                FROM "${schemaName}".company_memberships cm
                JOIN "${schemaName}".companies c ON cm.company_id = c.id
                WHERE cm.customer_id = $1 AND c.is_active = true
                ORDER BY c.display_name, c.name
                LIMIT 3
              `, [customer.id]);
            }
          }

          const companyNames = companiesResult.rows
            .map(c => c.display_name || c.name)
            .filter(Boolean);

          return {
            ...customer,
            associated_companies: companyNames.length > 0 ? companyNames.join(', ') : null,
            // Normalize customer type
            customer_type: customer.customer_type || 'PF'
          };
        } catch (companyError) {
          console.warn('[GET-CUSTOMERS] Error fetching companies for customer:', customer.id, companyError.message);
          return { 
            ...customer, 
            associated_companies: null,
            customer_type: customer.customer_type || 'PF'
          };
        }
      })
    );

    // Add metadata to response
    // Import DTO transformer
    const { transformToCustomerDTO } = await import('./application/dto/CustomerResponseDTO');

    // Helper function to safely get field values, handling potential nested structures or missing properties
    const getFieldValue = (obj: any, path: string, defaultValue: any = null) => {
      const keys = path.split('.');
      let value = obj;
      for (const key of keys) {
        if (value === null || value === undefined || typeof value !== 'object') {
          return defaultValue;
        }
        value = value[key];
      }
      return value !== undefined ? value : defaultValue;
    };

    // Transform customers using standardized DTO
    const transformedCustomers = customersWithCompanies.map(customer => {
      const normalizedCustomer = {
          ...customer,
          fullName: customer.fullName || getFieldValue(customer, 'fullName') || 
                   `${getFieldValue(customer, 'firstName', '')} ${getFieldValue(customer, 'lastName', '')}`.trim() || 
                   getFieldValue(customer, 'email', 'N/A'),
          status: customer.status === 'active' ? 'Ativo' : 
                  customer.status === 'inactive' ? 'Inativo' : 
                  customer.status || 'Ativo',
          // Ensure associated_companies is always included
          associated_companies: customer.associated_companies || null
      };

      const dto = transformToCustomerDTO(normalizedCustomer);

      // Add associated_companies to the final response object
      return {
        ...dto,
        associated_companies: customer.associated_companies || null,
        associatedCompanies: dto.associatedCompanies || []
      };
    });

    const response: CustomerListResponseDTO = {
      customers: transformedCustomers,
      total: result.rows.length,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 100,
      totalPages: Math.ceil(result.rows.length / (parseInt(req.query.limit as string) || 100)),
      metadata: {
        tenant_id: req.user.tenantId,
        schema: schemaName,
        available_columns: availableColumns,
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json({
      success: true,
      ...response
    });
  } catch (error: any) {
    console.error('[GET-CUSTOMERS] Critical error:', error);

    // Enhanced error handling with specific codes
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      tenant_id: req.user?.tenantId
    };

    // Handle specific database errors
    if (error.code === '42703') {
      console.error('[GET-CUSTOMERS] Column does not exist:', error.message);
      errorResponse.error = 'Database schema mismatch - missing columns';
      errorResponse.code = 'MISSING_COLUMN';
      errorResponse.suggestion = 'Run database migration to fix schema';
      return res.status(500).json(errorResponse);
    }

    if (error.code === '42P01') {
      console.error('[GET-CUSTOMERS] Table does not exist:', error.message);
      errorResponse.error = 'Customers table not found';
      errorResponse.code = 'TABLE_NOT_FOUND';
      errorResponse.suggestion = 'Run database migration to create table';
      return res.status(500).json(errorResponse);
    }

    if (error.code === '42501') {
      errorResponse.error = 'Insufficient permissions';
      errorResponse.code = 'PERMISSION_DENIED';
      return res.status(403).json(errorResponse);
    }

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
  }
});

// POST /api/customers - Create new customer
customersRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('[CREATE-CUSTOMER] Starting customer creation for tenant:', req.user.tenantId);
    console.log('[CREATE-CUSTOMER] Request body:', req.body);

    // Validate tenant ID
    if (!req.user.tenantId) {
      console.error('[CREATE-CUSTOMER] Missing tenant ID');
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Validate required fields
    const {
      firstName, lastName, email, phone, mobilePhone, customerType,
      cpf, cnpj, companyName, contactPerson, state, city, address,
      addressNumber, complement, neighborhood, zipCode
    } = req.body;

    if (!firstName || !lastName || !email) {
      console.error('[CREATE-CUSTOMER] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'First name, last name and email are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = $1 AND table_name = 'customers'
    `, [schemaName]);

    if (tableCheck.rows.length === 0) {
      console.error('[CREATE-CUSTOMER] Customers table does not exist in schema:', schemaName);
      return res.status(500).json({
        success: false,
        error: 'Customers table not found',
        code: 'TABLE_NOT_FOUND'
      });
    }

    // Generate unique ID
    const { v4: uuidv4 } = await import('uuid');
    const customerId = uuidv4();

    console.log('[CREATE-CUSTOMER] Inserting customer with ID:', customerId);
      const result = await pool.query(`
        INSERT INTO "${schemaName}".customers (
          id, tenant_id, first_name, last_name, email, phone, mobile_phone,
          customer_type, cpf, cnpj, company_name, contact_person,
          state, city, address, address_number, complement, 
          neighborhood, zip_code, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, true, NOW(), NOW()
        ) RETURNING *
      `, [
        customerId, req.user.tenantId, firstName, lastName, email, phone, mobilePhone,
        customerType || 'PF', cpf, cnpj, companyName, contactPerson, state, city,
        address, addressNumber, complement, neighborhood, zipCode
      ]);

    console.log('[CREATE-CUSTOMER] Customer created successfully:', result.rows[0]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Customer created successfully'
    });
  } catch (error: any) {
    console.error('[CREATE-CUSTOMER] Error:', error);

    // Handle specific database errors
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Customer with this email already exists',
        code: 'DUPLICATE_EMAIL'
      });
    }

    if (error.code === '42703') {
      console.error('[CREATE-CUSTOMER] Column does not exist:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Database schema issue - missing columns',
        code: 'SCHEMA_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      message: error.message || 'Unknown error',
      code: 'CREATION_FAILED'
    });
  }
});

// PUT /api/customers/:id - Update customer
customersRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Temporary simple implementation while Clean Architecture is being integrated
    const { id } = req.params;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const updates = req.body;
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Dynamic update query building
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(updates[key]);
        paramIndex++;
      }
    });

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id, req.user.tenantId);

    const result = await pool.query(`
      UPDATE "${schemaName}".customers 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `, updateValues);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('[UPDATE-CUSTOMER] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/customers/:id - Delete customer
customersRouter.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Temporary simple implementation while Clean Architecture is being integrated  
    const { id } = req.params;
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    await pool.query(`
      UPDATE "${schemaName}".customers 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `, [id, req.user.tenantId]);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE-CUSTOMER] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/customers/companies - Get all companies
customersRouter.get('/companies', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    // Use the correct table name and select specified fields
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        cnpj as document, 
        email, 
        phone, 
        address, 
        is_active, 
        created_at
      FROM "${schemaName}".companies 
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

    // Corrected table name: companies_relationships instead of company_memberships
    const query = `
      SELECT c.*, cr.role
      FROM "${schemaName}".customers c
      JOIN "${schemaName}".companies_relationships cr ON c.id = cr.customer_id
      WHERE cr.company_id = $1 AND cr.tenant_id = $2 
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
        SELECT cr.customer_id 
        FROM "${schemaName}".companies_relationships cr 
        WHERE cr.company_id = $2 AND cr.tenant_id = $1
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
      SELECT customer_id FROM "${schemaName}"."companies_relationships" 
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
        INSERT INTO "${schemaName}"."companies_relationships" 
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

export default customersRouter;
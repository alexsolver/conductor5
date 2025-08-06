
import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../middleware/jwtAuth';

const companiesRouter = Router();

// GET /api/companies - Get all companies
companiesRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { schemaManager } = await import('../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const result = await pool.query(`
      SELECT * FROM "${schemaName}".companies 
      WHERE tenant_id = $1
      ORDER BY name
    `, [req.user.tenantId]);

    res.json({
      success: true,
      data: result.rows,
      message: 'Companies retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch companies' 
    });
  }
});

// POST /api/companies - Create a new company
companiesRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, document, phone, email, address } = req.body;
    const { schemaManager } = await import('../db');
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
      data: result.rows[0],
      message: 'Company created successfully'
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create company' 
    });
  }
});

export { companiesRouter };

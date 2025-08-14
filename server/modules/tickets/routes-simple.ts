import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

const ticketsRouter = Router();

// ✅ GET /api/tickets - List tickets (Clean Architecture compliant)
ticketsRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        t.*,
        c.first_name || ' ' || c.last_name as customer_name,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM "${schemaName}".tickets t
      LEFT JOIN "${schemaName}".customers c ON t.beneficiary_id = c.id
      LEFT JOIN public.users u ON t.assigned_to_id = u.id
      WHERE t.tenant_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch tickets",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ✅ GET /api/tickets/:id - Get single ticket
ticketsRouter.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        t.*,
        c.first_name || ' ' || c.last_name as customer_name,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM "${schemaName}".tickets t
      LEFT JOIN "${schemaName}".customers c ON t.beneficiary_id = c.id
      LEFT JOIN public.users u ON t.assigned_to_id = u.id
      WHERE t.tenant_id = $1 AND t.id = $2
    `;

    const result = await pool.query(query, [tenantId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch ticket",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default ticketsRouter;
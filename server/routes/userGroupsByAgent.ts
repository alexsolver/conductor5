
import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import type { AuthenticatedRequest } from '../types/auth';

const router = Router();

// Get groups that contain a specific agent
router.get('/groups-by-agent/:agentId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { agentId } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT DISTINCT
        ug.id,
        ug.name,
        ug.description,
        ug.is_active,
        ug.created_at
      FROM "${schemaName}".user_groups ug
      INNER JOIN "${schemaName}".user_group_memberships ugm 
        ON ug.id = ugm.group_id
      WHERE ugm.user_id = $1::uuid 
        AND ugm.is_active = true 
        AND ug.is_active = true
      ORDER BY ug.name
    `;

    const result = await pool.query(query, [agentId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching groups by agent:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching groups by agent" 
    });
  }
});

// Get agents by group
router.get('/agents-by-group/:groupId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { groupId } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT DISTINCT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.is_active,
        ugm.role as group_role
      FROM public.users u
      INNER JOIN "${schemaName}".user_group_memberships ugm 
        ON u.id = ugm.user_id
      WHERE ugm.group_id = $1::uuid 
        AND ugm.is_active = true 
        AND u.is_active = true
        AND u.tenant_id = $2::uuid
      ORDER BY u.first_name, u.last_name
    `;

    const result = await pool.query(query, [groupId, tenantId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching agents by group:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching agents by group" 
    });
  }
});

export default router;

import { Router } from 'express';
import { jwtAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types/express';

const router = Router();

// GET /api/users - Endpoint específico para seleção de usuários no OmniBridge
router.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: "Tenant required" });
    }

    console.log("📋 [USERS-OMNIBRIDGE] Fetching users for tenant:", tenantId);

    // Buscar usuários do schema da tenant usando SQL direto
    const { schemaManager } = await import("../db");
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    const schemaName = schemaManager.getSchemaName(tenantId);
    const { sql } = await import("drizzle-orm");

    const result = await tenantDb.execute(sql`
      SELECT
        id,
        first_name,
        last_name,
        email,
        role,
        cargo as position,
        is_active as "isActive"
      FROM ${sql.identifier(schemaName)}.users
      WHERE is_active = true
      ORDER BY first_name ASC
    `);

    const users = result.rows;

    // Format response with proper name concatenation
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        user.email,
      email: user.email,
      role: user.role,
      position: user.position,
      isActive: user.isActive,
    }));

    console.log("📋 [USERS-OMNIBRIDGE] Found", users.length, "users for tenant");
    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("❌ [USERS-OMNIBRIDGE] Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

export default router;
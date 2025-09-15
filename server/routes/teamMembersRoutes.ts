
import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission } from '../middleware/rbacMiddleware';
import { db } from '../db';
import { users as usersTable } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Get all team members for a tenant
router.get(
  '/members',
  jwtAuth,
  requirePermission('tenant', 'manage_users'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

      console.log(`🔍 [TEAM-MEMBERS] Fetching team members for tenant: ${tenantId}`);

      // Buscar todos os usuários ativos do tenant
      const members = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          role: usersTable.role,
          isActive: usersTable.isActive,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          tenantId: usersTable.tenantId,
          profileImageUrl: usersTable.profileImageUrl,
          department: usersTable.cargo,
          position: usersTable.cargo,
          lastLogin: usersTable.updatedAt, // Using updatedAt as placeholder for lastLogin
        })
        .from(usersTable)
        .where(
          and(eq(usersTable.tenantId, sql`${tenantId}::uuid`), eq(usersTable.isActive, true))
        )
        .orderBy(usersTable.firstName, usersTable.lastName);

      console.log(
        `✅ [TEAM-MEMBERS] Found ${members.length} team members for tenant ${tenantId}`
      );

      // Buscar memberships + grupos
      const membershipsQuery = sql`
        SELECT 
          ugm.user_id,
          ug.id AS group_id,
          ug.name AS group_name,
          ug.description AS group_description,
          ugm.role,
          ugm.is_active,
          ugm.created_at
        FROM ${sql.raw(`"${schemaName}"`)}."user_group_memberships" ugm
        INNER JOIN ${sql.raw(`"${schemaName}"`)}."user_groups" ug
          ON ug.id = ugm.group_id
        WHERE ugm.tenant_id = ${tenantId}::uuid
          AND ug.is_active = true
      `;

      const membershipsResult = await db.execute(membershipsQuery);

      // Organizar grupos por usuário
      const groupsByUser: Record<string, any[]> = {};
      membershipsResult.rows.forEach((row: any) => {
        if (!groupsByUser[row.user_id]) groupsByUser[row.user_id] = [];
        groupsByUser[row.user_id].push({
          id: row.group_id,
          name: row.group_name,
          description: row.group_description,
          role: row.role,
          isActive: row.is_active,
          createdAt: row.created_at,
        });
      });

      // Format data for frontend
      const formattedMembers = members.map((member) => ({
        id: member.id,
        email: member.email,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        name:
          `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
          member.email,
        role: member.role,
        isActive: member.isActive,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        tenantId: member.tenantId,
        profileImageUrl: member.profileImageUrl,
        department: member.department || '',
        position: member.position || '',
        lastLogin: member.lastLogin,
        // ✅ Novo campo groups
        groups: groupsByUser[member.id] || [],
      }));

      res.json({
        success: true,
        members: formattedMembers,
        count: formattedMembers.length,
      });
    } catch (error) {
      console.error('❌ [TEAM-MEMBERS] Error fetching team members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team members',
        error: error.message,
      });
    }
  }
);


export default router;

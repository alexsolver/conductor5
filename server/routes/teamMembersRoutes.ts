
import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission } from '../middleware/rbacMiddleware';
import { db } from '../db';
import { users as usersTable } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get all team members for a tenant
router.get('/members', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;

      console.log(`🔍 [TEAM-MEMBERS] Fetching team members for tenant: ${tenantId}`);

      // Buscar todos os usuários ativos do tenant
      const members = await db.select({
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
        lastLogin: usersTable.updatedAt // Using updatedAt as placeholder for lastLogin
      })
      .from(usersTable)
      .where(and(
        eq(usersTable.tenantId, tenantId),
        eq(usersTable.isActive, true)
      ))
      .orderBy(usersTable.firstName, usersTable.lastName);

      console.log(`✅ [TEAM-MEMBERS] Found ${members.length} team members for tenant ${tenantId}`);

      // Format data for frontend
      const formattedMembers = members.map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
        role: member.role,
        isActive: member.isActive,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        tenantId: member.tenantId,
        profileImageUrl: member.profileImageUrl,
        department: member.department || '',
        position: member.position || '',
        lastLogin: member.lastLogin
      }));

      res.json({ 
        success: true,
        members: formattedMembers,
        count: formattedMembers.length
      });
    } catch (error) {
      console.error('❌ [TEAM-MEMBERS] Error fetching team members:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch team members',
        error: error.message 
      });
    }
  }
);

export default router;

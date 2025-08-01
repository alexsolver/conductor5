
import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { userGroups, userGroupMemberships } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

const userGroupsRouter = Router();

// Get user groups for assignment dropdown
userGroupsRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const groups = await db
      .select({
        id: userGroups.id,
        name: userGroups.name,
        description: userGroups.description,
        isActive: userGroups.isActive
      })
      .from(userGroups)
      .where(and(
        eq(userGroups.tenantId, req.user.tenantId),
        eq(userGroups.isActive, true)
      ))
      .orderBy(userGroups.name);

    res.json({
      success: true,
      data: groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user groups' 
    });
  }
});

export { userGroupsRouter };

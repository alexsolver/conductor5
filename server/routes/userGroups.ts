
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

    // Se não há grupos cadastrados, retornar grupos padrão
    if (groups.length === 0) {
      const defaultGroups = [
        { id: 'level1', name: 'Nível 1 - Suporte', description: 'Suporte de primeiro nível', isActive: true },
        { id: 'level2', name: 'Nível 2 - Técnico', description: 'Suporte técnico especializado', isActive: true },
        { id: 'level3', name: 'Nível 3 - Especialista', description: 'Especialistas e engenheiros', isActive: true },
        { id: 'network', name: 'Equipe de Rede', description: 'Especialistas em infraestrutura de rede', isActive: true },
        { id: 'security', name: 'Equipe de Segurança', description: 'Especialistas em segurança da informação', isActive: true },
        { id: 'development', name: 'Desenvolvimento', description: 'Equipe de desenvolvimento de software', isActive: true }
      ];

      res.json({
        success: true,
        data: defaultGroups,
        count: defaultGroups.length
      });
      return;
    }

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

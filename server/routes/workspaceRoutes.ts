
import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// Buscar workspaces de um usuário
router.get('/users/:email/workspaces', jwtAuth, async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log(`🏢 [WORKSPACE] Fetching workspaces for user: ${email}`);

    // Buscar todas as workspaces onde o usuário tem acesso
    const workspacesQuery = sql`
      SELECT DISTINCT 
        t.id,
        t.name,
        t.subdomain,
        CASE WHEN t.id = u.tenant_id THEN true ELSE false END as is_active
      FROM public.tenants t
      JOIN public.users u ON u.tenant_id = t.id OR u.email = ${email}
      WHERE u.email = ${email}
        AND t.is_active = true
      ORDER BY is_active DESC, t.name ASC
    `;

    const workspaces = await db.execute(workspacesQuery);

    console.log(`🏢 [WORKSPACE] Found ${workspaces.length} workspaces for ${email}`);

    res.json({
      success: true,
      workspaces: workspaces.map(w => ({
        id: w.id,
        name: w.name,
        subdomain: w.subdomain,
        isActive: w.is_active
      }))
    });

  } catch (error) {
    console.error('🏢 [WORKSPACE] Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspaces'
    });
  }
});

// Alternar workspace
router.post('/auth/switch-workspace', jwtAuth, async (req, res) => {
  try {
    const { workspaceId, userEmail } = req.body;
    
    console.log(`🏢 [WORKSPACE] Switching to workspace ${workspaceId} for user ${userEmail}`);

    // Verificar se o usuário tem acesso à workspace
    const userQuery = sql`
      SELECT u.*, t.name as tenant_name
      FROM public.users u
      JOIN public.tenants t ON t.id = ${workspaceId}
      WHERE u.email = ${userEmail}
        AND (u.tenant_id = ${workspaceId} OR u.role = 'saas_admin')
        AND t.is_active = true
    `;

    const userResult = await db.execute(userQuery);
    
    if (userResult.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }

    const user = userResult[0];

    // Gerar novo token JWT com a workspace selecionada
    const payload = {
      userId: user.id,
      email: user.email,
      tenantId: workspaceId,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 dias
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(payload, secret);

    console.log(`🏢 [WORKSPACE] Generated new token for workspace: ${user.tenant_name}`);

    res.json({
      success: true,
      token,
      workspace: {
        id: workspaceId,
        name: user.tenant_name
      }
    });

  } catch (error) {
    console.error('🏢 [WORKSPACE] Error switching workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to switch workspace'
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import { jwtAuth as authenticateToken } from '../middleware/jwtAuth';
import { db } from '../db';

const router = Router();

/**
 * GET /api/employment/me
 * Get current user's employment type and terminology
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Fetch user with employment type
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        employmentType: users.employmentType,
        role: users.role,
        position: users.position
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];
    const employmentType = detectEmploymentType(userData);
    const terminology = getTerminologyConfig(employmentType);

    res.json({
      success: true,
      data: {
        user: userData,
        employmentType,
        terminology,
        routes: {
          timecard: employmentType === 'autonomo' ? '/timecard-autonomous' : '/timecard',
          reports: `/${employmentType === 'autonomo' ? 'timecard-autonomous' : 'timecard'}/reports`,
          approval: `/${employmentType === 'autonomo' ? 'timecard-autonomous' : 'timecard'}/approval`
        }
      }
    });
  } catch (error) {
    console.error('Error fetching employment data:', error);
    res.status(500).json({ error: 'Failed to fetch employment data' });
  }
});

/**
 * PUT /api/employment/update-type
 * Update user's employment type (admin only)
 */
router.put('/update-type', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { userId, employmentType } = req.body;

    // Check if user has permission to update employment types
    if (!['saas_admin', 'tenant_admin'].includes(currentUser?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Validate employment type
    if (!['clt', 'autonomo'].includes(employmentType)) {
      return res.status(400).json({ error: 'Invalid employment type' });
    }

    // Update user's employment type
    await db
      .update(users)
      .set({ 
        employmentType,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: 'Employment type updated successfully',
      data: { userId, employmentType }
    });
  } catch (error) {
    console.error('Error updating employment type:', error);
    res.status(500).json({ error: 'Failed to update employment type' });
  }
});

/**
 * GET /api/employment/users-by-type
 * Get users grouped by employment type (admin only)
 */
router.get('/users-by-type', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Check permissions
    if (!['saas_admin', 'tenant_admin'].includes(currentUser?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Fetch all users with employment types
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        employmentType: users.employmentType,
        role: users.role,
        position: users.position,
        isActive: users.isActive
      })
      .from(users)
      .where(eq(users.tenantId, currentUser.tenantId));

    // Group by employment type
    const groupedUsers = {
      clt: allUsers.filter(user => (user.employmentType || 'clt') === 'clt'),
      autonomo: allUsers.filter(user => user.employmentType === 'autonomo'),
      total: allUsers.length
    };

    res.json({
      success: true,
      data: groupedUsers
    });
  } catch (error) {
    console.error('Error fetching users by employment type:', error);
    res.status(500).json({ error: 'Failed to fetch users by employment type' });
  }
});

/**
 * Helper function to detect employment type
 */
function detectEmploymentType(user: any): 'clt' | 'autonomo' {
  if (user?.employmentType) {
    return user.employmentType === 'autonomo' ? 'autonomo' : 'clt';
  }
  
  // Fallback detection
  if (user?.role === 'contractor' || user?.position?.toLowerCase().includes('freelancer')) {
    return 'autonomo';
  }
  
  return 'clt';
}

/**
 * Helper function to get terminology configuration
 */
function getTerminologyConfig(employmentType: 'clt' | 'autonomo') {
  if (employmentType === 'autonomo') {
    return {
      pageTitle: "Controle de Jornada",
      menuLabel: "Registro de Jornada",
      recordLabel: "Registro de Jornada",
      entryExitLabel: "Início/Fim de Atividade",
      timeControlLabel: "Controle de Horas",
      approvalLabel: "Validação de Jornada",
      reportLabel: "Relatório de Jornada",
      actionLabels: {
        clockIn: "Início de Atividade",
        clockOut: "Fim de Atividade",
        break: "Pausa na Atividade",
        return: "Retorno à Atividade"
      },
      statusLabels: {
        working: "Em Atividade",
        onBreak: "Em Pausa",
        offline: "Inativo"
      }
    };
  } else {
    return {
      pageTitle: "Controle de Ponto",
      menuLabel: "Ponto Eletrônico",
      recordLabel: "Registro de Ponto",
      entryExitLabel: "Entrada/Saída",
      timeControlLabel: "Banco de Horas",
      approvalLabel: "Aprovação de Ponto",
      reportLabel: "Espelho de Ponto",
      actionLabels: {
        clockIn: "Entrada",
        clockOut: "Saída",
        break: "Saída para Intervalo",
        return: "Retorno do Intervalo"
      },
      statusLabels: {
        working: "Trabalhando",
        onBreak: "Em Intervalo",
        offline: "Fora do Expediente"
      }
    };
  }
}

export default router;
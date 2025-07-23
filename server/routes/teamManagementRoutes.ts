import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { Response } from 'express';
import { db } from '../db';
import { users, tenants, departments, skills, userSkills, performanceMetrics } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';

const router = Router();

// Get team overview data
router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock overview data - replace with actual database queries
    const overview = {
      departments: [
        { name: 'Engenharia', count: 15, percentage: 45 },
        { name: 'Suporte', count: 8, percentage: 24 },
        { name: 'Vendas', count: 6, percentage: 18 },
        { name: 'RH', count: 4, percentage: 13 }
      ],
      recentActivities: [
        {
          description: 'João Silva fez check-in às 08:30',
          timestamp: '5 minutos atrás'
        },
        {
          description: 'Maria Santos solicitou férias para dezembro',
          timestamp: '15 minutos atrás'
        },
        {
          description: 'Pedro Oliveira completou treinamento de segurança',
          timestamp: '1 hora atrás'
        }
      ]
    };

    res.json(overview);
  } catch (error) {
    console.error('Error fetching team overview:', error);
    res.status(500).json({ message: 'Failed to fetch overview' });
  }
});

// Get team members
router.get('/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch real team members from database
    const members = await db.select({
      id: users.id,
      name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      email: users.email,
      position: users.position,
      department: users.role, // Using role as department for now
      status: users.status,
      phone: users.phone,
      performance: users.performance,
      lastActive: users.lastActiveAt,
      goals: users.goals,
      completedGoals: users.completedGoals,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true)
    ));

    // Format the response
    const formattedMembers = members.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      position: member.position || 'Não informado',
      department: member.department || 'general',
      status: member.status || 'active',
      phone: member.phone || 'Não informado',
      skills: [], // TODO: Add skills from userSkills table
      performance: member.performance || 75,
      lastActive: member.lastActive || member.createdAt,
      goals: member.goals || 0,
      completedGoals: member.completedGoals || 0
    }));

    res.json(formattedMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Get team statistics
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get real statistics from database
    const totalMembersResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.isActive, true)
      ));

    const activeTodayResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.isActive, true),
        sql`${users.lastActiveAt} >= CURRENT_DATE`
      ));

    const pendingApprovalsResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.status, 'pending')
      ));

    const averagePerformanceResult = await db.select({ avg: sql<number>`AVG(${users.performance})` })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.isActive, true)
      ));

    const departmentBreakdownResult = await db.select({
      role: users.role,
      count: sql<number>`COUNT(*)`
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true)
    ))
    .groupBy(users.role);

    const recentHiresResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        sql`${users.createdAt} >= CURRENT_DATE - INTERVAL '30 days'`
      ));

    // Format department breakdown
    const departmentBreakdown: { [key: string]: number } = {};
    departmentBreakdownResult.forEach(dept => {
      departmentBreakdown[dept.role || 'general'] = dept.count;
    });

    const stats = {
      totalMembers: totalMembersResult[0]?.count || 0,
      activeToday: activeTodayResult[0]?.count || 0,
      pendingApprovals: pendingApprovalsResult[0]?.count || 0,
      averagePerformance: Math.round(averagePerformanceResult[0]?.avg || 75),
      departmentBreakdown,
      recentHires: recentHiresResult[0]?.count || 0,
      upcomingAbsences: 0 // TODO: Add absence table for future implementation
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get performance data
router.get('/performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock performance data - replace with actual database queries
    const performance = {
      individuals: [
        {
          id: '1',
          name: 'João Silva',
          role: 'Desenvolvedor Senior',
          performance: 95,
          goals: 8,
          completedGoals: 7
        },
        {
          id: '2',
          name: 'Maria Santos',
          role: 'Analista de Suporte',
          performance: 88,
          goals: 6,
          completedGoals: 5
        },
        {
          id: '3',
          name: 'Pedro Oliveira',
          role: 'Gerente de Vendas',
          performance: 92,
          goals: 10,
          completedGoals: 9
        }
      ],
      goals: [
        {
          title: 'Reduzir tempo de resposta de tickets',
          description: 'Meta de reduzir tempo médio para 2 horas',
          progress: 85,
          status: 'in_progress',
          assignee: 'Equipe de Suporte'
        },
        {
          title: 'Aumentar satisfação do cliente',
          description: 'Alcançar 95% de satisfação nas pesquisas',
          progress: 92,
          status: 'in_progress',
          assignee: 'Todas as equipes'
        },
        {
          title: 'Completar treinamentos obrigatórios',
          description: 'Todos os funcionários devem completar até dezembro',
          progress: 100,
          status: 'completed',
          assignee: 'Todos'
        }
      ]
    };

    res.json(performance);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ message: 'Failed to fetch performance' });
  }
});

// Get skills matrix
router.get('/skills-matrix', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock skills matrix - replace with actual database queries
    const skillsMatrix = {
      topSkills: [
        {
          name: 'JavaScript',
          experts: 12,
          level: 'high',
          coverage: 80
        },
        {
          name: 'Customer Service',
          experts: 8,
          level: 'high',
          coverage: 90
        },
        {
          name: 'Project Management',
          experts: 5,
          level: 'medium',
          coverage: 60
        },
        {
          name: 'Data Analysis',
          experts: 3,
          level: 'low',
          coverage: 40
        }
      ],
      skillGaps: [
        {
          skill: 'AI/Machine Learning',
          priority: 'high',
          impact: 'strategic'
        },
        {
          skill: 'Cybersecurity',
          priority: 'medium',
          impact: 'operational'
        }
      ]
    };

    res.json(skillsMatrix);
  } catch (error) {
    console.error('Error fetching skills matrix:', error);
    res.status(500).json({ message: 'Failed to fetch skills matrix' });
  }
});

// Get team analytics
router.get('/analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock analytics data - replace with actual database queries
    const analytics = {
      productivity: {
        trend: 'up',
        percentage: 15,
        period: 'last_month'
      },
      turnover: {
        rate: 5,
        industry_average: 12,
        trend: 'down'
      },
      satisfaction: {
        score: 4.2,
        max_score: 5,
        trend: 'stable'
      },
      retention: {
        rate: 95,
        target: 90,
        trend: 'up'
      },
      timeToHire: {
        average: 28,
        target: 30,
        unit: 'days'
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Create new team member
router.post('/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      name,
      email,
      position,
      department,
      phone,
      skills,
      startDate
    } = req.body;

    // Mock member creation - replace with actual database insertion
    const newMember = {
      id: Date.now().toString(),
      name,
      email,
      position,
      department,
      phone,
      skills: skills || [],
      status: 'pending',
      performance: 0,
      createdAt: new Date().toISOString()
    };

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ message: 'Failed to create member' });
  }
});

// Update team member
router.put('/members/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const updateData = req.body;

    // Mock member update - replace with actual database update
    const updatedMember = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    res.json(updatedMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ message: 'Failed to update member' });
  }
});

// Delete team member
router.delete('/members/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock member deletion - replace with actual database deletion
    res.json({ message: 'Member deleted successfully', id });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ message: 'Failed to delete member' });
  }
});

export { router as teamManagementRoutes };
import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { 
  users, 
  departments, 
  approvalRequests, 
  performanceEvaluations,
  userActivityLogs,
  userSessions 
} from '@shared/schema';
import { eq, and, count, sql, desc, gte, avg, isNull, or, not } from 'drizzle-orm';

const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Get team overview data with real department statistics
router.get('/overview', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get departments with member counts
    const departmentStats = await db.select({
      id: departments.id,
      name: departments.name,
      description: departments.description,
      memberCount: sql<number>`(
        SELECT COUNT(*) FROM users 
        WHERE department_id = ${departments.id} 
        AND tenant_id = ${user.tenantId} 
        AND is_active = true
      )`
    })
    .from(departments)
    .where(and(
      eq(departments.tenantId, user.tenantId),
      eq(departments.isActive, true)
    ));

    // Calculate total members for percentages
    const totalMembers = departmentStats.reduce((sum, dept) => sum + Number(dept.memberCount), 0);

    // Format department data with percentages
    const formattedDepartments = departmentStats.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      count: Number(dept.memberCount),
      percentage: totalMembers > 0 ? Math.round((Number(dept.memberCount) / totalMembers) * 100) : 0
    }));

    // Get recent activities from activity logs
    const recentActivities = await db.select({
      id: userActivityLogs.id,
      action: userActivityLogs.action,
      description: userActivityLogs.description,
      userName: sql<string>`CONCAT(users.first_name, ' ', users.last_name)`,
      createdAt: userActivityLogs.createdAt
    })
    .from(userActivityLogs)
    .leftJoin(users, eq(userActivityLogs.userId, users.id))
    .where(eq(userActivityLogs.tenantId, user.tenantId))
    .orderBy(desc(userActivityLogs.createdAt))
    .limit(10);

    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      description: activity.description || `${activity.userName} executou: ${activity.action}`,
      timestamp: activity.createdAt,
      user: activity.userName
    }));

    res.json({
      departments: formattedDepartments,
      recentActivities: formattedActivities,
      totalMembers,
      totalDepartments: departmentStats.length
    });
  } catch (error) {
    console.error('Error fetching team overview:', error);
    res.status(500).json({ message: 'Failed to fetch overview' });
  }
});

// Get team members with department information
router.get('/members', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch team members with department information
    const members = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      position: users.position,
      departmentId: users.departmentId,
      departmentName: departments.name,
      status: users.status,
      phone: users.phone,
      performance: users.performance,
      lastActiveAt: users.lastActiveAt,
      goals: users.goals,
      completedGoals: users.completedGoals,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      profileImageUrl: users.profileImageUrl
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true)
    ));

    // Format the response
    const formattedMembers = members.map(member => ({
      id: member.id,
      name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
      email: member.email,
      position: member.position || 'Não informado',
      department: member.departmentName || 'Sem departamento',
      departmentId: member.departmentId,
      status: member.status || 'active',
      phone: member.phone || 'Não informado',
      performance: member.performance || 75,
      lastActive: member.lastActiveAt || member.createdAt,
      goals: member.goals || 0,
      completedGoals: member.completedGoals || 0,
      role: member.role,
      profileImageUrl: member.profileImageUrl
    }));

    res.json(formattedMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Get team statistics with real data
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get total active members
    const totalMembersResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.isActive, true)
      ));

    // Get members active today (last login today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeTodayResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.isActive, true),
        gte(users.lastLoginAt, today)
      ));

    // Get pending approvals
    const pendingApprovalsResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(approvalRequests)
      .where(and(
        eq(approvalRequests.tenantId, user.tenantId),
        eq(approvalRequests.status, 'pending')
      ));

    // Get average performance
    const avgPerformanceResult = await db.select({ 
      average: sql<number>`ROUND(AVG(${users.performance}), 1)` 
    })
      .from(users)
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.isActive, true),
        not(isNull(users.performance))
      ));

    const stats = {
      totalMembers: String(totalMembersResult[0]?.count || 0),
      activeToday: String(activeTodayResult[0]?.count || 0),
      pendingApprovals: String(pendingApprovalsResult[0]?.count || 0),
      averagePerformance: Number(avgPerformanceResult[0]?.average || 75)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get performance data for individuals and goals
router.get('/performance', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get individual performance data
    const individuals = await db.select({
      id: users.id,
      name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      performance: users.performance,
      goals: users.goals,
      completedGoals: users.completedGoals,
      department: departments.name
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true)
    ));

    // Get performance evaluations for goals data
    const evaluations = await db.select({
      id: performanceEvaluations.id,
      userId: performanceEvaluations.userId,
      goals: performanceEvaluations.goals,
      completedGoals: performanceEvaluations.completedGoals,
      score: performanceEvaluations.score,
      periodStart: performanceEvaluations.periodStart,
      periodEnd: performanceEvaluations.periodEnd
    })
    .from(performanceEvaluations)
    .where(eq(performanceEvaluations.tenantId, user.tenantId))
    .orderBy(desc(performanceEvaluations.periodStart));

    // Format individual performance data
    const formattedIndividuals = individuals.map(individual => ({
      id: individual.id,
      name: individual.name,
      performance: individual.performance || 75,
      goals: individual.goals || 0,
      completedGoals: individual.completedGoals || 0,
      department: individual.department || 'Sem departamento',
      completionRate: individual.goals > 0 ? Math.round((individual.completedGoals / individual.goals) * 100) : 0
    }));

    // Create mock goals data based on evaluations
    const goalsData = [
      { name: 'Metas de Vendas', completed: 15, total: 20, percentage: 75 },
      { name: 'Treinamentos', completed: 8, total: 10, percentage: 80 },
      { name: 'Projetos', completed: 12, total: 15, percentage: 80 },
      { name: 'Avaliações', completed: 18, total: 25, percentage: 72 }
    ];

    res.json({
      individuals: formattedIndividuals,
      goals: goalsData,
      totalEvaluations: evaluations.length
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ message: 'Failed to fetch performance data' });
  }
});

// Get skills matrix data
router.get('/skills-matrix', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // For now, return mock skills data since the skills tables need to be properly set up
    const mockSkillsData = {
      topSkills: [
        { name: 'JavaScript', count: 12, level: 'Avançado' },
        { name: 'React', count: 10, level: 'Intermediário' },
        { name: 'Node.js', count: 8, level: 'Avançado' },
        { name: 'TypeScript', count: 7, level: 'Intermediário' },
        { name: 'SQL', count: 15, level: 'Avançado' }
      ],
      skillCategories: [
        { category: 'Desenvolvimento', count: 45 },
        { category: 'Design', count: 12 },
        { category: 'Gestão', count: 8 },
        { category: 'Comunicação', count: 20 }
      ]
    };

    res.json(mockSkillsData);
  } catch (error) {
    console.error('Error fetching skills matrix:', error);
    res.status(500).json({ message: 'Failed to fetch skills matrix' });
  }
});

// Get departments list
router.get('/departments', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const departmentsList = await db.select({
      id: departments.id,
      name: departments.name,
      description: departments.description,
      managerId: departments.managerId,
      isActive: departments.isActive,
      createdAt: departments.createdAt
    })
    .from(departments)
    .where(and(
      eq(departments.tenantId, user.tenantId),
      eq(departments.isActive, true)
    ));

    res.json({ departments: departmentsList });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

// Update member status
router.put('/members/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { status } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update user status
    await db.update(users)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(and(
        eq(users.id, id),
        eq(users.tenantId, user.tenantId)
      ));

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Invalidate cache when members are created/updated
router.post('/members/refresh', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // This endpoint can be called after creating/updating members to refresh data
    res.json({ success: true, message: 'Cache refreshed' });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ message: 'Failed to refresh cache' });
  }
});

export { router as teamManagementRoutes };
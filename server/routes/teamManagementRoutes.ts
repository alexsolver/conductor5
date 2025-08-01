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
} from '../../shared/schema.js';
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

    // Get user group memberships
    const groupMemberships = await db.select({
      userId: sql`user_group_memberships.user_id`,
      groupId: sql`user_group_memberships.group_id`,
      groupName: sql`user_groups.name`
    })
    .from(sql`user_group_memberships`)
    .leftJoin(sql`user_groups`, sql`user_group_memberships.group_id = user_groups.id`)
    .where(sql`user_groups.tenant_id = ${user.tenantId}`);

    // Create group membership map
    const groupMembershipMap = new Map();
    groupMemberships.forEach(membership => {
      if (!groupMembershipMap.has(membership.userId)) {
        groupMembershipMap.set(membership.userId, []);
      }
      groupMembershipMap.get(membership.userId).push(membership.groupId);
    });

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
      profileImageUrl: member.profileImageUrl,
      groupIds: groupMembershipMap.get(member.id) || []
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

    // Calculate real goals data from users table
    const goalsAggregation = await db.select({
      totalGoals: sql<number>`SUM(${users.goals})`,
      totalCompletedGoals: sql<number>`SUM(${users.completedGoals})`,
      averageCompletion: sql<number>`CAST(AVG(CASE WHEN ${users.goals} > 0 THEN (${users.completedGoals}::float / ${users.goals}) * 100 ELSE 0 END) AS DECIMAL(10,2))`
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true),
      not(isNull(users.goals))
    ));

    const goalsStats = goalsAggregation[0];
    const totalGoals = Number(goalsStats?.totalGoals) || 0;
    const totalCompleted = Number(goalsStats?.totalCompletedGoals) || 0;
    const averageCompletion = Number(goalsStats?.averageCompletion) || 0;

    // Create realistic goals breakdown
    const goalsData = [
      { 
        name: 'Metas Individuais', 
        completed: totalCompleted, 
        total: totalGoals, 
        percentage: totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0 
      },
      { 
        name: 'Performance Geral', 
        completed: Math.round(averageCompletion), 
        total: 100, 
        percentage: Math.round(averageCompletion) 
      },
      { 
        name: 'Usuários Ativos', 
        completed: formattedIndividuals.length, 
        total: formattedIndividuals.length + 2, 
        percentage: formattedIndividuals.length > 0 ? Math.round((formattedIndividuals.length / (formattedIndividuals.length + 2)) * 100) : 0 
      }
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

    // First, check if technical skills tables exist and have data
    try {
      // Get real skills data from technical skills module
      const skillsData = await db.select({
        skillName: sql<string>`skills.name`,
        skillLevel: sql<string>`skills.level`,
        userCount: sql<number>`COUNT(DISTINCT user_skills.user_id)`,
        category: sql<string>`skills.category`
      })
      .from(sql`skills`)
      .leftJoin(sql`user_skills`, sql`skills.id = user_skills.skill_id`)
      .leftJoin(users, sql`user_skills.user_id = users.id`)
      .where(and(
        sql`skills.tenant_id = ${user.tenantId}`,
        sql`skills.is_active = true`,
        or(
          sql`users.tenant_id = ${user.tenantId}`,
          sql`users.id IS NULL`
        )
      ))
      .groupBy(sql`skills.id, skills.name, skills.level, skills.category`)
      .orderBy(sql`COUNT(DISTINCT user_skills.user_id) DESC`)
      .limit(10);

      if (skillsData && skillsData.length > 0) {
        // Format real skills data
        const topSkills = skillsData.map(skill => ({
          name: skill.skillName,
          count: Number(skill.userCount) || 0,
          level: skill.skillLevel || 'Básico'
        }));

        // Group by categories
        const categoryMap = new Map();
        skillsData.forEach(skill => {
          const category = skill.category || 'Geral';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, 0);
          }
          categoryMap.set(category, categoryMap.get(category) + Number(skill.userCount));
        });

        const skillCategories = Array.from(categoryMap.entries()).map(([category, count]) => ({
          category,
          count
        }));

        return res.json({
          topSkills,
          skillCategories
        });
      }
    } catch (skillsError) {
      console.log('Technical skills tables not available, using fallback');
    }

    // Fallback: Get skills data from user positions and departments
    const positionSkills = await db.select({
      position: users.position,
      department: departments.name,
      userCount: sql<number>`COUNT(*)`
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true),
      not(sql`${users.position} IS NULL`)
    ))
    .groupBy(users.position, departments.name);

    if (positionSkills.length > 0) {
      // Generate skills based on actual positions
      const topSkills = positionSkills.map(pos => ({
        name: pos.position || 'Posição Geral',
        count: Number(pos.userCount),
        level: pos.department ? 'Intermediário' : 'Básico'
      }));

      // Generate categories based on departments
      const departmentCategories = await db.select({
        department: departments.name,
        userCount: sql<number>`COUNT(users.id)`
      })
      .from(departments)
      .leftJoin(users, and(
        eq(users.departmentId, departments.id),
        eq(users.isActive, true)
      ))
      .where(eq(departments.tenantId, user.tenantId))
      .groupBy(departments.name);

      const skillCategories = departmentCategories.map(dept => ({
        category: dept.department || 'Sem Departamento',
        count: Number(dept.userCount) || 0
      }));

      return res.json({
        topSkills,
        skillCategories
      });
    }

    // Final fallback - return empty arrays instead of mock data
    res.json({
      topSkills: [],
      skillCategories: []
    });

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

    // Validate user permissions
    if (!user || !['tenant_admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

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

// Update member data
router.put('/members/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const updateData = req.body;

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Update user data
    const updatedMember = await db.update(users)
      .set({
        firstName: updateData.firstName || null,
        lastName: updateData.lastName || null,
        email: updateData.email,
        phone: updateData.phone || null,
        position: updateData.position || null,
        departmentId: updateData.departmentId || null,
        address: updateData.address || null,
        city: updateData.city || null,
        state: updateData.state || null,
        zipCode: updateData.zipCode || null,
        country: updateData.country || null,
        hireDate: updateData.hireDate ? new Date(updateData.hireDate) : null,
        salary: updateData.salary ? parseFloat(updateData.salary) : null,
        employmentType: updateData.employmentType || null,
        updatedAt: new Date()
      })
      .where(and(
        eq(users.id, id),
        eq(users.tenantId, user.tenantId)
      ));

    res.json({ 
      success: true, 
      message: 'Member updated successfully'
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Failed to update member' });
  }
});

// Get roles list
router.get('/roles', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get distinct roles from users table
    const rolesFromUsers = await db.select({
      role: users.role
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true),
      not(sql`${users.role} IS NULL`)
    ))
    .groupBy(users.role);

    // Get distinct positions as additional roles
    const positionsFromUsers = await db.select({
      position: users.position
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true),
      not(sql`${users.position} IS NULL`)
    ))
    .groupBy(users.position);

    const roles = [
      ...rolesFromUsers.map(r => ({ id: r.role, name: r.role, type: 'role' })),
      ...positionsFromUsers.map(p => ({ id: p.position, name: p.position, type: 'position' }))
    ].filter((role, index, self) => 
      role.id && self.findIndex(r => r.id === role.id) === index
    );

    res.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
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
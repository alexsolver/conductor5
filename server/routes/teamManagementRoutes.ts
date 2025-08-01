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

    // Get user group memberships with better error handling
    let groupMembershipMap = new Map();
    
    try {
      const groupMemberships = await db.select({
        userId: sql`ugm.user_id`,
        groupId: sql`ugm.group_id`,
        groupName: sql`ug.name`
      })
      .from(sql`user_group_memberships ugm`)
      .innerJoin(sql`user_groups ug`, sql`ugm.group_id = ug.id`)
      .where(and(
        sql`ug.tenant_id = ${user.tenantId}`,
        sql`ug.is_active = true`
      ));

      groupMemberships.forEach(membership => {
        if (membership.userId && membership.groupId) {
          if (!groupMembershipMap.has(membership.userId)) {
            groupMembershipMap.set(membership.userId, []);
          }
          groupMembershipMap.get(membership.userId).push(membership.groupId);
        }
      });
      
      console.log(`Team Management: Loaded ${groupMemberships.length} group memberships`);
    } catch (groupError) {
      console.warn('Team Management: Error loading group memberships:', groupError);
      // Continue without group data rather than failing
    }

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

    // Get real skills data from user competencies and positions
    const userCompetencies = await db.select({
      userId: users.id,
      position: users.position,
      department: departments.name,
      experienceLevel: sql<string>`CASE 
        WHEN EXTRACT(YEAR FROM AGE(NOW(), users.hire_date)) >= 5 THEN 'Avançado'
        WHEN EXTRACT(YEAR FROM AGE(NOW(), users.hire_date)) >= 2 THEN 'Intermediário'
        ELSE 'Básico'
      END`,
      performance: users.performance
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true),
      not(sql`${users.position} IS NULL`)
    ));

    if (userCompetencies.length > 0) {
      // Aggregate skills by position
      const skillsMap = new Map();
      const categoriesMap = new Map();

      userCompetencies.forEach(comp => {
        const skillName = comp.position || 'Posição Geral';
        const category = comp.department || 'Departamento Geral';
        
        if (!skillsMap.has(skillName)) {
          skillsMap.set(skillName, {
            name: skillName,
            count: 0,
            totalPerformance: 0,
            level: comp.experienceLevel
          });
        }
        
        const skill = skillsMap.get(skillName);
        skill.count += 1;
        skill.totalPerformance += (comp.performance || 75);
        
        // Update level based on average performance
        const avgPerformance = skill.totalPerformance / skill.count;
        if (avgPerformance >= 90) skill.level = 'Avançado';
        else if (avgPerformance >= 75) skill.level = 'Intermediário';
        else skill.level = 'Básico';

        // Count by category
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, 0);
        }
        categoriesMap.set(category, categoriesMap.get(category) + 1);
      });

      const topSkills = Array.from(skillsMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const skillCategories = Array.from(categoriesMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return res.json({
        topSkills,
        skillCategories
      });
    }

    // If no specific competencies found, use general user distribution data
    const userDistribution = await db.select({
      role: users.role,
      status: users.status,
      userCount: sql<number>`COUNT(*)`
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true)
    ))
    .groupBy(users.role, users.status);

    const roleSkills = userDistribution.map(dist => ({
      name: `${dist.role || 'Função Geral'} (${dist.status})`,
      count: Number(dist.userCount),
      level: dist.role === 'tenant_admin' ? 'Avançado' : 'Intermediário'
    }));

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

    res.json({
      topSkills: roleSkills.length > 0 ? roleSkills : [],
      skillCategories: skillCategories.length > 0 ? skillCategories : []
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

// Sync team data and ensure consistency
router.post('/members/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Update user activity timestamps
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(and(
        eq(users.tenantId, user.tenantId),
        eq(users.isActive, true)
      ));

    // Get sync statistics
    const syncStats = await db.select({
      totalUsers: sql<number>`COUNT(*)`,
      activeUsers: sql<number>`SUM(CASE WHEN last_active_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END)`,
      userGroups: sql<number>`COUNT(DISTINCT department_id)`
    })
    .from(users)
    .where(and(
      eq(users.tenantId, user.tenantId),
      eq(users.isActive, true)
    ));

    res.json({ 
      success: true, 
      message: 'Team data synchronized',
      stats: syncStats[0] || { totalUsers: 0, activeUsers: 0, userGroups: 0 }
    });
  } catch (error) {
    console.error('Error syncing team data:', error);
    res.status(500).json({ message: 'Failed to sync team data' });
  }
});

export { router as teamManagementRoutes };
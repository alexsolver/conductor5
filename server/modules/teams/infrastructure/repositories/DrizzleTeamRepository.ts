
import { eq, and, sql, desc, gte, not, isNull } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  users, 
  departments, 
  approvalRequests, 
  performanceEvaluations,
  userActivityLogs 
} from '@shared/schema';
import { ITeamRepository } from '../../domain/repositories/ITeamRepository';
import { Team } from '../../domain/entities/Team';
import { TeamMember } from '../../domain/entities/TeamMember';

export class DrizzleTeamRepository implements ITeamRepository {
  
  async findTeamsByTenant(tenantId: string): Promise<Team[]> {
    try {
      const teams = await db.select({
        id: departments.id,
        name: departments.name,
        description: departments.description,
        managerId: departments.managerId,
        tenantId: departments.tenantId,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt
      })
      .from(departments)
      .where(and(
        eq(departments.tenantId, tenantId),
        eq(departments.isActive, true)
      ));

      return teams.map(team => ({
        ...team,
        updatedAt: team.updatedAt || team.createdAt
      }));
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  async findMembersByTenant(tenantId: string): Promise<TeamMember[]> {
    try {
      const members = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        position: users.position,
        departmentId: users.departmentId,
        isActive: users.isActive,
        status: users.status,
        phone: users.phone,
        cellPhone: users.cellPhone,
        performance: users.performance,
        goals: users.goals,
        completedGoals: users.completedGoals,
        lastActiveAt: users.lastActiveAt,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        departmentName: departments.name
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.isActive, true)
      ));

      return members.map(member => ({
        id: member.id,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Usuário',
        email: member.email,
        role: member.role,
        position: member.position,
        department: member.departmentName,
        departmentName: member.departmentName,
        isActive: member.isActive,
        status: member.status || 'active',
        phone: member.phone,
        cellPhone: member.cellPhone,
        performance: member.performance,
        goals: member.goals,
        completedGoals: member.completedGoals,
        lastActive: member.lastActiveAt,
        groupIds: [], // TODO: Implement group memberships
        tenantId: member.tenantId,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt || member.createdAt
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  async findDepartmentsByTenant(tenantId: string): Promise<any[]> {
    try {
      const departmentStats = await db.select({
        id: departments.id,
        name: departments.name,
        description: departments.description,
        memberCount: sql<number>`(
          SELECT COUNT(*) FROM users 
          WHERE department_id = ${departments.id} 
          AND tenant_id = ${tenantId} 
          AND is_active = true
        )`
      })
      .from(departments)
      .where(and(
        eq(departments.tenantId, tenantId),
        eq(departments.isActive, true)
      ));

      const totalMembers = departmentStats.reduce((sum, dept) => sum + Number(dept.memberCount), 0);

      return departmentStats.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        count: Number(dept.memberCount),
        percentage: totalMembers > 0 ? Math.round((Number(dept.memberCount) / totalMembers) * 100) : 0
      }));
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async getTeamStats(tenantId: string): Promise<any> {
    try {
      // Get total active members
      const totalMembersResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        ));

      // Get members active today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeTodayResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true),
          gte(users.lastLoginAt, today)
        ));

      // Get pending approvals
      const pendingApprovalsResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(approvalRequests)
        .where(and(
          eq(approvalRequests.tenantId, tenantId),
          eq(approvalRequests.status, 'pending')
        ));

      // Get average performance
      const avgPerformanceResult = await db.select({ 
        average: sql<number>`ROUND(AVG(${users.performance}), 1)` 
      })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true),
          not(isNull(users.performance))
        ));

      return {
        totalMembers: String(totalMembersResult[0]?.count || 0),
        activeToday: String(activeTodayResult[0]?.count || 0),
        pendingApprovals: String(pendingApprovalsResult[0]?.count || 0),
        averagePerformance: Number(avgPerformanceResult[0]?.average || 0)
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return {
        totalMembers: "0",
        activeToday: "0", 
        pendingApprovals: "0",
        averagePerformance: 0
      };
    }
  }

  async getTeamOverview(tenantId: string): Promise<any> {
    try {
      const departments = await this.findDepartmentsByTenant(tenantId);

      // Get recent activities
      const recentActivities = await db.select({
        id: userActivityLogs.id,
        action: userActivityLogs.action,
        description: userActivityLogs.description,
        userName: sql<string>`CONCAT(users.first_name, ' ', users.last_name)`,
        createdAt: userActivityLogs.createdAt
      })
      .from(userActivityLogs)
      .leftJoin(users, eq(userActivityLogs.userId, users.id))
      .where(eq(userActivityLogs.tenantId, tenantId))
      .orderBy(desc(userActivityLogs.createdAt))
      .limit(10);

      const formattedActivities = recentActivities.map(activity => ({
        id: activity.id,
        description: activity.description || `${activity.userName} executou: ${activity.action}`,
        timestamp: activity.createdAt,
        user: activity.userName
      }));

      return {
        departments,
        recentActivities: formattedActivities,
        totalMembers: departments.reduce((sum, dept) => sum + dept.count, 0),
        totalDepartments: departments.length
      };
    } catch (error) {
      console.error('Error fetching team overview:', error);
      return {
        departments: [],
        recentActivities: [],
        totalMembers: 0,
        totalDepartments: 0
      };
    }
  }

  async getTeamPerformance(tenantId: string): Promise<any> {
    try {
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
        eq(users.tenantId, tenantId),
        eq(users.isActive, true)
      ));

      const formattedIndividuals = individuals.map(individual => ({
        id: individual.id,
        name: individual.name,
        performance: individual.performance,
        goals: individual.goals,
        completedGoals: individual.completedGoals,
        department: individual.department || 'Sem departamento',
        completionRate: individual.goals > 0 ? Math.round((individual.completedGoals / individual.goals) * 100) : 0
      }));

      // Calculate goals data
      const goalsAggregation = await db.select({
        totalGoals: sql<number>`SUM(${users.goals})`,
        totalCompletedGoals: sql<number>`SUM(${users.completedGoals})`,
        averageCompletion: sql<number>`CAST(AVG(CASE WHEN ${users.goals} > 0 THEN (${users.completedGoals}::float / ${users.goals}) * 100 ELSE 0 END) AS DECIMAL(10,2))`
      })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.isActive, true),
        not(isNull(users.goals))
      ));

      const goalsStats = goalsAggregation[0];
      const totalGoals = Number(goalsStats?.totalGoals) || 0;
      const totalCompleted = Number(goalsStats?.totalCompletedGoals) || 0;
      const averageCompletion = Number(goalsStats?.averageCompletion) || 0;

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
        }
      ];

      return {
        individuals: formattedIndividuals,
        goals: goalsData,
        totalEvaluations: 0
      };
    } catch (error) {
      console.error('Error fetching performance data:', error);
      return {
        individuals: [],
        goals: [],
        totalEvaluations: 0
      };
    }
  }

  async getSkillsMatrix(tenantId: string): Promise<any> {
    try {
      const userCompetencies = await db.select({
        userId: users.id,
        position: users.position,
        department: departments.name,
        experienceLevel: sql<string>`CASE 
          WHEN EXTRACT(YEAR FROM AGE(NOW(), users.created_at)) >= 5 THEN 'Avançado'
          WHEN EXTRACT(YEAR FROM AGE(NOW(), users.created_at)) >= 2 THEN 'Intermediário'
          ELSE 'Básico'
        END`,
        performance: users.performance
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.isActive, true),
        not(sql`${users.position} IS NULL`)
      ));

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
        skill.totalPerformance += (comp.performance || 0);

        const avgPerformance = skill.totalPerformance / skill.count;
        if (avgPerformance >= 85 && comp.experienceLevel === 'Avançado') skill.level = 'Avançado';
        else if (avgPerformance >= 70 && comp.experienceLevel === 'Intermediário') skill.level = 'Intermediário';
        else if (avgPerformance > 0) skill.level = 'Básico';
        else skill.level = 'Não avaliado';

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

      return {
        topSkills,
        skillCategories
      };
    } catch (error) {
      console.error('Error fetching skills matrix:', error);
      return {
        topSkills: [],
        skillCategories: []
      };
    }
  }

  async getRoles(tenantId: string): Promise<any[]> {
    try {
      const rolesFromUsers = await db.select({
        role: users.role
      })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.isActive, true),
        not(sql`${users.role} IS NULL`)
      ))
      .groupBy(users.role);

      const positionsFromUsers = await db.select({
        position: users.position
      })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
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

      return roles;
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  async updateMemberStatus(tenantId: string, memberId: string, status: string): Promise<boolean> {
    try {
      const result = await db.update(users)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(and(
          eq(users.id, memberId),
          eq(users.tenantId, tenantId)
        ));

      return true;
    } catch (error) {
      console.error('Error updating member status:', error);
      return false;
    }
  }

  async updateMember(tenantId: string, memberId: string, updateData: any): Promise<any> {
    try {
      const updateFields: any = {
        updatedAt: new Date()
      };

      if (updateData.firstName) updateFields.firstName = updateData.firstName;
      if (updateData.lastName) updateFields.lastName = updateData.lastName;
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.phone) updateFields.phone = updateData.phone;
      if (updateData.cellPhone) updateFields.cellPhone = updateData.cellPhone;
      if (updateData.role) updateFields.role = updateData.role;
      if (updateData.cargo) updateFields.position = updateData.cargo;
      if (updateData.cep) updateFields.cep = updateData.cep;
      if (updateData.state) updateFields.state = updateData.state;
      if (updateData.city) updateFields.city = updateData.city;
      if (updateData.streetAddress) updateFields.streetAddress = updateData.streetAddress;
      if (updateData.employeeCode) updateFields.employeeCode = updateData.employeeCode;
      if (updateData.pis) updateFields.pis = updateData.pis;
      if (updateData.admissionDate) updateFields.admissionDate = new Date(updateData.admissionDate);

      const updatedMember = await db.update(users)
        .set(updateFields)
        .where(and(
          eq(users.id, memberId),
          eq(users.tenantId, tenantId)
        ))
        .returning();

      return updatedMember[0] || null;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  async syncTeamData(tenantId: string): Promise<any> {
    try {
      await db.update(users)
        .set({ lastActiveAt: new Date() })
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        ));

      const syncStats = await db.select({
        totalUsers: sql<number>`COUNT(*)`,
        activeUsers: sql<number>`SUM(CASE WHEN last_active_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END)`,
        userGroups: sql<number>`COUNT(DISTINCT department_id)`
      })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.isActive, true)
      ));

      return {
        success: true,
        stats: syncStats[0] || { totalUsers: 0, activeUsers: 0, userGroups: 0 }
      };
    } catch (error) {
      console.error('Error syncing team data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

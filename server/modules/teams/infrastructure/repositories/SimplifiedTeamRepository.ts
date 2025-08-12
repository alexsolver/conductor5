/**
 * Simplified Team Repository - Phase 10 Implementation
 * 
 * Implementação simplificada do repositório de equipes
 * Para uso imediato enquanto integração com banco não está disponível
 * 
 * @module SimplifiedTeamRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 10 Clean Architecture Implementation
 */

import { Team } from '../../domain/entities/Team';
import { ITeamRepository, TeamFilters, TeamStatistics } from '../../domain/repositories/ITeamRepository';

export class SimplifiedTeamRepository implements ITeamRepository {
  private teams: Team[] = [];

  async create(team: Team): Promise<Team> {
    this.teams.push(team);
    console.log(`[SIMPLIFIED-TEAM-REPO] Created team: ${team.id} (${team.name}) for tenant: ${team.tenantId}`);
    return team;
  }

  async findById(id: string, tenantId: string): Promise<Team | null> {
    const team = this.teams.find(t => t.id === id && t.tenantId === tenantId);
    return team || null;
  }

  async findAll(filters: TeamFilters): Promise<Team[]> {
    let filteredTeams = this.teams.filter(team => {
      if (filters.tenantId && team.tenantId !== filters.tenantId) return false;
      if (filters.teamType && team.teamType !== filters.teamType) return false;
      if (filters.status && team.status !== filters.status) return false;
      if (filters.managerId && team.managerId !== filters.managerId) return false;
      if (filters.departmentId && team.departmentId !== filters.departmentId) return false;
      if (filters.location && team.location !== filters.location) return false;
      if (filters.isActive !== undefined && team.isActive !== filters.isActive) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = team.name.toLowerCase().includes(searchLower);
        const matchesDescription = team.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }
      return true;
    });

    return filteredTeams;
  }

  async update(id: string, tenantId: string, updateData: Partial<Team>): Promise<Team | null> {
    const index = this.teams.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (index === -1) return null;

    this.teams[index] = { ...this.teams[index], ...updateData, updatedAt: new Date() };
    console.log(`[SIMPLIFIED-TEAM-REPO] Updated team: ${id} for tenant: ${tenantId}`);
    return this.teams[index];
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const index = this.teams.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (index === -1) return false;

    this.teams[index].isActive = false;
    this.teams[index].status = 'inactive';
    this.teams[index].updatedAt = new Date();
    console.log(`[SIMPLIFIED-TEAM-REPO] Soft deleted team: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async hardDelete(id: string, tenantId: string): Promise<boolean> {
    const index = this.teams.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (index === -1) return false;

    this.teams.splice(index, 1);
    console.log(`[SIMPLIFIED-TEAM-REPO] Hard deleted team: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async findByType(teamType: string, tenantId: string): Promise<Team[]> {
    return this.teams.filter(t => t.teamType === teamType && t.tenantId === tenantId);
  }

  async findByManager(managerId: string, tenantId: string): Promise<Team[]> {
    return this.teams.filter(t => t.managerId === managerId && t.tenantId === tenantId);
  }

  async findByDepartment(departmentId: string, tenantId: string): Promise<Team[]> {
    return this.teams.filter(t => t.departmentId === departmentId && t.tenantId === tenantId);
  }

  async findByStatus(status: string, tenantId: string): Promise<Team[]> {
    return this.teams.filter(t => t.status === status && t.tenantId === tenantId);
  }

  async search(query: string, tenantId: string): Promise<Team[]> {
    const searchLower = query.toLowerCase();
    return this.teams.filter(team => 
      team.tenantId === tenantId && 
      (team.name.toLowerCase().includes(searchLower) || 
       team.description?.toLowerCase().includes(searchLower))
    );
  }

  async findByLocation(location: string, tenantId: string): Promise<Team[]> {
    return this.teams.filter(t => t.location === location && t.tenantId === tenantId);
  }

  async getStatistics(tenantId: string): Promise<TeamStatistics> {
    const tenantTeams = this.teams.filter(t => t.tenantId === tenantId);
    
    const totalTeams = tenantTeams.length;
    const activeTeams = tenantTeams.filter(t => t.status === 'active').length;
    const inactiveTeams = tenantTeams.filter(t => t.status === 'inactive').length;
    const suspendedTeams = tenantTeams.filter(t => t.status === 'suspended').length;
    
    const teamsByType = tenantTeams.reduce((acc, team) => {
      acc[team.teamType] = (acc[team.teamType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const teamsByDepartment = tenantTeams.reduce((acc, team) => {
      if (team.departmentId) {
        acc[team.departmentId] = (acc[team.departmentId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const teamsWithManagers = tenantTeams.filter(t => t.managerId).length;
    const teamsWithoutManagers = totalTeams - teamsWithManagers;

    return {
      totalTeams,
      activeTeams,
      inactiveTeams,
      suspendedTeams,
      teamsByType,
      teamsByDepartment,
      averageTeamSize: 5, // Mock value
      teamsWithManagers,
      teamsWithoutManagers
    };
  }

  async count(filters: TeamFilters): Promise<number> {
    const teams = await this.findAll(filters);
    return teams.length;
  }

  async getTeamsWithMemberCounts(tenantId: string): Promise<Array<Team & { memberCount: number }>> {
    const teams = this.teams.filter(t => t.tenantId === tenantId);
    return teams.map(team => ({
      ...team,
      memberCount: Math.floor(Math.random() * 10) + 1 // Mock member count
    }));
  }

  async getTeamTypes(tenantId: string): Promise<string[]> {
    const teams = this.teams.filter(t => t.tenantId === tenantId);
    const types = [...new Set(teams.map(t => t.teamType))];
    return types;
  }

  async getDepartmentsWithTeamCounts(tenantId: string): Promise<Array<{ departmentId: string; teamCount: number }>> {
    const teams = this.teams.filter(t => t.tenantId === tenantId && t.departmentId);
    const departments = teams.reduce((acc, team) => {
      if (team.departmentId) {
        acc[team.departmentId] = (acc[team.departmentId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(departments).map(([departmentId, teamCount]) => ({
      departmentId,
      teamCount
    }));
  }

  async existsByName(name: string, tenantId: string, excludeId?: string): Promise<boolean> {
    return this.teams.some(team => 
      team.name === name && 
      team.tenantId === tenantId && 
      (!excludeId || team.id !== excludeId)
    );
  }

  async validateCapacity(teamId: string, tenantId: string): Promise<{
    currentMembers: number;
    maxMembers: number | null;
    canAddMembers: boolean;
  }> {
    const team = await this.findById(teamId, tenantId);
    if (!team) {
      throw new Error('Team not found');
    }

    const currentMembers = Math.floor(Math.random() * 8) + 1; // Mock current members
    const maxMembers = team.maxMembers;
    const canAddMembers = !maxMembers || currentMembers < maxMembers;

    return {
      currentMembers,
      maxMembers,
      canAddMembers
    };
  }

  async getAvailableTeams(tenantId: string): Promise<Team[]> {
    const teams = this.teams.filter(t => 
      t.tenantId === tenantId && 
      t.isActive && 
      t.status === 'active'
    );
    return teams;
  }

  async createBulk(teams: Team[]): Promise<Team[]> {
    this.teams.push(...teams);
    console.log(`[SIMPLIFIED-TEAM-REPO] Created ${teams.length} teams in bulk`);
    return teams;
  }

  async updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<Team> }>): Promise<Team[]> {
    const updatedTeams: Team[] = [];
    
    for (const update of updates) {
      const updatedTeam = await this.update(update.id, update.tenantId, update.data);
      if (updatedTeam) {
        updatedTeams.push(updatedTeam);
      }
    }

    console.log(`[SIMPLIFIED-TEAM-REPO] Updated ${updatedTeams.length} teams in bulk`);
    return updatedTeams;
  }

  async deactivateBulk(teamIds: string[], tenantId: string): Promise<boolean> {
    let updated = 0;
    for (const teamId of teamIds) {
      const success = await this.delete(teamId, tenantId);
      if (success) updated++;
    }

    console.log(`[SIMPLIFIED-TEAM-REPO] Deactivated ${updated}/${teamIds.length} teams in bulk`);
    return updated === teamIds.length;
  }

  async activateBulk(teamIds: string[], tenantId: string): Promise<boolean> {
    let updated = 0;
    for (const teamId of teamIds) {
      const team = await this.update(teamId, tenantId, { isActive: true, status: 'active' });
      if (team) updated++;
    }

    console.log(`[SIMPLIFIED-TEAM-REPO] Activated ${updated}/${teamIds.length} teams in bulk`);
    return updated === teamIds.length;
  }

  // Mock implementations for relationship operations
  async getTeamMembers(teamId: string, tenantId: string): Promise<Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    joinedAt: Date;
  }>> {
    // Mock team members
    return [
      {
        userId: 'user_1',
        userName: 'João Silva',
        userEmail: 'joao@example.com',
        role: 'member',
        joinedAt: new Date(Date.now() - 86400000)
      },
      {
        userId: 'user_2',
        userName: 'Maria Santos',
        userEmail: 'maria@example.com',
        role: 'leader',
        joinedAt: new Date(Date.now() - 172800000)
      }
    ];
  }

  async getTeamsForUser(userId: string, tenantId: string): Promise<Team[]> {
    // Mock: return some teams for the user
    return this.teams.filter(t => t.tenantId === tenantId && t.isActive);
  }

  async getTeamsWithManagerDetails(tenantId: string): Promise<Array<Team & {
    managerName?: string;
    managerEmail?: string;
  }>> {
    const teams = this.teams.filter(t => t.tenantId === tenantId);
    return teams.map(team => ({
      ...team,
      managerName: team.managerId ? 'Manager Sample' : undefined,
      managerEmail: team.managerId ? 'manager@example.com' : undefined
    }));
  }
}
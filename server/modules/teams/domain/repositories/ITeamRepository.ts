/**
 * Team Repository Interface - Phase 10 Implementation
 * 
 * Interface do repositório para operações de persistência de Teams
 * Define contratos para operações de dados sem dependências externas
 * 
 * @module ITeamRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 10 Clean Architecture Implementation
 */

import { Team, TeamEntity } from '../entities/Team';

export interface TeamFilters {
  tenantId?: string;
  teamType?: string;
  status?: string;
  managerId?: string;
  departmentId?: string;
  location?: string;
  isActive?: boolean;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface TeamStatistics {
  totalTeams: number;
  activeTeams: number;
  inactiveTeams: number;
  suspendedTeams: number;
  teamsByType: Record<string, number>;
  teamsByDepartment: Record<string, number>;
  averageTeamSize: number;
  teamsWithManagers: number;
  teamsWithoutManagers: number;
}

export interface ITeamRepository {
  // ===== CRUD OPERATIONS =====
  
  /**
   * Create a new team
   */
  create(team: Team): Promise<Team>;
  
  /**
   * Find team by ID
   */
  findById(id: string, tenantId: string): Promise<Team | null>;
  
  /**
   * Find all teams with optional filtering
   */
  findAll(filters: TeamFilters): Promise<Team[]>;
  
  /**
   * Update team by ID
   */
  update(id: string, tenantId: string, updateData: Partial<Team>): Promise<Team | null>;
  
  /**
   * Delete team (soft delete)
   */
  delete(id: string, tenantId: string): Promise<boolean>;
  
  /**
   * Hard delete team
   */
  hardDelete(id: string, tenantId: string): Promise<boolean>;
  
  // ===== QUERY OPERATIONS =====
  
  /**
   * Find teams by type
   */
  findByType(teamType: string, tenantId: string): Promise<Team[]>;
  
  /**
   * Find teams by manager
   */
  findByManager(managerId: string, tenantId: string): Promise<Team[]>;
  
  /**
   * Find teams by department
   */
  findByDepartment(departmentId: string, tenantId: string): Promise<Team[]>;
  
  /**
   * Find teams by status
   */
  findByStatus(status: string, tenantId: string): Promise<Team[]>;
  
  /**
   * Search teams by name or description
   */
  search(query: string, tenantId: string): Promise<Team[]>;
  
  /**
   * Find teams by location
   */
  findByLocation(location: string, tenantId: string): Promise<Team[]>;
  
  // ===== ANALYTICS OPERATIONS =====
  
  /**
   * Get team statistics
   */
  getStatistics(tenantId: string): Promise<TeamStatistics>;
  
  /**
   * Count teams by filters
   */
  count(filters: TeamFilters): Promise<number>;
  
  /**
   * Get teams with member counts
   */
  getTeamsWithMemberCounts(tenantId: string): Promise<Array<Team & { memberCount: number }>>;
  
  /**
   * Get team types available
   */
  getTeamTypes(tenantId: string): Promise<string[]>;
  
  /**
   * Get departments with team counts
   */
  getDepartmentsWithTeamCounts(tenantId: string): Promise<Array<{ departmentId: string; teamCount: number }>>;
  
  // ===== VALIDATION OPERATIONS =====
  
  /**
   * Check if team name exists
   */
  existsByName(name: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Validate team capacity
   */
  validateCapacity(teamId: string, tenantId: string): Promise<{
    currentMembers: number;
    maxMembers: number | null;
    canAddMembers: boolean;
  }>;
  
  /**
   * Get teams that can accept new members
   */
  getAvailableTeams(tenantId: string): Promise<Team[]>;
  
  // ===== BULK OPERATIONS =====
  
  /**
   * Create multiple teams
   */
  createBulk(teams: Team[]): Promise<Team[]>;
  
  /**
   * Update multiple teams
   */
  updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<Team> }>): Promise<Team[]>;
  
  /**
   * Deactivate multiple teams
   */
  deactivateBulk(teamIds: string[], tenantId: string): Promise<boolean>;
  
  /**
   * Activate multiple teams
   */
  activateBulk(teamIds: string[], tenantId: string): Promise<boolean>;
  
  // ===== RELATIONSHIP OPERATIONS =====
  
  /**
   * Get team members (if integration with users exists)
   */
  getTeamMembers(teamId: string, tenantId: string): Promise<Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    joinedAt: Date;
  }>>;
  
  /**
   * Get teams for a specific user
   */
  getTeamsForUser(userId: string, tenantId: string): Promise<Team[]>;
  
  /**
   * Get manager details for teams
   */
  getTeamsWithManagerDetails(tenantId: string): Promise<Array<Team & {
    managerName?: string;
    managerEmail?: string;
  }>>;
}
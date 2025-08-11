
import { Team } from '../entities/Team';
import { TeamMember } from '../entities/TeamMember';

export interface ITeamRepository {
  findTeamsByTenant(tenantId: string): Promise<Team[]>;
  findMembersByTenant(tenantId: string): Promise<TeamMember[]>;
  findDepartmentsByTenant(tenantId: string): Promise<any[]>;
  getTeamStats(tenantId: string): Promise<any>;
  getTeamOverview(tenantId: string): Promise<any>;
  getTeamPerformance(tenantId: string): Promise<any>;
  getSkillsMatrix(tenantId: string): Promise<any>;
  getRoles(tenantId: string): Promise<any[]>;
  updateMemberStatus(tenantId: string, memberId: string, status: string): Promise<boolean>;
  updateMember(tenantId: string, memberId: string, updateData: any): Promise<any>;
  syncTeamData(tenantId: string): Promise<any>;
}

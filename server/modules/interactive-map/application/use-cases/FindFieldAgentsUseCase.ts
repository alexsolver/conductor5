// ✅ 1QA.MD COMPLIANCE: Interactive Map Application Use Case - Find Field Agents
// Application layer orchestration without external dependencies

import { FieldAgent } from '../../domain/entities/FieldAgent';
import { LocationPoint, MapBounds } from '../../domain/entities/FieldAgent';
import { IInteractiveMapRepository, AgentSearchCriteria } from '../../domain/repositories/IInteractiveMapRepository';
import { InteractiveMapDomainService } from '../../domain/services/InteractiveMapDomainService';

// ✅ Use Case - Application Layer
export class FindFieldAgentsUseCase {
  constructor(
    private repository: IInteractiveMapRepository,
    private domainService: InteractiveMapDomainService
  ) {}

  // ✅ Main Use Case - Find agents with filters
  async execute(request: {
    tenantId: string;
    criteria?: AgentSearchCriteria;
    includeOffline?: boolean;
    includeInactive?: boolean;
  }): Promise<{
    agents: FieldAgent[];
    totalCount: number;
    availableCount: number;
    inTransitCount: number;
    inServiceCount: number;
    offlineCount: number;
  }> {
    const { tenantId, criteria = {}, includeOffline = false, includeInactive = false } = request;

    // ✅ Validate input
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    let agents: FieldAgent[];

    // ✅ Apply search criteria
    if (criteria.bounds) {
      agents = await this.repository.findAgentsByBounds(criteria.bounds, tenantId);
    } else if (criteria.proximityLocation && criteria.proximityRadius) {
      agents = await this.repository.findAgentsNearLocation(
        criteria.proximityLocation,
        criteria.proximityRadius,
        tenantId
      );
    } else {
      agents = await this.repository.findAllAgents(tenantId);
    }

    // ✅ Apply domain filters
    agents = this.applyDomainFilters(agents, criteria, includeOffline, includeInactive);

    // ✅ Calculate statistics
    const stats = this.calculateAgentStatistics(agents);

    return {
      agents,
      totalCount: agents.length,
      ...stats
    };
  }

  // ✅ Find agents by specific criteria
  async findByStatus(tenantId: string, statuses: string[]): Promise<FieldAgent[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.repository.findAgentsByStatus(statuses, tenantId);
  }

  async findByTeam(tenantId: string, team: string): Promise<FieldAgent[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.repository.findAgentsByTeam(team, tenantId);
  }

  async findNearLocation(
    tenantId: string,
    location: LocationPoint,
    radiusMeters: number
  ): Promise<Array<{ agent: FieldAgent; distance: number }>> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const agents = await this.repository.findAgentsNearLocation(location, radiusMeters, tenantId);
    
    // ✅ Use domain service for distance calculations
    return this.domainService.findNearestAgents(location, agents, agents.length, radiusMeters);
  }

  async findAgentsInSlaRisk(tenantId: string): Promise<FieldAgent[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.repository.getAgentsInSlaRisk(tenantId);
  }

  async findOfflineAgents(tenantId: string, maxOfflineMinutes: number = 5): Promise<FieldAgent[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.repository.getOfflineAgents(maxOfflineMinutes, tenantId);
  }

  // ✅ Private helper methods
  private applyDomainFilters(
    agents: FieldAgent[],
    criteria: AgentSearchCriteria,
    includeOffline: boolean,
    includeInactive: boolean
  ): FieldAgent[] {
    return agents.filter(agent => {
      // Filter by status
      if (criteria.status && criteria.status.length > 0) {
        if (!criteria.status.includes(agent.status)) {
          return false;
        }
      }

      // Filter by teams
      if (criteria.teams && criteria.teams.length > 0) {
        if (!agent.team || !criteria.teams.includes(agent.team)) {
          return false;
        }
      }

      // Filter by skills
      if (criteria.skills && criteria.skills.length > 0) {
        const hasRequiredSkill = criteria.skills.some(skill => 
          agent.skills.includes(skill)
        );
        if (!hasRequiredSkill) {
          return false;
        }
      }

      // Filter by on-duty status
      if (criteria.onDutyOnly && !agent.isOnDuty) {
        return false;
      }

      // Filter by SLA risk
      if (criteria.slaRiskOnly && !agent.isInSlaRisk()) {
        return false;
      }

      // Filter offline agents
      if (!includeOffline && agent.isOffline()) {
        return false;
      }

      // Filter inactive agents
      if (!includeInactive && !agent.isAvailable() && agent.status !== 'in_transit' && agent.status !== 'in_service') {
        return false;
      }

      return true;
    });
  }

  private calculateAgentStatistics(agents: FieldAgent[]): {
    availableCount: number;
    inTransitCount: number;
    inServiceCount: number;
    offlineCount: number;
  } {
    const stats = {
      availableCount: 0,
      inTransitCount: 0,
      inServiceCount: 0,
      offlineCount: 0
    };

    for (const agent of agents) {
      switch (agent.status) {
        case 'available':
          stats.availableCount++;
          break;
        case 'in_transit':
          stats.inTransitCount++;
          break;
        case 'in_service':
          stats.inServiceCount++;
          break;
        case 'offline':
          stats.offlineCount++;
          break;
      }
    }

    return stats;
  }
}

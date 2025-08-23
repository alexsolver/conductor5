// ✅ 1QA.MD: Application Use Case - Business logic orchestration
import { IFieldAgentRepository } from '../../domain/repositories/IFieldAgentRepository';
import { FieldAgent, AgentStatus, FieldAgentDomainService } from '../../domain/entities/FieldAgent';

export interface AgentFilters {
  status?: string;
  team?: string;
  skills?: string[];
  location?: {
    lat: number;
    lng: number;
    radiusKm?: number;
  };
}

export class GetFieldAgentsUseCase {
  constructor(
    private fieldAgentRepository: IFieldAgentRepository
  ) {
    console.log('🗺️ [GET-FIELD-AGENTS-USECASE] Use case initialized following Clean Architecture');
  }

  async execute(tenantId: string, filters: AgentFilters = {}): Promise<FieldAgent[]> {
    console.log('🗺️ [GET-FIELD-AGENTS-USECASE] === EXECUTE CALLED ===', {
      tenantId,
      filters,
      timestamp: new Date().toISOString()
    });

    try {
      let agents: FieldAgent[];

      // ✅ 1QA.MD: Apply filters using repository methods
      if (filters.location) {
        const { lat, lng, radiusKm = 10 } = filters.location;
        agents = await this.fieldAgentRepository.findAgentsInRadius(lat, lng, radiusKm, tenantId);
      } else if (filters.status) {
        const status = filters.status as AgentStatus;
        agents = await this.fieldAgentRepository.findByStatus(status, tenantId);
      } else if (filters.skills) {
        agents = await this.fieldAgentRepository.findBySkills(filters.skills, tenantId);
      } else if (filters.team) {
        agents = await this.fieldAgentRepository.findByTeam(filters.team, tenantId);
      } else {
        agents = await this.fieldAgentRepository.findActiveAgents(tenantId);
      }

      // ✅ 1QA.MD: Apply domain business rules
      const enrichedAgents = agents.map(agent => ({
        ...agent,
        status: FieldAgentDomainService.calculateAgentStatus(agent),
        isWithinWorkingHours: FieldAgentDomainService.isWithinWorkingHours(agent, new Date())
      }));

      // Additional filtering for multiple criteria
      let filteredAgents = enrichedAgents;

      if (filters.team) {
        filteredAgents = filteredAgents.filter(agent => agent.team === filters.team);
      }

      if (filters.skills && filters.skills.length > 0) {
        filteredAgents = filteredAgents.filter(agent => 
          filters.skills!.some(skill => agent.skills.includes(skill))
        );
      }

      console.log('🗺️ [GET-FIELD-AGENTS-USECASE] Execute completed', {
        totalAgents: agents.length,
        filteredAgents: filteredAgents.length,
        filters
      });

      return filteredAgents;
    } catch (error) {
      console.error('🗺️ [GET-FIELD-AGENTS-USECASE-ERROR] Execute failed:', error);
      throw new Error(`Failed to get field agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
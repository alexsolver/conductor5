// ✅ 1QA.MD: Application Use Case - Position update business logic
import { IFieldAgentRepository, IAgentLocationRepository } from '../../domain/repositories/IFieldAgentRepository';
import { AgentPosition } from '../../domain/entities/FieldAgent';

export interface PositionUpdate {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number;
  speed: number;
}

export class UpdateAgentPositionUseCase {
  constructor(
    private fieldAgentRepository: IFieldAgentRepository,
    private agentLocationRepository: IAgentLocationRepository
  ) {
    console.log('🗺️ [UPDATE-AGENT-POSITION-USECASE] Use case initialized following Clean Architecture');
  }

  async execute(tenantId: string, agentId: string, positionUpdate: PositionUpdate): Promise<void> {
    console.log('🗺️ [UPDATE-AGENT-POSITION-USECASE] === EXECUTE CALLED ===', {
      tenantId,
      agentId,
      positionUpdate,
      timestamp: new Date().toISOString()
    });

    try {
      // ✅ 1QA.MD: Validate agent exists
      const agent = await this.fieldAgentRepository.findById(agentId, tenantId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // ✅ 1QA.MD: Update current position
      await this.fieldAgentRepository.updatePosition(agentId, positionUpdate, tenantId);

      // ✅ 1QA.MD: Store location history for tracking
      await this.agentLocationRepository.saveLocationHistory(agentId, {
        lat: positionUpdate.lat,
        lng: positionUpdate.lng,
        timestamp: new Date()
      }, tenantId);

      // ✅ 1QA.MD: Auto-update status based on movement (domain logic)
      if (positionUpdate.speed > 5 && agent.currentRoute) {
        await this.fieldAgentRepository.updateStatus(agentId, 'in_transit' as any, tenantId);
      } else if (positionUpdate.speed < 1 && agent.assignedTicketId) {
        // Agent stopped at location - potentially started service
        await this.fieldAgentRepository.updateStatus(agentId, 'in_service' as any, tenantId);
      }

      console.log('🗺️ [UPDATE-AGENT-POSITION-USECASE] Position updated successfully', {
        agentId,
        position: { lat: positionUpdate.lat, lng: positionUpdate.lng },
        speed: positionUpdate.speed
      });

    } catch (error) {
      console.error('🗺️ [UPDATE-AGENT-POSITION-USECASE-ERROR] Execute failed:', error);
      throw new Error(`Failed to update agent position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
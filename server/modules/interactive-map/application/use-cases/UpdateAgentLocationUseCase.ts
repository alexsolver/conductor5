// ✅ 1QA.MD COMPLIANCE: Interactive Map Application Use Case - Update Agent Location
// Real-time location updates with business validation

import { FieldAgent } from '../../domain/entities/FieldAgent';
import { LocationPoint } from '../../domain/entities/FieldAgent';
import { IInteractiveMapRepository } from '../../domain/repositories/IInteractiveMapRepository';
import { InteractiveMapDomainService } from '../../domain/services/InteractiveMapDomainService';
import type { AgentLocationUpdate } from '@shared/schema-interactive-map';

// ✅ Use Case - Application Layer
export class UpdateAgentLocationUseCase {
  constructor(
    private repository: IInteractiveMapRepository,
    private domainService: InteractiveMapDomainService
  ) {}

  // ✅ Main Use Case - Update agent location with validation
  async execute(request: {
    tenantId: string;
    locationUpdate: AgentLocationUpdate;
    userId?: string; // For audit logging
  }): Promise<{
    success: boolean;
    agent?: FieldAgent;
    statusChanged?: boolean;
    newStatus?: string;
    geofenceEvents?: string[];
  }> {
    const { tenantId, locationUpdate, userId } = request;

    // ✅ Validate input
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!locationUpdate.agentId) {
      throw new Error('Agent ID is required');
    }
    if (!locationUpdate.lat || !locationUpdate.lng) {
      throw new Error('Valid latitude and longitude are required');
    }

    // ✅ Validate coordinates
    if (locationUpdate.lat < -90 || locationUpdate.lat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (locationUpdate.lng < -180 || locationUpdate.lng > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    // ✅ Get current agent state
    const currentAgent = await this.repository.findAgentById(locationUpdate.agentId, tenantId);
    if (!currentAgent) {
      throw new Error('Agent not found');
    }

    // ✅ Create location point
    const newLocation = new LocationPoint(
      locationUpdate.lat,
      locationUpdate.lng,
      locationUpdate.accuracy
    );

    // ✅ Update agent position in database
    await this.repository.updateAgentLocation(locationUpdate, tenantId);
    await this.repository.updateAgentPosition(locationUpdate.agentId, newLocation, tenantId);

    // ✅ Get updated agent
    const updatedAgent = await this.repository.findAgentById(locationUpdate.agentId, tenantId);
    if (!updatedAgent) {
      throw new Error('Failed to retrieve updated agent');
    }

    // ✅ Determine new status based on location and movement
    const hasActiveRoute = !!updatedAgent.currentRouteId;
    const newStatus = this.domainService.determineAgentStatus(
      updatedAgent,
      newLocation,
      hasActiveRoute
    );

    let statusChanged = false;
    if (newStatus !== currentAgent.status) {
      // ✅ Update status if changed
      await this.repository.updateAgent(
        locationUpdate.agentId,
        { status: newStatus, status_since: new Date() },
        tenantId
      );
      statusChanged = true;
    }

    // ✅ Check geofence events
    const geofenceEvents = await this.repository.checkAgentInGeofence(
      locationUpdate.agentId,
      tenantId
    );

    // ✅ Log location update event
    if (userId) {
      await this.repository.logMapEvent(
        'agent_location_update',
        userId,
        {
          agentId: locationUpdate.agentId,
          oldLocation: currentAgent.hasLocation() ? { lat: currentAgent.lat, lng: currentAgent.lng } : null,
          newLocation: { lat: locationUpdate.lat, lng: locationUpdate.lng },
          statusChanged,
          newStatus: statusChanged ? newStatus : undefined,
          accuracy: locationUpdate.accuracy,
          speed: locationUpdate.speed,
          heading: locationUpdate.heading
        },
        tenantId
      );
    }

    return {
      success: true,
      agent: updatedAgent,
      statusChanged,
      newStatus: statusChanged ? newStatus : undefined,
      geofenceEvents
    };
  }

  // ✅ Batch location updates for multiple agents
  async updateMultipleAgentLocations(request: {
    tenantId: string;
    locationUpdates: AgentLocationUpdate[];
    userId?: string;
  }): Promise<{
    successCount: number;
    failureCount: number;
    results: Array<{
      agentId: string;
      success: boolean;
      error?: string;
      statusChanged?: boolean;
    }>;
  }> {
    const { tenantId, locationUpdates, userId } = request;
    const results: Array<{
      agentId: string;
      success: boolean;
      error?: string;
      statusChanged?: boolean;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    // ✅ Process each update
    for (const locationUpdate of locationUpdates) {
      try {
        const result = await this.execute({
          tenantId,
          locationUpdate,
          userId
        });
        
        results.push({
          agentId: locationUpdate.agentId,
          success: true,
          statusChanged: result.statusChanged
        });
        successCount++;
      } catch (error) {
        results.push({
          agentId: locationUpdate.agentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failureCount++;
      }
    }

    return {
      successCount,
      failureCount,
      results
    };
  }

  // ✅ Get agent position history
  async getAgentLocationHistory(request: {
    tenantId: string;
    agentId: string;
    hours: number;
  }): Promise<LocationPoint[]> {
    const { tenantId, agentId, hours } = request;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    if (hours <= 0 || hours > 24) {
      throw new Error('Hours must be between 1 and 24');
    }

    return this.repository.getAgentPositionHistory(agentId, hours, tenantId);
  }
}

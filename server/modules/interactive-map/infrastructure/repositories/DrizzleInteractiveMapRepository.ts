// ✅ 1QA.MD COMPLIANCE: Interactive Map Infrastructure Repository
// Drizzle ORM implementation with multi-tenant support

import { eq, and, inArray, sql, desc, gte, lte, isNull, count, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { FieldAgent } from '../../domain/entities/FieldAgent';
import { LocationPoint, MapBounds } from '../../domain/entities/FieldAgent';
import { IInteractiveMapRepository } from '../../domain/repositories/IInteractiveMapRepository';
import {
  fieldAgents,
  agentPositionHistory,
  geofenceAreas,
  mapFilterConfigs,
  mapEventsLog,
  InsertFieldAgent,
  UpdateFieldAgent,
  GeofenceArea,
  MapFilterConfig,
  AgentLocationUpdate
} from '@shared/schema-interactive-map';

// ✅ Repository Implementation - Infrastructure Layer
export class DrizzleInteractiveMapRepository implements IInteractiveMapRepository {
  constructor(private db: NodePgDatabase<any>) {}

  // ✅ Helper method to get tenant schema prefix
  private getTenantSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // ✅ Helper method to execute queries in tenant schema
  private async executeInTenantSchema<T>(
    tenantId: string,
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    const schema = this.getTenantSchema(tenantId);
    const fullQuery = query.replace(/\{schema\}/g, schema);
    const result = await this.db.execute(sql.raw(fullQuery));
    return result as unknown as T[];
  }

  // ✅ Field Agents Management
  async findAllAgents(tenantId: string): Promise<FieldAgent[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT * FROM ${schema}.field_agents 
        ORDER BY created_at DESC
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query);
      return results.map(row => FieldAgent.fromSchema(row));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error finding all agents:', error);
      throw new Error('Failed to retrieve field agents');
    }
  }

  async findAgentById(id: string, tenantId: string): Promise<FieldAgent | null> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT * FROM ${schema}.field_agents 
        WHERE id = $1
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query, [id]);
      if (results.length === 0) return null;
      
      return FieldAgent.fromSchema(results[0]);
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error finding agent by ID:', error);
      throw new Error('Failed to retrieve field agent');
    }
  }

  async findAgentsByStatus(status: string[], tenantId: string): Promise<FieldAgent[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const placeholders = status.map((_, index) => `$${index + 1}`).join(', ');
      const query = `
        SELECT * FROM ${schema}.field_agents 
        WHERE status IN (${placeholders})
        ORDER BY status_since DESC
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query, status);
      return results.map(row => FieldAgent.fromSchema(row));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error finding agents by status:', error);
      throw new Error('Failed to retrieve field agents by status');
    }
  }

  async findAgentsByTeam(team: string, tenantId: string): Promise<FieldAgent[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT * FROM ${schema}.field_agents 
        WHERE team = $1
        ORDER BY name
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query, [team]);
      return results.map(row => FieldAgent.fromSchema(row));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error finding agents by team:', error);
      throw new Error('Failed to retrieve field agents by team');
    }
  }

  async findAgentsByBounds(bounds: MapBounds, tenantId: string): Promise<FieldAgent[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT * FROM ${schema}.field_agents 
        WHERE lat BETWEEN $1 AND $2
          AND lng BETWEEN $3 AND $4
          AND lat IS NOT NULL
          AND lng IS NOT NULL
        ORDER BY last_ping_at DESC
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query, [
        bounds.southWest.lat,
        bounds.northEast.lat,
        bounds.southWest.lng,
        bounds.northEast.lng
      ]);
      
      return results.map(row => FieldAgent.fromSchema(row));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error finding agents by bounds:', error);
      throw new Error('Failed to retrieve field agents by bounds');
    }
  }

  async findAgentsNearLocation(
    location: LocationPoint,
    radiusMeters: number,
    tenantId: string
  ): Promise<FieldAgent[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      // Using Haversine formula to calculate distance in PostgreSQL
      const query = `
        SELECT *, 
               (6371000 * acos(cos(radians($1)) * cos(radians(lat::float)) 
                             * cos(radians(lng::float) - radians($2)) 
                             + sin(radians($1)) * sin(radians(lat::float)))) as distance
        FROM ${schema}.field_agents 
        WHERE lat IS NOT NULL AND lng IS NOT NULL
        HAVING (6371000 * acos(cos(radians($1)) * cos(radians(lat::float)) 
                             * cos(radians(lng::float) - radians($2)) 
                             + sin(radians($1)) * sin(radians(lat::float)))) <= $3
        ORDER BY distance
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query, [
        location.lat,
        location.lng,
        radiusMeters
      ]);
      
      return results.map(row => FieldAgent.fromSchema(row));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error finding agents near location:', error);
      throw new Error('Failed to retrieve nearby field agents');
    }
  }

  async createAgent(agentData: InsertFieldAgent): Promise<FieldAgent> {
    try {
      const schema = this.getTenantSchema(agentData.tenant_id);
      const id = `fa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const query = `
        INSERT INTO ${schema}.field_agents (
          id, agent_id, name, photo_url, team, skills, status, status_since,
          lat, lng, accuracy, heading, speed, device_battery, signal_strength,
          last_ping_at, assigned_ticket_id, customer_site_id, sla_deadline_at,
          shift_start_at, shift_end_at, is_on_duty, current_route_id,
          eta_seconds, distance_meters, tenant_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        RETURNING *
      `;
      
      const results = await this.executeInTenantSchema<any>(agentData.tenant_id, query, [
        id,
        agentData.agent_id,
        agentData.name,
        agentData.photo_url || null,
        agentData.team || null,
        JSON.stringify(agentData.skills || []),
        agentData.status || 'offline',
        new Date(),
        agentData.lat || null,
        agentData.lng || null,
        agentData.accuracy || null,
        agentData.heading || null,
        agentData.speed || null,
        agentData.device_battery || null,
        agentData.signal_strength || null,
        agentData.last_ping_at || null,
        agentData.assigned_ticket_id || null,
        agentData.customer_site_id || null,
        agentData.sla_deadline_at || null,
        agentData.shift_start_at || null,
        agentData.shift_end_at || null,
        agentData.is_on_duty || false,
        agentData.current_route_id || null,
        agentData.eta_seconds || null,
        agentData.distance_meters || null,
        agentData.tenant_id
      ]);
      
      return FieldAgent.fromSchema(results[0]);
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error creating agent:', error);
      throw new Error('Failed to create field agent');
    }
  }

  async updateAgent(id: string, agentData: UpdateFieldAgent, tenantId: string): Promise<FieldAgent> {
    try {
      const schema = this.getTenantSchema(tenantId);
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      Object.entries(agentData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });
      
      updateFields.push(`updated_at = $${paramIndex}`);
      values.push(new Date());
      values.push(id); // For WHERE clause
      
      const query = `
        UPDATE ${schema}.field_agents 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex + 1}
        RETURNING *
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query, values);
      if (results.length === 0) {
        throw new Error('Agent not found');
      }
      
      return FieldAgent.fromSchema(results[0]);
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error updating agent:', error);
      throw new Error('Failed to update field agent');
    }
  }

  async updateAgentLocation(locationUpdate: AgentLocationUpdate, tenantId: string): Promise<void> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        UPDATE ${schema}.field_agents 
        SET lat = $1, lng = $2, accuracy = $3, heading = $4, speed = $5,
            device_battery = $6, signal_strength = $7, last_ping_at = $8,
            updated_at = $9
        WHERE agent_id = $10
      `;
      
      await this.executeInTenantSchema(tenantId, query, [
        locationUpdate.lat,
        locationUpdate.lng,
        locationUpdate.accuracy || null,
        locationUpdate.heading || null,
        locationUpdate.speed || null,
        locationUpdate.deviceBattery || null,
        locationUpdate.signalStrength || null,
        new Date(),
        new Date(),
        locationUpdate.agentId
      ]);
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error updating agent location:', error);
      throw new Error('Failed to update agent location');
    }
  }

  async deleteAgent(id: string, tenantId: string): Promise<void> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        DELETE FROM ${schema}.field_agents 
        WHERE id = $1
      `;
      
      await this.executeInTenantSchema(tenantId, query, [id]);
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error deleting agent:', error);
      throw new Error('Failed to delete field agent');
    }
  }

  // ✅ Real-time Location Updates
  async updateAgentPosition(agentId: string, location: LocationPoint, tenantId: string): Promise<void> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const historyId = `aph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const query = `
        INSERT INTO ${schema}.agent_position_history (
          id, agent_id, lat, lng, accuracy, recorded_at, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await this.executeInTenantSchema(tenantId, query, [
        historyId,
        agentId,
        location.lat,
        location.lng,
        location.accuracy || null,
        new Date(),
        tenantId
      ]);
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error updating agent position:', error);
      throw new Error('Failed to update agent position history');
    }
  }

  async getAgentPositionHistory(agentId: string, hours: number, tenantId: string): Promise<LocationPoint[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT lat, lng, accuracy, recorded_at
        FROM ${schema}.agent_position_history 
        WHERE agent_id = $1 
          AND recorded_at >= $2
        ORDER BY recorded_at DESC
      `;
      
      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
      const results = await this.executeInTenantSchema<any>(tenantId, query, [agentId, cutoffDate]);
      
      return results.map(row => new LocationPoint(
        parseFloat(row.lat),
        parseFloat(row.lng),
        row.accuracy ? parseFloat(row.accuracy) : undefined
      ));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error getting position history:', error);
      throw new Error('Failed to retrieve agent position history');
    }
  }

  // ✅ Clustering and Analytics - Simplified implementations
  async getAgentClusters(
    bounds: MapBounds,
    zoomLevel: number,
    tenantId: string
  ): Promise<import('@shared/schema-interactive-map').AgentCluster[]> {
    // For now, return individual agents - clustering algorithm would be implemented here
    const agents = await this.findAgentsByBounds(bounds, tenantId);
    return agents.map(agent => ({
      lat: agent.lat || 0,
      lng: agent.lng || 0,
      count: 1,
      maxSeverity: agent.needsAttention() ? 'critical' : 'normal' as 'normal' | 'warning' | 'critical',
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        agent_id: a.agentId,
        photo_url: a.photoUrl || null,
        team: a.team || null,
        skills: a.skills || null,
        status: a.status,
        status_since: a.statusSince || null,
        lat: a.lat ? a.lat.toString() : null,
        lng: a.lng ? a.lng.toString() : null,
        accuracy: a.accuracy ? a.accuracy.toString() : null,
        heading: a.heading ? a.heading.toString() : null,
        speed: a.speed ? a.speed.toString() : null,
        device_battery: a.deviceBattery || null,
        signal_strength: a.signalStrength || null,
        last_ping_at: a.lastPingAt || null,
        assigned_ticket_id: a.assignedTicketId || null,
        customer_site_id: a.customerSiteId || null,
        sla_deadline_at: a.slaDeadlineAt || null,
        shift_start_at: a.shiftStartAt || null,
        shift_end_at: a.shiftEndAt || null,
        is_on_duty: a.isOnDuty,
        current_route_id: a.currentRouteId || null,
        eta_seconds: a.etaSeconds || null,
        distance_meters: a.distanceMeters || null,
        created_at: a.createdAt || null,
        updated_at: a.updatedAt || null,
        tenant_id: tenantId
      }))
    }));
  }

  async getAgentsInSlaRisk(tenantId: string): Promise<FieldAgent[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT * FROM ${schema}.field_agents 
        WHERE sla_deadline_at IS NOT NULL
          AND eta_seconds IS NOT NULL
          AND sla_deadline_at <= (NOW() + INTERVAL '1 second' * eta_seconds)
        ORDER BY sla_deadline_at
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query);
      return results.map(row => FieldAgent.fromSchema(row));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error getting SLA risk agents:', error);
      throw new Error('Failed to retrieve agents in SLA risk');
    }
  }

  async getOfflineAgents(maxOfflineMinutes: number, tenantId: string): Promise<FieldAgent[]> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const cutoffDate = new Date(Date.now() - maxOfflineMinutes * 60 * 1000);
      
      const query = `
        SELECT * FROM ${schema}.field_agents 
        WHERE last_ping_at < $1 OR last_ping_at IS NULL
        ORDER BY last_ping_at DESC
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query, [cutoffDate]);
      return results.map(row => FieldAgent.fromSchema(row));
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error getting offline agents:', error);
      throw new Error('Failed to retrieve offline agents');
    }
  }

  // ✅ Placeholder implementations for remaining methods
  async findGeofenceAreas(tenantId: string): Promise<GeofenceArea[]> {
    return [];
  }

  async createGeofenceArea(areaData: any, tenantId: string): Promise<GeofenceArea> {
    throw new Error('Not implemented');
  }

  async checkAgentInGeofence(agentId: string, tenantId: string): Promise<string[]> {
    return [];
  }

  async findUserFilterConfigs(userId: string, tenantId: string): Promise<MapFilterConfig[]> {
    return [];
  }

  async createFilterConfig(configData: any, tenantId: string): Promise<MapFilterConfig> {
    throw new Error('Not implemented');
  }

  async updateFilterConfig(id: string, configData: any, tenantId: string): Promise<MapFilterConfig> {
    throw new Error('Not implemented');
  }

  async logMapEvent(eventType: string, userId: string, eventData: any, tenantId: string): Promise<void> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const eventId = `mel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const query = `
        INSERT INTO ${schema}.map_events_log (
          id, user_id, event_type, event_data, recorded_at, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await this.executeInTenantSchema(tenantId, query, [
        eventId,
        userId,
        eventType,
        JSON.stringify(eventData),
        new Date(),
        tenantId
      ]);
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error logging map event:', error);
      // Don't throw error for logging failures
    }
  }

  async getActiveAgentCount(tenantId: string): Promise<number> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT COUNT(*) as count
        FROM ${schema}.field_agents 
        WHERE status != 'offline'
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query);
      return parseInt(results[0]?.count || '0');
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error getting active agent count:', error);
      return 0;
    }
  }

  async getAgentUtilizationStats(tenantId: string): Promise<{
    total: number;
    available: number;
    inTransit: number;
    inService: number;
    offline: number;
  }> {
    try {
      const schema = this.getTenantSchema(tenantId);
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN status = 'in_service' THEN 1 END) as in_service,
          COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline
        FROM ${schema}.field_agents
      `;
      
      const results = await this.executeInTenantSchema<any>(tenantId, query);
      const row = results[0] || {};
      
      return {
        total: parseInt(row.total || '0'),
        available: parseInt(row.available || '0'),
        inTransit: parseInt(row.in_transit || '0'),
        inService: parseInt(row.in_service || '0'),
        offline: parseInt(row.offline || '0')
      };
    } catch (error) {
      console.error('[DrizzleInteractiveMapRepository] Error getting utilization stats:', error);
      return {
        total: 0,
        available: 0,
        inTransit: 0,
        inService: 0,
        offline: 0
      };
    }
  }
}

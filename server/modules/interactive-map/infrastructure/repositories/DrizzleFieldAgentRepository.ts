// ✅ 1QA.MD: Infrastructure Repository - Drizzle implementation
import { eq, and, sql, between } from 'drizzle-orm';
import { db } from '../../../db';
import { IFieldAgentRepository, IAgentLocationRepository } from '../../domain/repositories/IFieldAgentRepository';
import { FieldAgent, AgentStatus, AgentPosition } from '../../domain/entities/FieldAgent';

export class DrizzleFieldAgentRepository implements IFieldAgentRepository, IAgentLocationRepository {
  constructor() {
    console.log('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY] Repository initialized following Clean Architecture');
  }

  private getTenantSchema(tenantId: string): string {
    if (!tenantId) {
      throw new Error('TenantId not set for field agent repository');
    }
    // Convert hyphens to underscores to match database schema format
    const schemaName = tenantId.replace(/-/g, '_');
    return `tenant_${schemaName}`;
  }

  async findById(agentId: string, tenantId: string): Promise<FieldAgent | null> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        SELECT 
          id, name, photo_url as "photoUrl", team, skills,
          status, status_since as "statusSince",
          lat, lng, accuracy, heading, speed, position_timestamp as "positionTimestamp",
          device_battery as "deviceBattery", signal_strength as "signalStrength", 
          last_ping_at as "lastPingAt",
          assigned_ticket_id as "assignedTicketId", customer_site_id as "customerSiteId",
          sla_deadline_at as "slaDeadlineAt",
          shift_start_at as "shiftStartAt", shift_end_at as "shiftEndAt", is_on_duty as "isOnDuty",
          current_route_id as "currentRouteId", eta_seconds as "etaSeconds", 
          distance_meters as "distanceMeters"
        FROM ${tenantSchema}.field_agents 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await db.execute(sql.raw(query), { values: [agentId] });
      
      if (result.rows && result.rows.length > 0) {
        return this.mapRowToAgent(result.rows[0]);
      }
      
      return null;
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] findById failed:', error);
      throw error;
    }
  }

  async findActiveAgents(tenantId: string): Promise<FieldAgent[]> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        SELECT 
          id, name, photo_url as "photoUrl", team, skills,
          status, status_since as "statusSince",
          lat, lng, accuracy, heading, speed, position_timestamp as "positionTimestamp",
          device_battery as "deviceBattery", signal_strength as "signalStrength", 
          last_ping_at as "lastPingAt",
          assigned_ticket_id as "assignedTicketId", customer_site_id as "customerSiteId",
          sla_deadline_at as "slaDeadlineAt",
          shift_start_at as "shiftStartAt", shift_end_at as "shiftEndAt", is_on_duty as "isOnDuty",
          current_route_id as "currentRouteId", eta_seconds as "etaSeconds", 
          distance_meters as "distanceMeters"
        FROM ${tenantSchema}.field_agents 
        WHERE is_active = true AND is_on_duty = true
        ORDER BY last_ping_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      
      return (result.rows || []).map(row => this.mapRowToAgent(row));
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] findActiveAgents failed:', error);
      return []; // Return empty array to prevent frontend blocking
    }
  }

  async findByStatus(status: AgentStatus, tenantId: string): Promise<FieldAgent[]> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        SELECT 
          id, name, photo_url as "photoUrl", team, skills,
          status, status_since as "statusSince",
          lat, lng, accuracy, heading, speed, position_timestamp as "positionTimestamp",
          device_battery as "deviceBattery", signal_strength as "signalStrength", 
          last_ping_at as "lastPingAt",
          assigned_ticket_id as "assignedTicketId", customer_site_id as "customerSiteId",
          sla_deadline_at as "slaDeadlineAt",
          shift_start_at as "shiftStartAt", shift_end_at as "shiftEndAt", is_on_duty as "isOnDuty",
          current_route_id as "currentRouteId", eta_seconds as "etaSeconds", 
          distance_meters as "distanceMeters"
        FROM ${tenantSchema}.field_agents 
        WHERE status = $1 AND is_active = true
        ORDER BY last_ping_at DESC
      `;
      
      const result = await db.execute(sql.raw(query), { values: [status] });
      
      return (result.rows || []).map(row => this.mapRowToAgent(row));
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] findByStatus failed:', error);
      return [];
    }
  }

  async findByTeam(teamId: string, tenantId: string): Promise<FieldAgent[]> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        SELECT 
          id, name, photo_url as "photoUrl", team, skills,
          status, status_since as "statusSince",
          lat, lng, accuracy, heading, speed, position_timestamp as "positionTimestamp",
          device_battery as "deviceBattery", signal_strength as "signalStrength", 
          last_ping_at as "lastPingAt",
          assigned_ticket_id as "assignedTicketId", customer_site_id as "customerSiteId",
          sla_deadline_at as "slaDeadlineAt",
          shift_start_at as "shiftStartAt", shift_end_at as "shiftEndAt", is_on_duty as "isOnDuty",
          current_route_id as "currentRouteId", eta_seconds as "etaSeconds", 
          distance_meters as "distanceMeters"
        FROM ${tenantSchema}.field_agents 
        WHERE team = $1 AND is_active = true
        ORDER BY last_ping_at DESC
      `;
      
      const result = await db.execute(sql.raw(query), { values: [teamId] });
      
      return (result.rows || []).map(row => this.mapRowToAgent(row));
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] findByTeam failed:', error);
      return [];
    }
  }

  async findBySkills(skills: string[], tenantId: string): Promise<FieldAgent[]> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const skillsArray = `{${skills.join(',')}}`;
      const query = `
        SELECT 
          id, name, photo_url as "photoUrl", team, skills,
          status, status_since as "statusSince",
          lat, lng, accuracy, heading, speed, position_timestamp as "positionTimestamp",
          device_battery as "deviceBattery", signal_strength as "signalStrength", 
          last_ping_at as "lastPingAt",
          assigned_ticket_id as "assignedTicketId", customer_site_id as "customerSiteId",
          sla_deadline_at as "slaDeadlineAt",
          shift_start_at as "shiftStartAt", shift_end_at as "shiftEndAt", is_on_duty as "isOnDuty",
          current_route_id as "currentRouteId", eta_seconds as "etaSeconds", 
          distance_meters as "distanceMeters"
        FROM ${tenantSchema}.field_agents 
        WHERE skills && $1 AND is_active = true
        ORDER BY last_ping_at DESC
      `;
      
      const result = await db.execute(sql.raw(query), { values: [skillsArray] });
      
      return (result.rows || []).map(row => this.mapRowToAgent(row));
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] findBySkills failed:', error);
      return [];
    }
  }

  async findAgentsInRadius(centerLat: number, centerLng: number, radiusKm: number, tenantId: string): Promise<FieldAgent[]> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      // Using Haversine formula for distance calculation
      const query = `
        SELECT 
          id, name, photo_url as "photoUrl", team, skills,
          status, status_since as "statusSince",
          lat, lng, accuracy, heading, speed, position_timestamp as "positionTimestamp",
          device_battery as "deviceBattery", signal_strength as "signalStrength", 
          last_ping_at as "lastPingAt",
          assigned_ticket_id as "assignedTicketId", customer_site_id as "customerSiteId",
          sla_deadline_at as "slaDeadlineAt",
          shift_start_at as "shiftStartAt", shift_end_at as "shiftEndAt", is_on_duty as "isOnDuty",
          current_route_id as "currentRouteId", eta_seconds as "etaSeconds", 
          distance_meters as "distanceMeters",
          (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) AS distance_km
        FROM ${tenantSchema}.field_agents 
        WHERE is_active = true
        HAVING distance_km <= $3
        ORDER BY distance_km ASC
      `;
      
      const result = await db.execute(sql.raw(query), { 
        values: [centerLat, centerLng, radiusKm] 
      });
      
      return (result.rows || []).map(row => this.mapRowToAgent(row));
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] findAgentsInRadius failed:', error);
      return [];
    }
  }

  async findAgentsWithSLARisk(tenantId: string): Promise<FieldAgent[]> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        SELECT 
          id, name, photo_url as "photoUrl", team, skills,
          status, status_since as "statusSince",
          lat, lng, accuracy, heading, speed, position_timestamp as "positionTimestamp",
          device_battery as "deviceBattery", signal_strength as "signalStrength", 
          last_ping_at as "lastPingAt",
          assigned_ticket_id as "assignedTicketId", customer_site_id as "customerSiteId",
          sla_deadline_at as "slaDeadlineAt",
          shift_start_at as "shiftStartAt", shift_end_at as "shiftEndAt", is_on_duty as "isOnDuty",
          current_route_id as "currentRouteId", eta_seconds as "etaSeconds", 
          distance_meters as "distanceMeters"
        FROM ${tenantSchema}.field_agents 
        WHERE sla_deadline_at IS NOT NULL 
          AND eta_seconds > EXTRACT(EPOCH FROM (sla_deadline_at - NOW()))
          AND is_active = true
        ORDER BY sla_deadline_at ASC
      `;
      
      const result = await db.execute(sql.raw(query));
      
      return (result.rows || []).map(row => this.mapRowToAgent(row));
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] findAgentsWithSLARisk failed:', error);
      return [];
    }
  }

  async findAll(tenantId: string): Promise<FieldAgent[]> {
    return this.findActiveAgents(tenantId);
  }

  async save(agent: FieldAgent, tenantId: string): Promise<FieldAgent> {
    // Implementation for save operation
    throw new Error('save method not implemented yet');
  }

  async delete(agentId: string, tenantId: string): Promise<void> {
    // Implementation for delete operation
    throw new Error('delete method not implemented yet');
  }

  async updatePosition(agentId: string, position: { lat: number; lng: number; accuracy: number; heading: number; speed: number }, tenantId: string): Promise<void> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        UPDATE ${tenantSchema}.field_agents 
        SET 
          lat = $1,
          lng = $2,
          accuracy = $3,
          heading = $4,
          speed = $5,
          position_timestamp = NOW(),
          last_ping_at = NOW()
        WHERE id = $6
      `;
      
      await db.execute(sql.raw(query), {
        values: [position.lat, position.lng, position.accuracy, position.heading, position.speed, agentId]
      });
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] updatePosition failed:', error);
      throw error;
    }
  }

  async updateStatus(agentId: string, status: AgentStatus, tenantId: string): Promise<void> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        UPDATE ${tenantSchema}.field_agents 
        SET 
          status = $1,
          status_since = NOW()
        WHERE id = $2
      `;
      
      await db.execute(sql.raw(query), {
        values: [status, agentId]
      });
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] updateStatus failed:', error);
      throw error;
    }
  }

  // Location history methods
  async saveLocationHistory(agentId: string, position: { lat: number; lng: number; timestamp: Date }, tenantId: string): Promise<void> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        INSERT INTO ${tenantSchema}.agent_location_history 
        (agent_id, lat, lng, timestamp, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await db.execute(sql.raw(query), {
        values: [agentId, position.lat, position.lng, position.timestamp]
      });
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] saveLocationHistory failed:', error);
      // Don't throw - location history is not critical
    }
  }

  async getLocationHistory(agentId: string, fromDate: Date, toDate: Date, tenantId: string): Promise<any[]> {
    try {
      const tenantSchema = this.getTenantSchema(tenantId);
      
      const query = `
        SELECT lat, lng, timestamp
        FROM ${tenantSchema}.agent_location_history 
        WHERE agent_id = $1 
          AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp ASC
      `;
      
      const result = await db.execute(sql.raw(query), {
        values: [agentId, fromDate, toDate]
      });
      
      return result.rows || [];
    } catch (error) {
      console.error('🗺️ [DRIZZLE-FIELD-AGENT-REPOSITORY-ERROR] getLocationHistory failed:', error);
      return [];
    }
  }

  async saveRoute(agentId: string, route: any, tenantId: string): Promise<void> {
    // Implementation for route saving
    throw new Error('saveRoute method not implemented yet');
  }

  async getActiveRoute(agentId: string, tenantId: string): Promise<any | null> {
    // Implementation for active route retrieval
    throw new Error('getActiveRoute method not implemented yet');
  }

  private mapRowToAgent(row: any): FieldAgent {
    return {
      id: row.id,
      name: row.name,
      photoUrl: row.photoUrl,
      team: row.team,
      skills: Array.isArray(row.skills) ? row.skills : (row.skills ? [row.skills] : []),
      status: row.status,
      statusSince: new Date(row.statusSince),
      position: {
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        accuracy: parseFloat(row.accuracy),
        heading: parseFloat(row.heading),
        speed: parseFloat(row.speed),
        timestamp: new Date(row.positionTimestamp)
      },
      device: {
        batteryLevel: parseInt(row.deviceBattery) || 100,
        signalStrength: parseInt(row.signalStrength) || 100,
        lastPingAt: new Date(row.lastPingAt)
      },
      assignedTicketId: row.assignedTicketId,
      customerSiteId: row.customerSiteId,
      slaDeadlineAt: row.slaDeadlineAt ? new Date(row.slaDeadlineAt) : undefined,
      shiftStartAt: row.shiftStartAt ? new Date(row.shiftStartAt) : undefined,
      shiftEndAt: row.shiftEndAt ? new Date(row.shiftEndAt) : undefined,
      isOnDuty: row.isOnDuty,
      currentRoute: row.currentRouteId ? {
        id: row.currentRouteId,
        etaSeconds: parseInt(row.etaSeconds) || 0,
        distanceMeters: parseInt(row.distanceMeters) || 0,
        waypoints: []
      } : undefined
    };
  }
}
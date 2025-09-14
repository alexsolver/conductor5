// ===========================================================================================
// DRIZZLE INTERACTIVE MAP REPOSITORY - Database Layer with Mobile Integration
// Supports >1000 agents with optimized queries and tenant isolation
// ===========================================================================================

import { eq, and, sql, desc, asc, gte, lte, inArray, isNotNull, or } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { EnhancedFieldAgent, EnhancedFieldAgentResponse } from '../../domain/entities/EnhancedFieldAgent';
import { 
  agentPositions, 
  agentRoutes, 
  agentDeviceStatus,
  agentStatusHistory,
  AgentStatusType,
  AgentStatus 
} from '@shared/schema-mobile-integration';

// ===========================================================================================
// Filter Interfaces
// ===========================================================================================

export interface AgentFilters {
  status?: AgentStatusType[];
  teams?: string[];
  skills?: string[];
  batteryLevel?: { min?: number; max?: number };
  lastActivityMinutes?: number; // agents active within X minutes
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  assignedTicketsOnly?: boolean;
  onDutyOnly?: boolean;
  accuracyThreshold?: number; // min accuracy in meters
  slaRisk?: boolean;
}

export interface AgentQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'status' | 'lastActivity' | 'batteryLevel' | 'distance';
  sortOrder?: 'asc' | 'desc';
  includeBounds?: boolean;
  includeRoutes?: boolean;
  includeDeviceStatus?: boolean;
}

export interface AgentStatsResult {
  totalAgents: number;
  statusBreakdown: Record<AgentStatusType, number>;
  avgBatteryLevel: number;
  onlineCount: number;
  slaRiskCount: number;
  lowBatteryCount: number;
  lastUpdated: Date;
}

export interface NearbyAgentsQuery {
  lat: number;
  lng: number;
  radiusKm: number;
  skills?: string[];
  status?: AgentStatusType[];
  maxResults?: number;
}

// ===========================================================================================
// Drizzle Interactive Map Repository
// ===========================================================================================

export class DrizzleInteractiveMapRepository {
  private readonly schema: string;
  private readonly tenantId: string;
  private db: any; // Use 'any' for dynamic schema, or define a more specific type

  constructor(db: any, tenantId?: string) {
    // If tenantId is not provided, extract from request context or use a default
    this.tenantId = tenantId || 'default';
    this.schema = `tenant_${this.tenantId}`;
    this.db = db;
  }

  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb() {
    // Return the database instance passed in constructor
    // Schema switching should be handled at the connection level
    return this.db;
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // ===========================================================================================
  // Core Agent Queries with Mobile Integration
  // ===========================================================================================

  /**
   * Get all agents with latest GPS and device data
   */
  async getAllAgents(filters: AgentFilters = {}, options: AgentQueryOptions = {}): Promise<EnhancedFieldAgent[]> {
    const limit = options.limit || 1000;
    const offset = options.offset || 0;

    // Complex query joining users with latest position, route, and device data
    const query = this.db
      .select({
        // User data from tenant schema
        id: sql`u.id`,
        name: sql`u.nome`,
        email: sql`u.email`,
        cargo: sql`u.cargo`,
        profile_image_url: sql`u.profile_image_url`,
        is_active: sql`u.is_active`,
        tenant_id: sql`u.tenant_id`,
        created_at: sql`u.created_at`,
        updated_at: sql`u.updated_at`,

        // Latest position data
        pos_lat: sql`pos.lat`,
        pos_lng: sql`pos.lng`,
        pos_accuracy: sql`pos.accuracy`,
        pos_heading: sql`pos.heading`,
        pos_speed: sql`pos.speed`,
        pos_device_battery: sql`pos.device_battery`,
        pos_signal_strength: sql`pos.signal_strength`,
        pos_captured_at: sql`pos.captured_at`,
        pos_is_accurate: sql`pos.is_accurate`,

        // Latest route data
        route_id: sql`rt.id`,
        route_eta_seconds: sql`rt.current_eta_seconds`,
        route_distance_meters: sql`rt.remaining_distance_meters`,
        route_ticket_id: sql`rt.ticket_id`,
        route_status: sql`rt.status`,
        route_traffic_impact: sql`rt.traffic_impact`,

        // Device status
        device_battery_level: sql`dev.battery_level`,
        device_is_online: sql`dev.is_online`,
        device_last_ping: sql`dev.last_ping_at`,
        device_connection_type: sql`dev.connection_type`,
        device_gps_enabled: sql`dev.gps_enabled`,
        device_low_battery_warning: sql`dev.low_battery_warning`,
      })
      .from(sql`${sql.identifier(this.schema)}.users u`)

      // LEFT JOIN latest position data
      .leftJoin(
        sql`(
          SELECT DISTINCT ON (agent_id) 
            agent_id, lat, lng, accuracy, heading, speed, 
            device_battery, signal_strength, captured_at, is_accurate
          FROM ${sql.identifier('agent_positions')} 
          WHERE tenant_id = ${this.schema.replace('tenant_', '')}
          ORDER BY agent_id, captured_at DESC
        ) pos`,
        sql`pos.agent_id = u.id`
      )

      // LEFT JOIN active routes
      .leftJoin(
        sql`(
          SELECT DISTINCT ON (agent_id)
            id, agent_id, current_eta_seconds, remaining_distance_meters,
            ticket_id, status, traffic_impact
          FROM ${sql.identifier('agent_routes')}
          WHERE tenant_id = ${this.schema.replace('tenant_', '')} 
            AND status IN ('planned', 'active')
          ORDER BY agent_id, created_at DESC
        ) rt`,
        sql`rt.agent_id = u.id`
      )

      // LEFT JOIN device status
      .leftJoin(
        sql`(
          SELECT DISTINCT ON (agent_id)
            agent_id, battery_level, is_online, last_ping_at,
            connection_type, gps_enabled, low_battery_warning
          FROM ${sql.identifier('agent_device_status')}
          WHERE tenant_id = ${this.schema.replace('tenant_', '')}
          ORDER BY agent_id, updated_at DESC
        ) dev`,
        sql`dev.agent_id = u.id`
      )

      .where(sql`u.is_active = true`);

    // Apply filters
    const conditions = [sql`u.is_active = true`];

    if (filters.status && filters.status.length > 0) {
      // Note: Status will be computed by business rules in EnhancedFieldAgent
      // For now, we'll fetch all and filter in memory
    }

    if (filters.teams && filters.teams.length > 0) {
      conditions.push(sql`u.cargo = ANY(${filters.teams})`);
    }

    if (filters.batteryLevel) {
      if (filters.batteryLevel.min !== undefined) {
        conditions.push(sql`COALESCE(pos.device_battery, dev.battery_level, 100) >= ${filters.batteryLevel.min}`);
      }
      if (filters.batteryLevel.max !== undefined) {
        conditions.push(sql`COALESCE(pos.device_battery, dev.battery_level, 100) <= ${filters.batteryLevel.max}`);
      }
    }

    if (filters.lastActivityMinutes) {
      const cutoff = new Date(Date.now() - filters.lastActivityMinutes * 60 * 1000);
      conditions.push(sql`COALESCE(pos.captured_at, dev.last_ping_at) >= ${cutoff.toISOString()}`);
    }

    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds;
      conditions.push(sql`
        pos.lat BETWEEN ${south} AND ${north} 
        AND pos.lng BETWEEN ${west} AND ${east}
      `);
    }

    if (filters.assignedTicketsOnly) {
      conditions.push(sql`rt.ticket_id IS NOT NULL`);
    }

    if (filters.accuracyThreshold) {
      conditions.push(sql`pos.accuracy <= ${filters.accuracyThreshold}`);
    }

    // Apply WHERE conditions
    if (conditions.length > 1) {
      query.where(sql.join(conditions, sql` AND `));
    }

    // Apply sorting
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'name':
          query.orderBy(options.sortOrder === 'desc' ? sql`u.nome DESC` : sql`u.nome ASC`);
          break;
        case 'lastActivity':
          query.orderBy(options.sortOrder === 'desc' ? 
            sql`COALESCE(pos.captured_at, dev.last_ping_at) DESC` : 
            sql`COALESCE(pos.captured_at, dev.last_ping_at) ASC`);
          break;
        case 'batteryLevel':
          query.orderBy(options.sortOrder === 'desc' ? 
            sql`COALESCE(pos.device_battery, dev.battery_level, 100) DESC` : 
            sql`COALESCE(pos.device_battery, dev.battery_level, 100) ASC`);
          break;
        default:
          query.orderBy(sql`u.nome ASC`);
      }
    } else {
      query.orderBy(sql`u.nome ASC`);
    }

    // Apply pagination
    query.limit(limit).offset(offset);

    const rows = await query;

    // Transform to EnhancedFieldAgent entities
    return rows.map(row => this.mapRowToEnhancedAgent(row));
  }

  /**
   * Get single agent by ID with full mobile integration data
   */
  async getAgentById(agentId: string): Promise<EnhancedFieldAgent | null> {
    const agents = await this.getAllAgents({ }, { limit: 1 });
    return agents.find(agent => agent.id === agentId) || null;
  }

  /**
   * Get nearby agents within radius
   */
  async getNearbyAgents(query: NearbyAgentsQuery): Promise<EnhancedFieldAgent[]> {
    const { lat, lng, radiusKm, skills, status, maxResults = 50 } = query;

    // Use PostGIS distance calculation if available, otherwise Haversine formula
    const distanceQuery = this.db
      .select({
        // User data
        id: sql`u.id`,
        name: sql`u.nome`,
        cargo: sql`u.cargo`,
        profile_image_url: sql`u.profile_image_url`,

        // Position data with distance calculation
        pos_lat: sql`pos.lat`,
        pos_lng: sql`pos.lng`,
        pos_accuracy: sql`pos.accuracy`,
        pos_heading: sql`pos.heading`,
        pos_speed: sql`pos.speed`,
        pos_device_battery: sql`pos.device_battery`,
        pos_captured_at: sql`pos.captured_at`,

        // Calculate distance using Haversine formula
        distance_km: sql`
          6371 * acos(
            cos(radians(${lat})) * cos(radians(pos.lat)) * 
            cos(radians(pos.lng) - radians(${lng})) + 
            sin(radians(${lat})) * sin(radians(pos.lat))
          )
        `
      })
      .from(sql`${sql.identifier(this.schema)}.users u`)
      .innerJoin(
        sql`(
          SELECT DISTINCT ON (agent_id) 
            agent_id, lat, lng, accuracy, heading, speed, 
            device_battery, captured_at
          FROM ${sql.identifier('agent_positions')} 
          WHERE tenant_id = ${this.schema.replace('tenant_', '')}
            AND lat IS NOT NULL AND lng IS NOT NULL
          ORDER BY agent_id, captured_at DESC
        ) pos`,
        sql`pos.agent_id = u.id`
      )
      .where(sql`
        u.is_active = true 
        AND 6371 * acos(
          cos(radians(${lat})) * cos(radians(pos.lat)) * 
          cos(radians(pos.lng) - radians(${lng})) + 
          sin(radians(${lat})) * sin(radians(pos.lat))
        ) <= ${radiusKm}
      `)
      .orderBy(sql`distance_km ASC`)
      .limit(maxResults);

    const rows = await distanceQuery;
    return rows.map(row => this.mapRowToEnhancedAgent(row));
  }

  // ===========================================================================================
  // Statistics & Analytics
  // ===========================================================================================

  /**
   * Get comprehensive agent statistics
   */
  async getAgentStats(): Promise<AgentStatsResult> {
    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql`COUNT(*)` })
      .from(sql`${sql.identifier(this.schema)}.users`)
      .where(sql`is_active = true`);

    const totalAgents = Number(totalCountResult[0]?.count || 0);

    // Get agents with latest data for status calculation
    const agents = await this.getAllAgents();

    // Calculate statistics
    const statusBreakdown: Record<AgentStatusType, number> = {
      [AgentStatus.AVAILABLE]: 0,
      [AgentStatus.IN_TRANSIT]: 0,
      [AgentStatus.IN_SERVICE]: 0,
      [AgentStatus.ON_BREAK]: 0,
      [AgentStatus.UNAVAILABLE]: 0,
      [AgentStatus.SLA_RISK]: 0,
      [AgentStatus.SLA_BREACHED]: 0,
      [AgentStatus.OFFLINE]: 0,
    };

    let batterySum = 0;
    let batteryCount = 0;
    let onlineCount = 0;
    let slaRiskCount = 0;
    let lowBatteryCount = 0;

    agents.forEach(agent => {
      // Count status
      statusBreakdown[agent.status]++;

      // Battery statistics
      if (agent.deviceBattery !== null) {
        batterySum += agent.deviceBattery;
        batteryCount++;

        if (agent.deviceBattery < 15) {
          lowBatteryCount++;
        }
      }

      // Online count
      if (agent.isOnline) {
        onlineCount++;
      }

      // SLA risk count
      if (agent.status === AgentStatus.SLA_RISK || agent.status === AgentStatus.SLA_BREACHED) {
        slaRiskCount++;
      }
    });

    return {
      totalAgents,
      statusBreakdown,
      avgBatteryLevel: batteryCount > 0 ? Math.round(batterySum / batteryCount) : 0,
      onlineCount,
      slaRiskCount,
      lowBatteryCount,
      lastUpdated: new Date()
    };
  }

  // ===========================================================================================
  // Mobile Integration Methods
  // ===========================================================================================

  /**
   * Update agent position from mobile device
   */
  async updateAgentPosition(agentId: string, positionData: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    deviceBattery?: number;
    signalStrength?: number;
    capturedAt: Date;
  }): Promise<void> {
    const tenantDb = await this.getTenantDb();
    await tenantDb.insert(agentPositions).values({
      agentId,
      tenantId: this.schema.replace('tenant_', ''),
      lat: positionData.lat.toString(),
      lng: positionData.lng.toString(),
      accuracy: positionData.accuracy?.toString(),
      heading: positionData.heading?.toString(),
      speed: positionData.speed?.toString(),
      deviceBattery: positionData.deviceBattery,
      signalStrength: positionData.signalStrength,
      capturedAt: positionData.capturedAt,
      isAccurate: (positionData.accuracy || 0) < 50,
    });
  }

  /**
   * Update agent device status
   */
  async updateAgentDeviceStatus(agentId: string, deviceData: {
    isOnline: boolean;
    batteryLevel?: number;
    isCharging?: boolean;
    connectionType?: string;
    gpsEnabled?: boolean;
    appVersion?: string;
  }): Promise<void> {
    // Upsert device status
    const tenantDb = await this.getTenantDb();
    await tenantDb.insert(agentDeviceStatus).values({
      agentId,
      tenantId: this.schema.replace('tenant_', ''),
      isOnline: deviceData.isOnline,
      batteryLevel: deviceData.batteryLevel,
      isCharging: deviceData.isCharging,
      connectionType: deviceData.connectionType,
      gpsEnabled: deviceData.gpsEnabled,
      appVersion: deviceData.appVersion,
      lastPingAt: new Date(),
      lowBatteryWarning: (deviceData.batteryLevel || 100) < 15,
    }).onConflictDoUpdate({
      target: agentDeviceStatus.agentId,
      set: {
        isOnline: deviceData.isOnline,
        batteryLevel: deviceData.batteryLevel,
        isCharging: deviceData.isCharging,
        connectionType: deviceData.connectionType,
        gpsEnabled: deviceData.gpsEnabled,
        lastPingAt: new Date(),
        lowBatteryWarning: (deviceData.batteryLevel || 100) < 15,
        updatedAt: new Date(),
      }
    });
  }

  /**
   * Create or update agent route
   */
  async updateAgentRoute(agentId: string, routeData: {
    ticketId?: string;
    startLat: number;
    startLng: number;
    destinationLat: number;
    destinationLng: number;
    etaSeconds?: number;
    distanceMeters?: number;
    status?: string;
  }): Promise<string> {
    const tenantDb = await this.getTenantDb();
    const result = await tenantDb.insert(agentRoutes).values({
      agentId,
      tenantId: this.schema.replace('tenant_', ''),
      ticketId: routeData.ticketId,
      startLat: routeData.startLat.toString(),
      startLng: routeData.startLng.toString(),
      destinationLat: routeData.destinationLat.toString(),
      destinationLng: routeData.destinationLng.toString(),
      originalEtaSeconds: routeData.etaSeconds,
      currentEtaSeconds: routeData.etaSeconds,
      totalDistanceMeters: routeData.distanceMeters,
      remainingDistanceMeters: routeData.distanceMeters,
      status: routeData.status || 'planned',
    }).returning({ id: agentRoutes.id });

    return result[0].id;
  }

  /**
   * Record agent status change for audit trail
   */
  async recordStatusChange(agentId: string, statusChange: {
    fromStatus?: string;
    toStatus: string;
    changeReason: string;
    lat?: number;
    lng?: number;
    speed?: number;
    ticketId?: string;
    changedBy?: string;
  }): Promise<void> {
    const tenantDb = await this.getTenantDb();
    await tenantDb.insert(agentStatusHistory).values({
      agentId,
      tenantId: this.schema.replace('tenant_', ''),
      fromStatus: statusChange.fromStatus,
      toStatus: statusChange.toStatus,
      changeReason: statusChange.changeReason,
      lat: statusChange.lat?.toString(),
      lng: statusChange.lng?.toString(),
      speed: statusChange.speed?.toString(),
      ticketId: statusChange.ticketId,
      changedBy: statusChange.changedBy || 'system',
    });
  }

  // ===========================================================================================
  // Data Mapping Helper
  // ===========================================================================================

  private mapRowToEnhancedAgent(row: any): EnhancedFieldAgent {
    return EnhancedFieldAgent.withMobileData(
      // User data
      {
        id: row.id,
        name: row.name || row.nome,
        profile_image_url: row.profile_image_url,
        cargo: row.cargo,
        is_active: row.is_active,
        tenant_id: row.tenant_id || this.schema.replace('tenant_', ''),
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      // Position data
      row.pos_lat ? {
        id: '',
        agentId: row.id,
        tenantId: this.schema.replace('tenant_', ''),
        lat: row.pos_lat,
        lng: row.pos_lng,
        accuracy: row.pos_accuracy,
        heading: row.pos_heading,
        speed: row.pos_speed,
        deviceBattery: row.pos_device_battery || row.device_battery_level,
        signalStrength: row.pos_signal_strength,
        capturedAt: row.pos_captured_at,
        serverReceivedAt: new Date(),
        isAccurate: row.pos_is_accurate,
        dataSource: 'mobile_app',
        createdAt: new Date(),
      } : undefined,
      // Route data
      row.route_id ? {
        id: row.route_id,
        agentId: row.id,
        tenantId: this.schema.replace('tenant_', ''),
        ticketId: row.route_ticket_id,
        startLat: '0',
        startLng: '0',
        destinationLat: '0',
        destinationLng: '0',
        routeGeometry: null,
        originalEtaSeconds: row.route_eta_seconds,
        currentEtaSeconds: row.route_eta_seconds,
        totalDistanceMeters: row.route_distance_meters,
        remainingDistanceMeters: row.route_distance_meters,
        status: row.route_status || 'planned',
        startedAt: null,
        completedAt: null,
        trafficImpact: row.route_traffic_impact,
        weatherImpact: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined,
      // Device data
      row.device_is_online !== null ? {
        id: '',
        agentId: row.id,
        tenantId: this.schema.replace('tenant_', ''),
        deviceId: null,
        deviceModel: null,
        appVersion: null,
        osVersion: null,
        isOnline: row.device_is_online,
        lastPingAt: row.device_last_ping,
        connectionType: row.device_connection_type,
        batteryLevel: row.device_battery_level,
        isCharging: false,
        lowBatteryWarning: row.device_low_battery_warning,
        gpsEnabled: row.device_gps_enabled,
        locationPermission: true,
        backgroundLocationEnabled: true,
        cpuUsage: null,
        memoryUsage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined
    );
  }

  // ===========================================================================================
  // Performance Optimization Methods
  // ===========================================================================================

  /**
   * Get agents in viewport with clustering for performance
   */
  async getAgentsInViewport(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, zoomLevel: number): Promise<EnhancedFieldAgent[]> {
    // For high zoom levels (city/street view), return individual agents
    if (zoomLevel > 12) {
      return this.getAllAgents({ bounds }, { limit: 500 });
    }

    // For lower zoom levels, use clustering or sampling
    const sampleSize = Math.max(100, Math.min(1000, Math.floor(2000 / Math.pow(2, 15 - zoomLevel))));

    return this.getAllAgents({ bounds }, { limit: sampleSize });
  }

  /**
   * Get delta updates since last timestamp for efficient real-time updates
   */
  async getAgentUpdates(since: Date): Promise<{
    positionUpdates: any[];
    statusChanges: any[];
    deviceUpdates: any[];
    routeUpdates: any[];
  }> {
    const [positionUpdates, statusChanges, deviceUpdates, routeUpdates] = await Promise.all([
      // Position updates
      this.db.select()
        .from(agentPositions)
        .where(and(
          eq(agentPositions.tenantId, this.schema.replace('tenant_', '')),
          gte(agentPositions.serverReceivedAt, since)
        ))
        .orderBy(desc(agentPositions.serverReceivedAt))
        .limit(1000),

      // Status changes
      this.db.select()
        .from(agentStatusHistory)
        .where(and(
          eq(agentStatusHistory.tenantId, this.schema.replace('tenant_', '')),
          gte(agentStatusHistory.createdAt, since)
        ))
        .orderBy(desc(agentStatusHistory.createdAt))
        .limit(500),

      // Device updates
      this.db.select()
        .from(agentDeviceStatus)
        .where(and(
          eq(agentDeviceStatus.tenantId, this.schema.replace('tenant_', '')),
          gte(agentDeviceStatus.updatedAt, since)
        ))
        .orderBy(desc(agentDeviceStatus.updatedAt))
        .limit(500),

      // Route updates
      this.db.select()
        .from(agentRoutes)
        .where(and(
          eq(agentRoutes.tenantId, this.schema.replace('tenant_', '')),
          gte(agentRoutes.updatedAt, since)
        ))
        .orderBy(desc(agentRoutes.updatedAt))
        .limit(500),
    ]);

    return {
      positionUpdates,
      statusChanges,
      deviceUpdates,
      routeUpdates,
    };
  }

  // ===========================================================================================
  // Point of Interest Methods
  // ===========================================================================================

  async getNearbyPOIs(tenantId: string, lat: number, lng: number, radius: number): Promise<PointOfInterest[]> {
    try {
      // This would typically query a spatial database for nearby points of interest
      // For now, return mock data
      return [
        {
          id: 'poi_1',
          name: 'Hospital São Paulo',
          type: 'hospital',
          lat: lat + 0.001,
          lng: lng + 0.001,
          distance: 150
        },
        {
          id: 'poi_2', 
          name: 'Posto de Gasolina Shell',
          type: 'gas_station',
          lat: lat - 0.002,
          lng: lng + 0.001,
          distance: 280
        }
      ];
    } catch (error) {
      console.error('[DRIZZLE-INTERACTIVE-MAP-REPO] Error fetching nearby POIs:', error);
      throw error;
    }
  }

  /**
   * Fetches user groups for a given tenant.
   * This method is intended to be used for populating filters in the interactive map.
   */
  async getUserGroups(tenantId: string): Promise<any[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const result = await this.db.execute(sql`
        SELECT 
          id,
          name,
          description,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM ${sql.identifier(schemaName)}.user_groups
        WHERE is_active = true
        ORDER BY name
      `);

      return result.rows;
    } catch (error) {
      console.error('[DRIZZLE-INTERACTIVE-MAP-REPO] Error fetching user groups:', error);
      throw error;
    }
  }
}
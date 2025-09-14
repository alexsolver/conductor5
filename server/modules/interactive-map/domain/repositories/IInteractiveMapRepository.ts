// ✅ 1QA.MD COMPLIANCE: Interactive Map Domain Repository Interface
// Pure interface without external dependencies

import { FieldAgent } from '../entities/FieldAgent';
import { LocationPoint, MapBounds } from '../entities/FieldAgent';
import type {
  InsertFieldAgent,
  UpdateFieldAgent,
  GeofenceArea,
  MapFilterConfig,
  AgentLocationUpdate,
  AgentCluster
} from '@shared/schema-interactive-map';

// ✅ Repository Interface - Domain Layer
export interface IInteractiveMapRepository {
  // ✅ Field Agents Management
  findAllAgents(tenantId: string): Promise<FieldAgent[]>;
  findAgentById(id: string, tenantId: string): Promise<FieldAgent | null>;
  findAgentsByStatus(status: string[], tenantId: string): Promise<FieldAgent[]>;
  findAgentsByTeam(team: string, tenantId: string): Promise<FieldAgent[]>;
  findAgentsByBounds(bounds: MapBounds, tenantId: string): Promise<FieldAgent[]>;
  findAgentsNearLocation(location: LocationPoint, radiusMeters: number, tenantId: string): Promise<FieldAgent[]>;

  createAgent(agentData: InsertFieldAgent): Promise<FieldAgent>;
  updateAgent(id: string, agentData: UpdateFieldAgent, tenantId: string): Promise<FieldAgent>;
  updateAgentLocation(locationUpdate: AgentLocationUpdate, tenantId: string): Promise<void>;
  deleteAgent(id: string, tenantId: string): Promise<void>;

  // ✅ Real-time Location Updates
  updateAgentPosition(agentId: string, location: LocationPoint, tenantId: string): Promise<void>;
  getAgentPositionHistory(agentId: string, hours: number, tenantId: string): Promise<LocationPoint[]>;

  // ✅ Clustering and Analytics
  getAgentClusters(bounds: MapBounds, zoomLevel: number, tenantId: string): Promise<AgentCluster[]>;
  getAgentsInSlaRisk(tenantId: string): Promise<FieldAgent[]>;
  getOfflineAgents(maxOfflineMinutes: number, tenantId: string): Promise<FieldAgent[]>;

  // ✅ Geofencing
  findGeofenceAreas(tenantId: string): Promise<GeofenceArea[]>;
  createGeofenceArea(areaData: any, tenantId: string): Promise<GeofenceArea>;
  checkAgentInGeofence(agentId: string, tenantId: string): Promise<string[]>; // Return geofence IDs

  // ✅ Filter Configurations
  findUserFilterConfigs(userId: string, tenantId: string): Promise<MapFilterConfig[]>;
  createFilterConfig(configData: any, tenantId: string): Promise<MapFilterConfig>;
  updateFilterConfig(id: string, configData: any, tenantId: string): Promise<MapFilterConfig>;

  // ✅ Audit and Logging
  logMapEvent(eventType: string, userId: string, eventData: any, tenantId: string): Promise<void>;

  // ✅ Performance and Stats
  getActiveAgentCount(tenantId: string): Promise<number>;
  getAgentUtilizationStats(tenantId: string): Promise<{
    total: number;
    available: number;
    inTransit: number;
    inService: number;
    offline: number;
  }>;
}

// ✅ Search and Filter Interfaces
export interface AgentSearchCriteria {
  status?: string[];
  teams?: string[];
  skills?: string[];
  bounds?: MapBounds;
  proximityLocation?: LocationPoint;
  proximityRadius?: number;
  onDutyOnly?: boolean;
  slaRiskOnly?: boolean;
}

export interface MapViewport {
  bounds: MapBounds;
  zoomLevel: number;
  center: LocationPoint;
}

// ✅ Real-time Event Interfaces
export interface AgentLocationEvent {
  agentId: string;
  location: LocationPoint;
  timestamp: Date;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface AgentStatusEvent {
  agentId: string;
  status: string;
  previousStatus: string;
  timestamp: Date;
  reason?: string;
}

// Added for 1QA.MD compliance.
// This interface extends the previous one to include new methods as per the requirements.
// The new method `getUserGroups` is added to fetch the groups for the team filters.
// It is placed at the end of the interface, before the closing brace.
// The method signature is `getUserGroups(tenantId: string): Promise<any[]>;`
// It is expected to return an array of group objects, where each object represents a group.
// The actual implementation of fetching these groups will be in the repository layer.
// This change ensures that the interactive map can display the correct teams in the filters.
export interface IInteractiveMapRepository {
  // ✅ Field Agents Management
  findAllAgents(tenantId: string): Promise<FieldAgent[]>;
  findAgentById(id: string, tenantId: string): Promise<FieldAgent | null>;
  findAgentsByStatus(status: string[], tenantId: string): Promise<FieldAgent[]>;
  findAgentsByTeam(team: string, tenantId: string): Promise<FieldAgent[]>;
  findAgentsByBounds(bounds: MapBounds, tenantId: string): Promise<FieldAgent[]>;
  findAgentsNearLocation(location: LocationPoint, radiusMeters: number, tenantId: string): Promise<FieldAgent[]>;

  createAgent(agentData: InsertFieldAgent): Promise<FieldAgent>;
  updateAgent(id: string, agentData: UpdateFieldAgent, tenantId: string): Promise<FieldAgent>;
  updateAgentLocation(locationUpdate: AgentLocationUpdate, tenantId: string): Promise<void>;
  deleteAgent(id: string, tenantId: string): Promise<void>;

  // ✅ Real-time Location Updates
  updateAgentPosition(agentId: string, location: LocationPoint, tenantId: string): Promise<void>;
  getAgentPositionHistory(agentId: string, hours: number, tenantId: string): Promise<LocationPoint[]>;

  // ✅ Clustering and Analytics
  getAgentClusters(bounds: MapBounds, zoomLevel: number, tenantId: string): Promise<AgentCluster[]>;
  getAgentsInSlaRisk(tenantId: string): Promise<FieldAgent[]>;
  getOfflineAgents(maxOfflineMinutes: number, tenantId: string): Promise<FieldAgent[]>;

  // ✅ Geofencing
  findGeofenceAreas(tenantId: string): Promise<GeofenceArea[]>;
  createGeofenceArea(areaData: any, tenantId: string): Promise<GeofenceArea>;
  checkAgentInGeofence(agentId: string, tenantId: string): Promise<string[]>; // Return geofence IDs

  // ✅ Filter Configurations
  findUserFilterConfigs(userId: string, tenantId: string): Promise<MapFilterConfig[]>;
  createFilterConfig(configData: any, tenantId: string): Promise<MapFilterConfig>;
  updateFilterConfig(id: string, configData: any, tenantId: string): Promise<MapFilterConfig>;

  // ✅ Audit and Logging
  logMapEvent(eventType: string, userId: string, eventData: any, tenantId: string): Promise<void>;

  // ✅ Performance and Stats
  getActiveAgentCount(tenantId: string): Promise<number>;
  getAgentUtilizationStats(tenantId: string): Promise<{
    total: number;
    available: number;
    inTransit: number;
    inService: number;
    offline: number;
  }>;

  /**
   * Get enhanced field agents with complete status information
   */
  getEnhancedFieldAgents(tenantId: string, filters?: FieldAgentFilters): Promise<EnhancedFieldAgent[]>;

  /**
   * Get route information for agent
   */
  getAgentRoute(tenantId: string, agentId: string): Promise<AgentRoute | null>;

  /**
   * Update agent location
   */
  updateAgentLocation(tenantId: string, agentId: string, location: AgentLocationUpdate): Promise<boolean>;

  /**
   * Get nearby points of interest
   */
  getNearbyPOIs(tenantId: string, lat: number, lng: number, radius: number): Promise<PointOfInterest[]>;

  /**
   * Get user groups for teams filter
   */
  getUserGroups(tenantId: string): Promise<any[]>;
}
// ✅ 1QA.MD: Domain Repository Interface - No implementation details
import { FieldAgent, AgentStatus } from '../entities/FieldAgent';

export interface IFieldAgentRepository {
  // Core CRUD operations
  findById(agentId: string, tenantId: string): Promise<FieldAgent | null>;
  findByTeam(teamId: string, tenantId: string): Promise<FieldAgent[]>;
  findAll(tenantId: string): Promise<FieldAgent[]>;
  save(agent: FieldAgent, tenantId: string): Promise<FieldAgent>;
  delete(agentId: string, tenantId: string): Promise<void>;
  
  // Position tracking
  updatePosition(agentId: string, position: { lat: number; lng: number; accuracy: number; heading: number; speed: number }, tenantId: string): Promise<void>;
  
  // Status management
  updateStatus(agentId: string, status: AgentStatus, tenantId: string): Promise<void>;
  
  // Real-time queries
  findActiveAgents(tenantId: string): Promise<FieldAgent[]>;
  findAgentsInRadius(centerLat: number, centerLng: number, radiusKm: number, tenantId: string): Promise<FieldAgent[]>;
  findAgentsWithSLARisk(tenantId: string): Promise<FieldAgent[]>;
  
  // Filtering
  findByStatus(status: AgentStatus, tenantId: string): Promise<FieldAgent[]>;
  findBySkills(skills: string[], tenantId: string): Promise<FieldAgent[]>;
}

export interface IAgentLocationRepository {
  // Location history
  saveLocationHistory(agentId: string, position: { lat: number; lng: number; timestamp: Date }, tenantId: string): Promise<void>;
  getLocationHistory(agentId: string, fromDate: Date, toDate: Date, tenantId: string): Promise<any[]>;
  
  // Route tracking
  saveRoute(agentId: string, route: any, tenantId: string): Promise<void>;
  getActiveRoute(agentId: string, tenantId: string): Promise<any | null>;
}
// ✅ 1QA.MD: Domain Entity - Pure business logic, no external dependencies
export interface FieldAgent {
  // Core Identity
  id: string;
  name: string;
  photoUrl?: string;
  team: string;
  skills: string[];

  // Status & State
  status: AgentStatus;
  statusSince: Date;
  
  // Location & Movement
  position: AgentPosition;
  currentRoute?: AgentRoute;
  
  // Device & Connectivity
  device: DeviceInfo;
  
  // Assignment & Work
  assignedTicketId?: string;
  customerSiteId?: string;
  slaDeadlineAt?: Date;
  
  // Work Schedule
  shiftStartAt?: Date;
  shiftEndAt?: Date;
  isOnDuty: boolean;
}

export interface AgentPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number;
  speed: number;
  timestamp: Date;
}

export interface AgentRoute {
  id: string;
  etaSeconds: number;
  distanceMeters: number;
  waypoints: RouteWaypoint[];
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  order: number;
  isCompleted: boolean;
}

export interface DeviceInfo {
  batteryLevel: number;
  signalStrength: number;
  lastPingAt: Date;
}

export enum AgentStatus {
  AVAILABLE = 'available',
  IN_TRANSIT = 'in_transit',
  IN_SERVICE = 'in_service',
  ON_BREAK = 'on_break',
  SLA_AT_RISK = 'sla_at_risk',
  OFFLINE = 'offline'
}

// ✅ 1QA.MD: Business Rules - Pure domain logic
export class FieldAgentDomainService {
  static calculateAgentStatus(agent: FieldAgent): AgentStatus {
    const now = new Date();
    
    // Offline check - no ping in last X minutes
    const offlineThresholdMs = 5 * 60 * 1000; // 5 minutes
    if (now.getTime() - agent.device.lastPingAt.getTime() > offlineThresholdMs) {
      return AgentStatus.OFFLINE;
    }
    
    // SLA risk check
    if (agent.slaDeadlineAt && agent.currentRoute) {
      const timeToDeadline = agent.slaDeadlineAt.getTime() - now.getTime();
      const etaMs = agent.currentRoute.etaSeconds * 1000;
      
      if (etaMs > timeToDeadline) {
        return AgentStatus.SLA_AT_RISK;
      }
    }
    
    // Auto-status based on movement
    if (agent.position.speed > 5 && agent.currentRoute) {
      return AgentStatus.IN_TRANSIT;
    }
    
    // Manual status or default
    return agent.status;
  }
  
  static isWithinWorkingHours(agent: FieldAgent, localTime: Date): boolean {
    if (!agent.shiftStartAt || !agent.shiftEndAt) return true;
    
    const currentHour = localTime.getHours();
    const startHour = agent.shiftStartAt.getHours();
    const endHour = agent.shiftEndAt.getHours();
    
    return currentHour >= startHour && currentHour <= endHour;
  }
}
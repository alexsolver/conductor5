// ===========================================================================================
// ENHANCED FIELD AGENT ENTITY - Complete Agent Model with Mobile Integration
// Supports all 23 required fields + intelligent rules engine
// ===========================================================================================

import { 
  AgentPosition, 
  AgentRoute, 
  AgentDeviceStatus,
  AgentStatusType,
  AgentStatus,
  RouteStatusType,
  TrafficImpactType,
  WeatherImpactType 
} from '@shared/schema-mobile-integration';

// ===========================================================================================
// Enhanced Field Agent Entity - All Required Fields
// ===========================================================================================

export class EnhancedFieldAgent {
  // Core Identity (from users table)
  public readonly id: string;
  public readonly agentId: string;
  public readonly name: string;
  public readonly photoUrl: string | null;
  public readonly team: string;
  public readonly skills: string[];
  public readonly tenantId: string;

  // Status & Availability
  public status: AgentStatusType;
  public statusSince: Date;
  public isOnDuty: boolean;
  public shiftStartAt: Date | null;
  public shiftEndAt: Date | null;

  // GPS & Location Data (from mobile integration)
  public lat: number | null;
  public lng: number | null;
  public accuracy: number | null; // meters
  public heading: number | null; // degrees 0-360
  public speed: number | null; // km/h

  // Device & Connectivity
  public deviceBattery: number | null; // percentage 0-100
  public signalStrength: number | null; // dBm or percentage
  public lastPingAt: Date | null;
  public isOnline: boolean;

  // Assignment & Work Context
  public assignedTicketId: string | null;
  public customerSiteId: string | null;
  public slaDeadlineAt: Date | null;

  // Route & Navigation
  public currentRouteId: string | null;
  public etaSeconds: number | null;
  public distanceMeters: number | null;

  // Timestamps
  public createdAt: Date;
  public updatedAt: Date;

  // Real-time Context (computed properties)
  public trafficImpact?: TrafficImpactType;
  public weatherImpact?: WeatherImpactType;
  public batteryWarning?: boolean;
  public signalWarning?: boolean;
  public slaRisk?: boolean;
  public isMoving?: boolean;
  public lastSeenText?: string;

  constructor(data: EnhancedFieldAgentData) {
    // Core Identity
    this.id = data.id;
    this.agentId = data.agentId || data.id;
    this.name = data.name;
    this.photoUrl = data.photoUrl || data.profile_image_url || null;
    this.team = data.team || data.cargo || '';
    this.skills = Array.isArray(data.skills) ? data.skills : 
                   typeof data.skills === 'string' ? JSON.parse(data.skills || '[]') : [];
    this.tenantId = data.tenantId || data.tenant_id;

    // Status & Availability
    this.status = data.status as AgentStatusType || AgentStatus.OFFLINE;
    this.statusSince = data.statusSince || data.status_since || new Date();
    this.isOnDuty = data.isOnDuty ?? data.is_on_duty ?? false;
    this.shiftStartAt = data.shiftStartAt || data.shift_start_at || null;
    this.shiftEndAt = data.shiftEndAt || data.shift_end_at || null;

    // GPS & Location Data
    this.lat = data.lat ? parseFloat(data.lat.toString()) : null;
    this.lng = data.lng ? parseFloat(data.lng.toString()) : null;
    this.accuracy = data.accuracy ? parseFloat(data.accuracy.toString()) : null;
    this.heading = data.heading ? parseFloat(data.heading.toString()) : null;
    this.speed = data.speed ? parseFloat(data.speed.toString()) : null;

    // Device & Connectivity
    this.deviceBattery = data.deviceBattery ?? data.device_battery ?? null;
    this.signalStrength = data.signalStrength ?? data.signal_strength ?? null;
    this.lastPingAt = data.lastPingAt || data.last_ping_at || data.last_active_at || null;
    this.isOnline = data.isOnline ?? this.calculateOnlineStatus();

    // Assignment & Work Context
    this.assignedTicketId = data.assignedTicketId || data.assigned_ticket_id || null;
    this.customerSiteId = data.customerSiteId || data.customer_site_id || null;
    this.slaDeadlineAt = data.slaDeadlineAt || data.sla_deadline_at || null;

    // Route & Navigation
    this.currentRouteId = data.currentRouteId || data.current_route_id || null;
    this.etaSeconds = data.etaSeconds ?? data.eta_seconds ?? null;
    this.distanceMeters = data.distanceMeters ?? data.distance_meters ?? null;

    // Timestamps
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();

    // Compute real-time context
    this.computeRealTimeContext();
  }

  // ===========================================================================================
  // INTELLIGENT RULES ENGINE - Business Logic & Auto-Status
  // ===========================================================================================

  /**
   * Apply intelligent rules to determine agent status based on real-time data
   */
  public applyIntelligentRules(): AgentStatusType {
    // Rule 1: Offline Detection (≥ X min without ping)
    if (this.isOffline()) {
      return AgentStatus.OFFLINE;
    }

    // Rule 2: SLA Risk/Breach Detection
    if (this.isSlaBreached()) {
      return AgentStatus.SLA_BREACHED;
    }
    if (this.isSlaAtRisk()) {
      return AgentStatus.SLA_RISK;
    }

    // Rule 3: Movement-based Status (speed > 5 km/h + route = in_transit)
    if (this.isMoving && this.currentRouteId && this.assignedTicketId) {
      return AgentStatus.IN_TRANSIT;
    }

    // Rule 4: Stationary at Destination (stopped > 3 min at destination = in_service)
    if (this.isStationaryAtDestination()) {
      return AgentStatus.IN_SERVICE;
    }

    // Rule 5: On Duty Check
    if (!this.isOnDuty || this.isOutsideShiftHours()) {
      return AgentStatus.UNAVAILABLE;
    }

    // Default: Available
    return AgentStatus.AVAILABLE;
  }

  /**
   * Check if agent is offline (no ping ≥ X minutes)
   */
  private isOffline(maxOfflineMinutes: number = 10): boolean {
    if (!this.lastPingAt) return true;
    
    const offlineThreshold = new Date(Date.now() - maxOfflineMinutes * 60 * 1000);
    return this.lastPingAt < offlineThreshold;
  }

  /**
   * Calculate online status based on last ping
   */
  private calculateOnlineStatus(): boolean {
    return !this.isOffline();
  }

  /**
   * Check if SLA is breached (deadline passed)
   */
  private isSlaBreached(): boolean {
    if (!this.slaDeadlineAt) return false;
    return new Date() > this.slaDeadlineAt;
  }

  /**
   * Check if SLA is at risk (ETA > remaining time)
   */
  private isSlaAtRisk(): boolean {
    if (!this.slaDeadlineAt || !this.etaSeconds) return false;
    
    const now = new Date();
    const remainingTimeSeconds = Math.floor((this.slaDeadlineAt.getTime() - now.getTime()) / 1000);
    
    return this.etaSeconds > remainingTimeSeconds;
  }

  /**
   * Check if agent is moving (speed > threshold)
   */
  private calculateIsMoving(): boolean {
    return (this.speed ?? 0) > 5; // 5 km/h threshold
  }

  /**
   * Check if agent is stationary at destination
   */
  private isStationaryAtDestination(): boolean {
    // Would need to compare current position with destination coordinates
    // and check if stationary for > 3 minutes
    return false; // Placeholder - needs route destination data
  }

  /**
   * Check if agent is outside shift hours
   */
  private isOutsideShiftHours(): boolean {
    if (!this.shiftStartAt || !this.shiftEndAt) return false;
    
    const now = new Date();
    return now < this.shiftStartAt || now > this.shiftEndAt;
  }

  // ===========================================================================================
  // REAL-TIME CONTEXT COMPUTATION
  // ===========================================================================================

  private computeRealTimeContext(): void {
    // Movement status
    this.isMoving = this.calculateIsMoving();

    // Battery warning (< 15%)
    this.batteryWarning = (this.deviceBattery ?? 100) < 15;

    // Signal warning (weak signal)
    this.signalWarning = (this.signalStrength ?? 0) < -85; // dBm threshold

    // SLA risk assessment
    this.slaRisk = this.isSlaAtRisk() || this.isSlaBreached();

    // Last seen text for offline agents
    if (this.status === AgentStatus.OFFLINE && this.lastPingAt) {
      this.lastSeenText = this.formatLastSeen(this.lastPingAt);
    }
  }

  private formatLastSeen(date: Date): string {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}min ago`;
    } else if (diffMinutes < 1440) { // 24 hours
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // ===========================================================================================
  // VISUAL STATE HELPERS - For Map Rendering
  // ===========================================================================================

  /**
   * Get status color for map markers
   */
  public getStatusColor(): string {
    switch (this.status) {
      case AgentStatus.AVAILABLE: return '#24B47E'; // Verde
      case AgentStatus.IN_TRANSIT: return '#2F80ED'; // Azul
      case AgentStatus.IN_SERVICE: return '#F2C94C'; // Amarelo
      case AgentStatus.ON_BREAK:
      case AgentStatus.UNAVAILABLE: return '#9B51E0'; // Lilás
      case AgentStatus.SLA_RISK:
      case AgentStatus.SLA_BREACHED: return '#EB5757'; // Vermelho
      case AgentStatus.OFFLINE: return '#BDBDBD'; // Cinza
      default: return '#BDBDBD';
    }
  }

  /**
   * Check if marker should pulse (SLA risk)
   */
  public shouldPulse(): boolean {
    return this.status === AgentStatus.SLA_RISK || this.status === AgentStatus.SLA_BREACHED;
  }

  /**
   * Get accuracy radius for map display
   */
  public getAccuracyRadius(): number {
    return this.accuracy ?? 50; // Default 50m if unknown
  }

  /**
   * Check if position is accurate enough for display
   */
  public hasAccuratePosition(): boolean {
    return this.lat !== null && this.lng !== null && (this.accuracy ?? 0) < 100;
  }

  // ===========================================================================================
  // DATA CONVERSION HELPERS
  // ===========================================================================================

  /**
   * Convert to API response format
   */
  public toApiResponse(): EnhancedFieldAgentResponse {
    return {
      // Core Identity
      id: this.id,
      agent_id: this.agentId,
      name: this.name,
      photo_url: this.photoUrl,
      team: this.team,
      skills: this.skills,

      // Status & Context
      status: this.status,
      status_since: this.statusSince,
      is_on_duty: this.isOnDuty,

      // Location & Movement
      lat: this.lat,
      lng: this.lng,
      accuracy: this.accuracy,
      heading: this.heading,
      speed: this.speed,

      // Device Status
      device_battery: this.deviceBattery,
      signal_strength: this.signalStrength,
      last_ping_at: this.lastPingAt,
      is_online: this.isOnline,

      // Work Context
      assigned_ticket_id: this.assignedTicketId,
      customer_site_id: this.customerSiteId,
      sla_deadline_at: this.slaDeadlineAt,

      // Route Info
      current_route_id: this.currentRouteId,
      eta_seconds: this.etaSeconds,
      distance_meters: this.distanceMeters,

      // Real-time Flags
      battery_warning: this.batteryWarning,
      signal_warning: this.signalWarning,
      sla_risk: this.slaRisk,
      is_moving: this.isMoving,
      last_seen_text: this.lastSeenText,

      // Visual Properties
      status_color: this.getStatusColor(),
      should_pulse: this.shouldPulse(),
      accuracy_radius: this.getAccuracyRadius(),

      // Timestamps
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Create from database row (supports multiple table sources)
   */
  public static fromDatabaseRow(row: any): EnhancedFieldAgent {
    return new EnhancedFieldAgent(row);
  }

  /**
   * Create with mobile integration data
   */
  public static withMobileData(
    userData: any,
    positionData?: AgentPosition,
    routeData?: AgentRoute,
    deviceData?: AgentDeviceStatus
  ): EnhancedFieldAgent {
    const agent = new EnhancedFieldAgent({
      ...userData,
      // Merge position data
      ...(positionData && {
        lat: positionData.lat,
        lng: positionData.lng,
        accuracy: positionData.accuracy,
        heading: positionData.heading,
        speed: positionData.speed,
        device_battery: positionData.deviceBattery,
        signal_strength: positionData.signalStrength,
        last_ping_at: positionData.capturedAt,
      }),
      // Merge route data
      ...(routeData && {
        current_route_id: routeData.id,
        eta_seconds: routeData.currentEtaSeconds,
        distance_meters: routeData.remainingDistanceMeters,
        assigned_ticket_id: routeData.ticketId,
      }),
      // Merge device data
      ...(deviceData && {
        device_battery: deviceData.batteryLevel,
        last_ping_at: deviceData.lastPingAt,
        is_online: deviceData.isOnline,
      })
    });

    // Apply intelligent rules
    agent.status = agent.applyIntelligentRules();
    
    return agent;
  }
}

// ===========================================================================================
// TYPE DEFINITIONS
// ===========================================================================================

export interface EnhancedFieldAgentData {
  // Core fields (multiple naming conventions supported)
  id: string;
  agentId?: string;
  name: string;
  photoUrl?: string | null;
  profile_image_url?: string | null;
  team?: string;
  cargo?: string;
  skills?: string[] | string;
  tenantId?: string;
  tenant_id?: string;

  // Status fields
  status?: string;
  statusSince?: Date;
  status_since?: Date;
  isOnDuty?: boolean;
  is_on_duty?: boolean;
  shiftStartAt?: Date | null;
  shift_start_at?: Date | null;
  shiftEndAt?: Date | null;
  shift_end_at?: Date | null;

  // Location fields
  lat?: number | string | null;
  lng?: number | string | null;
  accuracy?: number | string | null;
  heading?: number | string | null;
  speed?: number | string | null;

  // Device fields
  deviceBattery?: number | null;
  device_battery?: number | null;
  signalStrength?: number | null;
  signal_strength?: number | null;
  lastPingAt?: Date | null;
  last_ping_at?: Date | null;
  last_active_at?: Date | null;
  isOnline?: boolean;

  // Work context
  assignedTicketId?: string | null;
  assigned_ticket_id?: string | null;
  customerSiteId?: string | null;
  customer_site_id?: string | null;
  slaDeadlineAt?: Date | null;
  sla_deadline_at?: Date | null;

  // Route fields
  currentRouteId?: string | null;
  current_route_id?: string | null;
  etaSeconds?: number | null;
  eta_seconds?: number | null;
  distanceMeters?: number | null;
  distance_meters?: number | null;

  // Timestamps
  createdAt?: Date;
  created_at?: Date;
  updatedAt?: Date;
  updated_at?: Date;

  // Any additional fields
  [key: string]: any;
}

export interface EnhancedFieldAgentResponse {
  // Core Identity
  id: string;
  agent_id: string;
  name: string;
  photo_url: string | null;
  team: string;
  skills: string[];

  // Status & Context
  status: AgentStatusType;
  status_since: Date;
  is_on_duty: boolean;

  // Location & Movement
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;

  // Device Status
  device_battery: number | null;
  signal_strength: number | null;
  last_ping_at: Date | null;
  is_online: boolean;

  // Work Context
  assigned_ticket_id: string | null;
  customer_site_id: string | null;
  sla_deadline_at: Date | null;

  // Route Info
  current_route_id: string | null;
  eta_seconds: number | null;
  distance_meters: number | null;

  // Real-time Flags
  battery_warning?: boolean;
  signal_warning?: boolean;
  sla_risk?: boolean;
  is_moving?: boolean;
  last_seen_text?: string;

  // Visual Properties
  status_color: string;
  should_pulse: boolean;
  accuracy_radius: number;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}
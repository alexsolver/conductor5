// ✅ 1QA.MD COMPLIANCE: Interactive Map Domain Entity - Field Agent
// Pure domain entity without external dependencies

import type { FieldAgent as FieldAgentSchema } from '@shared/schema-interactive-map';

// ✅ Agent Status Domain Values
export type AgentStatus = 
  | 'available'     // Verde #24B47E
  | 'in_transit'    // Azul #2F80ED
  | 'in_service'    // Amarelo #F2C94C
  | 'paused'        // Lilás #9B51E0
  | 'sla_risk'      // Vermelho #EB5757 com pulso
  | 'offline';      // Cinza #BDBDBD

// ✅ Domain Entity - Business Logic Only
export class FieldAgent {
  constructor(
    public readonly id: string,
    public readonly agentId: string,
    public readonly name: string,
    public readonly tenantId: string,
    public readonly photoUrl?: string,
    public readonly team?: string,
    public readonly skills: string[] = [],
    public readonly status: AgentStatus = 'offline',
    public readonly statusSince?: Date,
    public readonly lat?: number,
    public readonly lng?: number,
    public readonly accuracy?: number,
    public readonly heading?: number,
    public readonly speed?: number,
    public readonly deviceBattery?: number,
    public readonly signalStrength?: number,
    public readonly lastPingAt?: Date,
    public readonly assignedTicketId?: string,
    public readonly customerSiteId?: string,
    public readonly slaDeadlineAt?: Date,
    public readonly shiftStartAt?: Date,
    public readonly shiftEndAt?: Date,
    public readonly isOnDuty: boolean = false,
    public readonly currentRouteId?: string,
    public readonly etaSeconds?: number,
    public readonly distanceMeters?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  // ✅ Business Logic Methods - Pure Domain
  
  isAvailable(): boolean {
    return this.status === 'available' && this.isOnDuty;
  }

  isOffline(maxOfflineMinutes: number = 5): boolean {
    if (!this.lastPingAt) return true;
    const minutesAgo = (Date.now() - this.lastPingAt.getTime()) / (1000 * 60);
    return minutesAgo >= maxOfflineMinutes;
  }

  isInSlaRisk(): boolean {
    if (!this.slaDeadlineAt || !this.etaSeconds) return false;
    const now = new Date();
    const timeToDeadline = (this.slaDeadlineAt.getTime() - now.getTime()) / 1000;
    return this.etaSeconds > timeToDeadline;
  }

  isInWorkingHours(): boolean {
    const now = new Date();
    if (!this.shiftStartAt || !this.shiftEndAt) return false;
    return now >= this.shiftStartAt && now <= this.shiftEndAt;
  }

  hasLocation(): boolean {
    return this.lat !== undefined && this.lng !== undefined;
  }

  getLocationAccuracy(): 'high' | 'medium' | 'low' | 'unknown' {
    if (!this.accuracy) return 'unknown';
    if (this.accuracy <= 5) return 'high';
    if (this.accuracy <= 20) return 'medium';
    return 'low';
  }

  isMoving(): boolean {
    return (this.speed || 0) > 1; // Moving if speed > 1 km/h
  }

  needsAttention(): boolean {
    return this.isInSlaRisk() || 
           this.isOffline() || 
           (this.deviceBattery && this.deviceBattery < 15) ||
           this.getLocationAccuracy() === 'low';
  }

  getStatusColor(): string {
    switch (this.status) {
      case 'available': return '#24B47E';
      case 'in_transit': return '#2F80ED';
      case 'in_service': return '#F2C94C';
      case 'paused': return '#9B51E0';
      case 'sla_risk': return '#EB5757';
      case 'offline': return '#BDBDBD';
      default: return '#BDBDBD';
    }
  }

  getDistanceToPoint(lat: number, lng: number): number {
    if (!this.hasLocation()) return Infinity;
    
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat - this.lat!);
    const dLng = this.toRad(lng - this.lng!);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.lat!)) * Math.cos(this.toRad(lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return distance in meters
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ✅ Factory method from schema
  static fromSchema(schema: FieldAgentSchema): FieldAgent {
    return new FieldAgent(
      schema.id,
      schema.agent_id,
      schema.name,
      schema.tenant_id,
      schema.photo_url || undefined,
      schema.team || undefined,
      schema.skills || [],
      schema.status as AgentStatus,
      schema.status_since || undefined,
      schema.lat ? parseFloat(schema.lat) : undefined,
      schema.lng ? parseFloat(schema.lng) : undefined,
      schema.accuracy ? parseFloat(schema.accuracy) : undefined,
      schema.heading ? parseFloat(schema.heading) : undefined,
      schema.speed ? parseFloat(schema.speed) : undefined,
      schema.device_battery || undefined,
      schema.signal_strength || undefined,
      schema.last_ping_at || undefined,
      schema.assigned_ticket_id || undefined,
      schema.customer_site_id || undefined,
      schema.sla_deadline_at || undefined,
      schema.shift_start_at || undefined,
      schema.shift_end_at || undefined,
      schema.is_on_duty || false,
      schema.current_route_id || undefined,
      schema.eta_seconds || undefined,
      schema.distance_meters || undefined,
      schema.created_at || undefined,
      schema.updated_at || undefined
    );
  }
}

// ✅ Value Objects
export class LocationPoint {
  constructor(
    public readonly lat: number,
    public readonly lng: number,
    public readonly accuracy?: number
  ) {
    if (lat < -90 || lat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (lng < -180 || lng > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
  }

  distanceTo(other: LocationPoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(other.lat - this.lat);
    const dLng = this.toRad(other.lng - this.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.lat)) * Math.cos(this.toRad(other.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return distance in meters
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export class MapBounds {
  constructor(
    public readonly northEast: LocationPoint,
    public readonly southWest: LocationPoint
  ) {}

  contains(point: LocationPoint): boolean {
    return point.lat <= this.northEast.lat &&
           point.lat >= this.southWest.lat &&
           point.lng <= this.northEast.lng &&
           point.lng >= this.southWest.lng;
  }
}

// ✅ 1QA.MD COMPLIANCE: Interactive Map Domain Service
// Pure business logic without external dependencies

import { FieldAgent } from '../entities/FieldAgent';
import { LocationPoint, MapBounds } from '../entities/FieldAgent';
import type { FieldAgent as FieldAgentSchema } from '@shared/schema-interactive-map';

// ✅ Domain Service - Business Rules and Complex Logic
export class InteractiveMapDomainService {
  // ✅ Agent Status Auto-Detection
  determineAgentStatus(
    agent: FieldAgent,
    currentLocation?: LocationPoint,
    hasActiveRoute: boolean = false
  ): 'available' | 'in_transit' | 'in_service' | 'paused' | 'sla_risk' | 'offline' {
    // Check if offline first
    if (agent.isOffline()) {
      return 'offline';
    }

    // Check SLA risk
    if (agent.isInSlaRisk()) {
      return 'sla_risk';
    }

    // If not on duty, should be offline or paused
    if (!agent.isOnDuty) {
      return 'paused';
    }

    // If moving with active route, in transit
    if (agent.isMoving() && hasActiveRoute) {
      return 'in_transit';
    }

    // If stopped at destination for > 3 minutes, in service
    if (!agent.isMoving() && agent.assignedTicketId && agent.customerSiteId) {
      return 'in_service';
    }

    // Default to available
    return 'available';
  }

  // ✅ Clustering Algorithm for Map Performance
  createAgentClusters(
    agents: FieldAgent[],
    bounds: MapBounds,
    zoomLevel: number
  ): Array<{
    lat: number;
    lng: number;
    count: number;
    maxSeverity: 'normal' | 'warning' | 'critical';
    agents: FieldAgent[];
  }> {
    const clusters: Array<{
      lat: number;
      lng: number;
      count: number;
      maxSeverity: 'normal' | 'warning' | 'critical';
      agents: FieldAgent[];
    }> = [];
    const clusterRadius = this.getClusterRadiusForZoom(zoomLevel);
    const processedAgents = new Set<string>();

    for (const agent of agents) {
      if (processedAgents.has(agent.id) || !agent.hasLocation()) {
        continue;
      }

      const agentLocation = new LocationPoint(agent.lat!, agent.lng!);
      const clusterAgents: FieldAgent[] = [agent];
      processedAgents.add(agent.id);

      // Find nearby agents within cluster radius
      for (const otherAgent of agents) {
        if (processedAgents.has(otherAgent.id) || !otherAgent.hasLocation()) {
          continue;
        }

        const otherLocation = new LocationPoint(otherAgent.lat!, otherAgent.lng!);
        const distance = agentLocation.distanceTo(otherLocation);

        if (distance <= clusterRadius) {
          clusterAgents.push(otherAgent);
          processedAgents.add(otherAgent.id);
        }
      }

      // Create cluster
      const cluster = this.createClusterFromAgents(clusterAgents);
      clusters.push(cluster);
    }

    return clusters;
  }

  // ✅ SLA Risk Calculation
  calculateSlaRisk(agent: FieldAgent): {
    isAtRisk: boolean;
    minutesRemaining: number;
    etaMinutes: number;
    riskLevel: 'none' | 'low' | 'medium' | 'high';
  } {
    if (!agent.slaDeadlineAt || !agent.etaSeconds) {
      return {
        isAtRisk: false,
        minutesRemaining: 0,
        etaMinutes: 0,
        riskLevel: 'none'
      };
    }

    const now = new Date();
    const minutesRemaining = Math.max(0, (agent.slaDeadlineAt.getTime() - now.getTime()) / (1000 * 60));
    const etaMinutes = agent.etaSeconds / 60;
    const isAtRisk = etaMinutes > minutesRemaining;

    let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (isAtRisk) {
      const overrunMinutes = etaMinutes - minutesRemaining;
      if (overrunMinutes > 30) riskLevel = 'high';
      else if (overrunMinutes > 15) riskLevel = 'medium';
      else riskLevel = 'low';
    }

    return {
      isAtRisk,
      minutesRemaining,
      etaMinutes,
      riskLevel
    };
  }

  // ✅ Working Hours Validation
  isWithinWorkingHours(
    agent: FieldAgent,
    checkTime: Date = new Date()
  ): boolean {
    if (!agent.shiftStartAt || !agent.shiftEndAt) {
      return false; // No shift defined
    }

    // Convert times to same date for comparison
    const checkHours = checkTime.getHours();
    const checkMinutes = checkTime.getMinutes();
    const checkTotal = checkHours * 60 + checkMinutes;

    const startHours = agent.shiftStartAt.getHours();
    const startMinutes = agent.shiftStartAt.getMinutes();
    const startTotal = startHours * 60 + startMinutes;

    const endHours = agent.shiftEndAt.getHours();
    const endMinutes = agent.shiftEndAt.getMinutes();
    const endTotal = endHours * 60 + endMinutes;

    // Handle overnight shifts
    if (startTotal > endTotal) {
      return checkTotal >= startTotal || checkTotal <= endTotal;
    }

    return checkTotal >= startTotal && checkTotal <= endTotal;
  }

  // ✅ Distance and Proximity Calculations
  findNearestAgents(
    targetLocation: LocationPoint,
    agents: FieldAgent[],
    maxCount: number = 5,
    maxDistanceMeters: number = 10000
  ): Array<{ agent: FieldAgent; distance: number }> {
    const agentsWithDistance = agents
      .filter(agent => agent.hasLocation() && agent.isAvailable())
      .map(agent => ({
        agent,
        distance: targetLocation.distanceTo(new LocationPoint(agent.lat!, agent.lng!))
      }))
      .filter(item => item.distance <= maxDistanceMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxCount);

    return agentsWithDistance;
  }

  // ✅ Agent Performance Metrics
  calculateAgentPerformanceMetrics(agent: FieldAgent): {
    responseTimeScore: number; // 0-100
    availabilityScore: number; // 0-100
    reliabilityScore: number; // 0-100
    overallScore: number; // 0-100
  } {
    // This would typically use historical data - simplified for demonstration
    const responseTimeScore = agent.isAvailable() ? 85 : 60;
    const availabilityScore = agent.isOnDuty ? 90 : 50;
    const reliabilityScore = agent.getLocationAccuracy() === 'high' ? 95 : 70;
    const overallScore = (responseTimeScore + availabilityScore + reliabilityScore) / 3;

    return {
      responseTimeScore,
      availabilityScore,
      reliabilityScore,
      overallScore
    };
  }

  // ✅ Private Helper Methods
  private getClusterRadiusForZoom(zoomLevel: number): number {
    // Cluster radius in meters based on zoom level
    if (zoomLevel >= 16) return 50;   // Very close - 50m clusters
    if (zoomLevel >= 14) return 100;  // Close - 100m clusters
    if (zoomLevel >= 12) return 500;  // Medium - 500m clusters
    if (zoomLevel >= 10) return 1000; // Far - 1km clusters
    return 5000; // Very far - 5km clusters
  }

  private createClusterFromAgents(agents: FieldAgent[]): {
    lat: number;
    lng: number;
    count: number;
    maxSeverity: 'normal' | 'warning' | 'critical';
    agents: FieldAgent[];
  } {
    // Calculate center point
    const totalLat = agents.reduce((sum, agent) => sum + (agent.lat || 0), 0);
    const totalLng = agents.reduce((sum, agent) => sum + (agent.lng || 0), 0);
    const centerLat = totalLat / agents.length;
    const centerLng = totalLng / agents.length;

    // Determine max severity
    let maxSeverity: 'normal' | 'warning' | 'critical' = 'normal';
    for (const agent of agents) {
      if (agent.needsAttention()) {
        maxSeverity = 'critical';
        break;
      }
      if (agent.isInSlaRisk()) {
        maxSeverity = 'warning';
      }
    }

    return {
      lat: centerLat,
      lng: centerLng,
      count: agents.length,
      maxSeverity,
      agents
    };
  }
}

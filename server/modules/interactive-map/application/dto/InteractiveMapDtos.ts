// ✅ 1QA.MD COMPLIANCE: Interactive Map Application DTOs
// Data Transfer Objects for request/response validation

import { z } from 'zod';

// ✅ Request DTOs
export const LocationPointDto = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional()
});

export const MapBoundsDto = z.object({
  northEast: LocationPointDto,
  southWest: LocationPointDto
});

export const AgentSearchCriteriaDto = z.object({
  status: z.array(z.string()).optional(),
  teams: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  bounds: MapBoundsDto.optional(),
  proximityLocation: LocationPointDto.optional(),
  proximityRadius: z.number().min(0).optional(),
  onDutyOnly: z.boolean().optional(),
  slaRiskOnly: z.boolean().optional()
});

export const AgentLocationUpdateDto = z.object({
  agentId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  deviceBattery: z.number().int().min(0).max(100).optional(),
  signalStrength: z.number().int().optional()
});

export const BatchLocationUpdateDto = z.object({
  locationUpdates: z.array(AgentLocationUpdateDto).min(1).max(100)
});

export const FindAgentsNearLocationDto = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(1).max(50000) // Max 50km radius
});

export const GetLocationHistoryDto = z.object({
  agentId: z.string().min(1),
  hours: z.number().int().min(1).max(24)
});

// ✅ Response DTOs
export const FieldAgentResponseDto = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string(),
  photoUrl: z.string().optional(),
  team: z.string().optional(),
  skills: z.array(z.string()),
  status: z.enum(['available', 'in_transit', 'in_service', 'paused', 'sla_risk', 'offline']),
  statusSince: z.date().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  deviceBattery: z.number().optional(),
  signalStrength: z.number().optional(),
  lastPingAt: z.date().optional(),
  assignedTicketId: z.string().optional(),
  customerSiteId: z.string().optional(),
  slaDeadlineAt: z.date().optional(),
  shiftStartAt: z.date().optional(),
  shiftEndAt: z.date().optional(),
  isOnDuty: z.boolean(),
  currentRouteId: z.string().optional(),
  etaSeconds: z.number().optional(),
  distanceMeters: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const AgentStatsResponseDto = z.object({
  totalCount: z.number(),
  availableCount: z.number(),
  inTransitCount: z.number(),
  inServiceCount: z.number(),
  offlineCount: z.number()
});

export const NearbyAgentResponseDto = z.object({
  agent: FieldAgentResponseDto,
  distance: z.number()
});

export const LocationUpdateResultDto = z.object({
  success: z.boolean(),
  agent: FieldAgentResponseDto.optional(),
  statusChanged: z.boolean().optional(),
  newStatus: z.string().optional(),
  geofenceEvents: z.array(z.string()).optional()
});

export const BatchUpdateResultDto = z.object({
  successCount: z.number(),
  failureCount: z.number(),
  results: z.array(z.object({
    agentId: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
    statusChanged: z.boolean().optional()
  }))
});

// ✅ Type exports
export type LocationPointDto = z.infer<typeof LocationPointDto>;
export type MapBoundsDto = z.infer<typeof MapBoundsDto>;
export type AgentSearchCriteriaDto = z.infer<typeof AgentSearchCriteriaDto>;
export type AgentLocationUpdateDto = z.infer<typeof AgentLocationUpdateDto>;
export type BatchLocationUpdateDto = z.infer<typeof BatchLocationUpdateDto>;
export type FindAgentsNearLocationDto = z.infer<typeof FindAgentsNearLocationDto>;
export type GetLocationHistoryDto = z.infer<typeof GetLocationHistoryDto>;
export type FieldAgentResponseDto = z.infer<typeof FieldAgentResponseDto>;
export type AgentStatsResponseDto = z.infer<typeof AgentStatsResponseDto>;
export type NearbyAgentResponseDto = z.infer<typeof NearbyAgentResponseDto>;
export type LocationUpdateResultDto = z.infer<typeof LocationUpdateResultDto>;
export type BatchUpdateResultDto = z.infer<typeof BatchUpdateResultDto>;

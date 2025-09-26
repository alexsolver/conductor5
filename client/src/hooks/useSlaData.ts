// ✅ 1QA.MD COMPLIANCE: SLA DATA HOOK
// Custom hook for SLA data management following Clean Architecture

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface SlaInstance {
  id: string;
  slaDefinitionId: string;
  ticketId: string;
  status: 'running' | 'paused' | 'completed' | 'violated';
  currentMetric: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time';
  elapsedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  isBreached: boolean;
  breachPercentage: number;
  startedAt: string;
  violatedAt?: string;
}

export interface SlaDefinition {
  id: string;
  name: string;
  description?: string;
  type: 'SLA' | 'OLA' | 'UC';
  status: 'active' | 'inactive' | 'expired' | 'draft';
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  updateTimeMinutes?: number;
  idleTimeMinutes?: number;
}

export interface SlaViolation {
  id: string;
  ticketId: string;
  violationType: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time';
  targetMinutes: number;
  actualMinutes: number;
  violationMinutes: number;
  violationPercentage: number;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
}

// Hook principal para instâncias de SLA de um ticket
export function useSlaInstances(ticketId: string) {
  return useQuery({
    queryKey: [`/api/sla/instances/ticket/${ticketId}`],
    queryFn: () => apiRequest('GET', `/api/sla/instances/ticket/${ticketId}`).then(res => res.json()),
    enabled: !!ticketId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

// Hook para definições de SLA
export function useSlaDefinitions() {
  return useQuery({
    queryKey: ['/api/sla/definitions'],
    queryFn: () => apiRequest('GET', '/api/sla/definitions').then(res => res.json()),
    staleTime: 300000, // 5 minutes
  });
}

// Hook para violações de SLA
export function useSlaViolations(ticketId?: string) {
  return useQuery({
    queryKey: ['/api/sla/violations', ticketId],
    queryFn: () => {
      const url = ticketId 
        ? `/api/sla/violations?ticketId=${ticketId}`
        : '/api/sla/violations';
      return apiRequest('GET', url).then(res => res.json());
    },
    staleTime: 60000, // 1 minute
  });
}

// Hook para estatísticas de SLA
export function useSlaComplianceStats() {
  return useQuery({
    queryKey: ['/api/sla/analytics/compliance'],
    queryFn: () => apiRequest('GET', '/api/sla/analytics/compliance').then(res => res.json()),
    staleTime: 300000, // 5 minutes
  });
}

// Hook customizado para calcular status visual do SLA
export function useSlaStatus(ticketId: string) {
  const { data: slaResponse, isLoading } = useSlaInstances(ticketId);

  const slaInstances: SlaInstance[] = slaResponse?.data || [];
  const activeSla = slaInstances.find(instance => 
    instance.status === 'running' || instance.status === 'violated'
  );

  // Calcular status e percentual
  let status: 'none' | 'active' | 'warning' | 'breached' = 'none';
  let elapsedPercent = 0;
  let expirationDate: Date | null = null;

  if (activeSla) {
    elapsedPercent = activeSla.targetMinutes > 0 
      ? (activeSla.elapsedMinutes / activeSla.targetMinutes) * 100 
      : 0;

    const startDate = new Date(activeSla.startedAt);
    expirationDate = new Date(startDate);
    expirationDate.setMinutes(expirationDate.getMinutes() + activeSla.targetMinutes);

    if (activeSla.isBreached || activeSla.status === 'violated') {
      status = 'breached';
    } else if (elapsedPercent >= 80) {
      status = 'warning';
    } else if (elapsedPercent > 0) {
      status = 'active';
    }
  }

  return {
    status,
    elapsedPercent,
    expirationDate,
    activeSla,
    allInstances: slaInstances,
    isLoading,
    hasActiveSla: !!activeSla
  };
}
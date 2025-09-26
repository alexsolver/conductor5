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
// Export alias for backwards compatibility
export const useSlaData = useSlaStatus;

export function useSlaStatus(ticketId: string) {
  const { data: slaResponse, isLoading, error } = useSlaInstances(ticketId);

  const slaInstances: SlaInstance[] = slaResponse?.data || [];
  const activeSla = slaInstances.find(instance => 
    instance.status === 'running' || instance.status === 'violated'
  );

  // Log for debugging
  console.log(`🔍 [SLA-STATUS] Ticket ${ticketId}:`, {
    hasResponse: !!slaResponse,
    instanceCount: slaInstances.length,
    hasActiveSla: !!activeSla,
    activeSlaStatus: activeSla?.status,
    error: error?.message
  });

  // Calcular status e percentual com dados reais
  let status: 'none' | 'active' | 'warning' | 'breached' = 'none';
  let elapsedPercent = 0;
  let expirationDate: Date | null = null;

  if (activeSla) {
    // Calculate real-time elapsed percentage
    const now = new Date();
    const startDate = new Date(activeSla.startedAt);
    const actualElapsedMinutes = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60));
    
    elapsedPercent = activeSla.targetMinutes > 0 
      ? Math.min(100, (actualElapsedMinutes / activeSla.targetMinutes) * 100)
      : 0;

    // Calculate real expiration date
    expirationDate = new Date(startDate);
    expirationDate.setMinutes(expirationDate.getMinutes() + activeSla.targetMinutes);

    // Determine status based on real-time data
    const isOverdue = now > expirationDate;
    
    if (activeSla.isBreached || activeSla.status === 'violated' || isOverdue) {
      status = 'breached';
    } else if (elapsedPercent >= 80) {
      status = 'warning';
    } else if (elapsedPercent > 0) {
      status = 'active';
    }

    // Update activeSla with real-time calculations
    if (activeSla.elapsedMinutes !== actualElapsedMinutes) {
      activeSla.elapsedMinutes = actualElapsedMinutes;
      activeSla.remainingMinutes = Math.max(0, activeSla.targetMinutes - actualElapsedMinutes);
      if (isOverdue && !activeSla.isBreached) {
        activeSla.isBreached = true;
        activeSla.remainingMinutes = -(actualElapsedMinutes - activeSla.targetMinutes);
      }
    }
  }

  return {
    status,
    elapsedPercent,
    expirationDate,
    activeSla,
    allInstances: slaInstances,
    isLoading,
    hasActiveSla: !!activeSla,
    // Additional helper methods for real-time display
    getFormattedElapsedTime: () => {
      if (!activeSla) return 'N/A';
      const minutes = activeSla.elapsedMinutes;
      if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        return `${days}d ${hours}h`;
      } else if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      } else {
        return `${minutes}m`;
      }
    },
    getFormattedRemainingTime: () => {
      if (!activeSla) return 'N/A';
      if (activeSla.remainingMinutes <= 0) return 'VENCIDO';
      const minutes = activeSla.remainingMinutes;
      if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        return `${days}d ${hours}h`;
      } else if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      } else {
        return `${minutes}m`;
      }
    },
    getSlaPercentage: () => {
      if (!activeSla || activeSla.targetMinutes === 0) return 0;
      return Math.min(100, (activeSla.elapsedMinutes / activeSla.targetMinutes) * 100);
    }
  };
}
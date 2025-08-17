/**
 * IWorkOrderRepository - Interface do repositório de ordens de serviço
 * Define contratos para operações de persistência de ordens de serviço
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { WorkOrder, InsertWorkOrder } from '../entities/WorkOrder';

export interface WorkOrderFilters {
  assetId?: string;
  ticketId?: string;
  maintenancePlanId?: string;
  origin?: 'pm' | 'incident' | 'manual' | 'condition';
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  status?: 'drafted' | 'scheduled' | 'in_progress' | 'waiting_parts' | 'waiting_window' | 'waiting_client' | 'completed' | 'approved' | 'closed' | 'rejected' | 'canceled';
  assignedTechnicianId?: string;
  assignedTeamId?: string;
  locationId?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  slaTargetAt?: Date;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isOverdue?: boolean;
  isPastSchedule?: boolean;
  completionPercentageMin?: number;
  completionPercentageMax?: number;
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
}

export interface WorkOrderListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'priority' | 'status' | 'scheduledStart' | 'slaTargetAt' | 'createdAt' | 'actualStart' | 'completionPercentage';
  sortOrder?: 'asc' | 'desc';
  includeAsset?: boolean;
  includeTasks?: boolean;
  includeTimeLogs?: boolean;
}

export interface WorkOrderStatistics {
  total: number;
  byStatus: {
    drafted: number;
    scheduled: number;
    inProgress: number;
    waitingParts: number;
    waitingWindow: number;
    waitingClient: number;
    completed: number;
    approved: number;
    closed: number;
    rejected: number;
    canceled: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    emergency: number;
  };
  byOrigin: {
    pm: number;
    incident: number;
    manual: number;
    condition: number;
  };
  overdue: number;
  pastSchedule: number;
  avgCompletionTime: number; // em horas
  avgCost: number;
  slaCompliance: number; // percentual
}

export interface IWorkOrderRepository {
  create(tenantId: string, workOrder: InsertWorkOrder): Promise<WorkOrder>;
  
  findById(tenantId: string, id: string): Promise<WorkOrder | null>;
  
  findByAsset(tenantId: string, assetId: string): Promise<WorkOrder[]>;
  
  findByTicket(tenantId: string, ticketId: string): Promise<WorkOrder[]>;
  
  findByMaintenancePlan(tenantId: string, planId: string): Promise<WorkOrder[]>;
  
  findMany(
    tenantId: string, 
    filters?: WorkOrderFilters, 
    options?: WorkOrderListOptions
  ): Promise<{
    workOrders: WorkOrder[];
    total: number;
    page: number;
    limit: number;
  }>;
  
  findOverdue(tenantId: string): Promise<WorkOrder[]>;
  
  findPastSchedule(tenantId: string): Promise<WorkOrder[]>;
  
  findByTechnician(
    tenantId: string, 
    technicianId: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<WorkOrder[]>;
  
  findByTeam(
    tenantId: string, 
    teamId: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<WorkOrder[]>;
  
  findScheduledBetween(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<WorkOrder[]>;
  
  findPendingApproval(tenantId: string): Promise<WorkOrder[]>;
  
  update(tenantId: string, id: string, updates: Partial<WorkOrder>, updatedBy: string): Promise<WorkOrder>;
  
  updateStatus(
    tenantId: string, 
    id: string, 
    status: WorkOrder['status'], 
    updatedBy: string
  ): Promise<void>;
  
  updateProgress(
    tenantId: string, 
    id: string, 
    percentage: number, 
    updatedBy: string
  ): Promise<void>;
  
  updateCosts(
    tenantId: string, 
    id: string, 
    costs: { labor?: number; parts?: number; external?: number }, 
    updatedBy: string
  ): Promise<void>;
  
  updateSchedule(
    tenantId: string, 
    id: string, 
    scheduledStart: Date, 
    scheduledEnd: Date, 
    updatedBy: string
  ): Promise<void>;
  
  assignTechnician(
    tenantId: string, 
    id: string, 
    technicianId: string, 
    updatedBy: string
  ): Promise<void>;
  
  assignTeam(
    tenantId: string, 
    id: string, 
    teamId: string, 
    updatedBy: string
  ): Promise<void>;
  
  updateApprovalStatus(
    tenantId: string, 
    id: string, 
    status: 'pending' | 'approved' | 'rejected', 
    updatedBy: string
  ): Promise<void>;
  
  delete(tenantId: string, id: string): Promise<void>;
  
  count(tenantId: string, filters?: WorkOrderFilters): Promise<number>;
  
  getStatistics(tenantId: string, fromDate?: Date, toDate?: Date): Promise<WorkOrderStatistics>;
  
  getKPIs(tenantId: string, fromDate?: Date, toDate?: Date): Promise<{
    mttr: number; // Mean Time To Repair (hours)
    mtbf: number; // Mean Time Between Failures (hours)
    firstTimeFixRate: number; // percentual
    schedulingEfficiency: number; // percentual
    resourceUtilization: number; // percentual
    costEfficiency: number; // custo real vs estimado
    customerSatisfaction?: number; // se disponível
  }>;
  
  getDashboardMetrics(tenantId: string): Promise<{
    totalActive: number;
    inProgress: number;
    overdueCount: number;
    todayScheduled: number;
    weeklyCompletion: number;
    avgResponseTime: number; // em horas
    criticalPending: number;
    partsWaiting: number;
  }>;
}
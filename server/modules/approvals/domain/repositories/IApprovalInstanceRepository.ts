// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN LAYER
// Repository Interface: IApprovalInstanceRepository - Domain contract without implementation details

import { ApprovalInstance } from '../entities/ApprovalInstance';
import { ApprovalStep } from '../entities/ApprovalStep';
import { ApprovalDecision } from '../entities/ApprovalDecision';

export interface CreateApprovalInstanceData {
  tenantId: string;
  ruleId: string;
  entityType: 'tickets' | 'materials' | 'knowledge_base' | 'timecard' | 'contracts';
  entityId: string;
  entityData?: Record<string, any>;
  requestedById: string;
  requestReason?: string;
  urgencyLevel?: number;
  slaDeadline?: Date;
}

export interface UpdateApprovalInstanceData {
  currentStepIndex?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  requestReason?: string;
  urgencyLevel?: number;
  slaDeadline?: Date;
  firstReminderSent?: Date;
  secondReminderSent?: Date;
  escalatedAt?: Date;
  completedAt?: Date;
  completedById?: string;
  completionReason?: string;
  totalResponseTimeMinutes?: number;
  slaViolated?: boolean;
}

export interface ApprovalInstanceFilters {
  tenantId: string;
  status?: string | string[];
  entityType?: string;
  entityId?: string;
  requestedById?: string;
  completedById?: string;
  ruleId?: string;
  urgencyLevel?: number;
  slaViolated?: boolean;
  overdueOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ApprovalInstanceWithDetails extends ApprovalInstance {
  steps?: ApprovalStep[];
  decisions?: ApprovalDecision[];
  ruleName?: string;
  requesterName?: string;
}

export interface IApprovalInstanceRepository {
  // CRUD operations
  create(data: CreateApprovalInstanceData): Promise<ApprovalInstance>;
  update(id: string, data: UpdateApprovalInstanceData): Promise<ApprovalInstance>;
  delete(id: string, tenantId: string): Promise<void>;

  // Query operations
  findById(id: string, tenantId: string): Promise<ApprovalInstance | null>;
  findByIdWithDetails(id: string, tenantId: string): Promise<ApprovalInstanceWithDetails | null>;
  findByTenant(tenantId: string): Promise<ApprovalInstance[]>;
  findByFilters(filters: ApprovalInstanceFilters): Promise<ApprovalInstance[]>;
  findByEntity(tenantId: string, entityType: string, entityId: string): Promise<ApprovalInstance[]>;
  
  // Workflow operations
  findPendingInstances(tenantId: string): Promise<ApprovalInstance[]>;
  findCompletedInstances(tenantId: string, limit?: number): Promise<ApprovalInstance[]>;
  findByRequester(tenantId: string, requestedById: string): Promise<ApprovalInstance[]>;
  findByRule(tenantId: string, ruleId: string): Promise<ApprovalInstance[]>;
  
  // SLA and timing
  findOverdueInstances(tenantId: string): Promise<ApprovalInstance[]>;
  findNeedingReminders(tenantId: string): Promise<ApprovalInstance[]>;
  findNeedingEscalation(tenantId: string): Promise<ApprovalInstance[]>;
  findExpiredInstances(tenantId: string): Promise<ApprovalInstance[]>;
  
  // Statistics and analytics
  countByStatus(tenantId: string): Promise<Record<string, number>>;
  countByTenant(tenantId: string): Promise<number>;
  countOverdue(tenantId: string): Promise<number>;
  getAverageResponseTime(tenantId: string, entityType?: string): Promise<number>;
  getSlaComplianceRate(tenantId: string, entityType?: string): Promise<number>;
  
  // Performance metrics
  findSlowApprovals(tenantId: string, thresholdMinutes: number): Promise<ApprovalInstance[]>;
  findByResponseTimeRange(tenantId: string, minMinutes: number, maxMinutes: number): Promise<ApprovalInstance[]>;
  getMetricsForPeriod(tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalInstances: number;
    completedInstances: number;
    averageResponseTime: number;
    slaViolations: number;
    slaCompliance: number;
  }>;
  
  // Bulk operations
  markRemindersForOverdue(tenantId: string): Promise<ApprovalInstance[]>;
  expireOverdueInstances(tenantId: string): Promise<ApprovalInstance[]>;
  
  // Search and pagination
  searchInstances(tenantId: string, query: string, filters?: ApprovalInstanceFilters): Promise<ApprovalInstance[]>;
  findPaginated(
    filters: ApprovalInstanceFilters,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<{
    instances: ApprovalInstanceWithDetails[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>;
}
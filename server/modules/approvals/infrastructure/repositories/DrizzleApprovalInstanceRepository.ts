// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER
// Concrete Repository: DrizzleApprovalInstanceRepository - Drizzle ORM implementation

import { eq, and, gte, lte, desc, asc, inArray, sql, isNull, isNotNull, gt } from 'drizzle-orm';
import { db } from '@shared/schema';
import { approvalInstances, approvalSteps, approvalDecisions, approvalRules, users } from '@shared/schema';
import { ApprovalInstance } from '../../domain/entities/ApprovalInstance';
import { ApprovalStep } from '../../domain/entities/ApprovalStep';
import { ApprovalDecision } from '../../domain/entities/ApprovalDecision';
import { 
  IApprovalInstanceRepository,
  CreateApprovalInstanceData,
  UpdateApprovalInstanceData,
  ApprovalInstanceFilters,
  ApprovalInstanceWithDetails
} from '../../domain/repositories/IApprovalInstanceRepository';

export class DrizzleApprovalInstanceRepository implements IApprovalInstanceRepository {
  
  async create(data: CreateApprovalInstanceData): Promise<ApprovalInstance> {
    const [result] = await db
      .insert(approvalInstances)
      .values({
        tenantId: data.tenantId,
        ruleId: data.ruleId,
        entityType: data.entityType,
        entityId: data.entityId,
        entityData: data.entityData,
        requestedById: data.requestedById,
        requestReason: data.requestReason,
        urgencyLevel: data.urgencyLevel ?? 3,
        slaDeadline: data.slaDeadline,
        currentStepIndex: 0,
        status: 'pending',
      })
      .returning();

    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateApprovalInstanceData): Promise<ApprovalInstance> {
    const [result] = await db
      .update(approvalInstances)
      .set({
        currentStepIndex: data.currentStepIndex,
        status: data.status,
        requestReason: data.requestReason,
        urgencyLevel: data.urgencyLevel,
        slaDeadline: data.slaDeadline,
        firstReminderSent: data.firstReminderSent,
        secondReminderSent: data.secondReminderSent,
        escalatedAt: data.escalatedAt,
        completedAt: data.completedAt,
        completedById: data.completedById,
        completionReason: data.completionReason,
        totalResponseTimeMinutes: data.totalResponseTimeMinutes,
        slaViolated: data.slaViolated,
        updatedAt: new Date(),
      })
      .where(eq(approvalInstances.id, id))
      .returning();

    if (!result) {
      throw new Error(`Approval instance with id ${id} not found`);
    }

    return this.mapToEntity(result);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const result = await db
      .delete(approvalInstances)
      .where(and(
        eq(approvalInstances.id, id),
        eq(approvalInstances.tenantId, tenantId)
      ));

    if (result.rowCount === 0) {
      throw new Error(`Approval instance with id ${id} not found`);
    }
  }

  async findById(id: string, tenantId: string): Promise<ApprovalInstance | null> {
    const [result] = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.id, id),
        eq(approvalInstances.tenantId, tenantId)
      ));

    return result ? this.mapToEntity(result) : null;
  }

  async findByIdWithDetails(id: string, tenantId: string): Promise<ApprovalInstanceWithDetails | null> {
    const instance = await this.findById(id, tenantId);
    
    if (!instance) {
      return null;
    }

    // Get related steps
    const stepsResults = await db
      .select()
      .from(approvalSteps)
      .where(and(
        eq(approvalSteps.instanceId, id),
        eq(approvalSteps.tenantId, tenantId)
      ))
      .orderBy(asc(approvalSteps.stepIndex));

    // Get related decisions
    const decisionsResults = await db
      .select()
      .from(approvalDecisions)
      .where(and(
        eq(approvalDecisions.instanceId, id),
        eq(approvalDecisions.tenantId, tenantId)
      ))
      .orderBy(desc(approvalDecisions.createdAt));

    // Get rule name and requester name
    const [additionalInfo] = await db
      .select({
        ruleName: approvalRules.name,
        requesterName: users.name,
      })
      .from(approvalInstances)
      .leftJoin(approvalRules, eq(approvalInstances.ruleId, approvalRules.id))
      .leftJoin(users, eq(approvalInstances.requestedById, users.id))
      .where(eq(approvalInstances.id, id));

    const steps = stepsResults.map(step => this.mapStepToEntity(step));
    const decisions = decisionsResults.map(decision => this.mapDecisionToEntity(decision));

    return {
      ...instance,
      steps,
      decisions,
      ruleName: additionalInfo?.ruleName || undefined,
      requesterName: additionalInfo?.requesterName || undefined,
    };
  }

  async findByTenant(tenantId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(eq(approvalInstances.tenantId, tenantId))
      .orderBy(desc(approvalInstances.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findByFilters(filters: ApprovalInstanceFilters): Promise<ApprovalInstance[]> {
    const conditions = [eq(approvalInstances.tenantId, filters.tenantId)];

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(sql`${approvalInstances.status} = ANY(${filters.status})`);
      } else {
        conditions.push(sql`${approvalInstances.status} = ${filters.status}`);
      }
    }

    if (filters.entityType) {
      conditions.push(sql`${approvalInstances.entityType} = ${filters.entityType}`);
    }

    if (filters.entityId) {
      conditions.push(eq(approvalInstances.entityId, filters.entityId));
    }

    if (filters.requestedById) {
      conditions.push(eq(approvalInstances.requestedById, filters.requestedById));
    }

    if (filters.completedById) {
      conditions.push(eq(approvalInstances.completedById, filters.completedById));
    }

    if (filters.ruleId) {
      conditions.push(eq(approvalInstances.ruleId, filters.ruleId));
    }

    if (filters.urgencyLevel !== undefined) {
      conditions.push(eq(approvalInstances.urgencyLevel, filters.urgencyLevel));
    }

    if (filters.slaViolated !== undefined) {
      conditions.push(eq(approvalInstances.slaViolated, filters.slaViolated));
    }

    if (filters.overdueOnly) {
      conditions.push(
        and(
          isNotNull(approvalInstances.slaDeadline),
          sql`${approvalInstances.slaDeadline} < NOW()`,
          sql`${approvalInstances.status} = 'pending'`
        )
      );
    }

    if (filters.dateFrom) {
      conditions.push(gte(approvalInstances.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(approvalInstances.createdAt, filters.dateTo));
    }

    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(...conditions))
      .orderBy(desc(approvalInstances.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findByEntity(tenantId: string, entityType: string, entityId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        sql`${approvalInstances.entityType} = ${entityType}`,
        eq(approvalInstances.entityId, entityId)
      ))
      .orderBy(desc(approvalInstances.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findPendingInstances(tenantId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.status, 'pending')
      ))
      .orderBy(asc(approvalInstances.slaDeadline), desc(approvalInstances.urgencyLevel));

    return results.map(result => this.mapToEntity(result));
  }

  async findCompletedInstances(tenantId: string, limit?: number): Promise<ApprovalInstance[]> {
    let query = db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        inArray(approvalInstances.status, ['approved', 'rejected', 'expired', 'cancelled'])
      ))
      .orderBy(desc(approvalInstances.completedAt));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = await query;
    return results.map(result => this.mapToEntity(result));
  }

  async findByRequester(tenantId: string, requestedById: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.requestedById, requestedById)
      ))
      .orderBy(desc(approvalInstances.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findByRule(tenantId: string, ruleId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.ruleId, ruleId)
      ))
      .orderBy(desc(approvalInstances.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findOverdueInstances(tenantId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.status, 'pending'),
        isNotNull(approvalInstances.slaDeadline),
        sql`${approvalInstances.slaDeadline} < NOW()`
      ))
      .orderBy(asc(approvalInstances.slaDeadline));

    return results.map(result => this.mapToEntity(result));
  }

  async findNeedingReminders(tenantId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.status, 'pending'),
        isNotNull(approvalInstances.slaDeadline),
        sql`${approvalInstances.slaDeadline} > NOW()`,
        sql`${approvalInstances.slaDeadline} <= NOW() + INTERVAL '2 hours'`,
        isNull(approvalInstances.firstReminderSent)
      ));

    return results.map(result => this.mapToEntity(result));
  }

  async findNeedingEscalation(tenantId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.status, 'pending'),
        isNotNull(approvalInstances.slaDeadline),
        sql`${approvalInstances.slaDeadline} <= NOW() + INTERVAL '1 hour'`,
        isNull(approvalInstances.escalatedAt)
      ));

    return results.map(result => this.mapToEntity(result));
  }

  async findExpiredInstances(tenantId: string): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.status, 'pending'),
        isNotNull(approvalInstances.slaDeadline),
        sql`${approvalInstances.slaDeadline} < NOW() - INTERVAL '24 hours'`
      ));

    return results.map(result => this.mapToEntity(result));
  }

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const results = await db
      .select({
        status: approvalInstances.status,
        count: sql`count(*)`.mapWith(Number)
      })
      .from(approvalInstances)
      .where(eq(approvalInstances.tenantId, tenantId))
      .groupBy(approvalInstances.status);

    const statusCounts: Record<string, number> = {};
    results.forEach(result => {
      if (result.status) {
        statusCounts[result.status] = result.count;
      }
    });

    return statusCounts;
  }

  async countByTenant(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalInstances)
      .where(eq(approvalInstances.tenantId, tenantId));

    return result.count;
  }

  async countOverdue(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        eq(approvalInstances.status, 'pending'),
        isNotNull(approvalInstances.slaDeadline),
        sql`${approvalInstances.slaDeadline} < NOW()`
      ));

    return result.count;
  }

  async getAverageResponseTime(tenantId: string, entityType?: string): Promise<number> {
    const conditions = [
      eq(approvalInstances.tenantId, tenantId),
      isNotNull(approvalInstances.slaElapsedMinutes)
    ];

    if (entityType) {
      conditions.push(eq(approvalInstances.entityType, entityType));
    }

    const [result] = await db
      .select({ 
        avg: sql`AVG(${approvalInstances.slaElapsedMinutes})`.mapWith(Number) 
      })
      .from(approvalInstances)
      .where(and(...conditions));

    return result.avg || 0;
  }

  async getSlaComplianceRate(tenantId: string, entityType?: string): Promise<number> {
    const conditions = [eq(approvalInstances.tenantId, tenantId)];

    if (entityType) {
      conditions.push(eq(approvalInstances.entityType, entityType));
    }

    const [totalResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalInstances)
      .where(and(...conditions));

    const [compliantResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalInstances)
      .where(and(
        ...conditions,
        sql`${approvalInstances.slaStatus} != 'violated'`
      ));

    if (totalResult.count === 0) return 100;
    
    return (compliantResult.count / totalResult.count) * 100;
  }

  async findSlowApprovals(tenantId: string, thresholdMinutes: number): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        gt(approvalInstances.slaElapsedMinutes, thresholdMinutes)
      ))
      .orderBy(desc(approvalInstances.slaElapsedMinutes));

    return results.map(result => this.mapToEntity(result));
  }

  async findByResponseTimeRange(tenantId: string, minMinutes: number, maxMinutes: number): Promise<ApprovalInstance[]> {
    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(
        eq(approvalInstances.tenantId, tenantId),
        gte(approvalInstances.slaElapsedMinutes, minMinutes),
        lte(approvalInstances.slaElapsedMinutes, maxMinutes)
      ))
      .orderBy(desc(approvalInstances.slaElapsedMinutes));

    return results.map(result => this.mapToEntity(result));
  }

  async getMetricsForPeriod(tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalInstances: number;
    completedInstances: number;
    averageResponseTime: number;
    slaViolations: number;
    slaCompliance: number;
  }> {
    const periodConditions = and(
      eq(approvalInstances.tenantId, tenantId),
      gte(approvalInstances.createdAt, startDate),
      lte(approvalInstances.createdAt, endDate)
    );

    // Total instances
    const [totalResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalInstances)
      .where(periodConditions);

    // Completed instances
    const [completedResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalInstances)
      .where(and(
        periodConditions,
        inArray(approvalInstances.status, ['approved', 'rejected', 'expired'])
      ));

    // Average response time
    const [avgResult] = await db
      .select({ 
        avg: sql`AVG(${approvalInstances.slaElapsedMinutes})`.mapWith(Number) 
      })
      .from(approvalInstances)
      .where(and(
        periodConditions,
        isNotNull(approvalInstances.slaElapsedMinutes)
      ));

    // SLA violations
    const [violationsResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(approvalInstances)
      .where(and(
        periodConditions,
        sql`${approvalInstances.slaStatus} = 'violated'`
      ));

    const totalInstances = totalResult.count;
    const completedInstances = completedResult.count;
    const averageResponseTime = avgResult.avg || 0;
    const slaViolations = violationsResult.count;
    const slaCompliance = totalInstances > 0 ? ((totalInstances - slaViolations) / totalInstances) * 100 : 100;

    return {
      totalInstances,
      completedInstances,
      averageResponseTime,
      slaViolations,
      slaCompliance,
    };
  }

  async markRemindersForOverdue(tenantId: string): Promise<ApprovalInstance[]> {
    const overdueInstances = await this.findNeedingReminders(tenantId);
    
    if (overdueInstances.length > 0) {
      const ids = overdueInstances.map(instance => instance.id);
      
      await db
        .update(approvalInstances)
        .set({ 
          firstReminderSent: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          inArray(approvalInstances.id, ids),
          eq(approvalInstances.tenantId, tenantId)
        ));
    }

    return overdueInstances;
  }

  async expireOverdueInstances(tenantId: string): Promise<ApprovalInstance[]> {
    const expiredInstances = await this.findExpiredInstances(tenantId);
    
    if (expiredInstances.length > 0) {
      const ids = expiredInstances.map(instance => instance.id);
      
      await db
        .update(approvalInstances)
        .set({ 
          status: 'expired',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          inArray(approvalInstances.id, ids),
          eq(approvalInstances.tenantId, tenantId)
        ));
    }

    return expiredInstances;
  }

  async searchInstances(tenantId: string, query: string, filters?: ApprovalInstanceFilters): Promise<ApprovalInstance[]> {
    const conditions = [eq(approvalInstances.tenantId, tenantId)];

    // Add search condition
    conditions.push(
      sql`(${approvalInstances.entityId} ILIKE ${`%${query}%`} OR ${approvalInstances.requestReason} ILIKE ${`%${query}%`})`
    );

    // Apply additional filters if provided
    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          conditions.push(sql`${approvalInstances.status} = ANY(${filters.status})`);
        } else {
          conditions.push(sql`${approvalInstances.status} = ${filters.status}`);
        }
      }

      if (filters.entityType) {
        conditions.push(sql`${approvalInstances.entityType} = ${filters.entityType}`);
      }

      // Add other filter conditions as needed
    }

    const results = await db
      .select()
      .from(approvalInstances)
      .where(and(...conditions))
      .orderBy(desc(approvalInstances.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findPaginated(
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
  }> {
    // Use existing findByFilters for the conditions
    const allInstances = await this.findByFilters(filters);
    
    // Get total count
    const total = allInstances.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    // Apply pagination
    const paginatedInstances = allInstances.slice(offset, offset + limit);
    
    // Get detailed information for paginated results
    const instancesWithDetails: ApprovalInstanceWithDetails[] = [];
    
    for (const instance of paginatedInstances) {
      const detailed = await this.findByIdWithDetails(instance.id, filters.tenantId);
      if (detailed) {
        instancesWithDetails.push(detailed);
      }
    }
    
    return {
      instances: instancesWithDetails,
      total,
      totalPages,
      currentPage: page,
    };
  }

  private mapToEntity(dbRecord: any): ApprovalInstance {
    return ApprovalInstance.fromDatabase({
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      ruleId: dbRecord.ruleId,
      entityType: dbRecord.entityType,
      entityId: dbRecord.entityId,
      entityData: dbRecord.entityData,
      requestedById: dbRecord.requestedById,
      requestReason: dbRecord.requestReason,
      urgencyLevel: dbRecord.urgencyLevel,
      slaDeadline: dbRecord.slaDeadline,
      currentStepIndex: dbRecord.currentStepIndex,
      status: dbRecord.status,
      firstReminderSent: dbRecord.firstReminderSent,
      secondReminderSent: dbRecord.secondReminderSent,
      escalatedAt: dbRecord.escalatedAt,
      completedAt: dbRecord.completedAt,
      completedById: dbRecord.completedById,
      completionReason: dbRecord.completionReason,
      totalResponseTimeMinutes: dbRecord.totalResponseTimeMinutes,
      slaViolated: dbRecord.slaViolated,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    });
  }

  private mapStepToEntity(dbRecord: any): ApprovalStep {
    return ApprovalStep.fromDatabase({
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      instanceId: dbRecord.instanceId,
      stepIndex: dbRecord.stepIndex,
      stepName: dbRecord.stepName,
      stepConfig: dbRecord.stepConfig,
      approverMode: dbRecord.approverMode,
      requiredApprovers: dbRecord.requiredApprovers,
      totalApprovers: dbRecord.totalApprovers,
      status: dbRecord.status,
      approvedCount: dbRecord.approvedCount,
      rejectedCount: dbRecord.rejectedCount,
      stepSlaHours: dbRecord.stepSlaHours,
      stepDeadline: dbRecord.stepDeadline,
      stepStartedAt: dbRecord.stepStartedAt,
      stepCompletedAt: dbRecord.stepCompletedAt,
      escalationLevel: dbRecord.escalationLevel,
      lastEscalationAt: dbRecord.lastEscalationAt,
      isActive: dbRecord.isActive,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    });
  }

  private mapDecisionToEntity(dbRecord: any): ApprovalDecision {
    return ApprovalDecision.fromDatabase({
      id: dbRecord.id,
      tenantId: dbRecord.tenantId,
      instanceId: dbRecord.instanceId,
      stepId: dbRecord.stepId,
      approverId: dbRecord.approverId,
      approverType: dbRecord.approverType,
      approverIdentifier: dbRecord.approverIdentifier,
      decision: dbRecord.decision,
      comments: dbRecord.comments,
      reasonCode: dbRecord.reasonCode,
      delegatedToId: dbRecord.delegatedToId,
      delegationReason: dbRecord.delegationReason,
      responseTimeMinutes: dbRecord.responseTimeMinutes,
      ipAddress: dbRecord.ipAddress,
      userAgent: dbRecord.userAgent,
      isActive: dbRecord.isActive,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    });
  }
}
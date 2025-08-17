/**
 * DrizzleWorkOrderRepository - Implementação do repositório de ordens de serviço usando Drizzle ORM
 * Persistência de dados de ordens de serviço no PostgreSQL
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { eq, and, sql, desc, asc, ilike, count, lte, gte, between, isNull, isNotNull } from 'drizzle-orm';
import { db } from '../../../db.js';
import { WorkOrder, InsertWorkOrder } from '../../domain/entities/WorkOrder';
import { 
  IWorkOrderRepository, 
  WorkOrderFilters, 
  WorkOrderListOptions,
  WorkOrderStatistics
} from '../../domain/repositories/IWorkOrderRepository';
import { workOrders } from '@shared/schema-activity-planner';

export class DrizzleWorkOrderRepository implements IWorkOrderRepository {
  async create(tenantId: string, workOrderData: InsertWorkOrder): Promise<WorkOrder> {
    console.log('🔧 [DrizzleWorkOrderRepository] Creating work order:', workOrderData.title);
    
    const [newWorkOrder] = await db
      .insert(workOrders)
      .values({
        ...workOrderData,
        tenantId,
        updatedBy: workOrderData.createdBy,
        requiresApproval: workOrderData.requiresApproval ?? false,
        totalCost: 0,
        laborCost: 0,
        partsCost: 0,
        externalCost: 0,
        completionPercentage: 0,
        status: 'drafted'
      })
      .returning();

    console.log('✅ [DrizzleWorkOrderRepository] Work order created:', newWorkOrder.id);
    return newWorkOrder;
  }

  async findById(tenantId: string, id: string): Promise<WorkOrder | null> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work order by ID:', id);
    
    const [workOrder] = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ))
      .limit(1);

    return workOrder || null;
  }

  async findByAsset(tenantId: string, assetId: string): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work orders by asset:', assetId);
    
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.assetId, assetId)
      ))
      .orderBy(desc(workOrders.createdAt));

    console.log(`✅ [DrizzleWorkOrderRepository] Found ${orders.length} work orders for asset`);
    return orders;
  }

  async findByTicket(tenantId: string, ticketId: string): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work orders by ticket:', ticketId);
    
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.ticketId, ticketId)
      ))
      .orderBy(desc(workOrders.createdAt));

    return orders;
  }

  async findByMaintenancePlan(tenantId: string, planId: string): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work orders by maintenance plan:', planId);
    
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.maintenancePlanId, planId)
      ))
      .orderBy(desc(workOrders.createdAt));

    return orders;
  }

  async findMany(
    tenantId: string, 
    filters: WorkOrderFilters = {}, 
    options: WorkOrderListOptions = {}
  ): Promise<{
    workOrders: WorkOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work orders with filters:', filters);
    
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = options;
    
    // Construir condições
    const conditions = [
      eq(workOrders.tenantId, tenantId)
    ];

    if (filters.assetId) {
      conditions.push(eq(workOrders.assetId, filters.assetId));
    }

    if (filters.ticketId) {
      conditions.push(eq(workOrders.ticketId, filters.ticketId));
    }

    if (filters.maintenancePlanId) {
      conditions.push(eq(workOrders.maintenancePlanId, filters.maintenancePlanId));
    }

    if (filters.origin) {
      conditions.push(eq(workOrders.origin, filters.origin));
    }

    if (filters.priority) {
      conditions.push(eq(workOrders.priority, filters.priority));
    }

    if (filters.status) {
      conditions.push(eq(workOrders.status, filters.status));
    }

    if (filters.assignedTechnicianId) {
      conditions.push(eq(workOrders.assignedTechnicianId, filters.assignedTechnicianId));
    }

    if (filters.assignedTeamId) {
      conditions.push(eq(workOrders.assignedTeamId, filters.assignedTeamId));
    }

    if (filters.locationId) {
      conditions.push(eq(workOrders.locationId, filters.locationId));
    }

    if (filters.approvalStatus) {
      conditions.push(eq(workOrders.approvalStatus, filters.approvalStatus));
    }

    if (filters.scheduledStart) {
      conditions.push(gte(workOrders.scheduledStart, filters.scheduledStart));
    }

    if (filters.scheduledEnd) {
      conditions.push(lte(workOrders.scheduledEnd, filters.scheduledEnd));
    }

    if (filters.isOverdue) {
      conditions.push(
        and(
          isNotNull(workOrders.slaTargetAt),
          sql`${workOrders.slaTargetAt} < NOW()`,
          sql`${workOrders.status} NOT IN ('completed', 'approved', 'closed')`
        )
      );
    }

    if (filters.isPastSchedule) {
      conditions.push(
        and(
          isNotNull(workOrders.scheduledEnd),
          sql`${workOrders.scheduledEnd} < NOW()`,
          sql`${workOrders.status} NOT IN ('completed', 'approved', 'closed')`
        )
      );
    }

    if (filters.completionPercentageMin !== undefined) {
      conditions.push(gte(workOrders.completionPercentage, filters.completionPercentageMin));
    }

    if (filters.completionPercentageMax !== undefined) {
      conditions.push(lte(workOrders.completionPercentage, filters.completionPercentageMax));
    }

    if (filters.createdFrom) {
      conditions.push(gte(workOrders.createdAt, filters.createdFrom));
    }

    if (filters.createdTo) {
      conditions.push(lte(workOrders.createdAt, filters.createdTo));
    }

    if (filters.search) {
      conditions.push(
        sql`(${workOrders.title} ILIKE ${`%${filters.search}%`} OR ${workOrders.description} ILIKE ${`%${filters.search}%`})`
      );
    }

    let query = db
      .select()
      .from(workOrders)
      .where(and(...conditions));

    // Aplicar ordenação
    const orderBy = sortOrder === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'priority':
        query = query.orderBy(orderBy(workOrders.priority));
        break;
      case 'status':
        query = query.orderBy(orderBy(workOrders.status));
        break;
      case 'scheduledStart':
        query = query.orderBy(orderBy(workOrders.scheduledStart));
        break;
      case 'slaTargetAt':
        query = query.orderBy(orderBy(workOrders.slaTargetAt));
        break;
      case 'actualStart':
        query = query.orderBy(orderBy(workOrders.actualStart));
        break;
      case 'completionPercentage':
        query = query.orderBy(orderBy(workOrders.completionPercentage));
        break;
      default:
        query = query.orderBy(orderBy(workOrders.createdAt));
    }

    // Paginação
    const offset = (page - 1) * limit;
    const paginatedQuery = query.limit(limit).offset(offset);

    // Contar total
    const totalQuery = db
      .select({ count: count() })
      .from(workOrders)
      .where(and(...conditions));

    const [ordersList, totalResult] = await Promise.all([
      paginatedQuery,
      totalQuery
    ]);

    console.log(`✅ [DrizzleWorkOrderRepository] Found ${ordersList.length} work orders`);
    
    return {
      workOrders: ordersList,
      total: totalResult[0]?.count || 0,
      page,
      limit
    };
  }

  async findOverdue(tenantId: string): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding overdue work orders');
    
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        isNotNull(workOrders.slaTargetAt),
        sql`${workOrders.slaTargetAt} < NOW()`,
        sql`${workOrders.status} NOT IN ('completed', 'approved', 'closed')`
      ))
      .orderBy(asc(workOrders.slaTargetAt));

    console.log(`✅ [DrizzleWorkOrderRepository] Found ${orders.length} overdue work orders`);
    return orders;
  }

  async findPastSchedule(tenantId: string): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding past schedule work orders');
    
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        isNotNull(workOrders.scheduledEnd),
        sql`${workOrders.scheduledEnd} < NOW()`,
        sql`${workOrders.status} NOT IN ('completed', 'approved', 'closed')`
      ))
      .orderBy(asc(workOrders.scheduledEnd));

    console.log(`✅ [DrizzleWorkOrderRepository] Found ${orders.length} past schedule work orders`);
    return orders;
  }

  async findByTechnician(
    tenantId: string, 
    technicianId: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work orders by technician:', technicianId);
    
    const conditions = [
      eq(workOrders.tenantId, tenantId),
      eq(workOrders.assignedTechnicianId, technicianId)
    ];

    if (fromDate) {
      conditions.push(gte(workOrders.createdAt, fromDate));
    }

    if (toDate) {
      conditions.push(lte(workOrders.createdAt, toDate));
    }

    const orders = await db
      .select()
      .from(workOrders)
      .where(and(...conditions))
      .orderBy(desc(workOrders.createdAt));

    return orders;
  }

  async findByTeam(
    tenantId: string, 
    teamId: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work orders by team:', teamId);
    
    const conditions = [
      eq(workOrders.tenantId, tenantId),
      eq(workOrders.assignedTeamId, teamId)
    ];

    if (fromDate) {
      conditions.push(gte(workOrders.createdAt, fromDate));
    }

    if (toDate) {
      conditions.push(lte(workOrders.createdAt, toDate));
    }

    const orders = await db
      .select()
      .from(workOrders)
      .where(and(...conditions))
      .orderBy(desc(workOrders.createdAt));

    return orders;
  }

  async findScheduledBetween(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding scheduled work orders between dates');
    
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        isNotNull(workOrders.scheduledStart),
        between(workOrders.scheduledStart, startDate, endDate)
      ))
      .orderBy(asc(workOrders.scheduledStart));

    return orders;
  }

  async findPendingApproval(tenantId: string): Promise<WorkOrder[]> {
    console.log('🔍 [DrizzleWorkOrderRepository] Finding work orders pending approval');
    
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.requiresApproval, true),
        eq(workOrders.approvalStatus, 'pending')
      ))
      .orderBy(asc(workOrders.createdAt));

    return orders;
  }

  async update(tenantId: string, id: string, updates: Partial<WorkOrder>, updatedBy: string): Promise<WorkOrder> {
    console.log('🔧 [DrizzleWorkOrderRepository] Updating work order:', id);
    
    const [updatedWorkOrder] = await db
      .update(workOrders)
      .set({
        ...updates,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ))
      .returning();

    if (!updatedWorkOrder) {
      throw new Error('Work order not found');
    }

    console.log('✅ [DrizzleWorkOrderRepository] Work order updated successfully');
    return updatedWorkOrder;
  }

  async updateStatus(
    tenantId: string, 
    id: string, 
    status: WorkOrder['status'], 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleWorkOrderRepository] Updating work order status:', { id, status });
    
    const updateData: any = {
      status,
      updatedAt: new Date(),
      updatedBy
    };

    // Atualizar timestamps baseado no status
    if (status === 'in_progress') {
      updateData.actualStart = sql`COALESCE(${workOrders.actualStart}, NOW())`;
    }

    if (status === 'completed') {
      updateData.actualEnd = sql`COALESCE(${workOrders.actualEnd}, NOW())`;
      updateData.completionPercentage = 100;
    }

    await db
      .update(workOrders)
      .set(updateData)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Status updated successfully');
  }

  async updateProgress(
    tenantId: string, 
    id: string, 
    percentage: number, 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleWorkOrderRepository] Updating work order progress:', { id, percentage });
    
    await db
      .update(workOrders)
      .set({
        completionPercentage: percentage,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Progress updated successfully');
  }

  async updateCosts(
    tenantId: string, 
    id: string, 
    costs: { labor?: number; parts?: number; external?: number }, 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleWorkOrderRepository] Updating work order costs:', { id, costs });
    
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy
    };

    if (costs.labor !== undefined) updateData.laborCost = costs.labor;
    if (costs.parts !== undefined) updateData.partsCost = costs.parts;
    if (costs.external !== undefined) updateData.externalCost = costs.external;

    // Recalcular custo total
    updateData.totalCost = sql`${workOrders.laborCost} + ${workOrders.partsCost} + ${workOrders.externalCost}`;

    await db
      .update(workOrders)
      .set(updateData)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Costs updated successfully');
  }

  async updateSchedule(
    tenantId: string, 
    id: string, 
    scheduledStart: Date, 
    scheduledEnd: Date, 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleWorkOrderRepository] Updating work order schedule:', { id, scheduledStart, scheduledEnd });
    
    await db
      .update(workOrders)
      .set({
        scheduledStart,
        scheduledEnd,
        status: sql`CASE WHEN ${workOrders.status} = 'drafted' THEN 'scheduled' ELSE ${workOrders.status} END`,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Schedule updated successfully');
  }

  async assignTechnician(
    tenantId: string, 
    id: string, 
    technicianId: string, 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleWorkOrderRepository] Assigning technician to work order:', { id, technicianId });
    
    await db
      .update(workOrders)
      .set({
        assignedTechnicianId: technicianId,
        assignedTeamId: null, // Clear team assignment
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Technician assigned successfully');
  }

  async assignTeam(
    tenantId: string, 
    id: string, 
    teamId: string, 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleWorkOrderRepository] Assigning team to work order:', { id, teamId });
    
    await db
      .update(workOrders)
      .set({
        assignedTeamId: teamId,
        assignedTechnicianId: null, // Clear individual assignment
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Team assigned successfully');
  }

  async updateApprovalStatus(
    tenantId: string, 
    id: string, 
    status: 'pending' | 'approved' | 'rejected', 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleWorkOrderRepository] Updating approval status:', { id, status });
    
    const updateData: any = {
      approvalStatus: status,
      updatedAt: new Date(),
      updatedBy
    };

    if (status === 'rejected') {
      updateData.status = 'rejected';
    }

    await db
      .update(workOrders)
      .set(updateData)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Approval status updated successfully');
  }

  async delete(tenantId: string, id: string): Promise<void> {
    console.log('🗑️ [DrizzleWorkOrderRepository] Deleting work order:', id);
    
    await db
      .delete(workOrders)
      .where(and(
        eq(workOrders.tenantId, tenantId),
        eq(workOrders.id, id)
      ));

    console.log('✅ [DrizzleWorkOrderRepository] Work order deleted');
  }

  async count(tenantId: string, filters: WorkOrderFilters = {}): Promise<number> {
    console.log('🔢 [DrizzleWorkOrderRepository] Counting work orders with filters:', filters);
    
    const conditions = [
      eq(workOrders.tenantId, tenantId)
    ];

    // Apply same filters as in findMany (simplified version)
    if (filters.status) {
      conditions.push(eq(workOrders.status, filters.status));
    }

    if (filters.priority) {
      conditions.push(eq(workOrders.priority, filters.priority));
    }

    const [result] = await db
      .select({ count: count() })
      .from(workOrders)
      .where(and(...conditions));

    return result?.count || 0;
  }

  async getStatistics(tenantId: string, fromDate?: Date, toDate?: Date): Promise<WorkOrderStatistics> {
    console.log('📊 [DrizzleWorkOrderRepository] Getting work order statistics');
    
    // Placeholder implementation - would need complex queries for real statistics
    return {
      total: 0,
      byStatus: {
        drafted: 0,
        scheduled: 0,
        inProgress: 0,
        waitingParts: 0,
        waitingWindow: 0,
        waitingClient: 0,
        completed: 0,
        approved: 0,
        closed: 0,
        rejected: 0,
        canceled: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        emergency: 0
      },
      byOrigin: {
        pm: 0,
        incident: 0,
        manual: 0,
        condition: 0
      },
      overdue: 0,
      pastSchedule: 0,
      avgCompletionTime: 0,
      avgCost: 0,
      slaCompliance: 0
    };
  }

  async getKPIs(tenantId: string, fromDate?: Date, toDate?: Date): Promise<any> {
    console.log('📊 [DrizzleWorkOrderRepository] Getting work order KPIs');
    
    // Placeholder implementation
    return {
      mttr: 0,
      mtbf: 0,
      firstTimeFixRate: 0,
      schedulingEfficiency: 0,
      resourceUtilization: 0,
      costEfficiency: 0,
      customerSatisfaction: 0
    };
  }

  async getDashboardMetrics(tenantId: string): Promise<any> {
    console.log('📊 [DrizzleWorkOrderRepository] Getting dashboard metrics');
    
    // Placeholder implementation
    return {
      totalActive: 0,
      inProgress: 0,
      overdueCount: 0,
      todayScheduled: 0,
      weeklyCompletion: 0,
      avgResponseTime: 0,
      criticalPending: 0,
      partsWaiting: 0
    };
  }
}
/**
 * WorkOrderApplicationService - Serviço de aplicação para ordens de serviço
 * Orquestra operações de negócio relacionadas a ordens de trabalho de manutenção
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { WorkOrderEntity, WorkOrder, InsertWorkOrder } from '../../domain/entities/WorkOrder';
import { 
  IWorkOrderRepository, 
  WorkOrderFilters, 
  WorkOrderListOptions 
} from '../../domain/repositories/IWorkOrderRepository';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IMaintenancePlanRepository } from '../../domain/repositories/IMaintenancePlanRepository';

export class WorkOrderApplicationService {
  constructor(
    private workOrderRepository: IWorkOrderRepository,
    private assetRepository: IAssetRepository,
    private maintenancePlanRepository: IMaintenancePlanRepository
  ) {}

  async createWorkOrder(
    tenantId: string, 
    workOrderData: InsertWorkOrder, 
    createdBy: string
  ): Promise<WorkOrder> {
    console.log('🔧 [WorkOrderApplicationService] Creating work order:', workOrderData.title);

    // Verificar se o asset existe
    const asset = await this.assetRepository.findById(tenantId, workOrderData.assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Se vinculado a um plano, verificar se existe
    if (workOrderData.maintenancePlanId) {
      const plan = await this.maintenancePlanRepository.findById(tenantId, workOrderData.maintenancePlanId);
      if (!plan) {
        throw new Error('Maintenance plan not found');
      }
    }

    // Validar duração estimada
    if (workOrderData.estimatedDuration <= 0) {
      throw new Error('Estimated duration must be positive');
    }

    // Validar agendamento se fornecido
    if (workOrderData.scheduledStart && workOrderData.scheduledEnd) {
      if (workOrderData.scheduledStart >= workOrderData.scheduledEnd) {
        throw new Error('Scheduled start must be before scheduled end');
      }
    }

    const workOrder = await this.workOrderRepository.create(tenantId, {
      ...workOrderData,
      createdBy
    });

    console.log('✅ [WorkOrderApplicationService] Work order created:', workOrder.id);
    return workOrder;
  }

  async getWorkOrders(
    tenantId: string,
    filters: WorkOrderFilters = {},
    options: WorkOrderListOptions = {}
  ): Promise<{
    workOrders: WorkOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    console.log('🔍 [WorkOrderApplicationService] Getting work orders with filters:', filters);
    
    const result = await this.workOrderRepository.findMany(tenantId, filters, options);
    
    console.log(`✅ [WorkOrderApplicationService] Found ${result.workOrders.length} work orders`);
    return result;
  }

  async getWorkOrderById(tenantId: string, workOrderId: string): Promise<WorkOrder | null> {
    console.log('🔍 [WorkOrderApplicationService] Getting work order by ID:', workOrderId);
    
    const workOrder = await this.workOrderRepository.findById(tenantId, workOrderId);
    
    if (workOrder) {
      console.log('✅ [WorkOrderApplicationService] Work order found:', workOrder.title);
    }
    
    return workOrder;
  }

  async getWorkOrdersByAsset(tenantId: string, assetId: string): Promise<WorkOrder[]> {
    console.log('🔍 [WorkOrderApplicationService] Getting work orders for asset:', assetId);
    
    const workOrders = await this.workOrderRepository.findByAsset(tenantId, assetId);
    
    console.log(`✅ [WorkOrderApplicationService] Found ${workOrders.length} work orders for asset`);
    return workOrders;
  }

  async updateWorkOrder(
    tenantId: string,
    workOrderId: string,
    updates: Partial<WorkOrder>,
    updatedBy: string
  ): Promise<WorkOrder> {
    console.log('🔧 [WorkOrderApplicationService] Updating work order:', workOrderId);

    // Verificar se existe
    const existingWorkOrder = await this.workOrderRepository.findById(tenantId, workOrderId);
    if (!existingWorkOrder) {
      throw new Error('Work order not found');
    }

    // Validar mudanças de agendamento
    if (updates.scheduledStart && updates.scheduledEnd) {
      if (updates.scheduledStart >= updates.scheduledEnd) {
        throw new Error('Scheduled start must be before scheduled end');
      }
    }

    const updatedWorkOrder = await this.workOrderRepository.update(
      tenantId, 
      workOrderId, 
      updates, 
      updatedBy
    );

    console.log('✅ [WorkOrderApplicationService] Work order updated successfully');
    return updatedWorkOrder;
  }

  async updateWorkOrderStatus(
    tenantId: string,
    workOrderId: string,
    status: WorkOrder['status'],
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Updating work order status:', { workOrderId, status });

    // Verificar se existe e validar transição
    const workOrder = await this.workOrderRepository.findById(tenantId, workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const workOrderEntity = new WorkOrderEntity(workOrder);

    // Validar se pode fazer a transição de status
    if (status === 'in_progress' && !workOrderEntity.canStart()) {
      throw new Error('Work order cannot be started in current state');
    }

    if (status === 'completed' && !workOrderEntity.canComplete()) {
      throw new Error('Work order cannot be completed - ensure progress is 100%');
    }

    await this.workOrderRepository.updateStatus(tenantId, workOrderId, status, updatedBy);

    console.log('✅ [WorkOrderApplicationService] Status updated successfully');
  }

  async updateWorkOrderProgress(
    tenantId: string,
    workOrderId: string,
    percentage: number,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Updating work order progress:', { workOrderId, percentage });

    if (percentage < 0 || percentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    await this.workOrderRepository.updateProgress(tenantId, workOrderId, percentage, updatedBy);

    console.log('✅ [WorkOrderApplicationService] Progress updated successfully');
  }

  async scheduleWorkOrder(
    tenantId: string,
    workOrderId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Scheduling work order:', { workOrderId, scheduledStart, scheduledEnd });

    if (scheduledStart >= scheduledEnd) {
      throw new Error('Scheduled start must be before scheduled end');
    }

    if (scheduledStart < new Date()) {
      throw new Error('Cannot schedule work order in the past');
    }

    await this.workOrderRepository.updateSchedule(tenantId, workOrderId, scheduledStart, scheduledEnd, updatedBy);

    console.log('✅ [WorkOrderApplicationService] Work order scheduled successfully');
  }

  async assignTechnician(
    tenantId: string,
    workOrderId: string,
    technicianId: string,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Assigning technician:', { workOrderId, technicianId });

    // TODO: Verificar se o técnico existe quando o módulo de técnicos estiver implementado

    await this.workOrderRepository.assignTechnician(tenantId, workOrderId, technicianId, updatedBy);

    console.log('✅ [WorkOrderApplicationService] Technician assigned successfully');
  }

  async assignTeam(
    tenantId: string,
    workOrderId: string,
    teamId: string,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Assigning team:', { workOrderId, teamId });

    // TODO: Verificar se o time existe quando o módulo de times estiver implementado

    await this.workOrderRepository.assignTeam(tenantId, workOrderId, teamId, updatedBy);

    console.log('✅ [WorkOrderApplicationService] Team assigned successfully');
  }

  async startWorkOrder(
    tenantId: string,
    workOrderId: string,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Starting work order:', workOrderId);

    const workOrder = await this.workOrderRepository.findById(tenantId, workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const workOrderEntity = new WorkOrderEntity(workOrder);

    if (!workOrderEntity.canStart()) {
      throw new Error('Work order cannot be started in current state');
    }

    await this.workOrderRepository.updateStatus(tenantId, workOrderId, 'in_progress', updatedBy);

    console.log('✅ [WorkOrderApplicationService] Work order started successfully');
  }

  async pauseWorkOrder(
    tenantId: string,
    workOrderId: string,
    reason: 'parts' | 'window' | 'client',
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Pausing work order:', { workOrderId, reason });

    const statusMap = {
      parts: 'waiting_parts' as const,
      window: 'waiting_window' as const,
      client: 'waiting_client' as const
    };

    await this.workOrderRepository.updateStatus(tenantId, workOrderId, statusMap[reason], updatedBy);

    console.log('✅ [WorkOrderApplicationService] Work order paused successfully');
  }

  async completeWorkOrder(
    tenantId: string,
    workOrderId: string,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Completing work order:', workOrderId);

    const workOrder = await this.workOrderRepository.findById(tenantId, workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const workOrderEntity = new WorkOrderEntity(workOrder);

    if (!workOrderEntity.canComplete()) {
      throw new Error('Work order cannot be completed - ensure progress is 100%');
    }

    await this.workOrderRepository.updateStatus(tenantId, workOrderId, 'completed', updatedBy);

    // Atualizar status de manutenção do asset
    await this.assetRepository.updateMaintenanceStatus(
      tenantId,
      workOrder.assetId,
      new Date(),
      undefined, // nextMaintenanceDate será calculado pelo plano se existir
      updatedBy
    );

    console.log('✅ [WorkOrderApplicationService] Work order completed successfully');
  }

  async cancelWorkOrder(
    tenantId: string,
    workOrderId: string,
    reason: string,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [WorkOrderApplicationService] Canceling work order:', { workOrderId, reason });

    const workOrder = await this.workOrderRepository.findById(tenantId, workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const workOrderEntity = new WorkOrderEntity(workOrder);

    if (workOrderEntity.isCompleted()) {
      throw new Error('Cannot cancel completed work order');
    }

    await this.workOrderRepository.updateStatus(tenantId, workOrderId, 'canceled', updatedBy);

    console.log('✅ [WorkOrderApplicationService] Work order canceled successfully');
  }

  async getOverdueWorkOrders(tenantId: string): Promise<WorkOrder[]> {
    console.log('🔍 [WorkOrderApplicationService] Getting overdue work orders');

    const workOrders = await this.workOrderRepository.findOverdue(tenantId);

    console.log(`✅ [WorkOrderApplicationService] Found ${workOrders.length} overdue work orders`);
    return workOrders;
  }

  async getPastScheduleWorkOrders(tenantId: string): Promise<WorkOrder[]> {
    console.log('🔍 [WorkOrderApplicationService] Getting past schedule work orders');

    const workOrders = await this.workOrderRepository.findPastSchedule(tenantId);

    console.log(`✅ [WorkOrderApplicationService] Found ${workOrders.length} past schedule work orders`);
    return workOrders;
  }

  async getWorkOrderStatistics(tenantId: string, fromDate?: Date, toDate?: Date): Promise<any> {
    console.log('📊 [WorkOrderApplicationService] Getting work order statistics');

    const stats = await this.workOrderRepository.getStatistics(tenantId, fromDate, toDate);

    console.log('✅ [WorkOrderApplicationService] Statistics computed');
    return stats;
  }

  async getDashboardMetrics(tenantId: string): Promise<any> {
    console.log('📊 [WorkOrderApplicationService] Getting dashboard metrics');

    const metrics = await this.workOrderRepository.getDashboardMetrics(tenantId);

    console.log('✅ [WorkOrderApplicationService] Dashboard metrics obtained');
    return metrics;
  }

  async getWorkOrderKPIs(tenantId: string, fromDate?: Date, toDate?: Date): Promise<any> {
    console.log('📊 [WorkOrderApplicationService] Getting work order KPIs');

    const kpis = await this.workOrderRepository.getKPIs(tenantId, fromDate, toDate);

    console.log('✅ [WorkOrderApplicationService] KPIs computed');
    return kpis;
  }

  async deleteWorkOrder(tenantId: string, workOrderId: string): Promise<void> {
    console.log('🗑️ [WorkOrderApplicationService] Deleting work order:', workOrderId);

    const workOrder = await this.workOrderRepository.findById(tenantId, workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const workOrderEntity = new WorkOrderEntity(workOrder);

    if (workOrderEntity.isInProgress()) {
      throw new Error('Cannot delete work order in progress');
    }

    await this.workOrderRepository.delete(tenantId, workOrderId);

    console.log('✅ [WorkOrderApplicationService] Work order deleted successfully');
  }
}
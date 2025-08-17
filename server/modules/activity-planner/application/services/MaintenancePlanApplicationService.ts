/**
 * MaintenancePlanApplicationService - Serviço de aplicação para planos de manutenção
 * Orquestra operações de negócio relacionadas a planos preventivos
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { MaintenancePlanEntity, MaintenancePlan, InsertMaintenancePlan } from '../../domain/entities/MaintenancePlan';
import { 
  IMaintenancePlanRepository, 
  MaintenancePlanFilters, 
  MaintenancePlanListOptions 
} from '../../domain/repositories/IMaintenancePlanRepository';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';

export class MaintenancePlanApplicationService {
  constructor(
    private maintenancePlanRepository: IMaintenancePlanRepository,
    private assetRepository: IAssetRepository
  ) {}

  async createMaintenancePlan(
    tenantId: string, 
    planData: InsertMaintenancePlan, 
    createdBy: string
  ): Promise<MaintenancePlan> {
    console.log('🔧 [MaintenancePlanApplicationService] Creating maintenance plan:', planData.name);

    // Verificar se o asset existe
    const asset = await this.assetRepository.findById(tenantId, planData.assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Validar frequência
    if (planData.frequencyJson.interval <= 0) {
      throw new Error('Frequency interval must be positive');
    }

    // Validar tarefas
    if (!planData.tasksTemplateJson || planData.tasksTemplateJson.length === 0) {
      throw new Error('Maintenance plan must have at least one task');
    }

    // Verificar sequência das tarefas
    const sequences = planData.tasksTemplateJson.map(task => task.sequence);
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      throw new Error('Task sequences must be unique');
    }

    // Calcular duração estimada total
    const totalDuration = planData.tasksTemplateJson.reduce(
      (sum, task) => sum + task.estimatedDuration, 
      0
    );

    const plan = await this.maintenancePlanRepository.create(tenantId, {
      ...planData,
      estimatedDuration: totalDuration,
      createdBy
    });

    console.log('✅ [MaintenancePlanApplicationService] Maintenance plan created:', plan.id);
    return plan;
  }

  async getMaintenancePlans(
    tenantId: string,
    filters: MaintenancePlanFilters = {},
    options: MaintenancePlanListOptions = {}
  ): Promise<{
    plans: MaintenancePlan[];
    total: number;
    page: number;
    limit: number;
  }> {
    console.log('🔍 [MaintenancePlanApplicationService] Getting maintenance plans with filters:', filters);
    
    const result = await this.maintenancePlanRepository.findMany(tenantId, filters, options);
    
    console.log(`✅ [MaintenancePlanApplicationService] Found ${result.plans.length} plans`);
    return result;
  }

  async getMaintenancePlanById(tenantId: string, planId: string): Promise<MaintenancePlan | null> {
    console.log('🔍 [MaintenancePlanApplicationService] Getting maintenance plan by ID:', planId);
    
    const plan = await this.maintenancePlanRepository.findById(tenantId, planId);
    
    if (plan) {
      console.log('✅ [MaintenancePlanApplicationService] Plan found:', plan.name);
    }
    
    return plan;
  }

  async getMaintenancePlansByAsset(tenantId: string, assetId: string): Promise<MaintenancePlan[]> {
    console.log('🔍 [MaintenancePlanApplicationService] Getting plans for asset:', assetId);
    
    const plans = await this.maintenancePlanRepository.findByAsset(tenantId, assetId);
    
    console.log(`✅ [MaintenancePlanApplicationService] Found ${plans.length} plans for asset`);
    return plans;
  }

  async updateMaintenancePlan(
    tenantId: string,
    planId: string,
    updates: Partial<MaintenancePlan>,
    updatedBy: string
  ): Promise<MaintenancePlan> {
    console.log('🔧 [MaintenancePlanApplicationService] Updating maintenance plan:', planId);

    // Verificar se existe
    const existingPlan = await this.maintenancePlanRepository.findById(tenantId, planId);
    if (!existingPlan) {
      throw new Error('Maintenance plan not found');
    }

    // Se está mudando o asset, verificar se existe
    if (updates.assetId && updates.assetId !== existingPlan.assetId) {
      const asset = await this.assetRepository.findById(tenantId, updates.assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }
    }

    // Se está atualizando tarefas, recalcular duração
    if (updates.tasksTemplateJson) {
      const totalDuration = updates.tasksTemplateJson.reduce(
        (sum, task) => sum + task.estimatedDuration, 
        0
      );
      updates.estimatedDuration = totalDuration;
    }

    const updatedPlan = await this.maintenancePlanRepository.update(
      tenantId, 
      planId, 
      updates, 
      updatedBy
    );

    console.log('✅ [MaintenancePlanApplicationService] Plan updated successfully');
    return updatedPlan;
  }

  async activateMaintenancePlan(
    tenantId: string, 
    planId: string, 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [MaintenancePlanApplicationService] Activating maintenance plan:', planId);

    await this.maintenancePlanRepository.activate(tenantId, planId, updatedBy);

    console.log('✅ [MaintenancePlanApplicationService] Plan activated successfully');
  }

  async deactivateMaintenancePlan(
    tenantId: string, 
    planId: string, 
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [MaintenancePlanApplicationService] Deactivating maintenance plan:', planId);

    await this.maintenancePlanRepository.deactivate(tenantId, planId, updatedBy);

    console.log('✅ [MaintenancePlanApplicationService] Plan deactivated successfully');
  }

  async deleteMaintenancePlan(tenantId: string, planId: string): Promise<void> {
    console.log('🗑️ [MaintenancePlanApplicationService] Deleting maintenance plan:', planId);

    // Verificar se tem ordens de serviço vinculadas (implementar quando WorkOrder estiver pronto)
    // const workOrders = await this.workOrderRepository.findByMaintenancePlan(tenantId, planId);
    // if (workOrders.length > 0) {
    //   throw new Error('Cannot delete maintenance plan with associated work orders');
    // }

    await this.maintenancePlanRepository.delete(tenantId, planId);

    console.log('✅ [MaintenancePlanApplicationService] Plan deleted successfully');
  }

  async getPlansNeedingGeneration(tenantId: string): Promise<MaintenancePlan[]> {
    console.log('🔍 [MaintenancePlanApplicationService] Getting plans needing generation');

    const plans = await this.maintenancePlanRepository.findDueForGeneration(tenantId);

    console.log(`✅ [MaintenancePlanApplicationService] Found ${plans.length} plans needing generation`);
    return plans;
  }

  async generateWorkOrderFromPlan(
    tenantId: string,
    planId: string,
    scheduledDate?: Date,
    generatedBy?: string
  ): Promise<void> {
    console.log('🔧 [MaintenancePlanApplicationService] Generating work order from plan:', planId);

    const plan = await this.maintenancePlanRepository.findById(tenantId, planId);
    if (!plan) {
      throw new Error('Maintenance plan not found');
    }

    const planEntity = new MaintenancePlanEntity(plan);
    
    if (!planEntity.shouldGenerateWorkOrder()) {
      throw new Error('Plan is not due for generation');
    }

    // Marcar como gerado e atualizar próxima data
    await this.maintenancePlanRepository.markAsGenerated(
      tenantId,
      planId,
      new Date(),
      generatedBy || 'system'
    );

    // TODO: Criar WorkOrder quando o serviço estiver implementado
    console.log('🔄 [MaintenancePlanApplicationService] Work order generation placeholder - implement when WorkOrderService is ready');

    console.log('✅ [MaintenancePlanApplicationService] Work order generation process completed');
  }

  async getMaintenancePlanStatistics(tenantId: string): Promise<{
    total: number;
    active: number;
    byTriggerType: {
      time: number;
      meter: number;
      condition: number;
    };
    byPriority: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    needingGeneration: number;
    averageTasksPerPlan: number;
    averageDuration: number;
  }> {
    console.log('📊 [MaintenancePlanApplicationService] Getting maintenance plan statistics');

    const [
      total,
      activeFilters,
      byTriggerType,
      byPriority,
      needingGeneration,
      allPlans
    ] = await Promise.all([
      this.maintenancePlanRepository.count(tenantId),
      this.maintenancePlanRepository.count(tenantId, { isActive: true }),
      this.maintenancePlanRepository.countByTriggerType(tenantId),
      this.maintenancePlanRepository.countByPriority(tenantId),
      this.maintenancePlanRepository.findDueForGeneration(tenantId),
      this.maintenancePlanRepository.findMany(tenantId, { isActive: true })
    ]);

    // Calcular médias
    const totalTasks = allPlans.plans.reduce((sum, plan) => sum + plan.tasksTemplateJson.length, 0);
    const totalDuration = allPlans.plans.reduce((sum, plan) => sum + plan.estimatedDuration, 0);
    
    const averageTasksPerPlan = allPlans.plans.length > 0 ? Math.round(totalTasks / allPlans.plans.length) : 0;
    const averageDuration = allPlans.plans.length > 0 ? Math.round(totalDuration / allPlans.plans.length) : 0;

    const stats = {
      total,
      active: activeFilters,
      byTriggerType,
      byPriority,
      needingGeneration: needingGeneration.length,
      averageTasksPerPlan,
      averageDuration
    };

    console.log('✅ [MaintenancePlanApplicationService] Statistics computed');
    return stats;
  }

  async processScheduledGeneration(tenantId: string): Promise<{
    processed: number;
    generated: number;
    errors: string[];
  }> {
    console.log('🔄 [MaintenancePlanApplicationService] Processing scheduled generation');

    const plansToGenerate = await this.getPlansNeedingGeneration(tenantId);
    let generated = 0;
    const errors: string[] = [];

    for (const plan of plansToGenerate) {
      try {
        await this.generateWorkOrderFromPlan(tenantId, plan.id, undefined, 'scheduler');
        generated++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Plan ${plan.id}: ${errorMessage}`);
        console.error(`❌ [MaintenancePlanApplicationService] Error generating from plan ${plan.id}:`, error);
      }
    }

    const result = {
      processed: plansToGenerate.length,
      generated,
      errors
    };

    console.log(`✅ [MaintenancePlanApplicationService] Generation completed: ${generated}/${plansToGenerate.length} successful`);
    return result;
  }
}
/**
 * DrizzleMaintenancePlanRepository - Implementação do repositório de planos de manutenção usando Drizzle ORM
 * Persistência de dados de planos de manutenção no PostgreSQL
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { eq, and, sql, desc, asc, ilike, count, lte } from 'drizzle-orm';
import { db } from '../../../../db';
import { MaintenancePlan, InsertMaintenancePlan } from '../../domain/entities/MaintenancePlan';
import { 
  IMaintenancePlanRepository, 
  MaintenancePlanFilters, 
  MaintenancePlanListOptions 
} from '../../domain/repositories/IMaintenancePlanRepository';
import { maintenancePlans } from '@shared/schema-activity-planner';

export class DrizzleMaintenancePlanRepository implements IMaintenancePlanRepository {
  async create(tenantId: string, planData: InsertMaintenancePlan): Promise<MaintenancePlan> {
    console.log('🔧 [DrizzleMaintenancePlanRepository] Creating maintenance plan:', planData.name);
    
    const [newPlan] = await db
      .insert(maintenancePlans)
      .values({
        ...planData,
        tenantId,
        updatedBy: planData.createdBy
      })
      .returning();

    console.log('✅ [DrizzleMaintenancePlanRepository] Plan created:', newPlan.id);
    return newPlan;
  }

  async findById(tenantId: string, id: string): Promise<MaintenancePlan | null> {
    console.log('🔍 [DrizzleMaintenancePlanRepository] Finding plan by ID:', id);
    
    const [plan] = await db
      .select()
      .from(maintenancePlans)
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ))
      .limit(1);

    return plan || null;
  }

  async findByAsset(tenantId: string, assetId: string): Promise<MaintenancePlan[]> {
    console.log('🔍 [DrizzleMaintenancePlanRepository] Finding plans by asset:', assetId);
    
    const plans = await db
      .select()
      .from(maintenancePlans)
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.assetId, assetId)
      ))
      .orderBy(asc(maintenancePlans.name));

    console.log(`✅ [DrizzleMaintenancePlanRepository] Found ${plans.length} plans for asset`);
    return plans;
  }

  async findMany(
    tenantId: string, 
    filters: MaintenancePlanFilters = {}, 
    options: MaintenancePlanListOptions = {}
  ): Promise<{
    plans: MaintenancePlan[];
    total: number;
    page: number;
    limit: number;
  }> {
    console.log('🔍 [DrizzleMaintenancePlanRepository] Finding plans with filters:', filters);
    
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = options;
    
    // Construir condições
    const conditions = [
      eq(maintenancePlans.tenantId, tenantId)
    ];

    if (filters.assetId) {
      conditions.push(eq(maintenancePlans.assetId, filters.assetId));
    }

    if (filters.triggerType) {
      conditions.push(eq(maintenancePlans.triggerType, filters.triggerType));
    }

    if (filters.priority) {
      conditions.push(eq(maintenancePlans.priority, filters.priority));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(maintenancePlans.isActive, filters.isActive));
    }

    if (filters.effectiveFrom) {
      conditions.push(sql`${maintenancePlans.effectiveFrom} >= ${filters.effectiveFrom}`);
    }

    if (filters.effectiveTo) {
      conditions.push(sql`${maintenancePlans.effectiveTo} <= ${filters.effectiveTo}`);
    }

    if (filters.nextScheduledBefore) {
      conditions.push(sql`${maintenancePlans.nextScheduledAt} <= ${filters.nextScheduledBefore}`);
    }

    if (filters.needsGeneration) {
      conditions.push(eq(maintenancePlans.isActive, true));
      conditions.push(sql`${maintenancePlans.nextScheduledAt} <= NOW()`);
    }

    let query = db
      .select()
      .from(maintenancePlans)
      .where(and(...conditions));

    // Aplicar ordenação
    const orderBy = sortOrder === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'priority':
        query = query.orderBy(orderBy(maintenancePlans.priority));
        break;
      case 'nextScheduledAt':
        query = query.orderBy(orderBy(maintenancePlans.nextScheduledAt));
        break;
      case 'lastGeneratedAt':
        query = query.orderBy(orderBy(maintenancePlans.lastGeneratedAt));
        break;
      case 'createdAt':
        query = query.orderBy(orderBy(maintenancePlans.createdAt));
        break;
      default:
        query = query.orderBy(orderBy(maintenancePlans.name));
    }

    // Paginação
    const offset = (page - 1) * limit;
    const paginatedQuery = query.limit(limit).offset(offset);

    // Contar total
    const totalQuery = db
      .select({ count: count() })
      .from(maintenancePlans)
      .where(and(...conditions));

    const [plans, totalResult] = await Promise.all([
      paginatedQuery,
      totalQuery
    ]);

    console.log(`✅ [DrizzleMaintenancePlanRepository] Found ${plans.length} plans`);
    
    return {
      plans,
      total: totalResult[0]?.count || 0,
      page,
      limit
    };
  }

  async findDueForGeneration(tenantId: string, beforeDate?: Date): Promise<MaintenancePlan[]> {
    console.log('🔍 [DrizzleMaintenancePlanRepository] Finding plans due for generation');
    
    const targetDate = beforeDate || new Date();
    
    const plans = await db
      .select()
      .from(maintenancePlans)
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.isActive, true),
        sql`${maintenancePlans.nextScheduledAt} <= ${targetDate}`
      ))
      .orderBy(asc(maintenancePlans.nextScheduledAt));

    console.log(`✅ [DrizzleMaintenancePlanRepository] Found ${plans.length} plans due for generation`);
    return plans;
  }

  async update(tenantId: string, id: string, updates: Partial<MaintenancePlan>, updatedBy: string): Promise<MaintenancePlan> {
    console.log('🔧 [DrizzleMaintenancePlanRepository] Updating plan:', id);
    
    const [updatedPlan] = await db
      .update(maintenancePlans)
      .set({
        ...updates,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ))
      .returning();

    if (!updatedPlan) {
      throw new Error('Maintenance plan not found');
    }

    console.log('✅ [DrizzleMaintenancePlanRepository] Plan updated successfully');
    return updatedPlan;
  }

  async updateNextScheduleDate(tenantId: string, id: string, nextDate: Date, updatedBy: string): Promise<void> {
    console.log('🔧 [DrizzleMaintenancePlanRepository] Updating next schedule date:', { id, nextDate });
    
    await db
      .update(maintenancePlans)
      .set({
        nextScheduledAt: nextDate,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ));

    console.log('✅ [DrizzleMaintenancePlanRepository] Schedule date updated');
  }

  async markAsGenerated(tenantId: string, id: string, generatedAt: Date, updatedBy: string): Promise<void> {
    console.log('🔧 [DrizzleMaintenancePlanRepository] Marking plan as generated:', id);
    
    const [plan] = await db
      .select()
      .from(maintenancePlans)
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ))
      .limit(1);

    if (!plan) {
      throw new Error('Maintenance plan not found');
    }

    await db
      .update(maintenancePlans)
      .set({
        lastGeneratedAt: generatedAt,
        generationCount: sql`${maintenancePlans.generationCount} + 1`,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ));

    console.log('✅ [DrizzleMaintenancePlanRepository] Plan marked as generated');
  }

  async activate(tenantId: string, id: string, updatedBy: string): Promise<void> {
    console.log('🔧 [DrizzleMaintenancePlanRepository] Activating plan:', id);
    
    await db
      .update(maintenancePlans)
      .set({
        isActive: true,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ));

    console.log('✅ [DrizzleMaintenancePlanRepository] Plan activated');
  }

  async deactivate(tenantId: string, id: string, updatedBy: string): Promise<void> {
    console.log('🔧 [DrizzleMaintenancePlanRepository] Deactivating plan:', id);
    
    await db
      .update(maintenancePlans)
      .set({
        isActive: false,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ));

    console.log('✅ [DrizzleMaintenancePlanRepository] Plan deactivated');
  }

  async delete(tenantId: string, id: string): Promise<void> {
    console.log('🗑️ [DrizzleMaintenancePlanRepository] Deleting plan:', id);
    
    await db
      .delete(maintenancePlans)
      .where(and(
        eq(maintenancePlans.tenantId, tenantId),
        eq(maintenancePlans.id, id)
      ));

    console.log('✅ [DrizzleMaintenancePlanRepository] Plan deleted');
  }

  async count(tenantId: string, filters: MaintenancePlanFilters = {}): Promise<number> {
    console.log('🔢 [DrizzleMaintenancePlanRepository] Counting plans with filters:', filters);
    
    const conditions = [
      eq(maintenancePlans.tenantId, tenantId)
    ];

    if (filters.assetId) {
      conditions.push(eq(maintenancePlans.assetId, filters.assetId));
    }

    if (filters.triggerType) {
      conditions.push(eq(maintenancePlans.triggerType, filters.triggerType));
    }

    if (filters.priority) {
      conditions.push(eq(maintenancePlans.priority, filters.priority));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(maintenancePlans.isActive, filters.isActive));
    }

    const [result] = await db
      .select({ count: count() })
      .from(maintenancePlans)
      .where(and(...conditions));

    return result?.count || 0;
  }

  async countByTriggerType(tenantId: string): Promise<{
    time: number;
    meter: number;
    condition: number;
  }> {
    console.log('🔢 [DrizzleMaintenancePlanRepository] Counting plans by trigger type');
    
    const results = await db
      .select({
        triggerType: maintenancePlans.triggerType,
        count: count()
      })
      .from(maintenancePlans)
      .where(eq(maintenancePlans.tenantId, tenantId))
      .groupBy(maintenancePlans.triggerType);

    const counts = {
      time: 0,
      meter: 0,
      condition: 0
    };

    results.forEach((result: any) => {
      if (result.triggerType in counts) {
        counts[result.triggerType as keyof typeof counts] = result.count;
      }
    });

    return counts;
  }

  async countByPriority(tenantId: string): Promise<{
    low: number;
    medium: number;
    high: number;
    critical: number;
  }> {
    console.log('🔢 [DrizzleMaintenancePlanRepository] Counting plans by priority');
    
    const results = await db
      .select({
        priority: maintenancePlans.priority,
        count: count()
      })
      .from(maintenancePlans)
      .where(eq(maintenancePlans.tenantId, tenantId))
      .groupBy(maintenancePlans.priority);

    const counts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    results.forEach((result: any) => {
      if (result.priority in counts) {
        counts[result.priority as keyof typeof counts] = result.count;
      }
    });

    return counts;
  }

  async getGenerationStatistics(tenantId: string, fromDate?: Date, toDate?: Date): Promise<{
    totalGenerated: number;
    byPriority: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    avgGenerationTime: number;
    successRate: number;
  }> {
    console.log('📊 [DrizzleMaintenancePlanRepository] Getting generation statistics');
    
    const conditions = [
      eq(maintenancePlans.tenantId, tenantId),
      sql`${maintenancePlans.lastGeneratedAt} IS NOT NULL`
    ];

    if (fromDate) {
      conditions.push(sql`${maintenancePlans.lastGeneratedAt} >= ${fromDate}`);
    }

    if (toDate) {
      conditions.push(sql`${maintenancePlans.lastGeneratedAt} <= ${toDate}`);
    }

    // Total gerado
    const [totalResult] = await db
      .select({ count: count() })
      .from(maintenancePlans)
      .where(and(...conditions));

    // Por prioridade
    const priorityResults = await db
      .select({
        priority: maintenancePlans.priority,
        count: count()
      })
      .from(maintenancePlans)
      .where(and(...conditions))
      .groupBy(maintenancePlans.priority);

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    priorityResults.forEach((result: any) => {
      if (result.priority in byPriority) {
        byPriority[result.priority as keyof typeof byPriority] = result.count;
      }
    });

    // Tempo médio de geração (placeholder - necessita tabela de work_orders)
    const avgGenerationTime = 0;
    
    // Taxa de sucesso (placeholder - necessita métricas de falhas)
    const successRate = 100;

    return {
      totalGenerated: totalResult?.count || 0,
      byPriority,
      avgGenerationTime,
      successRate
    };
  }
}
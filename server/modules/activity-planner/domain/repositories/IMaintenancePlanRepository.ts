/**
 * IMaintenancePlanRepository - Interface do repositório de planos de manutenção
 * Define contratos para operações de persistência de planos de manutenção
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { MaintenancePlan, InsertMaintenancePlan } from '../entities/MaintenancePlan';

export interface MaintenancePlanFilters {
  assetId?: string;
  triggerType?: 'time' | 'meter' | 'condition';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  isActive?: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  nextScheduledBefore?: Date;
  needsGeneration?: boolean;
}

export interface MaintenancePlanListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'priority' | 'nextScheduledAt' | 'lastGeneratedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface IMaintenancePlanRepository {
  create(tenantId: string, plan: InsertMaintenancePlan): Promise<MaintenancePlan>;
  
  findById(tenantId: string, id: string): Promise<MaintenancePlan | null>;
  
  findByAsset(tenantId: string, assetId: string): Promise<MaintenancePlan[]>;
  
  findMany(
    tenantId: string, 
    filters?: MaintenancePlanFilters, 
    options?: MaintenancePlanListOptions
  ): Promise<{
    plans: MaintenancePlan[];
    total: number;
    page: number;
    limit: number;
  }>;
  
  findDueForGeneration(tenantId: string, beforeDate?: Date): Promise<MaintenancePlan[]>;
  
  update(tenantId: string, id: string, updates: Partial<MaintenancePlan>, updatedBy: string): Promise<MaintenancePlan>;
  
  updateNextScheduleDate(tenantId: string, id: string, nextDate: Date, updatedBy: string): Promise<void>;
  
  markAsGenerated(tenantId: string, id: string, generatedAt: Date, updatedBy: string): Promise<void>;
  
  activate(tenantId: string, id: string, updatedBy: string): Promise<void>;
  
  deactivate(tenantId: string, id: string, updatedBy: string): Promise<void>;
  
  delete(tenantId: string, id: string): Promise<void>;
  
  count(tenantId: string, filters?: MaintenancePlanFilters): Promise<number>;
  
  countByTriggerType(tenantId: string): Promise<{
    time: number;
    meter: number;
    condition: number;
  }>;
  
  countByPriority(tenantId: string): Promise<{
    low: number;
    medium: number;
    high: number;
    critical: number;
  }>;
  
  getGenerationStatistics(tenantId: string, fromDate?: Date, toDate?: Date): Promise<{
    totalGenerated: number;
    byPriority: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    avgGenerationTime: number;
    successRate: number;
  }>;
}
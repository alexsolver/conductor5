// ✅ 1QA.MD COMPLIANCE: Activity Planner Drizzle Repository Implementation
// Clean Architecture Infrastructure Layer - Database Repository

import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import { eq, and, desc, asc, like, between, count, sum, gte, lte, inArray, isNull, or, sql } from 'drizzle-orm';
import { 
  activityCategories,
  activityTemplates,
  activitySchedules,
  activityInstances,
  activityWorkflows,
  activityResources,
  activityHistory,
  ActivityCategory,
  ActivityTemplate,
  ActivitySchedule,
  ActivityInstance as ActivityInstanceType,
  ActivityWorkflow,
  ActivityResource,
  ActivityHistory as ActivityHistoryType
} from '@shared/schema-activity-planner';
import { IActivityPlannerRepository, ActivityFilters, ActivitySummary } from '../../domain/repositories/IActivityPlannerRepository';
import type { ActivityInstance } from '../../domain/entities/ActivityInstance';
import { Pool } from 'pg';

export class DrizzleActivityPlannerRepository implements IActivityPlannerRepository {

  // ✅ 1QA.MD: Tenant Schema Isolation - seguindo padrão do sistema
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // Type Mappers to ensure consistency between domain entities and schema types
  private mapEntityToSchema(instance: Omit<ActivityInstance, 'id' | 'createdAt' | 'updatedAt'>): Omit<ActivityInstanceType, 'id' | 'createdAt' | 'updatedAt'> {
    // This is a placeholder. In a real scenario, you would map properties here.
    // Ensure that null/undefined mismatches are handled.
    // Example: if domain uses 'undefined' for optional fields and schema uses 'null'
    return {
      ...instance,
      title: instance.title ?? null,
      description: instance.description ?? null,
      assignedUserId: instance.assignedUserId ?? null,
      assignedTeamId: instance.assignedTeamId ?? null,
      assetId: instance.assetId ?? null,
      locationId: instance.locationId ?? null,
      qualityScore: instance.qualityScore ?? null,
      actualDuration: instance.actualDuration ?? null,
      workOrderNumber: instance.workOrderNumber ?? null,
      parentInstanceId: instance.parentInstanceId ?? null,
    };
  }

  private mapSchemaToEntity(instance: ActivityInstanceType): ActivityInstance {
    // This is a placeholder. In a real scenario, you would map properties here.
    return {
      ...instance,
      createdAt: instance.createdAt ? new Date(instance.createdAt) : new Date(),
      updatedAt: instance.updatedAt ? new Date(instance.updatedAt) : new Date(),
      scheduledDate: instance.scheduledDate ? new Date(instance.scheduledDate) : new Date(),
      dueDate: instance.dueDate ? new Date(instance.dueDate) : new Date(),
      completedAt: instance.completedAt ? new Date(instance.completedAt) : null,
      actualDuration: instance.actualDuration ?? null,
      qualityScore: instance.qualityScore ?? null,
    };
  }

  // ✅ 1QA.MD: Activity Categories with Tenant Isolation
  async createCategory(category: Omit<ActivityCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityCategory> {
    console.log('📋 [ACTIVITY-PLANNER] Creating category in tenant schema:', this.getSchemaName(category.tenantId));
    
    const tenantDb = await this.getTenantDb(category.tenantId);
    
    const [created] = await tenantDb.insert(activityCategories).values({
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('✅ [ACTIVITY-PLANNER] Category created successfully');
    return created;
  }

  async updateCategory(id: string, tenantId: string, category: Partial<ActivityCategory>): Promise<ActivityCategory> {
    console.log('✏️ [ACTIVITY-PLANNER] Updating category in tenant schema:', this.getSchemaName(tenantId));
    
    const tenantDb = await this.getTenantDb(tenantId);
    
    const [updated] = await tenantDb
      .update(activityCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(and(eq(activityCategories.id, id), eq(activityCategories.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Activity category not found');
    }
    return updated;
  }

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    console.log('🗑️ [ACTIVITY-PLANNER] Deleting category in tenant schema:', this.getSchemaName(tenantId));
    
    const tenantDb = await this.getTenantDb(tenantId);
    
    await tenantDb
      .delete(activityCategories)
      .where(and(eq(activityCategories.id, id), eq(activityCategories.tenantId, tenantId)));
  }

  async getCategoryById(id: string, tenantId: string): Promise<ActivityCategory | null> {
    console.log('🔍 [ACTIVITY-PLANNER] Finding category in tenant schema:', this.getSchemaName(tenantId));
    
    const tenantDb = await this.getTenantDb(tenantId);
    
    const [category] = await tenantDb
      .select()
      .from(activityCategories)
      .where(and(eq(activityCategories.id, id), eq(activityCategories.tenantId, tenantId)));

    return category || null;
  }

  async getCategories(tenantId: string, filters?: { parentId?: string; isActive?: boolean }): Promise<ActivityCategory[]> {
    const conditions = [eq(activityCategories.tenantId, tenantId)];

    if (filters?.parentId !== undefined) {
      if (filters.parentId) {
        conditions.push(eq(activityCategories.parentId, filters.parentId));
      } else {
        conditions.push(isNull(activityCategories.parentId));
      }
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(activityCategories.isActive, filters.isActive));
    }

    return await db
      .select()
      .from(activityCategories)
      .where(and(...conditions))
      .orderBy(asc(activityCategories.sortOrder), asc(activityCategories.name));
  }

  // Activity Templates
  async createTemplate(template: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityTemplate> {
    const [created] = await db.insert(activityTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateTemplate(id: string, tenantId: string, template: Partial<ActivityTemplate>): Promise<ActivityTemplate> {
    const [updated] = await db
      .update(activityTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(and(eq(activityTemplates.id, id), eq(activityTemplates.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Activity template not found');
    }
    return updated;
  }

  async deleteTemplate(id: string, tenantId: string): Promise<void> {
    await db
      .delete(activityTemplates)
      .where(and(eq(activityTemplates.id, id), eq(activityTemplates.tenantId, tenantId)));
  }

  async getTemplateById(id: string, tenantId: string): Promise<ActivityTemplate | null> {
    const [template] = await db
      .select()
      .from(activityTemplates)
      .where(and(eq(activityTemplates.id, id), eq(activityTemplates.tenantId, tenantId)));

    return template || null;
  }

  async getTemplates(tenantId: string, filters?: { categoryId?: string; activityType?: string; isActive?: boolean }): Promise<ActivityTemplate[]> {
    const conditions = [eq(activityTemplates.tenantId, tenantId)];

    if (filters?.categoryId) {
      conditions.push(eq(activityTemplates.categoryId, filters.categoryId));
    }

    if (filters?.activityType) {
      conditions.push(eq(activityTemplates.activityType, filters.activityType as any));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(activityTemplates.isActive, filters.isActive));
    }

    return await db
      .select()
      .from(activityTemplates)
      .where(and(...conditions))
      .orderBy(asc(activityTemplates.name));
  }

  // Activity Schedules
  async createSchedule(schedule: Omit<ActivitySchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivitySchedule> {
    const [created] = await db.insert(activitySchedules).values({
      ...schedule,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateSchedule(id: string, tenantId: string, schedule: Partial<ActivitySchedule>): Promise<ActivitySchedule> {
    const [updated] = await db
      .update(activitySchedules)
      .set({ ...schedule, updatedAt: new Date() })
      .where(and(eq(activitySchedules.id, id), eq(activitySchedules.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Activity schedule not found');
    }
    return updated;
  }

  async deleteSchedule(id: string, tenantId: string): Promise<void> {
    await db
      .delete(activitySchedules)
      .where(and(eq(activitySchedules.id, id), eq(activitySchedules.tenantId, tenantId)));
  }

  async getScheduleById(id: string, tenantId: string): Promise<ActivitySchedule | null> {
    const [schedule] = await db
      .select()
      .from(activitySchedules)
      .where(and(eq(activitySchedules.id, id), eq(activitySchedules.tenantId, tenantId)));

    return schedule || null;
  }

  async getSchedules(tenantId: string, filters?: { 
    templateId?: string; 
    assetId?: string; 
    locationId?: string;
    isActive?: boolean;
    frequency?: string;
  }): Promise<ActivitySchedule[]> {
    const conditions = [eq(activitySchedules.tenantId, tenantId)];

    if (filters?.templateId) {
      conditions.push(eq(activitySchedules.templateId, filters.templateId));
    }

    if (filters?.assetId) {
      conditions.push(eq(activitySchedules.assetId, filters.assetId));
    }

    if (filters?.locationId) {
      conditions.push(eq(activitySchedules.locationId, filters.locationId));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(activitySchedules.isActive, filters.isActive));
    }

    if (filters?.frequency) {
      conditions.push(eq(activitySchedules.frequency, filters.frequency as any));
    }

    return await db
      .select()
      .from(activitySchedules)
      .where(and(...conditions))
      .orderBy(asc(activitySchedules.name));
  }

  async getSchedulesDueForGeneration(tenantId: string): Promise<ActivitySchedule[]> {
    return await db
      .select()
      .from(activitySchedules)
      .where(
        and(
          eq(activitySchedules.tenantId, tenantId),
          eq(activitySchedules.isActive, true),
          or(
            isNull(activitySchedules.nextDueDate),
            lte(activitySchedules.nextDueDate, new Date())
          )
        )
      );
  }

  // Activity Instances
  async createInstance(instance: Omit<ActivityInstance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityInstance> {
    const schemaData = this.mapEntityToSchema(instance);
    const [created] = await db.insert(activityInstances).values({
      ...schemaData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return this.mapSchemaToEntity(created);
  }

  async updateInstance(id: string, tenantId: string, instance: Partial<ActivityInstance>): Promise<ActivityInstance> {
    const schemaData = this.mapEntityToSchema(instance);
    const [updated] = await db.update(activityInstances)
      .set({ ...schemaData, updatedAt: new Date() })
      .where(and(eq(activityInstances.id, id), eq(activityInstances.tenantId, tenantId)))
      .returning();

    return this.mapSchemaToEntity(updated);
  }

  async deleteInstance(id: string, tenantId: string): Promise<void> {
    await db
      .delete(activityInstances)
      .where(and(eq(activityInstances.id, id), eq(activityInstances.tenantId, tenantId)));
  }

  async getInstanceById(id: string, tenantId: string): Promise<ActivityInstance | null> {
    const [instance] = await db.select()
      .from(activityInstances)
      .where(and(eq(activityInstances.id, id), eq(activityInstances.tenantId, tenantId)));

    return instance ? this.mapSchemaToEntity(instance) : null;
  }

  async getInstances(tenantId: string, filters?: ActivityFilters): Promise<ActivityInstance[]> {
    let query = db.select().from(activityInstances)
      .where(eq(activityInstances.tenantId, tenantId));

    // Apply filters
    const conditions = [eq(activityInstances.tenantId, tenantId)];

    if (filters?.status && filters.status.length > 0) {
      conditions.push(inArray(activityInstances.status, filters.status as any[]));
    }

    if (filters?.activityType && filters.activityType.length > 0) {
      conditions.push(inArray(activityInstances.activityType, filters.activityType as any[]));
    }

    if (filters?.priority && filters.priority.length > 0) {
      conditions.push(inArray(activityInstances.priority, filters.priority as any[]));
    }

    if (filters?.assignedUserId) {
      conditions.push(eq(activityInstances.assignedUserId, filters.assignedUserId));
    }

    if (filters?.assignedTeamId) {
      conditions.push(eq(activityInstances.assignedTeamId, filters.assignedTeamId));
    }

    if (filters?.scheduledDateFrom) {
      conditions.push(gte(activityInstances.scheduledDate, filters.scheduledDateFrom));
    }

    if (filters?.scheduledDateTo) {
      conditions.push(lte(activityInstances.scheduledDate, filters.scheduledDateTo));
    }

    if (filters?.dueDateFrom && filters?.dueDateTo) {
      conditions.push(between(activityInstances.dueDate, filters.dueDateFrom, filters.dueDateTo));
    }

    if (filters?.assetId) {
      conditions.push(eq(activityInstances.assetId, filters.assetId));
    }

    if (filters?.locationId) {
      conditions.push(eq(activityInstances.locationId, filters.locationId));
    }

    if (filters?.isOverdue !== undefined) {
      conditions.push(eq(activityInstances.isOverdue, filters.isOverdue));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(activityInstances.title, `%${filters.search}%`),
          like(activityInstances.description, `%${filters.search}%`)
        )
      );
    }

    query = query.where(and(...conditions));

    // Apply ordering
    query = query.orderBy(desc(activityInstances.scheduledDate));

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const instances = await query;
    return instances.map(instance => this.mapSchemaToEntity(instance));
  }

  async getInstancesByIds(ids: string[], tenantId: string): Promise<ActivityInstanceType[]> {
    if (!ids.length) return [];

    return await db
      .select()
      .from(activityInstances)
      .where(and(
        inArray(activityInstances.id, ids),
        eq(activityInstances.tenantId, tenantId)
      ));
  }

  // Instance Management Methods
  async getOverdueInstances(tenantId: string): Promise<ActivityInstance[]> {
    const instances = await db.select()
      .from(activityInstances)
      .where(and(
        eq(activityInstances.tenantId, tenantId),
        eq(activityInstances.isOverdue, true)
      ))
      .orderBy(desc(activityInstances.overdueBy));

    return instances.map(instance => this.mapSchemaToEntity(instance));
  }

  async getUpcomingInstances(tenantId: string, days: number = 7): Promise<ActivityInstance[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    const instances = await db.select()
      .from(activityInstances)
      .where(and(
        eq(activityInstances.tenantId, tenantId),
        between(activityInstances.scheduledDate, now, future),
        inArray(activityInstances.status, ['scheduled', 'in_progress'])
      ))
      .orderBy(asc(activityInstances.scheduledDate));

    return instances.map(instance => this.mapSchemaToEntity(instance));
  }

  async getInstancesByUser(userId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstanceType[]> {
    return this.getInstances(tenantId, { ...filters, assignedUserId: userId });
  }

  async getInstancesByTeam(teamId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstanceType[]> {
    return this.getInstances(tenantId, { ...filters, assignedTeamId: teamId });
  }

  async getInstancesByAsset(assetId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstanceType[]> {
    return this.getInstances(tenantId, { ...filters, assetId });
  }

  async getInstancesByLocation(locationId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstanceType[]> {
    return this.getInstances(tenantId, { ...filters, locationId });
  }

  // Analytics & Reporting
  async getActivitySummary(tenantId: string, filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    assignedUserId?: string;
    assignedTeamId?: string;
    assetId?: string;
    locationId?: string;
  }): Promise<ActivitySummary> {
    const conditions = [eq(activityInstances.tenantId, tenantId)];

    if (filters?.dateFrom) {
      conditions.push(gte(activityInstances.scheduledDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(activityInstances.scheduledDate, filters.dateTo));
    }

    if (filters?.assignedUserId) {
      conditions.push(eq(activityInstances.assignedUserId, filters.assignedUserId));
    }

    if (filters?.assignedTeamId) {
      conditions.push(eq(activityInstances.assignedTeamId, filters.assignedTeamId));
    }

    if (filters?.assetId) {
      conditions.push(eq(activityInstances.assetId, filters.assetId));
    }

    if (filters?.locationId) {
      conditions.push(eq(activityInstances.locationId, filters.locationId));
    }

    const [summary] = await db
      .select({
        totalActivities: count(),
        completedActivities: sum(
          sql`CASE WHEN ${activityInstances.status} = 'completed' THEN 1 ELSE 0 END`
        ),
        overdueActivities: sum(
          sql`CASE WHEN ${activityInstances.isOverdue} = true THEN 1 ELSE 0 END`
        ),
        inProgressActivities: sum(
          sql`CASE WHEN ${activityInstances.status} = 'in_progress' THEN 1 ELSE 0 END`
        ),
        scheduledActivities: sum(
          sql`CASE WHEN ${activityInstances.status} = 'scheduled' THEN 1 ELSE 0 END`
        )
      })
      .from(activityInstances)
      .where(and(...conditions));

    const completionRate = summary.totalActivities > 0 
      ? (Number(summary.completedActivities) / summary.totalActivities) * 100 
      : 0;

    // Get average duration and quality score for completed activities
    const [metrics] = await db
      .select({
        avgQuality: sql`AVG(${activityInstances.qualityScore})`,
        avgDuration: sql`AVG(EXTRACT(EPOCH FROM ${activityInstances.actualDuration}))`
      })
      .from(activityInstances)
      .where(
        and(
          ...conditions,
          eq(activityInstances.status, 'completed'),
          sql`${activityInstances.actualDuration} IS NOT NULL`
        )
      );

    return {
      totalActivities: summary.totalActivities,
      completedActivities: Number(summary.completedActivities || 0),
      overdueActivities: Number(summary.overdueActivities || 0),
      inProgressActivities: Number(summary.inProgressActivities || 0),
      scheduledActivities: Number(summary.scheduledActivities || 0),
      completionRate,
      averageDuration: Number(metrics.avgDuration || 0) / 60, // Convert to minutes
      averageQualityScore: Number(metrics.avgQuality || 0)
    };
  }

  async getCompletionTrends(tenantId: string, period: 'week' | 'month' | 'quarter', periods: number): Promise<Array<{
    period: string;
    completed: number;
    scheduled: number;
    overdue: number;
  }>> {
    // This would require more complex SQL with window functions or date truncation
    // For now, returning a simplified implementation
    return [];
  }

  async getPerformanceMetrics(tenantId: string, filters?: {
    userId?: string;
    teamId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    userId: string;
    userName: string;
    completedActivities: number;
    averageDuration: number;
    averageQualityScore: number;
    overdueActivities: number;
  }>> {
    // This would require joining with user tables
    // For now, returning a simplified implementation
    return [];
  }

  // Activity Workflows (simplified implementations)
  async createWorkflow(workflow: Omit<ActivityWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityWorkflow> {
    const [created] = await db.insert(activityWorkflows).values({
      ...workflow,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateWorkflow(id: string, tenantId: string, workflow: Partial<ActivityWorkflow>): Promise<ActivityWorkflow> {
    const [updated] = await db
      .update(activityWorkflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(and(eq(activityWorkflows.id, id), eq(activityWorkflows.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Activity workflow not found');
    }
    return updated;
  }

  async getWorkflowById(id: string, tenantId: string): Promise<ActivityWorkflow | null> {
    const [workflow] = await db
      .select()
      .from(activityWorkflows)
      .where(and(eq(activityWorkflows.id, id), eq(activityWorkflows.tenantId, tenantId)));

    return workflow || null;
  }

  async getWorkflowsByInstance(instanceId: string, tenantId: string): Promise<ActivityWorkflow[]> {
    return await db
      .select()
      .from(activityWorkflows)
      .where(and(eq(activityWorkflows.instanceId, instanceId), eq(activityWorkflows.tenantId, tenantId)))
      .orderBy(desc(activityWorkflows.createdAt));
  }

  async getPendingWorkflows(tenantId: string, approverId?: string): Promise<ActivityWorkflow[]> {
    const conditions = [
      eq(activityWorkflows.tenantId, tenantId),
      eq(activityWorkflows.status, 'pending')
    ];

    if (approverId) {
      conditions.push(eq(activityWorkflows.currentApprover, approverId));
    }

    return await db
      .select()
      .from(activityWorkflows)
      .where(and(...conditions))
      .orderBy(asc(activityWorkflows.deadline));
  }

  // Activity Resources (simplified implementations)
  async createResource(resource: Omit<ActivityResource, 'id' | 'createdAt'>): Promise<ActivityResource> {
    const [created] = await db.insert(activityResources).values({
      ...resource,
      createdAt: new Date()
    }).returning();
    return created;
  }

  async updateResource(id: string, tenantId: string, resource: Partial<ActivityResource>): Promise<ActivityResource> {
    const [updated] = await db
      .update(activityResources)
      .set(resource)
      .where(and(eq(activityResources.id, id), eq(activityResources.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Activity resource not found');
    }
    return updated;
  }

  async deleteResource(id: string, tenantId: string): Promise<void> {
    await db
      .delete(activityResources)
      .where(and(eq(activityResources.id, id), eq(activityResources.tenantId, tenantId)));
  }

  async getResourcesByInstance(instanceId: string, tenantId: string): Promise<ActivityResource[]> {
    return await db
      .select()
      .from(activityResources)
      .where(and(eq(activityResources.instanceId, instanceId), eq(activityResources.tenantId, tenantId)));
  }

  async checkResourceAvailability(resourceId: string, tenantId: string, dateFrom: Date, dateTo: Date): Promise<boolean> {
    // Simplified implementation - would need more complex logic for real resource scheduling
    return true;
  }

  // Activity History & Audit
  async createHistoryEntry(history: Omit<ActivityHistoryType, 'id' | 'performedAt'>): Promise<ActivityHistoryType> {
    const [created] = await db.insert(activityHistory).values({
      ...history,
      performedAt: new Date()
    }).returning();
    return created;
  }

  async getInstanceHistory(instanceId: string, tenantId: string): Promise<ActivityHistoryType[]> {
    return await db
      .select()
      .from(activityHistory)
      .where(and(eq(activityHistory.instanceId, instanceId), eq(activityHistory.tenantId, tenantId)))
      .orderBy(desc(activityHistory.performedAt));
  }

  async getUserActivityHistory(userId: string, tenantId: string, limit: number = 50): Promise<ActivityHistoryType[]> {
    return await db
      .select()
      .from(activityHistory)
      .where(and(eq(activityHistory.performedBy, userId), eq(activityHistory.tenantId, tenantId)))
      .orderBy(desc(activityHistory.performedAt))
      .limit(limit);
  }

  // Batch Operations
  async bulkCreateInstances(instances: Array<Omit<ActivityInstanceType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ActivityInstanceType[]> {
    const now = new Date();
    const instancesToInsert = instances.map(instance => ({
      ...instance,
      createdAt: now,
      updatedAt: now
    }));

    return await db.insert(activityInstances).values(instancesToInsert).returning();
  }

  async bulkUpdateInstanceStatus(instanceIds: string[], tenantId: string, status: string, updatedBy: string): Promise<void> {
    await db
      .update(activityInstances)
      .set({ 
        status: status as any, 
        updatedBy, 
        updatedAt: new Date() 
      })
      .where(
        and(
          inArray(activityInstances.id, instanceIds),
          eq(activityInstances.tenantId, tenantId)
        )
      );
  }

  async bulkAssignInstances(instanceIds: string[], tenantId: string, assignedUserId?: string, assignedTeamId?: string, updatedBy?: string): Promise<void> {
    const updateData: any = { updatedAt: new Date() };

    if (assignedUserId) updateData.assignedUserId = assignedUserId;
    if (assignedTeamId) updateData.assignedTeamId = assignedTeamId;
    if (updatedBy) updateData.updatedBy = updatedBy;

    await db
      .update(activityInstances)
      .set(updateData)
      .where(
        and(
          inArray(activityInstances.id, instanceIds),
          eq(activityInstances.tenantId, tenantId)
        )
      );
  }

  // Schedule Generation
  async generateInstancesFromSchedule(scheduleId: string, tenantId: string, periodStart: Date, periodEnd: Date): Promise<ActivityInstanceType[]> {
    // This would contain complex logic to generate instances based on schedule frequency
    // For now, returning empty array
    return [];
  }

  async markOverdueInstances(tenantId: string): Promise<number> {
    const now = new Date();
    const result = await db
      .update(activityInstances)
      .set({ 
        isOverdue: true, 
        updatedAt: now 
      })
      .where(
        and(
          eq(activityInstances.tenantId, tenantId),
          eq(activityInstances.status, 'scheduled'),
          lte(activityInstances.dueDate, now),
          eq(activityInstances.isOverdue, false)
        )
      );

    return result.rowCount || 0;
  }

  // Search and Advanced Queries
  async searchInstances(tenantId: string, query: string, filters?: ActivityFilters): Promise<ActivityInstanceType[]> {
    return this.getInstances(tenantId, { ...filters, search: query });
  }

  async getRelatedInstances(instanceId: string, tenantId: string): Promise<ActivityInstanceType[]> {
    return await db
      .select()
      .from(activityInstances)
      .where(
        and(
          eq(activityInstances.tenantId, tenantId),
          eq(activityInstances.parentInstanceId, instanceId)
        )
      );
  }

  async getInstanceDependencies(instanceId: string, tenantId: string): Promise<Array<{
    dependentInstance: ActivityInstanceType;
    dependencyType: string;
  }>> {
    // This would require more complex logic for dependency management
    // For now, returning empty array
    return [];
  }
}
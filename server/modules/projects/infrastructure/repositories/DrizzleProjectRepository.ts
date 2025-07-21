
import { eq, and, sql, desc, asc, like, inArray, gte, lte } from 'drizzle-orm';
import { schemaManager } from '../../../../db';
import { projects, projectActions, projectTimeline } from '../../../../../shared/schema';
import { Project, ProjectAction, ProjectTimeline } from '../../domain/entities/Project';
import { IProjectRepository, IProjectActionRepository, IProjectTimelineRepository, ProjectFilters, ProjectActionFilters } from '../../domain/repositories/IProjectRepository';

export class DrizzleProjectRepository implements IProjectRepository {
  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const { db } = await schemaManager.getTenantDb(project.tenantId);
    const [created] = await db.insert(projects).values({
      id,
      ...project,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return created;
  }

  async findById(id: string, tenantId: string): Promise<Project | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    
    return project || null;
  }

  async findAll(tenantId: string, filters?: ProjectFilters): Promise<Project[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    let query = db.select().from(projects).where(eq(projects.tenantId, tenantId));
    
    if (filters) {
      const conditions = [eq(projects.tenantId, tenantId)];
      
      if (filters.status) {
        conditions.push(eq(projects.status, filters.status));
      }
      
      if (filters.priority) {
        conditions.push(eq(projects.priority, filters.priority));
      }
      
      if (filters.projectManagerId) {
        conditions.push(eq(projects.projectManagerId, filters.projectManagerId));
      }
      
      if (filters.clientId) {
        conditions.push(eq(projects.clientId, filters.clientId));
      }
      
      if (filters.startDate) {
        conditions.push(gte(projects.startDate, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(projects.endDate, filters.endDate));
      }
      
      if (filters.search) {
        conditions.push(
          sql`(${projects.name} ILIKE ${`%${filters.search}%`} OR ${projects.description} ILIKE ${`%${filters.search}%`})`
        );
      }
      
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(projects.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<Project>): Promise<Project | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
      .returning();
    
    return updated || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    
    return result.rowCount > 0;
  }

  async getProjectStats(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    totalBudget: number;
    totalActualCost: number;
  }> {
    const projectList = await this.findAll(tenantId);
    
    const stats = {
      total: projectList.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      totalBudget: 0,
      totalActualCost: 0
    };
    
    projectList.forEach(project => {
      // Count by status
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;
      
      // Count by priority
      stats.byPriority[project.priority] = (stats.byPriority[project.priority] || 0) + 1;
      
      // Sum budgets and costs
      stats.totalBudget += project.budget || 0;
      stats.totalActualCost += project.actualCost || 0;
    });
    
    return stats;
  }
}

export class DrizzleProjectActionRepository implements IProjectActionRepository {
  async create(action: Omit<ProjectAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectAction> {
    const now = new Date();
    const id = crypto.randomUUID();
    
    const { db } = await schemaManager.getTenantDb(action.tenantId);
    
    const [created] = await db.insert(projectActions).values({
      id,
      tenantId: action.tenantId,
      projectId: action.projectId,
      title: action.title,
      description: action.description,
      type: action.type,
      status: action.status,
      scheduledDate: action.scheduledDate,
      dueDate: action.dueDate,
      completedDate: action.completedDate,
      estimatedHours: action.estimatedHours,
      actualHours: action.actualHours,
      assignedToId: action.assignedToId,
      // Handle JSONB arrays properly
      responsibleIds: JSON.stringify(action.responsibleIds || []),
      clientContactId: action.clientContactId,
      externalReference: action.externalReference,
      deliveryMethod: action.deliveryMethod,
      dependsOnActionIds: JSON.stringify(action.dependsOnActionIds || []),
      blockedByActionIds: JSON.stringify(action.blockedByActionIds || []),
      priority: action.priority,
      tags: JSON.stringify(action.tags || []),
      attachments: JSON.stringify(action.attachments || []),
      notes: action.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: action.createdBy,
      updatedBy: action.updatedBy
    }).returning();
    
    return created;
  }

  async findById(id: string, tenantId: string): Promise<ProjectAction | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const [action] = await db
      .select()
      .from(projectActions)
      .where(and(eq(projectActions.id, id), eq(projectActions.tenantId, tenantId)));
    
    return action || null;
  }

  async findByProject(projectId: string, tenantId: string, filters?: ProjectActionFilters): Promise<ProjectAction[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    let query = db.select().from(projectActions)
      .where(and(eq(projectActions.projectId, projectId), eq(projectActions.tenantId, tenantId)));
    
    if (filters) {
      const conditions = [
        eq(projectActions.projectId, projectId),
        eq(projectActions.tenantId, tenantId)
      ];
      
      if (filters.type) {
        conditions.push(eq(projectActions.type, filters.type));
      }
      
      if (filters.status) {
        conditions.push(eq(projectActions.status, filters.status));
      }
      
      if (filters.assignedToId) {
        conditions.push(eq(projectActions.assignedToId, filters.assignedToId));
      }
      
      if (filters.dueDate) {
        conditions.push(lte(projectActions.dueDate, filters.dueDate));
      }
      
      if (filters.search) {
        conditions.push(
          sql`(${projectActions.title} ILIKE ${`%${filters.search}%`} OR ${projectActions.description} ILIKE ${`%${filters.search}%`})`
        );
      }
      
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(asc(projectActions.dueDate), desc(projectActions.createdAt));
  }

  async findAll(tenantId: string, filters?: ProjectActionFilters): Promise<ProjectAction[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    let query = db.select().from(projectActions).where(eq(projectActions.tenantId, tenantId));
    
    if (filters) {
      const conditions = [eq(projectActions.tenantId, tenantId)];
      
      if (filters.projectId) {
        conditions.push(eq(projectActions.projectId, filters.projectId));
      }
      
      if (filters.type) {
        conditions.push(eq(projectActions.type, filters.type));
      }
      
      if (filters.status) {
        conditions.push(eq(projectActions.status, filters.status));
      }
      
      if (filters.assignedToId) {
        conditions.push(eq(projectActions.assignedToId, filters.assignedToId));
      }
      
      if (filters.search) {
        conditions.push(
          sql`(${projectActions.title} ILIKE ${`%${filters.search}%`} OR ${projectActions.description} ILIKE ${`%${filters.search}%`})`
        );
      }
      
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(projectActions.createdAt));
  }

  async update(id: string, tenantId: string, data: Partial<ProjectAction>): Promise<ProjectAction | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const [updated] = await db
      .update(projectActions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projectActions.id, id), eq(projectActions.tenantId, tenantId)))
      .returning();
    
    return updated || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const result = await db
      .delete(projectActions)
      .where(and(eq(projectActions.id, id), eq(projectActions.tenantId, tenantId)));
    
    return result.rowCount > 0;
  }

  async getDependencies(actionId: string, tenantId: string): Promise<ProjectAction[]> {
    const action = await this.findById(actionId, tenantId);
    if (!action || action.dependsOnActionIds.length === 0) return [];
    
    const { db } = await schemaManager.getTenantDb(tenantId);
    return await db
      .select()
      .from(projectActions)
      .where(and(
        inArray(projectActions.id, action.dependsOnActionIds),
        eq(projectActions.tenantId, tenantId)
      ));
  }

  async getBlockedActions(actionId: string, tenantId: string): Promise<ProjectAction[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    return await db
      .select()
      .from(projectActions)
      .where(and(
        sql`${actionId} = ANY(${projectActions.blockedByActionIds})`,
        eq(projectActions.tenantId, tenantId)
      ));
  }
}

export class DrizzleProjectTimelineRepository implements IProjectTimelineRepository {
  async create(timeline: Omit<ProjectTimeline, 'id' | 'createdAt'>): Promise<ProjectTimeline> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const [created] = await db.insert(projectTimeline).values({
      id,
      ...timeline,
      createdAt: now
    }).returning();
    
    return created;
  }

  async findByProject(projectId: string, tenantId: string): Promise<ProjectTimeline[]> {
    return await db
      .select()
      .from(projectTimeline)
      .where(and(eq(projectTimeline.projectId, projectId), eq(projectTimeline.tenantId, tenantId)))
      .orderBy(desc(projectTimeline.createdAt));
  }

  async findAll(tenantId: string): Promise<ProjectTimeline[]> {
    return await db
      .select()
      .from(projectTimeline)
      .where(eq(projectTimeline.tenantId, tenantId))
      .orderBy(desc(projectTimeline.createdAt));
  }
}

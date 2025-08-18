// ✅ 1QA.MD COMPLIANCE: Activity Planner Repository Interface
// Clean Architecture Domain Layer - Repository Interface

import { ActivityInstance } from '../entities/ActivityInstance';
import { 
  ActivityCategory, 
  ActivityTemplate, 
  ActivitySchedule,
  ActivityWorkflow,
  ActivityResource,
  ActivityHistory
} from '@shared/schema-activity-planner';

export interface ActivityFilters {
  status?: string[];
  activityType?: string[];
  priority?: string[];
  assignedUserId?: string;
  assignedTeamId?: string;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  assetId?: string;
  locationId?: string;
  isOverdue?: boolean;
  categoryId?: string;
  templateId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActivitySummary {
  totalActivities: number;
  completedActivities: number;
  overdueActivities: number;
  inProgressActivities: number;
  scheduledActivities: number;
  completionRate: number;
  averageDuration: number;
  averageQualityScore: number;
}

export interface IActivityPlannerRepository {
  // Activity Categories
  createCategory(category: Omit<ActivityCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityCategory>;
  updateCategory(id: string, tenantId: string, category: Partial<ActivityCategory>): Promise<ActivityCategory>;
  deleteCategory(id: string, tenantId: string): Promise<void>;
  getCategoryById(id: string, tenantId: string): Promise<ActivityCategory | null>;
  getCategories(tenantId: string, filters?: { parentId?: string; isActive?: boolean }): Promise<ActivityCategory[]>;

  // Activity Templates
  createTemplate(template: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityTemplate>;
  updateTemplate(id: string, tenantId: string, template: Partial<ActivityTemplate>): Promise<ActivityTemplate>;
  deleteTemplate(id: string, tenantId: string): Promise<void>;
  getTemplateById(id: string, tenantId: string): Promise<ActivityTemplate | null>;
  getTemplates(tenantId: string, filters?: { categoryId?: string; activityType?: string; isActive?: boolean }): Promise<ActivityTemplate[]>;

  // Activity Schedules
  createSchedule(schedule: Omit<ActivitySchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivitySchedule>;
  updateSchedule(id: string, tenantId: string, schedule: Partial<ActivitySchedule>): Promise<ActivitySchedule>;
  deleteSchedule(id: string, tenantId: string): Promise<void>;
  getScheduleById(id: string, tenantId: string): Promise<ActivitySchedule | null>;
  getSchedules(tenantId: string, filters?: { 
    templateId?: string; 
    assetId?: string; 
    locationId?: string;
    isActive?: boolean;
    frequency?: string;
  }): Promise<ActivitySchedule[]>;
  getSchedulesDueForGeneration(tenantId: string): Promise<ActivitySchedule[]>;

  // Activity Instances
  createInstance(instance: Omit<ActivityInstance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityInstance>;
  updateInstance(id: string, tenantId: string, instance: Partial<ActivityInstance>): Promise<ActivityInstance>;
  deleteInstance(id: string, tenantId: string): Promise<void>;
  getInstanceById(id: string, tenantId: string): Promise<ActivityInstance | null>;
  getInstances(tenantId: string, filters?: ActivityFilters): Promise<ActivityInstance[]>;
  getInstancesByIds(ids: string[], tenantId: string): Promise<ActivityInstance[]>;
  
  // Activity Instance Management
  getOverdueInstances(tenantId: string): Promise<ActivityInstance[]>;
  getUpcomingInstances(tenantId: string, days?: number): Promise<ActivityInstance[]>;
  getInstancesByUser(userId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstance[]>;
  getInstancesByTeam(teamId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstance[]>;
  getInstancesByAsset(assetId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstance[]>;
  getInstancesByLocation(locationId: string, tenantId: string, filters?: ActivityFilters): Promise<ActivityInstance[]>;

  // Analytics & Reporting
  getActivitySummary(tenantId: string, filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    assignedUserId?: string;
    assignedTeamId?: string;
    assetId?: string;
    locationId?: string;
  }): Promise<ActivitySummary>;
  
  getCompletionTrends(tenantId: string, period: 'week' | 'month' | 'quarter', periods: number): Promise<Array<{
    period: string;
    completed: number;
    scheduled: number;
    overdue: number;
  }>>;

  getPerformanceMetrics(tenantId: string, filters?: {
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
  }>>;

  // Activity Workflows
  createWorkflow(workflow: Omit<ActivityWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityWorkflow>;
  updateWorkflow(id: string, tenantId: string, workflow: Partial<ActivityWorkflow>): Promise<ActivityWorkflow>;
  getWorkflowById(id: string, tenantId: string): Promise<ActivityWorkflow | null>;
  getWorkflowsByInstance(instanceId: string, tenantId: string): Promise<ActivityWorkflow[]>;
  getPendingWorkflows(tenantId: string, approverId?: string): Promise<ActivityWorkflow[]>;

  // Activity Resources
  createResource(resource: Omit<ActivityResource, 'id' | 'createdAt'>): Promise<ActivityResource>;
  updateResource(id: string, tenantId: string, resource: Partial<ActivityResource>): Promise<ActivityResource>;
  deleteResource(id: string, tenantId: string): Promise<void>;
  getResourcesByInstance(instanceId: string, tenantId: string): Promise<ActivityResource[]>;
  checkResourceAvailability(resourceId: string, tenantId: string, dateFrom: Date, dateTo: Date): Promise<boolean>;

  // Activity History & Audit
  createHistoryEntry(history: Omit<ActivityHistory, 'id' | 'performedAt'>): Promise<ActivityHistory>;
  getInstanceHistory(instanceId: string, tenantId: string): Promise<ActivityHistory[]>;
  getUserActivityHistory(userId: string, tenantId: string, limit?: number): Promise<ActivityHistory[]>;

  // Batch Operations
  bulkCreateInstances(instances: Array<Omit<ActivityInstance, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ActivityInstance[]>;
  bulkUpdateInstanceStatus(instanceIds: string[], tenantId: string, status: string, updatedBy: string): Promise<void>;
  bulkAssignInstances(instanceIds: string[], tenantId: string, assignedUserId?: string, assignedTeamId?: string, updatedBy?: string): Promise<void>;

  // Schedule Generation
  generateInstancesFromSchedule(scheduleId: string, tenantId: string, periodStart: Date, periodEnd: Date): Promise<ActivityInstance[]>;
  markOverdueInstances(tenantId: string): Promise<number>;
  
  // Search and Advanced Queries
  searchInstances(tenantId: string, query: string, filters?: ActivityFilters): Promise<ActivityInstance[]>;
  getRelatedInstances(instanceId: string, tenantId: string): Promise<ActivityInstance[]>;
  getInstanceDependencies(instanceId: string, tenantId: string): Promise<Array<{
    dependentInstance: ActivityInstance;
    dependencyType: string;
  }>>;
}
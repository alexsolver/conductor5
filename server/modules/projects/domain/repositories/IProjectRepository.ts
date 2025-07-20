
import { Project, ProjectAction, ProjectTimeline } from '../entities/Project';

export interface ProjectFilters {
  status?: string;
  priority?: string;
  projectManagerId?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  search?: string;
}

export interface ProjectActionFilters {
  projectId?: string;
  type?: string;
  status?: string;
  assignedToId?: string;
  dueDate?: string;
  search?: string;
}

export interface IProjectRepository {
  // Projects
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  findById(id: string, tenantId: string): Promise<Project | null>;
  findAll(tenantId: string, filters?: ProjectFilters): Promise<Project[]>;
  update(id: string, tenantId: string, data: Partial<Project>): Promise<Project | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Project Statistics
  getProjectStats(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    totalBudget: number;
    totalActualCost: number;
  }>;
}

export interface IProjectActionRepository {
  // Project Actions
  create(action: Omit<ProjectAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectAction>;
  findById(id: string, tenantId: string): Promise<ProjectAction | null>;
  findByProject(projectId: string, tenantId: string, filters?: ProjectActionFilters): Promise<ProjectAction[]>;
  findAll(tenantId: string, filters?: ProjectActionFilters): Promise<ProjectAction[]>;
  update(id: string, tenantId: string, data: Partial<ProjectAction>): Promise<ProjectAction | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Dependencies
  getDependencies(actionId: string, tenantId: string): Promise<ProjectAction[]>;
  getBlockedActions(actionId: string, tenantId: string): Promise<ProjectAction[]>;
}

export interface IProjectTimelineRepository {
  // Timeline
  create(timeline: Omit<ProjectTimeline, 'id' | 'createdAt'>): Promise<ProjectTimeline>;
  findByProject(projectId: string, tenantId: string): Promise<ProjectTimeline[]>;
  findAll(tenantId: string): Promise<ProjectTimeline[]>;
}

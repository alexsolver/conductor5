/**
 * GetProjectsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for project management business logic
 */

import { Project } from '../../domain/entities/Project';

interface ProjectRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<Project[]>;
}

export interface GetProjectsRequest {
  tenantId: string;
  status?: string;
  assignedTo?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetProjectsResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    assignedToId: string | null;
    dueDate: Date | null;
    progress: number;
    isOverdue: boolean;
    isDueSoon: boolean;
    daysRemaining: number | null;
  }>;
  filters: any;
}

export class GetProjectsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepositoryInterface
  ) {}

  async execute(request: GetProjectsRequest): Promise<GetProjectsResponse> {
    const projects = await this.projectRepository.findByTenant(request.tenantId, {
      status: request.status,
      assignedTo: request.assignedTo,
      priority: request.priority,
      search: request.search,
      limit: request.limit,
      offset: request.offset
    });

    return {
      success: true,
      message: 'Projects retrieved successfully',
      data: projects.map(project => ({
        id: project.getId(),
        name: project.getName(),
        description: project.getDescription(),
        status: project.getStatus(),
        priority: project.getPriority(),
        assignedToId: project.getAssignedToId(),
        dueDate: project.getDueDate(),
        progress: project.getProgress(),
        isOverdue: project.isOverdue(),
        isDueSoon: project.isDueSoon(),
        daysRemaining: project.getDaysRemaining()
      })),
      filters: {
        status: request.status,
        assignedTo: request.assignedTo,
        priority: request.priority,
        search: request.search,
        tenantId: request.tenantId
      }
    };
  }
}
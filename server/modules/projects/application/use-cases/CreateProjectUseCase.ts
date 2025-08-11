/**
 * CreateProjectUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for project creation business logic
 */

import { Project } from '../../domain/entities/Project';

interface ProjectRepositoryInterface {
  save(project: Project): Promise<void>;
  findByName(name: string, tenantId: string): Promise<Project | null>;
}

export interface CreateProjectRequest {
  tenantId: string;
  name: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedToId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  budget?: number;
}

export interface CreateProjectResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    dueDate: Date | null;
  };
}

export class CreateProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepositoryInterface
  ) {}

  async execute(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    // Validate required fields
    if (!request.name || !request.description) {
      return {
        success: false,
        message: 'Name and description are required'
      };
    }

    // Check if project with same name exists
    const existingProject = await this.projectRepository.findByName(request.name, request.tenantId);
    if (existingProject) {
      return {
        success: false,
        message: 'A project with this name already exists'
      };
    }

    // Create domain entity
    const project = new Project(
      generateId(),
      request.tenantId,
      request.name,
      request.description,
      'planning', // default status
      request.priority || 'medium',
      request.assignedToId || null,
      request.dueDate || null
    );

    // Set optional properties using domain methods
    if (request.estimatedHours) {
      project.updateHours(request.estimatedHours);
    }

    if (request.budget) {
      project.setBudget(request.budget);
    }

    if (request.assignedToId) {
      project.assignTo(request.assignedToId);
    }

    if (request.dueDate) {
      project.setDueDate(request.dueDate);
    }

    // Persist through repository
    await this.projectRepository.save(project);

    return {
      success: true,
      message: 'Project created successfully',
      data: {
        id: project.getId(),
        name: project.getName(),
        description: project.getDescription(),
        status: project.getStatus(),
        priority: project.getPriority(),
        dueDate: project.getDueDate()
      }
    };
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
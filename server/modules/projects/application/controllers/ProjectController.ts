
import { Request, Response } from 'express';
import { ManageProjectsUseCase, ManageProjectActionsUseCase } from '../use-cases/ManageProjectsUseCase';
import { DrizzleProjectRepository, DrizzleProjectActionRepository, DrizzleProjectTimelineRepository } from '../../infrastructure/repositories/DrizzleProjectRepository';
import { 
  CreateProjectSchema, 
  UpdateProjectSchema, 
  CreateProjectActionSchema, 
  UpdateProjectActionSchema,
  ProjectFiltersSchema,
  ProjectActionFiltersSchema 
} from '../../../../../shared/schema/projects';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class ProjectController {
  private projectsUseCase: ManageProjectsUseCase;
  private actionsUseCase: ManageProjectActionsUseCase;

  constructor() {
    const projectRepo = new DrizzleProjectRepository();
    const actionRepo = new DrizzleProjectActionRepository();
    const timelineRepo = new DrizzleProjectTimelineRepository();

    this.projectsUseCase = new ManageProjectsUseCase(projectRepo, timelineRepo);
    this.actionsUseCase = new ManageProjectActionsUseCase(actionRepo, timelineRepo);
  }

  // Projects
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      
      const validation = CreateProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: validation.error.errors 
        });
      }

      // Convert date strings to Date objects for Drizzle
      const projectData = {
        ...validation.data,
        tenantId,
        actualHours: 0,
        actualCost: 0,
        teamMemberIds: validation.data.teamMemberIds || [],
        tags: validation.data.tags || [],
        customFields: validation.data.customFields || {},
        startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined,
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : undefined
      };

      const project = await this.projectsUseCase.createProject(projectData, userId);

      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      
      const filtersValidation = ProjectFiltersSchema.safeParse(req.query);
      const filters = filtersValidation.success ? filtersValidation.data : undefined;

      const projects = await this.projectsUseCase.getProjects(tenantId, filters);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      const project = await this.projectsUseCase.getProject(id, tenantId);
      if (!project) {
        return res.status(404).json({ message: 'Projeto não encontrado' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const { id } = req.params;

      const validation = UpdateProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: validation.error.errors 
        });
      }

      // Convert date strings to Date objects for Drizzle
      const updateData = {
        ...validation.data,
        startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined,
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : undefined
      };

      const project = await this.projectsUseCase.updateProject(id, tenantId, updateData, userId);
      if (!project) {
        return res.status(404).json({ message: 'Projeto não encontrado' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      const deleted = await this.projectsUseCase.deleteProject(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: 'Projeto não encontrado' });
      }

      res.json({ message: 'Projeto excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getProjectStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      
      const stats = await this.projectsUseCase.getProjectStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching project stats:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getProjectTimeline(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      const timeline = await this.projectsUseCase.getProjectTimeline(id, tenantId);
      res.json(timeline);
    } catch (error) {
      console.error('Error fetching project timeline:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Project Actions
  async createAction(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const { projectId } = req.params;
      
      const validation = CreateProjectActionSchema.safeParse({
        ...req.body,
        projectId
      });
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: validation.error.errors 
        });
      }

      // Ensure arrays are properly initialized
      const actionData = {
        ...validation.data,
        tenantId,
        actualHours: 0,
        // Convert string arrays or undefined to proper arrays
        responsibleIds: Array.isArray(validation.data.responsibleIds) ? validation.data.responsibleIds : [],
        dependsOnActionIds: Array.isArray(validation.data.dependsOnActionIds) ? validation.data.dependsOnActionIds : [],
        blockedByActionIds: Array.isArray(validation.data.blockedByActionIds) ? validation.data.blockedByActionIds : [],
        tags: Array.isArray(validation.data.tags) ? validation.data.tags : [],
        attachments: Array.isArray(validation.data.attachments) ? validation.data.attachments : []
      };

      console.log('Action data prepared for creation:', JSON.stringify(actionData, null, 2));
      const action = await this.actionsUseCase.createAction(actionData, userId);

      res.status(201).json(action);
    } catch (error) {
      console.error('Error creating action:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getProjectActions(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { projectId } = req.params;
      
      const filtersValidation = ProjectActionFiltersSchema.safeParse(req.query);
      const filters = filtersValidation.success ? filtersValidation.data : undefined;

      const actions = await this.actionsUseCase.getProjectActions(projectId, tenantId, filters);
      res.json(actions);
    } catch (error) {
      console.error('Error fetching project actions:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getAllActions(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      
      const filtersValidation = ProjectActionFiltersSchema.safeParse(req.query);
      const filters = filtersValidation.success ? filtersValidation.data : undefined;

      const actions = await this.actionsUseCase.getAllActions(tenantId, filters);
      res.json(actions);
    } catch (error) {
      console.error('Error fetching actions:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getAction(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      const action = await this.actionsUseCase.getAction(id, tenantId);
      if (!action) {
        return res.status(404).json({ message: 'Ação não encontrada' });
      }

      res.json(action);
    } catch (error) {
      console.error('Error fetching action:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async updateAction(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const { id } = req.params;

      const validation = UpdateProjectActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: validation.error.errors 
        });
      }

      const action = await this.actionsUseCase.updateAction(id, tenantId, validation.data, userId);
      if (!action) {
        return res.status(404).json({ message: 'Ação não encontrada' });
      }

      res.json(action);
    } catch (error) {
      console.error('Error updating action:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async deleteAction(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      const deleted = await this.actionsUseCase.deleteAction(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: 'Ação não encontrada' });
      }

      res.json({ message: 'Ação excluída com sucesso' });
    } catch (error) {
      console.error('Error deleting action:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getActionDependencies(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      const dependencies = await this.actionsUseCase.getActionDependencies(id, tenantId);
      res.json(dependencies);
    } catch (error) {
      console.error('Error fetching action dependencies:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}


import { Project, ProjectAction } from '../../domain/entities/Project''[,;]
import { IProjectRepository, IProjectActionRepository, IProjectTimelineRepository, ProjectFilters, ProjectActionFilters } from '../../domain/repositories/IProjectRepository''[,;]

export class ManageProjectsUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private timelineRepository: IProjectTimelineRepository
  ) {}

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Project> {
    const project = await this.projectRepository.create({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });

    // Create timeline entry
    await this.timelineRepository.create({
      tenantId: project.tenantId,
      projectId: project.id,
      eventType: 'project_created''[,;]
      title: 'Projeto criado''[,;]
      description: `Projeto "${project.name}" foi criado`,
      createdBy: userId
    });

    return project;
  }

  async getProject(id: string, tenantId: string): Promise<Project | null> {
    return await this.projectRepository.findById(id, tenantId);
  }

  async getProjects(tenantId: string, filters?: ProjectFilters): Promise<Project[]> {
    return await this.projectRepository.findAll(tenantId, filters);
  }

  async updateProject(id: string, tenantId: string, data: Partial<Project>, userId: string): Promise<Project | null> {
    const existingProject = await this.projectRepository.findById(id, tenantId);
    if (!existingProject) return null;

    const updated = await this.projectRepository.update(id, tenantId, {
      ...data,
      updatedBy: userId
    });

    if (updated) {
      // Track status changes
      if (data.status && data.status !== existingProject.status) {
        await this.timelineRepository.create({
          tenantId,
          projectId: id,
          eventType: 'status_changed''[,;]
          title: 'Status alterado''[,;]
          description: `Status alterado de "${existingProject.status}" para "${data.status}"`,
          oldValue: existingProject.status,
          newValue: data.status,
          createdBy: userId
        });
      }

      // Track budget changes
      if (data.budget && data.budget !== existingProject.budget) {
        await this.timelineRepository.create({
          tenantId,
          projectId: id,
          eventType: 'budget_updated''[,;]
          title: 'Orçamento atualizado''[,;]
          description: `Orçamento alterado de R$ ${existingProject.budget || 0} para R$ ${data.budget}`,
          oldValue: String(existingProject.budget || 0),
          newValue: String(data.budget),
          createdBy: userId
        });
      }
    }

    return updated;
  }

  async deleteProject(id: string, tenantId: string): Promise<boolean> {
    return await this.projectRepository.delete(id, tenantId);
  }

  async getProjectStats(tenantId: string) {
    return await this.projectRepository.getProjectStats(tenantId);
  }

  async getProjectTimeline(projectId: string, tenantId: string) {
    return await this.timelineRepository.findByProject(projectId, tenantId);
  }
}

export class ManageProjectActionsUseCase {
  constructor(
    private actionRepository: IProjectActionRepository,
    private timelineRepository: IProjectTimelineRepository
  ) {}

  async createAction(data: Omit<ProjectAction, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ProjectAction> {
    const action = await this.actionRepository.create({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });

    // Create timeline entry
    await this.timelineRepository.create({
      tenantId: action.tenantId,
      projectId: action.projectId,
      eventType: 'action_completed''[,;]
      title: `${this.getActionTypeLabel(action.type)} criada`,
      description: `Ação "${action.title}" foi criada`,
      actionId: action.id,
      createdBy: userId
    });

    return action;
  }

  async getAction(id: string, tenantId: string): Promise<ProjectAction | null> {
    return await this.actionRepository.findById(id, tenantId);
  }

  async getProjectActions(projectId: string, tenantId: string, filters?: ProjectActionFilters): Promise<ProjectAction[]> {
    return await this.actionRepository.findByProject(projectId, tenantId, filters);
  }

  async getAllActions(tenantId: string, filters?: ProjectActionFilters): Promise<ProjectAction[]> {
    return await this.actionRepository.findAll(tenantId, filters);
  }

  async updateAction(id: string, tenantId: string, data: Partial<ProjectAction>, userId: string): Promise<ProjectAction | null> {
    const existingAction = await this.actionRepository.findById(id, tenantId);
    if (!existingAction) return null;

    const updated = await this.actionRepository.update(id, tenantId, {
      ...data,
      updatedBy: userId
    });

    if (updated) {
      // Track completion
      if (data.status === 'completed' && existingAction.status !== 'completed') {
        await this.timelineRepository.create({
          tenantId,
          projectId: updated.projectId,
          eventType: 'action_completed''[,;]
          title: 'Ação concluída''[,;]
          description: `Ação "${updated.title}" foi concluída`,
          actionId: id,
          createdBy: userId
        });

        // Check if it's a milestone
        if (updated.type === 'milestone') {
          await this.timelineRepository.create({
            tenantId,
            projectId: updated.projectId,
            eventType: 'milestone_reached''[,;]
            title: 'Marco atingido''[,;]
            description: `Marco "${updated.title}" foi atingido`,
            actionId: id,
            createdBy: userId
          });
        }
      }
    }

    return updated;
  }

  async deleteAction(id: string, tenantId: string): Promise<boolean> {
    return await this.actionRepository.delete(id, tenantId);
  }

  async getActionDependencies(actionId: string, tenantId: string): Promise<ProjectAction[]> {
    return await this.actionRepository.getDependencies(actionId, tenantId);
  }

  async getBlockedActions(actionId: string, tenantId: string): Promise<ProjectAction[]> {
    return await this.actionRepository.getBlockedActions(actionId, tenantId);
  }

  private getActionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'internal_meeting': 'Reunião Interna''[,;]
      'internal_approval': 'Aprovação Interna''[,;]
      'internal_review': 'Revisão Interna''[,;]
      'internal_task': 'Tarefa Interna''[,;]
      'external_delivery': 'Entrega Externa''[,;]
      'external_validation': 'Validação Externa''[,;]
      'external_meeting': 'Reunião com Cliente''[,;]
      'external_feedback': 'Feedback Externo''[,;]
      'milestone': 'Marco''[,;]
      'checkpoint': 'Ponto de Controle'
    };
    return labels[type] || type;
  }
}

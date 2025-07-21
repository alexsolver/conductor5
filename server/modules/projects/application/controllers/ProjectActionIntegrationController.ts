import { Request, Response } from 'express''[,;]
import { ProjectActionTicketIntegrationService } from '../services/ProjectActionTicketIntegrationService''[,;]
import { DrizzleProjectRepository, DrizzleProjectActionRepository } from '../../infrastructure/repositories/DrizzleProjectRepository''[,;]
import { storage } from '../../../../storage-simple''[,;]
import crypto from 'crypto''[,;]

export class ProjectActionIntegrationController {
  private integrationService: ProjectActionTicketIntegrationService;
  private projectRepository: DrizzleProjectRepository;
  private actionRepository: DrizzleProjectActionRepository;

  constructor() {
    this.projectRepository = new DrizzleProjectRepository();
    this.actionRepository = new DrizzleProjectActionRepository();
    this.integrationService = new ProjectActionTicketIntegrationService(this.actionRepository);
  }

  /**
   * GET /api/project-actions/convertible
   * Lista actions que podem ser convertidas em tickets
   */
  async getConvertibleActions(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { projectId } = req.query;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const actions = await this.integrationService.getConvertibleActions(
        tenantId, 
        projectId as string
      );

      res.json({
        convertibleActions: actions,
        count: actions.length
      });
    } catch (error) {
      console.error('Error getting convertible actions:', error);
      res.status(500).json({ error: 'Failed to get convertible actions' });
    }
  }

  /**
   * POST /api/project-actions/:actionId/convert-to-ticket
   * Converte uma action específica em ticket
   */
  async convertActionToTicket(req: Request, res: Response) {
    try {
      const { actionId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      console.log('🚀 [CONVERT ACTION START]', { actionId, tenantId, userId });

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Buscar informações do projeto para o ticket
      const action = await this.actionRepository.findById(actionId, tenantId);
      if (!action) {
        return res.status(404).json({ error: 'Action not found' });
      }

      const project = await this.projectRepository.findById(action.projectId, tenantId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Converter action para dados de ticket
      const ticketData = await this.integrationService.convertActionToTicket(
        actionId,
        tenantId,
        userId,
        project.name
      );

      // Criar o ticket real usando o sistema de storage
      // storage já está importado como singleton
      
      // Buscar primeiro customer disponível para tickets convertidos de actions
      const customers = await storage.getCustomers(tenantId, { limit: 1 });
      const defaultCustomerId = customers.length > 0 ? customers[0].id : 'c1ab5232-3e1c-4277-b4e7-1fcfa6b379d8''[,;]

      // Preparar dados do ticket baseados na conversão
      const ticketCreateData = {
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        urgency: ticketData.urgency,
        category: ticketData.category,
        status: 'open''[,;]
        customerId: defaultCustomerId, // Customer ID necessário para o sistema
        assignedToId: ticketData.assignedToId,
        callerId: userId, // Usuário que converteu como solicitante
        callerType: 'user''[,;]
        // Metadados de integração com projeto
        metadata: {
          sourceType: 'project_action''[,;]
          relatedProjectId: ticketData.relatedProjectId,
          relatedActionId: ticketData.relatedActionId,
          actionConversionData: ticketData.actionConversionData
        }
      };

      // Debug: verificar dados sendo passados
      console.log('📝 [TICKET CREATION DEBUG]', {
        tenantId,
        subject: ticketCreateData.subject,
        customerId: ticketCreateData.customerId,
        hasCustomerId: !!ticketCreateData.customerId,
        fullTicketData: JSON.stringify(ticketCreateData, null, 2)
      });

      const createdTicket = await storage.createTicket(tenantId, ticketCreateData);

      // Linkar action ao ticket criado
      await this.integrationService.linkActionToTicket(actionId, tenantId, createdTicket.id);

      res.json({
        success: true,
        ticketId: createdTicket.id,
        ticketNumber: createdTicket.number,
        ticketData: {
          ...ticketData,
          id: createdTicket.id,
          number: createdTicket.number
        },
        message: 'Action successfully converted to ticket'
      });
    } catch (error) {
      console.error('Error converting action to ticket:', error);
      res.status(500).json({ error: error.message || 'Failed to convert action to ticket' });
    }
  }

  /**
   * GET /api/project-actions/integration-suggestions
   * Obtém sugestões de integração baseadas no estado atual
   */
  async getIntegrationSuggestions(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const suggestions = await this.integrationService.getIntegrationSuggestions(tenantId);

      res.json({
        suggestions,
        summary: {
          autoConvertCandidates: suggestions.autoConvertCandidates.length,
          blockedActions: suggestions.blockedActions.length,
          overdueActions: suggestions.overdueActions.length
        }
      });
    } catch (error) {
      console.error('Error getting integration suggestions:', error);
      res.status(500).json({ error: 'Failed to get integration suggestions' });
    }
  }

  /**
   * PUT /api/project-actions/:actionId/conversion-rules
   * Atualiza as regras de conversão de uma action
   */
  async updateConversionRules(req: Request, res: Response) {
    try {
      const { actionId } = req.params;
      const tenantId = req.user?.tenantId;
      const { conversionRules } = req.body;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const updatedAction = await this.actionRepository.update(actionId, tenantId, {
        ticketConversionRules: conversionRules,
        updatedAt: new Date()
      });

      if (!updatedAction) {
        return res.status(404).json({ error: 'Action not found' });
      }

      res.json({
        success: true,
        action: updatedAction,
        message: 'Conversion rules updated successfully'
      });
    } catch (error) {
      console.error('Error updating conversion rules:', error);
      res.status(500).json({ error: 'Failed to update conversion rules' });
    }
  }

  /**
   * GET /api/project-actions/linked-tickets
   * Lista actions que já estão linkadas a tickets
   */
  async getLinkedTickets(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { projectId } = req.query;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = projectId ? { projectId: projectId as string } : {};
      const allActions = await this.actionRepository.findAll(tenantId, filters);
      
      const linkedActions = allActions.filter(action => action.relatedTicketId);

      res.json({
        linkedActions,
        count: linkedActions.length,
        projects: [...new Set(linkedActions.map(action => action.projectId))]
      });
    } catch (error) {
      console.error('Error getting linked tickets:', error);
      res.status(500).json({ error: 'Failed to get linked tickets' });
    }
  }

  /**
   * POST /api/project-actions/bulk-convert
   * Conversão em lote de múltiplas actions
   */
  async bulkConvertActions(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { actionIds } = req.body;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!Array.isArray(actionIds) || actionIds.length === 0) {
        return res.status(400).json({ error: 'Action IDs array required' });
      }

      const results = [];
      const errors = [];

      for (const actionId of actionIds) {
        try {
          const action = await this.actionRepository.findById(actionId, tenantId);
          if (!action) {
            errors.push({ actionId, error: 'Action not found' });
            continue;
          }

          const project = await this.projectRepository.findById(action.projectId, tenantId);
          if (!project) {
            errors.push({ actionId, error: 'Project not found' });
            continue;
          }

          const ticketData = await this.integrationService.convertActionToTicket(
            actionId,
            tenantId,
            userId,
            project.name
          );

          // Mock ticket creation
          const mockTicketId = `ticket_${Date.now()}_${actionId.slice(-4)}`;
          await this.integrationService.linkActionToTicket(actionId, tenantId, mockTicketId);

          results.push({
            actionId,
            ticketId: mockTicketId,
            actionTitle: action.title
          });
        } catch (error) {
          errors.push({ actionId, error: error.message });
        }
      }

      res.json({
        success: true,
        converted: results,
        errors,
        summary: {
          total: actionIds.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error('Error in bulk conversion:', error);
      res.status(500).json({ error: 'Failed to bulk convert actions' });
    }
  }
}
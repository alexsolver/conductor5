import { Response, Request } from 'express';
import { TicketTemplateRepository } from './TicketTemplateRepository';
import { insertTicketTemplateSchema } from '@shared/schema-master';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/jwtAuth';

export class TicketTemplateController {
  private repository: TicketTemplateRepository;

  constructor() {
    this.repository = new TicketTemplateRepository();
  }

  // GET /api/ticket-templates/company/:customerCompanyId
  async getTemplatesByCompany(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerCompanyId } = req.params;
      const tenantId = req.user.tenantId;
      const includePublic = req.query.includePublic !== 'false';

      const templates = await this.repository.getTemplatesByCompany(
        tenantId,
        customerCompanyId === 'all' ? undefined : customerCompanyId,
        includePublic
      );

      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching templates by company:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
  }

  // GET /api/ticket-templates/:templateId
  async getTemplateById(req: AuthenticatedRequest, res: Response) {
    try {
      const { templateId } = req.params;
      const tenantId = req.user.tenantId;

      const template = await this.repository.getTemplateById(tenantId, templateId);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch template' });
    }
  }

  // POST /api/ticket-templates/company/:customerCompanyId
  async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerCompanyId } = req.params;
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      // Validar dados de entrada e mapear campos
      const inputData = {
        ...req.body,
        tenantId,
        customerCompanyId: (customerCompanyId === 'public' || customerCompanyId === 'all') ? null : customerCompanyId,
        createdById: userId,
        // Map frontend field names to backend expected names
        defaultPriority: req.body.priority || req.body.defaultPriority || 'medium',
        defaultStatus: req.body.status || req.body.defaultStatus || 'open',
        defaultType: req.body.type || req.body.defaultType || 'support',
        defaultCategory: req.body.defaultCategory || req.body.category || 'Geral'
      };

      console.log('🐛 Debug - Input data for validation:', JSON.stringify(inputData, null, 2));
      console.log('🐛 Debug - customerCompanyId param:', customerCompanyId);
      console.log('🐛 Debug - converted customerCompanyId:', inputData.customerCompanyId);

      const templateData = insertTicketTemplateSchema.parse(inputData);

      const template = await this.repository.createTemplate(templateData);

      res.status(201).json({ success: true, data: template });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }

      console.error('Error creating template:', error);
      res.status(500).json({ success: false, error: 'Failed to create template' });
    }
  }

  // PUT /api/ticket-templates/:templateId
  async updateTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const tenantId = req.user.tenantId;

      const template = await this.repository.updateTemplate(tenantId, templateId, req.body);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ success: false, error: 'Failed to update template' });
    }
  }

  // DELETE /api/ticket-templates/:templateId
  async deleteTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const tenantId = req.user.tenantId;

      const deleted = await this.repository.deleteTemplate(tenantId, templateId);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
  }

  // POST /api/ticket-templates/:templateId/apply
  async applyTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const tenantId = req.user.tenantId;

      const template = await this.repository.getTemplateById(tenantId, templateId);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      // Incrementar contador de uso
      await this.repository.incrementUsage(tenantId, templateId);

      // Estruturar dados para criação de ticket
      const ticketData = {
        title: template.defaultTitle || '',
        description: template.defaultDescription || '',
        type: template.defaultType,
        priority: template.defaultPriority,
        status: template.defaultStatus,
        category: template.defaultCategory,
        urgency: template.defaultUrgency,
        impact: template.defaultImpact,
        assignedToId: template.defaultAssigneeId,
        assignmentGroup: template.defaultAssignmentGroup,
        department: template.defaultDepartment,
        customFields: template.customFields,
        templateId: templateId,
        // Adicionar campos obrigatórios para preenchimento
        requiredFields: template.requiredFields,
        optionalFields: template.optionalFields,
        hiddenFields: template.hiddenFields
      };

      res.json({ success: true, data: ticketData });
    } catch (error) {
      console.error('Error applying template:', error);
      res.status(500).json({ success: false, error: 'Failed to apply template' });
    }
  }

  // GET /api/ticket-templates/:templateId/preview
  async previewTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const tenantId = req.user.tenantId;

      const template = await this.repository.getTemplateById(tenantId, templateId);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      const preview = {
        name: template.name,
        description: template.description,
        category: template.category,
        defaultTitle: template.defaultTitle,
        defaultDescription: template.defaultDescription,
        priority: template.defaultPriority,
        status: template.defaultStatus,
        fieldsToFill: template.requiredFields,
        optionalFields: template.optionalFields,
        estimatedTime: this.calculateEstimatedTime(template),
        autoAssignments: {
          assignee: template.defaultAssigneeId,
          group: template.defaultAssignmentGroup,
          department: template.defaultDepartment
        }
      };

      res.json({ success: true, data: preview });
    } catch (error) {
      console.error('Error previewing template:', error);
      res.status(500).json({ success: false, error: 'Failed to preview template' });
    }
  }

  // GET /api/ticket-templates/company/:customerCompanyId/search
  async searchTemplates(req: Request, res: Response) {
    try {
      const { customerCompanyId } = req.params;
      const { q: query, category } = req.query;
      const tenantId = req.user.tenantId;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'Search query is required' });
      }

      const templates = await this.repository.searchTemplates(
        tenantId,
        customerCompanyId === 'all' ? undefined : customerCompanyId,
        query,
        category as string
      );

      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error searching templates:', error);
      res.status(500).json({ success: false, error: 'Failed to search templates' });
    }
  }

  // GET /api/ticket-templates/company/:customerCompanyId/categories
  async getTemplateCategories(req: Request, res: Response) {
    try {
      const { customerCompanyId } = req.params;
      const tenantId = req.user.tenantId;

      const categories = await this.repository.getTemplateCategories(
        tenantId,
        customerCompanyId === 'all' ? undefined : customerCompanyId
      );

      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching template categories:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  }

  // GET /api/ticket-templates/company/:customerCompanyId/popular
  async getPopularTemplates(req: Request, res: Response) {
    try {
      const { customerCompanyId } = req.params;
      const tenantId = req.user.tenantId;
      const limit = parseInt(req.query.limit as string) || 10;

      const templates = await this.repository.getPopularTemplates(
        tenantId,
        customerCompanyId === 'all' ? undefined : customerCompanyId,
        limit
      );

      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch popular templates' });
    }
  }

  // GET /api/ticket-templates/company/:customerCompanyId/stats
  async getTemplateStats(req: Request, res: Response) {
    try {
      const { customerCompanyId } = req.params;
      const tenantId = req.user.tenantId;

      const stats = await this.repository.getTemplateStats(
        tenantId,
        customerCompanyId === 'all' ? undefined : customerCompanyId
      );

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching template stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch template statistics' });
    }
  }

  // GET /api/ticket-templates/global
  async getGlobalTemplates(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;

      const templates = await this.repository.getGlobalTemplates(tenantId);

      res.json({
        success: true,
        data: templates,
        message: 'Global templates retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching global templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch global templates' });
    }
  }

  // GET /api/ticket-templates/company-specific/:companyId
  async getCompanySpecificTemplates(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const tenantId = req.user.tenantId;

      if (!companyId) {
        return res.status(400).json({ success: false, error: 'Company ID is required' });
      }

      const templates = await this.repository.getCompanySpecificTemplates(tenantId, companyId);

      res.json({
        success: true,
        data: templates,
        message: 'Company-specific templates retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching company-specific templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch company-specific templates' });
    }
  }

  // POST /api/ticket-templates/create-global
  async createGlobalTemplate(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const templateData = {
        ...req.body,
        tenantId,
        companyId: null,
        isGlobal: true
      };

      const template = await this.repository.createTemplate(templateData);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Global template created successfully'
      });
    } catch (error) {
      console.error('Error creating global template:', error);
      res.status(500).json({ success: false, error: 'Failed to create global template' });
    }
  }

  // POST /api/ticket-templates/create-company/:companyId
  async createCompanyTemplate(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const tenantId = req.user.tenantId;

      if (!companyId) {
        return res.status(400).json({ success: false, error: 'Company ID is required' });
      }

      const templateData = {
        ...req.body,
        tenantId,
        companyId,
        isGlobal: false
      };

      const template = await this.repository.createTemplate(templateData);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Company-specific template created successfully'
      });
    } catch (error) {
      console.error('Error creating company template:', error);
      res.status(500).json({ success: false, error: 'Failed to create company template' });
    }
  }


  private calculateEstimatedTime(template: any): number {
    // Estimar tempo baseado na quantidade de campos obrigatórios
    const requiredFields = template.requiredFields?.length || 0;
    const optionalFields = template.optionalFields?.length || 0;
    const hasDescription = template.defaultDescription ? 0 : 2;

    // Base: 1 minuto + 30s por campo obrigatório + 15s por campo opcional + 2min se não tiver descrição
    return 1 + (requiredFields * 0.5) + (optionalFields * 0.25) + hasDescription;
  }
}
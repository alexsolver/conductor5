// TICKET TEMPLATES ROUTES: RESTful API endpoints for template management
import { Router } from 'express''[,;]
import { z } from 'zod''[,;]
import { zValidator } from '@hono/zod-validator''[,;]
import { AuthenticatedRequest, jwtAuth } from '../middleware/jwtAuth''[,;]
import { 
  insertTicketTemplateSchema, 
  updateTicketTemplateSchema,
  applyTemplateSchema,
  templateCategories 
} from '../../shared/schema''[,;]
import { getStorage } from '../storage-simple''[,;]
import logger from '../utils/logger''[,;]

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// GET /api/templates - List all templates for tenant
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID é obrigatório' });
    }

    const storage = await getStorage();
    const templates = await storage.getTicketTemplates(tenantId);

    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
  } catch (error) {
    logger.error('Erro ao buscar templates:', { error, tenantId: req.user?.tenantId });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor''[,;]
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/templates/categories - List available categories
router.get('/categories', async (req: AuthenticatedRequest, res: AuthenticatedResponse) => {
  try {
    res.json({
      success: true,
      data: templateCategories
    });
  } catch (error) {
    logger.error('Erro ao buscar categorias:', { error });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// GET /api/templates/:id - Get specific template
router.get('/:id', async (req: AuthenticatedRequest, res: AuthenticatedResponse) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID é obrigatório' });
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validation = uuidSchema.safeParse(id);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do template inválido' 
      });
    }

    const storage = await getStorage();
    const template = await storage.getTicketTemplateById(tenantId, id);

    if (!template) {
      return res.status(404).json({ 
        success: false,
        message: 'Template não encontrado' 
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Erro ao buscar template:', { error, templateId: req.params.id });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req: AuthenticatedRequest, res: AuthenticatedResponse) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Dados de autenticação incompletos' });
    }

    // Validate request body
    const validation = insertTicketTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Dados inválidos''[,;]
        errors: validation.error.errors
      });
    }

    const storage = await getStorage();
    const templateData = {
      ...validation.data,
      tenantId,
      createdBy: userId
    };

    const newTemplate = await storage.createTicketTemplate(templateData);

    logger.info('Template criado com sucesso:', { 
      templateId: newTemplate.id, 
      name: newTemplate.name,
      tenantId,
      userId 
    });

    res.status(201).json({
      success: true,
      data: newTemplate,
      message: 'Template criado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao criar template:', { error, tenantId: req.user?.tenantId });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req: AuthenticatedRequest, res: AuthenticatedResponse) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Dados de autenticação incompletos' });
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do template inválido' 
      });
    }

    // Validate request body
    const validation = updateTicketTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Dados inválidos''[,;]
        errors: validation.error.errors
      });
    }

    const storage = await getStorage();
    
    // Check if template exists and belongs to tenant
    const existingTemplate = await storage.getTicketTemplateById(tenantId, id);
    if (!existingTemplate) {
      return res.status(404).json({ 
        success: false,
        message: 'Template não encontrado' 
      });
    }

    const updatedTemplate = await storage.updateTicketTemplate(tenantId, id, validation.data);

    logger.info('Template atualizado com sucesso:', { 
      templateId: id, 
      tenantId,
      userId 
    });

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Template atualizado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao atualizar template:', { error, templateId: req.params.id });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req: AuthenticatedRequest, res: AuthenticatedResponse) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Dados de autenticação incompletos' });
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validation = uuidSchema.safeParse(id);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do template inválido' 
      });
    }

    const storage = await getStorage();
    
    // Check if template exists and belongs to tenant
    const existingTemplate = await storage.getTicketTemplateById(tenantId, id);
    if (!existingTemplate) {
      return res.status(404).json({ 
        success: false,
        message: 'Template não encontrado' 
      });
    }

    await storage.deleteTicketTemplate(tenantId, id);

    logger.info('Template excluído com sucesso:', { 
      templateId: id, 
      tenantId,
      userId 
    });

    res.json({
      success: true,
      message: 'Template excluído com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir template:', { error, templateId: req.params.id });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// POST /api/templates/:id/apply - Apply template to create new ticket
router.post('/:id/apply', async (req: AuthenticatedRequest, res: AuthenticatedResponse) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Dados de autenticação incompletos' });
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do template inválido' 
      });
    }

    // Validate request body
    const validation = applyTemplateSchema.safeParse({ templateId: id, ...req.body });
    if (!validation.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Dados inválidos''[,;]
        errors: validation.error.errors
      });
    }

    const storage = await getStorage();
    
    // Get template
    const template = await storage.getTicketTemplateById(tenantId, id);
    if (!template) {
      return res.status(404).json({ 
        success: false,
        message: 'Template não encontrado' 
      });
    }

    // Apply template to create ticket
    const ticketData = await storage.applyTicketTemplate(tenantId, userId, template, validation.data);

    logger.info('Template aplicado com sucesso:', { 
      templateId: id,
      ticketId: ticketData.id,
      tenantId,
      userId 
    });

    res.status(201).json({
      success: true,
      data: ticketData,
      message: 'Chamado criado a partir do template com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao aplicar template:', { error, templateId: req.params.id });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

export default router;
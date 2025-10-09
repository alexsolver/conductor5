/**
 * Internal Form Controller - Phase 10 Implementation
 * 
 * Controlador de aplicação para Internal Forms
 * Segue padrões estabelecidos no 1qa.md para Clean Architecture
 * 
 * @module InternalFormController
 * @version 1.0.0
 * @created 2025-09-24 - Phase 10 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { IInternalFormRepository } from '../../domain/repositories/IInternalFormRepository';
import { InternalForm, FormSubmission } from '../../domain/entities/InternalForm';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email?: string;
  };
}

export class InternalFormController {
  constructor(private internalFormRepository: IInternalFormRepository) {}

  async getForms(req: AuthenticatedRequest, res: Response): Promise<void> {
    // ✅ CRITICAL FIX - Ensure JSON response headers per 1qa.md compliance
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    try {
      // ✅ Enhanced authentication validation per 1qa.md compliance
      if (!req.user) {
        console.error('❌ [InternalFormController] No user context found in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          needsRefresh: true,
          timestamp: new Date().toISOString(),
          code: 'NO_USER_CONTEXT'
        });
      }

      if (!req.user.tenantId) {
        console.error('❌ [InternalFormController] No tenant ID found for user:', req.user.id);
        res.status(403).json({
          success: false,
          message: 'Tenant access required for internal-forms operations',
          code: 'MISSING_TENANT_ACCESS'
        });
        return;
      }

      const tenantId = req.user.tenantId;
      console.log(`[InternalFormController] Getting forms for tenant: ${tenantId}`);

      const { category, isActive, search } = req.query;

      // ✅ 1QA.MD: Only return active forms by default (soft delete compliance)
      const filters = {
        tenantId,
        category: category as string,
        isActive: isActive === 'false' ? false : undefined, // Only include inactive if explicitly requested
        search: search as string
      };

      console.log(`[InternalFormController] Applied filters (active only by default):`, filters);

      const forms = await this.internalFormRepository.findAll(filters);

      console.log(`✅ [InternalFormController] Found ${forms.length} active forms`);

      // ✅ CRITICAL FIX - Ensure proper JSON response format per 1qa.md compliance
      res.status(200).json(forms);
    } catch (error) {
      console.error('❌ [InternalFormController] Error in getForms:', error);

      // ✅ CRITICAL FIX - Ensure JSON response even in error cases per 1qa.md
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar formulários',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          code: 'CONTROLLER_ERROR'
        });
      }
    }
  }

  async getFormById(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const tenantId = req.user.tenantId;

      console.log(`[InternalFormController] Getting form by ID: ${id} for tenant: ${tenantId}`);

      const form = await this.internalFormRepository.findById(id, tenantId);

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Formulário não encontrado',
          timestamp: new Date().toISOString(),
          code: 'FORM_NOT_FOUND'
        });
      }

      console.log(`✅ [InternalFormController] Form retrieved with ${form.fields?.length || 0} fields`);

      // ✅ 1QA.MD: Return consistent JSON response
      res.status(200).json({
        success: true,
        data: form,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [InternalFormController] Error in getFormById:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async getFormsByActionType(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { actionType } = req.params;
      const tenantId = req.user.tenantId;

      console.log(`[InternalFormController] Getting forms for action type: ${actionType} and tenant: ${tenantId}`);

      const forms = await this.internalFormRepository.findByActionType(actionType, tenantId);

      console.log(`✅ [InternalFormController] Found ${forms.length} forms for action type: ${actionType}`);

      res.status(200).json({
        success: true,
        data: forms
      });
    } catch (error) {
      console.error('❌ [InternalFormController] Error in getFormsByActionType:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async createForm(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        console.error('❌ [InternalFormController] No tenant ID found in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      console.log(`[InternalFormController] Creating form for tenant: ${tenantId}`);
      console.log(`[InternalFormController] Request body:`, JSON.stringify(req.body, null, 2));

      // Validação básica
      if (!req.body.name || !req.body.name.trim()) {
        console.error('❌ [InternalFormController] Form name is required');
        return res.status(400).json({
          success: false,
          message: 'Nome do formulário é obrigatório'
        });
      }

      if (!req.body.fields || !Array.isArray(req.body.fields) || req.body.fields.length === 0) {
        console.error('❌ [InternalFormController] Form fields are required');
        return res.status(400).json({
          success: false,
          message: 'Pelo menos um campo é obrigatório'
        });
      }

      const formData: InternalForm = {
        id: uuidv4(),
        tenantId,
        name: req.body.name.trim(),
        description: req.body.description || '',
        category: req.body.category || 'Geral',
        fields: req.body.fields || [],
        actions: req.body.actions || [],
        isActive: req.body.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };

      console.log(`[InternalFormController] Form data to be created:`, JSON.stringify(formData, null, 2));

      const form = await this.internalFormRepository.create(formData);

      console.log(`✅ [InternalFormController] Form created successfully: ${form.id}`);

      res.status(201).json({
        success: true,
        data: form,
        message: 'Formulário criado com sucesso'
      });
    } catch (error) {
      console.error('❌ [InternalFormController] Error in createForm:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao criar formulário',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async updateForm(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      console.log(`[InternalFormController] Updating form: ${id} for tenant: ${tenantId}`);

      const updateData = {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date()
      };

      const form = await this.internalFormRepository.update(id, tenantId, updateData);

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Formulário não encontrado'
        });
      }

      console.log(`✅ [InternalFormController] Form updated successfully: ${form.id}`);

      res.status(200).json({
        success: true,
        data: form,
        message: 'Formulário atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ [InternalFormController] Error in updateForm:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao atualizar formulário',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async deleteForm(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const tenantId = req.user.tenantId;

      console.log(`[InternalFormController] Deleting form: ${id} for tenant: ${tenantId}`);

      const deleted = await this.internalFormRepository.delete(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Formulário não encontrado'
        });
      }

      console.log(`✅ [InternalFormController] Form deleted successfully: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Formulário excluído com sucesso'
      });
    } catch (error) {
      console.error('❌ [InternalFormController] Error in deleteForm:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao excluir formulário',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const tenantId = req.user.tenantId;

      console.log(`[InternalFormController] Getting categories for tenant: ${tenantId}`);

      const categories = await this.internalFormRepository.getCategories(tenantId);

      // Se não há categorias, criar as padrão
      if (categories.length === 0) {
        const defaultCategories = [
          { id: uuidv4(), tenantId, name: 'Geral', icon: 'FileText', color: '#3B82F6', isActive: true },
          { id: uuidv4(), tenantId, name: 'Acesso', icon: 'Key', color: '#10B981', isActive: true },
          { id: uuidv4(), tenantId, name: 'Suporte', icon: 'HelpCircle', color: '#F59E0B', isActive: true },
          { id: uuidv4(), tenantId, name: 'Aquisição', icon: 'ShoppingCart', color: '#EF4444', isActive: true },
          { id: uuidv4(), tenantId, name: 'Recursos Humanos', icon: 'Users', color: '#8B5CF6', isActive: true }
        ];

        for (const category of defaultCategories) {
          await this.internalFormRepository.createCategory(category);
        }

        return res.status(200).json(defaultCategories);
      }

      res.status(200).json(categories);
    } catch (error) {
      console.error('❌ [InternalFormController] Error in getCategories:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar categorias',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async getSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const tenantId = req.user.tenantId;
      const { formId } = req.query;

      console.log(`[InternalFormController] Getting submissions for tenant: ${tenantId}, formId: ${formId}`);

      let submissions;
      if (formId) {
        submissions = await this.internalFormRepository.findSubmissions(formId as string, tenantId);
      } else {
        submissions = await this.internalFormRepository.findAllSubmissions(tenantId);
      }

      res.status(200).json(submissions);
    } catch (error) {
      console.error('❌ [InternalFormController] Error in getSubmissions:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar submissões',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async createSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const userEmail = req.user.email || '';

      console.log(`[InternalFormController] Creating submission for form: ${req.body.formId}`);

      // ✅ 1QA.MD: Buscar nome do usuário para exibição
      let submittedByName = userEmail;

      // Se houver email do usuário, usar como nome inicial
      if (userEmail) {
        submittedByName = userEmail;
      }

      const submissionData: FormSubmission = {
        id: uuidv4(),
        formId: req.body.formId,
        tenantId,
        submittedBy: userId,
        submittedByName, // ✅ Incluir nome do usuário
        submittedAt: new Date(),
        data: req.body.data,
        status: 'submitted' as const
      };

      console.log(`[InternalFormController] Submission data to be created:`, JSON.stringify(submissionData, null, 2));

      const submission = await this.internalFormRepository.createSubmission(submissionData);

      console.log(`✅ [InternalFormController] Submission created successfully: ${submission.id}`);

      res.status(201).json({
        success: true,
        data: submission,
        message: 'Submissão criada com sucesso'
      });
    } catch (error) {
      console.error('❌ [InternalFormController] Error in createSubmission:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao criar submissão',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}
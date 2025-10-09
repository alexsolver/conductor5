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
import { validateForm, FormField } from '../../../../utils/validators/form-validator';
import { ICustomerRepository } from '../../../customers/domain/repositories/ICustomerRepository';
import { getTenantDb } from '../../../../db-tenant';
import { customFormEntityLinks } from '@shared/schema-internal-forms';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email?: string;
  };
}

export class InternalFormController {
  constructor(
    private internalFormRepository: IInternalFormRepository,
    private customerRepository?: ICustomerRepository
  ) {}

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

      const { category, isActive, search, isTemplate } = req.query;

      // ✅ 1QA.MD: Only return active forms by default (soft delete compliance)
      const filters = {
        tenantId,
        category: category as string,
        isActive: isActive === 'false' ? false : undefined, // Only include inactive if explicitly requested
        search: search as string,
        isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined
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

      // ✅ VALIDATION: Buscar formulário para aplicar validações
      const form = await this.internalFormRepository.findById(req.body.formId, tenantId);

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Formulário não encontrado',
          code: 'FORM_NOT_FOUND'
        });
      }

      // ✅ VALIDATION: Aplicar validações nos campos
      const formFields: FormField[] = (form.fields || []).map((field: any) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required || false,
        validationRules: field.validationRules || []
      }));

      const validationErrors = validateForm(formFields, req.body.data || {});

      if (validationErrors.length > 0) {
        console.log(`❌ [InternalFormController] Validation errors:`, validationErrors);
        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors: validationErrors,
          code: 'VALIDATION_ERROR'
        });
      }

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

      // ✅ CRIAR LINKS DE ENTIDADES: Registrar entidades criadas durante preenchimento
      // Para campos com entityId no formato "entity:type:id" (ex: "entity:client:uuid")
      const entityLinks: any[] = [];
      const db = getTenantDb(tenantId);

      for (const field of form.fields || []) {
        const fieldValue = req.body.data[field.name];
        
        // Verificar se o valor é um entityId no formato "entity:type:id"
        if (fieldValue && typeof fieldValue === 'string' && fieldValue.startsWith('entity:')) {
          const [_, entityType, entityId] = fieldValue.split(':');
          
          if (entityType && entityId) {
            const link = {
              id: uuidv4(),
              tenantId,
              submissionId: submission.id,
              fieldId: field.id,
              entityType,
              entityId,
              createdAt: new Date(),
              createdBy: userId
            };

            await db.insert(customFormEntityLinks).values(link);
            entityLinks.push(link);
            console.log(`✅ [InternalFormController] Entity link created: ${entityType}:${entityId} for field ${field.name}`);
          }
        }
      }

      if (entityLinks.length > 0) {
        console.log(`✅ [InternalFormController] Created ${entityLinks.length} entity links`);
      }

      res.status(201).json({
        success: true,
        data: submission,
        entityLinks: entityLinks.length,
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

  /**
   * Get AI Context - Retorna metadados IA para preenchimento automatizado
   * Endpoint: GET /api/internal-forms/:formId/ai-context
   * 
   * Retorna instruções invisíveis para IA sobre como preencher cada campo:
   * - aiPrompt: Como perguntar ao usuário
   * - extractionHints: Como validar/extrair valor
   * - autoActions: Ações automáticas (search_client, create_if_not_found)
   * - examples: Exemplos de valores válidos
   */
  async getAIContext(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { formId } = req.params;
      const tenantId = req.user.tenantId;

      console.log(`[InternalFormController] Getting AI context for form: ${formId}`);

      const form = await this.internalFormRepository.findById(formId, tenantId);

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Formulário não encontrado',
          code: 'FORM_NOT_FOUND'
        });
      }

      // Extrair metadados IA de cada campo
      const aiContext = {
        formId: form.id,
        formName: form.name,
        formDescription: form.description,
        fields: (form.fields || []).map((field: any) => ({
          id: field.id,
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required || false,
          
          // Metadados IA (invisíveis para usuário)
          aiMetadata: field.aiMetadata || null
        })),
        
        // Validações globais do formulário
        validationRules: form.validationRules || {},
        
        // Fórmulas de cálculo
        calculationFormulas: form.calculationFormulas || {},
        
        // Lógica condicional
        conditionalLogic: form.conditionalLogic || {}
      };

      console.log(`✅ [InternalFormController] AI context retrieved with ${aiContext.fields.length} fields`);

      res.status(200).json({
        success: true,
        data: aiContext,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [InternalFormController] Error in getAIContext:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar contexto IA',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Search or Create Entity - Busca ou cria entidade (cliente, local, etc) durante preenchimento
   * Endpoint: POST /api/internal-forms/entity/search-or-create
   * 
   * Usado pela IA para:
   * 1. Buscar cliente por CPF/CNPJ/Email
   * 2. Se não encontrar, criar novo cliente
   * 3. Registrar link na tabela custom_form_entity_links
   */
  async searchOrCreateEntity(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { entityType, searchBy, value, entityData } = req.body;

      console.log(`[InternalFormController] Search or create entity - Type: ${entityType}, SearchBy: ${searchBy}, Value: ${value}`);

      // Validar entityType
      const validEntityTypes = ['client', 'location', 'ticket', 'beneficiary'];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de entidade inválido. Use: ${validEntityTypes.join(', ')}`,
          code: 'INVALID_ENTITY_TYPE'
        });
      }

      // ✅ INTEGRAÇÃO REAL COM MÓDULO DE CLIENTES
      if (entityType === 'client' && this.customerRepository) {
        let entityFound = null;

        // Buscar por CPF, CNPJ ou Email
        if (searchBy === 'cpf' && value) {
          entityFound = await this.customerRepository.findByCPFAndTenant(value, tenantId);
        } else if (searchBy === 'cnpj' && value) {
          entityFound = await this.customerRepository.findByCNPJAndTenant(value, tenantId);
        } else if (searchBy === 'email' && value) {
          entityFound = await this.customerRepository.findByEmailAndTenant(value, tenantId);
        }

        if (entityFound) {
          console.log(`✅ [InternalFormController] Cliente encontrado:`, entityFound.id);
          return res.status(200).json({
            success: true,
            found: true,
            data: entityFound,
            message: 'Cliente encontrado'
          });
        }

        // Cliente não encontrado - criar novo
        console.log(`[InternalFormController] Cliente não encontrado, criando novo...`);

        const newCustomer = await this.customerRepository.create({
          tenantId,
          firstName: entityData.firstName || '',
          lastName: entityData.lastName || '',
          email: entityData.email || '',
          phone: entityData.phone,
          mobilePhone: entityData.mobilePhone,
          cpf: entityData.cpf,
          addressStreet: entityData.addressStreet,
          addressNumber: entityData.addressNumber,
          addressComplement: entityData.addressComplement,
          addressNeighborhood: entityData.addressNeighborhood,
          addressCity: entityData.addressCity,
          addressState: entityData.addressState,
          addressZipCode: entityData.addressZipCode,
          addressCountry: entityData.addressCountry || 'Brasil',
          isActive: true,
          verified: false,
          tags: [],
          metadata: {},
          createdById: userId,
          updatedById: userId
        });

        console.log(`✅ [InternalFormController] Novo cliente criado:`, newCustomer.id);

        // TODO: Criar link na tabela custom_form_entity_links quando houver submissionId

        return res.status(201).json({
          success: true,
          found: false,
          created: true,
          data: newCustomer,
          message: 'Cliente criado com sucesso'
        });
      }

      // ❌ Outros tipos de entidade ainda não implementados
      return res.status(501).json({
        success: false,
        message: `Tipo de entidade '${entityType}' ainda não implementado. Apenas 'client' está disponível.`,
        code: 'NOT_IMPLEMENTED'
      });

    } catch (error) {
      console.error('❌ [InternalFormController] Error in searchOrCreateEntity:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar/criar entidade',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Submit ticket form and create ticket with automatic client/location creation
   * POST /api/internal-forms/submit-ticket-form
   */
  async submitTicketForm(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const formData = req.body.formData;

      console.log(`🎫 [SubmitTicketForm] Processing ticket form for tenant: ${tenantId}`);
      console.log(`🎫 [SubmitTicketForm] Form data:`, JSON.stringify(formData, null, 2));

      // 1. Validar CPF/CNPJ
      const { validateCPF, validateCNPJ } = await import('../../../../utils/validators/brazilian');
      const documento = (formData.cpf_cnpj || '').replace(/\D/g, '');
      
      let validationResult;
      if (documento.length === 11) {
        validationResult = validateCPF(documento);
      } else if (documento.length === 14) {
        validationResult = validateCNPJ(documento);
      } else {
        validationResult = { isValid: false, message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' };
      }

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message || 'CPF/CNPJ inválido',
          code: 'INVALID_DOCUMENT'
        });
      }

      // 2. Buscar ou criar cliente
      let customer = null;
      if (this.customerRepository) {
        const existingCustomers = await this.customerRepository.findAll({ tenantId });
        customer = existingCustomers.find(c => 
          (c.cpf && c.cpf.replace(/\D/g, '') === documento) ||
          (c.cnpj && c.cnpj.replace(/\D/g, '') === documento)
        );

        if (!customer) {
          console.log(`🆕 [SubmitTicketForm] Cliente não encontrado, criando novo...`);
          const newCustomer = {
            id: uuidv4(),
            tenantId,
            name: formData.nome_cliente,
            type: documento.length === 11 ? 'individual' as const : 'company' as const,
            cpf: documento.length === 11 ? documento : undefined,
            cnpj: documento.length === 14 ? documento : undefined,
            phone: formData.telefone,
            email: formData.email || undefined,
            isActive: true,
            verified: false,
            tags: [],
            metadata: {},
            createdById: userId,
            updatedById: userId
          };

          customer = await this.customerRepository.create(newCustomer);
          console.log(`✅ [SubmitTicketForm] Cliente criado: ${customer.id}`);
        } else {
          console.log(`✅ [SubmitTicketForm] Cliente encontrado: ${customer.id}`);
        }
      }

      // 3. Buscar ou criar location (se atendimento local)
      let locationId = null;
      if (formData.tipo_atendimento === 'Local' && formData.cep) {
        const { validateCEP } = await import('../../../../utils/validators/brazilian-validators');
        const cep = formData.cep.replace(/\D/g, '');
        
        if (!validateCEP(cep)) {
          return res.status(400).json({
            success: false,
            message: 'CEP inválido',
            code: 'INVALID_CEP'
          });
        }

        // Buscar location existente por CEP
        const db = await getTenantDb(tenantId);
        const { locations } = await import('@shared/schema-locations');
        const { eq } = await import('drizzle-orm');
        
        const existingLocations = await db.select()
          .from(locations)
          .where(eq(locations.zipCode, cep));

        if (existingLocations.length > 0) {
          locationId = existingLocations[0].id;
          console.log(`✅ [SubmitTicketForm] Location encontrada: ${locationId}`);
        } else {
          // Criar nova location
          const newLocation = {
            id: uuidv4(),
            tenantId,
            name: formData.endereco_completo || `Endereço ${cep}`,
            zipCode: cep,
            street: '',
            number: '',
            city: '',
            state: '',
            country: 'Brasil',
            type: 'service_location' as const,
            createdById: userId,
            updatedById: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await db.insert(locations).values(newLocation).returning();
          locationId = result[0].id;
          console.log(`✅ [SubmitTicketForm] Location criada: ${locationId}`);
        }
      }

      // 4. Criar ticket
      const { CreateTicketUseCase } = await import('../../../tickets/application/use-cases/CreateTicketUseCase');
      const { DrizzleTicketRepository } = await import('../../../tickets/infrastructure/repositories/DrizzleTicketRepository');
      
      const ticketRepo = new DrizzleTicketRepository();
      const createTicketUseCase = new CreateTicketUseCase(ticketRepo);

      const urgencyMap: { [key: string]: 'low' | 'medium' | 'high' | 'critical' } = {
        'Baixa': 'low',
        'Média': 'medium',
        'Alta': 'high',
        'Crítica': 'critical'
      };

      const ticketData = {
        subject: formData.titulo_ticket,
        description: formData.descricao_problema,
        status: 'new' as const,
        priority: 'medium' as const,
        urgency: urgencyMap[formData.urgencia] || 'medium' as const,
        impact: 'medium' as const,
        category: formData.categoria,
        subcategory: 'Automação',
        customerId: customer?.id,
        locationId: locationId || undefined,
        createdById: userId
      };

      const ticket = await createTicketUseCase.execute(ticketData, tenantId);
      console.log(`✅ [SubmitTicketForm] Ticket criado: ${ticket.number}`);

      // 5. Retornar número do ticket
      return res.status(201).json({
        success: true,
        ticketNumber: ticket.number,
        ticketId: ticket.id,
        customerId: customer?.id,
        locationId: locationId,
        message: `Seu ticket número ${ticket.number} foi criado com sucesso!`
      });

    } catch (error) {
      console.error('❌ [SubmitTicketForm] Error:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao criar ticket',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}
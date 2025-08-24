/**
 * ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATE APPLICATION SERVICE
 * Clean Architecture - Application Layer
 * Orquestração de casos de uso e coordenação entre camadas
 * 
 * @module TicketTemplateApplicationService
 * @compliance 1qa.md - Application Layer - Services coordination
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate } from '../../domain/entities/TicketTemplate';
import { TicketTemplateDomainService } from '../../domain/services/TicketTemplateDomainService';
import { 
  CreateTicketTemplateData, 
  UpdateTicketTemplateData, 
  GetTicketTemplatesData,
  TemplateAnalyticsData 
} from '../dto/TicketTemplateDTO';

export class TicketTemplateApplicationService {
  constructor(
    private readonly templateRepository: ITicketTemplateRepository
  ) {}

  /**
   * ✅ 1QA.MD: Buscar templates com filtros hierárquicos
   */
  async getTemplates(params: GetTicketTemplatesData) {
    const { 
      tenantId, 
      companyId, 
      category, 
      templateType, 
      status, 
      search,
      limit,
      offset,
      orderBy,
      orderDirection
    } = params;

    // Buscar templates com filtros
    const templates = await this.templateRepository.findAll(tenantId, {
      category,
      templateType,
      status,
      companyId: companyId || undefined
    });

    // Filtrar por hierarquia de empresa
    const filteredTemplates = templates.filter(template => 
      TicketTemplateDomainService.canBeUsedByCompany(template, companyId)
    );

    // Aplicar busca textual se fornecida
    let searchFiltered = filteredTemplates;
    if (search) {
      const searchTerm = search.toLowerCase();
      searchFiltered = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.category.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenação
    searchFiltered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (orderBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'usageCount':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (orderDirection === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Paginação
    const paginatedTemplates = searchFiltered.slice(offset, offset + limit);

    return {
      templates: paginatedTemplates,
      total: searchFiltered.length,
      totalPages: Math.ceil(searchFiltered.length / limit),
      currentPage: Math.floor(offset / limit) + 1,
      hasNext: offset + limit < searchFiltered.length,
      hasPrev: offset > 0
    };
  }

  /**
   * ✅ 1QA.MD: Buscar template por ID com validação de hierarquia
   */
  async getTemplateById(templateId: string, tenantId: string, companyId?: string | null) {
    const template = await this.templateRepository.findById(templateId, tenantId);
    
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Verificar se a empresa pode usar o template
    if (!TicketTemplateDomainService.canBeUsedByCompany(template, companyId)) {
      throw new Error('Template não disponível para esta empresa');
    }

    return template;
  }

  /**
   * ✅ 1QA.MD: Criar template com validação de domínio
   */
  async createTemplate(data: CreateTicketTemplateData): Promise<TicketTemplate> {
    // Validação do domínio
    const validation = TicketTemplateDomainService.validateTemplate(data);
    if (!validation.isValid) {
      throw new Error(`Erro de validação: ${validation.errors.join(', ')}`);
    }

    // Verificar se já existe template com o mesmo nome
    const existingTemplate = await this.templateRepository.findByName(data.name, data.tenantId);
    if (existingTemplate) {
      throw new Error('Já existe um template com este nome');
    }

    // Criar template
    const templateData = {
      ...data,
      id: crypto.randomUUID(),
      isSystem: false,
      usageCount: 0,
      lastUsed: null,
      metadata: {
        version: '1.0.0',
        author: data.createdById,
        lastModifiedBy: data.createdById,
        lastModifiedAt: new Date(),
        changeLog: [],
        usage: {
          totalUses: 0,
          lastMonth: 0
        },
        analytics: {
          popularFields: [],
          commonIssues: [],
          userFeedback: []
        },
        compliance: {
          gdprCompliant: true,
          auditRequired: false
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    return await this.templateRepository.create(templateData);
  }

  /**
   * ✅ 1QA.MD: Atualizar template com validação
   */
  async updateTemplate(data: UpdateTicketTemplateData): Promise<TicketTemplate> {
    const { templateId, tenantId, updatedById, ...updateData } = data;

    // Buscar template existente
    const existingTemplate = await this.templateRepository.findById(templateId, tenantId);
    if (!existingTemplate) {
      throw new Error('Template não encontrado');
    }

    // Validar dados de atualização
    const templateForValidation = { ...existingTemplate, ...updateData };
    const validation = TicketTemplateDomainService.validateTemplate(templateForValidation);
    if (!validation.isValid) {
      throw new Error(`Erro de validação: ${validation.errors.join(', ')}`);
    }

    // Atualizar metadados
    const updatedMetadata = {
      ...existingTemplate.metadata,
      lastModifiedBy: updatedById,
      lastModifiedAt: new Date(),
      version: this.incrementVersion(existingTemplate.metadata.version)
    };

    const finalUpdateData = {
      ...updateData,
      metadata: updatedMetadata,
      updatedAt: new Date()
    };

    const updatedTemplate = await this.templateRepository.update(templateId, tenantId, finalUpdateData);
    if (!updatedTemplate) {
      throw new Error('Erro ao atualizar template');
    }

    return updatedTemplate;
  }

  /**
   * ✅ 1QA.MD: Deletar template com verificação de dependências
   */
  async deleteTemplate(templateId: string, tenantId: string): Promise<boolean> {
    const template = await this.templateRepository.findById(templateId, tenantId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Não permitir deletar templates do sistema
    if (template.isSystem) {
      throw new Error('Templates do sistema não podem ser deletados');
    }

    // Verificar dependências
    const dependencies = await this.templateRepository.findDependencies(templateId, tenantId);
    if (dependencies.usedByWorkflows.length > 0 || dependencies.referencedByAutomation.length > 0) {
      throw new Error('Template possui dependências e não pode ser deletado');
    }

    return await this.templateRepository.delete(templateId, tenantId);
  }

  /**
   * ✅ 1QA.MD: Clonar template
   */
  async cloneTemplate(
    sourceId: string, 
    tenantId: string, 
    cloneData: {
      name: string;
      companyId?: string;
      clonedBy: string;
      includeAutomation?: boolean;
      includeWorkflow?: boolean;
    }
  ): Promise<TicketTemplate> {
    return await this.templateRepository.cloneTemplate(sourceId, tenantId, cloneData);
  }

  /**
   * ✅ 1QA.MD: Incrementar uso do template
   */
  async incrementUsage(templateId: string, tenantId: string): Promise<void> {
    await this.templateRepository.incrementUsageCount(templateId, tenantId);
    await this.templateRepository.updateLastUsed(templateId, tenantId);
  }

  /**
   * ✅ 1QA.MD: Buscar templates populares
   */
  async getPopularTemplates(tenantId: string, companyId?: string | null, limit: number = 10) {
    const templates = await this.templateRepository.getMostUsedTemplates(tenantId, limit * 2); // Buscar mais para filtrar
    
    // Filtrar por hierarquia
    const filteredTemplates = templates.filter(template => 
      TicketTemplateDomainService.canBeUsedByCompany(template, companyId)
    );

    return filteredTemplates.slice(0, limit);
  }

  /**
   * ✅ 1QA.MD: Buscar analytics de templates
   */
  async getTemplateAnalytics(params: TemplateAnalyticsData) {
    const { tenantId, companyId, dateRange } = params;

    // Buscar estatísticas de uso
    const usageStats = await this.templateRepository.getUsageStatistics(tenantId, dateRange);
    
    // Buscar templates da empresa/globais
    const templates = await this.templateRepository.findAll(tenantId, { 
      companyId: companyId || undefined 
    });

    const filteredTemplates = templates.filter(template => 
      TicketTemplateDomainService.canBeUsedByCompany(template, companyId)
    );

    // Gerar analytics do domínio
    const domainAnalytics = TicketTemplateDomainService.generateUsageAnalytics(filteredTemplates);

    return {
      ...usageStats,
      ...domainAnalytics,
      healthStatus: filteredTemplates.map(template => ({
        templateId: template.id,
        templateName: template.name,
        health: TicketTemplateDomainService.checkTemplateHealth(template)
      }))
    };
  }

  /**
   * ✅ 1QA.MD: Buscar categorias disponíveis
   */
  async getAvailableCategories(tenantId: string, companyId?: string | null): Promise<string[]> {
    const templates = await this.templateRepository.findActive(tenantId);
    
    const filteredTemplates = templates.filter(template => 
      TicketTemplateDomainService.canBeUsedByCompany(template, companyId)
    );

    const categories = [...new Set(filteredTemplates.map(t => t.category))];
    return categories.sort();
  }

  /**
   * Métodos auxiliares privados
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patchVersion = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patchVersion}`;
  }
}
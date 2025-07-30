
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { ticketTemplates, templateCategories, templateHierarchy } from '../../../@shared/schema';

interface CreateHierarchicalTemplateData {
  parentTemplateId?: string;
  name: string;
  category: string;
  companyId?: string;
  roleIds?: string[];
  inheritanceRules: {
    inheritFields: boolean;
    inheritValidations: boolean;
    inheritStyles: boolean;
    overrideMode: 'merge' | 'replace' | 'extend';
  };
  tenantId: string;
  createdBy: string;
}

interface TemplateContext {
  companyId?: string;
  roleId?: string;
  userId?: string;
}

export class TemplateInheritanceService {
  async createWithInheritance(data: CreateHierarchicalTemplateData) {
    return await db.transaction(async (tx) => {
      // Criar template base
      const [template] = await tx.insert(ticketTemplates).values({
        name: data.name,
        description: `Template hierárquico: ${data.name}`,
        categoryId: data.category,
        companyId: data.companyId,
        tenantId: data.tenantId,
        createdBy: data.createdBy,
        fields: [],
        metadata: {
          isHierarchical: true,
          inheritanceRules: data.inheritanceRules
        }
      }).returning();

      // Configurar herança se houver template pai
      if (data.parentTemplateId) {
        await tx.insert(templateHierarchy).values({
          childTemplateId: template.id,
          parentTemplateId: data.parentTemplateId,
          inheritanceRules: data.inheritanceRules,
          tenantId: data.tenantId
        });

        // Resolver herança imediatamente
        await this.resolveInheritanceForTemplate(tx, template.id, data.tenantId);
      }

      return template;
    });
  }

  async getHierarchy(tenantId: string, templateId: string) {
    // Buscar pais
    const parents = await this.getParentHierarchy(tenantId, templateId);
    
    // Buscar filhos
    const children = await this.getChildrenHierarchy(tenantId, templateId);

    return {
      templateId,
      parents,
      children,
      level: parents.length
    };
  }

  async getByCategory(tenantId: string, category: string, context?: TemplateContext) {
    let query = db
      .select()
      .from(ticketTemplates)
      .where(
        and(
          eq(ticketTemplates.tenantId, tenantId),
          eq(ticketTemplates.categoryId, category),
          eq(ticketTemplates.isActive, true)
        )
      );

    if (context?.companyId) {
      query = query.where(
        and(
          eq(ticketTemplates.companyId, context.companyId)
        )
      );
    }

    const templates = await query;

    // Resolver herança para cada template baseado no contexto
    return await Promise.all(
      templates.map(template => 
        this.resolveInheritance(tenantId, template.id, context)
      )
    );
  }

  async resolveInheritance(tenantId: string, templateId: string, context?: TemplateContext) {
    const template = await db
      .select()
      .from(ticketTemplates)
      .where(
        and(
          eq(ticketTemplates.id, templateId),
          eq(ticketTemplates.tenantId, tenantId)
        )
      )
      .then(rows => rows[0]);

    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Se não é hierárquico, retorna direto
    if (!template.metadata?.isHierarchical) {
      return template;
    }

    // Buscar hierarquia completa
    const hierarchy = await this.getParentHierarchy(tenantId, templateId);
    
    // Resolver herança de baixo para cima
    let resolvedTemplate = { ...template };
    
    for (const parent of hierarchy.reverse()) {
      resolvedTemplate = this.mergeTemplates(parent.template, resolvedTemplate, parent.inheritanceRules);
    }

    return resolvedTemplate;
  }

  private async getParentHierarchy(tenantId: string, templateId: string, visited = new Set()): Promise<any[]> {
    if (visited.has(templateId)) {
      throw new Error('Hierarquia circular detectada');
    }
    visited.add(templateId);

    const parentRelation = await db
      .select({
        parent: ticketTemplates,
        inheritanceRules: templateHierarchy.inheritanceRules
      })
      .from(templateHierarchy)
      .innerJoin(ticketTemplates, eq(templateHierarchy.parentTemplateId, ticketTemplates.id))
      .where(
        and(
          eq(templateHierarchy.childTemplateId, templateId),
          eq(templateHierarchy.tenantId, tenantId)
        )
      )
      .then(rows => rows[0]);

    if (!parentRelation) {
      return [];
    }

    const parentHierarchy = await this.getParentHierarchy(
      tenantId, 
      parentRelation.parent.id, 
      visited
    );

    return [
      ...parentHierarchy,
      {
        template: parentRelation.parent,
        inheritanceRules: parentRelation.inheritanceRules
      }
    ];
  }

  private async getChildrenHierarchy(tenantId: string, templateId: string): Promise<any[]> {
    const children = await db
      .select({
        child: ticketTemplates,
        inheritanceRules: templateHierarchy.inheritanceRules
      })
      .from(templateHierarchy)
      .innerJoin(ticketTemplates, eq(templateHierarchy.childTemplateId, ticketTemplates.id))
      .where(
        and(
          eq(templateHierarchy.parentTemplateId, templateId),
          eq(templateHierarchy.tenantId, tenantId)
        )
      );

    return children.map(child => ({
      template: child.child,
      inheritanceRules: child.inheritanceRules
    }));
  }

  private mergeTemplates(parent: any, child: any, rules: any) {
    const merged = { ...child };

    if (rules.inheritFields) {
      const parentFields = parent.fields || [];
      const childFields = child.fields || [];
      
      switch (rules.overrideMode) {
        case 'merge':
          merged.fields = this.mergeFields(parentFields, childFields);
          break;
        case 'replace':
          merged.fields = childFields.length > 0 ? childFields : parentFields;
          break;
        case 'extend':
          merged.fields = [...parentFields, ...childFields];
          break;
      }
    }

    if (rules.inheritValidations && parent.validations) {
      merged.validations = {
        ...parent.validations,
        ...child.validations
      };
    }

    if (rules.inheritStyles && parent.styling) {
      merged.styling = {
        ...parent.styling,
        ...child.styling
      };
    }

    return merged;
  }

  private mergeFields(parentFields: any[], childFields: any[]) {
    const merged = [...parentFields];
    
    childFields.forEach(childField => {
      const existingIndex = merged.findIndex(f => f.name === childField.name);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...childField };
      } else {
        merged.push(childField);
      }
    });

    return merged;
  }

  private async resolveInheritanceForTemplate(tx: any, templateId: string, tenantId: string) {
    // Implementar resolução imediata de herança após criação
    // Isso otimiza performance para templates usados frequentemente
  }
}

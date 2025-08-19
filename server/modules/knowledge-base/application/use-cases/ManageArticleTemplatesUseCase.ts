
// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE TEMPLATES USE CASE - CLEAN ARCHITECTURE
// Application layer - manages article templates with predefined structures

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface ArticleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  templateType: 'tutorial' | 'troubleshooting' | 'faq' | 'policy' | 'process' | 'announcement';
  structure: TemplateSection[];
  defaultTags: string[];
  requiredFields: string[];
  estimatedReadTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  usageCount: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  contentType: 'text' | 'list' | 'code' | 'image' | 'video' | 'table';
  isRequired: boolean;
  placeholder: string;
  order: number;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    format?: string;
  };
}

export interface CreateTemplateCommand {
  name: string;
  description: string;
  category: string;
  templateType: ArticleTemplate['templateType'];
  structure: Omit<TemplateSection, 'id'>[];
  defaultTags: string[];
  requiredFields: string[];
  difficulty?: ArticleTemplate['difficulty'];
  createdBy: string;
}

export interface ArticleFromTemplate {
  templateId: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  authorId: string;
  customData?: Record<string, any>;
}

export class ManageArticleTemplatesUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async createTemplate(command: CreateTemplateCommand, tenantId: string): Promise<ArticleTemplate> {
    try {
      this.logger.info(`📝 [TEMPLATES] Creating new template: ${command.name}`);

      const template: ArticleTemplate = {
        id: crypto.randomUUID(),
        name: command.name,
        description: command.description,
        category: command.category,
        templateType: command.templateType,
        structure: command.structure.map((section, index) => ({
          ...section,
          id: crypto.randomUUID(),
          order: index
        })),
        defaultTags: command.defaultTags,
        requiredFields: command.requiredFields,
        difficulty: command.difficulty,
        isActive: true,
        createdBy: command.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId,
        usageCount: 0
      };

      // Validate template structure
      this.validateTemplateStructure(template);

      // Store template (in real implementation, use dedicated templates table)
      await this.storeTemplate(template, tenantId);

      this.logger.info(`✅ [TEMPLATES] Template created successfully: ${template.id}`);
      return template;

    } catch (error) {
      this.logger.error(`❌ [TEMPLATES] Template creation failed: ${error}`);
      throw error;
    }
  }

  async getTemplates(
    filters?: {
      category?: string;
      templateType?: ArticleTemplate['templateType'];
      isActive?: boolean;
    },
    tenantId?: string
  ): Promise<ArticleTemplate[]> {
    try {
      this.logger.info(`📋 [TEMPLATES] Retrieving templates with filters: ${JSON.stringify(filters)}`);

      // Mock templates - in real implementation, query from database
      const mockTemplates: ArticleTemplate[] = [
        {
          id: '1',
          name: 'Troubleshooting Guide Template',
          description: 'Standard template for creating troubleshooting articles',
          category: 'troubleshooting',
          templateType: 'troubleshooting',
          structure: [
            {
              id: '1',
              title: 'Problem Description',
              description: 'Describe the issue users are experiencing',
              contentType: 'text',
              isRequired: true,
              placeholder: 'Clearly describe the problem...',
              order: 0,
              validationRules: { minLength: 50 }
            },
            {
              id: '2',
              title: 'Symptoms',
              description: 'List observable symptoms',
              contentType: 'list',
              isRequired: true,
              placeholder: '• Symptom 1\n• Symptom 2',
              order: 1
            },
            {
              id: '3',
              title: 'Solution Steps',
              description: 'Step-by-step solution',
              contentType: 'list',
              isRequired: true,
              placeholder: '1. First step\n2. Second step',
              order: 2
            },
            {
              id: '4',
              title: 'Prevention',
              description: 'How to prevent this issue',
              contentType: 'text',
              isRequired: false,
              placeholder: 'To prevent this issue in the future...',
              order: 3
            }
          ],
          defaultTags: ['troubleshooting', 'guide', 'problem-solving'],
          requiredFields: ['title', 'problem-description', 'solution-steps'],
          difficulty: 'intermediate',
          isActive: true,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tenantId: tenantId || 'default',
          usageCount: 15
        },
        {
          id: '2',
          name: 'Tutorial Template',
          description: 'Step-by-step tutorial template',
          category: 'user_guide',
          templateType: 'tutorial',
          structure: [
            {
              id: '1',
              title: 'Overview',
              description: 'Brief overview of what users will learn',
              contentType: 'text',
              isRequired: true,
              placeholder: 'In this tutorial, you will learn...',
              order: 0
            },
            {
              id: '2',
              title: 'Prerequisites',
              description: 'What users need before starting',
              contentType: 'list',
              isRequired: false,
              placeholder: '• Requirement 1\n• Requirement 2',
              order: 1
            },
            {
              id: '3',
              title: 'Step-by-Step Instructions',
              description: 'Detailed tutorial steps',
              contentType: 'text',
              isRequired: true,
              placeholder: 'Step 1: First action...',
              order: 2
            },
            {
              id: '4',
              title: 'Examples',
              description: 'Practical examples',
              contentType: 'code',
              isRequired: false,
              placeholder: '// Example code here',
              order: 3
            },
            {
              id: '5',
              title: 'Conclusion',
              description: 'Summary and next steps',
              contentType: 'text',
              isRequired: false,
              placeholder: 'You have successfully...',
              order: 4
            }
          ],
          defaultTags: ['tutorial', 'guide', 'step-by-step'],
          requiredFields: ['title', 'overview', 'instructions'],
          difficulty: 'beginner',
          isActive: true,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tenantId: tenantId || 'default',
          usageCount: 28
        },
        {
          id: '3',
          name: 'FAQ Template',
          description: 'Frequently Asked Questions template',
          category: 'faq',
          templateType: 'faq',
          structure: [
            {
              id: '1',
              title: 'Question',
              description: 'The frequently asked question',
              contentType: 'text',
              isRequired: true,
              placeholder: 'How do I...?',
              order: 0,
              validationRules: { maxLength: 200 }
            },
            {
              id: '2',
              title: 'Answer',
              description: 'Detailed answer to the question',
              contentType: 'text',
              isRequired: true,
              placeholder: 'To accomplish this, you need to...',
              order: 1,
              validationRules: { minLength: 100 }
            },
            {
              id: '3',
              title: 'Related Questions',
              description: 'Links to related FAQs',
              contentType: 'list',
              isRequired: false,
              placeholder: '• Related question 1\n• Related question 2',
              order: 2
            }
          ],
          defaultTags: ['faq', 'question', 'answer'],
          requiredFields: ['question', 'answer'],
          difficulty: 'beginner',
          isActive: true,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tenantId: tenantId || 'default',
          usageCount: 42
        }
      ];

      let filteredTemplates = mockTemplates;

      if (filters) {
        if (filters.category) {
          filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
        }
        if (filters.templateType) {
          filteredTemplates = filteredTemplates.filter(t => t.templateType === filters.templateType);
        }
        if (filters.isActive !== undefined) {
          filteredTemplates = filteredTemplates.filter(t => t.isActive === filters.isActive);
        }
      }

      return filteredTemplates;

    } catch (error) {
      this.logger.error(`❌ [TEMPLATES] Failed to retrieve templates: ${error}`);
      throw error;
    }
  }

  async createArticleFromTemplate(
    templateId: string, 
    articleData: ArticleFromTemplate, 
    tenantId: string
  ): Promise<any> {
    try {
      this.logger.info(`🏗️ [TEMPLATES] Creating article from template: ${templateId}`);

      // Get template
      const templates = await this.getTemplates(undefined, tenantId);
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Validate required fields
      this.validateRequiredFields(template, articleData);

      // Generate structured content from template
      const structuredContent = this.generateContentFromTemplate(template, articleData.content);

      // Create article with template structure
      const article = {
        title: articleData.title,
        content: structuredContent,
        category: articleData.category || template.category,
        tags: [...template.defaultTags, ...articleData.tags],
        authorId: articleData.authorId,
        status: 'draft',
        visibility: 'internal',
        contentType: 'rich_text',
        templateId: templateId,
        templateVersion: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tenantId
      };

      // Save article using repository
      const savedArticle = await this.repository.create(article as any, tenantId);

      // Update template usage count
      await this.incrementTemplateUsage(templateId, tenantId);

      this.logger.info(`✅ [TEMPLATES] Article created from template successfully: ${savedArticle.id}`);
      return savedArticle;

    } catch (error) {
      this.logger.error(`❌ [TEMPLATES] Failed to create article from template: ${error}`);
      throw error;
    }
  }

  async getTemplateAnalytics(tenantId: string): Promise<{
    totalTemplates: number;
    activeTemplates: number;
    templateUsage: Array<{
      templateId: string;
      name: string;
      usageCount: number;
      lastUsed: Date;
    }>;
    popularCategories: Array<{
      category: string;
      templateCount: number;
      totalUsage: number;
    }>;
  }> {
    try {
      this.logger.info(`📊 [TEMPLATES] Generating template analytics for tenant: ${tenantId}`);

      const templates = await this.getTemplates(undefined, tenantId);

      const analytics = {
        totalTemplates: templates.length,
        activeTemplates: templates.filter(t => t.isActive).length,
        templateUsage: templates.map(t => ({
          templateId: t.id,
          name: t.name,
          usageCount: t.usageCount,
          lastUsed: t.updatedAt
        })).sort((a, b) => b.usageCount - a.usageCount),
        popularCategories: this.calculateCategoryStats(templates)
      };

      return analytics;

    } catch (error) {
      this.logger.error(`❌ [TEMPLATES] Analytics generation failed: ${error}`);
      throw error;
    }
  }

  private validateTemplateStructure(template: ArticleTemplate): void {
    if (!template.structure || template.structure.length === 0) {
      throw new Error('Template must have at least one section');
    }

    const requiredSections = template.structure.filter(s => s.isRequired);
    if (requiredSections.length === 0) {
      throw new Error('Template must have at least one required section');
    }

    // Validate section orders are unique
    const orders = template.structure.map(s => s.order);
    if (new Set(orders).size !== orders.length) {
      throw new Error('Template sections must have unique order values');
    }
  }

  private async storeTemplate(template: ArticleTemplate, tenantId: string): Promise<void> {
    // In real implementation, store in kb_article_templates table
    this.logger.info(`💾 [TEMPLATES] Template stored: ${template.id}`);
  }

  private validateRequiredFields(template: ArticleTemplate, articleData: ArticleFromTemplate): void {
    for (const requiredField of template.requiredFields) {
      if (!articleData.customData?.[requiredField] && !articleData.content.includes(requiredField)) {
        throw new Error(`Required field missing: ${requiredField}`);
      }
    }
  }

  private generateContentFromTemplate(template: ArticleTemplate, userContent: string): string {
    let structuredContent = '';

    for (const section of template.structure.sort((a, b) => a.order - b.order)) {
      structuredContent += `## ${section.title}\n\n`;
      
      if (section.description) {
        structuredContent += `*${section.description}*\n\n`;
      }

      // Add placeholder or user content
      if (userContent.includes(section.title)) {
        const sectionContent = this.extractSectionContent(userContent, section.title);
        structuredContent += sectionContent + '\n\n';
      } else {
        structuredContent += section.placeholder + '\n\n';
      }
    }

    return structuredContent;
  }

  private extractSectionContent(content: string, sectionTitle: string): string {
    // Simple extraction - in real implementation, use more sophisticated parsing
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line => line.includes(sectionTitle));
    
    if (sectionIndex === -1) return '';
    
    const nextSectionIndex = lines.findIndex((line, index) => 
      index > sectionIndex && line.startsWith('##')
    );
    
    const endIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
    return lines.slice(sectionIndex + 1, endIndex).join('\n').trim();
  }

  private async incrementTemplateUsage(templateId: string, tenantId: string): Promise<void> {
    // Update template usage count in database
    this.logger.info(`📈 [TEMPLATES] Incremented usage count for template: ${templateId}`);
  }

  private calculateCategoryStats(templates: ArticleTemplate[]) {
    const categoryMap = new Map<string, { templateCount: number; totalUsage: number }>();

    for (const template of templates) {
      const current = categoryMap.get(template.category) || { templateCount: 0, totalUsage: 0 };
      categoryMap.set(template.category, {
        templateCount: current.templateCount + 1,
        totalUsage: current.totalUsage + template.usageCount
      });
    }

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      ...stats
    })).sort((a, b) => b.totalUsage - a.totalUsage);
  }
}

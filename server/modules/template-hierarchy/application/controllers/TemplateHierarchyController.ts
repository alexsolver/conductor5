/**
 * Template Hierarchy Controller
 * Clean Architecture - Application Layer
 * 
 * @module TemplateHierarchyController
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { CreateTemplateHierarchyUseCase } from '../use-cases/CreateTemplateHierarchyUseCase';
import { GetTemplateHierarchyUseCase } from '../use-cases/GetTemplateHierarchyUseCase';
import { UpdateTemplateHierarchyUseCase } from '../use-cases/UpdateTemplateHierarchyUseCase';

export class TemplateHierarchyController {
  constructor(
    private createTemplateHierarchyUseCase: CreateTemplateHierarchyUseCase,
    private getTemplateHierarchyUseCase: GetTemplateHierarchyUseCase,
    private updateTemplateHierarchyUseCase: UpdateTemplateHierarchyUseCase
  ) {}

  /**
   * Create template hierarchy
   * POST /template-hierarchy
   */
  createTemplate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!tenantId || !userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.createTemplateHierarchyUseCase.execute({
        tenantId,
        name: req.body.name,
        category: req.body.category,
        parentTemplateId: req.body.parentTemplateId,
        companyId: req.body.companyId,
        roleIds: req.body.roleIds,
        templateData: req.body.templateData,
        inheritanceRules: req.body.inheritanceRules,
        description: req.body.description,
        tags: req.body.tags,
        createdBy: userId,
        userRole
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: result.errors
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Template hierarchy created successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateHierarchyController] createTemplate error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get all templates or specific template hierarchy
   * GET /template-hierarchy
   * GET /template-hierarchy/:id
   */
  getTemplates = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const templateId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTemplateHierarchyUseCase.execute({
        tenantId,
        templateId,
        category: req.query.category as string,
        includeResolved: req.query.includeResolved === 'true',
        userRole,
        filters: {
          parentId: req.query.parentId as string,
          level: req.query.level ? parseInt(req.query.level as string) : undefined,
          companyId: req.query.companyId as string,
          roleId: req.query.roleId as string,
          isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
        }
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Templates retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateHierarchyController] getTemplates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update template hierarchy
   * PUT /template-hierarchy/:id
   */
  updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const templateId = req.params.id;

      if (!tenantId || !userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.updateTemplateHierarchyUseCase.execute({
        tenantId,
        templateId,
        updates: req.body,
        updatedBy: userId,
        userRole,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Update failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Template hierarchy updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateHierarchyController] updateTemplate error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get template categories
   * GET /template-hierarchy/categories
   */
  getCategories = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTemplateHierarchyUseCase.execute({
        tenantId,
        userRole
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get categories',
          errors: result.errors
        });
      }

      // Extract unique categories from templates
      const categories = result.data?.templates 
        ? [...new Set(result.data.templates.map(t => t.category))]
        : [];

      return res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories,
          categoryStats: result.data?.statistics?.templatesByCategory || {}
        }
      });

    } catch (error) {
      console.error('[TemplateHierarchyController] getCategories error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get templates by category
   * GET /template-hierarchy/category/:category
   */
  getTemplatesByCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const category = req.params.category;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTemplateHierarchyUseCase.execute({
        tenantId,
        category,
        userRole,
        filters: {
          companyId: req.query.companyId as string,
          roleId: req.query.roleId as string
        }
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Category not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Templates by category retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateHierarchyController] getTemplatesByCategory error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get template hierarchy tree
   * GET /template-hierarchy/:id/hierarchy
   */
  getTemplateHierarchy = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const templateId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTemplateHierarchyUseCase.execute({
        tenantId,
        templateId,
        userRole,
        includeResolved: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Template hierarchy not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Template hierarchy retrieved successfully',
        data: {
          hierarchy: result.data?.hierarchy,
          resolvedTemplate: result.data?.resolvedTemplate
        }
      });

    } catch (error) {
      console.error('[TemplateHierarchyController] getTemplateHierarchy error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get root templates
   * GET /template-hierarchy/roots
   */
  getRootTemplates = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getTemplateHierarchyUseCase.execute({
        tenantId,
        userRole,
        filters: {
          level: 0 // Root templates
        }
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get root templates',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Root templates retrieved successfully',
        data: {
          templates: result.data?.templates || [],
          statistics: result.data?.statistics
        }
      });

    } catch (error) {
      console.error('[TemplateHierarchyController] getRootTemplates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
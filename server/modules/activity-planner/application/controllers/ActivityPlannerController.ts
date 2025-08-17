// ✅ 1QA.MD COMPLIANCE: Activity Planner Application Controller
// Clean Architecture Application Layer - HTTP Controller

import { Request, Response } from 'express';
import { z } from 'zod';
import { IActivityPlannerRepository } from '../../domain/repositories/IActivityPlannerRepository';
import { ActivityInstance } from '../../domain/entities/ActivityInstance';
import { insertActivityCategorySchema, insertActivityTemplateSchema, insertActivityScheduleSchema, insertActivityInstanceSchema } from '@shared/schema-activity-planner';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    email: string;
  };
}

export class ActivityPlannerController {
  constructor(
    private readonly activityRepository: IActivityPlannerRepository
  ) {}

  // Dashboard & Analytics
  async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const [summary, overdue, upcoming] = await Promise.all([
        this.activityRepository.getActivitySummary(tenantId, { dateFrom, dateTo }),
        this.activityRepository.getOverdueInstances(tenantId),
        this.activityRepository.getUpcomingInstances(tenantId, 7)
      ]);

      res.json({
        success: true,
        data: {
          summary,
          overdueCount: overdue.length,
          upcomingCount: upcoming.length,
          overdue: overdue.slice(0, 5), // Top 5 overdue
          upcoming: upcoming.slice(0, 5) // Next 5 upcoming
        }
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error getting dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard metrics',
        error: error.message
      });
    }
  }

  // Activity Categories
  async createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      
      const validatedData = insertActivityCategorySchema.parse({
        ...req.body,
        tenantId,
        createdBy: userId
      });

      const category = await this.activityRepository.createCategory(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error creating category:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create category',
          error: error.message
        });
      }
    }
  }

  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const parentId = req.query.parentId as string | undefined;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

      const categories = await this.activityRepository.getCategories(tenantId, {
        parentId: parentId || undefined,
        isActive
      });

      res.json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: error.message
      });
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      const categoryId = req.params.id;

      const validatedData = { ...req.body, updatedBy: userId };
      const category = await this.activityRepository.updateCategory(categoryId, tenantId, validatedData);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error.message
      });
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const categoryId = req.params.id;

      await this.activityRepository.deleteCategory(categoryId, tenantId);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error.message
      });
    }
  }

  // Activity Templates
  async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      
      const validatedData = insertActivityTemplateSchema.parse({
        ...req.body,
        tenantId,
        createdBy: userId
      });

      const template = await this.activityRepository.createTemplate(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error creating template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create template',
          error: error.message
        });
      }
    }
  }

  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const filters = {
        categoryId: req.query.categoryId as string | undefined,
        activityType: req.query.activityType as string | undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };

      const templates = await this.activityRepository.getTemplates(tenantId, filters);

      res.json({
        success: true,
        data: templates
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error getting templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get templates',
        error: error.message
      });
    }
  }

  // Activity Schedules
  async createSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      
      const validatedData = insertActivityScheduleSchema.parse({
        ...req.body,
        tenantId,
        createdBy: userId
      });

      const schedule = await this.activityRepository.createSchedule(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error creating schedule:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create schedule',
          error: error.message
        });
      }
    }
  }

  async getSchedules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const filters = {
        templateId: req.query.templateId as string | undefined,
        assetId: req.query.assetId as string | undefined,
        locationId: req.query.locationId as string | undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        frequency: req.query.frequency as string | undefined
      };

      const schedules = await this.activityRepository.getSchedules(tenantId, filters);

      res.json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error getting schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get schedules',
        error: error.message
      });
    }
  }

  // Activity Instances
  async createInstance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      
      const validatedData = insertActivityInstanceSchema.parse({
        ...req.body,
        tenantId,
        createdBy: userId
      });

      const instance = await this.activityRepository.createInstance(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Activity instance created successfully',
        data: instance
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error creating instance:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create activity instance',
          error: error.message
        });
      }
    }
  }

  async getInstances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      
      const filters = {
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        activityType: req.query.activityType ? (req.query.activityType as string).split(',') : undefined,
        priority: req.query.priority ? (req.query.priority as string).split(',') : undefined,
        assignedUserId: req.query.assignedUserId as string | undefined,
        assignedTeamId: req.query.assignedTeamId as string | undefined,
        scheduledDateFrom: req.query.scheduledDateFrom ? new Date(req.query.scheduledDateFrom as string) : undefined,
        scheduledDateTo: req.query.scheduledDateTo ? new Date(req.query.scheduledDateTo as string) : undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        assetId: req.query.assetId as string | undefined,
        locationId: req.query.locationId as string | undefined,
        isOverdue: req.query.isOverdue ? req.query.isOverdue === 'true' : undefined,
        categoryId: req.query.categoryId as string | undefined,
        templateId: req.query.templateId as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const instances = await this.activityRepository.getInstances(tenantId, filters);

      res.json({
        success: true,
        data: instances
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error getting instances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity instances',
        error: error.message
      });
    }
  }

  async updateInstance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      const instanceId = req.params.id;

      const validatedData = { ...req.body, updatedBy: userId };
      const instance = await this.activityRepository.updateInstance(instanceId, tenantId, validatedData);

      res.json({
        success: true,
        message: 'Activity instance updated successfully',
        data: instance
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error updating instance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update activity instance',
        error: error.message
      });
    }
  }

  async deleteInstance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const instanceId = req.params.id;

      await this.activityRepository.deleteInstance(instanceId, tenantId);

      res.json({
        success: true,
        message: 'Activity instance deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error deleting instance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete activity instance',
        error: error.message
      });
    }
  }

  // Instance Operations
  async startInstance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      const instanceId = req.params.id;

      const instance = await this.activityRepository.getInstanceById(instanceId, tenantId);
      if (!instance) {
        res.status(404).json({
          success: false,
          message: 'Activity instance not found'
        });
        return;
      }

      const activityEntity = new ActivityInstance(
        instance.id,
        instance.tenantId,
        instance.title,
        instance.activityType,
        instance.status,
        instance.priority,
        instance.scheduledDate,
        instance.isOverdue,
        instance.attachments,
        instance.createdAt,
        instance.updatedAt,
        instance.createdBy,
        instance.scheduleId,
        instance.templateId,
        instance.description,
        instance.startedAt,
        instance.completedAt,
        instance.dueDate,
        instance.estimatedDuration,
        instance.actualDuration,
        instance.assignedUserId,
        instance.assignedTeamId,
        instance.completedBy,
        instance.assetId,
        instance.locationId,
        instance.parentInstanceId,
        instance.workOrderNumber,
        instance.overdueBy,
        instance.checklistData,
        instance.comments,
        instance.completionNotes,
        instance.qualityScore,
        instance.customerFeedback,
        instance.metadata,
        instance.updatedBy
      );

      activityEntity.start(userId);

      const updatedInstance = await this.activityRepository.updateInstance(instanceId, tenantId, {
        status: activityEntity.status,
        startedAt: activityEntity.startedAt,
        updatedAt: activityEntity.updatedAt,
        updatedBy: activityEntity.updatedBy
      });

      res.json({
        success: true,
        message: 'Activity instance started successfully',
        data: updatedInstance
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error starting instance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start activity instance',
        error: error.message
      });
    }
  }

  async completeInstance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      const instanceId = req.params.id;
      const { completionNotes, qualityScore } = req.body;

      const instance = await this.activityRepository.getInstanceById(instanceId, tenantId);
      if (!instance) {
        res.status(404).json({
          success: false,
          message: 'Activity instance not found'
        });
        return;
      }

      const activityEntity = new ActivityInstance(
        instance.id,
        instance.tenantId,
        instance.title,
        instance.activityType,
        instance.status,
        instance.priority,
        instance.scheduledDate,
        instance.isOverdue,
        instance.attachments,
        instance.createdAt,
        instance.updatedAt,
        instance.createdBy,
        instance.scheduleId,
        instance.templateId,
        instance.description,
        instance.startedAt,
        instance.completedAt,
        instance.dueDate,
        instance.estimatedDuration,
        instance.actualDuration,
        instance.assignedUserId,
        instance.assignedTeamId,
        instance.completedBy,
        instance.assetId,
        instance.locationId,
        instance.parentInstanceId,
        instance.workOrderNumber,
        instance.overdueBy,
        instance.checklistData,
        instance.comments,
        instance.completionNotes,
        instance.qualityScore,
        instance.customerFeedback,
        instance.metadata,
        instance.updatedBy
      );

      activityEntity.complete(userId, completionNotes, qualityScore);

      const updatedInstance = await this.activityRepository.updateInstance(instanceId, tenantId, {
        status: activityEntity.status,
        completedAt: activityEntity.completedAt,
        completedBy: activityEntity.completedBy,
        completionNotes: activityEntity.completionNotes,
        qualityScore: activityEntity.qualityScore,
        actualDuration: activityEntity.actualDuration,
        updatedAt: activityEntity.updatedAt,
        updatedBy: activityEntity.updatedBy
      });

      res.json({
        success: true,
        message: 'Activity instance completed successfully',
        data: updatedInstance
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error completing instance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete activity instance',
        error: error.message
      });
    }
  }

  // Specialized Views
  async getOverdueInstances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const instances = await this.activityRepository.getOverdueInstances(tenantId);

      res.json({
        success: true,
        data: instances
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error getting overdue instances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get overdue instances',
        error: error.message
      });
    }
  }

  async getUpcomingInstances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      
      const instances = await this.activityRepository.getUpcomingInstances(tenantId, days);

      res.json({
        success: true,
        data: instances
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error getting upcoming instances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming instances',
        error: error.message
      });
    }
  }

  // Bulk Operations
  async bulkUpdateInstanceStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      const { instanceIds, status } = req.body;

      if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Instance IDs array is required'
        });
        return;
      }

      await this.activityRepository.bulkUpdateInstanceStatus(instanceIds, tenantId, status, userId);

      res.json({
        success: true,
        message: `Successfully updated status for ${instanceIds.length} instances`
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error bulk updating status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update instance status',
        error: error.message
      });
    }
  }

  async bulkAssignInstances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId!;
      const userId = req.user?.userId!;
      const { instanceIds, assignedUserId, assignedTeamId } = req.body;

      if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Instance IDs array is required'
        });
        return;
      }

      await this.activityRepository.bulkAssignInstances(instanceIds, tenantId, assignedUserId, assignedTeamId, userId);

      res.json({
        success: true,
        message: `Successfully assigned ${instanceIds.length} instances`
      });
    } catch (error: any) {
      console.error('❌ [ActivityPlannerController] Error bulk assigning instances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk assign instances',
        error: error.message
      });
    }
  }
}
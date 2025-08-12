/**
 * Dashboard Controller
 * Clean Architecture - Application Layer
 * 
 * @module DashboardController
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { GetDashboardStatsUseCase } from '../use-cases/GetDashboardStatsUseCase';
import { GetRecentActivityUseCase } from '../use-cases/GetRecentActivityUseCase';
import { CreateActivityItemUseCase } from '../use-cases/CreateActivityItemUseCase';

export class DashboardController {
  constructor(
    private getDashboardStatsUseCase: GetDashboardStatsUseCase,
    private getRecentActivityUseCase: GetRecentActivityUseCase,
    private createActivityItemUseCase: CreateActivityItemUseCase
  ) {}

  /**
   * Get dashboard statistics
   * GET /dashboard/stats
   */
  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const timeRange = req.query.timeRange as string;
      const includePerformanceMetrics = req.query.includePerformance === 'true';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
      }

      const result = await this.getDashboardStatsUseCase.execute({
        tenantId,
        timeRange,
        includePerformanceMetrics
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to get dashboard stats',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Dashboard stats retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[DashboardController] getDashboardStats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get recent activity
   * GET /dashboard/activity
   */
  getRecentActivity = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.query.userId as string;
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const timeRange = req.query.timeRange as string;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
      }

      const result = await this.getRecentActivityUseCase.execute({
        tenantId,
        userId,
        entityType,
        entityId,
        limit,
        timeRange
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to get recent activity',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[DashboardController] getRecentActivity error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Create activity item
   * POST /dashboard/activity
   */
  createActivityItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const userName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim();

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.createActivityItemUseCase.execute({
        tenantId,
        userId,
        userName: userName || 'Unknown User',
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create activity item',
          errors: result.errors
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Activity item created successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[DashboardController] createActivityItem error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get system performance metrics
   * GET /dashboard/performance
   */
  getPerformanceMetrics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
      }

      // Get system performance metrics
      const performanceMetrics = {
        responseTime: Math.random() * 100 + 50, // Mock data - replace with real metrics
        systemLoad: process.cpuUsage(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        diskUsage: 0, // Would need system call
        databaseConnections: 10, // Mock data
        activeUsers: Math.floor(Math.random() * 50) + 10,
        requestsPerMinute: Math.floor(Math.random() * 1000) + 100,
        errorRate: Math.random() * 5, // Percentage
        uptime: process.uptime(),
        lastUpdated: new Date()
      };

      return res.json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: performanceMetrics
      });

    } catch (error) {
      console.error('[DashboardController] getPerformanceMetrics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
/**
 * Dashboard Controller
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';
import { GetDashboardMetricsUseCase } from '../use-cases/GetDashboardMetricsUseCase';

export class DashboardController {
  constructor(
    private getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  ) {}

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const result = await this.getDashboardMetricsUseCase.execute({ tenantId });
      res.json({
        success: true,
        message: 'Dashboard metrics retrieved successfully',
        data: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve dashboard metrics';
      res.status(500).json({ 
        success: false,
        message
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const result = await this.getDashboardMetricsUseCase.execute({ tenantId });
      res.json({
        success: true,
        message: 'Dashboard stats retrieved successfully',
        data: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve dashboard stats';
      res.status(500).json({ 
        success: false,
        message 
      });
    }
  }
}
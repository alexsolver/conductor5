/**
 * SLAController - Clean Architecture Application Layer
 * Resolves violations: Missing Controllers for SLA management endpoints
 */

import { Request, Response } from 'express';
import { SLA } from '../../domain/entities/SLA';

interface SLARepositoryInterface {
  save(sla: SLA): Promise<void>;
  findById(id: string, tenantId: string): Promise<SLA | null>;
  findByCategory(category: string, tenantId: string): Promise<SLA[]>;
}

interface CreateSLAUseCase {
  execute(request: any): Promise<{ success: boolean; message: string; data?: any }>;
}

export class SLAController {
  constructor(
    private readonly slaRepository: SLARepositoryInterface,
    private readonly createSLAUseCase: CreateSLAUseCase
  ) {}

  async createSLA(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.createSLAUseCase.execute({
        tenantId,
        ...req.body
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async getSLA(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const sla = await this.slaRepository.findById(req.params.id, tenantId);

      if (!sla) {
        res.status(404).json({ success: false, message: 'SLA not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: sla.getId(),
          name: sla.getName(),
          description: sla.getDescription(),
          category: sla.getCategory(),
          priority: sla.getPriority(),
          isActive: sla.isActive(),
          metrics: sla.getMetrics(),
          breaches: sla.getBreaches(),
          complianceScore: sla.getComplianceScore(),
          effectiveFrom: sla.getEffectiveFrom(),
          effectiveTo: sla.getEffectiveTo(),
          createdAt: sla.getCreatedAt()
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
}
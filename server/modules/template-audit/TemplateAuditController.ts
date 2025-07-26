
import { Request, Response } from 'express';
import { z } from 'zod';
import { TemplateAuditService } from './TemplateAuditService';

const auditQuerySchema = z.object({
  templateId: z.string().uuid().optional(),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

export class TemplateAuditController {
  constructor(private auditService: TemplateAuditService) {}

  async getAuditTrail(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const query = auditQuerySchema.parse(req.query);
      
      const auditTrail = await this.auditService.getAuditTrail(tenantId, {
        templateId: query.templateId,
        action: query.action,
        userId: query.userId,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        limit: query.limit ? parseInt(query.limit) : 50,
        offset: query.offset ? parseInt(query.offset) : 0
      });

      res.json({ success: true, data: auditTrail });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async logTemplateAction(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ success: false, error: 'Authentication required' });
      }

      const { templateId, action, details } = req.body;

      await this.auditService.logAction({
        templateId,
        action,
        userId,
        tenantId,
        details,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTemplateAuditHistory(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { templateId } = req.params;

      const history = await this.auditService.getTemplateHistory(tenantId!, templateId);
      
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

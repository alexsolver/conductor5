
import { Request, Response } from 'express';
import { z } from 'zod';
import { VersionControlService } from './VersionControlService';

const createVersionSchema = z.object({
  templateId: z.string().uuid(),
  versionType: z.enum(['major', 'minor', 'patch']).default('minor'),
  changeDescription: z.string().min(1),
  isPublished: z.boolean().default(false),
  approvalRequired: z.boolean().default(true)
});

const approveVersionSchema = z.object({
  versionId: z.string().uuid(),
  approved: z.boolean(),
  approvalNotes: z.string().optional()
});

export class TemplateVersionController {
  constructor(private versionService: VersionControlService) {}

  async createVersion(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const data = createVersionSchema.parse(req.body);
      
      const version = await this.versionService.createVersion({
        ...data,
        tenantId,
        createdBy: req.user?.id!
      });

      res.json({ success: true, data: version });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getVersionHistory(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { templateId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const history = await this.versionService.getVersionHistory(
        tenantId!,
        templateId,
        {
          limit: Number(limit),
          offset: Number(offset)
        }
      );

      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async compareVersions(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { versionId1, versionId2 } = req.params;

      const comparison = await this.versionService.compareVersions(
        tenantId!,
        versionId1,
        versionId2
      );

      res.json({ success: true, data: comparison });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async rollbackToVersion(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { templateId, versionId } = req.params;

      const rollback = await this.versionService.rollbackToVersion(
        tenantId!,
        templateId,
        versionId,
        req.user?.id!
      );

      res.json({ success: true, data: rollback });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async approveVersion(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const data = approveVersionSchema.parse(req.body);

      const approval = await this.versionService.approveVersion({
        ...data,
        tenantId: tenantId!,
        approvedBy: req.user?.id!
      });

      res.json({ success: true, data: approval });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getPendingApprovals(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { userId } = req.user!;

      const pending = await this.versionService.getPendingApprovals(tenantId!, userId);

      res.json({ success: true, data: pending });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async publishVersion(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { versionId } = req.params;

      const published = await this.versionService.publishVersion(
        tenantId!,
        versionId,
        req.user?.id!
      );

      res.json({ success: true, data: published });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

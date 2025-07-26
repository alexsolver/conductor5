
import { Request, Response } from 'express';
import { z } from 'zod';
import { TemplateInheritanceService } from './TemplateInheritanceService';

const createHierarchySchema = z.object({
  parentTemplateId: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.string(),
  companyId: z.string().uuid().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
  inheritanceRules: z.object({
    inheritFields: z.boolean().default(true),
    inheritValidations: z.boolean().default(true),
    inheritStyles: z.boolean().default(false),
    overrideMode: z.enum(['merge', 'replace', 'extend']).default('merge')
  })
});

export class TemplateHierarchyController {
  constructor(private inheritanceService: TemplateInheritanceService) {}

  async createHierarchicalTemplate(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const data = createHierarchySchema.parse(req.body);
      
      const template = await this.inheritanceService.createWithInheritance({
        ...data,
        tenantId,
        createdBy: req.user?.id!
      });

      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTemplateHierarchy(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { templateId } = req.params;

      const hierarchy = await this.inheritanceService.getHierarchy(tenantId!, templateId);
      
      res.json({ success: true, data: hierarchy });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTemplatesByCategory(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { category } = req.params;
      const { companyId, roleId } = req.query;

      const templates = await this.inheritanceService.getByCategory(
        tenantId!,
        category,
        {
          companyId: companyId as string,
          roleId: roleId as string
        }
      );

      res.json({ success: true, data: templates });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async resolveTemplateInheritance(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { templateId } = req.params;
      const { context } = req.body;

      const resolvedTemplate = await this.inheritanceService.resolveInheritance(
        tenantId!,
        templateId,
        context
      );

      res.json({ success: true, data: resolvedTemplate });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

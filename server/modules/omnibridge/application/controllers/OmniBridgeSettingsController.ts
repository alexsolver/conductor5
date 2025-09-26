
import { Request, Response } from 'express';
import { DrizzleOmniBridgeSettingsRepository } from '../../infrastructure/repositories/DrizzleOmniBridgeSettingsRepository';

export class OmniBridgeSettingsController {
  private settingsRepository: DrizzleOmniBridgeSettingsRepository;

  constructor() {
    this.settingsRepository = new DrizzleOmniBridgeSettingsRepository();
  }

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🔍 [OMNIBRIDGE-SETTINGS] Getting settings for tenant: ${tenantId}`);

      const settings = await this.settingsRepository.getSettings(tenantId);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-SETTINGS] Error getting settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get settings'
      });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      const settings = req.body;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`💾 [OMNIBRIDGE-SETTINGS] Updating settings for tenant: ${tenantId}`);
      console.log(`📝 [OMNIBRIDGE-SETTINGS] Received settings:`, JSON.stringify(settings, null, 2));

      // Validate required fields
      if (!settings || typeof settings !== 'object') {
        res.status(400).json({ success: false, error: 'Invalid settings data' });
        return;
      }

      const updatedSettings = await this.settingsRepository.updateSettings(tenantId, settings);

      console.log(`✅ [OMNIBRIDGE-SETTINGS] Successfully updated settings for tenant: ${tenantId}`);

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-SETTINGS] Error updating settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async resetSettings(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🔄 [OMNIBRIDGE-SETTINGS] Resetting settings for tenant: ${tenantId}`);

      const defaultSettings = await this.settingsRepository.resetToDefaults(tenantId);

      res.json({
        success: true,
        data: defaultSettings
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-SETTINGS] Error resetting settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset settings'
      });
    }
  }
}

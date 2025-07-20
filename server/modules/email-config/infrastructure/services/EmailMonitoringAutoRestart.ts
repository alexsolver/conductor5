import { DrizzleEmailConfigRepository } from '../repositories/DrizzleEmailConfigRepository';
import { EmailReadingService } from './EmailReadingService';

export class EmailMonitoringAutoRestart {
  private static instance: EmailMonitoringAutoRestart;
  private repository = new DrizzleEmailConfigRepository();
  private emailReadingService = new EmailReadingService();
  private initialized = false;

  static getInstance(): EmailMonitoringAutoRestart {
    if (!EmailMonitoringAutoRestart.instance) {
      EmailMonitoringAutoRestart.instance = new EmailMonitoringAutoRestart();
    }
    return EmailMonitoringAutoRestart.instance;
  }

  async initializeAutoRestart(): Promise<void> {
    if (this.initialized) {
      console.log('🔄 Email monitoring auto-restart already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing email monitoring auto-restart system...');

      // Check all tenants for active monitoring integrations
      await this.restoreMonitoringForAllTenants();

      this.initialized = true;
      console.log('✅ Email monitoring auto-restart system initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing email monitoring auto-restart:', error);
    }
  }

  private async restoreMonitoringForAllTenants(): Promise<void> {
    try {
      // For now, we'll focus on our main tenant - in production you'd get all tenants
      const mainTenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
      
      console.log(`🔍 Checking monitoring state for tenant: ${mainTenantId}`);
      
      const activeIntegrations = await this.repository.getActiveMonitoringIntegrations(mainTenantId);
      
      if (activeIntegrations.length === 0) {
        console.log(`📭 No active monitoring integrations found for tenant: ${mainTenantId}`);
        return;
      }

      console.log(`🔄 Found ${activeIntegrations.length} integrations that were actively monitoring before restart:`, 
        activeIntegrations.map(i => i.name));

      // Restart monitoring for this tenant
      try {
        await this.emailReadingService.startMonitoring(mainTenantId);
        console.log(`✅ Successfully restored monitoring for tenant: ${mainTenantId}`);
      } catch (error) {
        console.error(`❌ Failed to restore monitoring for tenant ${mainTenantId}:`, error);
        
        // Clear the monitoring state if restart failed
        for (const integration of activeIntegrations) {
          await this.repository.saveMonitoringState(mainTenantId, integration.id, false);
        }
      }
    } catch (error) {
      console.error('❌ Error restoring monitoring for tenants:', error);
    }
  }

  async onMonitoringStart(tenantId: string, integrationId: string): Promise<void> {
    try {
      await this.repository.saveMonitoringState(tenantId, integrationId, true);
      console.log(`📊 Monitoring state saved: ${integrationId} = active`);
    } catch (error) {
      console.error('❌ Error saving monitoring state:', error);
    }
  }

  async onMonitoringStop(tenantId: string, integrationId: string): Promise<void> {
    try {
      await this.repository.saveMonitoringState(tenantId, integrationId, false);
      console.log(`📊 Monitoring state saved: ${integrationId} = inactive`);
    } catch (error) {
      console.error('❌ Error saving monitoring state:', error);
    }
  }

  async forceRestartMonitoring(tenantId: string): Promise<boolean> {
    try {
      console.log(`🔄 Force restarting monitoring for tenant: ${tenantId}`);
      
      // Stop current monitoring
      await this.emailReadingService.stopMonitoring();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start monitoring again
      await this.emailReadingService.startMonitoring(tenantId);
      
      console.log(`✅ Force restart completed for tenant: ${tenantId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error force restarting monitoring:`, error);
      return false;
    }
  }
}

// Initialize the auto-restart system when the module is loaded
const autoRestart = EmailMonitoringAutoRestart.getInstance();

// Initialize after a brief delay to allow other systems to start
setTimeout(() => {
  autoRestart.initializeAutoRestart().catch(error => {
    console.error('❌ Failed to initialize email monitoring auto-restart:', error);
  });
}, 5000); // 5 second delay

export default autoRestart;
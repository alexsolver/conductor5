
import { GmailService } from './GmailService';

export class GmailSyncScheduler {
  private static instance: GmailSyncScheduler;
  private activeSchedules: Map<string, NodeJS.Timeout> = new Map();
  private gmailService: GmailService;

  private constructor() {
    this.gmailService = GmailService.getInstance();
  }

  static getInstance(): GmailSyncScheduler {
    if (!GmailSyncScheduler.instance) {
      GmailSyncScheduler.instance = new GmailSyncScheduler();
    }
    return GmailSyncScheduler.instance;
  }

  async startPeriodicSync(tenantId: string, intervalMinutes: number = 5): Promise<void> {
    console.log(`🕐 Starting Gmail periodic sync for tenant ${tenantId} every ${intervalMinutes} minutes`);

    // Stop existing schedule if any
    this.stopPeriodicSync(tenantId);

    // Run initial sync
    try {
      const result = await this.gmailService.startEmailMonitoring(tenantId, 'imap-email');
      console.log(`📧 Initial sync result for tenant ${tenantId}:`, result.success ? 'Success' : result.message);
    } catch (error) {
      console.error(`❌ Initial Gmail sync failed for tenant ${tenantId}:`, error);
    }

    // Set up periodic sync
    const intervalId = setInterval(async () => {
      try {
        console.log(`🔄 Running scheduled Gmail sync for tenant: ${tenantId}`);
        const result = await this.gmailService.startEmailMonitoring(tenantId, 'imap-email');
        
        if (result.success) {
          console.log(`✅ Scheduled Gmail sync completed for tenant: ${tenantId}`);
        } else {
          console.error(`❌ Scheduled Gmail sync failed for tenant ${tenantId}: ${result.message}`);
        }
      } catch (error) {
        console.error(`💥 Error in scheduled Gmail sync for tenant ${tenantId}:`, error);
      }
    }, intervalMinutes * 60 * 1000);

    this.activeSchedules.set(tenantId, intervalId);
    console.log(`✅ Gmail periodic sync scheduled for tenant ${tenantId}`);
  }

  stopPeriodicSync(tenantId: string): void {
    const intervalId = this.activeSchedules.get(tenantId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSchedules.delete(tenantId);
      console.log(`⏹️ Stopped Gmail periodic sync for tenant: ${tenantId}`);
    }
  }

  async startForAllActiveTenants(): Promise<void> {
    try {
      const { storage } = await import('../../../storage-simple');
      
      // Get all tenants with IMAP integration configured
      const tenants = ['3f99462f-3621-4b1b-bea8-782acc50d62e']; // Add your tenant IDs here
      
      for (const tenantId of tenants) {
        try {
          const imapIntegration = await storage.getIntegrationByType(tenantId, 'IMAP Email');
          
          if (imapIntegration && imapIntegration.status === 'connected') {
            console.log(`📧 Starting Gmail sync for tenant with IMAP integration: ${tenantId}`);
            await this.startPeriodicSync(tenantId, 5); // Sync every 5 minutes
          }
        } catch (error) {
          console.error(`Error starting sync for tenant ${tenantId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error starting Gmail sync for all tenants:', error);
    }
  }

  stopAll(): void {
    console.log('🛑 Stopping all Gmail periodic syncs');
    this.activeSchedules.forEach((intervalId, tenantId) => {
      clearInterval(intervalId);
      console.log(`⏹️ Stopped sync for tenant: ${tenantId}`);
    });
    this.activeSchedules.clear();
  }

  getActiveSchedules(): string[] {
    return Array.from(this.activeSchedules.keys());
  }
}

// =====================================================
// OMNIBRIDGE AUTO START SERVICE
// Automatically detects IMAP integrations and starts monitoring
// =====================================================

import { GmailService } from './integrations/gmail/GmailService';

interface IntegrationConfig {
  emailAddress: string;
  password: string;
  imapServer: string;
  imapPort: number;
  imapSecurity: string;
}

interface Integration {
  id: string;
  name: string;
  category: string;
  status: string;
  config: IntegrationConfig | any;
}

export class OmniBridgeAutoStart {
  private gmailService: GmailService;
  private activeMonitoring: Map<string, boolean> = new Map();

  constructor() {
    this.gmailService = new GmailService();
  }

  async detectAndStartCommunicationChannels(tenantId: string): Promise<void> {
    try {
      console.log(`🔍 OmniBridge: Detecting communication channels for tenant: ${tenantId}`);

      // Get storage instance
      const { storage } = await import('../storage-simple');

      // Get all integrations for tenant
      const integrations = await storage.getTenantIntegrations(tenantId);

      // Filter only communication category integrations
      const communicationIntegrations = integrations.filter((integration: Integration) =>
        integration.category === 'Comunicação'
      );

      console.log(`📡 Found ${communicationIntegrations.length} communication integrations`);

      // Check each communication integration
      for (const integration of communicationIntegrations) {
        await this.checkAndStartIntegration(tenantId, integration);
      }

      // Specifically check for Gmail/IMAP Email integration
      const imapIntegration = await storage.getIntegrationByType(tenantId, 'IMAP Email');
      if (imapIntegration && imapIntegration.status === 'connected') {
        console.log(`📧 [OMNIBRIDGE-AUTOSTART] Found IMAP Email integration for alexsolver@gmail.com`);
        await this.startGmailMonitoring(tenantId, imapIntegration);
      }

    } catch (error) {
      console.error('❌ OmniBridge: Error detecting communication channels:', error);
    }
  }

  private async startGmailMonitoring(tenantId: string, integration: Integration): Promise<void> {
    try {
      console.log(`📧 [GMAIL-AUTOSTART] Starting Gmail monitoring for: ${integration.config.emailAddress}`);

      const result = await this.gmailService.startEmailMonitoring(tenantId, integration.id);
      
      if (result.success) {
        console.log(`✅ [GMAIL-AUTOSTART] Gmail monitoring started successfully`);
        
        // Ensure channel is synced and enabled
        try {
          const { IntegrationChannelSync } = await import('../modules/omnibridge/infrastructure/services/IntegrationChannelSync');
          const { DrizzleChannelRepository } = await import('../modules/omnibridge/infrastructure/repositories/DrizzleChannelRepository');
          const { storage } = await import('../storage-simple');
          
          const channelRepository = new DrizzleChannelRepository();
          const syncService = new IntegrationChannelSync(channelRepository, storage);
          await syncService.syncIntegrationsToChannels(tenantId);
          
          console.log(`🔗 [GMAIL-AUTOSTART] Channels synced for tenant: ${tenantId}`);
        } catch (syncError) {
          console.error('❌ [GMAIL-AUTOSTART] Channel sync error:', syncError);
        }
      } else {
        console.error(`❌ [GMAIL-AUTOSTART] Failed to start Gmail monitoring: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [GMAIL-AUTOSTART] Error starting Gmail monitoring:', error);
    }
  }

  private async checkAndStartIntegration(tenantId: string, integration: Integration): Promise<void> {
    try {
      console.log(`🔧 Checking integration: ${integration.name} (${integration.id})`);

      // Check if integration is configured and connected
      if (integration.status === 'connected' && integration.config) {
        console.log(`✅ Integration ${integration.name} is configured and connected`);

        // Handle different integration types
        switch (integration.id) {
          case 'imap-email':
            await this.startImapMonitoring(tenantId, integration);
            break;
          case 'gmail-oauth2':
            console.log(`📧 Gmail OAuth2 integration ready (not implemented yet)`);
            break;
          case 'outlook-oauth2':
            console.log(`📧 Outlook OAuth2 integration ready (not implemented yet)`);
            break;
          case 'whatsapp-business':
            console.log(`💬 WhatsApp Business integration ready (not implemented yet)`);
            break;
          case 'slack':
            console.log(`💬 Slack integration ready (not implemented yet)`);
            break;
          case 'twilio-sms':
            console.log(`📱 Twilio SMS integration ready (not implemented yet)`);
            break;
          default:
            console.log(`⚠️  Integration type ${integration.id} not yet supported for auto-start`);
        }
      } else {
        console.log(`⏸️  Integration ${integration.name} is not configured or not connected`);
      }
    } catch (error) {
      console.error(`❌ Error checking integration ${integration.name}:`, error);
    }
  }

  private async startImapMonitoring(tenantId: string, integration: Integration): Promise<void> {
    try {
      const monitoringKey = `${tenantId}-${integration.id}`;

      // Check if already monitoring
      if (this.activeMonitoring.get(monitoringKey)) {
        console.log(`🔄 IMAP monitoring already active for ${integration.name}`);
        return;
      }

      console.log(`📧 Starting IMAP monitoring for ${integration.name}`);

      // Validate IMAP config
      const config = integration.config;
      if (!config.emailAddress || !config.password || !config.imapServer) {
        console.error(`❌ Invalid IMAP configuration for ${integration.name}`);
        return;
      }

      // Start Gmail service monitoring
      const result = await this.gmailService.startEmailMonitoring(tenantId, integration.id);

      if (result.success) {
        this.activeMonitoring.set(monitoringKey, true);

        // Update integration status in database to persist state
        try {
          const { storage } = await import('../storage-simple');
          await storage.updateTenantIntegrationStatus(tenantId, integration.id, 'connected');
        } catch (error) {
          console.error('❌ Error updating integration status:', error);
        }

        console.log(`✅ IMAP monitoring started successfully for ${integration.name}`);
        console.log(`📥 Inbox will be populated with emails from ${config.emailAddress}`);

        // Start periodic sync every 2 minutes for real-time updates
        await this.gmailService.startPeriodicSync(tenantId, integration.id, 2);
        console.log(`🔄 Periodic sync started: every 2 minutes`);
      } else {
        console.error(`❌ Failed to start IMAP monitoring: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error starting IMAP monitoring:', error);
    }
  }

  async stopAllMonitoring(tenantId: string): Promise<void> {
    try {
      console.log(`🛑 Stopping all OmniBridge monitoring for tenant: ${tenantId}`);

      // Stop Gmail service monitoring
      await this.gmailService.stopEmailMonitoring(tenantId);
      await this.gmailService.stopPeriodicSync(tenantId);

      // Update integration status in database to persist state
      try {
        const { storage } = await import('../storage-simple');
        const imapIntegration = await storage.getIntegrationByType(tenantId, 'IMAP Email');
        if (imapIntegration) {
          await storage.updateTenantIntegrationStatus(tenantId, imapIntegration.id, 'disconnected');
        }
      } catch (error) {
        console.error('❌ Error updating integration status:', error);
      }

      // Clear active monitoring map
      const keysToRemove = Array.from(this.activeMonitoring.keys()).filter(key =>
        key.startsWith(tenantId)
      );
      keysToRemove.forEach(key => this.activeMonitoring.delete(key));

      console.log(`✅ All OmniBridge monitoring stopped for tenant: ${tenantId}`);
    } catch (error) {
      console.error('❌ Error stopping OmniBridge monitoring:', error);
    }
  }

  getActiveMonitoring(): string[] {
    return Array.from(this.activeMonitoring.keys());
  }
}

// Export singleton instance
export const omniBridgeAutoStart = new OmniBridgeAutoStart();
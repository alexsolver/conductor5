import { EmailReadingService } from './EmailReadingService.js';
import { DrizzleEmailConfigRepository } from '../repositories/DrizzleEmailConfigRepository.js';

/**
 * Service to automatically restore email monitoring state after server restarts
 */
export class EmailMonitoringAutoRestart {
  private static instance: EmailMonitoringAutoRestart;
  private emailReadingService: EmailReadingService;
  private emailConfigRepository: DrizzleEmailConfigRepository;
  private isInitialized = false;

  private constructor() {
    this.emailReadingService = new EmailReadingService();
    this.emailConfigRepository = new DrizzleEmailConfigRepository();
  }

  static getInstance(): EmailMonitoringAutoRestart {
    if (!EmailMonitoringAutoRestart.instance) {
      EmailMonitoringAutoRestart.instance = new EmailMonitoringAutoRestart();
    }
    return EmailMonitoringAutoRestart.instance;
  }

  async initializeOnServerStart(): Promise<void> {
    if (this.isInitialized) {
      console.log('📧 Auto-restart already initialized');
      return;
    }

    console.log('🔄 Initializing email monitoring auto-restart...');
    
    try {
      // Wait for server to fully start
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Use the known tenant that has email integrations
      const knownTenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
      
      // Check for connected integrations
      const connectedIntegrations = await this.emailConfigRepository.getConnectedIntegrations(knownTenantId);
      
      if (connectedIntegrations.length > 0) {
        console.log(`🔍 Found ${connectedIntegrations.length} connected integrations to restore`);
        
        for (const integration of connectedIntegrations) {
          console.log(`🔄 Auto-starting monitoring for: ${integration.emailAddress || integration.name}`);
        }
        
        // Start monitoring for this tenant
        await this.emailReadingService.startMonitoring(knownTenantId);
      } else {
        console.log('ℹ️ No connected integrations found to restore');
      }

      this.isInitialized = true;
      console.log('✅ Email monitoring auto-restart initialized');
    } catch (error) {
      console.error('❌ Error initializing email monitoring auto-restart:', error);
    }
  }

  getEmailService(): EmailReadingService {
    return this.emailReadingService;
  }
}
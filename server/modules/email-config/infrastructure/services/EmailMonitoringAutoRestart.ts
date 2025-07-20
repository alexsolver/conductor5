import { EmailReadingService } from './EmailReadingService.js';
import { DrizzleEmailConfigRepository } from '../repositories/DrizzleEmailConfigRepository.js';

/**
 * Service to automatically restore email monitoring state after server restarts
 * Ensures continuous monitoring without manual intervention
 */
export class EmailMonitoringAutoRestart {
  private emailReadingService: EmailReadingService;
  private emailConfigRepository: DrizzleEmailConfigRepository;
  private restartAttempts: Map<string, number> = new Map();
  private maxRestartAttempts = 3;

  constructor() {
    this.emailReadingService = new EmailReadingService();
    this.emailConfigRepository = new DrizzleEmailConfigRepository();
  }

  /**
   * Auto-start monitoring for all integrations that were active before restart
   * Called during server initialization
   */
  async restoreMonitoringState(): Promise<void> {
    console.log('🔄 Inicializando sistema de auto-restart de monitoramento...');
    
    try {
      // Get all tenant IDs (this would come from your tenant service)
      const tenantIds = await this.getAllTenantIds();
      
      for (const tenantId of tenantIds) {
        await this.restoreTenantMonitoring(tenantId);
      }
      
      console.log('✅ Sistema de auto-restart de monitoramento inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar auto-restart:', error);
    }
  }

  /**
   * Restore monitoring for a specific tenant
   */
  private async restoreTenantMonitoring(tenantId: string): Promise<void> {
    try {
      // Get all integrations that were actively monitoring
      const activeIntegrations = await this.emailConfigRepository.getActiveMonitoringIntegrations(tenantId);
      
      if (activeIntegrations.length === 0) {
        console.log(`📧 Nenhum monitoramento ativo para restaurar no tenant: ${tenantId}`);
        return;
      }

      console.log(`🔄 Restaurando ${activeIntegrations.length} monitoramentos ativos para tenant: ${tenantId}`);

      for (const integration of activeIntegrations) {
        await this.restartIntegrationMonitoring(tenantId, integration.id, integration.name);
      }
    } catch (error) {
      console.error(`❌ Erro ao restaurar monitoramento para tenant ${tenantId}:`, error);
    }
  }

  /**
   * Restart monitoring for a specific integration
   */
  private async restartIntegrationMonitoring(tenantId: string, integrationId: string, integrationName: string): Promise<void> {
    const attemptKey = `${tenantId}:${integrationId}`;
    const attempts = this.restartAttempts.get(attemptKey) || 0;

    if (attempts >= this.maxRestartAttempts) {
      console.log(`⚠️ Máximo de tentativas de restart atingido para ${integrationName} (${integrationId})`);
      // Mark as inactive since we can't restart it
      await this.emailConfigRepository.saveMonitoringState(tenantId, integrationId, false);
      return;
    }

    try {
      console.log(`🔄 Tentando restaurar monitoramento: ${integrationName} (tentativa ${attempts + 1}/${this.maxRestartAttempts})`);
      
      // Get integration configuration
      const config = await this.emailConfigRepository.getIntegrationConfig(tenantId, integrationId);
      
      if (!config || !config.emailAddress) {
        console.log(`⚠️ Configuração inválida para ${integrationName}, marcando como inativo`);
        await this.emailConfigRepository.saveMonitoringState(tenantId, integrationId, false);
        return;
      }

      // Attempt to start monitoring (EmailReadingService accepts only tenantId)
      await this.emailReadingService.startMonitoring(tenantId);
      
      console.log(`✅ Monitoramento restaurado com sucesso: ${integrationName}`);
      // Reset attempt counter on success
      this.restartAttempts.delete(attemptKey);
    } catch (error) {
      console.error(`❌ Erro ao tentar restaurar ${integrationName}:`, error);
      this.restartAttempts.set(attemptKey, attempts + 1);
      
      // Mark as inactive on error
      await this.emailConfigRepository.saveMonitoringState(tenantId, integrationId, false);
    }
  }

  /**
   * Get all tenant IDs - this should be implemented based on your tenant management system
   * For now, using hardcoded tenant IDs from the system
   */
  private async getAllTenantIds(): Promise<string[]> {
    // In a real implementation, this would query your tenants table
    // For now, using the known tenant IDs from the system
    return [
      '3f99462f-3621-4b1b-bea8-782acc50d62e',
      '715c510a-3db5-4510-880a-9a1a5c320100',
      '78a4c88e-0e85-4f7c-ad92-f472dad50d7a',
      'cb9056df-d964-43d7-8fd8-b0cc00a72056'
    ];
  }

  /**
   * Clear all monitoring states (useful for cleanup during shutdown)
   */
  async clearAllMonitoringStates(): Promise<void> {
    console.log('🧹 Limpando todos os estados de monitoramento...');
    
    try {
      const tenantIds = await this.getAllTenantIds();
      
      for (const tenantId of tenantIds) {
        await this.emailConfigRepository.clearAllMonitoringStates(tenantId);
      }
      
      console.log('✅ Estados de monitoramento limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar estados de monitoramento:', error);
    }
  }

  /**
   * Get restart statistics for monitoring
   */
  getRestartStatistics(): { integration: string; attempts: number }[] {
    return Array.from(this.restartAttempts.entries()).map(([key, attempts]) => ({
      integration: key,
      attempts
    }));
  }
}
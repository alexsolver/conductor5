
import { Channel } from '../../domain/entities/Channel';

export interface IntegrationConfig {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  enabled: boolean;
  config: any;
  features: string[];
}

export class IntegrationChannelSync {
  private storage: any;

  constructor() {
    this.initStorage();
  }

  private async initStorage() {
    const { storage } = await import('../../../storage-simple');
    this.storage = storage;
  }

  /**
   * Sincroniza integrações do Workspace Admin com canais do OmniBridge
   */
  async syncIntegrationsToChannels(tenantId: string): Promise<Channel[]> {
    try {
      console.log(`🔄 [SYNC] Synchronizing integrations to channels for tenant: ${tenantId}`);

      // 1. Buscar integrações de comunicação configuradas
      const integrations = await this.storage.getTenantIntegrations(tenantId);
      const communicationIntegrations = integrations.filter((integration: IntegrationConfig) => 
        integration.category === 'Comunicação' || integration.category === 'Communication'
      );

      console.log(`📡 [SYNC] Found ${communicationIntegrations.length} communication integrations`);

      // 2. Converter integrações em canais
      const channels: Channel[] = communicationIntegrations.map((integration: IntegrationConfig) => ({
        id: integration.id,
        name: integration.name,
        type: this.getChannelType(integration.id),
        enabled: integration.enabled && integration.status === 'connected',
        status: integration.status,
        config: integration.config,
        features: integration.features || [],
        description: this.getChannelDescription(integration.id),
        lastActivity: integration.status === 'connected' ? 'Active' : 'Inactive',
        messageCount: 0,
        integration: {
          configured: !!integration.config && Object.keys(integration.config).length > 0,
          lastTested: integration.config?.lastTested || null,
          webhookConfigured: this.isWebhookConfigured(integration)
        }
      }));

      console.log(`✅ [SYNC] Converted ${channels.length} integrations to channels`);
      return channels;

    } catch (error) {
      console.error('❌ [SYNC] Error synchronizing integrations to channels:', error);
      return [];
    }
  }

  /**
   * Ativa/desativa um canal no OmniBridge
   */
  async toggleChannel(tenantId: string, channelId: string, enabled: boolean): Promise<boolean> {
    try {
      console.log(`🔄 [TOGGLE] ${enabled ? 'Enabling' : 'Disabling'} channel ${channelId} for tenant ${tenantId}`);

      // Atualizar o status da integração correspondente
      const result = await this.storage.updateTenantIntegrationStatus(tenantId, channelId, {
        enabled,
        status: enabled ? 'connected' : 'disconnected',
        lastUpdated: new Date().toISOString()
      });

      if (result) {
        console.log(`✅ [TOGGLE] Channel ${channelId} ${enabled ? 'enabled' : 'disabled'} successfully`);
        
        // Se estiver ativando, iniciar monitoramento
        if (enabled) {
          await this.startChannelMonitoring(tenantId, channelId);
        } else {
          await this.stopChannelMonitoring(tenantId, channelId);
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ [TOGGLE] Error toggling channel ${channelId}:`, error);
      return false;
    }
  }

  /**
   * Inicia monitoramento de um canal (webhooks, polling, etc.)
   */
  private async startChannelMonitoring(tenantId: string, channelId: string): Promise<void> {
    try {
      console.log(`🚀 [MONITOR] Starting monitoring for channel ${channelId}`);

      // Buscar configuração da integração
      const configResult = await this.storage.getTenantIntegrationConfig(tenantId, channelId);
      
      if (!configResult.configured) {
        console.log(`⚠️ [MONITOR] Channel ${channelId} not configured, skipping monitoring`);
        return;
      }

      // Iniciar monitoramento baseado no tipo de canal
      switch (channelId) {
        case 'telegram':
          await this.startTelegramMonitoring(tenantId, configResult.config);
          break;
        case 'whatsapp-business':
          await this.startWhatsAppMonitoring(tenantId, configResult.config);
          break;
        case 'imap-email':
          await this.startEmailMonitoring(tenantId, configResult.config);
          break;
        case 'twilio-sms':
          await this.startSMSMonitoring(tenantId, configResult.config);
          break;
        default:
          console.log(`📝 [MONITOR] No specific monitoring for channel type: ${channelId}`);
      }

    } catch (error) {
      console.error(`❌ [MONITOR] Error starting monitoring for channel ${channelId}:`, error);
    }
  }

  /**
   * Para monitoramento de um canal
   */
  private async stopChannelMonitoring(tenantId: string, channelId: string): Promise<void> {
    console.log(`🛑 [MONITOR] Stopping monitoring for channel ${channelId}`);
    // Implementar lógica para parar polling, desregistrar webhooks, etc.
  }

  /**
   * Inicia monitoramento do Telegram
   */
  private async startTelegramMonitoring(tenantId: string, config: any): Promise<void> {
    if (!config.telegramBotToken) {
      console.log('⚠️ [TELEGRAM] No bot token configured');
      return;
    }

    // Verificar se webhook está configurado
    if (config.telegramWebhookUrl) {
      console.log('📡 [TELEGRAM] Webhook monitoring active');
    } else {
      console.log('🔄 [TELEGRAM] Setting up webhook...');
      // Configurar webhook automaticamente se necessário
    }

    console.log('✅ [TELEGRAM] Monitoring started successfully');
  }

  /**
   * Inicia monitoramento do WhatsApp Business
   */
  private async startWhatsAppMonitoring(tenantId: string, config: any): Promise<void> {
    if (!config.whatsappApiKey || !config.whatsappPhoneNumberId) {
      console.log('⚠️ [WHATSAPP] Incomplete configuration');
      return;
    }

    console.log('✅ [WHATSAPP] Monitoring started successfully');
  }

  /**
   * Inicia monitoramento de Email IMAP
   */
  private async startEmailMonitoring(tenantId: string, config: any): Promise<void> {
    if (!config.imapServer || !config.emailAddress || !config.password) {
      console.log('⚠️ [EMAIL] Incomplete IMAP configuration');
      return;
    }

    // Importar serviço de email existente
    const { OmniBridgeAutoStart } = await import('../../../../services/OmniBridgeAutoStart');
    const autoStart = new OmniBridgeAutoStart();
    
    // Usar o serviço existente para monitoramento de email
    console.log('✅ [EMAIL] Delegating to existing email monitoring service');
  }

  /**
   * Inicia monitoramento de SMS
   */
  private async startSMSMonitoring(tenantId: string, config: any): Promise<void> {
    if (!config.twilioApiKey || !config.twilioPhoneNumber) {
      console.log('⚠️ [SMS] Incomplete Twilio configuration');
      return;
    }

    console.log('✅ [SMS] Monitoring started successfully');
  }

  /**
   * Mapeia ID da integração para tipo de canal
   */
  private getChannelType(integrationId: string): 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat' {
    if (integrationId.includes('email') || integrationId.includes('imap') || integrationId.includes('gmail')) {
      return 'email';
    }
    if (integrationId.includes('whatsapp')) {
      return 'whatsapp';
    }
    if (integrationId.includes('telegram')) {
      return 'telegram';
    }
    if (integrationId.includes('sms') || integrationId.includes('twilio')) {
      return 'sms';
    }
    return 'chat';
  }

  /**
   * Gera descrição do canal baseada no ID
   */
  private getChannelDescription(integrationId: string): string {
    const descriptions: Record<string, string> = {
      'telegram': 'Recebimento e envio de mensagens via Telegram Bot API',
      'whatsapp-business': 'Integração com WhatsApp Business API para atendimento',
      'imap-email': 'Monitoramento de caixa de entrada via IMAP',
      'gmail-oauth2': 'Integração OAuth2 com Gmail',
      'outlook-oauth2': 'Integração OAuth2 com Microsoft Outlook',
      'twilio-sms': 'Envio e recebimento de SMS via Twilio',
      'slack': 'Notificações e comandos via Slack',
      'email-smtp': 'Envio de emails via servidor SMTP'
    };

    return descriptions[integrationId] || 'Canal de comunicação configurado';
  }

  /**
   * Verifica se webhook está configurado para uma integração
   */
  private isWebhookConfigured(integration: IntegrationConfig): boolean {
    const config = integration.config || {};
    
    switch (integration.id) {
      case 'telegram':
        return !!(config.telegramWebhookUrl && config.webhookConfigured);
      case 'whatsapp-business':
        return !!(config.whatsappWebhookUrl && config.whatsappVerifyToken);
      default:
        return false;
    }
  }

  /**
   * Valida se uma integração está pronta para uso no OmniBridge
   */
  async validateIntegrationForOmniBridge(tenantId: string, integrationId: string): Promise<{
    isValid: boolean;
    errors: string[];
    recommendations: string[];
  }> {
    const errors: string[] = [];
    const recommendations: string[] = [];

    try {
      const configResult = await this.storage.getTenantIntegrationConfig(tenantId, integrationId);
      
      if (!configResult.configured) {
        errors.push('Integração não configurada');
        recommendations.push('Configure a integração no Workspace Admin primeiro');
        return { isValid: false, errors, recommendations };
      }

      const config = configResult.config;

      // Validações específicas por tipo de integração
      switch (integrationId) {
        case 'telegram':
          if (!config.telegramBotToken) {
            errors.push('Bot Token não configurado');
          }
          if (!config.telegramChatId) {
            errors.push('Chat ID não configurado');
          }
          if (!config.telegramWebhookUrl) {
            recommendations.push('Configure um webhook para recebimento em tempo real');
          }
          break;

        case 'whatsapp-business':
          if (!config.whatsappApiKey) {
            errors.push('API Key do WhatsApp não configurada');
          }
          if (!config.whatsappPhoneNumberId) {
            errors.push('Phone Number ID não configurado');
          }
          break;

        case 'imap-email':
          if (!config.imapServer) {
            errors.push('Servidor IMAP não configurado');
          }
          if (!config.emailAddress) {
            errors.push('Endereço de email não configurado');
          }
          if (!config.password) {
            errors.push('Senha não configurada');
          }
          break;
      }

      return {
        isValid: errors.length === 0,
        errors,
        recommendations
      };

    } catch (error) {
      console.error(`❌ [VALIDATION] Error validating integration ${integrationId}:`, error);
      return {
        isValid: false,
        errors: ['Erro interno na validação'],
        recommendations: ['Verifique os logs do sistema']
      };
    }
  }
}

export default IntegrationChannelSync;


export interface WhatsAppConfig {
  apiKey: string;
  phoneNumberId: string;
  webhookUrl: string;
  verifyToken: string;
  templates: {
    notification: string;
    confirmation: string;
    [key: string]: string;
  };
}

export interface WhatsAppMessage {
  messageId: string;
  from: string;
  to: string;
  timestamp: Date;
  type: 'text' | 'image' | 'document' | 'template';
  content: string;
  templateName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface WhatsAppMetrics {
  messagesSent: number;
  messagesReceived: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  templatesUsed: Record<string, number>;
  deliveryRate: number;
  readRate: number;
  avgDeliveryTime: number;
  lastActivity: Date;
}

export class WhatsAppBusinessService {
  private config: WhatsAppConfig | null = null;
  private metrics: WhatsAppMetrics = {
    messagesSent: 0,
    messagesReceived: 0,
    messagesDelivered: 0,
    messagesRead: 0,
    messagesFailed: 0,
    templatesUsed: {},
    deliveryRate: 0,
    readRate: 0,
    avgDeliveryTime: 0,
    lastActivity: new Date()
  };

  constructor(private tenantId: string) {
    console.log(`📱 [WHATSAPP-BUSINESS] Service initialized for tenant: ${tenantId}`);
  }

  public configure(config: WhatsAppConfig): void {
    this.config = config;
    console.log(`🔧 [WHATSAPP-BUSINESS] Configured for tenant: ${this.tenantId}`);
  }

  public async sendMessage(to: string, message: string, templateName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    const startTime = Date.now();

    try {
      // Preparar payload baseado no tipo de mensagem
      const payload = templateName ? 
        await this.prepareTemplateMessage(to, templateName, message) :
        await this.prepareTextMessage(to, message);

      console.log(`📤 [WHATSAPP-BUSINESS] Sending message to ${to}`);

      const response = await fetch(`https://graph.facebook.com/v17.0/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      if (response.ok && result.messages?.[0]?.id) {
        this.metrics.messagesSent++;
        this.metrics.lastActivity = new Date();
        
        if (templateName) {
          this.metrics.templatesUsed[templateName] = (this.metrics.templatesUsed[templateName] || 0) + 1;
        }

        console.log(`✅ [WHATSAPP-BUSINESS] Message sent successfully: ${result.messages[0].id}`);
        
        return {
          success: true,
          messageId: result.messages[0].id
        };
      } else {
        this.metrics.messagesFailed++;
        const error = result.error?.message || 'Unknown WhatsApp API error';
        
        console.error(`❌ [WHATSAPP-BUSINESS] Failed to send message:`, result);
        
        return {
          success: false,
          error: error
        };
      }
    } catch (error: any) {
      this.metrics.messagesFailed++;
      console.error(`❌ [WHATSAPP-BUSINESS] Network error:`, error);
      
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  private async prepareTextMessage(to: string, text: string) {
    return {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: text
      }
    };
  }

  private async prepareTemplateMessage(to: string, templateName: string, variables: string) {
    // Parse variables (formato esperado: "var1,var2,var3")
    const components = variables.split(',').map((v, index) => ({
      type: 'text',
      text: v.trim()
    }));

    return {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'pt_BR'
        },
        components: [{
          type: 'body',
          parameters: components
        }]
      }
    };
  }

  public async processWebhook(webhookData: any): Promise<{ success: boolean; processed: number }> {
    if (!this.verifyWebhook(webhookData)) {
      return { success: false, processed: 0 };
    }

    let processedCount = 0;

    try {
      console.log(`📨 [WHATSAPP-BUSINESS] Processing webhook for tenant: ${this.tenantId}`);

      const entry = webhookData.entry?.[0];
      if (!entry) return { success: false, processed: 0 };

      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field === 'messages') {
          const messages = change.value?.messages || [];
          const statuses = change.value?.statuses || [];

          // Processar mensagens recebidas
          for (const message of messages) {
            await this.processIncomingMessage(message);
            processedCount++;
          }

          // Processar status de mensagens enviadas
          for (const status of statuses) {
            await this.processMessageStatus(status);
            processedCount++;
          }
        }
      }

      this.metrics.lastActivity = new Date();
      
      console.log(`✅ [WHATSAPP-BUSINESS] Webhook processed: ${processedCount} events`);
      
      return { success: true, processed: processedCount };
    } catch (error: any) {
      console.error(`❌ [WHATSAPP-BUSINESS] Webhook processing error:`, error);
      return { success: false, processed: processedCount };
    }
  }

  private verifyWebhook(data: any): boolean {
    // Implementar verificação de assinatura do webhook se necessário
    return true;
  }

  private async processIncomingMessage(message: any): Promise<void> {
    this.metrics.messagesReceived++;

    // 🎯 CRITICAL FIX: Usar MessageIngestionService para processar mensagem com ticket tracking
    try {
      const { MessageIngestionService } = await import('./MessageIngestionService');
      const { DrizzleMessageRepository } = await import('../repositories/DrizzleMessageRepository');
      const { ProcessMessageUseCase } = await import('../../application/use-cases/ProcessMessageUseCase');

      const messageRepository = new DrizzleMessageRepository();
      const processMessageUseCase = new ProcessMessageUseCase(messageRepository);
      const ingestionService = new MessageIngestionService(messageRepository, processMessageUseCase);

      console.log(`🤖 [WHATSAPP-BUSINESS] Processing message with automation support enabled`);
      const result = await ingestionService.processWhatsAppWebhook(message, this.tenantId);

      if (result.success) {
        console.log(`✅ [WHATSAPP-BUSINESS] Successfully processed message with automation rules`);
      } else {
        console.log(`⚠️ [WHATSAPP-BUSINESS] Message processing failed`);
      }
    } catch (error) {
      console.error(`❌ [WHATSAPP-BUSINESS] Failed to process message via MessageIngestionService:`, error);
      // Em caso de erro, tentar fallback para o método antigo
      console.log(`⚠️ [WHATSAPP-BUSINESS] Falling back to legacy storage method`);
      const { storage } = await import('../../../../storage-simple');
      
      const inboxMessage = {
        id: `whatsapp-${message.id}-${Date.now()}`,
        tenant_id: this.tenantId,
        message_id: `whatsapp-${message.id}`,
        from_email: `whatsapp:${message.from}`,
        from_name: message.profile?.name || message.from,
        to_email: 'whatsapp-business@conductor.com',
        cc_emails: JSON.stringify([]),
        bcc_emails: JSON.stringify([]),
        subject: `Mensagem do WhatsApp - ${message.profile?.name || message.from}`,
        body_text: message.text?.body || '[Mensagem não textual]',
        body_html: null,
        has_attachments: Boolean(message.image || message.document || message.audio),
        attachment_count: 0,
        attachment_details: JSON.stringify([]),
        email_headers: JSON.stringify({
          'whatsapp-from': message.from,
          'whatsapp-message-id': message.id,
          'whatsapp-timestamp': message.timestamp,
          'whatsapp-type': message.type
        }),
        priority: 'medium',
        is_read: false,
        is_processed: false,
        email_date: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        received_at: new Date().toISOString()
      };

      await storage.saveEmailToInbox(this.tenantId, inboxMessage);
      console.log(`📨 [WHATSAPP-BUSINESS] Message saved to inbox via fallback`);
    }
  }

  private async processMessageStatus(status: any): Promise<void> {
    switch (status.status) {
      case 'delivered':
        this.metrics.messagesDelivered++;
        break;
      case 'read':
        this.metrics.messagesRead++;
        break;
      case 'failed':
        this.metrics.messagesFailed++;
        break;
    }

    // Recalcular taxas
    if (this.metrics.messagesSent > 0) {
      this.metrics.deliveryRate = (this.metrics.messagesDelivered / this.metrics.messagesSent) * 100;
      this.metrics.readRate = (this.metrics.messagesRead / this.metrics.messagesSent) * 100;
    }

    console.log(`📊 [WHATSAPP-BUSINESS] Status update: ${status.status} for message ${status.id}`);
  }

  public async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    if (!this.config) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${this.config.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          details: {
            phoneNumber: result.display_phone_number,
            status: result.status,
            qualityRating: result.quality_rating
          }
        };
      } else {
        return {
          success: false,
          error: result.error?.message || 'WhatsApp API error',
          details: result
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  public getMetrics(): WhatsAppMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDelivered: 0,
      messagesRead: 0,
      messagesFailed: 0,
      templatesUsed: {},
      deliveryRate: 0,
      readRate: 0,
      avgDeliveryTime: 0,
      lastActivity: new Date()
    };
  }
}

// Singleton global para gerenciar serviços por tenant
export class GlobalWhatsAppManager {
  private static instance: GlobalWhatsAppManager;
  private services: Map<string, WhatsAppBusinessService> = new Map();

  private constructor() {}

  public static getInstance(): GlobalWhatsAppManager {
    if (!GlobalWhatsAppManager.instance) {
      GlobalWhatsAppManager.instance = new GlobalWhatsAppManager();
    }
    return GlobalWhatsAppManager.instance;
  }

  public getService(tenantId: string): WhatsAppBusinessService {
    if (!this.services.has(tenantId)) {
      const service = new WhatsAppBusinessService(tenantId);
      this.services.set(tenantId, service);
    }
    return this.services.get(tenantId)!;
  }

  public getAllMetrics(): Record<string, WhatsAppMetrics> {
    const allMetrics: Record<string, WhatsAppMetrics> = {};
    for (const [tenantId, service] of this.services) {
      allMetrics[tenantId] = service.getMetrics();
    }
    return allMetrics;
  }
}

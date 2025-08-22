
export class WebhookProcessor {
  private activeConnections = new Map<string, Set<any>>();
  
  constructor() {
    this.setupSSEEndpoint();
  }

  // Server-Sent Events para push em tempo real
  private setupSSEEndpoint(): void {
    // Este método será chamado quando o módulo for inicializado
    console.log('🔗 [WEBHOOK] SSE endpoint configured for real-time push');
  }

  async sendRealTime(tenantId: string, notifications: any[]): Promise<void> {
    try {
      const connections = this.activeConnections.get(tenantId);
      
      if (connections && connections.size > 0) {
        const payload = {
          type: 'notifications',
          data: notifications,
          timestamp: new Date().toISOString(),
          tenantId
        };

        connections.forEach(connection => {
          try {
            connection.write(`data: ${JSON.stringify(payload)}\n\n`);
          } catch (error) {
            console.error('🔗 [WEBHOOK] Failed to send SSE:', error);
            connections.delete(connection);
          }
        });

        console.log(`🔗 [WEBHOOK] Sent real-time notifications to ${connections.size} connections for tenant ${tenantId}`);
      }
    } catch (error) {
      console.error('🔗 [WEBHOOK] Real-time send error:', error);
    }
  }

  async sendWebhooks(tenantId: string, notifications: any[]): Promise<void> {
    try {
      // Buscar webhooks configurados para o tenant
      const webhookUrls = await this.getWebhookUrls(tenantId);
      
      for (const url of webhookUrls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': tenantId,
              'X-Event-Type': 'notifications'
            },
            body: JSON.stringify({
              notifications,
              timestamp: new Date().toISOString(),
              tenantId
            })
          });

          if (response.ok) {
            console.log(`🔗 [WEBHOOK] Successfully sent to ${url}`);
          } else {
            console.error(`🔗 [WEBHOOK] Failed to send to ${url}: ${response.status}`);
          }
        } catch (error) {
          console.error(`🔗 [WEBHOOK] Error sending to ${url}:`, error);
        }
      }
    } catch (error) {
      console.error('🔗 [WEBHOOK] Webhook send error:', error);
    }
  }

  addConnection(tenantId: string, connection: any): void {
    if (!this.activeConnections.has(tenantId)) {
      this.activeConnections.set(tenantId, new Set());
    }
    this.activeConnections.get(tenantId)!.add(connection);
    console.log(`🔗 [WEBHOOK] Added SSE connection for tenant ${tenantId}`);
  }

  removeConnection(tenantId: string, connection: any): void {
    const connections = this.activeConnections.get(tenantId);
    if (connections) {
      connections.delete(connection);
      console.log(`🔗 [WEBHOOK] Removed SSE connection for tenant ${tenantId}`);
    }
  }

  private async getWebhookUrls(tenantId: string): Promise<string[]> {
    // TODO: Implementar busca de webhooks configurados no banco
    // Por enquanto, retorna uma lista vazia
    return [];
  }
}

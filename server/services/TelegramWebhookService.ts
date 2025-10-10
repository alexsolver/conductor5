interface TelegramReceptionLog {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: string;
  author?: string;
  content?: string;
  chatId?: string | number;
  metadata?: any;
}

class TelegramWebhookService {
  private receptionLogs: Map<string, TelegramReceptionLog[]> = new Map();
  private readonly MAX_LOGS_PER_TENANT = 50;

  /**
   * Add a reception log for a tenant
   */
  addReceptionLog(tenantId: string, log: Omit<TelegramReceptionLog, 'timestamp'>): void {
    if (!this.receptionLogs.has(tenantId)) {
      this.receptionLogs.set(tenantId, []);
    }

    const fullLog: TelegramReceptionLog = {
      ...log,
      timestamp: new Date().toISOString()
    };

    const logs = this.receptionLogs.get(tenantId)!;
    logs.unshift(fullLog);

    if (logs.length > this.MAX_LOGS_PER_TENANT) {
      logs.pop();
    }

    console.log(`📝 [TELEGRAM-WEBHOOK] Log added for tenant ${tenantId}: ${log.message}`);
  }

  /**
   * Get reception logs for a tenant
   */
  getReceptionLogs(tenantId: string): TelegramReceptionLog[] {
    return this.receptionLogs.get(tenantId) || [];
  }

  /**
   * Clear reception logs for a tenant
   */
  clearReceptionLogs(tenantId: string): void {
    this.receptionLogs.delete(tenantId);
    console.log(`🧹 [TELEGRAM-WEBHOOK] Reception logs cleared for tenant: ${tenantId}`);
  }

  /**
   * Log successful message reception
   */
  logMessageReceived(tenantId: string, message: any): void {
    this.addReceptionLog(tenantId, {
      type: 'success',
      message: `Message received from ${message.from?.first_name || 'Unknown'}`,
      author: `${message.from?.first_name || ''} ${message.from?.last_name || ''}`.trim() || 'Unknown',
      content: message.text || '[No text content]',
      chatId: message.chat?.id,
      metadata: {
        messageId: message.message_id,
        username: message.from?.username,
        chatType: message.chat?.type
      }
    });
  }

  /**
   * Log error during message processing
   */
  logError(tenantId: string, error: string, details?: any): void {
    this.addReceptionLog(tenantId, {
      type: 'error',
      message: error,
      metadata: details
    });
  }

  /**
   * Log informational message
   */
  logInfo(tenantId: string, message: string, metadata?: any): void {
    this.addReceptionLog(tenantId, {
      type: 'info',
      message,
      metadata
    });
  }
}

// Export singleton instance
export const telegramWebhookService = new TelegramWebhookService();
export type { TelegramReceptionLog };

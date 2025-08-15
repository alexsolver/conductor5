
export interface TelegramMetrics {
  messagesSent: number;
  messagesReceived: number;
  webhookEvents: number;
  errorCount: number;
  successRate: number;
  avgResponseTime: number;
  lastActivity: Date;
  templateUsage: Record<string, number>;
  chatActivity: Record<string, number>;
}

export interface TelegramLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: string;
  chatId?: string;
  messageId?: string;
  success: boolean;
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export class TelegramMetricsService {
  private metrics: TelegramMetrics = {
    messagesSent: 0,
    messagesReceived: 0,
    webhookEvents: 0,
    errorCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    lastActivity: new Date(),
    templateUsage: {},
    chatActivity: {}
  };

  private logs: TelegramLogEntry[] = [];
  private readonly maxLogs = 1000;

  constructor(private tenantId: string) {
    console.log(`📊 [TELEGRAM-METRICS] Initialized for tenant: ${tenantId}`);
  }

  public logEvent(event: string, data: Partial<TelegramLogEntry>): void {
    const logEntry: TelegramLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: data.level || 'info',
      event,
      success: data.success ?? true,
      ...data
    };

    this.logs.unshift(logEntry);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Atualizar métricas baseado no evento
    this.updateMetricsFromEvent(logEntry);

    console.log(`📊 [TELEGRAM-METRICS] Event logged: ${event}`, {
      level: logEntry.level,
      success: logEntry.success,
      tenantId: this.tenantId
    });
  }

  private updateMetricsFromEvent(log: TelegramLogEntry): void {
    this.metrics.lastActivity = log.timestamp;

    switch (log.event) {
      case 'message_sent':
        this.metrics.messagesSent++;
        if (log.responseTime) {
          this.updateResponseTime(log.responseTime);
        }
        break;
      
      case 'message_received':
        this.metrics.messagesReceived++;
        if (log.chatId) {
          this.metrics.chatActivity[log.chatId] = (this.metrics.chatActivity[log.chatId] || 0) + 1;
        }
        break;
      
      case 'webhook_received':
        this.metrics.webhookEvents++;
        break;
      
      case 'template_used':
        if (log.metadata?.template) {
          this.metrics.templateUsage[log.metadata.template] = 
            (this.metrics.templateUsage[log.metadata.template] || 0) + 1;
        }
        break;
    }

    if (!log.success) {
      this.metrics.errorCount++;
    }

    // Recalcular taxa de sucesso
    const totalEvents = this.metrics.messagesSent + this.metrics.messagesReceived + this.metrics.webhookEvents;
    if (totalEvents > 0) {
      this.metrics.successRate = ((totalEvents - this.metrics.errorCount) / totalEvents) * 100;
    }
  }

  private updateResponseTime(responseTime: number): void {
    const currentAvg = this.metrics.avgResponseTime;
    const totalMessages = this.metrics.messagesSent;
    
    if (totalMessages === 1) {
      this.metrics.avgResponseTime = responseTime;
    } else {
      this.metrics.avgResponseTime = ((currentAvg * (totalMessages - 1)) + responseTime) / totalMessages;
    }
  }

  public getMetrics(): TelegramMetrics {
    return { ...this.metrics };
  }

  public getLogs(limit?: number, level?: string): TelegramLogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(0, limit);
    }
    
    return filteredLogs;
  }

  public getDetailedReport(): {
    metrics: TelegramMetrics;
    recentLogs: TelegramLogEntry[];
    topChats: Array<{chatId: string; count: number}>;
    topTemplates: Array<{template: string; count: number}>;
    errorSummary: Array<{error: string; count: number}>;
  } {
    const errorCounts: Record<string, number> = {};
    this.logs
      .filter(log => !log.success && log.error)
      .forEach(log => {
        errorCounts[log.error!] = (errorCounts[log.error!] || 0) + 1;
      });

    return {
      metrics: this.getMetrics(),
      recentLogs: this.getLogs(20),
      topChats: Object.entries(this.metrics.chatActivity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([chatId, count]) => ({ chatId, count })),
      topTemplates: Object.entries(this.metrics.templateUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([template, count]) => ({ template, count })),
      errorSummary: Object.entries(errorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }))
    };
  }

  public clearLogs(): void {
    this.logs = [];
    console.log(`🧹 [TELEGRAM-METRICS] Logs cleared for tenant: ${this.tenantId}`);
  }

  public resetMetrics(): void {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      webhookEvents: 0,
      errorCount: 0,
      successRate: 100,
      avgResponseTime: 0,
      lastActivity: new Date(),
      templateUsage: {},
      chatActivity: {}
    };
    console.log(`🔄 [TELEGRAM-METRICS] Metrics reset for tenant: ${this.tenantId}`);
  }
}

// Singleton global para gerenciar métricas por tenant
export class GlobalTelegramMetricsManager {
  private static instance: GlobalTelegramMetricsManager;
  private services: Map<string, TelegramMetricsService> = new Map();

  private constructor() {}

  public static getInstance(): GlobalTelegramMetricsManager {
    if (!GlobalTelegramMetricsManager.instance) {
      GlobalTelegramMetricsManager.instance = new GlobalTelegramMetricsManager();
    }
    return GlobalTelegramMetricsManager.instance;
  }

  public getService(tenantId: string): TelegramMetricsService {
    if (!this.services.has(tenantId)) {
      const service = new TelegramMetricsService(tenantId);
      this.services.set(tenantId, service);
    }
    return this.services.get(tenantId)!;
  }

  public getAllMetrics(): Record<string, TelegramMetrics> {
    const allMetrics: Record<string, TelegramMetrics> = {};
    for (const [tenantId, service] of this.services) {
      allMetrics[tenantId] = service.getMetrics();
    }
    return allMetrics;
  }
}

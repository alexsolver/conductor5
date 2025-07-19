import { sql } from 'drizzle-orm';
import { db } from '../db';
import { enterpriseMonitoring } from './EnterpriseMonitoring';

// ===========================
// ENTERPRISE REAL-TIME ALERTING SYSTEM
// Resolver problema 3: Real-time alerting inexistente
// ===========================

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cooldown: number; // milliseconds
  lastTriggered?: number;
  actions: Array<'log' | 'email' | 'webhook' | 'slack'>;
}

interface Alert {
  id: string;
  ruleId: string;
  severity: string;
  message: string;
  tenantId?: string;
  timestamp: number;
  resolved: boolean;
}

export class EnterpriseRealTimeAlerting {
  private static instance: EnterpriseRealTimeAlerting;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private readonly MAX_HISTORY = 1000;

  static getInstance(): EnterpriseRealTimeAlerting {
    if (!EnterpriseRealTimeAlerting.instance) {
      EnterpriseRealTimeAlerting.instance = new EnterpriseRealTimeAlerting();
    }
    return EnterpriseRealTimeAlerting.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  // ===========================
  // REGRAS DE ALERTA PADRÃO
  // ===========================
  private initializeDefaultRules(): void {
    // 1. Pool Exhaustion Alert
    this.addAlertRule({
      id: 'pool_exhaustion',
      name: 'Pool de Conexões Esgotado',
      condition: (metrics) => {
        const poolStatus = metrics.poolStatus;
        return poolStatus && (poolStatus.totalCount / poolStatus.max) > 0.9;
      },
      severity: 'CRITICAL',
      cooldown: 60000, // 1 minuto
      actions: ['log', 'webhook']
    });

    // 2. Query Timeout Alert
    this.addAlertRule({
      id: 'query_timeout',
      name: 'Query Timeout Detectado',
      condition: (metrics) => {
        return metrics.topSlowQueries?.some((q: any) => q.avgTime > 10000);
      },
      severity: 'HIGH',
      cooldown: 300000, // 5 minutos
      actions: ['log']
    });

    // 3. High Connection Count
    this.addAlertRule({
      id: 'high_connections',
      name: 'Alto Número de Conexões',
      condition: (metrics) => {
        const poolStatus = metrics.poolStatus;
        return poolStatus && poolStatus.waitingCount > 5;
      },
      severity: 'MEDIUM',
      cooldown: 120000, // 2 minutos
      actions: ['log']
    });

    // 4. Database Size Growth
    this.addAlertRule({
      id: 'database_size_growth',
      name: 'Crescimento Rápido do Banco',
      condition: (metrics) => {
        // Alert if database size indicates rapid growth patterns
        return metrics.databaseSize && 
               metrics.databaseSize.includes('GB') && 
               parseFloat(metrics.databaseSize) > 1.0;
      },
      severity: 'MEDIUM',
      cooldown: 3600000, // 1 hora
      actions: ['log']
    });

    // 5. Tenant Resource Overuse
    this.addAlertRule({
      id: 'tenant_resource_overuse',
      name: 'Tenant Usando Recursos Excessivos',
      condition: (metrics) => {
        return metrics.tenantMetrics?.some((t: any) => 
          t.connectionCount > 10 || 
          t.queryStats?.some((q: any) => q.count > 1000)
        );
      },
      severity: 'HIGH',
      cooldown: 600000, // 10 minutos
      actions: ['log', 'webhook']
    });

    console.log(`[RealTimeAlerting] Initialized ${this.alertRules.size} default alert rules`);
  }

  // ===========================
  // GERENCIAMENTO DE REGRAS
  // ===========================
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    console.log(`[RealTimeAlerting] Added alert rule: ${rule.name}`);
  }

  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    console.log(`[RealTimeAlerting] Removed alert rule: ${ruleId}`);
  }

  // ===========================
  // PROCESSAMENTO DE ALERTAS
  // ===========================
  async processMetrics(metrics: any, tenantId?: string): Promise<void> {
    const now = Date.now();

    for (const [ruleId, rule] of this.alertRules.entries()) {
      try {
        // Check cooldown
        if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
          continue;
        }

        // Evaluate condition
        if (rule.condition(metrics)) {
          await this.triggerAlert(rule, metrics, tenantId);
          rule.lastTriggered = now;
        }
      } catch (error) {
        console.error(`[RealTimeAlerting] Error evaluating rule ${ruleId}:`, error);
      }
    }
  }

  // ===========================
  // DISPARO DE ALERTAS
  // ===========================
  private async triggerAlert(rule: AlertRule, metrics: any, tenantId?: string): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, metrics, tenantId),
      tenantId,
      timestamp: Date.now(),
      resolved: false
    };

    // Store alert
    this.activeAlerts.set(alertId, alert);
    this.alertHistory.unshift(alert);

    // Limit history size
    if (this.alertHistory.length > this.MAX_HISTORY) {
      this.alertHistory = this.alertHistory.slice(0, this.MAX_HISTORY);
    }

    // Execute actions
    for (const action of rule.actions) {
      await this.executeAlertAction(action, alert, metrics);
    }

    console.warn(`[RealTimeAlerting] 🚨 ${rule.severity} ALERT: ${alert.message}`);
  }

  // ===========================
  // AÇÕES DE ALERTA
  // ===========================
  private async executeAlertAction(action: string, alert: Alert, metrics: any): Promise<void> {
    try {
      switch (action) {
        case 'log':
          console.warn(`[ALERT-${alert.severity}] ${alert.message}`, {
            alertId: alert.id,
            tenantId: alert.tenantId,
            timestamp: new Date(alert.timestamp).toISOString(),
            metrics: JSON.stringify(metrics, null, 2)
          });
          break;

        case 'webhook':
          // Simulate webhook call (implement actual webhook as needed)
          console.log(`[RealTimeAlerting] Webhook triggered for alert: ${alert.id}`);
          break;

        case 'email':
          // Simulate email notification (implement actual email as needed)
          console.log(`[RealTimeAlerting] Email notification triggered for alert: ${alert.id}`);
          break;

        case 'slack':
          // Simulate Slack notification (implement actual Slack as needed)
          console.log(`[RealTimeAlerting] Slack notification triggered for alert: ${alert.id}`);
          break;

        default:
          console.warn(`[RealTimeAlerting] Unknown alert action: ${action}`);
      }
    } catch (error) {
      console.error(`[RealTimeAlerting] Failed to execute alert action ${action}:`, error);
    }
  }

  // ===========================
  // GERAÇÃO DE MENSAGENS
  // ===========================
  private generateAlertMessage(rule: AlertRule, metrics: any, tenantId?: string): string {
    const tenantInfo = tenantId ? ` [Tenant: ${tenantId}]` : '';
    
    switch (rule.id) {
      case 'pool_exhaustion':
        const poolUtil = ((metrics.poolStatus?.totalCount / metrics.poolStatus?.max) * 100).toFixed(1);
        return `Pool de conexões ${poolUtil}% utilizado (${metrics.poolStatus?.totalCount}/${metrics.poolStatus?.max})${tenantInfo}`;

      case 'query_timeout':
        const slowQuery = metrics.topSlowQueries?.find((q: any) => q.avgTime > 10000);
        return `Query lenta detectada: ${slowQuery?.query} (${slowQuery?.avgTime}ms)${tenantInfo}`;

      case 'high_connections':
        return `${metrics.poolStatus?.waitingCount} conexões aguardando na fila${tenantInfo}`;

      case 'database_size_growth':
        return `Banco de dados cresceu para ${metrics.databaseSize}${tenantInfo}`;

      case 'tenant_resource_overuse':
        const overuseTenant = metrics.tenantMetrics?.find((t: any) => t.connectionCount > 10);
        return `Tenant usando ${overuseTenant?.connectionCount} conexões simultâneas${tenantInfo}`;

      default:
        return `${rule.name} disparado${tenantInfo}`;
    }
  }

  // ===========================
  // RESOLUÇÃO DE ALERTAS
  // ===========================
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.activeAlerts.delete(alertId);
      console.log(`[RealTimeAlerting] ✅ Alert ${alertId} resolved by ${resolvedBy || 'system'}`);
      return true;
    }
    return false;
  }

  // ===========================
  // AUTO-RESOLUÇÃO
  // ===========================
  async autoResolveAlerts(): Promise<void> {
    const now = Date.now();
    const autoResolveAfter = 30 * 60 * 1000; // 30 minutos

    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (!alert.resolved && (now - alert.timestamp) > autoResolveAfter) {
        this.resolveAlert(alertId, 'auto-resolve');
      }
    }
  }

  // ===========================
  // RELATÓRIOS E MÉTRICAS
  // ===========================
  getActiveAlerts(tenantId?: string): Alert[] {
    const alerts = Array.from(this.activeAlerts.values());
    return tenantId 
      ? alerts.filter(a => a.tenantId === tenantId)
      : alerts;
  }

  getAlertHistory(limit: number = 50, tenantId?: string): Alert[] {
    let history = this.alertHistory.slice(0, limit);
    return tenantId 
      ? history.filter(a => a.tenantId === tenantId)
      : history;
  }

  getAlertStats(): any {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);

    const recent24h = this.alertHistory.filter(a => a.timestamp > last24h);
    const recent7d = this.alertHistory.filter(a => a.timestamp > last7d);

    return {
      activeAlerts: this.activeAlerts.size,
      totalRules: this.alertRules.size,
      alerts24h: recent24h.length,
      alerts7d: recent7d.length,
      criticalAlerts24h: recent24h.filter(a => a.severity === 'CRITICAL').length,
      alertsBySeverity: {
        CRITICAL: recent24h.filter(a => a.severity === 'CRITICAL').length,
        HIGH: recent24h.filter(a => a.severity === 'HIGH').length,
        MEDIUM: recent24h.filter(a => a.severity === 'MEDIUM').length,
        LOW: recent24h.filter(a => a.severity === 'LOW').length
      }
    };
  }

  // ===========================
  // INICIAR MONITORAMENTO CONTÍNUO
  // ===========================
  startContinuousAlerting(): void {
    console.log('[RealTimeAlerting] Starting continuous real-time alerting...');

    // Check alerts every 30 seconds
    setInterval(async () => {
      try {
        const metrics = await enterpriseMonitoring.generateMetricsReport();
        if (metrics) {
          await this.processMetrics(metrics);
        }
      } catch (error) {
        console.error('[RealTimeAlerting] Error processing metrics for alerts:', error);
      }
    }, 30000);

    // Auto-resolve old alerts every 5 minutes
    setInterval(() => {
      this.autoResolveAlerts();
    }, 300000);

    console.log('✅ Real-time alerting system started');
  }
}

export const enterpriseRealTimeAlerting = EnterpriseRealTimeAlerting.getInstance();
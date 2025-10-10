/**
 * SLA MONITORING SERVICE
 * Monitors queue wait times, SLA compliance, and auto-escalation
 */

import { QueueEntry, Queue } from '../entities/Queue';
import { IQueueRepository } from '../repositories/IQueueRepository';

export interface SLAMetrics {
  totalEntries: number;
  waitingCount: number;
  assignedCount: number;
  completedCount: number;
  timeoutCount: number;
  avgWaitTime: number;
  maxWaitTime: number;
  slaViolations: number;
  slaComplianceRate: number;
  escalatedCount: number;
}

export interface SLAAlert {
  type: 'warning' | 'critical' | 'escalation';
  queueId: string;
  queueName: string;
  entryId: string;
  customerId?: string;
  customerName?: string;
  waitTime: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

export class SLAMonitoringService {
  constructor(private queueRepository: IQueueRepository) {}

  /**
   * Monitor queue entries for SLA violations
   */
  async monitorQueue(tenantId: string, queueId: string): Promise<{
    metrics: SLAMetrics;
    alerts: SLAAlert[];
    escalations: QueueEntry[];
  }> {
    const queue = await this.queueRepository.findQueueById(queueId, tenantId);
    if (!queue) {
      throw new Error('Queue not found');
    }

    const entries = await this.queueRepository.findEntriesByQueue(queueId, tenantId);
    
    const metrics = this.calculateMetrics(entries, queue);
    const alerts = this.generateAlerts(entries, queue);
    const escalations = await this.processEscalations(entries, queue, tenantId);

    return { metrics, alerts, escalations };
  }

  /**
   * Monitor all queues in tenant
   */
  async monitorAllQueues(tenantId: string): Promise<{
    metrics: Record<string, SLAMetrics>;
    alerts: SLAAlert[];
    totalViolations: number;
  }> {
    const queues = await this.queueRepository.findQueuesByTenant(tenantId);
    const allMetrics: Record<string, SLAMetrics> = {};
    const allAlerts: SLAAlert[] = [];
    let totalViolations = 0;

    for (const queue of queues) {
      const entries = await this.queueRepository.findEntriesByQueue(queue.id, tenantId);
      const metrics = this.calculateMetrics(entries, queue);
      const alerts = this.generateAlerts(entries, queue);

      allMetrics[queue.id] = metrics;
      allAlerts.push(...alerts);
      totalViolations += metrics.slaViolations;
    }

    return {
      metrics: allMetrics,
      alerts: allAlerts,
      totalViolations
    };
  }

  /**
   * Calculate SLA metrics for queue entries
   */
  private calculateMetrics(entries: QueueEntry[], queue: Queue): SLAMetrics {
    const now = Date.now();

    const waiting = entries.filter(e => e.status === 'waiting');
    const assigned = entries.filter(e => e.status === 'assigned' || e.status === 'in_progress');
    const completed = entries.filter(e => e.status === 'completed');
    const timeout = entries.filter(e => e.status === 'timeout');
    const escalated = entries.filter(e => e.escalated);
    const violations = entries.filter(e => e.slaExceeded);

    // Calculate wait times for waiting entries
    const waitTimes = waiting.map(e => {
      const startTime = e.waitStartedAt instanceof Date 
        ? e.waitStartedAt.getTime() 
        : new Date(e.waitStartedAt).getTime();
      return Math.floor((now - startTime) / 1000);
    });

    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    const maxWaitTime = waitTimes.length > 0
      ? Math.max(...waitTimes)
      : 0;

    const totalEntries = entries.length;
    const slaComplianceRate = totalEntries > 0
      ? Math.round(((totalEntries - violations.length) / totalEntries) * 100)
      : 100;

    return {
      totalEntries,
      waitingCount: waiting.length,
      assignedCount: assigned.length,
      completedCount: completed.length,
      timeoutCount: timeout.length,
      avgWaitTime,
      maxWaitTime,
      slaViolations: violations.length,
      slaComplianceRate,
      escalatedCount: escalated.length,
    };
  }

  /**
   * Generate SLA alerts
   */
  private generateAlerts(entries: QueueEntry[], queue: Queue): SLAAlert[] {
    const alerts: SLAAlert[] = [];
    const now = Date.now();
    const maxWaitTime = queue.maxWaitTime || 300; // Default 5 minutes

    for (const entry of entries) {
      if (entry.status !== 'waiting') continue;

      const startTime = entry.waitStartedAt instanceof Date 
        ? entry.waitStartedAt.getTime() 
        : new Date(entry.waitStartedAt).getTime();
      const waitTime = Math.floor((now - startTime) / 1000);
      const warningThreshold = maxWaitTime * 0.7; // 70% of max
      const criticalThreshold = maxWaitTime * 0.9; // 90% of max

      // Critical alert (>90%)
      if (waitTime >= criticalThreshold && !entry.slaExceeded) {
        alerts.push({
          type: 'critical',
          queueId: queue.id,
          queueName: queue.name,
          entryId: entry.id,
          customerId: entry.customerId,
          customerName: entry.customerName,
          waitTime,
          threshold: criticalThreshold,
          message: `Customer waiting ${this.formatTime(waitTime)} - Critical (${Math.round((waitTime/maxWaitTime)*100)}% of SLA)`,
          timestamp: new Date()
        });
      }
      // Warning alert (>70%)
      else if (waitTime >= warningThreshold) {
        alerts.push({
          type: 'warning',
          queueId: queue.id,
          queueName: queue.name,
          entryId: entry.id,
          customerId: entry.customerId,
          customerName: entry.customerName,
          waitTime,
          threshold: warningThreshold,
          message: `Customer waiting ${this.formatTime(waitTime)} - Warning (${Math.round((waitTime/maxWaitTime)*100)}% of SLA)`,
          timestamp: new Date()
        });
      }

      // Escalation alert
      if (entry.escalated) {
        alerts.push({
          type: 'escalation',
          queueId: queue.id,
          queueName: queue.name,
          entryId: entry.id,
          customerId: entry.customerId,
          customerName: entry.customerName,
          waitTime,
          threshold: maxWaitTime,
          message: `SLA exceeded - Customer escalated after ${this.formatTime(waitTime)}`,
          timestamp: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Process automatic escalations
   */
  private async processEscalations(
    entries: QueueEntry[],
    queue: Queue,
    tenantId: string
  ): Promise<QueueEntry[]> {
    const escalated: QueueEntry[] = [];
    const now = Date.now();
    const maxWaitTime = queue.maxWaitTime || 300; // Default 5 minutes

    for (const entry of entries) {
      if (entry.status !== 'waiting') continue;
      if (entry.escalated) continue; // Already escalated

      const startTime = entry.waitStartedAt instanceof Date 
        ? entry.waitStartedAt.getTime() 
        : new Date(entry.waitStartedAt).getTime();
      const waitTime = Math.floor((now - startTime) / 1000);

      // Auto-escalate if exceeded max wait time
      if (waitTime > maxWaitTime) {
        const updated = await this.queueRepository.updateEntry(entry.id, {
          slaExceeded: true,
          escalated: true,
          escalatedAt: new Date(),
          priority: Math.min(entry.priority + 1, 5), // Increase priority (max 5)
          metadata: {
            ...entry.metadata,
            escalation: {
              originalPriority: entry.priority,
              escalatedAt: new Date(),
              reason: 'SLA exceeded',
              waitTime
            }
          }
        });

        escalated.push(updated);
      }
    }

    return escalated;
  }

  /**
   * Calculate estimated wait time for new entry
   */
  calculateEstimatedWait(
    waitingCount: number,
    availableAgents: number,
    avgHandlingTime: number = 600 // 10 minutes default
  ): number {
    if (availableAgents === 0) {
      return -1; // Unknown
    }

    // Queue Theory: W = (N/λ) * S
    // W = wait time, N = queue length, λ = service rate, S = service time
    const estimated = Math.ceil((waitingCount / availableAgents) * avgHandlingTime);
    return estimated;
  }

  /**
   * Get queue health status
   */
  getHealthStatus(metrics: SLAMetrics): 'healthy' | 'warning' | 'critical' {
    if (metrics.slaComplianceRate >= 95) {
      return 'healthy';
    } else if (metrics.slaComplianceRate >= 80) {
      return 'warning';
    } else {
      return 'critical';
    }
  }

  /**
   * Format seconds to human readable
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }

  /**
   * Get SLA summary for dashboard
   */
  async getDashboardSummary(tenantId: string): Promise<{
    totalQueues: number;
    activeQueues: number;
    totalWaiting: number;
    totalActive: number;
    totalCompleted: number;
    overallCompliance: number;
    totalAlerts: number;
    criticalAlerts: number;
  }> {
    const { metrics, alerts } = await this.monitorAllQueues(tenantId);

    const queues = Object.keys(metrics).length;
    const activeQueues = Object.values(metrics).filter(m => m.waitingCount > 0).length;
    const totalWaiting = Object.values(metrics).reduce((sum, m) => sum + m.waitingCount, 0);
    const totalActive = Object.values(metrics).reduce((sum, m) => sum + m.assignedCount, 0);
    const totalCompleted = Object.values(metrics).reduce((sum, m) => sum + m.completedCount, 0);
    
    const totalEntries = Object.values(metrics).reduce((sum, m) => sum + m.totalEntries, 0);
    const totalViolations = Object.values(metrics).reduce((sum, m) => sum + m.slaViolations, 0);
    const overallCompliance = totalEntries > 0
      ? Math.round(((totalEntries - totalViolations) / totalEntries) * 100)
      : 100;

    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;

    return {
      totalQueues: queues,
      activeQueues,
      totalWaiting,
      totalActive,
      totalCompleted,
      overallCompliance,
      totalAlerts: alerts.length,
      criticalAlerts,
    };
  }
}

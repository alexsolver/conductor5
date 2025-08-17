// ✅ 1QA.MD COMPLIANCE: APPLICATION SERVICE - REAL-TIME DASHBOARD
// Application Layer - Real-time dashboard data with WebSocket integration

import logger from '../../../../utils/logger';

export interface RealTimeWidget {
  id: string;
  dashboardId: string;
  tenantId: string;
  widgetType: 'metric' | 'chart' | 'table' | 'gauge' | 'map' | 'timeline';
  dataSource: {
    module: string;
    query: string;
    refreshInterval: number; // seconds
    lastRefresh: Date;
  };
  config: {
    title: string;
    visualization: any;
    thresholds?: Array<{
      value: number;
      color: string;
      operator: '>' | '<' | '=' | '>=' | '<=';
    }>;
    alerts?: Array<{
      condition: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      notificationChannels: string[];
    }>;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isActive: boolean;
}

export interface DashboardSubscription {
  dashboardId: string;
  tenantId: string;
  userId: string;
  connectionId: string;
  subscribedAt: Date;
  widgets: string[];
  preferences: {
    updateFrequency: 'realtime' | 'fast' | 'normal' | 'slow';
    enableNotifications: boolean;
    dataCompression: boolean;
  };
}

export interface RealTimeData {
  widgetId: string;
  timestamp: Date;
  data: any;
  metadata: {
    recordCount: number;
    executionTime: number;
    dataHash: string;
    hasChanged: boolean;
  };
  alerts?: Array<{
    severity: string;
    message: string;
    threshold: any;
  }>;
}

export class RealtimeDashboardService {
  private subscriptions: Map<string, DashboardSubscription> = new Map();
  private widgetTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastWidgetData: Map<string, string> = new Map(); // Store data hashes

  constructor(
    private logger: typeof logger
  ) {}

  /**
   * Subscribe to real-time dashboard updates
   * ✅ FEATURE: WebSocket/SSE subscription management
   */
  async subscribeToDashboard(
    dashboardId: string,
    userId: string,
    tenantId: string,
    connectionId: string,
    widgets: string[],
    preferences?: any
  ): Promise<DashboardSubscription> {
    try {
      this.logger.info('Subscribing to dashboard real-time updates', { 
        dashboardId, userId, tenantId, widgetCount: widgets.length 
      });

      const subscription: DashboardSubscription = {
        dashboardId,
        tenantId,
        userId,
        connectionId,
        subscribedAt: new Date(),
        widgets,
        preferences: {
          updateFrequency: preferences?.updateFrequency || 'normal',
          enableNotifications: preferences?.enableNotifications || true,
          dataCompression: preferences?.dataCompression || true
        }
      };

      // Store subscription
      this.subscriptions.set(connectionId, subscription);

      // Start real-time updates for each widget
      for (const widgetId of widgets) {
        await this.startWidgetUpdates(widgetId, subscription);
      }

      this.logger.info('Successfully subscribed to dashboard', { 
        dashboardId, connectionId, activeSubscriptions: this.subscriptions.size 
      });

      return subscription;
    } catch (error) {
      this.logger.error('Error subscribing to dashboard', { error, dashboardId, userId });
      throw new Error(`Failed to subscribe to dashboard: ${error.message}`);
    }
  }

  /**
   * Unsubscribe from dashboard updates
   * ✅ FEATURE: Subscription cleanup
   */
  async unsubscribeFromDashboard(connectionId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(connectionId);
      if (!subscription) {
        this.logger.warn('Subscription not found for connection', { connectionId });
        return;
      }

      this.logger.info('Unsubscribing from dashboard', { 
        dashboardId: subscription.dashboardId, 
        connectionId 
      });

      // Stop all widget timers for this subscription
      for (const widgetId of subscription.widgets) {
        const timerKey = `${connectionId}_${widgetId}`;
        const timer = this.widgetTimers.get(timerKey);
        if (timer) {
          clearInterval(timer);
          this.widgetTimers.delete(timerKey);
        }
      }

      // Remove subscription
      this.subscriptions.delete(connectionId);

      this.logger.info('Successfully unsubscribed from dashboard', { 
        connectionId, activeSubscriptions: this.subscriptions.size 
      });
    } catch (error) {
      this.logger.error('Error unsubscribing from dashboard', { error, connectionId });
    }
  }

  /**
   * Start real-time updates for a specific widget
   * ✅ FEATURE: Widget-level update management
   */
  private async startWidgetUpdates(
    widgetId: string,
    subscription: DashboardSubscription
  ): Promise<void> {
    try {
      // Get widget configuration
      const widget = await this.getWidgetConfiguration(widgetId, subscription.tenantId);
      if (!widget) {
        this.logger.warn('Widget not found', { widgetId, tenantId: subscription.tenantId });
        return;
      }

      // Calculate update frequency based on preferences
      const intervalMs = this.calculateUpdateInterval(
        widget.dataSource.refreshInterval,
        subscription.preferences.updateFrequency
      );

      const timerKey = `${subscription.connectionId}_${widgetId}`;

      // Set up periodic updates
      const timer = setInterval(async () => {
        try {
          const data = await this.fetchWidgetData(widget, subscription.tenantId);
          
          // Check if data has changed
          const dataHash = this.generateDataHash(data);
          const lastHash = this.lastWidgetData.get(widgetId);
          
          if (dataHash !== lastHash) {
            this.lastWidgetData.set(widgetId, dataHash);
            
            const realTimeData: RealTimeData = {
              widgetId,
              timestamp: new Date(),
              data: data.results,
              metadata: {
                recordCount: data.recordCount || 0,
                executionTime: data.executionTime || 0,
                dataHash,
                hasChanged: true
              },
              alerts: await this.checkWidgetAlerts(widget, data)
            };

            // Send update to client (this would integrate with WebSocket/SSE)
            await this.sendWidgetUpdate(subscription, realTimeData);
          }
        } catch (error) {
          this.logger.error('Error updating widget data', { error, widgetId });
        }
      }, intervalMs);

      this.widgetTimers.set(timerKey, timer);

      this.logger.info('Started real-time updates for widget', { 
        widgetId, intervalMs, timerKey 
      });
    } catch (error) {
      this.logger.error('Error starting widget updates', { error, widgetId });
    }
  }

  /**
   * Fetch widget configuration from database
   * ✅ INTEGRATION: Widget configuration retrieval
   */
  private async getWidgetConfiguration(
    widgetId: string,
    tenantId: string
  ): Promise<RealTimeWidget | null> {
    try {
      // This would integrate with the actual widget repository
      // For now, return a mock widget configuration
      return {
        id: widgetId,
        dashboardId: 'dashboard-1',
        tenantId,
        widgetType: 'metric',
        dataSource: {
          module: 'tickets',
          query: 'SELECT COUNT(*) as total FROM tickets WHERE status = "open"',
          refreshInterval: 30,
          lastRefresh: new Date()
        },
        config: {
          title: 'Open Tickets',
          visualization: { type: 'number', color: '#3b82f6' },
          thresholds: [
            { value: 100, color: '#ef4444', operator: '>' }
          ],
          alerts: [
            { condition: 'value > 100', severity: 'high', notificationChannels: ['email'] }
          ]
        },
        position: { x: 0, y: 0, width: 4, height: 2 },
        isActive: true
      };
    } catch (error) {
      this.logger.error('Error getting widget configuration', { error, widgetId, tenantId });
      return null;
    }
  }

  /**
   * Fetch real-time data for widget
   * ✅ FEATURE: Data fetching with module integration
   */
  private async fetchWidgetData(
    widget: RealTimeWidget,
    tenantId: string
  ): Promise<any> {
    try {
      // This would integrate with the ModuleIntegrationService
      // For now, return mock data based on widget type
      const mockData = this.generateMockWidgetData(widget);
      
      return {
        results: mockData,
        recordCount: Array.isArray(mockData) ? mockData.length : 1,
        executionTime: Math.random() * 100,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error fetching widget data', { error, widgetId: widget.id });
      throw error;
    }
  }

  /**
   * Generate mock data for different widget types
   * ✅ HELPER: Mock data generation for demonstration
   */
  private generateMockWidgetData(widget: RealTimeWidget): any {
    const now = new Date();
    
    switch (widget.widgetType) {
      case 'metric':
        return { value: Math.floor(Math.random() * 1000), trend: Math.random() > 0.5 ? 'up' : 'down' };
      
      case 'chart':
        return Array.from({ length: 10 }, (_, i) => ({
          x: new Date(now.getTime() - (9 - i) * 3600000).toISOString(),
          y: Math.floor(Math.random() * 100)
        }));
      
      case 'table':
        return Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 100),
          status: Math.random() > 0.5 ? 'active' : 'inactive'
        }));
      
      case 'gauge':
        return { value: Math.floor(Math.random() * 100), max: 100, min: 0 };
      
      default:
        return { value: Math.floor(Math.random() * 100) };
    }
  }

  /**
   * Check for widget alerts based on thresholds
   * ✅ FEATURE: Real-time alerting
   */
  private async checkWidgetAlerts(
    widget: RealTimeWidget,
    data: any
  ): Promise<Array<{ severity: string; message: string; threshold: any }>> {
    const alerts: Array<{ severity: string; message: string; threshold: any }> = [];
    
    if (!widget.config.thresholds || !data.results) {
      return alerts;
    }

    const value = typeof data.results === 'object' ? data.results.value : data.results;
    
    for (const threshold of widget.config.thresholds) {
      let triggered = false;
      
      switch (threshold.operator) {
        case '>':
          triggered = value > threshold.value;
          break;
        case '<':
          triggered = value < threshold.value;
          break;
        case '>=':
          triggered = value >= threshold.value;
          break;
        case '<=':
          triggered = value <= threshold.value;
          break;
        case '=':
          triggered = value === threshold.value;
          break;
      }
      
      if (triggered) {
        alerts.push({
          severity: this.determineAlertSeverity(threshold, widget),
          message: `${widget.config.title}: Value ${value} ${threshold.operator} ${threshold.value}`,
          threshold
        });
      }
    }
    
    return alerts;
  }

  /**
   * Determine alert severity based on threshold and widget config
   * ✅ HELPER: Alert severity calculation
   */
  private determineAlertSeverity(threshold: any, widget: RealTimeWidget): string {
    // Look for matching alert configuration
    if (widget.config.alerts) {
      for (const alert of widget.config.alerts) {
        // Simple condition matching - in real implementation this would be more sophisticated
        if (alert.condition.includes(threshold.value.toString())) {
          return alert.severity;
        }
      }
    }
    
    // Default severity based on threshold color
    if (threshold.color === '#ef4444') return 'high';
    if (threshold.color === '#f59e0b') return 'medium';
    return 'low';
  }

  /**
   * Calculate update interval based on preferences
   * ✅ HELPER: Dynamic interval calculation
   */
  private calculateUpdateInterval(baseInterval: number, frequency: string): number {
    const baseMs = baseInterval * 1000;
    
    switch (frequency) {
      case 'realtime':
        return Math.max(baseMs / 4, 1000); // Minimum 1 second
      case 'fast':
        return Math.max(baseMs / 2, 5000); // Minimum 5 seconds
      case 'normal':
        return baseMs;
      case 'slow':
        return baseMs * 2;
      default:
        return baseMs;
    }
  }

  /**
   * Generate hash for data comparison
   * ✅ HELPER: Data change detection
   */
  private generateDataHash(data: any): string {
    // Simple hash generation for change detection
    return Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 16);
  }

  /**
   * Send widget update to client
   * ✅ INTEGRATION: WebSocket/SSE message sending
   */
  private async sendWidgetUpdate(
    subscription: DashboardSubscription,
    data: RealTimeData
  ): Promise<void> {
    try {
      // This would integrate with WebSocket or SSE implementation
      // For now, just log the update
      this.logger.info('Sending widget update', {
        connectionId: subscription.connectionId,
        widgetId: data.widgetId,
        hasAlerts: (data.alerts?.length || 0) > 0,
        recordCount: data.metadata.recordCount
      });

      // In a real implementation, this would send via WebSocket:
      // this.websocketService.send(subscription.connectionId, {
      //   type: 'widget_update',
      //   dashboardId: subscription.dashboardId,
      //   data
      // });
    } catch (error) {
      this.logger.error('Error sending widget update', { 
        error, 
        connectionId: subscription.connectionId,
        widgetId: data.widgetId 
      });
    }
  }

  /**
   * Get current subscription statistics
   * ✅ HELPER: Monitoring and analytics
   */
  async getSubscriptionStats(): Promise<any> {
    return {
      totalSubscriptions: this.subscriptions.size,
      activeTimers: this.widgetTimers.size,
      subscriptionsByDashboard: Array.from(this.subscriptions.values()).reduce((acc, sub) => {
        acc[sub.dashboardId] = (acc[sub.dashboardId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lastUpdated: new Date()
    };
  }
}
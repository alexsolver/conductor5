
import { GlobalAutomationManager } from './AutomationEngine';

export interface MonitoredMessage {
  id: string;
  content: string;
  sender: string;
  channel: string;
  channelType: string;
  timestamp: string;
  tenantId: string;
  processed?: boolean;
}

export class MessageMonitor {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private readonly CHECK_INTERVAL = 5000; // 5 seconds

  constructor(private tenantId: string) {
    console.log(`📨 [MessageMonitor] Initialized for tenant: ${tenantId}`);
  }

  public start(): void {
    if (this.isRunning) {
      console.log(`⚠️ [MessageMonitor] Already running for tenant: ${this.tenantId}`);
      return;
    }

    console.log(`🚀 [MessageMonitor] Starting message monitoring for tenant: ${this.tenantId}`);
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndProcessNewMessages();
      } catch (error) {
        console.error(`❌ [MessageMonitor] Error in monitoring cycle:`, error);
      }
    }, this.CHECK_INTERVAL);
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log(`🛑 [MessageMonitor] Stopping message monitoring for tenant: ${this.tenantId}`);
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async checkAndProcessNewMessages(): Promise<void> {
    try {
      // Get unprocessed messages from the last 5 minutes
      const unprocessedMessages = await this.getUnprocessedMessages();
      
      if (unprocessedMessages.length === 0) {
        return;
      }

      console.log(`📥 [MessageMonitor] Found ${unprocessedMessages.length} unprocessed messages for tenant: ${this.tenantId}`);

      // Get automation engine for this tenant
      const automationManager = GlobalAutomationManager.getInstance();
      const engine = automationManager.getEngine(this.tenantId);

      // Process each message
      for (const message of unprocessedMessages) {
        try {
          console.log(`🔄 [MessageMonitor] Processing message ${message.id} from ${message.sender}`);

          const messageData = {
            id: message.id,
            content: message.content,
            body: message.content,
            sender: message.sender,
            from: message.sender,
            channel: message.channel,
            channelType: message.channelType,
            timestamp: message.timestamp,
            tenantId: message.tenantId
          };

          // Process message through automation engine
          await engine.processMessage(messageData);

          // Mark message as processed
          await this.markMessageAsProcessed(message.id);

          console.log(`✅ [MessageMonitor] Message ${message.id} processed successfully`);
        } catch (messageError) {
          console.error(`❌ [MessageMonitor] Error processing message ${message.id}:`, messageError);
          // Continue with other messages even if one fails
        }
      }
    } catch (error) {
      console.error(`❌ [MessageMonitor] Error in checkAndProcessNewMessages:`, error);
    }
  }

  private async getUnprocessedMessages(): Promise<MonitoredMessage[]> {
    try {
      // Get messages from the last 5 minutes that haven't been processed by automation
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/omnibridge/messages/unprocessed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': this.tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      } else {
        console.warn(`⚠️ [MessageMonitor] Failed to fetch unprocessed messages: ${response.status}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ [MessageMonitor] Error fetching unprocessed messages:`, error);
      return [];
    }
  }

  private async markMessageAsProcessed(messageId: string): Promise<void> {
    try {
      await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/omnibridge/messages/${messageId}/mark-processed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': this.tenantId
        }
      });
    } catch (error) {
      console.error(`❌ [MessageMonitor] Error marking message as processed:`, error);
    }
  }

  public isMonitoring(): boolean {
    return this.isRunning;
  }
}

// Global message monitor manager
export class GlobalMessageMonitorManager {
  private static instance: GlobalMessageMonitorManager;
  private monitors = new Map<string, MessageMonitor>();

  public static getInstance(): GlobalMessageMonitorManager {
    if (!GlobalMessageMonitorManager.instance) {
      GlobalMessageMonitorManager.instance = new GlobalMessageMonitorManager();
    }
    return GlobalMessageMonitorManager.instance;
  }

  public getMonitor(tenantId: string): MessageMonitor {
    if (!this.monitors.has(tenantId)) {
      const monitor = new MessageMonitor(tenantId);
      this.monitors.set(tenantId, monitor);
      console.log(`📨 [GlobalMessageMonitorManager] Created monitor for tenant: ${tenantId}`);
    }
    return this.monitors.get(tenantId)!;
  }

  public startMonitoring(tenantId: string): void {
    const monitor = this.getMonitor(tenantId);
    monitor.start();
  }

  public stopMonitoring(tenantId: string): void {
    const monitor = this.monitors.get(tenantId);
    if (monitor) {
      monitor.stop();
    }
  }

  public startAllMonitors(): void {
    console.log(`🚀 [GlobalMessageMonitorManager] Starting all message monitors`);
    this.monitors.forEach((monitor, tenantId) => {
      monitor.start();
    });
  }

  public stopAllMonitors(): void {
    console.log(`🛑 [GlobalMessageMonitorManager] Stopping all message monitors`);
    this.monitors.forEach((monitor, tenantId) => {
      monitor.stop();
    });
  }
}

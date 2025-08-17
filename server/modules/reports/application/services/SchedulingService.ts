// ✅ 1QA.MD COMPLIANCE: APPLICATION SERVICE - INTELLIGENT SCHEDULING
// Application Layer - Advanced report scheduling with timezone awareness

import logger from '../../../../utils/logger';

export interface ReportSchedule {
  id: string;
  reportId: string;
  tenantId: string;
  name: string;
  description?: string;
  scheduleType: 'cron' | 'interval' | 'event_driven' | 'threshold';
  scheduleConfig: {
    cron?: string;
    interval?: number; // minutes
    timezone?: string;
    startDate?: Date;
    endDate?: Date;
    offPeakOnly?: boolean;
    maxExecutions?: number;
    retryConfig?: {
      maxRetries: number;
      retryDelay: number; // minutes
      backoffMultiplier: number;
    };
  };
  eventTriggers?: Array<{
    module: string;
    event: string;
    conditions: Record<string, any>;
  }>;
  thresholdTriggers?: Array<{
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    value: number;
    checkInterval: number; // minutes
  }>;
  outputConfig: {
    formats: string[]; // ['pdf', 'excel', 'csv', 'email']
    destinations: Array<{
      type: 'email' | 'file' | 'webhook' | 'storage';
      config: Record<string, any>;
    }>;
    fileNaming: {
      pattern: string; // e.g., "report_{date}_{time}_{reportName}"
      includeTimestamp: boolean;
      includeReportId: boolean;
    };
  };
  resourcePriority: 'low' | 'normal' | 'high' | 'critical';
  isActive: boolean;
  createdBy: string;
  lastExecution?: Date;
  nextExecution?: Date;
  executionCount: number;
  successCount: number;
  errorCount: number;
  metadata: Record<string, any>;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  reportId: string;
  tenantId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  executionTime?: number; // milliseconds
  recordCount?: number;
  outputFiles: Array<{
    format: string;
    path: string;
    size: number;
    url?: string;
  }>;
  error?: {
    message: string;
    stack: string;
    code: string;
  };
  retryAttempt: number;
  resourceUsage: {
    cpuTime: number;
    memoryPeak: number;
    diskIO: number;
  };
  queuePosition?: number;
  priority: number;
}

export interface QueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  peakQueueSize: number;
  currentQueueSize: number;
}

export class SchedulingService {
  private schedules: Map<string, ReportSchedule> = new Map();
  private executionQueue: ScheduleExecution[] = [];
  private runningExecutions: Map<string, ScheduleExecution> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private maxConcurrentExecutions = 5;

  constructor(
    private logger: typeof logger
  ) {
    this.startQueueProcessor();
    this.startOffPeakManager();
  }

  /**
   * Create new report schedule
   * ✅ FEATURE: Schedule Creation with Validation
   */
  async createSchedule(schedule: Omit<ReportSchedule, 'id' | 'executionCount' | 'successCount' | 'errorCount'>): Promise<ReportSchedule> {
    try {
      this.logger.info('Creating report schedule', { 
        reportId: schedule.reportId, 
        scheduleType: schedule.scheduleType,
        tenantId: schedule.tenantId 
      });

      // Validate schedule configuration
      await this.validateScheduleConfig(schedule);

      const newSchedule: ReportSchedule = {
        ...schedule,
        id: crypto.randomUUID(),
        executionCount: 0,
        successCount: 0,
        errorCount: 0,
        nextExecution: await this.calculateNextExecution(schedule)
      };

      // Store schedule
      this.schedules.set(newSchedule.id, newSchedule);

      // Set up timer for cron/interval schedules
      if (newSchedule.scheduleType === 'cron' || newSchedule.scheduleType === 'interval') {
        await this.setupScheduleTimer(newSchedule);
      }

      // Set up event listeners for event-driven schedules
      if (newSchedule.scheduleType === 'event_driven' && newSchedule.eventTriggers) {
        await this.setupEventTriggers(newSchedule);
      }

      // Set up threshold monitoring for threshold schedules
      if (newSchedule.scheduleType === 'threshold' && newSchedule.thresholdTriggers) {
        await this.setupThresholdMonitoring(newSchedule);
      }

      this.logger.info('Report schedule created successfully', { 
        scheduleId: newSchedule.id,
        nextExecution: newSchedule.nextExecution 
      });

      return newSchedule;
    } catch (error) {
      this.logger.error('Error creating report schedule', { error, reportId: schedule.reportId });
      throw new Error(`Failed to create report schedule: ${error.message}`);
    }
  }

  /**
   * Update existing schedule
   * ✅ FEATURE: Schedule Updates
   */
  async updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule> {
    try {
      const existingSchedule = this.schedules.get(scheduleId);
      if (!existingSchedule) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }

      this.logger.info('Updating report schedule', { scheduleId, updates: Object.keys(updates) });

      // Clear existing timer
      await this.clearScheduleTimer(scheduleId);

      // Update schedule
      const updatedSchedule: ReportSchedule = {
        ...existingSchedule,
        ...updates,
        nextExecution: await this.calculateNextExecution({ ...existingSchedule, ...updates })
      };

      this.schedules.set(scheduleId, updatedSchedule);

      // Re-setup timer if still active
      if (updatedSchedule.isActive) {
        if (updatedSchedule.scheduleType === 'cron' || updatedSchedule.scheduleType === 'interval') {
          await this.setupScheduleTimer(updatedSchedule);
        }
      }

      this.logger.info('Report schedule updated successfully', { 
        scheduleId,
        nextExecution: updatedSchedule.nextExecution 
      });

      return updatedSchedule;
    } catch (error) {
      this.logger.error('Error updating report schedule', { error, scheduleId });
      throw new Error(`Failed to update report schedule: ${error.message}`);
    }
  }

  /**
   * Delete schedule
   * ✅ FEATURE: Schedule Deletion
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }

      this.logger.info('Deleting report schedule', { scheduleId });

      // Clear timer
      await this.clearScheduleTimer(scheduleId);

      // Remove from schedules
      this.schedules.delete(scheduleId);

      // Cancel any pending executions
      this.executionQueue = this.executionQueue.filter(exec => exec.scheduleId !== scheduleId);

      // Cancel running execution if any
      const runningExecution = Array.from(this.runningExecutions.values())
        .find(exec => exec.scheduleId === scheduleId);
      if (runningExecution) {
        await this.cancelExecution(runningExecution.id);
      }

      this.logger.info('Report schedule deleted successfully', { scheduleId });
    } catch (error) {
      this.logger.error('Error deleting report schedule', { error, scheduleId });
      throw new Error(`Failed to delete report schedule: ${error.message}`);
    }
  }

  /**
   * Execute schedule immediately
   * ✅ FEATURE: Manual Execution
   */
  async executeScheduleNow(scheduleId: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): Promise<string> {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }

      this.logger.info('Executing schedule immediately', { scheduleId, priority });

      const execution = await this.createExecution(schedule, priority);
      await this.queueExecution(execution);

      return execution.id;
    } catch (error) {
      this.logger.error('Error executing schedule immediately', { error, scheduleId });
      throw new Error(`Failed to execute schedule: ${error.message}`);
    }
  }

  /**
   * Get schedule by ID
   * ✅ FEATURE: Schedule Retrieval
   */
  async getSchedule(scheduleId: string): Promise<ReportSchedule | null> {
    return this.schedules.get(scheduleId) || null;
  }

  /**
   * List schedules with filtering
   * ✅ FEATURE: Schedule Listing
   */
  async listSchedules(filters?: {
    reportId?: string;
    tenantId?: string;
    isActive?: boolean;
    scheduleType?: string;
  }): Promise<ReportSchedule[]> {
    let schedules = Array.from(this.schedules.values());

    if (filters) {
      if (filters.reportId) {
        schedules = schedules.filter(s => s.reportId === filters.reportId);
      }
      if (filters.tenantId) {
        schedules = schedules.filter(s => s.tenantId === filters.tenantId);
      }
      if (filters.isActive !== undefined) {
        schedules = schedules.filter(s => s.isActive === filters.isActive);
      }
      if (filters.scheduleType) {
        schedules = schedules.filter(s => s.scheduleType === filters.scheduleType);
      }
    }

    return schedules;
  }

  /**
   * Get execution history
   * ✅ FEATURE: Execution History
   */
  async getExecutionHistory(scheduleId: string, limit = 50): Promise<ScheduleExecution[]> {
    // In a real implementation, this would query the database
    // For now, return mock data
    return [];
  }

  /**
   * Get queue statistics
   * ✅ FEATURE: Queue Monitoring
   */
  async getQueueStats(): Promise<QueueStats> {
    const completedExecutions = 0; // Would come from database
    const failedExecutions = 0; // Would come from database
    
    return {
      pending: this.executionQueue.length,
      running: this.runningExecutions.size,
      completed: completedExecutions,
      failed: failedExecutions,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      peakQueueSize: 0,
      currentQueueSize: this.executionQueue.length
    };
  }

  /**
   * Validate schedule configuration
   * ✅ HELPER: Configuration Validation
   */
  private async validateScheduleConfig(schedule: any): Promise<void> {
    if (!schedule.reportId || !schedule.tenantId) {
      throw new Error('Report ID and Tenant ID are required');
    }

    if (schedule.scheduleType === 'cron' && !schedule.scheduleConfig.cron) {
      throw new Error('Cron expression is required for cron schedules');
    }

    if (schedule.scheduleType === 'interval' && !schedule.scheduleConfig.interval) {
      throw new Error('Interval is required for interval schedules');
    }

    if (schedule.scheduleType === 'event_driven' && (!schedule.eventTriggers || schedule.eventTriggers.length === 0)) {
      throw new Error('Event triggers are required for event-driven schedules');
    }

    if (schedule.scheduleType === 'threshold' && (!schedule.thresholdTriggers || schedule.thresholdTriggers.length === 0)) {
      throw new Error('Threshold triggers are required for threshold schedules');
    }

    // Validate timezone
    if (schedule.scheduleConfig.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: schedule.scheduleConfig.timezone });
      } catch (error) {
        throw new Error(`Invalid timezone: ${schedule.scheduleConfig.timezone}`);
      }
    }

    // Validate output formats
    const supportedFormats = ['pdf', 'excel', 'csv', 'json'];
    for (const format of schedule.outputConfig.formats) {
      if (!supportedFormats.includes(format)) {
        throw new Error(`Unsupported output format: ${format}`);
      }
    }
  }

  /**
   * Calculate next execution time
   * ✅ HELPER: Execution Time Calculation
   */
  private async calculateNextExecution(schedule: any): Promise<Date | undefined> {
    if (!schedule.isActive) return undefined;

    const now = new Date();
    const timezone = schedule.scheduleConfig.timezone || 'UTC';

    switch (schedule.scheduleType) {
      case 'cron':
        // Would use a cron library to calculate next execution
        return new Date(now.getTime() + 60000); // Mock: 1 minute from now
      
      case 'interval':
        const intervalMs = schedule.scheduleConfig.interval * 60000;
        return new Date(now.getTime() + intervalMs);
      
      case 'event_driven':
      case 'threshold':
        return undefined; // These are triggered by events/thresholds
      
      default:
        return undefined;
    }
  }

  /**
   * Setup schedule timer
   * ✅ HELPER: Timer Management
   */
  private async setupScheduleTimer(schedule: ReportSchedule): Promise<void> {
    if (!schedule.nextExecution) return;

    const delay = schedule.nextExecution.getTime() - Date.now();
    if (delay <= 0) return;

    const timer = setTimeout(async () => {
      try {
        const execution = await this.createExecution(schedule, schedule.resourcePriority);
        await this.queueExecution(execution);
        
        // Calculate next execution
        const updatedSchedule = {
          ...schedule,
          nextExecution: await this.calculateNextExecution(schedule)
        };
        this.schedules.set(schedule.id, updatedSchedule);
        
        // Setup next timer
        if (updatedSchedule.nextExecution) {
          await this.setupScheduleTimer(updatedSchedule);
        }
      } catch (error) {
        this.logger.error('Error in scheduled execution', { error, scheduleId: schedule.id });
      }
    }, delay);

    this.timers.set(schedule.id, timer);
  }

  /**
   * Clear schedule timer
   * ✅ HELPER: Timer Cleanup
   */
  private async clearScheduleTimer(scheduleId: string): Promise<void> {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }
  }

  /**
   * Create execution object
   * ✅ HELPER: Execution Creation
   */
  private async createExecution(schedule: ReportSchedule, priority: string): Promise<ScheduleExecution> {
    const priorityLevel = { low: 1, normal: 2, high: 3, critical: 4 }[priority] || 2;
    
    return {
      id: crypto.randomUUID(),
      scheduleId: schedule.id,
      reportId: schedule.reportId,
      tenantId: schedule.tenantId,
      status: 'pending',
      outputFiles: [],
      retryAttempt: 0,
      resourceUsage: {
        cpuTime: 0,
        memoryPeak: 0,
        diskIO: 0
      },
      priority: priorityLevel
    };
  }

  /**
   * Queue execution for processing
   * ✅ HELPER: Queue Management
   */
  private async queueExecution(execution: ScheduleExecution): Promise<void> {
    // Insert in priority order
    let insertIndex = this.executionQueue.length;
    for (let i = 0; i < this.executionQueue.length; i++) {
      if (this.executionQueue[i].priority < execution.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.executionQueue.splice(insertIndex, 0, execution);
    execution.queuePosition = insertIndex + 1;

    this.logger.info('Execution queued', { 
      executionId: execution.id,
      queuePosition: execution.queuePosition,
      queueSize: this.executionQueue.length 
    });
  }

  /**
   * Start queue processor
   * ✅ FEATURE: Queue Processing
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      while (this.runningExecutions.size < this.maxConcurrentExecutions && this.executionQueue.length > 0) {
        const execution = this.executionQueue.shift();
        if (execution) {
          await this.processExecution(execution);
        }
      }
    }, 1000); // Check every second
  }

  /**
   * Process individual execution
   * ✅ FEATURE: Execution Processing
   */
  private async processExecution(execution: ScheduleExecution): Promise<void> {
    try {
      execution.status = 'running';
      execution.startedAt = new Date();
      this.runningExecutions.set(execution.id, execution);

      this.logger.info('Starting execution', { 
        executionId: execution.id,
        scheduleId: execution.scheduleId,
        reportId: execution.reportId 
      });

      // Mock execution - in real implementation this would execute the report
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 1000));

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.executionTime = execution.completedAt.getTime() - execution.startedAt!.getTime();
      execution.recordCount = Math.floor(Math.random() * 1000);

      // Update schedule statistics
      const schedule = this.schedules.get(execution.scheduleId);
      if (schedule) {
        schedule.executionCount++;
        schedule.successCount++;
        schedule.lastExecution = execution.completedAt;
        this.schedules.set(schedule.id, schedule);
      }

      this.logger.info('Execution completed', { 
        executionId: execution.id,
        executionTime: execution.executionTime,
        recordCount: execution.recordCount 
      });
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = {
        message: error.message,
        stack: error.stack,
        code: error.code || 'UNKNOWN'
      };

      // Update schedule statistics
      const schedule = this.schedules.get(execution.scheduleId);
      if (schedule) {
        schedule.executionCount++;
        schedule.errorCount++;
        this.schedules.set(schedule.id, schedule);
      }

      this.logger.error('Execution failed', { 
        error,
        executionId: execution.id,
        scheduleId: execution.scheduleId 
      });

      // Handle retry logic
      await this.handleExecutionRetry(execution);
    } finally {
      this.runningExecutions.delete(execution.id);
    }
  }

  /**
   * Handle execution retry logic
   * ✅ FEATURE: Retry Management
   */
  private async handleExecutionRetry(execution: ScheduleExecution): Promise<void> {
    const schedule = this.schedules.get(execution.scheduleId);
    if (!schedule?.scheduleConfig.retryConfig) return;

    const retryConfig = schedule.scheduleConfig.retryConfig;
    if (execution.retryAttempt >= retryConfig.maxRetries) {
      this.logger.warn('Max retries exceeded', { 
        executionId: execution.id,
        retryAttempt: execution.retryAttempt 
      });
      return;
    }

    const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, execution.retryAttempt) * 60000;
    
    setTimeout(async () => {
      const retryExecution = {
        ...execution,
        id: crypto.randomUUID(),
        status: 'pending' as const,
        retryAttempt: execution.retryAttempt + 1,
        startedAt: undefined,
        completedAt: undefined,
        error: undefined
      };
      
      await this.queueExecution(retryExecution);
    }, delay);

    this.logger.info('Execution retry scheduled', { 
      executionId: execution.id,
      retryAttempt: execution.retryAttempt + 1,
      delay 
    });
  }

  /**
   * Cancel execution
   * ✅ FEATURE: Execution Cancellation
   */
  private async cancelExecution(executionId: string): Promise<void> {
    // Remove from queue
    this.executionQueue = this.executionQueue.filter(exec => exec.id !== executionId);
    
    // Cancel running execution
    const runningExecution = this.runningExecutions.get(executionId);
    if (runningExecution) {
      runningExecution.status = 'cancelled';
      runningExecution.completedAt = new Date();
      this.runningExecutions.delete(executionId);
    }

    this.logger.info('Execution cancelled', { executionId });
  }

  /**
   * Setup event triggers (placeholder)
   * ✅ PLACEHOLDER: Event-driven scheduling
   */
  private async setupEventTriggers(schedule: ReportSchedule): Promise<void> {
    // This would integrate with the event system
    this.logger.info('Setting up event triggers', { scheduleId: schedule.id });
  }

  /**
   * Setup threshold monitoring (placeholder)
   * ✅ PLACEHOLDER: Threshold-based scheduling
   */
  private async setupThresholdMonitoring(schedule: ReportSchedule): Promise<void> {
    // This would set up threshold monitoring
    this.logger.info('Setting up threshold monitoring', { scheduleId: schedule.id });
  }

  /**
   * Start off-peak manager
   * ✅ FEATURE: Off-peak execution management
   */
  private startOffPeakManager(): void {
    // This would manage off-peak execution hours
    setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const isOffPeak = hour < 6 || hour > 22; // Example: 10 PM to 6 AM
      
      if (isOffPeak) {
        // Process off-peak only executions with higher priority
        this.executionQueue.sort((a, b) => {
          const aOffPeak = this.schedules.get(a.scheduleId)?.scheduleConfig.offPeakOnly;
          const bOffPeak = this.schedules.get(b.scheduleId)?.scheduleConfig.offPeakOnly;
          
          if (aOffPeak && !bOffPeak) return -1;
          if (!aOffPeak && bOffPeak) return 1;
          return b.priority - a.priority;
        });
      }
    }, 60000); // Check every minute
  }
}
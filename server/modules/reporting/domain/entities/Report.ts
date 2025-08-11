/**
 * Report Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for business intelligence reporting
 */

interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file';
  connection: Record<string, any>;
  query?: string;
  refreshInterval?: number; // minutes
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  daysOfWeek?: number[]; // for weekly
  dayOfMonth?: number; // for monthly
  recipients: string[]; // email addresses
  format: 'pdf' | 'excel' | 'csv';
}

export class Report {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private description: string,
    private category: 'operational' | 'financial' | 'performance' | 'compliance' | 'custom' = 'operational',
    private type: 'tabular' | 'chart' | 'dashboard' | 'summary' = 'tabular',
    private parameters: ReportParameter[] = [],
    private dataSources: DataSource[] = [],
    private query: string = '',
    private visualization: Record<string, any> = {},
    private schedule: ReportSchedule | null = null,
    private isPublished: boolean = false,
    private isShared: boolean = false,
    private sharedWith: string[] = [], // user IDs
    private tags: string[] = [],
    private metadata: Record<string, any> = {},
    private lastRunAt: Date | null = null,
    private lastRunDuration: number | null = null, // milliseconds
    private runCount: number = 0,
    private avgExecutionTime: number = 0, // milliseconds
    private readonly createdById: string,
    private readonly createdByName: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getCategory(): 'operational' | 'financial' | 'performance' | 'compliance' | 'custom' { return this.category; }
  getType(): 'tabular' | 'chart' | 'dashboard' | 'summary' { return this.type; }
  getParameters(): ReportParameter[] { return [...this.parameters]; }
  getDataSources(): DataSource[] { return [...this.dataSources]; }
  getQuery(): string { return this.query; }
  getVisualization(): Record<string, any> { return { ...this.visualization }; }
  getSchedule(): ReportSchedule | null { return this.schedule; }
  isReportPublished(): boolean { return this.isPublished; }
  isReportShared(): boolean { return this.isShared; }
  getSharedWith(): string[] { return [...this.sharedWith]; }
  getTags(): string[] { return [...this.tags]; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getLastRunAt(): Date | null { return this.lastRunAt; }
  getLastRunDuration(): number | null { return this.lastRunDuration; }
  getRunCount(): number { return this.runCount; }
  getAvgExecutionTime(): number { return this.avgExecutionTime; }
  getCreatedById(): string { return this.createdById; }
  getCreatedByName(): string { return this.createdByName; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateBasicInfo(name: string, description: string, category?: 'operational' | 'financial' | 'performance' | 'compliance' | 'custom'): void {
    if (!name.trim()) {
      throw new Error('Report name cannot be empty');
    }
    
    this.name = name.trim();
    this.description = description.trim();
    
    if (category) {
      this.category = category;
    }
    
    this.updatedAt = new Date();
  }

  updateQuery(query: string): void {
    if (!query.trim()) {
      throw new Error('Query cannot be empty');
    }
    
    this.query = query.trim();
    this.updatedAt = new Date();
  }

  addParameter(parameter: ReportParameter): void {
    // Check for duplicate parameter name
    if (this.parameters.some(p => p.name === parameter.name)) {
      throw new Error('Parameter with this name already exists');
    }
    
    this.validateParameter(parameter);
    this.parameters.push(parameter);
    this.updatedAt = new Date();
  }

  updateParameter(parameterName: string, updates: Partial<ReportParameter>): void {
    const paramIndex = this.parameters.findIndex(p => p.name === parameterName);
    if (paramIndex === -1) {
      throw new Error('Parameter not found');
    }
    
    const updatedParameter = { ...this.parameters[paramIndex], ...updates };
    this.validateParameter(updatedParameter);
    
    this.parameters[paramIndex] = updatedParameter;
    this.updatedAt = new Date();
  }

  removeParameter(parameterName: string): void {
    this.parameters = this.parameters.filter(p => p.name !== parameterName);
    this.updatedAt = new Date();
  }

  addDataSource(dataSource: DataSource): void {
    // Check for duplicate data source ID
    if (this.dataSources.some(ds => ds.id === dataSource.id)) {
      throw new Error('Data source with this ID already exists');
    }
    
    this.dataSources.push(dataSource);
    this.updatedAt = new Date();
  }

  updateDataSource(dataSourceId: string, updates: Partial<DataSource>): void {
    const dsIndex = this.dataSources.findIndex(ds => ds.id === dataSourceId);
    if (dsIndex === -1) {
      throw new Error('Data source not found');
    }
    
    this.dataSources[dsIndex] = { ...this.dataSources[dsIndex], ...updates };
    this.updatedAt = new Date();
  }

  removeDataSource(dataSourceId: string): void {
    this.dataSources = this.dataSources.filter(ds => ds.id !== dataSourceId);
    this.updatedAt = new Date();
  }

  updateVisualization(visualization: Record<string, any>): void {
    this.visualization = { ...visualization };
    this.updatedAt = new Date();
  }

  setSchedule(schedule: ReportSchedule): void {
    this.validateSchedule(schedule);
    this.schedule = schedule;
    this.updatedAt = new Date();
  }

  removeSchedule(): void {
    this.schedule = null;
    this.updatedAt = new Date();
  }

  publish(): void {
    if (this.dataSources.length === 0) {
      throw new Error('Cannot publish report without data sources');
    }
    if (!this.query.trim()) {
      throw new Error('Cannot publish report without query');
    }
    
    this.isPublished = true;
    this.updatedAt = new Date();
  }

  unpublish(): void {
    this.isPublished = false;
    this.updatedAt = new Date();
  }

  shareWith(userIds: string[]): void {
    if (!this.isPublished) {
      throw new Error('Cannot share unpublished report');
    }
    
    // Add new user IDs, avoiding duplicates
    userIds.forEach(userId => {
      if (!this.sharedWith.includes(userId)) {
        this.sharedWith.push(userId);
      }
    });
    
    this.isShared = this.sharedWith.length > 0;
    this.updatedAt = new Date();
  }

  unshareWith(userIds: string[]): void {
    this.sharedWith = this.sharedWith.filter(userId => !userIds.includes(userId));
    this.isShared = this.sharedWith.length > 0;
    this.updatedAt = new Date();
  }

  makePublic(): void {
    if (!this.isPublished) {
      throw new Error('Cannot make unpublished report public');
    }
    
    this.isShared = true;
    this.sharedWith = []; // Empty array means public to all
    this.updatedAt = new Date();
  }

  makePrivate(): void {
    this.isShared = false;
    this.sharedWith = [];
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    this.tags = this.tags.filter(t => t !== normalizedTag);
    this.updatedAt = new Date();
  }

  recordExecution(duration: number): void {
    this.lastRunAt = new Date();
    this.lastRunDuration = duration;
    this.runCount++;
    
    // Update average execution time
    this.avgExecutionTime = ((this.avgExecutionTime * (this.runCount - 1)) + duration) / this.runCount;
    
    this.updatedAt = new Date();
  }

  // Private validation methods
  private validateParameter(parameter: ReportParameter): void {
    if (!parameter.name.trim()) {
      throw new Error('Parameter name cannot be empty');
    }
    
    if (parameter.type === 'select' && (!parameter.options || parameter.options.length === 0)) {
      throw new Error('Select parameter must have options');
    }
    
    if (parameter.validation) {
      if (parameter.validation.min !== undefined && parameter.validation.max !== undefined) {
        if (parameter.validation.min > parameter.validation.max) {
          throw new Error('Parameter min value cannot be greater than max value');
        }
      }
    }
  }

  private validateSchedule(schedule: ReportSchedule): void {
    if (!schedule.time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      throw new Error('Schedule time must be in HH:MM format');
    }
    
    if (schedule.recipients.length === 0) {
      throw new Error('Schedule must have at least one recipient');
    }
    
    if (schedule.frequency === 'weekly' && (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0)) {
      throw new Error('Weekly schedule must specify days of week');
    }
    
    if (schedule.frequency === 'monthly' && !schedule.dayOfMonth) {
      throw new Error('Monthly schedule must specify day of month');
    }
  }

  // Business queries
  hasParameters(): boolean {
    return this.parameters.length > 0;
  }

  getRequiredParameters(): ReportParameter[] {
    return this.parameters.filter(p => p.required);
  }

  hasDataSources(): boolean {
    return this.dataSources.length > 0;
  }

  isScheduled(): boolean {
    return this.schedule !== null;
  }

  canBeExecuted(): boolean {
    return this.isPublished && this.hasDataSources() && this.query.trim() !== '';
  }

  isAccessibleBy(userId: string): boolean {
    if (!this.isPublished) return false;
    if (!this.isShared) return userId === this.createdById; // Only creator can access
    if (this.sharedWith.length === 0) return true; // Public
    return this.sharedWith.includes(userId);
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag.toLowerCase());
  }

  getPerformanceScore(): number {
    if (this.runCount === 0) return 100;
    
    // Performance score based on execution time
    const baselineTime = 5000; // 5 seconds baseline
    if (this.avgExecutionTime <= baselineTime) return 100;
    
    // Deduct points for slower execution
    const penalty = Math.min(((this.avgExecutionTime - baselineTime) / baselineTime) * 50, 80);
    return Math.max(20, 100 - penalty);
  }

  getUsageFrequency(): 'low' | 'medium' | 'high' {
    if (this.runCount === 0) return 'low';
    
    const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const runsPerDay = this.runCount / Math.max(1, daysSinceCreation);
    
    if (runsPerDay >= 1) return 'high';
    if (runsPerDay >= 0.2) return 'medium'; // 1+ runs per week
    return 'low';
  }

  shouldOptimize(): boolean {
    return this.getPerformanceScore() < 70 && this.getUsageFrequency() !== 'low';
  }

  getEstimatedExecutionTime(): number {
    return this.avgExecutionTime > 0 ? this.avgExecutionTime : 5000; // 5 second default
  }

  getNextScheduledRun(): Date | null {
    if (!this.schedule) return null;
    
    const now = new Date();
    const [hours, minutes] = this.schedule.time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, move to next occurrence
    if (nextRun <= now) {
      switch (this.schedule.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          // Find next occurrence based on days of week
          // Simplified - would need more complex logic
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          if (this.schedule.dayOfMonth) {
            nextRun.setDate(this.schedule.dayOfMonth);
          }
          break;
        case 'quarterly':
          nextRun.setMonth(nextRun.getMonth() + 3);
          break;
      }
    }
    
    return nextRun;
  }

  isCompliantReport(): boolean {
    return this.category === 'compliance' && this.isPublished && this.isScheduled();
  }

  getComplexityScore(): 'simple' | 'moderate' | 'complex' {
    let score = 0;
    
    // Parameter complexity
    score += this.parameters.length * 2;
    
    // Data source complexity
    score += this.dataSources.length * 3;
    
    // Query complexity (simplified check)
    const queryLength = this.query.length;
    if (queryLength > 1000) score += 10;
    else if (queryLength > 500) score += 5;
    
    // Visualization complexity
    if (Object.keys(this.visualization).length > 5) score += 5;
    
    if (score >= 20) return 'complex';
    if (score >= 10) return 'moderate';
    return 'simple';
  }
}
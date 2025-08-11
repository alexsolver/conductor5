/**
 * TemplateAudit Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for template audit management
 */

interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

interface AuditMetrics {
  usage_count: number;
  error_count: number;
  performance_score: number;
  last_used: Date;
}

export class TemplateAudit {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private readonly templateId: string,
    private templateName: string,
    private action: 'created' | 'updated' | 'deleted' | 'used' | 'validated' | 'deployed',
    private performedById: string,
    private performedByName: string,
    private changes: AuditChange[] = [],
    private metadata: Record<string, any> = {},
    private severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    private status: 'success' | 'failed' | 'pending' = 'success',
    private metrics: AuditMetrics | null = null,
    private readonly timestamp: Date = new Date(),
    private readonly sessionId: string = generateSessionId()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getTemplateId(): string { return this.templateId; }
  getTemplateName(): string { return this.templateName; }
  getAction(): 'created' | 'updated' | 'deleted' | 'used' | 'validated' | 'deployed' { return this.action; }
  getPerformedById(): string { return this.performedById; }
  getPerformedByName(): string { return this.performedByName; }
  getChanges(): AuditChange[] { return [...this.changes]; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getSeverity(): 'info' | 'warning' | 'error' | 'critical' { return this.severity; }
  getStatus(): 'success' | 'failed' | 'pending' { return this.status; }
  getMetrics(): AuditMetrics | null { return this.metrics; }
  getTimestamp(): Date { return this.timestamp; }
  getSessionId(): string { return this.sessionId; }

  // Business methods
  addChange(field: string, oldValue: any, newValue: any): void {
    this.changes.push({
      field,
      oldValue,
      newValue,
      timestamp: new Date()
    });
  }

  addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  updateSeverity(severity: 'info' | 'warning' | 'error' | 'critical'): void {
    this.severity = severity;
  }

  markAsSuccess(): void {
    this.status = 'success';
  }

  markAsFailed(errorDetails?: string): void {
    this.status = 'failed';
    if (errorDetails) {
      this.addMetadata('error_details', errorDetails);
    }
  }

  markAsPending(): void {
    this.status = 'pending';
  }

  updateMetrics(metrics: AuditMetrics): void {
    this.metrics = metrics;
  }

  updateTemplateName(name: string): void {
    this.templateName = name;
  }

  // Business queries
  hasChanges(): boolean {
    return this.changes.length > 0;
  }

  getChangesByField(field: string): AuditChange[] {
    return this.changes.filter(change => change.field === field);
  }

  isStructuralChange(): boolean {
    const structuralFields = ['schema', 'layout', 'components', 'fields'];
    return this.changes.some(change => 
      structuralFields.some(field => change.field.includes(field))
    );
  }

  isContentChange(): boolean {
    const contentFields = ['title', 'description', 'content', 'text', 'value'];
    return this.changes.some(change => 
      contentFields.some(field => change.field.includes(field))
    );
  }

  isStyleChange(): boolean {
    const styleFields = ['css', 'style', 'theme', 'color', 'font', 'layout'];
    return this.changes.some(change => 
      styleFields.some(field => change.field.includes(field))
    );
  }

  isCriticalChange(): boolean {
    return this.severity === 'critical' || this.isStructuralChange();
  }

  getChangeCount(): number {
    return this.changes.length;
  }

  getChangedFields(): string[] {
    return [...new Set(this.changes.map(change => change.field))];
  }

  getDuration(): number | null {
    if (!this.metadata.start_time || !this.metadata.end_time) {
      return null;
    }
    
    const startTime = new Date(this.metadata.start_time);
    const endTime = new Date(this.metadata.end_time);
    return endTime.getTime() - startTime.getTime(); // milliseconds
  }

  wasSuccessful(): boolean {
    return this.status === 'success';
  }

  wasFailed(): boolean {
    return this.status === 'failed';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isHighPriority(): boolean {
    return this.severity === 'error' || this.severity === 'critical';
  }

  getPerformanceScore(): number | null {
    return this.metrics?.performance_score || null;
  }

  getUsageCount(): number {
    return this.metrics?.usage_count || 0;
  }

  getErrorCount(): number {
    return this.metrics?.error_count || 0;
  }

  hasErrors(): boolean {
    return this.getErrorCount() > 0;
  }

  isRecentActivity(hours: number = 24): boolean {
    const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.timestamp > hoursAgo;
  }

  getActionDescription(): string {
    switch (this.action) {
      case 'created':
        return `Template "${this.templateName}" was created`;
      case 'updated':
        return `Template "${this.templateName}" was updated`;
      case 'deleted':
        return `Template "${this.templateName}" was deleted`;
      case 'used':
        return `Template "${this.templateName}" was used`;
      case 'validated':
        return `Template "${this.templateName}" was validated`;
      case 'deployed':
        return `Template "${this.templateName}" was deployed`;
      default:
        return `Action performed on template "${this.templateName}"`;
    }
  }

  getSummary(): string {
    const changeCount = this.getChangeCount();
    const changedFields = this.getChangedFields();
    
    if (changeCount === 0) {
      return this.getActionDescription();
    }
    
    const fieldsText = changedFields.length <= 3 
      ? changedFields.join(', ')
      : `${changedFields.slice(0, 3).join(', ')} and ${changedFields.length - 3} more`;
    
    return `${this.getActionDescription()} - Modified: ${fieldsText}`;
  }

  getComplianceRisk(): 'low' | 'medium' | 'high' {
    if (this.severity === 'critical' || this.wasFailed()) {
      return 'high';
    }
    
    if (this.severity === 'error' || this.isStructuralChange()) {
      return 'medium';
    }
    
    return 'low';
  }
}

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
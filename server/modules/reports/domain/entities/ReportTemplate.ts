// ✅ 1QA.MD COMPLIANCE: DOMAIN ENTITY - PURE BUSINESS LOGIC
// Domain Layer - Zero dependencies on infrastructure or application layers

export interface ReportTemplate {
  id: string;
  tenantId: string;
  
  // Template Information
  name: string;
  description?: string;
  category: string; // Module or functional category
  moduleType?: string; // tickets, customers, materials, etc.
  
  // Template Configuration
  templateConfig: Record<string, any>; // Complete report configuration
  defaultParameters: Record<string, any>;
  requiredFields: string[];
  optionalFields: string[];
  
  // Customization & Branding
  brandingConfig: Record<string, any>; // Logo, colors, fonts
  layoutOptions: Record<string, any>; // Available layout variations
  styleOptions: Record<string, any>; // Available styling options
  
  // Usage & Popularity
  usageCount: number;
  rating: number;
  ratingCount: number;
  
  // Access & Sharing
  isPublic: boolean;
  isSystem: boolean; // System-provided templates
  allowedRoles: string[];
  
  // Versioning
  version: string;
  parentTemplateId?: string; // For template inheritance
  isLatestVersion: boolean;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // references users.id
}

export interface ReportSchedule {
  id: string;
  tenantId: string;
  reportId: string;
  
  // Schedule Configuration
  name: string;
  type: 'cron' | 'event_driven' | 'threshold' | 'manual' | 'real_time';
  cronExpression?: string; // For cron schedules
  scheduleConfig: Record<string, any>; // Advanced scheduling options
  
  // Execution Settings
  timezone: string;
  isActive: boolean;
  offPeakOnly: boolean;
  resourcePriority: number; // 1-10 scale
  maxExecutionTime: number; // seconds
  retryAttempts: number;
  retryDelay: number; // seconds
  
  // Trigger Conditions (for event-driven schedules)
  triggerConditions: Record<string, any>;
  thresholdConfig: Record<string, any>;
  
  // Delivery & Output
  outputFormats: string[];
  deliveryMethods: string[];
  recipients: Record<string, any>; // Email addresses, webhook URLs, etc.
  
  // Execution History
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastError?: string;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // references users.id
}

export interface ReportNotification {
  id: string;
  tenantId: string;
  reportId: string;
  
  // Notification Configuration
  name: string;
  triggerType: string; // result_threshold, execution_status, schedule, data_change
  triggerConditions: Record<string, any>; // Specific trigger conditions
  
  // Notification Settings
  notificationChannels: string[]; // email, sms, webhook, slack, teams
  recipients: Record<string, any>; // Channel-specific recipients
  messageTemplate?: string;
  subjectTemplate?: string;
  
  // Action Configuration
  actions: any[]; // Automated actions to take
  escalationRules: Record<string, any>; // Escalation configuration
  
  // Status & Control
  isActive: boolean;
  priority: number; // 1-10 scale
  cooldownPeriod: number; // seconds between notifications
  
  // Execution History
  lastTriggeredAt?: Date;
  triggerCount: number;
  lastNotificationSent?: Date;
  notificationCount: number;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // references users.id
}

export interface ReportTemplateFilters {
  tenantId: string;
  category?: string;
  moduleType?: string;
  isPublic?: boolean;
  isSystem?: boolean;
  isLatestVersion?: boolean;
  search?: string;
  minRating?: number;
  allowedRoles?: string[];
}

// Template-specific domain business rules
export class ReportTemplateDomain {
  static validateTemplateCreation(template: Partial<ReportTemplate>): string[] {
    const errors: string[] = [];
    
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }
    
    if (template.name && template.name.length > 255) {
      errors.push('Template name cannot exceed 255 characters');
    }
    
    if (!template.category || template.category.trim().length === 0) {
      errors.push('Template category is required');
    }
    
    if (!template.templateConfig || typeof template.templateConfig !== 'object') {
      errors.push('Template configuration is required');
    }
    
    if (!template.tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!template.createdBy) {
      errors.push('Creator ID is required');
    }
    
    if (template.rating && (template.rating < 0 || template.rating > 5)) {
      errors.push('Rating must be between 0 and 5');
    }
    
    if (template.version && !isValidVersionString(template.version)) {
      errors.push('Invalid version format (use semantic versioning like 1.0.0)');
    }
    
    return errors;
  }
  
  static validateScheduleCreation(schedule: Partial<ReportSchedule>): string[] {
    const errors: string[] = [];
    
    if (!schedule.name || schedule.name.trim().length === 0) {
      errors.push('Schedule name is required');
    }
    
    if (!schedule.reportId) {
      errors.push('Report ID is required');
    }
    
    if (!schedule.type) {
      errors.push('Schedule type is required');
    }
    
    if (!['cron', 'event_driven', 'threshold', 'manual', 'real_time'].includes(schedule.type || '')) {
      errors.push('Invalid schedule type');
    }
    
    if (schedule.type === 'cron' && !schedule.cronExpression) {
      errors.push('Cron expression is required for cron schedules');
    }
    
    if (schedule.resourcePriority && (schedule.resourcePriority < 1 || schedule.resourcePriority > 10)) {
      errors.push('Resource priority must be between 1 and 10');
    }
    
    if (schedule.maxExecutionTime && schedule.maxExecutionTime < 1) {
      errors.push('Max execution time must be at least 1 second');
    }
    
    if (schedule.retryAttempts && schedule.retryAttempts < 0) {
      errors.push('Retry attempts cannot be negative');
    }
    
    return errors;
  }
  
  static validateNotificationCreation(notification: Partial<ReportNotification>): string[] {
    const errors: string[] = [];
    
    if (!notification.name || notification.name.trim().length === 0) {
      errors.push('Notification name is required');
    }
    
    if (!notification.reportId) {
      errors.push('Report ID is required');
    }
    
    if (!notification.triggerType) {
      errors.push('Trigger type is required');
    }
    
    if (!notification.triggerConditions || typeof notification.triggerConditions !== 'object') {
      errors.push('Trigger conditions are required');
    }
    
    if (!notification.notificationChannels || !Array.isArray(notification.notificationChannels) || notification.notificationChannels.length === 0) {
      errors.push('At least one notification channel is required');
    }
    
    if (!notification.recipients || typeof notification.recipients !== 'object') {
      errors.push('Recipients configuration is required');
    }
    
    if (notification.priority && (notification.priority < 1 || notification.priority > 10)) {
      errors.push('Priority must be between 1 and 10');
    }
    
    if (notification.cooldownPeriod && notification.cooldownPeriod < 0) {
      errors.push('Cooldown period cannot be negative');
    }
    
    return errors;
  }
  
  static canUserAccessTemplate(template: ReportTemplate, userId: string, userRoles: string[]): boolean {
    // Public templates are accessible to all
    if (template.isPublic) {
      return true;
    }
    
    // Creator always has access
    if (template.createdBy === userId) {
      return true;
    }
    
    // System templates are accessible to all within tenant
    if (template.isSystem) {
      return true;
    }
    
    // Check if user's role is allowed
    const hasAllowedRole = userRoles.some(role => template.allowedRoles.includes(role));
    if (hasAllowedRole) {
      return true;
    }
    
    return false;
  }
  
  static generateReportFromTemplate(template: ReportTemplate, customParameters?: Record<string, any>): Partial<Report> {
    const reportConfig = { ...template.templateConfig };
    
    // Merge custom parameters with default parameters
    const parameters = {
      ...template.defaultParameters,
      ...customParameters
    };
    
    return {
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: `Generated from template: ${template.name}`,
      type: 'custom',
      status: 'draft',
      category: template.category,
      templateId: template.id,
      queryConfig: reportConfig.queryConfig || {},
      layoutConfig: reportConfig.layoutConfig || {},
      chartConfig: reportConfig.chartConfig || {},
      formatConfig: reportConfig.formatConfig || {},
      parameters,
      filters: reportConfig.filters || {},
      exportFormats: reportConfig.exportFormats || ['pdf'],
      tags: [template.category, 'template-generated'],
      metadata: {
        templateId: template.id,
        templateName: template.name,
        templateVersion: template.version,
        generatedAt: new Date().toISOString()
      }
    };
  }
  
  static calculateTemplatePopularity(template: ReportTemplate): number {
    // Simple popularity score based on usage and rating
    const usageScore = Math.min(template.usageCount * 0.1, 10); // Max 10 points for usage
    const ratingScore = template.rating * 2; // Max 10 points for rating
    const recencyScore = calculateRecencyScore(template.updatedAt); // Max 5 points for recency
    
    return Math.round((usageScore + ratingScore + recencyScore) / 3 * 10) / 10;
  }
}

// Helper functions
function isValidVersionString(version: string): boolean {
  const semverPattern = /^\d+\.\d+\.\d+$/;
  return semverPattern.test(version);
}

function calculateRecencyScore(updatedAt: Date): number {
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate <= 7) return 5; // Very recent
  if (daysSinceUpdate <= 30) return 4; // Recent
  if (daysSinceUpdate <= 90) return 3; // Somewhat recent
  if (daysSinceUpdate <= 180) return 2; // Old
  return 1; // Very old
}

// Import Report interface for template generation
interface Report {
  id?: string;
  tenantId?: string;
  name: string;
  description?: string;
  type: 'standard' | 'custom' | 'dashboard' | 'scheduled' | 'real_time';
  status: 'draft' | 'active' | 'archived' | 'error' | 'processing' | 'completed';
  category?: string;
  dataSource?: string;
  query?: string;
  queryConfig?: Record<string, any>;
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  layoutConfig?: Record<string, any>;
  chartConfig?: Record<string, any>;
  formatConfig?: Record<string, any>;
  ownerId?: string;
  isPublic?: boolean;
  accessLevel?: 'view_only' | 'edit' | 'admin' | 'public' | 'restricted';
  allowedRoles?: string[];
  allowedUsers?: string[];
  exportFormats?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  version?: number;
  isTemplate?: boolean;
  templateId?: string;
  createdBy?: string;
  updatedBy?: string;
}
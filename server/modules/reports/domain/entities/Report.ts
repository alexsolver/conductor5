// ✅ 1QA.MD COMPLIANCE: DOMAIN ENTITY - PURE BUSINESS LOGIC
// Domain Layer - Zero dependencies on infrastructure or application layers

export interface Report {
  id: string;
  tenantId: string;
  
  // Basic Report Information
  name: string;
  description?: string;
  type: 'standard' | 'custom' | 'dashboard' | 'scheduled' | 'real_time';
  status: 'draft' | 'active' | 'archived' | 'error' | 'processing' | 'completed';
  category?: string; // 'financial', 'operational', 'hr', etc.
  
  // Report Configuration
  dataSource: string; // module name or custom
  query?: string; // SQL query or query builder config
  queryConfig: Record<string, any>; // Visual query builder configuration
  filters: Record<string, any>; // Default filters
  parameters: Record<string, any>; // Report parameters
  
  // Visualization & Layout
  layoutConfig: Record<string, any>; // Layout configuration
  chartConfig: Record<string, any>; // Chart/visualization settings
  formatConfig: Record<string, any>; // Formatting rules
  
  // Access & Security
  ownerId: string; // references users.id
  isPublic: boolean;
  accessLevel: 'view_only' | 'edit' | 'admin' | 'public' | 'restricted';
  allowedRoles: string[]; // Array of role names
  allowedUsers: string[]; // Array of user IDs
  
  // Execution & Performance
  lastExecutedAt?: Date;
  executionCount: number;
  averageExecutionTime: number; // milliseconds
  cacheConfig: Record<string, any>;
  cacheExpiry: number; // seconds
  
  // Export & Delivery
  exportFormats: string[];
  emailConfig: Record<string, any>;
  deliveryConfig: Record<string, any>;
  
  // Audit & Metadata
  tags: string[];
  metadata: Record<string, any>;
  version: number;
  isTemplate: boolean;
  templateId?: string; // Reference to template if created from one
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // references users.id
  updatedBy?: string; // references users.id
}

export interface ReportFilters {
  tenantId: string;
  status?: 'draft' | 'active' | 'archived' | 'error' | 'processing' | 'completed';
  type?: 'standard' | 'custom' | 'dashboard' | 'scheduled' | 'real_time';
  category?: string;
  ownerId?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  dataSource?: string;
  tags?: string[];
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;
}

export interface ReportExecutionResult {
  reportId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  executionTime?: number; // milliseconds
  resultCount: number;
  resultSize: number; // bytes
  outputFiles: any[]; // Generated file information
  errorMessage?: string;
  errorDetails?: Record<string, any>;
  warnings: any[];
}

// Domain business rules
export class ReportDomain {
  static validateReportCreation(report: Partial<Report>): string[] {
    const errors: string[] = [];
    
    if (!report.name || report.name.trim().length === 0) {
      errors.push('Report name is required');
    }
    
    if (report.name && report.name.length > 255) {
      errors.push('Report name cannot exceed 255 characters');
    }
    
    if (!report.dataSource || report.dataSource.trim().length === 0) {
      errors.push('Data source is required');
    }
    
    if (!report.ownerId) {
      errors.push('Owner ID is required');
    }
    
    if (!report.tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (report.type && !['standard', 'custom', 'dashboard', 'scheduled', 'real_time'].includes(report.type)) {
      errors.push('Invalid report type');
    }
    
    if (report.accessLevel && !['view_only', 'edit', 'admin', 'public', 'restricted'].includes(report.accessLevel)) {
      errors.push('Invalid access level');
    }
    
    if (report.exportFormats && !Array.isArray(report.exportFormats)) {
      errors.push('Export formats must be an array');
    }
    
    return errors;
  }
  
  static validateReportExecution(report: Report): string[] {
    const errors: string[] = [];
    
    if (report.status !== 'active') {
      errors.push('Only active reports can be executed');
    }
    
    if (!report.query && !report.queryConfig) {
      errors.push('Report must have either a query or query configuration');
    }
    
    if (!report.dataSource) {
      errors.push('Report must have a data source');
    }
    
    return errors;
  }
  
  static canUserAccessReport(report: Report, userId: string, userRoles: string[]): boolean {
    // Public reports are accessible to all
    if (report.isPublic) {
      return true;
    }
    
    // Owner always has access
    if (report.ownerId === userId) {
      return true;
    }
    
    // Check if user is explicitly allowed
    if (report.allowedUsers.includes(userId)) {
      return true;
    }
    
    // Check if user's role is allowed
    const hasAllowedRole = userRoles.some(role => report.allowedRoles.includes(role));
    if (hasAllowedRole) {
      return true;
    }
    
    return false;
  }
  
  static canUserModifyReport(report: Report, userId: string, userRoles: string[]): boolean {
    // Owner can always modify
    if (report.ownerId === userId) {
      return true;
    }
    
    // Check if user has edit or admin access level and is allowed
    if (['edit', 'admin'].includes(report.accessLevel)) {
      return this.canUserAccessReport(report, userId, userRoles);
    }
    
    return false;
  }
  
  static calculateNextExecutionTime(cronExpression: string, timezone: string = 'UTC'): Date {
    // This would integrate with a cron parser library in infrastructure layer
    // For now, return a placeholder
    const now = new Date();
    return new Date(now.getTime() + 60000); // 1 minute from now
  }
  
  static isReportExecutionOverdue(lastExecutedAt: Date, scheduleConfig: any): boolean {
    // Business logic to determine if a scheduled report is overdue
    if (!lastExecutedAt || !scheduleConfig) {
      return false;
    }
    
    const now = new Date();
    const timeSinceLastExecution = now.getTime() - lastExecutedAt.getTime();
    
    // Simple check: if more than 25 hours since last execution for daily reports
    if (scheduleConfig.frequency === 'daily' && timeSinceLastExecution > 25 * 60 * 60 * 1000) {
      return true;
    }
    
    return false;
  }
}
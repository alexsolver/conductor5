// ✅ 1QA.MD COMPLIANCE: DOMAIN SERVICE - PURE BUSINESS LOGIC
// Domain Layer - Complex business rules and cross-entity operations

import { Report, ReportDomain } from '../entities/Report';
import { Dashboard, DashboardDomain } from '../entities/Dashboard';
import { ReportTemplate } from '../entities/ReportTemplate';

export class ReportsDomainService {
  
  /**
   * Generate a report from a template with custom parameters and user context
   */
  static generateReportFromTemplate(
    template: ReportTemplate,
    customParameters: Record<string, any>,
    userId: string,
    tenantId: string
  ): Partial<Report> {
    // Validate user access to template
    const userRoles = customParameters.userRoles || [];
    // For now, basic access check - template domain logic will be implemented later
    if (template.accessLevel === 'private' && template.ownerId && template.ownerId !== userId) {
      throw new Error('User does not have access to this template');
    }
    
    // Generate base report from template (simplified for now)
    const baseReport = {
      name: customParameters.name || template.name,
      description: customParameters.description || template.description,
      dataSource: template.templateConfig.dataSources[0]?.module || 'tickets',
      reportType: 'table',
      config: template.templateConfig
    };
    
    // Add user and tenant context
    return {
      ...baseReport,
      tenantId,
      ownerId: userId,
      createdBy: userId,
      status: 'draft',
      // Inherit access settings from template if not specified
      isPublic: customParameters.isPublic ?? (template.accessLevel === 'public'),
      // Add generation metadata
      metadata: {
        ...baseReport.metadata,
        generatedBy: userId,
        generatedAt: new Date().toISOString(),
        sourceTemplate: {
          id: template.id,
          name: template.name,
          moduleId: template.moduleId
        }
      }
    };
  }
  
  /**
   * Validate if a report can be executed safely
   */
  static validateReportExecution(
    report: Report,
    executionContext: {
      userId: string;
      userRoles: string[];
      parameters?: Record<string, any>;
      dryRun?: boolean;
    }
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic report validation (simplified for now)
    if (!report.dataSource) {
      errors.push('Report data source is required');
    }
    
    if (!report.config) {
      errors.push('Report configuration is required');
    }
    
    // Access validation (simplified for now)
    if (!report.isPublic && report.ownerId !== executionContext.userId) {
      // Check if user has appropriate role-based access
      const hasAccess = executionContext.userRoles.some(role => 
        ['admin', 'manager', 'analyst'].includes(role)
      );
      if (!hasAccess) {
        errors.push('User does not have access to execute this report');
      }
    }
    
    // Parameter validation
    if (executionContext.parameters) {
      const parameterErrors = this.validateReportParameters(report, executionContext.parameters);
      errors.push(...parameterErrors);
    }
    
    // Performance warnings
    if (report.averageExecutionTime > 30000) { // 30 seconds
      warnings.push('Report has high average execution time, consider optimization');
    }
    
    // Data source warnings
    if (!report.dataSource || report.dataSource === 'unknown') {
      warnings.push('Report data source is not properly configured');
    }
    
    // Cache warnings
    if (report.cacheExpiry < 60 && !executionContext.dryRun) {
      warnings.push('Report cache expiry is very low, may impact performance');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Calculate optimal execution schedule for a report
   */
  static calculateOptimalSchedule(
    report: Report,
    requirements: {
      frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
      timezone: string;
      offPeakOnly?: boolean;
      maxExecutionTime?: number;
      priority?: number;
    }
  ): {
    cronExpression: string;
    nextExecution: Date;
    estimatedDuration: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let cronExpression = '';
    
    // Generate cron expression based on frequency
    switch (requirements.frequency) {
      case 'hourly':
        cronExpression = '0 0 * * * *'; // Every hour
        if (requirements.offPeakOnly) {
          cronExpression = '0 0 2-6 * * *'; // 2 AM to 6 AM only
          recommendations.push('Scheduled for off-peak hours (2-6 AM)');
        }
        break;
      case 'daily':
        cronExpression = requirements.offPeakOnly ? '0 0 3 * * *' : '0 0 6 * * *';
        recommendations.push('Daily execution recommended for data consistency');
        break;
      case 'weekly':
        cronExpression = '0 0 6 * * 1'; // Monday 6 AM
        recommendations.push('Weekly reports provide good performance/freshness balance');
        break;
      case 'monthly':
        cronExpression = '0 0 6 1 * *'; // First day of month at 6 AM
        recommendations.push('Monthly execution suitable for summary reports');
        break;
    }
    
    // Adjust based on report complexity
    if (report.averageExecutionTime > 60000) { // 1 minute
      recommendations.push('Consider caching or query optimization for better performance');
    }
    
    // Calculate next execution time
    const nextExecution = ReportDomain.calculateNextExecutionTime(cronExpression, requirements.timezone);
    
    return {
      cronExpression,
      nextExecution,
      estimatedDuration: report.averageExecutionTime || 30000,
      recommendations
    };
  }
  
  /**
   * Analyze dashboard performance and provide optimization recommendations
   */
  static analyzeDashboardPerformance(
    dashboard: Dashboard,
    widgets: any[],
    analytics: {
      viewCount: number;
      avgLoadTime: number;
      lastWeekViews: number;
      errorRate: number;
    }
  ): {
    performanceScore: number;
    recommendations: string[];
    criticalIssues: string[];
    optimizations: string[];
  } {
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];
    const optimizations: string[] = [];
    
    // Calculate performance score (0-100)
    let performanceScore = 100;
    
    // Analyze load time
    if (analytics.avgLoadTime > 5000) { // 5 seconds
      performanceScore -= 20;
      criticalIssues.push('Dashboard load time exceeds 5 seconds');
      optimizations.push('Consider reducing widget count or implementing lazy loading');
    } else if (analytics.avgLoadTime > 2000) { // 2 seconds
      performanceScore -= 10;
      recommendations.push('Dashboard load time could be improved');
    }
    
    // Analyze error rate
    if (analytics.errorRate > 0.1) { // 10%
      performanceScore -= 30;
      criticalIssues.push('High error rate detected');
    } else if (analytics.errorRate > 0.05) { // 5%
      performanceScore -= 15;
      recommendations.push('Monitor error rate for potential issues');
    }
    
    // Analyze widget count
    if (widgets.length > 20) {
      performanceScore -= 10;
      recommendations.push('Consider splitting dashboard or grouping widgets');
    }
    
    // Analyze refresh settings
    const realTimeWidgets = widgets.filter(w => w.isRealTime);
    if (realTimeWidgets.length > 5) {
      performanceScore -= 15;
      optimizations.push('Limit real-time widgets to improve performance');
    }
    
    // Analyze usage patterns
    if (analytics.viewCount > 1000 && analytics.lastWeekViews < 10) {
      recommendations.push('Dashboard usage has declined, consider reviewing content relevance');
    }
    
    // Widget-specific analysis
    const chartWidgets = widgets.filter(w => w.type === 'chart');
    if (chartWidgets.length > 10) {
      optimizations.push('Consider using summary widgets instead of multiple charts');
    }
    
    return {
      performanceScore: Math.max(0, performanceScore),
      recommendations,
      criticalIssues,
      optimizations
    };
  }
  
  /**
   * Determine data freshness requirements for a report
   */
  static determineDataFreshnessRequirements(
    report: Report,
    context: {
      reportType: string;
      businessCriticality: 'low' | 'medium' | 'high' | 'critical';
      userExpectations: string[];
      dataVolume: 'small' | 'medium' | 'large' | 'massive';
    }
  ): {
    recommendedCacheExpiry: number; // seconds
    refreshStrategy: 'realtime' | 'frequent' | 'periodic' | 'ondemand';
    justification: string;
  } {
    let recommendedCacheExpiry = 300; // 5 minutes default
    let refreshStrategy: 'realtime' | 'frequent' | 'periodic' | 'ondemand' = 'periodic';
    let justification = '';
    
    // Adjust based on business criticality
    switch (context.businessCriticality) {
      case 'critical':
        recommendedCacheExpiry = 60; // 1 minute
        refreshStrategy = 'realtime';
        justification = 'Critical business importance requires real-time data';
        break;
      case 'high':
        recommendedCacheExpiry = 300; // 5 minutes
        refreshStrategy = 'frequent';
        justification = 'High importance requires frequent updates';
        break;
      case 'medium':
        recommendedCacheExpiry = 900; // 15 minutes
        refreshStrategy = 'periodic';
        justification = 'Medium importance allows periodic refresh';
        break;
      case 'low':
        recommendedCacheExpiry = 3600; // 1 hour
        refreshStrategy = 'ondemand';
        justification = 'Low importance can use cached data longer';
        break;
    }
    
    // Adjust based on data volume
    if (context.dataVolume === 'massive') {
      recommendedCacheExpiry *= 2; // Double cache time for massive datasets
      if (refreshStrategy === 'realtime') {
        refreshStrategy = 'frequent';
        justification += ' (adjusted for large data volume)';
      }
    } else if (context.dataVolume === 'small') {
      recommendedCacheExpiry = Math.max(60, recommendedCacheExpiry / 2); // Halve cache time for small datasets
    }
    
    // Adjust based on report type
    if (report.type === 'real_time') {
      recommendedCacheExpiry = Math.min(recommendedCacheExpiry, 60);
      refreshStrategy = 'realtime';
      justification = 'Real-time report type requires minimal caching';
    } else if (report.type === 'scheduled') {
      recommendedCacheExpiry = Math.max(recommendedCacheExpiry, 3600);
      refreshStrategy = 'periodic';
      justification = 'Scheduled reports can tolerate longer cache periods';
    }
    
    return {
      recommendedCacheExpiry,
      refreshStrategy,
      justification
    };
  }
  
  /**
   * Validate report parameters against template requirements
   */
  private static validateReportParameters(
    report: Report,
    parameters: Record<string, any>
  ): string[] {
    const errors: string[] = [];
    
    // Get parameter requirements from report metadata or template
    const requiredParams = report.metadata?.requiredFields || [];
    const optionalParams = report.metadata?.optionalFields || [];
    
    // Check required parameters
    for (const required of requiredParams) {
      if (!(required in parameters) || parameters[required] === null || parameters[required] === undefined) {
        errors.push(`Required parameter '${required}' is missing`);
      }
    }
    
    // Validate parameter types based on report configuration
    const paramConfig = report.parameters || {};
    for (const [key, value] of Object.entries(parameters)) {
      const config = paramConfig[key];
      if (config) {
        const validationError = this.validateParameterValue(key, value, config);
        if (validationError) {
          errors.push(validationError);
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Validate individual parameter value
   */
  private static validateParameterValue(
    paramName: string,
    value: any,
    config: any
  ): string | null {
    if (config.type) {
      switch (config.type) {
        case 'string':
          if (typeof value !== 'string') {
            return `Parameter '${paramName}' must be a string`;
          }
          if (config.maxLength && value.length > config.maxLength) {
            return `Parameter '${paramName}' exceeds maximum length of ${config.maxLength}`;
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            return `Parameter '${paramName}' must be a valid number`;
          }
          if (config.min !== undefined && value < config.min) {
            return `Parameter '${paramName}' must be at least ${config.min}`;
          }
          if (config.max !== undefined && value > config.max) {
            return `Parameter '${paramName}' must be at most ${config.max}`;
          }
          break;
        case 'date':
          if (!(value instanceof Date) && !Date.parse(value)) {
            return `Parameter '${paramName}' must be a valid date`;
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            return `Parameter '${paramName}' must be an array`;
          }
          break;
      }
    }
    
    return null;
  }
}
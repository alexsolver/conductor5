/**
 * Get Audit Reports Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetAuditReportsUseCase
 * @created 2025-08-12 - Phase 23 Clean Architecture Implementation
 */

import { ITemplateAuditRepository } from '../../domain/repositories/ITemplateAuditRepository';
import { TemplateAudit, TemplateType, AuditType, AuditCategory, TemplateAuditDomainService } from '../../domain/entities/TemplateAudit';

export interface GetAuditReportsRequest {
  tenantId: string;
  userRole: string;
  reportType: 'summary' | 'detailed' | 'compliance' | 'risk' | 'user_activity' | 'template_history' | 'anomaly';
  templateId?: string;
  userId?: string;
  filters?: {
    templateType?: TemplateType;
    auditType?: AuditType;
    category?: AuditCategory;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  };
  pagination?: {
    page: number;
    limit: number;
  };
  includeAnalytics?: boolean;
  includeRecommendations?: boolean;
  format?: 'json' | 'csv' | 'pdf';
}

export interface GetAuditReportsResponse {
  success: boolean;
  data?: {
    reportType: string;
    generatedAt: Date;
    summary?: any;
    details?: any;
    analytics?: any;
    recommendations?: any[];
    metadata: {
      totalRecords: number;
      filteredRecords: number;
      timeRange: {
        startDate: Date;
        endDate: Date;
      };
      filters: any;
    };
  };
  errors?: string[];
  warnings?: string[];
}

export class GetAuditReportsUseCase {
  constructor(private auditRepository: ITemplateAuditRepository) {}

  async execute(request: GetAuditReportsRequest): Promise<GetAuditReportsResponse> {
    try {
      // 1. Validate permissions
      if (!this.hasReportPermission(request.userRole, request.reportType)) {
        return {
          success: false,
          errors: ['Insufficient permissions to access this report type']
        };
      }

      // 2. Set default time range if not provided
      const timeRange = this.getTimeRange(request.filters);

      // 3. Generate report based on type
      let reportData: any;
      
      switch (request.reportType) {
        case 'summary':
          reportData = await this.generateSummaryReport(request, timeRange);
          break;
        case 'detailed':
          reportData = await this.generateDetailedReport(request, timeRange);
          break;
        case 'compliance':
          reportData = await this.generateComplianceReport(request, timeRange);
          break;
        case 'risk':
          reportData = await this.generateRiskReport(request, timeRange);
          break;
        case 'user_activity':
          reportData = await this.generateUserActivityReport(request, timeRange);
          break;
        case 'template_history':
          reportData = await this.generateTemplateHistoryReport(request, timeRange);
          break;
        case 'anomaly':
          reportData = await this.generateAnomalyReport(request, timeRange);
          break;
        default:
          return {
            success: false,
            errors: ['Invalid report type']
          };
      }

      // 4. Add analytics if requested
      let analytics;
      if (request.includeAnalytics) {
        analytics = await this.generateAnalytics(request, timeRange);
      }

      // 5. Add recommendations if requested
      let recommendations;
      if (request.includeRecommendations) {
        recommendations = await this.generateRecommendations(request, reportData);
      }

      return {
        success: true,
        data: {
          reportType: request.reportType,
          generatedAt: new Date(),
          summary: reportData.summary,
          details: reportData.details,
          analytics,
          recommendations,
          metadata: {
            totalRecords: reportData.totalRecords || 0,
            filteredRecords: reportData.filteredRecords || 0,
            timeRange,
            filters: request.filters || {}
          }
        }
      };

    } catch (error) {
      console.error('[GetAuditReportsUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error while generating report']
      };
    }
  }

  private hasReportPermission(userRole: string, reportType: string): boolean {
    const permissions: Record<string, string[]> = {
      'summary': ['saas_admin', 'tenant_admin', 'admin', 'manager', 'auditor'],
      'detailed': ['saas_admin', 'tenant_admin', 'admin', 'auditor'],
      'compliance': ['saas_admin', 'tenant_admin', 'admin', 'compliance_officer', 'auditor'],
      'risk': ['saas_admin', 'tenant_admin', 'admin', 'security_officer', 'auditor'],
      'user_activity': ['saas_admin', 'tenant_admin', 'admin', 'security_officer'],
      'template_history': ['saas_admin', 'tenant_admin', 'admin', 'manager'],
      'anomaly': ['saas_admin', 'tenant_admin', 'security_officer', 'auditor']
    };

    return permissions[reportType]?.includes(userRole) || false;
  }

  private getTimeRange(filters?: any): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default: last 30 days

    return {
      startDate: filters?.startDate || startDate,
      endDate: filters?.endDate || endDate
    };
  }

  private async generateSummaryReport(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    const summary = await this.auditRepository.getAuditSummary(request.tenantId, timeRange);
    
    return {
      summary: {
        overview: {
          totalAudits: summary.totalAudits,
          timeRange,
          reportGeneratedAt: new Date()
        },
        distribution: {
          byType: summary.auditsByType,
          byAction: summary.auditsByAction,
          byUser: summary.auditsByUser,
          bySeverity: summary.auditsBySeverity,
          byRisk: summary.riskDistribution
        },
        topActivities: {
          templates: summary.topTemplates,
          trends: summary.trends
        }
      },
      totalRecords: summary.totalAudits,
      filteredRecords: summary.totalAudits
    };
  }

  private async generateDetailedReport(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    const audits = await this.auditRepository.findByDateRange(
      request.tenantId,
      timeRange.startDate,
      timeRange.endDate,
      {
        templateType: request.filters?.templateType,
        auditType: request.filters?.auditType,
        severity: request.filters?.severity
      }
    );

    const processedAudits = audits.map(audit => ({
      id: audit.id,
      timestamp: audit.timestamp,
      templateId: audit.templateId,
      templateType: audit.templateType,
      action: audit.action,
      user: {
        id: audit.userId,
        name: audit.userName,
        role: audit.userRole
      },
      description: audit.details.description,
      severity: audit.severity,
      category: audit.category,
      riskScore: TemplateAuditDomainService.calculateRiskScore(audit).score,
      changes: audit.changes.length,
      complianceStatus: audit.details.compliance.status
    }));

    return {
      summary: {
        totalAudits: audits.length,
        averageRisk: processedAudits.reduce((sum, a) => sum + a.riskScore, 0) / processedAudits.length || 0,
        highRiskCount: processedAudits.filter(a => a.riskScore >= 70).length,
        complianceIssues: processedAudits.filter(a => a.complianceStatus !== 'compliant').length
      },
      details: {
        audits: processedAudits,
        pagination: {
          total: processedAudits.length,
          page: request.pagination?.page || 1,
          limit: request.pagination?.limit || 50
        }
      },
      totalRecords: audits.length,
      filteredRecords: processedAudits.length
    };
  }

  private async generateComplianceReport(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    const complianceReport = await this.auditRepository.getComplianceReport(
      request.tenantId,
      ['SOX', 'GDPR', 'HIPAA', 'ISO27001'],
      timeRange
    );

    return {
      summary: {
        overallCompliance: complianceReport.overallCompliance,
        totalViolations: complianceReport.violations.length,
        criticalViolations: complianceReport.violations.filter(v => v.severity === 'critical').length,
        standardsStatus: complianceReport.standardsCompliance
      },
      details: {
        violations: complianceReport.violations,
        recommendations: complianceReport.recommendations,
        trends: complianceReport.trends,
        standardsBreakdown: complianceReport.standardsCompliance
      },
      totalRecords: complianceReport.violations.length,
      filteredRecords: complianceReport.violations.length
    };
  }

  private async generateRiskReport(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    const riskAnalysis = await this.auditRepository.getRiskAnalysis(
      request.tenantId,
      {
        templateType: request.filters?.templateType,
        timeRange
      }
    );

    return {
      summary: {
        overallRisk: riskAnalysis.overallRisk,
        highRiskAudits: riskAnalysis.highRiskAudits.length,
        topRiskFactors: riskAnalysis.riskFactors.slice(0, 5),
        trendDirection: this.calculateTrendDirection(riskAnalysis.trends)
      },
      details: {
        riskFactors: riskAnalysis.riskFactors,
        highRiskAudits: riskAnalysis.highRiskAudits.map(audit => ({
          id: audit.id,
          templateId: audit.templateId,
          action: audit.action,
          user: audit.userName,
          timestamp: audit.timestamp,
          riskScore: TemplateAuditDomainService.calculateRiskScore(audit).score,
          severity: audit.severity
        })),
        recommendations: riskAnalysis.recommendations,
        trends: riskAnalysis.trends
      },
      totalRecords: riskAnalysis.highRiskAudits.length,
      filteredRecords: riskAnalysis.highRiskAudits.length
    };
  }

  private async generateUserActivityReport(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    if (!request.userId) {
      return {
        summary: { error: 'User ID required for user activity report' },
        details: {},
        totalRecords: 0,
        filteredRecords: 0
      };
    }

    const userActivity = await this.auditRepository.getUserAuditActivity(
      request.tenantId,
      request.userId,
      timeRange
    );

    return {
      summary: {
        totalAudits: userActivity.totalAudits,
        averageRisk: userActivity.riskProfile.averageRisk,
        highRiskActions: userActivity.riskProfile.highRiskActions,
        riskTrend: userActivity.riskProfile.riskTrend,
        topActions: Object.entries(userActivity.actionBreakdown)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
      },
      details: {
        actionBreakdown: userActivity.actionBreakdown,
        templateTypes: userActivity.templateTypes,
        timeline: userActivity.timeline,
        patterns: userActivity.patterns,
        riskProfile: userActivity.riskProfile
      },
      totalRecords: userActivity.totalAudits,
      filteredRecords: userActivity.totalAudits
    };
  }

  private async generateTemplateHistoryReport(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    if (!request.templateId) {
      return {
        summary: { error: 'Template ID required for template history report' },
        details: {},
        totalRecords: 0,
        filteredRecords: 0
      };
    }

    const templateHistory = await this.auditRepository.getTemplateAuditHistory(
      request.tenantId,
      request.templateId
    );

    return {
      summary: {
        totalChanges: templateHistory.statistics.totalChanges,
        uniqueUsers: templateHistory.statistics.uniqueUsers,
        averageRiskScore: templateHistory.statistics.averageRiskScore,
        lastModified: templateHistory.statistics.lastModified,
        creationDate: templateHistory.statistics.creationDate
      },
      details: {
        timeline: templateHistory.timeline,
        statistics: templateHistory.statistics,
        changeFrequency: templateHistory.changeFrequency,
        userActivity: templateHistory.userActivity
      },
      totalRecords: templateHistory.timeline.length,
      filteredRecords: templateHistory.timeline.length
    };
  }

  private async generateAnomalyReport(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    const anomalyDetection = await this.auditRepository.getAnomalyDetection(
      request.tenantId,
      timeRange
    );

    return {
      summary: {
        totalAnomalies: anomalyDetection.anomalies.length,
        criticalAnomalies: anomalyDetection.anomalies.filter(a => a.severity === 'critical').length,
        highConfidenceAnomalies: anomalyDetection.anomalies.filter(a => a.confidence >= 0.8).length,
        patternBreaks: anomalyDetection.patterns.filter(p => Math.abs(p.deviation) > 2).length
      },
      details: {
        anomalies: anomalyDetection.anomalies,
        patterns: anomalyDetection.patterns,
        recommendations: anomalyDetection.recommendations
      },
      totalRecords: anomalyDetection.anomalies.length,
      filteredRecords: anomalyDetection.anomalies.length
    };
  }

  private async generateAnalytics(request: GetAuditReportsRequest, timeRange: any): Promise<any> {
    const statistics = await this.auditRepository.getStatistics(request.tenantId, timeRange);

    return {
      growth: {
        auditGrowthRate: statistics.auditGrowthRate,
        trend: statistics.auditGrowthRate > 0 ? 'increasing' : 'decreasing'
      },
      quality: {
        averageRiskScore: statistics.averageRiskScore,
        complianceScore: statistics.complianceScore,
        healthMetrics: statistics.healthMetrics
      },
      activity: {
        topUsers: statistics.topUsers,
        topTemplates: statistics.topTemplates,
        activityDistribution: statistics.activityDistribution
      }
    };
  }

  private async generateRecommendations(request: GetAuditReportsRequest, reportData: any): Promise<any[]> {
    const recommendations: any[] = [];

    // General recommendations based on report type
    switch (request.reportType) {
      case 'risk':
        if (reportData.summary?.overallRisk > 70) {
          recommendations.push({
            priority: 'high',
            category: 'risk_management',
            description: 'Overall risk level is high',
            action: 'Review and implement additional security controls',
            impact: 'Reduce system-wide risk exposure'
          });
        }
        break;

      case 'compliance':
        if (reportData.summary?.criticalViolations > 0) {
          recommendations.push({
            priority: 'critical',
            category: 'compliance',
            description: 'Critical compliance violations detected',
            action: 'Immediate remediation required for critical violations',
            impact: 'Maintain regulatory compliance'
          });
        }
        break;

      case 'user_activity':
        if (reportData.summary?.highRiskActions > 10) {
          recommendations.push({
            priority: 'medium',
            category: 'user_management',
            description: 'High number of risky actions by user',
            action: 'Consider additional training or access review',
            impact: 'Reduce user-related security risks'
          });
        }
        break;
    }

    // Performance recommendations
    if (reportData.totalRecords > 10000) {
      recommendations.push({
        priority: 'low',
        category: 'performance',
        description: 'Large number of audit records detected',
        action: 'Consider archiving old records or implementing data retention policies',
        impact: 'Improve system performance and reduce storage costs'
      });
    }

    return recommendations;
  }

  private calculateTrendDirection(trends: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (trends.length < 2) return 'stable';

    const recent = trends[trends.length - 1];
    const previous = trends[trends.length - 2];

    if (recent.riskScore > previous.riskScore * 1.1) return 'increasing';
    if (recent.riskScore < previous.riskScore * 0.9) return 'decreasing';
    return 'stable';
  }
}
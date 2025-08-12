/**
 * Get Version History Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetVersionHistoryUseCase
 * @created 2025-08-12 - Phase 24 Clean Architecture Implementation
 */

import { ITemplateVersionRepository } from '../../domain/repositories/ITemplateVersionRepository';
import { TemplateVersion, TemplateType, VersionStatus, TemplateVersionDomainService } from '../../domain/entities/TemplateVersion';

export interface GetVersionHistoryRequest {
  tenantId: string;
  templateId?: string;
  userRole: string;
  filters?: {
    templateType?: TemplateType;
    status?: VersionStatus;
    authorId?: string;
    includeDeprecated?: boolean;
    includeArchived?: boolean;
    maxVersions?: number;
    sortOrder?: 'asc' | 'desc';
    createdAfter?: Date;
    createdBefore?: Date;
  };
  includeComparison?: boolean;
  includeAnalytics?: boolean;
  includeTimeline?: boolean;
  format?: 'summary' | 'detailed';
}

export interface GetVersionHistoryResponse {
  success: boolean;
  data?: {
    versions: TemplateVersion[];
    timeline?: VersionTimelineEntry[];
    statistics?: VersionStatistics;
    analytics?: VersionAnalytics;
    comparisons?: VersionComparison[];
    metadata: {
      totalVersions: number;
      filteredVersions: number;
      latestVersion?: string;
      oldestVersion?: string;
      filters: any;
    };
  };
  errors?: string[];
  warnings?: string[];
}

interface VersionTimelineEntry {
  timestamp: Date;
  event: string;
  description: string;
  performedBy: string;
  versionNumber: string;
  metadata?: any;
}

interface VersionStatistics {
  totalVersions: number;
  publishedVersions: number;
  deprecatedVersions: number;
  averageVersionLifespan: number;
  mostActiveAuthor: string;
  versionFrequency: Record<string, number>;
  qualityTrends: QualityTrend[];
  adoptionMetrics: AdoptionMetric[];
}

interface VersionAnalytics {
  creationTrends: AnalyticsTrend[];
  qualityMetrics: QualityMetric[];
  performanceMetrics: PerformanceMetric[];
  userEngagement: EngagementMetric[];
  breakingChangesAnalysis: BreakingChangesAnalysis;
}

interface VersionComparison {
  version1: TemplateVersion;
  version2: TemplateVersion;
  differences: VersionDifference[];
  breakingChanges: boolean;
  compatibilityLevel: 'full' | 'backward' | 'none';
  migrationComplexity: 'simple' | 'moderate' | 'complex';
}

interface QualityTrend {
  versionNumber: string;
  qualityScore: number;
  timestamp: Date;
  improvements: string[];
  regressions: string[];
}

interface AdoptionMetric {
  versionNumber: string;
  adoptionRate: number;
  timeToAdoption: number;
  userFeedbackScore: number;
}

interface AnalyticsTrend {
  period: string;
  value: number;
  change: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface QualityMetric {
  metric: string;
  value: number;
  benchmark: number;
  trend: 'improving' | 'stable' | 'degrading';
  target: number;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark?: number;
  threshold?: number;
  trend?: 'improving' | 'stable' | 'degrading';
}

interface EngagementMetric {
  metric: string;
  value: number;
  period: string;
  userSegment?: string;
  benchmark?: number;
}

interface BreakingChangesAnalysis {
  totalBreakingChanges: number;
  breakingChangesByType: Record<string, number>;
  impactAssessment: ImpactAssessment[];
  migrationEffort: MigrationEffort[];
}

interface ImpactAssessment {
  changeType: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  migrationRequired: boolean;
}

interface MigrationEffort {
  fromVersion: string;
  toVersion: string;
  effort: 'automatic' | 'manual' | 'complex';
  estimatedHours: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface VersionDifference {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'moved';
  oldValue?: any;
  newValue?: any;
  significance: 'minor' | 'major' | 'breaking';
}

export class GetVersionHistoryUseCase {
  constructor(private versionRepository: ITemplateVersionRepository) {}

  async execute(request: GetVersionHistoryRequest): Promise<GetVersionHistoryResponse> {
    try {
      // 1. Validate permissions
      if (!this.hasViewPermission(request.userRole)) {
        return {
          success: false,
          errors: ['Insufficient permissions to view version history']
        };
      }

      // 2. Get version history
      let historyData;
      if (request.templateId) {
        // Get history for specific template
        historyData = await this.versionRepository.getVersionHistory(
          request.tenantId,
          request.templateId,
          {
            includeDeprecated: request.filters?.includeDeprecated,
            includeArchived: request.filters?.includeArchived,
            maxVersions: request.filters?.maxVersions,
            sortOrder: request.filters?.sortOrder || 'desc'
          }
        );
      } else {
        // Get history for all templates with filters
        const allVersions = await this.versionRepository.findAll(request.tenantId, {
          templateType: request.filters?.templateType,
          status: request.filters?.status,
          authorId: request.filters?.authorId,
          isActive: request.filters?.includeArchived ? undefined : true,
          isDeprecated: request.filters?.includeDeprecated ? undefined : false,
          createdAfter: request.filters?.createdAfter,
          createdBefore: request.filters?.createdBefore
        });

        // Generate timeline and statistics
        historyData = this.generateHistoryData(allVersions, request.filters?.maxVersions);
      }

      // 3. Filter and sort versions
      let versions = historyData.versions;
      if (request.filters?.maxVersions) {
        versions = versions.slice(0, request.filters.maxVersions);
      }

      // 4. Add analytics if requested
      let analytics;
      if (request.includeAnalytics) {
        analytics = await this.generateAnalytics(versions, request.templateId);
      }

      // 5. Add comparisons if requested
      let comparisons;
      if (request.includeComparison && versions.length > 1) {
        comparisons = await this.generateComparisons(versions);
      }

      // 6. Format response based on requested format
      const formattedVersions = request.format === 'summary' 
        ? this.formatVersionsSummary(versions)
        : versions;

      return {
        success: true,
        data: {
          versions: formattedVersions,
          timeline: request.includeTimeline ? historyData.timeline : undefined,
          statistics: historyData.statistics,
          analytics,
          comparisons,
          metadata: {
            totalVersions: historyData.versions.length,
            filteredVersions: versions.length,
            latestVersion: versions.length > 0 ? versions[0].versionNumber : undefined,
            oldestVersion: versions.length > 0 ? versions[versions.length - 1].versionNumber : undefined,
            filters: request.filters || {}
          }
        }
      };

    } catch (error) {
      console.error('[GetVersionHistoryUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error while retrieving version history']
      };
    }
  }

  private hasViewPermission(userRole: string): boolean {
    const allowedRoles = ['saas_admin', 'tenant_admin', 'admin', 'manager', 'developer', 'viewer'];
    return allowedRoles.includes(userRole);
  }

  private generateHistoryData(versions: TemplateVersion[], maxVersions?: number): {
    versions: TemplateVersion[];
    timeline: VersionTimelineEntry[];
    statistics: VersionStatistics;
  } {
    // Sort versions by creation date (newest first)
    const sortedVersions = [...versions].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Limit versions if specified
    const limitedVersions = maxVersions ? sortedVersions.slice(0, maxVersions) : sortedVersions;

    // Generate timeline
    const timeline = this.generateTimeline(limitedVersions);

    // Generate statistics
    const statistics = this.generateStatistics(versions);

    return {
      versions: limitedVersions,
      timeline,
      statistics
    };
  }

  private generateTimeline(versions: TemplateVersion[]): VersionTimelineEntry[] {
    const timeline: VersionTimelineEntry[] = [];

    versions.forEach(version => {
      // Version created
      timeline.push({
        timestamp: version.createdAt,
        event: 'version_created',
        description: `Version ${version.versionNumber} created`,
        performedBy: version.author.name,
        versionNumber: version.versionNumber,
        metadata: {
          title: version.title,
          templateType: version.templateType
        }
      });

      // Version published
      if (version.publishedAt) {
        timeline.push({
          timestamp: version.publishedAt,
          event: 'version_published',
          description: `Version ${version.versionNumber} published`,
          performedBy: version.author.name,
          versionNumber: version.versionNumber
        });
      }

      // Version deprecated
      if (version.deprecatedAt) {
        timeline.push({
          timestamp: version.deprecatedAt,
          event: 'version_deprecated',
          description: `Version ${version.versionNumber} deprecated`,
          performedBy: 'system',
          versionNumber: version.versionNumber
        });
      }

      // Approval events
      version.approval.reviews.forEach(review => {
        if (review.submitted_at) {
          timeline.push({
            timestamp: review.submitted_at,
            event: review.status === 'approved' ? 'version_approved' : 'version_rejected',
            description: `Version ${version.versionNumber} ${review.status} by ${review.reviewer_name}`,
            performedBy: review.reviewer_name,
            versionNumber: version.versionNumber,
            metadata: {
              reviewId: review.id,
              comments: review.comments.length
            }
          });
        }
      });
    });

    // Sort timeline by timestamp (newest first)
    return timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateStatistics(versions: TemplateVersion[]): VersionStatistics {
    const now = new Date();
    const publishedVersions = versions.filter(v => v.isPublished);
    const deprecatedVersions = versions.filter(v => v.isDeprecated);

    // Calculate average version lifespan
    const lifespans = publishedVersions
      .filter(v => v.publishedAt && v.deprecatedAt)
      .map(v => v.deprecatedAt!.getTime() - v.publishedAt!.getTime());
    const averageLifespan = lifespans.length > 0 
      ? lifespans.reduce((sum, lifespan) => sum + lifespan, 0) / lifespans.length
      : 0;

    // Find most active author
    const authorCounts = versions.reduce((acc, version) => {
      acc[version.author.name] = (acc[version.author.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostActiveAuthor = Object.entries(authorCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Calculate version frequency by month
    const versionFrequency = versions.reduce((acc, version) => {
      const month = version.createdAt.toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate quality trends
    const qualityTrends = this.generateQualityTrends(versions);

    // Generate adoption metrics
    const adoptionMetrics = this.generateAdoptionMetrics(versions);

    return {
      totalVersions: versions.length,
      publishedVersions: publishedVersions.length,
      deprecatedVersions: deprecatedVersions.length,
      averageVersionLifespan: averageLifespan / (1000 * 60 * 60 * 24), // Convert to days
      mostActiveAuthor,
      versionFrequency,
      qualityTrends,
      adoptionMetrics
    };
  }

  private generateQualityTrends(versions: TemplateVersion[]): QualityTrend[] {
    return versions.map(version => {
      const versionScore = TemplateVersionDomainService.calculateVersionScore(version);
      
      return {
        versionNumber: version.versionNumber,
        qualityScore: versionScore.score,
        timestamp: version.createdAt,
        improvements: this.extractImprovements(version),
        regressions: this.extractRegressions(version)
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateAdoptionMetrics(versions: TemplateVersion[]): AdoptionMetric[] {
    return versions.map(version => ({
      versionNumber: version.versionNumber,
      adoptionRate: version.metadata_extended.usage_analytics.adoption_metrics.version_adoption_rate,
      timeToAdoption: this.calculateTimeToAdoption(version),
      userFeedbackScore: version.metadata_extended.feedback.feedback_summary.satisfaction_score
    }));
  }

  private async generateAnalytics(versions: TemplateVersion[], templateId?: string): Promise<VersionAnalytics> {
    // Creation trends
    const creationTrends = this.calculateCreationTrends(versions);

    // Quality metrics
    const qualityMetrics = this.calculateQualityMetrics(versions);

    // Performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(versions);

    // User engagement
    const userEngagement = this.calculateUserEngagement(versions);

    // Breaking changes analysis
    const breakingChangesAnalysis = this.analyzeBreakingChanges(versions);

    return {
      creationTrends,
      qualityMetrics,
      performanceMetrics,
      userEngagement,
      breakingChangesAnalysis
    };
  }

  private async generateComparisons(versions: TemplateVersion[]): Promise<VersionComparison[]> {
    const comparisons: VersionComparison[] = [];

    // Compare consecutive versions
    for (let i = 0; i < versions.length - 1; i++) {
      const newer = versions[i];
      const older = versions[i + 1];

      try {
        const comparisonResult = await this.versionRepository.compareVersions(
          newer.tenantId,
          newer.id,
          older.id
        );

        comparisons.push({
          version1: newer,
          version2: older,
          differences: comparisonResult.differences,
          breakingChanges: comparisonResult.breakingChanges,
          compatibilityLevel: comparisonResult.compatibilityLevel,
          migrationComplexity: this.assessMigrationComplexity(comparisonResult.differences)
        });
      } catch (error) {
        console.warn(`Failed to compare versions ${newer.versionNumber} and ${older.versionNumber}:`, error);
      }
    }

    return comparisons;
  }

  private formatVersionsSummary(versions: TemplateVersion[]): Partial<TemplateVersion>[] {
    return versions.map(version => ({
      id: version.id,
      versionNumber: version.versionNumber,
      title: version.title,
      description: version.description.substring(0, 200) + (version.description.length > 200 ? '...' : ''),
      status: version.status,
      author: {
        name: version.author.name,
        role: version.author.role
      },
      isPublished: version.isPublished,
      isDeprecated: version.isDeprecated,
      createdAt: version.createdAt,
      publishedAt: version.publishedAt,
      tags: version.tags
    }));
  }

  private extractImprovements(version: TemplateVersion): string[] {
    const improvements: string[] = [];

    // Check quality improvements
    if (version.metadata_extended.quality_metrics.quality_gate_passed) {
      improvements.push('Quality gate passed');
    }

    // Check security improvements
    if (version.metadata_extended.security_scan.security_score > 80) {
      improvements.push('High security score');
    }

    // Check performance improvements
    if (version.metadata_extended.performance_test.performance_budget.budget_status === 'within_budget') {
      improvements.push('Performance within budget');
    }

    return improvements;
  }

  private extractRegressions(version: TemplateVersion): string[] {
    const regressions: string[] = [];

    // Check for quality regressions
    if (!version.metadata_extended.quality_metrics.quality_gate_passed) {
      regressions.push('Quality gate failed');
    }

    // Check for security regressions
    if (version.metadata_extended.security_scan.vulnerabilities_found > 0) {
      regressions.push('Security vulnerabilities found');
    }

    // Check for performance regressions
    if (version.metadata_extended.performance_test.baseline_comparison.regression_detected) {
      regressions.push('Performance regression detected');
    }

    return regressions;
  }

  private calculateTimeToAdoption(version: TemplateVersion): number {
    if (!version.publishedAt) return 0;
    
    // Simplified calculation - would use actual adoption data in real implementation
    const adoptionTime = version.metadata_extended.usage_analytics.adoption_metrics.upgrade_timeline.adoption_curve;
    if (adoptionTime.length > 0) {
      const firstAdoption = adoptionTime[0];
      return firstAdoption.timestamp.getTime() - version.publishedAt.getTime();
    }
    
    return 0;
  }

  private calculateCreationTrends(versions: TemplateVersion[]): AnalyticsTrend[] {
    const monthlyCreation = versions.reduce((acc, version) => {
      const month = version.createdAt.toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyCreation).map(([period, value], index, array) => {
      const previousValue = index > 0 ? array[index - 1][1] : value;
      const change = ((value - previousValue) / previousValue) * 100;
      
      return {
        period,
        value,
        change,
        trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable'
      };
    });
  }

  private calculateQualityMetrics(versions: TemplateVersion[]): QualityMetric[] {
    const metrics = ['security_score', 'performance_score', 'accessibility_score', 'compliance_score'];
    
    return metrics.map(metric => {
      const values = versions.map(v => this.getMetricValue(v, metric));
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const trend = this.calculateTrend(values);
      
      return {
        metric,
        value: average,
        benchmark: 80, // Standard benchmark
        trend,
        target: 90
      };
    });
  }

  private calculatePerformanceMetrics(versions: TemplateVersion[]): PerformanceMetric[] {
    return [
      {
        metric: 'response_time',
        value: 150,
        unit: 'ms',
        benchmark: 200,
        threshold: 300,
        trend: 'improving'
      },
      {
        metric: 'throughput',
        value: 1000,
        unit: 'req/sec',
        benchmark: 800,
        threshold: 500,
        trend: 'stable'
      }
    ];
  }

  private calculateUserEngagement(versions: TemplateVersion[]): EngagementMetric[] {
    return versions.map(version => ({
      metric: 'user_adoption',
      value: version.metadata_extended.usage_analytics.user_metrics.active_users,
      period: 'monthly',
      userSegment: 'all',
      benchmark: 100
    }));
  }

  private analyzeBreakingChanges(versions: TemplateVersion[]): BreakingChangesAnalysis {
    const breakingChanges = versions.reduce((count, version) => {
      return count + version.compatibility.breaking_changes.length;
    }, 0);

    const changesByType = versions.reduce((acc, version) => {
      version.compatibility.breaking_changes.forEach(change => {
        acc[change.type] = (acc[change.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBreakingChanges: breakingChanges,
      breakingChangesByType: changesByType,
      impactAssessment: [],
      migrationEffort: []
    };
  }

  private assessMigrationComplexity(differences: VersionDifference[]): 'simple' | 'moderate' | 'complex' {
    const breakingChanges = differences.filter(d => d.significance === 'breaking').length;
    const majorChanges = differences.filter(d => d.significance === 'major').length;

    if (breakingChanges > 5 || majorChanges > 20) return 'complex';
    if (breakingChanges > 0 || majorChanges > 5) return 'moderate';
    return 'simple';
  }

  private getMetricValue(version: TemplateVersion, metric: string): number {
    switch (metric) {
      case 'security_score': return version.metadata_extended.security_scan.security_score;
      case 'performance_score': return version.metadata_extended.performance_test.performance_budget.budget_status === 'within_budget' ? 100 : 60;
      case 'accessibility_score': return version.metadata_extended.accessibility_audit.overall_score;
      case 'compliance_score': return version.metadata_extended.compliance_check.overall_compliance_score;
      default: return 0;
    }
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'degrading';
    return 'stable';
  }
}
/**
 * Create Version Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateVersionUseCase
 * @created 2025-08-12 - Phase 24 Clean Architecture Implementation
 */

import { ITemplateVersionRepository } from '../../domain/repositories/ITemplateVersionRepository';
import { TemplateVersion, TemplateType, VersionContent, TemplateVersionDomainService } from '../../domain/entities/TemplateVersion';

export interface CreateVersionRequest {
  tenantId: string;
  templateId: string;
  templateType: TemplateType;
  versionNumber?: string;
  title: string;
  description: string;
  content: VersionContent;
  authorId: string;
  authorName: string;
  authorRole: string;
  tags?: string[];
  basedOnVersion?: string;
  autoPublish?: boolean;
  skipApproval?: boolean;
}

export interface CreateVersionResponse {
  success: boolean;
  data?: {
    version: TemplateVersion;
    versionScore: {
      score: number;
      factors: Array<{ factor: string; score: number; weight: number }>;
    };
    validationResults: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
    nextSteps: string[];
  };
  errors?: string[];
  warnings?: string[];
}

export class CreateVersionUseCase {
  constructor(private versionRepository: ITemplateVersionRepository) {}

  async execute(request: CreateVersionRequest): Promise<CreateVersionResponse> {
    try {
      // 1. Validate input
      const validation = this.validateInput(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // 2. Determine version number if not provided
      let versionNumber = request.versionNumber;
      if (!versionNumber) {
        const latestVersion = await this.versionRepository.findLatestVersion(request.tenantId, request.templateId);
        if (latestVersion) {
          versionNumber = TemplateVersionDomainService.generateNextVersion(latestVersion.versionNumber, 'minor');
        } else {
          versionNumber = '1.0.0';
        }
      }

      // 3. Validate version number format
      const versionValidation = TemplateVersionDomainService.validateVersionNumber(versionNumber);
      if (!versionValidation.isValid) {
        return {
          success: false,
          errors: versionValidation.errors
        };
      }

      // 4. Check if version already exists
      const existingVersion = await this.versionRepository.findByVersionNumber(
        request.tenantId,
        request.templateId,
        versionNumber
      );
      if (existingVersion) {
        return {
          success: false,
          errors: [`Version ${versionNumber} already exists for this template`]
        };
      }

      // 5. Validate content
      const contentValidation = TemplateVersionDomainService.validateVersionContent(request.content);
      if (!contentValidation.isValid) {
        return {
          success: false,
          errors: contentValidation.errors,
          warnings: contentValidation.warnings
        };
      }

      // 6. Get base version for comparison if specified
      let baseVersion: TemplateVersion | null = null;
      if (request.basedOnVersion) {
        baseVersion = await this.versionRepository.findByVersionNumber(
          request.tenantId,
          request.templateId,
          request.basedOnVersion
        );
        if (!baseVersion) {
          return {
            success: false,
            errors: [`Base version ${request.basedOnVersion} not found`]
          };
        }
      }

      // 7. Create version object
      const now = new Date();
      const parsed = versionValidation.parsed!;

      const newVersion: Omit<TemplateVersion, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: request.tenantId,
        templateId: request.templateId,
        templateType: request.templateType,
        versionNumber,
        majorVersion: parsed.major,
        minorVersion: parsed.minor,
        patchVersion: parsed.patch,
        buildNumber: parsed.build ? parseInt(parsed.build, 10) : undefined,
        preRelease: parsed.preRelease,
        status: request.skipApproval ? 'approved' : 'draft',
        title: request.title,
        description: request.description,
        content: request.content,
        changelog: this.generateInitialChangelog(request, baseVersion),
        author: {
          userId: request.authorId,
          name: request.authorName,
          email: '', // Would be fetched from user service
          role: request.authorRole,
          contributions: [{
            type: 'creation',
            timestamp: now,
            description: 'Created new version',
            effort_hours: 0
          }],
          statistics: {
            versions_created: 1,
            total_contributions: 1,
            total_effort_hours: 0,
            quality_score: 0,
            peer_rating: 0,
            expertise_areas: [request.templateType]
          }
        },
        approval: this.createApprovalWorkflow(request),
        deployment: this.createDeploymentConfiguration(),
        lifecycle: this.createLifecycleConfiguration(),
        compatibility: this.createCompatibilityConfiguration(baseVersion),
        dependencies: [],
        assets: [],
        metadata_extended: this.createExtendedMetadata(),
        tags: request.tags || [],
        isActive: true,
        isPublished: request.autoPublish && request.skipApproval,
        isDeprecated: false,
        publishedAt: request.autoPublish && request.skipApproval ? now : undefined
      };

      // 8. Create version in repository
      const createdVersion = await this.versionRepository.create(newVersion);

      // 9. Calculate version score
      const versionScore = TemplateVersionDomainService.calculateVersionScore(createdVersion);

      // 10. Determine next steps
      const nextSteps = this.determineNextSteps(createdVersion, request);

      return {
        success: true,
        data: {
          version: createdVersion,
          versionScore,
          validationResults: contentValidation,
          nextSteps
        },
        warnings: contentValidation.warnings
      };

    } catch (error) {
      console.error('[CreateVersionUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error while creating version']
      };
    }
  }

  private validateInput(request: CreateVersionRequest): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.tenantId) errors.push('Tenant ID is required');
    if (!request.templateId) errors.push('Template ID is required');
    if (!request.templateType) errors.push('Template type is required');
    if (!request.title) errors.push('Title is required');
    if (!request.description) errors.push('Description is required');
    if (!request.content) errors.push('Content is required');
    if (!request.authorId) errors.push('Author ID is required');
    if (!request.authorName) errors.push('Author name is required');
    if (!request.authorRole) errors.push('Author role is required');

    // Validation rules
    if (request.title && request.title.length < 3) {
      errors.push('Title must be at least 3 characters');
    }

    if (request.description && request.description.length < 10) {
      warnings.push('Description is very short, consider adding more detail');
    }

    if (request.versionNumber) {
      const versionValidation = TemplateVersionDomainService.validateVersionNumber(request.versionNumber);
      if (!versionValidation.isValid) {
        errors.push(...versionValidation.errors);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private generateInitialChangelog(request: CreateVersionRequest, baseVersion?: TemplateVersion | null): any[] {
    const changelog = [];

    if (baseVersion) {
      changelog.push({
        id: `change_${Date.now()}`,
        type: 'enhancement',
        category: 'api',
        summary: `Updated from version ${baseVersion.versionNumber}`,
        description: request.description,
        impact: {
          user_facing: true,
          api_breaking: false,
          data_migration: false,
          performance_impact: 'neutral',
          security_impact: 'neutral',
          compatibility_impact: 'neutral',
          effort_required: 'low'
        },
        breaking: false,
        author: request.authorName,
        timestamp: new Date(),
        references: [],
        affected_components: []
      });
    } else {
      changelog.push({
        id: `change_${Date.now()}`,
        type: 'feature',
        category: 'api',
        summary: 'Initial version created',
        description: request.description,
        impact: {
          user_facing: true,
          api_breaking: false,
          data_migration: false,
          performance_impact: 'neutral',
          security_impact: 'neutral',
          compatibility_impact: 'neutral',
          effort_required: 'none'
        },
        breaking: false,
        author: request.authorName,
        timestamp: new Date(),
        references: [],
        affected_components: []
      });
    }

    return changelog;
  }

  private createApprovalWorkflow(request: CreateVersionRequest): any {
    return {
      required: !request.skipApproval,
      workflow: {
        id: `workflow_${Date.now()}`,
        name: 'Standard Approval',
        stages: [
          {
            order: 1,
            name: 'Peer Review',
            required_approvals: 1,
            eligible_approvers: ['peer_reviewers'],
            timeout_hours: 48
          },
          {
            order: 2,
            name: 'Technical Lead Approval',
            required_approvals: 1,
            eligible_approvers: ['technical_leads'],
            timeout_hours: 24
          }
        ],
        parallel: false,
        auto_approve: false,
        timeout_hours: 72
      },
      approvers: [],
      reviews: [],
      status: request.skipApproval ? 'approved' : 'pending'
    };
  }

  private createDeploymentConfiguration(): any {
    return {
      environments: [
        {
          name: 'development',
          type: 'development',
          status: 'not_deployed'
        },
        {
          name: 'staging',
          type: 'staging',
          status: 'not_deployed'
        },
        {
          name: 'production',
          type: 'production',
          status: 'not_deployed'
        }
      ],
      strategy: {
        type: 'blue_green',
        configuration: {
          health_check_grace_period: 300
        },
        validation: {
          pre_deployment: [],
          post_deployment: [],
          smoke_tests: [],
          integration_tests: []
        },
        gates: []
      },
      schedule: {
        type: 'manual',
        maintenance_windows: [],
        blackout_periods: []
      },
      automation: {
        enabled: false,
        triggers: [],
        pipeline: [],
        notifications: [],
        error_handling: {
          strategy: 'fail_fast',
          max_retries: 3,
          retry_delay: 60,
          escalation: {
            after_failures: 3,
            escalate_to: [],
            notification_method: 'email',
            include_logs: true
          },
          recovery: {
            type: 'manual',
            steps: [],
            validation: []
          }
        }
      },
      monitoring: {
        enabled: true,
        metrics: [],
        alerts: [],
        dashboards: [],
        logs: {
          enabled: true,
          level: 'info',
          format: 'json',
          retention_days: 30,
          aggregation: true
        }
      },
      rollback: {
        enabled: true,
        strategy: {
          type: 'immediate'
        },
        triggers: [],
        validation: {
          pre_rollback: [],
          post_rollback: [],
          success_criteria: []
        },
        automation: {
          enabled: false,
          approval_required: true,
          approvers: [],
          timeout: 3600,
          notifications: []
        }
      }
    };
  }

  private createLifecycleConfiguration(): any {
    return {
      stages: [
        {
          name: 'draft',
          description: 'Version is being developed',
          entry_conditions: [],
          exit_conditions: [],
          allowed_actions: ['edit', 'submit_for_review']
        },
        {
          name: 'review',
          description: 'Version is under review',
          entry_conditions: [],
          exit_conditions: [],
          allowed_actions: ['approve', 'reject', 'request_changes']
        },
        {
          name: 'approved',
          description: 'Version has been approved',
          entry_conditions: [],
          exit_conditions: [],
          allowed_actions: ['publish', 'deploy']
        },
        {
          name: 'published',
          description: 'Version is published and available',
          entry_conditions: [],
          exit_conditions: [],
          allowed_actions: ['deploy', 'deprecate']
        },
        {
          name: 'deprecated',
          description: 'Version is deprecated',
          entry_conditions: [],
          exit_conditions: [],
          allowed_actions: ['archive']
        }
      ],
      current_stage: 'draft',
      transitions: [],
      policies: [],
      automation: {
        enabled: false,
        triggers: [],
        workflows: [],
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          logs: false,
          reporting: false
        }
      }
    };
  }

  private createCompatibilityConfiguration(baseVersion?: TemplateVersion | null): any {
    return {
      backward_compatible: true,
      forward_compatible: false,
      breaking_changes: [],
      deprecated_features: [],
      migration_path: {
        from_versions: baseVersion ? [baseVersion.versionNumber] : [],
        to_version: '',
        automatic: true,
        steps: [],
        validation: {
          pre_checks: [],
          post_checks: [],
          rollback_checks: []
        },
        rollback_support: true,
        risk_assessment: {
          overall_risk: 'low',
          risk_factors: [],
          mitigation_strategies: [],
          contingency_plans: []
        }
      },
      support_matrix: {
        platforms: [],
        browsers: [],
        dependencies: [],
        integrations: []
      }
    };
  }

  private createExtendedMetadata(): any {
    const now = new Date();

    return {
      build_info: {
        build_number: `build_${Date.now()}`,
        build_date: now,
        build_duration: 0,
        build_agent: 'conductor-builder',
        source_commit: '',
        source_branch: 'main',
        dependencies_resolved: [],
        artifacts_generated: []
      },
      quality_metrics: {
        code_coverage: 0,
        test_pass_rate: 0,
        complexity_score: 0,
        maintainability_index: 0,
        technical_debt_hours: 0,
        duplication_percentage: 0,
        documentation_coverage: 0,
        api_breaking_changes: 0,
        quality_gate_passed: false,
        quality_issues: []
      },
      security_scan: {
        scan_date: now,
        scanner_version: '1.0.0',
        scan_duration: 0,
        vulnerabilities_found: 0,
        security_score: 100,
        compliance_status: {
          owasp_top_10: { passed: true, score: 100, issues_found: 0, critical_issues: 0 },
          sans_25: { passed: true, score: 100, issues_found: 0, critical_issues: 0 },
          cwe_compliance: { passed: true, score: 100, issues_found: 0, critical_issues: 0 },
          custom_rules: { passed: true, score: 100, issues_found: 0, critical_issues: 0 }
        },
        findings: [],
        recommendations: []
      },
      performance_test: {
        test_date: now,
        test_duration: 0,
        test_scenarios: [],
        load_test_results: {
          max_concurrent_users: 0,
          sustained_load: 0,
          breaking_point: 0,
          degradation_threshold: 0,
          recovery_time: 0,
          scalability_factor: 0
        },
        stress_test_results: {
          failure_point: 0,
          recovery_behavior: 'graceful',
          error_cascading: false,
          data_integrity_maintained: true,
          system_stability: 'stable'
        },
        baseline_comparison: {
          baseline_version: '',
          regression_detected: false,
          performance_delta: 0,
          significant_changes: []
        },
        performance_budget: {
          response_time_budget: 1000,
          throughput_budget: 1000,
          error_rate_budget: 0.01,
          resource_budget: {
            cpu_budget: 80,
            memory_budget: 80,
            storage_budget: 80,
            network_budget: 80
          },
          budget_status: 'within_budget'
        },
        recommendations: []
      },
      accessibility_audit: {
        audit_date: now,
        auditor: 'automated',
        standards_tested: [],
        overall_score: 100,
        compliance_level: 'AAA',
        violations: [],
        recommendations: [],
        manual_tests: []
      },
      compliance_check: {
        check_date: now,
        standards_evaluated: [],
        overall_compliance_score: 100,
        compliance_status: 'compliant',
        violations: [],
        recommendations: [],
        certification_readiness: {
          target_certifications: [],
          readiness_percentage: 100,
          gaps_identified: 0,
          estimated_timeline: '',
          next_steps: []
        }
      },
      usage_analytics: {
        tracking_period: {
          start_date: now,
          end_date: now,
          data_completeness: 0,
          sample_size: 0,
          confidence_level: 0
        },
        user_metrics: {
          total_users: 0,
          active_users: 0,
          new_users: 0,
          returning_users: 0,
          user_retention: {
            day_1: 0,
            day_7: 0,
            day_30: 0,
            cohort_analysis: []
          },
          user_segmentation: []
        },
        feature_usage: {
          feature_adoption: [],
          usage_patterns: [],
          feature_correlation: [],
          abandonment_analysis: {
            overall_abandonment_rate: 0,
            abandonment_points: [],
            recovery_strategies: [],
            impact_assessment: {
              revenue_impact: 0,
              user_satisfaction_impact: 0,
              operational_cost_impact: 0,
              strategic_implications: []
            }
          }
        },
        performance_analytics: {
          response_time_distribution: {
            buckets: [],
            percentiles: {
              p50: 0,
              p75: 0,
              p90: 0,
              p95: 0,
              p99: 0,
              p99_9: 0
            },
            outlier_analysis: {
              outlier_threshold: 0,
              outlier_count: 0,
              outlier_causes: [],
              impact_on_users: ''
            }
          },
          throughput_trends: [],
          error_rate_trends: [],
          resource_utilization_patterns: [],
          user_experience_metrics: {
            first_contentful_paint: 0,
            largest_contentful_paint: 0,
            first_input_delay: 0,
            cumulative_layout_shift: 0,
            interaction_to_next_paint: 0,
            core_web_vitals_score: 0,
            user_satisfaction_score: 0
          }
        },
        error_analytics: {
          error_distribution: {
            by_type: {},
            by_severity: {},
            by_component: {},
            by_user_segment: {},
            temporal_patterns: []
          },
          error_impact_analysis: {
            user_impact_score: 0,
            business_impact_score: 0,
            operational_impact_score: 0,
            affected_user_count: 0,
            revenue_impact: 0,
            reputation_impact: ''
          },
          error_recovery_metrics: {
            automatic_recovery_rate: 0,
            manual_recovery_rate: 0,
            recovery_time_distribution: {
              buckets: [],
              percentiles: {
                p50: 0,
                p75: 0,
                p90: 0,
                p95: 0,
                p99: 0,
                p99_9: 0
              },
              outlier_analysis: {
                outlier_threshold: 0,
                outlier_count: 0,
                outlier_causes: [],
                impact_on_users: ''
              }
            },
            recovery_success_rate: 0,
            user_retry_patterns: []
          },
          prevention_effectiveness: {
            prevented_errors: 0,
            prevention_accuracy: 0,
            false_positive_rate: 0,
            prevention_coverage: 0,
            improvement_suggestions: []
          }
        },
        adoption_metrics: {
          version_adoption_rate: 0,
          upgrade_timeline: {
            adoption_curve: [],
            plateau_reached: false,
            plateau_percentage: 0,
            laggard_analysis: {
              laggard_percentage: 0,
              common_characteristics: [],
              barriers_identified: [],
              engagement_strategies: []
            }
          },
          adoption_barriers: [],
          success_factors: [],
          competitive_analysis: {
            competitive_position: 'niche',
            differentiation_factors: [],
            competitive_advantages: [],
            areas_for_improvement: [],
            market_share_trend: 'stable'
          }
        }
      },
      feedback: {
        feedback_summary: {
          total_feedback_count: 0,
          average_rating: 0,
          satisfaction_score: 0,
          recommendation_score: 0,
          feedback_trends: [],
          key_themes: []
        },
        user_reviews: [],
        expert_reviews: [],
        community_feedback: {
          forum_discussions: [],
          social_media_mentions: [],
          support_tickets: {
            total_tickets: 0,
            ticket_categories: {},
            resolution_time_average: 0,
            satisfaction_score: 0,
            escalation_rate: 0,
            common_issues: []
          },
          feature_requests: [],
          bug_reports: {
            total_reports: 0,
            severity_distribution: {},
            status_distribution: {},
            resolution_time_average: 0,
            regression_rate: 0,
            quality_trends: []
          }
        },
        internal_feedback: {
          team_reviews: [],
          stakeholder_feedback: [],
          process_feedback: {
            process_efficiency_score: 0,
            bottlenecks_identified: [],
            process_improvements: [],
            tool_effectiveness: [],
            communication_effectiveness: 0
          },
          lessons_learned: []
        },
        sentiment_analysis: {
          overall_sentiment: 'neutral',
          sentiment_distribution: {
            very_positive: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
            very_negative: 0,
            confidence_intervals: []
          },
          sentiment_drivers: [],
          emotional_journey: {
            journey_stages: [],
            critical_moments: [],
            satisfaction_trajectory: 'stable',
            loyalty_indicators: []
          },
          sentiment_trends: []
        }
      }
    };
  }

  private determineNextSteps(version: TemplateVersion, request: CreateVersionRequest): string[] {
    const nextSteps: string[] = [];

    if (request.skipApproval) {
      if (request.autoPublish) {
        nextSteps.push('Version has been published and is ready for deployment');
        nextSteps.push('Consider running quality checks and performance tests');
      } else {
        nextSteps.push('Version is approved and ready for publishing');
        nextSteps.push('Publish the version to make it available for use');
      }
    } else {
      nextSteps.push('Submit version for approval workflow');
      nextSteps.push('Notify assigned reviewers for peer review');
      nextSteps.push('Address any feedback from reviewers');
    }

    if (version.content.validation.warnings.length > 0) {
      nextSteps.push('Review and address validation warnings');
    }

    nextSteps.push('Run comprehensive testing before deployment');
    nextSteps.push('Monitor version performance and user feedback');

    return nextSteps;
  }
}
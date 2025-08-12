/**
 * Template Version Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ITemplateVersionRepository
 * @created 2025-08-12 - Phase 24 Clean Architecture Implementation
 */

import { TemplateVersion, TemplateType, VersionStatus, ChangelogEntry, MigrationGuide } from '../entities/TemplateVersion';

export interface ITemplateVersionRepository {
  // Basic CRUD Operations
  create(version: Omit<TemplateVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateVersion>;
  findById(id: string, tenantId: string): Promise<TemplateVersion | null>;
  update(id: string, tenantId: string, updates: Partial<TemplateVersion>): Promise<TemplateVersion | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Version Query Operations
  findAll(tenantId: string, filters?: {
    templateId?: string;
    templateType?: TemplateType;
    status?: VersionStatus;
    authorId?: string;
    majorVersion?: number;
    minorVersion?: number;
    isActive?: boolean;
    isPublished?: boolean;
    isDeprecated?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<TemplateVersion[]>;

  findByTemplate(tenantId: string, templateId: string, filters?: {
    status?: VersionStatus;
    includeDeprecated?: boolean;
    limit?: number;
  }): Promise<TemplateVersion[]>;

  findByTemplateType(tenantId: string, templateType: TemplateType, filters?: {
    status?: VersionStatus;
    limit?: number;
  }): Promise<TemplateVersion[]>;

  findByAuthor(tenantId: string, authorId: string, filters?: {
    templateType?: TemplateType;
    status?: VersionStatus;
    limit?: number;
  }): Promise<TemplateVersion[]>;

  findByVersionNumber(tenantId: string, templateId: string, versionNumber: string): Promise<TemplateVersion | null>;

  findLatestVersion(tenantId: string, templateId: string): Promise<TemplateVersion | null>;

  findPublishedVersions(tenantId: string, templateId?: string): Promise<TemplateVersion[]>;

  findActiveVersions(tenantId: string, templateId?: string): Promise<TemplateVersion[]>;

  findVersionsInRange(tenantId: string, templateId: string, fromVersion: string, toVersion: string): Promise<TemplateVersion[]>;

  // Version Management
  publishVersion(tenantId: string, versionId: string, publishedBy: string): Promise<{
    success: boolean;
    version?: TemplateVersion;
    errors?: string[];
  }>;

  deprecateVersion(tenantId: string, versionId: string, reason: string, deprecatedBy: string): Promise<{
    success: boolean;
    version?: TemplateVersion;
    supersededBy?: string;
  }>;

  archiveVersion(tenantId: string, versionId: string, archivedBy: string): Promise<boolean>;

  restoreVersion(tenantId: string, versionId: string, restoredBy: string): Promise<{
    success: boolean;
    version?: TemplateVersion;
    conflicts?: string[];
  }>;

  cloneVersion(tenantId: string, sourceVersionId: string, newVersionNumber: string, clonedBy: string): Promise<{
    success: boolean;
    newVersion?: TemplateVersion;
    sourceVersion?: TemplateVersion;
  }>;

  // Comparison and Analysis
  compareVersions(tenantId: string, version1Id: string, version2Id: string): Promise<{
    version1: TemplateVersion;
    version2: TemplateVersion;
    differences: VersionDifference[];
    breakingChanges: boolean;
    compatibilityLevel: 'full' | 'backward' | 'none';
  }>;

  getVersionHistory(tenantId: string, templateId: string, options?: {
    includeDeprecated?: boolean;
    includeArchived?: boolean;
    maxVersions?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    versions: TemplateVersion[];
    timeline: VersionTimelineEntry[];
    statistics: VersionStatistics;
  }>;

  getVersionDiff(tenantId: string, version1Id: string, version2Id: string): Promise<{
    added: VersionChange[];
    modified: VersionChange[];
    removed: VersionChange[];
    moved: VersionChange[];
    summary: DiffSummary;
  }>;

  // Migration Management
  createMigrationPlan(tenantId: string, fromVersionId: string, toVersionId: string): Promise<MigrationGuide>;

  executeMigration(tenantId: string, migrationId: string, options?: {
    dryRun?: boolean;
    backupFirst?: boolean;
    validateAfter?: boolean;
  }): Promise<{
    success: boolean;
    migrationLog: MigrationLogEntry[];
    rollbackPlan?: MigrationGuide;
    validationResults?: ValidationResult[];
  }>;

  rollbackMigration(tenantId: string, migrationId: string): Promise<{
    success: boolean;
    rollbackLog: MigrationLogEntry[];
    restoredVersion?: TemplateVersion;
  }>;

  getMigrationStatus(tenantId: string, migrationId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
    progress: number;
    currentStep?: string;
    errors?: string[];
    estimatedTimeRemaining?: number;
  }>;

  // Dependency Management
  analyzeDependencies(tenantId: string, versionId: string): Promise<{
    dependencies: VersionDependencyInfo[];
    dependents: VersionDependencyInfo[];
    conflictingDependencies: DependencyConflict[];
    resolutionSuggestions: DependencyResolution[];
  }>;

  updateDependencies(tenantId: string, versionId: string, dependencies: {
    add?: string[];
    remove?: string[];
    update?: Array<{ dependencyId: string; newVersion: string }>;
  }): Promise<{
    success: boolean;
    updatedDependencies: VersionDependencyInfo[];
    conflicts?: DependencyConflict[];
  }>;

  validateDependencies(tenantId: string, versionId: string): Promise<{
    valid: boolean;
    missingDependencies: string[];
    versionConflicts: VersionConflict[];
    circularDependencies: CircularDependency[];
    recommendations: string[];
  }>;

  // Approval Workflow
  submitForApproval(tenantId: string, versionId: string, submittedBy: string): Promise<{
    success: boolean;
    approvalId: string;
    requiredApprovers: string[];
    estimatedApprovalTime: number;
  }>;

  approveVersion(tenantId: string, versionId: string, approvedBy: string, comments?: string): Promise<{
    success: boolean;
    approval: ApprovalRecord;
    allApprovalsReceived: boolean;
    nextSteps?: string[];
  }>;

  rejectVersion(tenantId: string, versionId: string, rejectedBy: string, reason: string, comments?: string): Promise<{
    success: boolean;
    rejection: RejectionRecord;
    requiredChanges: string[];
    resubmissionAllowed: boolean;
  }>;

  getApprovalStatus(tenantId: string, versionId: string): Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    approvals: ApprovalRecord[];
    rejections: RejectionRecord[];
    pendingApprovers: string[];
    overallProgress: number;
  }>;

  // Search and Discovery
  searchVersions(tenantId: string, query: string, filters?: {
    templateType?: TemplateType;
    status?: VersionStatus;
    authorId?: string;
    tags?: string[];
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<{
    versions: TemplateVersion[];
    totalCount: number;
    facets: SearchFacet[];
  }>;

  findSimilarVersions(tenantId: string, versionId: string, similarity?: {
    threshold?: number;
    compareFields?: string[];
    maxResults?: number;
  }): Promise<{
    similarVersions: SimilarVersion[];
    similarityMetrics: SimilarityMetric[];
  }>;

  getVersionRecommendations(tenantId: string, templateId: string, context?: {
    userRole?: string;
    usageContext?: string;
    performanceRequirements?: string[];
  }): Promise<{
    recommendations: VersionRecommendation[];
    reasoning: RecommendationReasoning[];
  }>;

  // Analytics and Reporting
  getVersionAnalytics(tenantId: string, templateId?: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    creationTrends: AnalyticsTrend[];
    adoptionMetrics: AdoptionMetric[];
    qualityMetrics: QualityMetric[];
    performanceMetrics: PerformanceMetric[];
    userEngagement: EngagementMetric[];
  }>;

  getVersionMetrics(tenantId: string, versionId: string): Promise<{
    usageStatistics: UsageStatistic[];
    performanceMetrics: PerformanceMetric[];
    errorMetrics: ErrorMetric[];
    feedbackSummary: FeedbackSummary;
    adoptionRate: number;
  }>;

  generateVersionReport(tenantId: string, reportType: 'summary' | 'detailed' | 'comparison' | 'trend', options: {
    templateId?: string;
    versionIds?: string[];
    timeRange?: { startDate: Date; endDate: Date };
    includeMetrics?: boolean;
    format?: 'json' | 'pdf' | 'csv';
  }): Promise<{
    reportId: string;
    reportData: any;
    generatedAt: Date;
    downloadUrl?: string;
  }>;

  // Quality Assurance
  runQualityChecks(tenantId: string, versionId: string, checks?: {
    includeSecurityScan?: boolean;
    includePerformanceTest?: boolean;
    includeAccessibilityAudit?: boolean;
    includeComplianceCheck?: boolean;
  }): Promise<{
    overallScore: number;
    checkResults: QualityCheckResult[];
    recommendations: QualityRecommendation[];
    passedGates: string[];
    failedGates: string[];
  }>;

  getQualityScore(tenantId: string, versionId: string): Promise<{
    overallScore: number;
    categoryScores: Record<string, number>;
    trendData: QualityTrend[];
    benchmarkComparison: BenchmarkComparison;
  }>;

  updateQualityMetrics(tenantId: string, versionId: string, metrics: {
    securityScan?: any;
    performanceTest?: any;
    accessibilityAudit?: any;
    complianceCheck?: any;
  }): Promise<boolean>;

  // Asset Management
  uploadAsset(tenantId: string, versionId: string, asset: {
    name: string;
    type: string;
    content: Buffer;
    metadata?: any;
  }): Promise<{
    assetId: string;
    downloadUrl: string;
    metadata: AssetMetadata;
  }>;

  getAssets(tenantId: string, versionId: string, filters?: {
    type?: string;
    includeMetadata?: boolean;
  }): Promise<{
    assets: VersionAsset[];
    totalSize: number;
    assetTypes: string[];
  }>;

  deleteAsset(tenantId: string, versionId: string, assetId: string): Promise<boolean>;

  // Changelog Management
  addChangelogEntry(tenantId: string, versionId: string, entry: Omit<ChangelogEntry, 'id' | 'timestamp'>): Promise<ChangelogEntry>;

  updateChangelogEntry(tenantId: string, versionId: string, entryId: string, updates: Partial<ChangelogEntry>): Promise<ChangelogEntry | null>;

  removeChangelogEntry(tenantId: string, versionId: string, entryId: string): Promise<boolean>;

  getChangelog(tenantId: string, templateId: string, options?: {
    fromVersion?: string;
    toVersion?: string;
    includeBreakingChanges?: boolean;
    groupByType?: boolean;
    format?: 'detailed' | 'summary';
  }): Promise<{
    entries: ChangelogEntry[];
    summary: ChangelogSummary;
    breakingChanges: ChangelogEntry[];
  }>;

  generateChangelog(tenantId: string, fromVersionId: string, toVersionId: string): Promise<{
    changelog: ChangelogEntry[];
    autoGenerated: boolean;
    suggestions: ChangelogSuggestion[];
  }>;

  // Backup and Recovery
  createBackup(tenantId: string, versionId: string, backupType: 'full' | 'incremental'): Promise<{
    backupId: string;
    backupSize: number;
    backupLocation: string;
    expiresAt: Date;
  }>;

  restoreFromBackup(tenantId: string, backupId: string, options?: {
    restoreAsNewVersion?: boolean;
    preserveMetadata?: boolean;
  }): Promise<{
    success: boolean;
    restoredVersion?: TemplateVersion;
    restoredAsNewVersion?: boolean;
  }>;

  listBackups(tenantId: string, versionId?: string): Promise<{
    backups: VersionBackup[];
    totalSize: number;
    oldestBackup: Date;
    newestBackup: Date;
  }>;

  deleteBackup(tenantId: string, backupId: string): Promise<boolean>;

  // Performance Operations
  optimizeVersion(tenantId: string, versionId: string, optimizations?: {
    compressAssets?: boolean;
    minifyScripts?: boolean;
    optimizeImages?: boolean;
    removeUnusedCode?: boolean;
  }): Promise<{
    success: boolean;
    optimizedVersion?: TemplateVersion;
    improvements: OptimizationResult[];
    sizeReduction: number;
  }>;

  analyzePerformance(tenantId: string, versionId: string): Promise<{
    performanceScore: number;
    bottlenecks: PerformanceBottleneck[];
    recommendations: PerformanceRecommendation[];
    comparisonWithBaseline?: PerformanceComparison;
  }>;

  // Health and Monitoring
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheckResult[];
    metrics: {
      responseTime: number;
      throughput: number;
      errorRate: number;
      storageUsage: number;
    };
    recommendations: string[];
  }>;

  getSystemMetrics(): Promise<{
    totalVersions: number;
    versionsPerTemplate: Record<string, number>;
    storageUsage: number;
    averageVersionSize: number;
    popularTemplateTypes: Array<{ type: string; count: number }>;
    versionStatusDistribution: Record<VersionStatus, number>;
  }>;
}

// Supporting Interfaces
export interface VersionDifference {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'moved';
  oldValue?: any;
  newValue?: any;
  significance: 'minor' | 'major' | 'breaking';
}

export interface VersionTimelineEntry {
  timestamp: Date;
  event: string;
  description: string;
  performedBy: string;
  versionNumber: string;
  metadata?: any;
}

export interface VersionStatistics {
  totalVersions: number;
  publishedVersions: number;
  deprecatedVersions: number;
  averageVersionLifespan: number;
  mostActiveAuthor: string;
  versionFrequency: Record<string, number>;
}

export interface VersionChange {
  path: string;
  type: 'content' | 'metadata' | 'configuration' | 'asset';
  description: string;
  impact: 'low' | 'medium' | 'high';
  oldValue?: any;
  newValue?: any;
}

export interface DiffSummary {
  totalChanges: number;
  addedItems: number;
  modifiedItems: number;
  removedItems: number;
  movedItems: number;
  breakingChanges: number;
  significantChanges: number;
}

export interface MigrationLogEntry {
  timestamp: Date;
  step: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  duration?: number;
  message?: string;
  error?: string;
  details?: any;
}

export interface ValidationResult {
  validator: string;
  passed: boolean;
  score?: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  path?: string;
  suggestion?: string;
}

export interface VersionDependencyInfo {
  dependencyId: string;
  dependencyName: string;
  versionRequired: string;
  versionAvailable: string;
  satisfied: boolean;
  type: 'required' | 'optional' | 'development';
}

export interface DependencyConflict {
  dependency: string;
  conflictType: 'version' | 'circular' | 'missing';
  description: string;
  affectedVersions: string[];
  resolutionOptions: string[];
}

export interface DependencyResolution {
  conflictId: string;
  strategy: 'upgrade' | 'downgrade' | 'replace' | 'remove';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface VersionConflict {
  dependency: string;
  requiredVersion: string;
  availableVersion: string;
  conflictReason: string;
}

export interface CircularDependency {
  dependencyChain: string[];
  description: string;
  resolutionSuggestions: string[];
}

export interface ApprovalRecord {
  approvalId: string;
  approverId: string;
  approverName: string;
  approvedAt: Date;
  comments?: string;
  conditions?: string[];
}

export interface RejectionRecord {
  rejectionId: string;
  rejectedBy: string;
  rejectedAt: Date;
  reason: string;
  comments?: string;
  requiredChanges: string[];
}

export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

export interface SimilarVersion {
  versionId: string;
  templateId: string;
  versionNumber: string;
  similarityScore: number;
  commonFeatures: string[];
  differences: string[];
}

export interface SimilarityMetric {
  metric: string;
  score: number;
  weight: number;
  details: any;
}

export interface VersionRecommendation {
  versionId: string;
  versionNumber: string;
  recommendationScore: number;
  reason: string;
  benefits: string[];
  considerations: string[];
}

export interface RecommendationReasoning {
  factor: string;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface AnalyticsTrend {
  period: string;
  value: number;
  change: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AdoptionMetric {
  versionId: string;
  adoptionRate: number;
  timeToAdoption: number;
  adoptionVelocity: number;
  userSegments: Record<string, number>;
}

export interface QualityMetric {
  metric: string;
  value: number;
  benchmark: number;
  trend: 'improving' | 'stable' | 'degrading';
  target: number;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark?: number;
  threshold?: number;
  trend?: 'improving' | 'stable' | 'degrading';
}

export interface EngagementMetric {
  metric: string;
  value: number;
  period: string;
  userSegment?: string;
  benchmark?: number;
}

export interface UsageStatistic {
  metric: string;
  value: number;
  period: string;
  context?: string;
}

export interface ErrorMetric {
  errorType: string;
  count: number;
  rate: number;
  impact: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  sentimentScore: number;
  topIssues: string[];
  topPraises: string[];
}

export interface QualityCheckResult {
  check: string;
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  details: any;
}

export interface QualityRecommendation {
  category: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  implementation: string[];
  expectedImpact: string;
}

export interface QualityTrend {
  timestamp: Date;
  overallScore: number;
  categoryScores: Record<string, number>;
  improvements: string[];
  regressions: string[];
}

export interface BenchmarkComparison {
  benchmark: string;
  currentScore: number;
  benchmarkScore: number;
  percentile: number;
  comparison: 'above' | 'at' | 'below';
}

export interface AssetMetadata {
  size: number;
  type: string;
  checksum: string;
  uploadedAt: Date;
  uploadedBy: string;
  downloadCount: number;
  lastAccessed?: Date;
}

export interface ChangelogSummary {
  totalEntries: number;
  breakingChanges: number;
  newFeatures: number;
  bugFixes: number;
  improvements: number;
  versionRange: string;
}

export interface ChangelogSuggestion {
  type: 'missing' | 'improvement' | 'categorization';
  description: string;
  suggestedEntry?: Partial<ChangelogEntry>;
  confidence: number;
}

export interface VersionBackup {
  backupId: string;
  versionId: string;
  backupType: 'full' | 'incremental';
  size: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'available' | 'expired' | 'corrupted';
}

export interface OptimizationResult {
  optimization: string;
  applied: boolean;
  sizeBefore: number;
  sizeAfter: number;
  improvement: number;
  description: string;
}

export interface PerformanceBottleneck {
  component: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
  recommendation: string;
}

export interface PerformanceRecommendation {
  category: 'loading' | 'rendering' | 'interaction' | 'memory' | 'network';
  priority: 'low' | 'medium' | 'high';
  description: string;
  implementation: string[];
  expectedImprovement: string;
}

export interface PerformanceComparison {
  baseline: PerformanceMetric[];
  current: PerformanceMetric[];
  improvements: string[];
  regressions: string[];
  overallChange: number;
}

export interface HealthCheckResult {
  check: string;
  status: 'pass' | 'warn' | 'fail';
  duration: number;
  message?: string;
  details?: any;
}
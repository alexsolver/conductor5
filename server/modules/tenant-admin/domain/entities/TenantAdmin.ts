/**
 * Tenant Admin Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module TenantAdminEntity
 * @created 2025-08-12 - Phase 22 Clean Architecture Implementation
 */

export interface TenantAdmin {
  id: string;
  tenantId: string;
  adminUserId: string;
  adminUserName: string;
  adminUserEmail: string;
  role: TenantAdminRole;
  permissions: TenantAdminPermission[];
  configuration: TenantConfiguration;
  billing: TenantBilling;
  usage: TenantUsage;
  settings: TenantSettings;
  status: 'active' | 'suspended' | 'inactive' | 'pending';
  metadata: TenantAdminMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastAccessAt?: Date;
  isActive: boolean;
}

export type TenantAdminRole = 
  | 'tenant_owner'
  | 'tenant_admin'
  | 'tenant_manager'
  | 'tenant_operator'
  | 'billing_admin'
  | 'support_admin';

export interface TenantAdminPermission {
  id: string;
  module: string;
  action: string;
  resource: string;
  conditions?: PermissionCondition[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'regex';
  value: any;
  description?: string;
}

export interface TenantConfiguration {
  general: GeneralConfiguration;
  features: FeatureConfiguration;
  security: SecurityConfiguration;
  integration: IntegrationConfiguration;
  customization: CustomizationConfiguration;
  compliance: ComplianceConfiguration;
}

export interface GeneralConfiguration {
  tenantName: string;
  displayName: string;
  description?: string;
  industry?: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  timezone: string;
  locale: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  workingHours: WorkingHours;
  businessDays: string[];
  contactInfo: ContactInfo;
}

export interface WorkingHours {
  enabled: boolean;
  schedule: {
    [day: string]: {
      enabled: boolean;
      start: string;
      end: string;
      breaks?: Array<{ start: string; end: string }>;
    };
  };
  timezone: string;
}

export interface ContactInfo {
  primaryEmail: string;
  supportEmail?: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface FeatureConfiguration {
  modules: ModuleFeatures;
  limits: FeatureLimits;
  addons: AddonFeatures[];
  experimental: ExperimentalFeatures;
}

export interface ModuleFeatures {
  tickets: boolean;
  customers: boolean;
  companies: boolean;
  locations: boolean;
  teams: boolean;
  inventory: boolean;
  timecard: boolean;
  notifications: boolean;
  dashboard: boolean;
  customFields: boolean;
  templates: boolean;
  analytics: boolean;
  api: boolean;
  webhooks: boolean;
  integrations: boolean;
}

export interface FeatureLimits {
  maxUsers: number;
  maxTickets: number;
  maxCustomers: number;
  maxCompanies: number;
  maxLocations: number;
  maxStorage: number; // in GB
  maxAPICallsPerMonth: number;
  maxWebhooks: number;
  maxIntegrations: number;
  maxCustomFields: number;
  maxTemplates: number;
  dataRetentionDays: number;
}

export interface AddonFeatures {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  configuration: any;
  price?: number;
  billing?: 'monthly' | 'yearly' | 'usage';
}

export interface ExperimentalFeatures {
  enabled: boolean;
  features: Array<{
    name: string;
    description: string;
    enabled: boolean;
    beta?: boolean;
  }>;
}

export interface SecurityConfiguration {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  audit: AuditConfig;
  compliance: SecurityComplianceConfig;
}

export interface AuthenticationConfig {
  requireMFA: boolean;
  mfaMethods: ('totp' | 'sms' | 'email')[];
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
    preventReuse: number; // last N passwords
  };
  sessionConfig: {
    maxAge: number; // minutes
    refreshEnabled: boolean;
    maxRefreshAge: number; // days
    requireReauth: boolean;
    reauthInterval: number; // hours
  };
  ipWhitelist: string[];
  geoRestrictions: {
    enabled: boolean;
    allowedCountries: string[];
    deniedCountries: string[];
  };
}

export interface AuthorizationConfig {
  rbacEnabled: boolean;
  defaultRole: string;
  roleHierarchy: boolean;
  resourcePermissions: boolean;
  temporaryAccess: boolean;
  delegationEnabled: boolean;
}

export interface EncryptionConfig {
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
  keyRotationEnabled: boolean;
  keyRotationInterval: number; // days
  encryptedFields: string[];
  encryptionAlgorithm: string;
}

export interface AuditConfig {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  retentionDays: number;
  realTimeAlerts: boolean;
  suspiciousActivityDetection: boolean;
  exportEnabled: boolean;
  integrityChecking: boolean;
}

export interface SecurityComplianceConfig {
  standards: ('SOC2' | 'GDPR' | 'HIPAA' | 'ISO27001' | 'LGPD')[];
  dataClassification: boolean;
  privacyControls: boolean;
  rightToForgotten: boolean;
  dataPortability: boolean;
  consentManagement: boolean;
}

export interface IntegrationConfiguration {
  api: APIConfiguration;
  webhooks: WebhookConfiguration;
  sso: SSOConfiguration;
  externalServices: ExternalServiceConfiguration[];
}

export interface APIConfiguration {
  enabled: boolean;
  version: string;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  authentication: ('api_key' | 'oauth2' | 'jwt')[];
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  documentation: {
    enabled: boolean;
    public: boolean;
    customization: any;
  };
}

export interface WebhookConfiguration {
  enabled: boolean;
  maxEndpoints: number;
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    timeoutSeconds: number;
  };
  security: {
    signatureValidation: boolean;
    secretRotation: boolean;
    ipWhitelist: string[];
  };
  events: string[];
}

export interface SSOConfiguration {
  enabled: boolean;
  providers: Array<{
    provider: 'saml' | 'oauth2' | 'oidc' | 'ldap';
    name: string;
    enabled: boolean;
    configuration: any;
    isDefault: boolean;
  }>;
  autoProvisioning: boolean;
  attributeMapping: Record<string, string>;
}

export interface ExternalServiceConfiguration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  configuration: any;
  credentials: any;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: Date;
}

export interface CustomizationConfiguration {
  branding: BrandingConfiguration;
  ui: UIConfiguration;
  workflows: WorkflowConfiguration;
  templates: TemplateConfiguration;
}

export interface BrandingConfiguration {
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCSS?: string;
  emailTemplates: {
    header?: string;
    footer?: string;
    signature?: string;
  };
}

export interface UIConfiguration {
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  layout: 'sidebar' | 'topbar' | 'hybrid';
  navigation: {
    collapsed: boolean;
    showIcons: boolean;
    showLabels: boolean;
    grouping: boolean;
  };
  dashboard: {
    defaultView: string;
    widgets: string[];
    refreshInterval: number;
  };
  tables: {
    defaultPageSize: number;
    showFilters: boolean;
    showSearch: boolean;
    showExport: boolean;
  };
}

export interface WorkflowConfiguration {
  approvals: ApprovalWorkflow[];
  automations: AutomationRule[];
  escalations: EscalationRule[];
  notifications: NotificationRule[];
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: ApprovalStep[];
  conditions: WorkflowCondition[];
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  schedule?: WorkflowSchedule;
}

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  escalations: EscalationStep[];
  conditions: WorkflowCondition[];
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  channels: NotificationChannel[];
  recipients: NotificationRecipient[];
  conditions: WorkflowCondition[];
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual' | 'api';
  event?: string;
  schedule?: WorkflowSchedule;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: string;
  configuration: any;
  delay?: number;
  retries?: number;
}

export interface ApprovalStep {
  id: string;
  name: string;
  approvers: string[];
  requiredApprovals: number;
  timeoutHours?: number;
  escalation?: string;
  conditions?: WorkflowCondition[];
}

export interface EscalationStep {
  id: string;
  name: string;
  delayMinutes: number;
  actions: WorkflowAction[];
  conditions?: WorkflowCondition[];
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook' | 'slack';
  configuration: any;
  enabled: boolean;
}

export interface NotificationRecipient {
  type: 'user' | 'role' | 'team' | 'external';
  identifier: string;
  conditions?: WorkflowCondition[];
}

export interface WorkflowSchedule {
  type: 'once' | 'recurring';
  startDate: Date;
  endDate?: Date;
  frequency?: 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  interval?: number;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  time?: string;
  timezone?: string;
}

export interface TemplateConfiguration {
  emailTemplates: EmailTemplate[];
  documentTemplates: DocumentTemplate[];
  fieldLayouts: FieldLayoutTemplate[];
  reportTemplates: ReportTemplate[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'notification' | 'welcome' | 'reminder' | 'report';
  variables: string[];
  enabled: boolean;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
  type: 'contract' | 'invoice' | 'report' | 'certificate';
  variables: string[];
  enabled: boolean;
}

export interface FieldLayoutTemplate {
  id: string;
  name: string;
  module: string;
  layout: any;
  enabled: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  query: string;
  parameters: ReportParameter[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  enabled: boolean;
}

export interface ReportParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  options?: any[];
}

export interface ComplianceConfiguration {
  dataRetention: DataRetentionPolicy[];
  privacySettings: PrivacySettings;
  auditRequirements: AuditRequirements;
  regulations: RegulationCompliance[];
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  conditions?: WorkflowCondition[];
}

export interface PrivacySettings {
  dataMinimization: boolean;
  purposeLimitation: boolean;
  consentRequired: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
  transparencyReports: boolean;
}

export interface AuditRequirements {
  logLevel: 'basic' | 'detailed' | 'comprehensive';
  retentionDays: number;
  realTimeMonitoring: boolean;
  complianceReporting: boolean;
  externalAuditing: boolean;
}

export interface RegulationCompliance {
  regulation: string;
  enabled: boolean;
  requirements: string[];
  status: 'compliant' | 'partial' | 'non_compliant';
  lastAssessment?: Date;
  nextAssessment?: Date;
}

export interface TenantBilling {
  plan: BillingPlan;
  subscription: Subscription;
  usage: BillingUsage;
  invoices: Invoice[];
  paymentMethod: PaymentMethod;
  billing: BillingSettings;
}

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
  pricing: PricingModel;
  features: FeatureLimits;
  addons: AddonFeatures[];
  trial: TrialSettings;
}

export interface PricingModel {
  type: 'fixed' | 'per_user' | 'usage_based' | 'hybrid';
  basePrice: number;
  currency: string;
  billing: 'monthly' | 'yearly' | 'usage';
  userPrice?: number;
  usageTiers?: UsageTier[];
  discounts?: Discount[];
}

export interface UsageTier {
  from: number;
  to?: number;
  price: number;
  unit: string;
}

export interface Discount {
  type: 'percentage' | 'fixed' | 'free_months';
  value: number;
  conditions?: string[];
  validFrom?: Date;
  validTo?: Date;
}

export interface TrialSettings {
  enabled: boolean;
  durationDays: number;
  featuresIncluded: string[];
  autoConvert: boolean;
  requirePaymentMethod: boolean;
}

export interface Subscription {
  id: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended' | 'trial';
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  trialEndDate?: Date;
  autoRenewal: boolean;
  cancellationReason?: string;
  cancellationDate?: Date;
}

export interface BillingUsage {
  currentPeriod: UsagePeriod;
  previousPeriod?: UsagePeriod;
  yearToDate: UsageMetrics;
  alerts: UsageAlert[];
}

export interface UsagePeriod {
  startDate: Date;
  endDate: Date;
  metrics: UsageMetrics;
  charges: UsageCharge[];
}

export interface UsageMetrics {
  users: number;
  tickets: number;
  storage: number;
  apiCalls: number;
  webhooks: number;
  customFields: number;
  templates: number;
  integrations: number;
}

export interface UsageCharge {
  metric: string;
  quantity: number;
  rate: number;
  amount: number;
  description: string;
}

export interface UsageAlert {
  id: string;
  metric: string;
  threshold: number;
  current: number;
  percentage: number;
  level: 'warning' | 'critical' | 'exceeded';
  triggered: boolean;
  triggeredAt?: Date;
  notified: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  amount: number;
  currency: string;
  tax: number;
  total: number;
  items: InvoiceItem[];
  paymentMethod?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  period?: {
    start: Date;
    end: Date;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal' | 'invoice';
  isDefault: boolean;
  details: any;
  status: 'active' | 'expired' | 'pending' | 'failed';
  expiryDate?: Date;
}

export interface BillingSettings {
  currency: string;
  timezone: string;
  billingAddress: {
    name: string;
    company?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    vatNumber?: string;
  };
  notifications: {
    invoices: boolean;
    payments: boolean;
    usage: boolean;
    renewals: boolean;
  };
  autoPayment: boolean;
  invoiceDelivery: 'email' | 'portal' | 'both';
}

export interface TenantUsage {
  realTime: RealTimeUsage;
  historical: HistoricalUsage;
  analytics: UsageAnalytics;
  reports: UsageReport[];
}

export interface RealTimeUsage {
  timestamp: Date;
  metrics: UsageMetrics;
  alerts: UsageAlert[];
  status: 'normal' | 'warning' | 'critical';
}

export interface HistoricalUsage {
  daily: Array<{ date: Date; metrics: UsageMetrics }>;
  weekly: Array<{ week: string; metrics: UsageMetrics }>;
  monthly: Array<{ month: string; metrics: UsageMetrics }>;
}

export interface UsageAnalytics {
  trends: UsageTrend[];
  predictions: UsagePrediction[];
  recommendations: UsageRecommendation[];
  benchmarks: UsageBenchmark[];
}

export interface UsageTrend {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  period: string;
  confidence: number;
}

export interface UsagePrediction {
  metric: string;
  predictedValue: number;
  period: string;
  confidence: number;
  factors: string[];
}

export interface UsageRecommendation {
  id: string;
  type: 'optimization' | 'upgrade' | 'downgrade' | 'feature';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  savings?: number;
}

export interface UsageBenchmark {
  metric: string;
  tenantValue: number;
  industryAverage: number;
  percentile: number;
  comparison: 'above' | 'below' | 'average';
}

export interface UsageReport {
  id: string;
  name: string;
  description: string;
  type: 'usage' | 'billing' | 'performance' | 'compliance';
  schedule: WorkflowSchedule;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  lastGenerated?: Date;
  enabled: boolean;
}

export interface TenantSettings {
  preferences: TenantPreferences;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  advanced: AdvancedSettings;
}

export interface TenantPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  accessibility: AccessibilitySettings;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  colorBlindSupport: boolean;
}

export interface NotificationSettings {
  channels: NotificationChannelSetting[];
  frequency: NotificationFrequency;
  categories: NotificationCategory[];
  quiet: QuietHours;
}

export interface NotificationChannelSetting {
  channel: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  address?: string;
  preferences: any;
}

export interface NotificationFrequency {
  realTime: boolean;
  digest: 'hourly' | 'daily' | 'weekly' | 'never';
  digestTime?: string;
  maxPerDay?: number;
}

export interface NotificationCategory {
  category: string;
  enabled: boolean;
  channels: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: string[];
  exceptCritical: boolean;
}

export interface IntegrationSettings {
  enabled: boolean;
  allowedTypes: string[];
  securityLevel: 'standard' | 'enhanced' | 'strict';
  approvalRequired: boolean;
  monitoring: boolean;
  logging: boolean;
}

export interface AdvancedSettings {
  debugging: DebuggingSettings;
  performance: PerformanceSettings;
  maintenance: MaintenanceSettings;
  experimental: ExperimentalSettings;
}

export interface DebuggingSettings {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  retention: number;
  realTime: boolean;
  alerts: boolean;
}

export interface PerformanceSettings {
  caching: boolean;
  compression: boolean;
  optimization: boolean;
  monitoring: boolean;
  alerting: boolean;
  reporting: boolean;
}

export interface MaintenanceSettings {
  window: MaintenanceWindow;
  notifications: boolean;
  autoUpdate: boolean;
  backups: BackupSettings;
}

export interface MaintenanceWindow {
  enabled: boolean;
  startTime: string;
  duration: number;
  timezone: string;
  daysOfWeek: string[];
  frequency: 'weekly' | 'monthly' | 'quarterly';
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retention: number;
  encryption: boolean;
  location: 'local' | 'cloud' | 'both';
  verification: boolean;
}

export interface ExperimentalSettings {
  enabled: boolean;
  features: string[];
  feedback: boolean;
  analytics: boolean;
}

export interface TenantAdminMetadata {
  version: string;
  lastConfigUpdate: Date;
  lastBillingUpdate: Date;
  lastUsageUpdate: Date;
  configurationHash: string;
  migrations: MigrationRecord[];
  health: TenantHealth;
  monitoring: MonitoringData;
}

export interface MigrationRecord {
  id: string;
  version: string;
  description: string;
  executedAt: Date;
  executedBy: string;
  duration: number;
  status: 'success' | 'failed' | 'rolled_back';
  changes: string[];
}

export interface TenantHealth {
  status: 'healthy' | 'warning' | 'critical' | 'maintenance';
  score: number;
  checks: HealthCheck[];
  lastCheck: Date;
  issues: HealthIssue[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration: number;
  checkedAt: Date;
}

export interface HealthIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  createdAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'acknowledged';
}

export interface MonitoringData {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  resourceUsage: ResourceUsage;
  alerts: MonitoringAlert[];
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  bandwidth: number;
  database: number;
}

export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'security' | 'billing' | 'usage' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'suppressed';
  actions: string[];
}

/**
 * Tenant Admin Business Rules and Domain Service
 */
export class TenantAdminDomainService {
  
  /**
   * Validate tenant admin configuration
   */
  static validateTenantConfiguration(config: Partial<TenantConfiguration>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // General configuration validation
    if (config.general) {
      if (!config.general.tenantName) {
        errors.push('Tenant name is required');
      }
      if (config.general.tenantName && config.general.tenantName.length < 2) {
        errors.push('Tenant name must be at least 2 characters');
      }
      if (!config.general.timezone) {
        errors.push('Timezone is required');
      }
      if (!config.general.locale) {
        errors.push('Locale is required');
      }
      if (!config.general.currency) {
        errors.push('Currency is required');
      }
    }

    // Feature limits validation
    if (config.features?.limits) {
      const limits = config.features.limits;
      if (limits.maxUsers < 1) {
        errors.push('Maximum users must be at least 1');
      }
      if (limits.maxStorage < 1) {
        errors.push('Maximum storage must be at least 1 GB');
      }
      if (limits.dataRetentionDays < 30) {
        warnings.push('Data retention less than 30 days may not meet compliance requirements');
      }
    }

    // Security validation
    if (config.security) {
      if (config.security.authentication?.passwordPolicy) {
        const policy = config.security.authentication.passwordPolicy;
        if (policy.minLength < 8) {
          warnings.push('Password minimum length less than 8 characters is not recommended');
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if user has tenant admin permission
   */
  static hasPermission(
    tenantAdmin: TenantAdmin,
    module: string,
    action: string,
    resource?: string
  ): boolean {
    // Tenant owner has all permissions
    if (tenantAdmin.role === 'tenant_owner') {
      return true;
    }

    // Check specific permissions
    return tenantAdmin.permissions.some(permission =>
      permission.isActive &&
      permission.module === module &&
      permission.action === action &&
      (!resource || permission.resource === resource || permission.resource === '*') &&
      (!permission.expiresAt || permission.expiresAt > new Date())
    );
  }

  /**
   * Calculate billing amount for current period
   */
  static calculateBillingAmount(billing: TenantBilling): {
    baseAmount: number;
    usageAmount: number;
    totalAmount: number;
    breakdown: Array<{ description: string; amount: number }>;
  } {
    const breakdown: Array<{ description: string; amount: number }> = [];
    let baseAmount = billing.plan.pricing.basePrice;
    let usageAmount = 0;

    // Base plan cost
    breakdown.push({
      description: `${billing.plan.name} Plan`,
      amount: baseAmount
    });

    // Per-user pricing
    if (billing.plan.pricing.type === 'per_user' && billing.plan.pricing.userPrice) {
      const userCost = billing.usage.currentPeriod.metrics.users * billing.plan.pricing.userPrice;
      usageAmount += userCost;
      breakdown.push({
        description: `${billing.usage.currentPeriod.metrics.users} Users`,
        amount: userCost
      });
    }

    // Usage-based pricing
    if (billing.plan.pricing.usageTiers) {
      billing.usage.currentPeriod.charges.forEach(charge => {
        usageAmount += charge.amount;
        breakdown.push({
          description: charge.description,
          amount: charge.amount
        });
      });
    }

    // Addons
    billing.plan.addons.forEach(addon => {
      if (addon.enabled && addon.price) {
        usageAmount += addon.price;
        breakdown.push({
          description: addon.name,
          amount: addon.price
        });
      }
    });

    const totalAmount = baseAmount + usageAmount;

    return { baseAmount, usageAmount, totalAmount, breakdown };
  }

  /**
   * Check usage against limits and generate alerts
   */
  static checkUsageLimits(tenantAdmin: TenantAdmin): UsageAlert[] {
    const alerts: UsageAlert[] = [];
    const limits = tenantAdmin.configuration.features.limits;
    const usage = tenantAdmin.usage.currentPeriod.metrics;

    const checks = [
      { metric: 'users', current: usage.users, limit: limits.maxUsers },
      { metric: 'tickets', current: usage.tickets, limit: limits.maxTickets },
      { metric: 'storage', current: usage.storage, limit: limits.maxStorage },
      { metric: 'apiCalls', current: usage.apiCalls, limit: limits.maxAPICallsPerMonth }
    ];

    checks.forEach(check => {
      const percentage = (check.current / check.limit) * 100;
      let level: 'warning' | 'critical' | 'exceeded' | null = null;

      if (percentage >= 100) {
        level = 'exceeded';
      } else if (percentage >= 90) {
        level = 'critical';
      } else if (percentage >= 80) {
        level = 'warning';
      }

      if (level) {
        alerts.push({
          id: `usage_${check.metric}_${Date.now()}`,
          metric: check.metric,
          threshold: check.limit,
          current: check.current,
          percentage,
          level,
          triggered: true,
          triggeredAt: new Date(),
          notified: false
        });
      }
    });

    return alerts;
  }

  /**
   * Generate health score for tenant
   */
  static calculateHealthScore(tenantAdmin: TenantAdmin): {
    score: number;
    factors: Array<{ factor: string; score: number; weight: number; impact: string }>;
    status: 'healthy' | 'warning' | 'critical' | 'maintenance';
  } {
    const factors = [
      {
        factor: 'Configuration Completeness',
        score: this.getConfigurationScore(tenantAdmin.configuration),
        weight: 0.2,
        impact: 'System functionality and user experience'
      },
      {
        factor: 'Security Compliance',
        score: this.getSecurityScore(tenantAdmin.configuration.security),
        weight: 0.25,
        impact: 'Data protection and regulatory compliance'
      },
      {
        factor: 'Usage Optimization',
        score: this.getUsageScore(tenantAdmin.usage, tenantAdmin.configuration.features.limits),
        weight: 0.2,
        impact: 'Resource efficiency and cost optimization'
      },
      {
        factor: 'System Performance',
        score: this.getPerformanceScore(tenantAdmin.metadata.monitoring),
        weight: 0.2,
        impact: 'User experience and system reliability'
      },
      {
        factor: 'Billing Health',
        score: this.getBillingScore(tenantAdmin.billing),
        weight: 0.15,
        impact: 'Financial stability and service continuity'
      }
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    let status: 'healthy' | 'warning' | 'critical' | 'maintenance';
    if (weightedScore >= 90) status = 'healthy';
    else if (weightedScore >= 70) status = 'warning';
    else if (weightedScore >= 50) status = 'critical';
    else status = 'maintenance';

    return { score: Math.round(weightedScore), factors, status };
  }

  private static getConfigurationScore(config: TenantConfiguration): number {
    let score = 100;
    
    // Check required configurations
    if (!config.general?.tenantName) score -= 20;
    if (!config.general?.timezone) score -= 10;
    if (!config.general?.currency) score -= 10;
    if (!config.security?.authentication) score -= 20;
    if (!config.features?.modules) score -= 15;
    
    // Check optional but recommended configurations
    if (!config.general?.contactInfo?.primaryEmail) score -= 10;
    if (!config.customization?.branding) score -= 5;
    if (!config.compliance?.dataRetention?.length) score -= 10;

    return Math.max(0, score);
  }

  private static getSecurityScore(security: SecurityConfiguration): number {
    let score = 100;

    if (!security.authentication?.requireMFA) score -= 25;
    if (!security.authentication?.passwordPolicy?.minLength || 
        security.authentication.passwordPolicy.minLength < 8) score -= 15;
    if (!security.encryption?.encryptionLevel || 
        security.encryption.encryptionLevel === 'standard') score -= 10;
    if (!security.audit?.enabled) score -= 20;
    if (!security.authorization?.rbacEnabled) score -= 15;
    if (!security.compliance?.standards?.length) score -= 15;

    return Math.max(0, score);
  }

  private static getUsageScore(usage: TenantUsage, limits: FeatureLimits): number {
    const metrics = usage.currentPeriod.metrics;
    let score = 100;

    // Penalize high usage percentages
    const usagePercentages = [
      metrics.users / limits.maxUsers,
      metrics.storage / limits.maxStorage,
      metrics.apiCalls / limits.maxAPICallsPerMonth
    ];

    usagePercentages.forEach(percentage => {
      if (percentage > 0.9) score -= 20;
      else if (percentage > 0.8) score -= 10;
      else if (percentage > 0.7) score -= 5;
    });

    // Bonus for optimization
    if (usagePercentages.every(p => p < 0.7)) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private static getPerformanceScore(monitoring: MonitoringData): number {
    let score = 100;

    if (monitoring.uptime < 0.99) score -= 30;
    else if (monitoring.uptime < 0.995) score -= 15;
    
    if (monitoring.responseTime > 2000) score -= 20;
    else if (monitoring.responseTime > 1000) score -= 10;
    
    if (monitoring.errorRate > 0.05) score -= 25;
    else if (monitoring.errorRate > 0.01) score -= 10;

    if (monitoring.resourceUsage.cpu > 80) score -= 15;
    if (monitoring.resourceUsage.memory > 80) score -= 15;

    return Math.max(0, score);
  }

  private static getBillingScore(billing: TenantBilling): number {
    let score = 100;

    if (billing.subscription.status === 'suspended') score -= 50;
    else if (billing.subscription.status === 'cancelled') score -= 30;
    else if (billing.subscription.status === 'expired') score -= 40;

    // Check for overdue invoices
    const overdueInvoices = billing.invoices.filter(invoice => 
      invoice.status === 'overdue'
    );
    score -= overdueInvoices.length * 15;

    // Check payment method status
    if (billing.paymentMethod?.status === 'failed') score -= 20;
    else if (billing.paymentMethod?.status === 'expired') score -= 15;

    return Math.max(0, score);
  }

  /**
   * Generate recommendations based on tenant analysis
   */
  static generateRecommendations(tenantAdmin: TenantAdmin): UsageRecommendation[] {
    const recommendations: UsageRecommendation[] = [];
    const usage = tenantAdmin.usage.currentPeriod.metrics;
    const limits = tenantAdmin.configuration.features.limits;

    // Usage optimization recommendations
    if (usage.users / limits.maxUsers > 0.8) {
      recommendations.push({
        id: 'upgrade_user_limit',
        type: 'upgrade',
        title: 'Consider upgrading user limit',
        description: 'You are approaching your user limit. Consider upgrading to avoid service interruption.',
        impact: 'Prevent service disruption and accommodate team growth',
        effort: 'low',
        priority: 'high'
      });
    }

    if (usage.storage / limits.maxStorage > 0.9) {
      recommendations.push({
        id: 'storage_cleanup',
        type: 'optimization',
        title: 'Storage cleanup needed',
        description: 'Implement data retention policies and archive old data to free up storage.',
        impact: 'Reduce storage costs and improve performance',
        effort: 'medium',
        priority: 'high'
      });
    }

    // Security recommendations
    if (!tenantAdmin.configuration.security.authentication.requireMFA) {
      recommendations.push({
        id: 'enable_mfa',
        type: 'feature',
        title: 'Enable Multi-Factor Authentication',
        description: 'Improve security by requiring MFA for all users.',
        impact: 'Significantly enhance account security',
        effort: 'low',
        priority: 'high'
      });
    }

    // Performance recommendations
    if (tenantAdmin.metadata.monitoring.responseTime > 1000) {
      recommendations.push({
        id: 'performance_optimization',
        type: 'optimization',
        title: 'Optimize system performance',
        description: 'Enable caching and compression to improve response times.',
        impact: 'Better user experience and reduced server load',
        effort: 'medium',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}
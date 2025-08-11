/**
 * Integration Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for external API integration management
 */

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api_key';
  credentials: Record<string, any>;
  refreshToken?: string;
  expiresAt?: Date;
}

interface WebhookConfig {
  enabled: boolean;
  url: string;
  events: string[];
  secret?: string;
  retryAttempts: number;
  timeoutMs: number;
}

interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number; // milliseconds
  lastRequestAt?: Date;
  uptime: number; // percentage
}

interface SyncConfig {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  batchSize: number;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
}

export class Integration {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private description: string,
    private provider: string, // e.g., 'salesforce', 'zapier', 'custom'
    private version: string = '1.0',
    private baseUrl: string,
    private endpoints: APIEndpoint[] = [],
    private authConfig: AuthConfig = { type: 'none', credentials: {} },
    private webhookConfig: WebhookConfig | null = null,
    private syncConfig: SyncConfig | null = null,
    private isActive: boolean = true,
    private healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown' = 'unknown',
    private tags: string[] = [],
    private metadata: Record<string, any> = {},
    private metrics: IntegrationMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      uptime: 100
    },
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    this.validateBaseUrl();
  }

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getProvider(): string { return this.provider; }
  getVersion(): string { return this.version; }
  getBaseUrl(): string { return this.baseUrl; }
  getEndpoints(): APIEndpoint[] { return [...this.endpoints]; }
  getAuthConfig(): AuthConfig { return { ...this.authConfig }; }
  getWebhookConfig(): WebhookConfig | null { return this.webhookConfig; }
  getSyncConfig(): SyncConfig | null { return this.syncConfig; }
  isIntegrationActive(): boolean { return this.isActive; }
  getHealthStatus(): 'healthy' | 'degraded' | 'down' | 'unknown' { return this.healthStatus; }
  getTags(): string[] { return [...this.tags]; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getMetrics(): IntegrationMetrics { return { ...this.metrics }; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateBasicInfo(name: string, description: string, provider?: string, version?: string): void {
    if (!name.trim()) {
      throw new Error('Integration name cannot be empty');
    }
    
    this.name = name.trim();
    this.description = description.trim();
    
    if (provider) {
      this.provider = provider;
    }
    
    if (version) {
      this.version = version;
    }
    
    this.updatedAt = new Date();
  }

  updateBaseUrl(baseUrl: string): void {
    if (!baseUrl.trim()) {
      throw new Error('Base URL cannot be empty');
    }
    
    this.baseUrl = baseUrl.trim();
    this.validateBaseUrl();
    this.updatedAt = new Date();
  }

  addEndpoint(endpoint: APIEndpoint): void {
    // Check for duplicate endpoint
    if (this.endpoints.some(ep => ep.id === endpoint.id)) {
      throw new Error('Endpoint with this ID already exists');
    }
    
    if (this.endpoints.some(ep => ep.path === endpoint.path && ep.method === endpoint.method)) {
      throw new Error('Endpoint with this path and method already exists');
    }
    
    this.validateEndpoint(endpoint);
    this.endpoints.push(endpoint);
    this.updatedAt = new Date();
  }

  updateEndpoint(endpointId: string, updates: Partial<APIEndpoint>): void {
    const endpointIndex = this.endpoints.findIndex(ep => ep.id === endpointId);
    if (endpointIndex === -1) {
      throw new Error('Endpoint not found');
    }
    
    const updatedEndpoint = { ...this.endpoints[endpointIndex], ...updates };
    this.validateEndpoint(updatedEndpoint);
    
    this.endpoints[endpointIndex] = updatedEndpoint;
    this.updatedAt = new Date();
  }

  removeEndpoint(endpointId: string): void {
    this.endpoints = this.endpoints.filter(ep => ep.id !== endpointId);
    this.updatedAt = new Date();
  }

  updateAuthConfig(authConfig: AuthConfig): void {
    this.validateAuthConfig(authConfig);
    this.authConfig = authConfig;
    this.updatedAt = new Date();
  }

  updateWebhookConfig(webhookConfig: WebhookConfig | null): void {
    if (webhookConfig) {
      this.validateWebhookConfig(webhookConfig);
    }
    
    this.webhookConfig = webhookConfig;
    this.updatedAt = new Date();
  }

  updateSyncConfig(syncConfig: SyncConfig | null): void {
    if (syncConfig) {
      this.validateSyncConfig(syncConfig);
    }
    
    this.syncConfig = syncConfig;
    this.updatedAt = new Date();
  }

  activate(): void {
    if (!this.hasValidAuth()) {
      throw new Error('Cannot activate integration without valid authentication');
    }
    
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updateHealthStatus(status: 'healthy' | 'degraded' | 'down' | 'unknown'): void {
    this.healthStatus = status;
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

  recordAPICall(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Update average response time
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1)) + responseTime
    ) / this.metrics.totalRequests;
    
    this.metrics.lastRequestAt = new Date();
    
    // Update uptime
    this.metrics.uptime = (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
    
    this.updatedAt = new Date();
  }

  recordSyncComplete(): void {
    if (this.syncConfig) {
      this.syncConfig.lastSyncAt = new Date();
      this.calculateNextSync();
      this.updatedAt = new Date();
    }
  }

  // Private validation methods
  private validateBaseUrl(): void {
    try {
      new URL(this.baseUrl);
    } catch {
      throw new Error('Invalid base URL format');
    }
  }

  private validateEndpoint(endpoint: APIEndpoint): void {
    if (!endpoint.path.trim()) {
      throw new Error('Endpoint path cannot be empty');
    }
    
    if (!endpoint.path.startsWith('/')) {
      throw new Error('Endpoint path must start with /');
    }
    
    if (endpoint.rateLimit && endpoint.rateLimit.requests <= 0) {
      throw new Error('Rate limit requests must be greater than 0');
    }
  }

  private validateAuthConfig(authConfig: AuthConfig): void {
    if (authConfig.type === 'oauth2' && !authConfig.credentials.client_id) {
      throw new Error('OAuth2 authentication requires client_id');
    }
    
    if (authConfig.type === 'api_key' && !authConfig.credentials.key) {
      throw new Error('API key authentication requires key');
    }
    
    if (authConfig.type === 'basic' && (!authConfig.credentials.username || !authConfig.credentials.password)) {
      throw new Error('Basic authentication requires username and password');
    }
  }

  private validateWebhookConfig(webhookConfig: WebhookConfig): void {
    if (webhookConfig.enabled && !webhookConfig.url) {
      throw new Error('Webhook URL is required when webhooks are enabled');
    }
    
    if (webhookConfig.enabled && webhookConfig.events.length === 0) {
      throw new Error('At least one webhook event must be specified');
    }
    
    if (webhookConfig.retryAttempts < 0) {
      throw new Error('Retry attempts cannot be negative');
    }
    
    if (webhookConfig.timeoutMs <= 0) {
      throw new Error('Timeout must be greater than 0');
    }
  }

  private validateSyncConfig(syncConfig: SyncConfig): void {
    if (syncConfig.batchSize <= 0) {
      throw new Error('Batch size must be greater than 0');
    }
    
    if (syncConfig.batchSize > 1000) {
      throw new Error('Batch size cannot exceed 1000');
    }
  }

  private calculateNextSync(): void {
    if (!this.syncConfig || !this.syncConfig.enabled) return;
    
    const now = new Date();
    let nextSync = new Date(now);
    
    switch (this.syncConfig.frequency) {
      case 'hourly':
        nextSync.setHours(nextSync.getHours() + 1);
        break;
      case 'daily':
        nextSync.setDate(nextSync.getDate() + 1);
        break;
      case 'weekly':
        nextSync.setDate(nextSync.getDate() + 7);
        break;
      default:
        return; // realtime doesn't have scheduled syncs
    }
    
    this.syncConfig.nextSyncAt = nextSync;
  }

  // Business queries
  hasValidAuth(): boolean {
    if (this.authConfig.type === 'none') return true;
    
    // Check if auth credentials are present
    const hasCredentials = Object.keys(this.authConfig.credentials).length > 0;
    
    // Check if auth is not expired (for token-based auth)
    const isNotExpired = !this.authConfig.expiresAt || this.authConfig.expiresAt > new Date();
    
    return hasCredentials && isNotExpired;
  }

  isAuthExpired(): boolean {
    return this.authConfig.expiresAt !== undefined && this.authConfig.expiresAt <= new Date();
  }

  getEndpoint(path: string, method: string): APIEndpoint | null {
    return this.endpoints.find(ep => ep.path === path && ep.method === method) || null;
  }

  hasEndpoint(path: string, method: string): boolean {
    return this.getEndpoint(path, method) !== null;
  }

  isWebhookEnabled(): boolean {
    return this.webhookConfig?.enabled || false;
  }

  isSyncEnabled(): boolean {
    return this.syncConfig?.enabled || false;
  }

  isDueForSync(): boolean {
    if (!this.syncConfig || !this.syncConfig.enabled || !this.syncConfig.nextSyncAt) {
      return false;
    }
    
    return this.syncConfig.nextSyncAt <= new Date();
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 100;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  getFailureRate(): number {
    return 100 - this.getSuccessRate();
  }

  isHealthy(): boolean {
    return this.healthStatus === 'healthy';
  }

  isDegraded(): boolean {
    return this.healthStatus === 'degraded';
  }

  isDown(): boolean {
    return this.healthStatus === 'down';
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag.toLowerCase());
  }

  requiresAuthentication(): boolean {
    return this.authConfig.type !== 'none';
  }

  supportsRealTimeSync(): boolean {
    return this.syncConfig?.frequency === 'realtime';
  }

  getEndpointCount(): number {
    return this.endpoints.length;
  }

  getEndpointsByMethod(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'): APIEndpoint[] {
    return this.endpoints.filter(ep => ep.method === method);
  }

  hasRateLimits(): boolean {
    return this.endpoints.some(ep => ep.rateLimit !== undefined);
  }

  getLastSyncDate(): Date | null {
    return this.syncConfig?.lastSyncAt || null;
  }

  getNextSyncDate(): Date | null {
    return this.syncConfig?.nextSyncAt || null;
  }

  shouldRetryFailedRequests(): boolean {
    return this.getFailureRate() < 50 && this.isActive;
  }

  getIntegrationStatus(): 'operational' | 'issues' | 'down' | 'maintenance' {
    if (!this.isActive) return 'maintenance';
    if (this.healthStatus === 'down') return 'down';
    if (this.healthStatus === 'degraded' || this.getSuccessRate() < 95) return 'issues';
    return 'operational';
  }
}
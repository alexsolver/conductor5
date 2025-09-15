// ===========================================================================================
// HEALTH CHECK TYPES - Domain Layer
// Following 1qa.md Clean Architecture patterns
// ===========================================================================================

/**
 * Result of an integration health check operation
 */
export interface HealthCheckResult {
  integrationId: string;
  status: 'connected' | 'error' | 'disconnected';
  message?: string;
  lastTested: Date;
  dataSource?: 'real' | 'simulated' | 'unknown';
  error?: string;
  responseTime?: number;
}

/**
 * Configuration for health check execution
 */
export interface HealthCheckConfig {
  timeout?: number;
  retryAttempts?: number;
  checkRealData?: boolean;
  skipCache?: boolean;
}

/**
 * Summary of multiple health check results
 */
export interface HealthCheckSummary {
  totalChecked: number;
  connected: number;
  errors: number;
  disconnected: number;
  checkedAt: Date;
  results: HealthCheckResult[];
}
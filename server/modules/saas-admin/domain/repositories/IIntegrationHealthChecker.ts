// ===========================================================================================
// INTEGRATION HEALTH CHECKER PORT - Domain Layer Interface
// Following 1qa.md Clean Architecture patterns - Port for Infrastructure Layer
// ===========================================================================================

export interface HealthResult {
  status: 'connected' | 'error' | 'disconnected';
  message?: string;
  lastTested: Date;
  dataSource?: 'real' | 'simulated' | 'unknown';
}

/**
 * Port interface for Integration Health Checking
 * Infrastructure layer must implement this interface
 * Domain and Application layers depend on this abstraction
 */
export interface IIntegrationHealthChecker {
  /**
   * Check health status of a specific integration by ID
   * @param integrationId - The integration ID to check (e.g., 'openweather', 'openai')
   * @param config - The integration configuration containing API keys, etc.
   * @returns Promise<HealthResult> with current status and details
   */
  checkHealth(integrationId: string, config: any): Promise<HealthResult>;

  /**
   * Get list of supported integration providers for this health checker
   * @returns Array of integration IDs this checker can handle
   */
  getSupportedProviders(): string[];

  /**
   * Validate if this health checker can handle the given integration
   * @param integrationId - The integration ID to validate
   * @returns boolean indicating if this checker supports the integration
   */
  canCheck(integrationId: string): boolean;
}
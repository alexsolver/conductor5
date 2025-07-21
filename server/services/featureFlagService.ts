/**
 * Feature Flag Service
 * Manages feature toggles and conditional feature rollouts
 */

import { logInfo, logError, logWarn } from '../utils/logger';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  conditions?: {
    userRole?: string[];
    tenantIds?: string[];
    percentage?: number;
    startDate?: Date;
    endDate?: Date;
  };
}

export interface FeatureFlagContext {
  userId?: string;
  tenantId?: string;
  userRole?: string;
  environment?: string;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, FeatureFlag> = new Map();

  private constructor() {
    this.initializeDefaultFlags();
  }

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = ['
      {
        name: 'advanced_analytics',
        enabled: false,
        description: 'Enable advanced analytics dashboard'
      },
      {
        name: 'new_ticket_ui',
        enabled: true,
        description: 'New ticket creation interface'
      },
      {
        name: 'beta_features',
        enabled: false,
        description: 'Beta features for testing',
        conditions: {
          userRole: ['admin', 'manager]
        }
      },
      {
        name: 'enhanced_reporting',
        enabled: true,
        description: 'Enhanced reporting capabilities'
      },
      {
        name: 'real_time_notifications',
        enabled: true,
        description: 'Real-time notification system'
      },
      {
        name: 'ai_suggestions',
        enabled: false,
        description: 'AI-powered suggestions and automation',
        conditions: {
          percentage: 10 // 10% rollout
        }
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });

    logInfo('Feature flags initialized', { count: defaultFlags.length });
  }

  /**
   * Check if a feature is enabled for a given context
   */
  public isEnabled(flagName: string, context?: FeatureFlagContext): boolean {
    const flag = this.flags.get(flagName);
    
    if (!flag) {
      logWarn('Unknown feature flag', { flagName });
      return false;
    }

    // If flag is disabled globally, return false
    if (!flag.enabled) {
      return false;
    }

    // If no conditions, return true
    if (!flag.conditions) {
      return true;
    }

    // Check conditions
    return this.checkConditions(flag, context);
  }

  private checkConditions(flag: FeatureFlag, context?: FeatureFlagContext): boolean {
    if (!flag.conditions || !context) {
      return flag.enabled;
    }

    const { conditions } = flag;

    // Check user role condition
    if (conditions.userRole && context.userRole) {
      if (!conditions.userRole.includes(context.userRole)) {
        return false;
      }
    }

    // Check tenant ID condition
    if (conditions.tenantIds && context.tenantId) {
      if (!conditions.tenantIds.includes(context.tenantId)) {
        return false;
      }
    }

    // Check date conditions
    const now = new Date();
    if (conditions.startDate && now < conditions.startDate) {
      return false;
    }
    if (conditions.endDate && now > conditions.endDate) {
      return false;
    }

    // Check percentage rollout
    if (conditions.percentage !== undefined && context.userId) {
      const hash = this.hashUserId(context.userId);
      const percentage = (hash % 100) + 1;
      if (percentage > conditions.percentage) {
        return false;
      }
    }

    return true;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Set a feature flag
   */
  public setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.name, flag);
    logInfo('Feature flag updated', { flagName: flag.name, enabled: flag.enabled });
  }

  /**
   * Enable a feature flag
   */
  public enableFlag(flagName: string): void {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.enabled = true;
      logInfo('Feature flag enabled', { flagName });
    } else {
      logWarn('Cannot enable unknown feature flag', { flagName });
    }
  }

  /**
   * Disable a feature flag
   */
  public disableFlag(flagName: string): void {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.enabled = false;
      logInfo('Feature flag disabled', { flagName });
    } else {
      logWarn('Cannot disable unknown feature flag', { flagName });
    }
  }

  /**
   * Get all feature flags
   */
  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get feature flag by name
   */
  public getFlag(flagName: string): FeatureFlag | undefined {
    return this.flags.get(flagName);
  }

  /**
   * Get enabled flags for a context
   */
  public getEnabledFlags(context?: FeatureFlagContext): string[] {
    const enabledFlags: string[] = [];
    
    this.flags.forEach((flag, name) => {
      if (this.isEnabled(name, context)) {
        enabledFlags.push(name);
      }
    });

    return enabledFlags;
  }

  /**
   * Remove a feature flag
   */
  public removeFlag(flagName: string): void {
    if (this.flags.delete(flagName)) {
      logInfo('Feature flag removed', { flagName });
    } else {
      logWarn('Cannot remove unknown feature flag', { flagName });
    }
  }

  /**
   * Load flags from external source (database, config file, etc.)
   */
  public async loadFlags(source: FeatureFlag[]): Promise<void> {
    try {
      source.forEach(flag => {
        this.flags.set(flag.name, flag);
      });
      logInfo('Feature flags loaded from external source', { count: source.length });
    } catch (error) {
      logError('Error loading feature flags', error);
    }
  }

  /**
   * Get feature flag statistics
   */
  public getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    withConditions: number;
  } {
    const flags = Array.from(this.flags.values());
    
    return {
      total: flags.length,
      enabled: flags.filter(f => f.enabled).length,
      disabled: flags.filter(f => !f.enabled).length,
      withConditions: flags.filter(f => f.conditions).length
    };
  }
}

// Export singleton instance
export const featureFlagService = FeatureFlagService.getInstance();

// Helper functions
export function isFeatureEnabled(flagName: string, context?: FeatureFlagContext): boolean {
  return featureFlagService.isEnabled(flagName, context);
}

export function getEnabledFeatures(context?: FeatureFlagContext): string[] {
  return featureFlagService.getEnabledFlags(context);
}

export default featureFlagService;
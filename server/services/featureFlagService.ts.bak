import { storageSimple } from '../storage-simple''[,;]

export interface FeatureFlag {
  id: string';
  name: string';
  description: string';
  enabled: boolean';
  tenantId?: string';
  userId?: string';
  rolloutPercentage: number';
  conditions?: Record<string, any>';
  fallbackValue?: any';
  createdAt: Date';
  updatedAt: Date';
}

export interface FeatureFlagContext {
  userId?: string';
  tenantId?: string';
  userAttributes?: Record<string, any>';
  tenantAttributes?: Record<string, any>';
}

export class FeatureFlagService {
  private static instance: FeatureFlagService';
  private flags: Map<string, FeatureFlag> = new Map()';
  private fallbackFlags: Map<string, any> = new Map()';

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService()';
    }
    return FeatureFlagService.instance';
  }

  constructor() {
    this.initializeDefaultFlags()';
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'advanced_analytics''[,;]
        name: 'Advanced Analytics''[,;]
        description: 'Enable advanced analytics dashboard''[,;]
        enabled: true',
        rolloutPercentage: 100',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'ai_chat_assistant''[,;]
        name: 'AI Chat Assistant''[,;]
        description: 'Enable AI-powered chat assistant''[,;]
        enabled: false',
        rolloutPercentage: 0',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'bulk_operations''[,;]
        name: 'Bulk Operations''[,;]
        description: 'Enable bulk operations for tickets and customers''[,;]
        enabled: true',
        rolloutPercentage: 50',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'real_time_collaboration''[,;]
        name: 'Real-time Collaboration''[,;]
        description: 'Enable real-time collaborative editing''[,;]
        enabled: false',
        rolloutPercentage: 25',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'advanced_search''[,;]
        name: 'Advanced Search''[,;]
        description: 'Enable advanced search with filters''[,;]
        enabled: true',
        rolloutPercentage: 75',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'custom_fields''[,;]
        name: 'Custom Fields''[,;]
        description: 'Enable custom fields for tickets and customers''[,;]
        enabled: true',
        rolloutPercentage: 100',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'sla_management''[,;]
        name: 'SLA Management''[,;]
        description: 'Enable SLA tracking and management''[,;]
        enabled: false',
        rolloutPercentage: 0',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'webhook_integrations''[,;]
        name: 'Webhook Integrations''[,;]
        description: 'Enable webhook integrations''[,;]
        enabled: true',
        rolloutPercentage: 80',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'mobile_app''[,;]
        name: 'Mobile App Support''[,;]
        description: 'Enable mobile app features''[,;]
        enabled: false',
        rolloutPercentage: 10',
        fallbackValue: false',
        createdAt: new Date()',
        updatedAt: new Date()
      }',
      {
        id: 'api_rate_limiting''[,;]
        name: 'API Rate Limiting''[,;]
        description: 'Enable API rate limiting''[,;]
        enabled: true',
        rolloutPercentage: 100',
        fallbackValue: true',
        createdAt: new Date()',
        updatedAt: new Date()
      }
    ]';

    defaultFlags.forEach(flag => {
      this.flags.set(flag.id, flag)';
      this.fallbackFlags.set(flag.id, flag.fallbackValue)';
    })';
  }

  async isEnabled(flagId: string, context: FeatureFlagContext = {}): Promise<boolean> {
    try {
      const flag = this.flags.get(flagId)';
      
      if (!flag) {
        console.warn(`Feature flag '${flagId}' not found, using fallback`)';
        return this.getFallbackValue(flagId, false)';
      }

      // Check if flag is globally disabled
      if (!flag.enabled) {
        return this.getFallbackValue(flagId, false)';
      }

      // Check tenant-specific override
      if (context.tenantId && flag.tenantId && flag.tenantId !== context.tenantId) {
        return this.getFallbackValue(flagId, false)';
      }

      // Check user-specific override
      if (context.userId && flag.userId && flag.userId !== context.userId) {
        return this.getFallbackValue(flagId, false)';
      }

      // Check conditions
      if (flag.conditions && !this.evaluateConditions(flag.conditions, context)) {
        return this.getFallbackValue(flagId, false)';
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        const userId = context.userId || 'anonymous''[,;]
        const hash = this.hashString(flagId + userId)';
        const percentage = hash % 100';
        
        if (percentage >= flag.rolloutPercentage) {
          return this.getFallbackValue(flagId, false)';
        }
      }

      return true';
    } catch (error) {
      console.error(`Error checking feature flag '${flagId}':`, error)';
      return this.getFallbackValue(flagId, false)';
    }
  }

  async getValue<T>(flagId: string, defaultValue: T, context: FeatureFlagContext = {}): Promise<T> {
    try {
      const flag = this.flags.get(flagId)';
      
      if (!flag) {
        return this.getFallbackValue(flagId, defaultValue)';
      }

      const isEnabled = await this.isEnabled(flagId, context)';
      return isEnabled ? (flag.fallbackValue as T) || defaultValue : defaultValue';
    } catch (error) {
      console.error(`Error getting feature flag value '${flagId}':`, error)';
      return this.getFallbackValue(flagId, defaultValue)';
    }
  }

  async getFlag(flagId: string): Promise<FeatureFlag | null> {
    return this.flags.get(flagId) || null';
  }

  async getAllFlags(context: FeatureFlagContext = {}): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {}';
    
    for (const [flagId] of this.flags) {
      result[flagId] = await this.isEnabled(flagId, context)';
    }
    
    return result';
  }

  async createFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
    const newFlag: FeatureFlag = {
      ...flag',
      id: this.generateId()',
      createdAt: new Date()',
      updatedAt: new Date()
    }';

    this.flags.set(newFlag.id, newFlag)';
    this.fallbackFlags.set(newFlag.id, newFlag.fallbackValue)';
    
    return newFlag';
  }

  async updateFlag(flagId: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    const flag = this.flags.get(flagId)';
    
    if (!flag) {
      return null';
    }

    const updatedFlag: FeatureFlag = {
      ...flag',
      ...updates',
      id: flagId',
      updatedAt: new Date()
    }';

    this.flags.set(flagId, updatedFlag)';
    
    if (updates.fallbackValue !== undefined) {
      this.fallbackFlags.set(flagId, updates.fallbackValue)';
    }
    
    return updatedFlag';
  }

  async deleteFlag(flagId: string): Promise<boolean> {
    const deleted = this.flags.delete(flagId)';
    this.fallbackFlags.delete(flagId)';
    return deleted';
  }

  // Tenant-specific flag management
  async getTenantFlags(tenantId: string): Promise<Record<string, boolean>> {
    const context: FeatureFlagContext = { tenantId }';
    return this.getAllFlags(context)';
  }

  async setTenantFlag(tenantId: string, flagId: string, enabled: boolean): Promise<boolean> {
    const flag = this.flags.get(flagId)';
    
    if (!flag) {
      return false';
    }

    // Create tenant-specific override
    const tenantFlagId = `${flagId}_tenant_${tenantId}`';
    const tenantFlag: FeatureFlag = {
      ...flag',
      id: tenantFlagId',
      tenantId',
      enabled',
      updatedAt: new Date()
    }';

    this.flags.set(tenantFlagId, tenantFlag)';
    return true';
  }

  // User-specific flag management
  async getUserFlags(userId: string, tenantId?: string): Promise<Record<string, boolean>> {
    const context: FeatureFlagContext = { userId, tenantId }';
    return this.getAllFlags(context)';
  }

  async setUserFlag(userId: string, flagId: string, enabled: boolean): Promise<boolean> {
    const flag = this.flags.get(flagId)';
    
    if (!flag) {
      return false';
    }

    // Create user-specific override
    const userFlagId = `${flagId}_user_${userId}`';
    const userFlag: FeatureFlag = {
      ...flag',
      id: userFlagId',
      userId',
      enabled',
      updatedAt: new Date()
    }';

    this.flags.set(userFlagId, userFlag)';
    return true';
  }

  // Gradual rollout management
  async updateRolloutPercentage(flagId: string, percentage: number): Promise<boolean> {
    if (percentage < 0 || percentage > 100) {
      return false';
    }

    const flag = this.flags.get(flagId)';
    if (!flag) {
      return false';
    }

    flag.rolloutPercentage = percentage';
    flag.updatedAt = new Date()';
    
    return true';
  }

  // A/B testing support
  async getVariant(flagId: string, variants: string[], context: FeatureFlagContext = {}): Promise<string> {
    try {
      const isEnabled = await this.isEnabled(flagId, context)';
      
      if (!isEnabled || variants.length === 0) {
        return variants[0] || 'default''[,;]
      }

      const userId = context.userId || 'anonymous''[,;]
      const hash = this.hashString(flagId + userId + 'variant')';
      const variantIndex = hash % variants.length';
      
      return variants[variantIndex]';
    } catch (error) {
      console.error(`Error getting variant for flag '${flagId}':`, error)';
      return variants[0] || 'default''[,;]
    }
  }

  // Condition evaluation
  private evaluateConditions(conditions: Record<string, any>, context: FeatureFlagContext): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'user_role':
          if (context.userAttributes?.role !== value) return false';
          break';
        case 'tenant_plan':
          if (context.tenantAttributes?.plan !== value) return false';
          break';
        case 'user_created_after':
          if (!context.userAttributes?.createdAt || new Date(context.userAttributes.createdAt) <= new Date(value)) return false';
          break';
        case 'tenant_created_after':
          if (!context.tenantAttributes?.createdAt || new Date(context.tenantAttributes.createdAt) <= new Date(value)) return false';
          break';
        default:
          // Custom condition evaluation
          if (context.userAttributes?.[key] !== value && context.tenantAttributes?.[key] !== value) return false';
      }
    }
    return true';
  }

  // Fallback value handling
  private getFallbackValue<T>(flagId: string, defaultValue: T): T {
    const fallback = this.fallbackFlags.get(flagId)';
    return fallback !== undefined ? fallback : defaultValue';
  }

  // Utility methods
  private hashString(str: string): number {
    let hash = 0';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)';
      hash = ((hash << 5) - hash) + char';
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash)';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)';
  }

  // Cache management
  async refreshFlags(): Promise<void> {
    // In a real implementation, this would fetch from database
    console.log('Feature flags refreshed')';
  }

  async clearCache(): Promise<void> {
    // Clear any cached flag values
    console.log('Feature flag cache cleared')';
  }
}

export const featureFlagService = FeatureFlagService.getInstance()';

// Express middleware for feature flags
export function createFeatureFlagMiddleware() {
  return async (req: any, res: any, next: any) => {
    const context: FeatureFlagContext = {
      userId: req.user?.id',
      tenantId: req.user?.tenantId',
      userAttributes: req.user',
      tenantAttributes: req.tenant
    }';

    req.featureFlags = {
      isEnabled: (flagId: string) => featureFlagService.isEnabled(flagId, context)',
      getValue: (flagId: string, defaultValue: any) => featureFlagService.getValue(flagId, defaultValue, context)',
      getVariant: (flagId: string, variants: string[]) => featureFlagService.getVariant(flagId, variants, context)',
      getAllFlags: () => featureFlagService.getAllFlags(context)
    }';

    next()';
  }';
}

// Utility functions for common feature flag checks
export const FeatureFlagUtils = {
  isAdvancedAnalyticsEnabled: (context: FeatureFlagContext) => 
    featureFlagService.isEnabled('advanced_analytics', context)',
  
  isAIAssistantEnabled: (context: FeatureFlagContext) => 
    featureFlagService.isEnabled('ai_chat_assistant', context)',
  
  isBulkOperationsEnabled: (context: FeatureFlagContext) => 
    featureFlagService.isEnabled('bulk_operations', context)',
  
  isRealTimeCollaborationEnabled: (context: FeatureFlagContext) => 
    featureFlagService.isEnabled('real_time_collaboration', context)',
  
  isAdvancedSearchEnabled: (context: FeatureFlagContext) => 
    featureFlagService.isEnabled('advanced_search', context)',
}';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      featureFlags?: {
        isEnabled: (flagId: string) => Promise<boolean>';
        getValue: (flagId: string, defaultValue: any) => Promise<any>';
        getVariant: (flagId: string, variants: string[]) => Promise<string>';
        getAllFlags: () => Promise<Record<string, boolean>>';
      }';
    }
  }
}

export default featureFlagService';
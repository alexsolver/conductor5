/**
 * UNIFIED AUTO-HEALING SERVICE
 * Single source of truth for all schema healing operations
 * Replaces duplicate healing logic across multiple files
 */

export class UnifiedSchemaHealer {
  /**
   * Main healing orchestrator - replaces all other healing methods
   * Uses read-only validation approach to prevent conflicts
   */
  static async healTenantSchema(tenantId: string): Promise<boolean> {
    try {
      console.log(`🔧 [UNIFIED-HEALER] Starting validation for tenant: ${tenantId}`);
      
      // Step 1: Validate current state using SchemaValidator as single source of truth
      const validation = await this.validateCurrentState(tenantId);
      if (validation.isValid) {
        console.log(`✅ [UNIFIED-HEALER] Tenant ${tenantId} validation passed`);
        return true;
      }
      
      // Step 2: Log validation issues - no automatic creation to prevent conflicts
      if (validation.missingTables.length > 0) {
        console.log(`⚠️ [UNIFIED-HEALER] Validation issues for ${tenantId}:`, validation.missingTables);
        console.log(`📋 [UNIFIED-HEALER] Expected tables: ${validation.missingTables.length} missing`);
        console.log(`❌ [UNIFIED-HEALER] Auto-creation disabled - manual intervention required`);
        return false;
      }
      
      console.log(`✅ [UNIFIED-HEALER] Validation completed for tenant: ${tenantId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ [UNIFIED-HEALER] Validation failed for ${tenantId}:`, error);
      return false;
    }
  }
  
  /**
   * Validate tenant schema using SchemaValidator as single source of truth
   */
  private static async validateCurrentState(tenantId: string) {
    try {
      const { SchemaValidator } = await import('../utils/schemaValidator');
      const { db } = await import('../db');
      
      return await SchemaValidator.validateTenantSchema(db, tenantId);
    } catch (error) {
      console.error(`❌ [UNIFIED-HEALER] Validation error for ${tenantId}:`, error);
      return {
        isValid: false,
        missingTables: [],
        fieldMappings: {}
      };
    }
  }
  
  /**
   * Get validation status without healing attempts
   */
  static async getValidationStatus(tenantId: string): Promise<{
    isValid: boolean;
    tableCount: number;
    missingTables: string[];
    status: 'VALID' | 'INVALID';
  }> {
    try {
      const validation = await this.validateCurrentState(tenantId);
      const tableCount = Object.keys(validation.fieldMappings).length;
      
      return {
        isValid: validation.isValid,
        tableCount,
        missingTables: validation.missingTables,
        status: validation.isValid ? 'VALID' : 'INVALID'
      };
    } catch (error) {
      console.error(`❌ [UNIFIED-HEALER] Status check failed for ${tenantId}:`, error);
      return {
        isValid: false,
        tableCount: 0,
        missingTables: [],
        status: 'INVALID'
      };
    }
  }
}
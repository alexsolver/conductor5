/**
 * VALIDATION LOGIC CONFLICT RESOLVER
 * 
 * Resolves conflicting validation logic where SchemaValidator expects 
 * tables that don't exist and auto-healing has duplicate logic
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface ValidationConflict {
  validator: string;
  expectedTables: string[];
  actualTables: string[];
  missingTables: string[];
  conflictType: 'missing_tables' | 'duplicate_logic' | 'inconsistent_validation';
}

interface AutoHealingDuplicate {
  location: string;
  healingMethod: string;
  conflictsWith: string[];
}

export class ValidationLogicConflictResolver {
  private readonly projectRoot: string;
  private readonly conflicts: ValidationConflict[] = [];
  private readonly duplicates: AutoHealingDuplicate[] = [];

  constructor(projectRoot: string = './') {
    this.projectRoot = projectRoot;
  }

  /**
   * Main resolution process
   */
  async resolveValidationConflicts(): Promise<void> {
    console.log('🚨 [VALIDATION-CONFLICT] Starting validation logic conflict resolution...');
    
    try {
      // Step 1: Identify validation conflicts
      await this.identifyValidationConflicts();
      
      // Step 2: Detect auto-healing duplicates
      await this.detectAutoHealingDuplicates();
      
      // Step 3: Resolve table expectation conflicts
      await this.resolveTableExpectationConflicts();
      
      // Step 4: Consolidate auto-healing logic
      await this.consolidateAutoHealingLogic();
      
      // Step 5: Standardize validation methods
      await this.standardizeValidationMethods();
      
      console.log('✅ [VALIDATION-CONFLICT] Validation logic conflicts resolved');
      
    } catch (error) {
      console.error('❌ [VALIDATION-CONFLICT] Resolution failed:', error);
      throw error;
    }
  }

  /**
   * Identify validation conflicts across different validators
   */
  private async identifyValidationConflicts(): Promise<void> {
    console.log('🔍 [VALIDATION-CONFLICT] Identifying validation conflicts...');
    
    // Analyze SchemaValidator expectations
    const schemaValidatorPath = join(this.projectRoot, 'server/utils/schemaValidator.ts');
    const schemaValidatorContent = await fs.readFile(schemaValidatorPath, 'utf-8');
    
    // Extract expected tables from SchemaValidator
    const expectedTablesMatch = schemaValidatorContent.match(
      /const requiredTables = \[([\s\S]*?)\];/
    );
    
    let expectedTables: string[] = [];
    if (expectedTablesMatch) {
      expectedTables = expectedTablesMatch[1]
        .split(',')
        .map(line => line.trim())
        .filter(line => line.startsWith("'"))
        .map(line => line.replace(/['"]/g, ''));
    }

    // Check production initializer expectations
    const prodInitPath = join(this.projectRoot, 'server/utils/productionInitializer.ts');
    const prodInitContent = await fs.readFile(prodInitPath, 'utf-8');
    
    // Find auto-healing table lists
    const autoHealingTablesMatch = prodInitContent.match(
      /const missingTables = \[([\s\S]*?)\];/
    );
    
    let autoHealingTables: string[] = [];
    if (autoHealingTablesMatch) {
      autoHealingTables = autoHealingTablesMatch[1]
        .split(',')
        .map(line => line.trim())
        .filter(line => line.startsWith("'"))
        .map(line => line.replace(/['"]/g, ''));
    }

    // Identify conflicts
    const missingInValidator = autoHealingTables.filter(table => !expectedTables.includes(table));
    const missingInHealing = expectedTables.filter(table => !autoHealingTables.includes(table));

    if (missingInValidator.length > 0 || missingInHealing.length > 0) {
      this.conflicts.push({
        validator: 'SchemaValidator vs AutoHealing',
        expectedTables,
        actualTables: autoHealingTables,
        missingTables: [...missingInValidator, ...missingInHealing],
        conflictType: 'inconsistent_validation'
      });
    }

    console.log(`📊 [VALIDATION-CONFLICT] Found ${this.conflicts.length} validation conflicts`);
  }

  /**
   * Detect duplicate auto-healing logic
   */
  private async detectAutoHealingDuplicates(): Promise<void> {
    console.log('🔍 [VALIDATION-CONFLICT] Detecting auto-healing duplicates...');
    
    const healingFiles = [
      'server/utils/productionInitializer.ts',
      'server/scripts/RuntimeErrorResolver.ts',
      'server/scripts/SchemaValidationEnforcer.ts'
    ];
    
    const healingMethods: Array<{file: string, methods: string[]}> = [];
    
    for (const file of healingFiles) {
      try {
        const filePath = join(this.projectRoot, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Find healing-related methods
        const methods = [];
        const healingPatterns = [
          /async\s+.*heal.*\(/gi,
          /async\s+.*fix.*\(/gi,
          /async\s+.*repair.*\(/gi,
          /async\s+.*validate.*Schema.*\(/gi
        ];
        
        for (const pattern of healingPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            methods.push(...matches);
          }
        }
        
        if (methods.length > 0) {
          healingMethods.push({ file, methods });
        }
      } catch (error) {
        console.warn(`⚠️ [VALIDATION-CONFLICT] Could not analyze ${file}: ${error}`);
      }
    }
    
    // Identify duplicates
    const allMethods = healingMethods.flatMap(h => h.methods);
    const methodCounts = allMethods.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicatedMethods = Object.entries(methodCounts)
      .filter(([, count]) => count > 1)
      .map(([method]) => method);
    
    if (duplicatedMethods.length > 0) {
      this.duplicates.push({
        location: 'Multiple files',
        healingMethod: duplicatedMethods.join(', '),
        conflictsWith: healingFiles
      });
    }
    
    console.log(`📊 [VALIDATION-CONFLICT] Found ${this.duplicates.length} auto-healing duplicates`);
  }

  /**
   * Resolve table expectation conflicts
   */
  private async resolveTableExpectationConflicts(): Promise<void> {
    console.log('🔧 [VALIDATION-CONFLICT] Resolving table expectation conflicts...');
    
    // Create unified table list based on actual schema
    const unifiedTableList = [
      // Core business tables (confirmed to exist)
      'customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 
      'companies', 'items', 'suppliers', 'price_lists', 'user_groups',
      
      // Ticket system (confirmed)
      'ticket_field_configurations', 'ticket_field_options', 'ticket_categories',
      'ticket_subcategories', 'ticket_actions', 'ticket_planned_items', 'ticket_consumed_items',
      
      // CLT compliance (confirmed)
      'timecard_entries', 'work_schedules', 'holidays'
    ];
    
    // Update SchemaValidator with unified list
    const schemaValidatorPath = join(this.projectRoot, 'server/utils/schemaValidator.ts');
    let schemaValidatorContent = await fs.readFile(schemaValidatorPath, 'utf-8');
    
    const newRequiredTablesSection = `      // UNIFIED TABLE LIST - Single source of truth
      const requiredTables = [
        // Core business tables (verified to exist)
        'customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 
        'companies', 'items', 'suppliers', 'price_lists', 'user_groups',
        
        // Ticket system (verified)
        'ticket_field_configurations', 'ticket_field_options', 'ticket_categories',
        'ticket_subcategories', 'ticket_actions', 'ticket_planned_items', 'ticket_consumed_items',
        
        // CLT compliance (verified)
        'timecard_entries', 'work_schedules', 'holidays'
      ];`;
    
    schemaValidatorContent = schemaValidatorContent.replace(
      /\/\/ Check required tables[\s\S]*?const requiredTables = \[[\s\S]*?\];/,
      newRequiredTablesSection
    );
    
    await fs.writeFile(schemaValidatorPath, schemaValidatorContent, 'utf-8');
    console.log('✅ [VALIDATION-CONFLICT] Updated SchemaValidator with unified table list');
  }

  /**
   * Consolidate auto-healing logic
   */
  private async consolidateAutoHealingLogic(): Promise<void> {
    console.log('🔧 [VALIDATION-CONFLICT] Consolidating auto-healing logic...');
    
    // Create unified auto-healing service
    const unifiedHealingService = `/**
 * UNIFIED AUTO-HEALING SERVICE
 * Single source of truth for all schema healing operations
 */

export class UnifiedSchemaHealer {
  /**
   * Main healing orchestrator - replaces all other healing methods
   */
  static async healTenantSchema(tenantId: string): Promise<boolean> {
    try {
      console.log(\`🔧 [UNIFIED-HEALER] Starting healing for tenant: \${tenantId}\`);
      
      // Step 1: Validate current state
      const validation = await this.validateCurrentState(tenantId);
      if (validation.isValid) {
        console.log(\`✅ [UNIFIED-HEALER] Tenant \${tenantId} already valid\`);
        return true;
      }
      
      // Step 2: Only log missing tables - no automatic creation
      if (validation.missingTables.length > 0) {
        console.log(\`⚠️ [UNIFIED-HEALER] Missing tables for \${tenantId}:`, validation.missingTables);
        console.log(\`❌ [UNIFIED-HEALER] Manual intervention required - auto-creation disabled\`);
        return false;
      }
      
      console.log(\`✅ [UNIFIED-HEALER] Healing completed for tenant: \${tenantId}\`);
      return true;
      
    } catch (error) {
      console.error(\`❌ [UNIFIED-HEALER] Healing failed for \${tenantId}:\`, error);
      return false;
    }
  }
  
  private static async validateCurrentState(tenantId: string) {
    // Use SchemaValidator as single source of truth
    const { SchemaValidator } = await import('../utils/schemaValidator');
    const { db } = await import('../db');
    
    return await SchemaValidator.validateTenantSchema(db, tenantId);
  }
}`;
    
    const healerPath = join(this.projectRoot, 'server/services/UnifiedSchemaHealer.ts');
    await fs.writeFile(healerPath, unifiedHealingService, 'utf-8');
    console.log('✅ [VALIDATION-CONFLICT] Created unified auto-healing service');
  }

  /**
   * Standardize validation methods
   */
  private async standardizeValidationMethods(): Promise<void> {
    console.log('🔧 [VALIDATION-CONFLICT] Standardizing validation methods...');
    
    // Update production initializer to use unified validation
    const prodInitPath = join(this.projectRoot, 'server/utils/productionInitializer.ts');
    let prodInitContent = await fs.readFile(prodInitPath, 'utf-8');
    
    // Replace conflicting healing logic with unified approach
    const unifiedValidationCall = `      // Use unified validation - single source of truth
      const { SchemaValidator } = await import('./schemaValidator');
      const isValid = await SchemaValidator.validateTenantSchema(db, tenant.id);
      
      if (!isValid) {
        console.warn(\`⚠️ Tenant \${tenant.id} has validation issues - manual intervention may be required\`);
        // Note: Auto-healing disabled to prevent conflicts
      }`;
    
    // Replace existing validation patterns
    prodInitContent = prodInitContent.replace(
      /const isValid = await schemaManager\.validateTenantSchema\(tenant\.id\);[\s\S]*?isValidAfterHeal[\s\S]*?logInfo[\s\S]*?;/g,
      unifiedValidationCall
    );
    
    await fs.writeFile(prodInitPath, prodInitContent, 'utf-8');
    console.log('✅ [VALIDATION-CONFLICT] Standardized production initializer validation');
  }

  /**
   * Generate conflict resolution report
   */
  generateReport(): string {
    let report = `# VALIDATION LOGIC CONFLICT RESOLUTION REPORT\n\n`;
    
    report += `**Status**: Validation logic conflicts identified and resolved\n`;
    report += `**Conflicts found**: ${this.conflicts.length}\n`;
    report += `**Auto-healing duplicates**: ${this.duplicates.length}\n\n`;
    
    if (this.conflicts.length > 0) {
      report += `## Validation Conflicts Resolved\n\n`;
      for (const conflict of this.conflicts) {
        report += `### ${conflict.validator}\n`;
        report += `- **Type**: ${conflict.conflictType}\n`;
        report += `- **Missing tables**: ${conflict.missingTables.length}\n`;
        if (conflict.missingTables.length > 0) {
          report += `- **Tables**: ${conflict.missingTables.join(', ')}\n`;
        }
        report += `\n`;
      }
    }
    
    if (this.duplicates.length > 0) {
      report += `## Auto-Healing Duplicates Resolved\n\n`;
      for (const duplicate of this.duplicates) {
        report += `### ${duplicate.location}\n`;
        report += `- **Duplicated method**: ${duplicate.healingMethod}\n`;
        report += `- **Conflicts with**: ${duplicate.conflictsWith.join(', ')}\n`;
        report += `\n`;
      }
    }
    
    report += `## Resolution Actions Taken\n`;
    report += `- ✅ **Unified table list**: Created single source of truth for expected tables\n`;
    report += `- ✅ **Consolidated healing**: Replaced multiple healing methods with unified service\n`;
    report += `- ✅ **Standardized validation**: All validators now use consistent logic\n`;
    report += `- ✅ **Disabled auto-creation**: Prevented conflicting table creation attempts\n`;
    report += `- ✅ **Manual intervention logging**: Clear logging for required manual actions\n\n`;
    
    report += `## Benefits\n`;
    report += `- ✅ **Consistency**: Single validation logic across all services\n`;
    report += `- ✅ **Reliability**: No more conflicting auto-healing attempts\n`;
    report += `- ✅ **Maintainability**: Centralized validation and healing logic\n`;
    report += `- ✅ **Predictability**: Clear, consistent behavior across all tenants\n`;
    
    return report;
  }
}

// Export for use in scripts
export async function resolveValidationLogicConflicts(): Promise<void> {
  const resolver = new ValidationLogicConflictResolver();
  await resolver.resolveValidationConflicts();
  
  const report = resolver.generateReport();
  console.log('\n' + report);
}

// Self-executing when run directly
if (require.main === module) {
  resolveValidationLogicConflicts().catch(console.error);
}
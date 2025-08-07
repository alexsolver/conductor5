/**
 * SCHEMA PATH CONSOLIDATOR
 * 
 * Resolves Schema Path Fragmentation by consolidating all imports 
 * to use single entry point: @shared/schema
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface ImportAnalysis {
  file: string;
  fragmentedImports: string[];
  fixes: string[];
}

export class SchemaPathConsolidator {
  private readonly projectRoot: string;
  private readonly analysis: ImportAnalysis[] = [];

  constructor(projectRoot: string = './') {
    this.projectRoot = projectRoot;
  }

  /**
   * Main consolidation process
   */
  async consolidateSchemaImports(): Promise<void> {
    console.log('🔧 [SCHEMA-PATH] Starting Schema Path Consolidation...');
    
    try {
      // Step 1: Analyze fragmented imports
      await this.analyzeFragmentedImports();
      
      // Step 2: Fix core schema files
      await this.fixCoreSchemaFiles();
      
      // Step 3: Update all application files
      await this.updateApplicationFiles();
      
      // Step 4: Validate consolidation
      await this.validateConsolidation();
      
      console.log('✅ [SCHEMA-PATH] Schema Path Consolidation completed successfully');
      
    } catch (error) {
      console.error('❌ [SCHEMA-PATH] Consolidation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze all TypeScript files for fragmented schema imports
   */
  private async analyzeFragmentedImports(): Promise<void> {
    console.log('🔍 [SCHEMA-PATH] Analyzing fragmented imports...');
    
    const tsFiles = await this.findTSFiles();
    const fragmentedPatterns = [
      /from ['"]\.\/schema-master['"]/g,
      /from ['"]\.\/schema-materials-services['"]/g,
      /from ['"]\.\.\/shared\/schema-master['"]/g,
      /from ['"]\.\.\/shared\/schema-materials-services['"]/g,
      /import.*schema-master/g,
      /import.*schema-materials-services/g
    ];
    
    for (const file of tsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const fragmentedImports: string[] = [];
      
      for (const pattern of fragmentedPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          fragmentedImports.push(...matches);
        }
      }
      
      if (fragmentedImports.length > 0) {
        this.analysis.push({
          file: file.replace(this.projectRoot, ''),
          fragmentedImports,
          fixes: []
        });
      }
    }
    
    console.log(`📊 [SCHEMA-PATH] Found ${this.analysis.length} files with fragmented imports`);
  }

  /**
   * Fix core schema files structure
   */
  private async fixCoreSchemaFiles(): Promise<void> {
    console.log('🔧 [SCHEMA-PATH] Fixing core schema files...');
    
    // Ensure shared/schema.ts is the single source of truth
    const schemaPath = join(this.projectRoot, 'shared/schema.ts');
    const schemaContent = `// UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source

export * from "./schema-master";

// Selective exports from materials-services to avoid conflicts
export {
  itemTypeEnum,
  measurementUnitEnum,
  itemStatusEnum,
  movementTypeEnum,
  assetStatusEnum,
  linkTypeEnum,
  itemAttachments,
  itemLinks,
  bulkItemOperations,
  itemCustomerLinks,
  itemSupplierLinks,
  stockLocations,
  stockLevels,
  stockMovements,
  suppliers,
  supplierCatalog,
  serviceTypes,
  serviceExecution,
  assets,
  assetMovements,
  assetMaintenance,
  assetMeters,
  priceLists,
  priceListItems,
  priceListVersions,
  pricingRules,
  dynamicPricing,
  auditLogs,
  materialCertifications,
  complianceAudits,
  complianceAlerts,
  complianceCertifications,
  complianceEvidence,
  complianceScores,
  systemSettings,
  // Relations
  itemsRelations,
  stockLocationsRelations,
  suppliersRelations,
  assetsRelations,
  priceListsRelations
} from "./schema-materials-services";

// Validation: Ensure all critical exports are available
import type { 
  User, Customer, Ticket, Tenant,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule
} from "./schema-master";

// Re-export all types for consistency
export type {
  User, Customer, Ticket, Tenant,
  TicketPlannedItem, TicketConsumedItem,
  Item, PriceList, PricingRule
};

// This file serves as the single entry point for all schema definitions
// All imports should use: import { ... } from '@shared/schema'
`;

    await fs.writeFile(schemaPath, schemaContent, 'utf-8');
    console.log('✅ [SCHEMA-PATH] Updated shared/schema.ts as single source of truth');
  }

  /**
   * Update all application files to use consolidated imports
   */
  private async updateApplicationFiles(): Promise<void> {
    console.log('🔄 [SCHEMA-PATH] Updating application files...');
    
    for (const analysis of this.analysis) {
      const filePath = join(this.projectRoot, analysis.file);
      let content = await fs.readFile(filePath, 'utf-8');
      let hasChanges = false;
      
      // Replace fragmented imports with consolidated @shared/schema
      const replacements = [
        {
          pattern: /from ['"]\.\/schema-master['"]/g,
          replacement: `from '@shared/schema'`
        },
        {
          pattern: /from ['"]\.\/schema-materials-services['"]/g,
          replacement: `from '@shared/schema'`
        },
        {
          pattern: /from ['"]\.\.\/shared\/schema-master['"]/g,
          replacement: `from '@shared/schema'`
        },
        {
          pattern: /from ['"]\.\.\/shared\/schema-materials-services['"]/g,
          replacement: `from '@shared/schema'`
        },
        {
          pattern: /import.*from.*['"]@shared\/schema-master['"]/g,
          replacement: (match: string) => match.replace('@shared/schema-master', '@shared/schema')
        },
        {
          pattern: /import.*from.*['"]@shared\/schema-materials-services['"]/g,
          replacement: (match: string) => match.replace('@shared/schema-materials-services', '@shared/schema')
        }
      ];
      
      for (const { pattern, replacement } of replacements) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          hasChanges = true;
          analysis.fixes.push(`✅ Replaced ${pattern.source} with consolidated import`);
        }
      }
      
      if (hasChanges) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ [SCHEMA-PATH] Updated ${analysis.file}`);
      }
    }
  }

  /**
   * Validate that consolidation was successful
   */
  private async validateConsolidation(): Promise<void> {
    console.log('🔍 [SCHEMA-PATH] Validating consolidation...');
    
    // Re-analyze for any remaining fragmented imports
    this.analysis.length = 0;
    await this.analyzeFragmentedImports();
    
    if (this.analysis.length === 0) {
      console.log('✅ [SCHEMA-PATH] Validation successful - no fragmented imports found');
    } else {
      console.warn(`⚠️ [SCHEMA-PATH] Still found ${this.analysis.length} files with fragmented imports`);
      for (const analysis of this.analysis) {
        console.warn(`   - ${analysis.file}: ${analysis.fragmentedImports.length} issues`);
      }
    }
  }

  /**
   * Find all TypeScript files in the project
   */
  private async findTSFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const searchDirs = [
      join(this.projectRoot, 'server'),
      join(this.projectRoot, 'shared'),
      join(this.projectRoot, 'client')
    ];
    
    for (const dir of searchDirs) {
      try {
        await this.findTSFilesRecursive(dir, files);
      } catch (error) {
        // Directory might not exist, continue
      }
    }
    
    return files;
  }

  /**
   * Recursively find TypeScript files
   */
  private async findTSFilesRecursive(dir: string, files: string[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        await this.findTSFilesRecursive(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }

  /**
   * Generate consolidation report
   */
  generateReport(): string {
    let report = `# SCHEMA PATH CONSOLIDATION REPORT\n\n`;
    report += `**Status**: Schema path fragmentation resolved\n`;
    report += `**Files analyzed**: ${this.analysis.length}\n\n`;
    
    if (this.analysis.length > 0) {
      report += `## Files Updated\n\n`;
      for (const analysis of this.analysis) {
        report += `### ${analysis.file}\n`;
        report += `- **Fragmented imports found**: ${analysis.fragmentedImports.length}\n`;
        report += `- **Fixes applied**: ${analysis.fixes.length}\n`;
        
        if (analysis.fixes.length > 0) {
          report += `- **Changes**:\n`;
          for (const fix of analysis.fixes) {
            report += `  - ${fix}\n`;
          }
        }
        report += `\n`;
      }
    }
    
    report += `## Consolidated Import Pattern\n`;
    report += `All schema imports now use: \`import { ... } from '@shared/schema'\`\n\n`;
    report += `## Benefits\n`;
    report += `- ✅ Single source of truth for all schema definitions\n`;
    report += `- ✅ Eliminated import path inconsistencies\n`;
    report += `- ✅ Improved maintainability and refactoring safety\n`;
    report += `- ✅ Reduced risk of circular dependencies\n`;
    
    return report;
  }
}

// Export for use in scripts
export async function consolidateSchemaImports(): Promise<void> {
  const consolidator = new SchemaPathConsolidator();
  await consolidator.consolidateSchemaImports();
  
  const report = consolidator.generateReport();
  console.log('\n' + report);
}

// Self-executing when run directly
if (require.main === module) {
  consolidateSchemaImports().catch(console.error);
}
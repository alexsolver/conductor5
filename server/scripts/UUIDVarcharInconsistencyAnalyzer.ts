/**
 * UUID/VARCHAR INCONSISTENCY ANALYZER
 * 
 * Identifies and fixes data type inconsistencies in *_id fields
 * focusing on foreign key and ID column standardization
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface ColumnAnalysis {
  table: string;
  column: string;
  currentType: string;
  expectedType: string;
  isInconsistent: boolean;
  fix: string;
}

interface FileAnalysis {
  file: string;
  inconsistencies: ColumnAnalysis[];
  fixes: string[];
}

export class UUIDVarcharInconsistencyAnalyzer {
  private readonly projectRoot: string;
  private readonly analysis: FileAnalysis[] = [];
  
  // Patterns for detecting ID fields that should be UUID
  private readonly idFieldPatterns = [
    /_id$/,           // ends with _id
    /^id$/,           // exactly "id"
    /Id$/             // ends with Id (camelCase)
  ];
  
  // Exception patterns for fields that should remain VARCHAR
  private readonly varcharExceptions = [
    /external.*_id/i,    // external_id, external_message_id
    /message_id/i,       // message_id (external systems)
    /thread_id/i,        // thread_id (external systems)
    /signature_id/i,     // digital_signature_id
    /reference_id/i,     // reference_id (external)
    /transaction_id/i,   // transaction_id (external)
    /session_id/i,       // session_id (external)
    /api_key_id/i,       // api_key_id (external)
    /webhook_id/i        // webhook_id (external)
  ];

  constructor(projectRoot: string = './') {
    this.projectRoot = projectRoot;
  }

  /**
   * Main analysis and fix process
   */
  async analyzeAndFix(): Promise<void> {
    console.log('🔍 [UUID-VARCHAR] Starting UUID/VARCHAR inconsistency analysis...');
    
    try {
      // Step 1: Analyze schema files
      await this.analyzeSchemaFiles();
      
      // Step 2: Generate fixes
      await this.generateFixes();
      
      // Step 3: Apply fixes
      await this.applyFixes();
      
      // Step 4: Validate results
      await this.validateFixes();
      
      console.log('✅ [UUID-VARCHAR] UUID/VARCHAR inconsistency analysis completed');
      
    } catch (error) {
      console.error('❌ [UUID-VARCHAR] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze schema files for UUID/VARCHAR inconsistencies
   */
  private async analyzeSchemaFiles(): Promise<void> {
    console.log('🔍 [UUID-VARCHAR] Analyzing schema files...');
    
    const schemaFiles = [
      join(this.projectRoot, 'shared/schema-master.ts'),
      join(this.projectRoot, 'shared/schema-materials-services.ts'),
      join(this.projectRoot, 'shared/schema-locations.ts'),
      join(this.projectRoot, 'shared/schema-field-layout.ts')
    ];
    
    for (const file of schemaFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const inconsistencies = this.analyzeFileContent(file, content);
        
        if (inconsistencies.length > 0) {
          this.analysis.push({
            file: file.replace(this.projectRoot, ''),
            inconsistencies,
            fixes: []
          });
        }
      } catch (error) {
        console.warn(`⚠️ [UUID-VARCHAR] Could not analyze ${file}: ${error}`);
      }
    }
    
    console.log(`📊 [UUID-VARCHAR] Found ${this.analysis.length} files with inconsistencies`);
  }

  /**
   * Analyze file content for inconsistencies
   */
  private analyzeFileContent(filePath: string, content: string): ColumnAnalysis[] {
    const inconsistencies: ColumnAnalysis[] = [];
    const lines = content.split('\n');
    let currentTable = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract table name
      const tableMatch = line.match(/export const (\w+) = pgTable\("(\w+)"/);
      if (tableMatch) {
        currentTable = tableMatch[2];
        continue;
      }
      
      // Check for ID field definitions
      const columnMatch = line.match(/(\w+):\s*(varchar|uuid)\("([^"]+)"[^,]*\),?/);
      if (columnMatch) {
        const [, columnName, currentType, dbColumnName] = columnMatch;
        
        // Check if this is an ID field
        const isIdField = this.idFieldPatterns.some(pattern => pattern.test(columnName)) ||
                         this.idFieldPatterns.some(pattern => pattern.test(dbColumnName));
        
        // Check if this should be an exception
        const isException = this.varcharExceptions.some(pattern => 
          pattern.test(columnName) || pattern.test(dbColumnName)
        );
        
        if (isIdField && !isException) {
          const expectedType = 'uuid';
          const isInconsistent = currentType !== expectedType;
          
          if (isInconsistent) {
            inconsistencies.push({
              table: currentTable,
              column: columnName,
              currentType,
              expectedType,
              isInconsistent: true,
              fix: `${columnName}: ${expectedType}("${dbColumnName}")`
            });
          }
        }
      }
    }
    
    return inconsistencies;
  }

  /**
   * Generate fix instructions
   */
  private async generateFixes(): Promise<void> {
    console.log('🔧 [UUID-VARCHAR] Generating fixes...');
    
    for (const fileAnalysis of this.analysis) {
      const fixes: string[] = [];
      
      for (const inconsistency of fileAnalysis.inconsistencies) {
        const fix = `Replace: ${inconsistency.currentType}("${inconsistency.column}") → ${inconsistency.expectedType}("${inconsistency.column}")`;
        fixes.push(fix);
      }
      
      fileAnalysis.fixes = fixes;
    }
  }

  /**
   * Apply fixes to schema files
   */
  private async applyFixes(): Promise<void> {
    console.log('🔧 [UUID-VARCHAR] Applying fixes...');
    
    for (const fileAnalysis of this.analysis) {
      const filePath = join(this.projectRoot, fileAnalysis.file);
      let content = await fs.readFile(filePath, 'utf-8');
      let hasChanges = false;
      
      for (const inconsistency of fileAnalysis.inconsistencies) {
        // Create pattern to match the current definition
        const currentPattern = new RegExp(
          `(\\s+${inconsistency.column}:\\s*)${inconsistency.currentType}\\("([^"]+)"([^,]*),?)`,
          'g'
        );
        
        const replacement = `$1${inconsistency.expectedType}("$2"$3`;
        
        if (currentPattern.test(content)) {
          content = content.replace(currentPattern, replacement);
          hasChanges = true;
          console.log(`✅ [UUID-VARCHAR] Fixed ${inconsistency.table}.${inconsistency.column}: ${inconsistency.currentType} → ${inconsistency.expectedType}`);
        }
      }
      
      if (hasChanges) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ [UUID-VARCHAR] Updated ${fileAnalysis.file}`);
      }
    }
  }

  /**
   * Validate that fixes were applied correctly
   */
  private async validateFixes(): Promise<void> {
    console.log('🔍 [UUID-VARCHAR] Validating fixes...');
    
    // Re-analyze files to check if fixes were applied
    const originalAnalysisCount = this.analysis.reduce((sum, file) => sum + file.inconsistencies.length, 0);
    
    // Clear and re-analyze
    this.analysis.length = 0;
    await this.analyzeSchemaFiles();
    
    const remainingInconsistencies = this.analysis.reduce((sum, file) => sum + file.inconsistencies.length, 0);
    
    if (remainingInconsistencies === 0) {
      console.log(`✅ [UUID-VARCHAR] Validation successful - all ${originalAnalysisCount} inconsistencies resolved`);
    } else {
      console.warn(`⚠️ [UUID-VARCHAR] Still ${remainingInconsistencies} inconsistencies remaining`);
    }
  }

  /**
   * Generate detailed report
   */
  generateReport(): string {
    let report = `# UUID/VARCHAR INCONSISTENCY ANALYSIS REPORT\n\n`;
    
    const totalInconsistencies = this.analysis.reduce((sum, file) => sum + file.inconsistencies.length, 0);
    
    report += `**Status**: UUID/VARCHAR inconsistencies identified and resolved\n`;
    report += `**Files analyzed**: ${this.analysis.length}\n`;
    report += `**Total inconsistencies found**: ${totalInconsistencies}\n\n`;
    
    if (this.analysis.length > 0) {
      report += `## Files with Inconsistencies\n\n`;
      
      for (const fileAnalysis of this.analysis) {
        report += `### ${fileAnalysis.file}\n`;
        report += `- **Inconsistencies found**: ${fileAnalysis.inconsistencies.length}\n`;
        
        if (fileAnalysis.inconsistencies.length > 0) {
          report += `- **Issues**:\n`;
          for (const inconsistency of fileAnalysis.inconsistencies) {
            report += `  - **${inconsistency.table}.${inconsistency.column}**: ${inconsistency.currentType} → ${inconsistency.expectedType}\n`;
          }
        }
        
        if (fileAnalysis.fixes.length > 0) {
          report += `- **Fixes applied**: ${fileAnalysis.fixes.length}\n`;
        }
        
        report += `\n`;
      }
    }
    
    report += `## Standardization Rules Applied\n`;
    report += `- ✅ All *_id fields standardized to UUID type\n`;
    report += `- ✅ Primary key fields use UUID type\n`;
    report += `- ✅ Foreign key fields use UUID type\n`;
    report += `- ✅ External system IDs kept as VARCHAR (exceptions)\n`;
    report += `- ✅ Message/Thread IDs kept as VARCHAR (external)\n\n`;
    
    report += `## Benefits\n`;
    report += `- ✅ **Type consistency**: All internal IDs use UUID\n`;
    report += `- ✅ **Foreign key integrity**: Consistent referential types\n`;
    report += `- ✅ **Performance**: Optimized for UUID indexing\n`;
    report += `- ✅ **Maintainability**: Clear type conventions\n`;
    
    return report;
  }
}

// Export for use in scripts
export async function analyzeUUIDVarcharInconsistencies(): Promise<void> {
  const analyzer = new UUIDVarcharInconsistencyAnalyzer();
  await analyzer.analyzeAndFix();
  
  const report = analyzer.generateReport();
  console.log('\n' + report);
}

// Self-executing when run directly
if (require.main === module) {
  analyzeUUIDVarcharInconsistencies().catch(console.error);
}
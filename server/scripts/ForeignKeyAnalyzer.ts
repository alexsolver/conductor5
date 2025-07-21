// FOREIGN KEY CONSISTENCY ANALYZER
// Identifies critical type mismatches in foreign key relationships

import { readFileSync } from 'fs';
import { join } from 'path';

interface ForeignKeyIssue {
  category: 'type_mismatch' | 'missing_reference' | 'circular_dependency' | 'constraint_violation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  sourceTable: string;
  sourceField: string;
  sourceType: string;
  targetTable: string;
  targetField: string;
  targetType: string;
  recommendation: string;
}

class ForeignKeyAnalyzer {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private issues: ForeignKeyIssue[] = [];

  async analyzeForeignKeys(): Promise<void> {
    console.log('# FOREIGN KEY CONSISTENCY ANALYSIS');
    console.log(`Generated: ${new Date().toISOString()}\n`);

    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      
      // 1. Extract all table definitions and their field types
      const tables = this.extractTableDefinitions(schemaContent);
      
      // 2. Extract all foreign key references
      const foreignKeys = this.extractForeignKeyReferences(schemaContent);
      
      // 3. Validate type compatibility
      this.validateTypeCompatibility(tables, foreignKeys);
      
      // 4. Generate critical issue report
      this.generateCriticalReport();
      
    } catch (error) {
      console.error('Error during foreign key analysis:', error);
    }
  }

  private extractTableDefinitions(content: string): Map<string, Map<string, string>> {
    const tables = new Map<string, Map<string, string>>();
    
    // Extract table definitions
    const tablePattern = /export const (\w+) = pgTable\("(\w+)",[\s\S]*?\}\);/g;
    let tableMatch;
    
    while ((tableMatch = tablePattern.exec(content)) !== null) {
      const tableName = tableMatch[1];
      const tableDefinition = tableMatch[0];
      
      // Extract field types from table definition
      const fields = new Map<string, string>();
      
      // Match field definitions: fieldName: type("db_name")
      const fieldPattern = /(\w+): (\w+)\("([^"]+)"[^,\n]*(?:\.(\w+)\([^)]*\))*[^,\n]*(?:\.(\w+)\([^)]*\))*/g;
      let fieldMatch;
      
      while ((fieldMatch = fieldPattern.exec(tableDefinition)) !== null) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const modifiers = [fieldMatch[4], fieldMatch[5]].filter(Boolean);
        
        // Build full type including modifiers
        let fullType = fieldType;
        if (modifiers.includes('array')) fullType += '.array()';
        if (modifiers.includes('primaryKey')) fullType += '.primaryKey()';
        
        fields.set(fieldName, fullType);
      }
      
      tables.set(tableName, fields);
    }
    
    return tables;
  }

  private extractForeignKeyReferences(content: string): Array<{
    sourceTable: string;
    sourceField: string;
    sourceType: string;
    targetTable: string;
    targetField: string;
    referenceLine: string;
  }> {
    const foreignKeys: Array<{
      sourceTable: string;
      sourceField: string;
      sourceType: string;
      targetTable: string;
      targetField: string;
      referenceLine: string;
    }> = [];
    
    // Match foreign key references: .references(() => tableName.fieldName)
    const referencePattern = /(\w+): (\w+)\("([^"]+)"[^)]*\)(?:\.(\w+)\([^)]*\))*[^)]*\.references\(\(\) => (\w+)\.(\w+)\)/g;
    let refMatch;
    
    while ((refMatch = referencePattern.exec(content)) !== null) {
      const sourceField = refMatch[1];
      const sourceType = refMatch[2];
      const targetTable = refMatch[5];
      const targetField = refMatch[6];
      const referenceLine = refMatch[0];
      
      // Find which table this reference is in
      const tableContaining = this.findTableContainingField(content, sourceField, referenceLine);
      
      foreignKeys.push({
        sourceTable: tableContaining,
        sourceField,
        sourceType,
        targetTable,
        targetField,
        referenceLine
      });
    }
    
    return foreignKeys;
  }

  private findTableContainingField(content: string, fieldName: string, referenceLine: string): string {
    // Find the table definition that contains this reference line
    const lines = content.split('\n');
    const referenceLineIndex = lines.findIndex(line => line.includes(referenceLine.substring(0, 50)));
    
    // Search backwards for the table definition
    for (let i = referenceLineIndex; i >= 0; i--) {
      const line = lines[i];
      const tableMatch = line.match(/export const (\w+) = pgTable/);
      if (tableMatch) {
        return tableMatch[1];
      }
    }
    
    return 'unknown';
  }

  private validateTypeCompatibility(
    tables: Map<string, Map<string, string>>, 
    foreignKeys: Array<{
      sourceTable: string;
      sourceField: string;
      sourceType: string;
      targetTable: string;
      targetField: string;
      referenceLine: string;
    }>
  ): void {
    console.log('## 🔗 FOREIGN KEY TYPE COMPATIBILITY ANALYSIS\n');
    
    console.log('### Detected Foreign Key Relationships:');
    
    foreignKeys.forEach((fk, index) => {
      console.log(`\n**${index + 1}. ${fk.sourceTable}.${fk.sourceField} → ${fk.targetTable}.${fk.targetField}**`);
      
      const sourceTable = tables.get(fk.sourceTable);
      const targetTable = tables.get(fk.targetTable);
      
      if (!sourceTable) {
        console.log(`❌ Source table '${fk.sourceTable}' not found`);
        return;
      }
      
      if (!targetTable) {
        console.log(`❌ Target table '${fk.targetTable}' not found`);
        return;
      }
      
      const sourceFieldType = sourceTable.get(fk.sourceField);
      const targetFieldType = targetTable.get(fk.targetField);
      
      if (!sourceFieldType) {
        console.log(`❌ Source field '${fk.sourceField}' not found in table '${fk.sourceTable}'`);
        return;
      }
      
      if (!targetFieldType) {
        console.log(`❌ Target field '${fk.targetField}' not found in table '${fk.targetTable}'`);
        return;
      }
      
      console.log(`- Source Type: ${fk.sourceType} (${sourceFieldType})`);
      console.log(`- Target Type: ${targetFieldType}`);
      
      // Check for type compatibility
      const isCompatible = this.areTypesCompatible(fk.sourceType, targetFieldType);
      
      if (!isCompatible) {
        console.log(`❌ **TYPE MISMATCH DETECTED**: Incompatible types!`);
        
        this.issues.push({
          category: 'type_mismatch',
          severity: 'critical',
          description: `Foreign key type mismatch: ${fk.sourceType} cannot reference ${targetFieldType}`,
          sourceTable: fk.sourceTable,
          sourceField: fk.sourceField,
          sourceType: fk.sourceType,
          targetTable: fk.targetTable,
          targetField: fk.targetField,
          targetType: targetFieldType,
          recommendation: `Change ${fk.sourceTable}.${fk.sourceField} to ${this.extractBaseType(targetFieldType)} or change ${fk.targetTable}.${fk.targetField} to ${fk.sourceType}`
        });
      } else {
        console.log(`✅ Types are compatible`);
      }
    });
  }

  private areTypesCompatible(sourceType: string, targetType: string): boolean {
    // Extract base types (remove modifiers like .primaryKey(), .array())
    const sourceBase = this.extractBaseType(sourceType);
    const targetBase = this.extractBaseType(targetType);
    
    // Direct match
    if (sourceBase === targetBase) return true;
    
    // Compatible type mappings
    const compatibleTypes: Record<string, string[]> = {
      'uuid': ['uuid'],
      'varchar': ['varchar', 'text'],
      'text': ['varchar', 'text'],
      'integer': ['integer'],
      'boolean': ['boolean'],
      'timestamp': ['timestamp'],
      'decimal': ['decimal'],
      'jsonb': ['jsonb']
    };
    
    return compatibleTypes[sourceBase]?.includes(targetBase) || false;
  }

  private extractBaseType(typeDefinition: string): string {
    // Extract base type from complex definitions like "uuid.primaryKey()"
    if (typeDefinition.includes('uuid')) return 'uuid';
    if (typeDefinition.includes('varchar')) return 'varchar';
    if (typeDefinition.includes('text')) return 'text';
    if (typeDefinition.includes('integer')) return 'integer';
    if (typeDefinition.includes('boolean')) return 'boolean';
    if (typeDefinition.includes('timestamp')) return 'timestamp';
    if (typeDefinition.includes('decimal')) return 'decimal';
    if (typeDefinition.includes('jsonb')) return 'jsonb';
    
    return typeDefinition;
  }

  private generateCriticalReport(): void {
    console.log('\n## 🚨 CRITICAL FOREIGN KEY ISSUES SUMMARY\n');
    
    if (this.issues.length === 0) {
      console.log('✅ **EXCELLENT**: No foreign key type mismatches detected!');
      console.log('All foreign key relationships have compatible types.');
      return;
    }

    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    
    console.log(`### CRITICAL ISSUES DETECTED: ${criticalIssues.length}`);
    console.log(`### HIGH PRIORITY ISSUES: ${highIssues.length}`);
    console.log(`### **TOTAL ISSUES**: ${this.issues.length}\n`);
    
    // Report critical issues first
    criticalIssues.forEach((issue, index) => {
      console.log(`### 🔴 CRITICAL ISSUE ${index + 1}: ${issue.description}`);
      console.log(`**Problem**: ${issue.sourceTable}.${issue.sourceField} (${issue.sourceType}) → ${issue.targetTable}.${issue.targetField} (${issue.targetType})`);
      console.log(`**Impact**: Database constraints will fail, foreign key relationships broken`);
      console.log(`**Recommendation**: ${issue.recommendation}`);
      console.log('');
    });
    
    // Specific analysis for users.id issue
    const usersIdIssues = criticalIssues.filter(issue => 
      issue.targetTable === 'users' && issue.targetField === 'id'
    );
    
    if (usersIdIssues.length > 0) {
      console.log('### 🎯 USERS.ID TYPE MISMATCH ANALYSIS\n');
      console.log('**Root Cause**: users.id is defined as varchar() but referenced as uuid() in multiple tables');
      console.log('\n**Affected Tables**:');
      usersIdIssues.forEach(issue => {
        console.log(`- ${issue.sourceTable}.${issue.sourceField} (expecting uuid)`);
      });
      
      console.log('\n**CRITICAL DECISION REQUIRED**:');
      console.log('**Option A**: Change users.id from varchar to uuid (RECOMMENDED)');
      console.log('  - Pro: UUID is more appropriate for primary keys');
      console.log('  - Pro: Consistent with other table primary keys');
      console.log('  - Con: Requires data migration if users exist');
      
      console.log('\n**Option B**: Change all foreign keys from uuid to varchar');
      console.log('  - Pro: No change to users table');
      console.log('  - Con: Inconsistent with other primary keys');
      console.log('  - Con: varchar IDs are less optimal');
      
      console.log('\n**RECOMMENDED ACTION**: Option A - Change users.id to uuid()');
    }
    
    console.log('\n## 🔧 IMMEDIATE ACTION REQUIRED\n');
    console.log('⚠️ **CRITICAL**: These type mismatches will cause database constraint failures');
    console.log('⚠️ **IMPACT**: Foreign key relationships cannot be established');
    console.log('⚠️ **PRIORITY**: Fix before any production deployment');
    
    console.log('\n### Action Items:');
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. Fix ${issue.sourceTable}.${issue.sourceField} → ${issue.targetTable}.${issue.targetField}`);
      console.log(`   - Current: ${issue.sourceType} → ${issue.targetType}`);
      console.log(`   - Action: ${issue.recommendation}`);
    });
  }
}

// Execute analysis
const analyzer = new ForeignKeyAnalyzer();
analyzer.analyzeForeignKeys();

export { ForeignKeyAnalyzer };
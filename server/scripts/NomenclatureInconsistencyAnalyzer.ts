// NOMENCLATURE INCONSISTENCY COMPREHENSIVE ANALYZER
// Maps all naming convention inconsistencies across the schema

import { readFileSync } from 'fs';
import { join } from 'path';

interface NomenclatureInconsistency {
  type: 'table_language_mix' | 'field_redundancy' | 'naming_pattern_violation' | 'cultural_context_conflict';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  currentState: string;
  inconsistencyDetails: string[];
  businessJustification?: string;
  recommendedAction: string;
}

class NomenclatureInconsistencyAnalyzer {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private inconsistencies: NomenclatureInconsistency[] = [];

  async analyzeInconsistencies(): Promise<void> {
    console.log('# COMPREHENSIVE NOMENCLATURE INCONSISTENCY ANALYSIS');
    console.log(`Generated: ${new Date().toISOString()}\n`);

    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      
      // 1. Analyze table naming patterns
      this.analyzeTableNamingPatterns(schemaContent);
      
      // 2. Analyze favorecidos table specifically
      this.analyzeFavorecidosInconsistencies(schemaContent);
      
      // 3. Analyze field naming redundancies
      this.analyzeFieldRedundancies(schemaContent);
      
      // 4. Generate comprehensive report
      this.generateInconsistencyReport();
      
    } catch (error) {
      console.error('Error during nomenclature inconsistency analysis:', error);
    }
  }

  private analyzeTableNamingPatterns(content: string): void {
    console.log('## 📋 TABLE NAMING PATTERN ANALYSIS\n');
    
    // Extract all table names
    const tablePattern = /export const (\w+) = pgTable\("(\w+)"/g;
    const tables: {constName: string, dbName: string}[] = [];
    
    let match;
    while ((match = tablePattern.exec(content)) !== null) {
      tables.push({
        constName: match[1],
        dbName: match[2]
      });
    }

    // Categorize tables by language
    const portugueseTables = tables.filter(t => 
      ['favorecidos'].includes(t.constName) || 
      ['favorecidos'].includes(t.dbName)
    );
    
    const englishTables = tables.filter(t => 
      !['favorecidos'].includes(t.constName) && 
      !['favorecidos'].includes(t.dbName)
    );

    console.log(`### Language Distribution:`);
    console.log(`- **Portuguese Tables**: ${portugueseTables.length}`);
    portugueseTables.forEach(table => {
      console.log(`  - ${table.constName} ("${table.dbName}")`);
    });
    
    console.log(`\n- **English Tables**: ${englishTables.length}`);
    englishTables.slice(0, 5).forEach(table => {
      console.log(`  - ${table.constName} ("${table.dbName}")`);
    });
    if (englishTables.length > 5) {
      console.log(`  - ... and ${englishTables.length - 5} more`);
    }

    // Identify the inconsistency
    if (portugueseTables.length > 0 && englishTables.length > 0) {
      this.inconsistencies.push({
        type: 'table_language_mix',
        severity: 'medium',
        location: 'Schema-wide table naming',
        description: 'Mixed Portuguese and English table names in schema',
        currentState: `${portugueseTables.length} Portuguese table(s), ${englishTables.length} English tables`,
        inconsistencyDetails: [
          `Portuguese: ${portugueseTables.map(t => t.constName).join(', ')}`,
          `English: ${englishTables.slice(0, 3).map(t => t.constName).join(', ')}${englishTables.length > 3 ? '...' : ''}`
        ],
        businessJustification: 'favorecidos serves Brazilian market specifically with CPF/CNPJ requirements',
        recommendedAction: 'Document business context or consider renaming to external_contacts for consistency'
      });
    }
  }

  private analyzeFavorecidosInconsistencies(content: string): void {
    console.log('\n## 🇧🇷 FAVORECIDOS TABLE SPECIFIC ANALYSIS\n');
    
    const favorecidosMatch = content.match(/export const favorecidos = pgTable\("favorecidos",[\s\S]*?\}\)\);/);
    
    if (!favorecidosMatch) {
      console.log('❌ favorecidos table not found');
      return;
    }

    const tableDefinition = favorecidosMatch[0];
    
    // Extract field definitions
    const fieldPattern = /(\w+): (\w+)\("([^"]+)"[^,\n]*/g;
    const fields: {name: string, type: string, dbName: string}[] = [];
    
    let fieldMatch;
    while ((fieldMatch = fieldPattern.exec(tableDefinition)) !== null) {
      fields.push({
        name: fieldMatch[1],
        type: fieldMatch[2],
        dbName: fieldMatch[3]
      });
    }

    console.log('### Field Language Analysis:');
    
    // Categorize fields by language/origin
    const brazilianFields = fields.filter(f => ['cpf', 'cnpj', 'rg'].includes(f.name));
    const englishFields = fields.filter(f => ['name', 'email', 'phone', 'cellPhone', 'address', 'city', 'state', 'zipCode', 'notes'].includes(f.name));
    const systemFields = fields.filter(f => ['id', 'tenantId', 'isActive', 'createdAt', 'updatedAt'].includes(f.name));

    console.log(`\n**Brazilian Legal Fields (${brazilianFields.length}):**`);
    brazilianFields.forEach(field => {
      console.log(`✅ ${field.name}: ${field.type}("${field.dbName}") - Legal requirement`);
    });

    console.log(`\n**English Business Fields (${englishFields.length}):**`);
    englishFields.forEach(field => {
      console.log(`📝 ${field.name}: ${field.type}("${field.dbName}") - International compatibility`);
    });

    console.log(`\n**System Fields (${systemFields.length}):**`);
    systemFields.forEach(field => {
      console.log(`⚙️ ${field.name}: ${field.type}("${field.dbName}") - System standard`);
    });

    // Identify specific inconsistencies within favorecidos table
    
    // 1. Name field inconsistency
    const hasGenericName = fields.some(f => f.name === 'name');
    if (hasGenericName) {
      this.inconsistencies.push({
        type: 'naming_pattern_violation',
        severity: 'high',
        location: 'favorecidos.name',
        description: 'favorecidos uses generic "name" while other tables use firstName/lastName pattern',
        currentState: 'name: varchar("name", { length: 255 })',
        inconsistencyDetails: [
          'favorecidos.name (generic single field)',
          'customers.firstName + customers.lastName (structured pattern)',
          'users.firstName + users.lastName (structured pattern)'
        ],
        recommendedAction: 'Consider splitting into firstName/lastName for consistency or document business justification for entities vs individuals'
      });
    }

    // 2. Phone field redundancy
    const phoneFields = fields.filter(f => f.name.toLowerCase().includes('phone'));
    if (phoneFields.length > 1) {
      this.inconsistencies.push({
        type: 'field_redundancy',
        severity: 'medium',
        location: 'favorecidos phone fields',
        description: 'Multiple phone fields create redundancy and unclear purpose',
        currentState: phoneFields.map(f => `${f.name}: ${f.type}("${f.dbName}")`).join(', '),
        inconsistencyDetails: [
          'phone: varchar("phone", { length: 20 }) - Purpose unclear',
          'cellPhone: varchar("cell_phone", { length: 20 }) - Mobile specific',
          'Redundancy: Both fields serve similar purpose without clear distinction'
        ],
        recommendedAction: 'Rename to primaryPhone/secondaryPhone or landlinePhone/mobilePhone for clarity'
      });
    }

    // 3. Cultural context mixing
    this.inconsistencies.push({
      type: 'cultural_context_conflict',
      severity: 'low',
      location: 'favorecidos field mix',
      description: 'Brazilian legal fields mixed with English business fields creates cultural inconsistency',
      currentState: 'CPF/CNPJ/RG (Portuguese) + name/email/phone (English)',
      inconsistencyDetails: [
        'Brazilian legal: cpf, cnpj, rg (required for compliance)',
        'English business: name, email, phone (international compatibility)',
        'Mixed context may confuse developers about target audience'
      ],
      businessJustification: 'Brazilian legal fields are mandatory, English fields provide international compatibility',
      recommendedAction: 'Document target use case clearly or consider separate tables for different markets'
    });
  }

  private analyzeFieldRedundancies(content: string): void {
    console.log('\n## 🔄 FIELD REDUNDANCY ANALYSIS\n');
    
    // Look for similar field patterns across tables
    const phoneFieldPattern = /(\w+): varchar\("([^"]*phone[^"]*)"[^,\n]*/gi;
    const phoneFields: {table: string, field: string, dbName: string}[] = [];
    
    // Extract table context for each phone field
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const phoneMatch = line.match(phoneFieldPattern);
      if (phoneMatch) {
        // Find the table this field belongs to
        for (let i = index; i >= 0; i--) {
          const tableMatch = lines[i].match(/export const (\w+) = pgTable/);
          if (tableMatch) {
            phoneFields.push({
              table: tableMatch[1],
              field: phoneMatch[1],
              dbName: phoneMatch[2]
            });
            break;
          }
        }
      }
    });

    console.log('### Phone Field Distribution Across Tables:');
    const phoneByTable = phoneFields.reduce((acc, field) => {
      if (!acc[field.table]) acc[field.table] = [];
      acc[field.table].push(field);
      return acc;
    }, {} as Record<string, typeof phoneFields>);

    Object.entries(phoneByTable).forEach(([table, fields]) => {
      console.log(`\n**${table} table:**`);
      fields.forEach(field => {
        console.log(`- ${field.field}: "${field.dbName}"`);
      });
      
      if (fields.length > 1) {
        console.log(`⚠️ **REDUNDANCY**: ${fields.length} phone fields in same table`);
      }
    });

    // Identify tables with multiple phone fields
    const tablesWithMultiplePhones = Object.entries(phoneByTable).filter(([, fields]) => fields.length > 1);
    
    tablesWithMultiplePhones.forEach(([table, fields]) => {
      this.inconsistencies.push({
        type: 'field_redundancy',
        severity: 'medium',
        location: `${table} table phone fields`,
        description: `Table has ${fields.length} phone fields without clear distinction`,
        currentState: fields.map(f => `${f.field}("${f.dbName}")`).join(', '),
        inconsistencyDetails: fields.map(f => `${f.field}: Purpose unclear, potential overlap`),
        recommendedAction: 'Clarify field purposes (landline vs mobile, primary vs secondary) or consolidate'
      });
    });
  }

  private generateInconsistencyReport(): void {
    console.log('\n## 🎯 COMPREHENSIVE INCONSISTENCY SUMMARY\n');
    
    if (this.inconsistencies.length === 0) {
      console.log('✅ **EXCELLENT**: No significant nomenclature inconsistencies detected!');
      return;
    }

    // Group by severity
    const critical = this.inconsistencies.filter(i => i.severity === 'critical');
    const high = this.inconsistencies.filter(i => i.severity === 'high');
    const medium = this.inconsistencies.filter(i => i.severity === 'medium');
    const low = this.inconsistencies.filter(i => i.severity === 'low');

    console.log('### Inconsistency Count by Severity:');
    console.log(`- **Critical**: ${critical.length}`);
    console.log(`- **High**: ${high.length}`);
    console.log(`- **Medium**: ${medium.length}`);
    console.log(`- **Low**: ${low.length}`);
    console.log(`- **TOTAL**: ${this.inconsistencies.length}\n`);

    // Report each inconsistency
    const allIssues = [...critical, ...high, ...medium, ...low];
    
    allIssues.forEach((issue, index) => {
      console.log(`### ${issue.severity.toUpperCase()} INCONSISTENCY ${index + 1}: ${issue.description}`);
      console.log(`**Location**: ${issue.location}`);
      console.log(`**Current State**: ${issue.currentState}`);
      console.log(`**Details**:`);
      issue.inconsistencyDetails.forEach(detail => {
        console.log(`  - ${detail}`);
      });
      if (issue.businessJustification) {
        console.log(`**Business Justification**: ${issue.businessJustification}`);
      }
      console.log(`**Recommended Action**: ${issue.recommendedAction}`);
      console.log('');
    });

    // Generate strategic recommendations
    console.log('## 🔧 STRATEGIC RECOMMENDATIONS\n');
    
    console.log('### 1. Language Strategy:');
    if (this.inconsistencies.some(i => i.type === 'table_language_mix')) {
      console.log('- **Decision Required**: Standardize on English OR document Brazilian context clearly');
      console.log('- **Option A**: Rename favorecidos → external_contacts (full English)');
      console.log('- **Option B**: Keep favorecidos but document as Brazilian-specific (hybrid approach)');
      console.log('- **Recommendation**: Option B with clear documentation');
    }
    
    console.log('\n### 2. Field Naming Strategy:');
    if (this.inconsistencies.some(i => i.type === 'naming_pattern_violation')) {
      console.log('- **Decision Required**: Standardize name patterns across all tables');
      console.log('- **Option A**: Use generic "name" for entities, "firstName/lastName" for individuals');
      console.log('- **Option B**: Standardize on "firstName/lastName" everywhere');
      console.log('- **Recommendation**: Option A with clear entity vs individual distinction');
    }
    
    console.log('\n### 3. Redundancy Resolution:');
    if (this.inconsistencies.some(i => i.type === 'field_redundancy')) {
      console.log('- **Action Required**: Clarify purpose of multiple phone fields');
      console.log('- **Solution**: Rename to primaryPhone/secondaryPhone or landlinePhone/mobilePhone');
      console.log('- **Benefit**: Clear field purposes, better developer experience');
    }

    // Overall risk assessment
    console.log('\n## 📊 RISK ASSESSMENT\n');
    
    const riskLevel = critical.length > 0 ? 'HIGH' : 
                     high.length > 0 ? 'MEDIUM' : 'LOW';
    
    console.log(`**Overall Risk Level**: ${riskLevel} ${riskLevel === 'HIGH' ? '🔴' : riskLevel === 'MEDIUM' ? '🟡' : '🟢'}`);
    console.log(`**Functional Impact**: ${riskLevel === 'HIGH' ? 'May break functionality' : riskLevel === 'MEDIUM' ? 'Affects maintainability' : 'Cosmetic issues only'}`);
    console.log(`**Developer Experience**: ${this.inconsistencies.length > 2 ? 'Confusing' : 'Manageable'}`);
    console.log(`**Business Impact**: ${this.inconsistencies.some(i => i.businessJustification) ? 'Some inconsistencies serve business needs' : 'Pure technical debt'}`);

    console.log('\n🎯 **CONCLUSION**:');
    if (riskLevel === 'LOW') {
      console.log('Nomenclature inconsistencies are minor and mostly serve legitimate business purposes. Focus on documentation over changes.');
    } else {
      console.log('Nomenclature inconsistencies impact developer experience and should be addressed systematically with proper planning.');
    }
  }
}

// Execute analysis
const analyzer = new NomenclatureInconsistencyAnalyzer();
analyzer.analyzeInconsistencies();

export { NomenclatureInconsistencyAnalyzer };
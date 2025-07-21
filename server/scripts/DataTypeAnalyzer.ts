// DATA TYPE CONSISTENCY ANALYZER
// Identifies and reports data type inconsistencies across schema

import { readFileSync } from 'fs';
import { join } from 'path';

interface DataTypeIssue {
  category: 'field_length_inconsistency' | 'array_implementation' | 'type_mismatch' | 'precision_inconsistency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fields: string[];
  currentValues: string[];
  recommendedValue: string;
  location: string[];
}

class DataTypeAnalyzer {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private issues: DataTypeIssue[] = [];

  async analyzeDataTypes(): Promise<void> {
    console.log('# DATA TYPE CONSISTENCY ANALYSIS');
    console.log(`Generated: ${new Date().toISOString()}\n`);

    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      
      // 1. Analyze phone field lengths
      this.analyzePhoneFields(schemaContent);
      
      // 2. Analyze status field lengths
      this.analyzeStatusFields(schemaContent);
      
      // 3. Analyze array implementations
      this.analyzeArrayImplementations(schemaContent);
      
      // 4. Analyze decimal precision
      this.analyzeDecimalFields(schemaContent);
      
      // 5. Generate standardization report
      this.generateStandardizationReport();
      
    } catch (error) {
      console.error('Error during data type analysis:', error);
    }
  }

  private analyzePhoneFields(content: string): void {
    console.log('## 📱 PHONE FIELD LENGTH ANALYSIS\n');
    
    // Extract all phone-related fields
    const phoneFieldPattern = /(phone|telefone|celular|cell_phone|landline|mobile): varchar\("([^"]+)", \{ length: (\d+) \}/g;
    const phoneFields: {field: string, dbName: string, length: number, table?: string}[] = [];
    
    let match;
    while ((match = phoneFieldPattern.exec(content)) !== null) {
      phoneFields.push({
        field: match[1],
        dbName: match[2],
        length: parseInt(match[3])
      });
    }

    // Group by length
    const lengthGroups = phoneFields.reduce((groups, field) => {
      const length = field.length;
      if (!groups[length]) groups[length] = [];
      groups[length].push(field);
      return groups;
    }, {} as Record<number, typeof phoneFields>);

    console.log('### Phone Field Length Distribution:');
    Object.entries(lengthGroups).forEach(([length, fields]) => {
      console.log(`- **Length ${length}**: ${fields.length} fields`);
      fields.forEach(field => {
        console.log(`  - ${field.field} → "${field.dbName}"`);
      });
    });

    // Check for inconsistencies
    const lengths = Object.keys(lengthGroups).map(Number);
    if (lengths.length > 1) {
      const mostCommonLength = lengths.reduce((a, b) => 
        lengthGroups[a].length > lengthGroups[b].length ? a : b
      );
      
      const inconsistentFields = phoneFields.filter(f => f.length !== mostCommonLength);
      
      if (inconsistentFields.length > 0) {
        this.issues.push({
          category: 'field_length_inconsistency',
          severity: 'medium',
          description: 'Phone fields have inconsistent varchar lengths',
          fields: inconsistentFields.map(f => f.field),
          currentValues: inconsistentFields.map(f => `varchar(${f.length})`),
          recommendedValue: `varchar(${mostCommonLength})`,
          location: inconsistentFields.map(f => `${f.field} → "${f.dbName}"`)
        });
        
        console.log(`\n❌ **INCONSISTENCY DETECTED**: Phone fields vary between lengths ${lengths.join(', ')}`);
        console.log(`📋 **RECOMMENDATION**: Standardize all phone fields to varchar(${mostCommonLength})`);
      }
    } else {
      console.log('\n✅ All phone fields have consistent length');
    }
  }

  private analyzeStatusFields(content: string): void {
    console.log('\n## 📊 STATUS FIELD LENGTH ANALYSIS\n');
    
    // Extract all status-related fields
    const statusFieldPattern = /(status|estado|state): varchar\("([^"]+)", \{ length: (\d+) \}/g;
    const statusFields: {field: string, dbName: string, length: number}[] = [];
    
    let match;
    while ((match = statusFieldPattern.exec(content)) !== null) {
      statusFields.push({
        field: match[1],
        dbName: match[2],
        length: parseInt(match[3])
      });
    }

    // Group by length
    const statusLengthGroups = statusFields.reduce((groups, field) => {
      const length = field.length;
      if (!groups[length]) groups[length] = [];
      groups[length].push(field);
      return groups;
    }, {} as Record<number, typeof statusFields>);

    console.log('### Status Field Length Distribution:');
    Object.entries(statusLengthGroups).forEach(([length, fields]) => {
      console.log(`- **Length ${length}**: ${fields.length} fields`);
      fields.forEach(field => {
        console.log(`  - ${field.field} → "${field.dbName}"`);
      });
    });

    // Check for inconsistencies
    const statusLengths = Object.keys(statusLengthGroups).map(Number);
    if (statusLengths.length > 1) {
      console.log(`\n⚠️ **VARIATION DETECTED**: Status fields vary between lengths ${statusLengths.join(', ')}`);
      
      // Analyze if variations are justified
      const shortStatus = statusFields.filter(f => f.length <= 20);
      const longStatus = statusFields.filter(f => f.length > 20);
      
      if (shortStatus.length > 0 && longStatus.length > 0) {
        this.issues.push({
          category: 'field_length_inconsistency',
          severity: 'low',
          description: 'Status fields have mixed lengths - may be intentional for different use cases',
          fields: longStatus.map(f => f.field),
          currentValues: statusLengths.map(l => `varchar(${l})`),
          recommendedValue: 'varchar(50) for descriptive status, varchar(20) for enum-like status',
          location: statusFields.map(f => `${f.field} → "${f.dbName}"`)
        });
        
        console.log('📋 **ANALYSIS**: May be intentional - short for enums, long for descriptive text');
      }
    } else {
      console.log('\n✅ All status fields have consistent length');
    }
  }

  private analyzeArrayImplementations(content: string): void {
    console.log('\n## 🔢 ARRAY IMPLEMENTATION ANALYSIS\n');
    
    // Look for different array patterns
    const nativeArrayPattern = /(\w+): (\w+)\("([^"]+)"\)\.array\(\)/g;
    const jsonbArrayPattern = /(\w+): jsonb\("([^"]+)"\)/g;
    
    const nativeArrays: {field: string, type: string, dbName: string}[] = [];
    const jsonbArrays: {field: string, dbName: string}[] = [];
    
    let match;
    
    // Find native arrays
    while ((match = nativeArrayPattern.exec(content)) !== null) {
      nativeArrays.push({
        field: match[1],
        type: match[2],
        dbName: match[3]
      });
    }
    
    // Reset regex
    content.replace(jsonbArrayPattern, (match, field, dbName) => {
      // Check if this JSONB field might be used for arrays
      if (field.toLowerCase().includes('ids') || 
          field.toLowerCase().includes('list') || 
          field.toLowerCase().includes('array') ||
          dbName.includes('_ids') ||
          dbName.includes('_list')) {
        jsonbArrays.push({ field, dbName });
      }
      return match;
    });

    console.log('### Native Array Implementation:');
    if (nativeArrays.length > 0) {
      nativeArrays.forEach(arr => {
        console.log(`✅ ${arr.field}: ${arr.type}("${arr.dbName}").array()`);
      });
    } else {
      console.log('⚠️ No native arrays found');
    }

    console.log('\n### Potential JSONB Arrays (candidates for migration):');
    if (jsonbArrays.length > 0) {
      jsonbArrays.forEach(arr => {
        console.log(`🔄 ${arr.field}: jsonb("${arr.dbName}") - CANDIDATE FOR NATIVE ARRAY`);
      });
      
      this.issues.push({
        category: 'array_implementation',
        severity: 'medium',
        description: 'Some fields use JSONB for arrays instead of native PostgreSQL arrays',
        fields: jsonbArrays.map(f => f.field),
        currentValues: jsonbArrays.map(f => 'jsonb'),
        recommendedValue: 'native PostgreSQL arrays (.array())',
        location: jsonbArrays.map(f => `${f.field} → "${f.dbName}"`)
      });
    } else {
      console.log('✅ No JSONB array candidates found');
    }

    // Look for specific array fields that should be native
    const specificArrayFields = ['teamMemberIds', 'tags', 'responsibleIds', 'dependsOnActionIds'];
    const foundSpecificArrays = specificArrayFields.filter(field => 
      content.includes(`${field}:`) && content.includes('jsonb')
    );

    if (foundSpecificArrays.length > 0) {
      console.log('\n### Specific Array Fields Using JSONB:');
      foundSpecificArrays.forEach(field => {
        console.log(`❌ ${field}: Should use native array instead of JSONB`);
      });
    }
  }

  private analyzeDecimalFields(content: string): void {
    console.log('\n## 💰 DECIMAL PRECISION ANALYSIS\n');
    
    // Extract decimal field definitions
    const decimalPattern = /(\w+): decimal\("([^"]+)", \{ precision: (\d+), scale: (\d+) \}/g;
    const decimalFields: {field: string, dbName: string, precision: number, scale: number}[] = [];
    
    let match;
    while ((match = decimalPattern.exec(content)) !== null) {
      decimalFields.push({
        field: match[1],
        dbName: match[2],
        precision: parseInt(match[3]),
        scale: parseInt(match[4])
      });
    }

    if (decimalFields.length === 0) {
      console.log('⚠️ No decimal fields found');
      return;
    }

    // Group by precision/scale combination
    const precisionGroups = decimalFields.reduce((groups, field) => {
      const key = `${field.precision},${field.scale}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(field);
      return groups;
    }, {} as Record<string, typeof decimalFields>);

    console.log('### Decimal Precision Distribution:');
    Object.entries(precisionGroups).forEach(([precisionScale, fields]) => {
      const [precision, scale] = precisionScale.split(',');
      console.log(`- **${precision},${scale}**: ${fields.length} fields`);
      fields.forEach(field => {
        console.log(`  - ${field.field} → "${field.dbName}"`);
      });
    });

    // Check for monetary fields consistency
    const monetaryFields = decimalFields.filter(f => 
      f.field.toLowerCase().includes('cost') ||
      f.field.toLowerCase().includes('budget') ||
      f.field.toLowerCase().includes('price') ||
      f.field.toLowerCase().includes('amount') ||
      f.field.toLowerCase().includes('value')
    );

    if (monetaryFields.length > 1) {
      const precisions = [...new Set(monetaryFields.map(f => `${f.precision},${f.scale}`))];
      if (precisions.length > 1) {
        this.issues.push({
          category: 'precision_inconsistency',
          severity: 'low',
          description: 'Monetary fields have inconsistent decimal precision',
          fields: monetaryFields.map(f => f.field),
          currentValues: monetaryFields.map(f => `decimal(${f.precision},${f.scale})`),
          recommendedValue: 'decimal(12,2) for monetary values',
          location: monetaryFields.map(f => `${f.field} → "${f.dbName}"`)
        });
        
        console.log('\n⚠️ **MONETARY FIELD INCONSISTENCY**: Different precisions for monetary values');
        console.log('📋 **RECOMMENDATION**: Standardize monetary fields to decimal(12,2)');
      } else {
        console.log('\n✅ Monetary fields have consistent precision');
      }
    }
  }

  private generateStandardizationReport(): void {
    console.log('\n## 🎯 DATA TYPE STANDARDIZATION SUMMARY\n');
    
    if (this.issues.length === 0) {
      console.log('✅ **EXCELLENT**: No significant data type inconsistencies detected!');
      console.log('The schema maintains consistent data types across all fields.');
      return;
    }

    // Group issues by severity
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');

    console.log('### Issue Summary:');
    console.log(`- Critical: ${criticalIssues.length}`);
    console.log(`- High: ${highIssues.length}`);
    console.log(`- Medium: ${mediumIssues.length}`);
    console.log(`- Low: ${lowIssues.length}`);
    console.log(`- **Total**: ${this.issues.length}`);

    // Report each issue
    this.issues.forEach((issue, index) => {
      console.log(`\n### ${issue.severity.toUpperCase()} ISSUE ${index + 1}: ${issue.description}`);
      console.log(`**Category**: ${issue.category}`);
      console.log(`**Affected Fields**: ${issue.fields.join(', ')}`);
      console.log(`**Current Values**: ${issue.currentValues.join(', ')}`);
      console.log(`**Recommended**: ${issue.recommendedValue}`);
      console.log(`**Locations**:`);
      issue.location.forEach(loc => console.log(`  - ${loc}`));
    });

    // Generate action items
    console.log('\n## 🔧 RECOMMENDED ACTIONS\n');
    
    console.log('### Immediate Actions (High Priority):');
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      [...criticalIssues, ...highIssues].forEach((issue, index) => {
        console.log(`${index + 1}. Fix ${issue.category}: ${issue.description}`);
        console.log(`   - Update: ${issue.fields.join(', ')} to ${issue.recommendedValue}`);
      });
    } else {
      console.log('✅ No immediate actions required');
    }

    console.log('\n### Future Improvements (Medium/Low Priority):');
    if (mediumIssues.length > 0 || lowIssues.length > 0) {
      [...mediumIssues, ...lowIssues].forEach((issue, index) => {
        console.log(`${index + 1}. Consider ${issue.category}: ${issue.description}`);
        console.log(`   - Standardize: ${issue.fields.join(', ')} to ${issue.recommendedValue}`);
      });
    } else {
      console.log('✅ No future improvements needed');
    }

    // Overall assessment
    console.log('\n## 📊 OVERALL ASSESSMENT\n');
    
    const totalFields = this.issues.reduce((sum, issue) => sum + issue.fields.length, 0);
    const riskLevel = criticalIssues.length > 0 ? 'HIGH' : 
                     highIssues.length > 0 ? 'MEDIUM' : 'LOW';
    
    console.log(`**Risk Level**: ${riskLevel} ${riskLevel === 'HIGH' ? '🔴' : riskLevel === 'MEDIUM' ? '🟡' : '🟢'}`);
    console.log(`**Affected Fields**: ${totalFields}`);
    console.log(`**Schema Consistency**: ${100 - (this.issues.length * 10)}% consistent`);
    
    if (riskLevel === 'LOW') {
      console.log('\n✅ **CONCLUSION**: Data types are well-standardized with minor variations that may be intentional for business requirements.');
    } else {
      console.log('\n⚠️ **CONCLUSION**: Some standardization improvements would benefit maintainability and consistency.');
    }
  }
}

// Execute analysis
const analyzer = new DataTypeAnalyzer();
analyzer.analyzeDataTypes();

export { DataTypeAnalyzer };
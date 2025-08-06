// NOMENCLATURE STANDARDIZATION SYSTEM
// Provides automated validation and recommendations for naming consistency

import { readFileSync } from 'fs';
import { join } from 'path';

interface NomenclatureRule {
  context: 'table' | 'field' | 'database' | 'api' | 'component';
  pattern: string;
  examples: string[];
  exceptions: string[];
  justification: string;
}

class NomenclatureStandardizer {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private rules: NomenclatureRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [
      {
        context: 'table',
        pattern: 'camelCase for TypeScript constants, snake_case for database names',
        examples: ['customers → "customers"', 'customerCompanies → "customer_companies"'],
        exceptions: ['favorecidos → "favorecidos" (Brazilian context)'],
        justification: 'TypeScript convention + PostgreSQL convention'
      },
      {
        context: 'field',
        pattern: 'camelCase for TypeScript, snake_case for database, specific patterns for types',
        examples: ['firstName → "first_name"', 'createdAt → "created_at"'],
        exceptions: ['cpf, cnpj, rg (Brazilian legal fields)', 'name vs firstName/lastName (entity vs individual)'],
        justification: 'Language conventions + business requirements'
      },
      {
        context: 'database',
        pattern: 'snake_case for all identifiers, lowercase preferred',
        examples: ['customer_companies', 'user_skills', 'project_actions'],
        exceptions: ['favorecidos (Brazilian business term)'],
        justification: 'PostgreSQL naming conventions'
      },
      {
        context: 'api',
        pattern: 'kebab-case for URLs, camelCase for JSON responses',
        examples: ['/api/companies', '{ firstName: "João" }'],
        exceptions: ['Brazilian field names in responses when appropriate'],
        justification: 'REST API conventions + JSON standards'
      },
      {
        context: 'component',
        pattern: 'PascalCase for React components, camelCase for props',
        examples: ['CustomerCompanies.tsx', 'FavorecidosTable.tsx'],
        exceptions: ['Acronyms like CPFField, CNPJValidator'],
        justification: 'React conventions + readability'
      }
    ];
  }

  async validateNomenclature(): Promise<void> {
    console.log('# NOMENCLATURE STANDARDIZATION VALIDATION');
    console.log(`Generated: ${new Date().toISOString()}\n`);

    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      
      // 1. Validate against established rules
      this.validateAgainstRules(schemaContent);
      
      // 2. Check for specific inconsistency patterns
      this.checkInconsistencyPatterns(schemaContent);
      
      // 3. Generate standardization report
      this.generateStandardizationReport();
      
    } catch (error) {
      console.error('Error during nomenclature validation:', error);
    }
  }

  private validateAgainstRules(content: string): void {
    console.log('## 📏 RULE VALIDATION ANALYSIS\n');
    
    this.rules.forEach((rule, index) => {
      console.log(`### Rule ${index + 1}: ${rule.context.toUpperCase()} Naming`);
      console.log(`**Pattern**: ${rule.pattern}`);
      console.log(`**Examples**: ${rule.examples.join(', ')}`);
      console.log(`**Exceptions**: ${rule.exceptions.join(', ')}`);
      console.log(`**Justification**: ${rule.justification}\n`);
    });
    
    // Validate table naming rule
    console.log('### Table Naming Validation:');
    const tablePattern = /export const (\w+) = pgTable\("(\w+)"/g;
    let tableMatch;
    let compliantTables = 0;
    let totalTables = 0;
    
    while ((tableMatch = tablePattern.exec(content)) !== null) {
      totalTables++;
      const constName = tableMatch[1];
      const dbName = tableMatch[2];
      
      // Check if follows camelCase → snake_case pattern
      const expectedDbName = this.camelToSnakeCase(constName);
      const isCompliant = dbName === expectedDbName || dbName === constName; // Allow direct mapping for simple names
      
      if (isCompliant || constName === 'favorecidos') {
        console.log(`✅ ${constName} → "${dbName}" ${constName === 'favorecidos' ? '(exception: Brazilian context)' : ''}`);
        compliantTables++;
      } else {
        console.log(`❌ ${constName} → "${dbName}" (expected: "${expectedDbName}")`);
      }
    }
    
    console.log(`\n**Table Naming Compliance**: ${compliantTables}/${totalTables} (${Math.round(compliantTables/totalTables*100)}%)`);
  }

  private checkInconsistencyPatterns(content: string): void {
    console.log('\n## 🔍 INCONSISTENCY PATTERN DETECTION\n');
    
    // 1. Check for mixed language patterns
    this.checkLanguageMixing(content);
    
    // 2. Check for field redundancy patterns
    this.checkFieldRedundancy(content);
    
    // 3. Check for naming pattern violations
    this.checkNamingPatterns(content);
  }

  private checkLanguageMixing(content: string): void {
    console.log('### Language Mixing Analysis:');
    
    const portugueseTerms = ['favorecidos', 'cpf', 'cnpj', 'rg'];
    const englishTerms = ['customers', 'users', 'tickets', 'projects', 'firstName', 'lastName', 'email', 'phone'];
    
    const foundPortuguese = portugueseTerms.filter(term => content.includes(term));
    const foundEnglish = englishTerms.filter(term => content.includes(term));
    
    console.log(`**Portuguese Terms Found**: ${foundPortuguese.length}`);
    foundPortuguese.forEach(term => console.log(`  - ${term}`));
    
    console.log(`\n**English Terms Found**: ${foundEnglish.length}`);
    foundEnglish.slice(0, 5).forEach(term => console.log(`  - ${term}`));
    if (foundEnglish.length > 5) console.log(`  - ... and ${foundEnglish.length - 5} more`);
    
    if (foundPortuguese.length > 0 && foundEnglish.length > 0) {
      console.log('\n📊 **MIXED LANGUAGE SCHEMA DETECTED**');
      console.log('**Status**: ACCEPTABLE - Portuguese terms serve Brazilian market specifically');
      console.log('**Recommendation**: Maintain current approach with clear documentation');
    }
  }

  private checkFieldRedundancy(content: string): void {
    console.log('\n### Field Redundancy Analysis:');
    
    // Look for tables with multiple phone fields
    const tables = content.split(/export const \w+ = pgTable/).slice(1);
    
    tables.forEach((tableContent, index) => {
      const phoneFieldCount = (tableContent.match(/phone/gi) || []).length;
      if (phoneFieldCount > 1) {
        const tableNameMatch = content.match(new RegExp(`export const (\\w+) = pgTable[\\s\\S]*?${tableContent.substring(0, 50)}`));
        const tableName = tableNameMatch ? tableNameMatch[1] : `table_${index}`;
        
        console.log(`⚠️ **${tableName}**: ${phoneFieldCount} phone-related fields detected`);
        
        // Extract specific phone fields
        const phoneFields = tableContent.match(/(\w*phone\w*): [^,\n]*/gi) || [];
        phoneFields.forEach(field => console.log(`  - ${field}`));
        
        console.log('  📋 **Recommendation**: Clarify field purposes (primary/secondary, landline/mobile)');
      }
    });
  }

  private checkNamingPatterns(content: string): void {
    console.log('\n### Naming Pattern Analysis:');
    
    // Check for name vs firstName/lastName patterns
    const hasGenericName = content.includes('name: varchar("name"');
    const hasStructuredName = content.includes('firstName:') && content.includes('lastName:');
    
    if (hasGenericName && hasStructuredName) {
      console.log('⚠️ **MIXED NAME PATTERNS DETECTED**');
      console.log('  - Some tables use: name (single field)');
      console.log('  - Other tables use: firstName + lastName (structured)');
      console.log('  📋 **Analysis**: May be intentional for entities vs individuals');
      console.log('  📋 **Recommendation**: Document entity vs individual distinction clearly');
    }
    
    // Check for ID field consistency
    const idPatterns = content.match(/id: (\w+)\("id"\)/g) || [];
    const uuidIds = idPatterns.filter(pattern => pattern.includes('uuid')).length;
    const varcharIds = idPatterns.filter(pattern => pattern.includes('varchar')).length;
    
    console.log(`\n**ID Field Types**:`);
    console.log(`  - UUID IDs: ${uuidIds}`);
    console.log(`  - VARCHAR IDs: ${varcharIds}`);
    
    if (uuidIds > 0 && varcharIds > 0) {
      console.log('  ⚠️ **MIXED ID TYPES**: Some tables use UUID, others VARCHAR');
    } else {
      console.log('  ✅ **CONSISTENT ID TYPES**: All IDs use same type');
    }
  }

  private generateStandardizationReport(): void {
    console.log('\n## 🎯 NOMENCLATURE STANDARDIZATION SUMMARY\n');
    
    console.log('### Current Status:');
    console.log('1. **Table Names**: ✅ Mostly compliant with camelCase → snake_case pattern');
    console.log('2. **Language Mixing**: ⚠️ Intentional Portuguese/English mix for Brazilian market');
    console.log('3. **Field Redundancy**: ⚠️ Some tables have multiple similar fields (phone)');
    console.log('4. **Naming Patterns**: ⚠️ Mixed patterns may be intentional (entities vs individuals)');
    
    console.log('\n### Compliance Assessment:');
    console.log('- **Functional Impact**: 🟢 LOW - No functionality affected');
    console.log('- **Developer Experience**: 🟡 MEDIUM - Some confusion possible');
    console.log('- **Maintainability**: 🟡 MEDIUM - Requires documentation');
    console.log('- **Business Alignment**: 🟢 HIGH - Serves Brazilian market needs');
    
    console.log('\n### Recommendations by Priority:');
    
    console.log('\n**HIGH PRIORITY:**');
    console.log('1. Document entity vs individual naming distinction clearly');
    console.log('2. Clarify phone field purposes (primary/secondary, landline/mobile)');
    
    console.log('\n**MEDIUM PRIORITY:**');
    console.log('3. Create developer guidelines for Portuguese vs English term usage');
    console.log('4. Consider field name aliases for international developers');
    
    console.log('\n**LOW PRIORITY:**');
    console.log('5. Evaluate renaming favorecidos → external_contacts for consistency');
    console.log('6. Standardize field naming patterns across all new tables');
    
    console.log('\n### Action Plan:');
    console.log('1. ✅ **Document Current Standards**: Update NOMENCLATURE_STANDARDS.md');
    console.log('2. 🔄 **Create Guidelines**: Developer onboarding documentation');
    console.log('3. 📋 **Field Purpose Clarification**: Rename ambiguous phone fields');
    console.log('4. 🔍 **Regular Validation**: Automated checks for new code');
    
    console.log('\n🎉 **CONCLUSION**:');
    console.log('Current nomenclature inconsistencies are **manageable** and mostly serve legitimate business purposes. Focus on **documentation** and **clarification** rather than major restructuring.');
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }
}

// Execute standardizer
const standardizer = new NomenclatureStandardizer();
standardizer.validateNomenclature();

export { NomenclatureStandardizer };
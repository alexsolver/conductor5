// NOMENCLATURE ANALYSIS SYSTEM
// Analyzes and reports Portuguese vs English naming inconsistencies

import { readFileSync } from 'fs';
import { join } from 'path';

interface NomenclatureIssue {
  category: 'language_mix' | 'field_inconsistency' | 'table_naming' | 'convention_violation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  examples: string[];
  recommendation: string;
}

class NomenclatureAnalyzer {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private issues: NomenclatureIssue[] = [];

  async analyzeNomenclature(): Promise<void> {
    console.log('# NOMENCLATURE ANALYSIS REPORT');
    console.log(`Generated: ${new Date().toISOString()}\n`);

    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      
      // 1. Analyze table names
      this.analyzeTableNames(schemaContent);
      
      // 2. Analyze field naming patterns
      this.analyzeFieldNaming(schemaContent);
      
      // 3. Analyze Brazilian-specific fields
      this.analyzeBrazilianFields(schemaContent);
      
      // 4. Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('Error during nomenclature analysis:', error);
    }
  }

  private analyzeTableNames(content: string): void {
    const tablePattern = /export const (\w+) = pgTable\("(\w+)"/g;
    const tables: {constName: string, tableName: string}[] = [];
    
    let match;
    while ((match = tablePattern.exec(content)) !== null) {
      tables.push({
        constName: match[1],
        tableName: match[2]
      });
    }

    console.log('## 📊 TABLE NAMING ANALYSIS\n');
    
    // Identify Portuguese table names
    const portugueseTables = tables.filter(t => 
      ['favorecidos'].includes(t.constName) || 
      ['favorecidos'].includes(t.tableName)
    );
    
    const englishTables = tables.filter(t => 
      !['favorecidos'].includes(t.constName) && 
      !['favorecidos'].includes(t.tableName)
    );

    console.log(`### Portuguese Tables (${portugueseTables.length}):`);
    portugueseTables.forEach(table => {
      console.log(`- ${table.constName} ("${table.tableName}")`);
    });
    
    console.log(`\n### English Tables (${englishTables.length}):`);
    englishTables.forEach(table => {
      console.log(`- ${table.constName} ("${table.tableName}")`);
    });

    if (portugueseTables.length > 0 && englishTables.length > 0) {
      this.issues.push({
        category: 'language_mix',
        severity: 'medium',
        description: 'Mixed Portuguese and English table names',
        location: 'Table definitions',
        examples: [`Portuguese: ${portugueseTables.map(t => t.constName).join(', ')}`, 
                  `English: ${englishTables.slice(0, 3).map(t => t.constName).join(', ')}...`],
        recommendation: 'Standardize on English for international compatibility or Portuguese for local context'
      });
    }
  }

  private analyzeFieldNaming(content: string): void {
    console.log('\n## 🔍 FIELD NAMING PATTERN ANALYSIS\n');
    
    // Extract favorecidos table definition
    const favorecidosMatch = content.match(/export const favorecidos = pgTable\("favorecidos",[\s\S]*?\}\);/);
    
    if (favorecidosMatch) {
      const tableDefinition = favorecidosMatch[0];
      
      // Analyze field patterns
      const fieldPatterns = {
        camelCase: /(\w+): varchar\(["'](\w+)["']/g,
        snake_case: /(\w+): varchar\(["'](\w+_\w+)["']/g,
        portuguese: /(cpf|cnpj|rg): varchar/g,
        english: /(email|phone|name): varchar/g
      };

      console.log('### favorecidos Table Field Analysis:');
      
      // Extract all fields
      const fields: {camelField: string, dbField: string}[] = [];
      let fieldMatch;
      const allFieldPattern = /(\w+): \w+\(["']([^"']+)["']/g;
      
      while ((fieldMatch = allFieldPattern.exec(tableDefinition)) !== null) {
        fields.push({
          camelField: fieldMatch[1],
          dbField: fieldMatch[2]
        });
      }

      // Categorize fields
      const brazilianFields = fields.filter(f => 
        ['cpf', 'cnpj', 'rg'].includes(f.camelField) || 
        ['cpf', 'cnpj', 'rg'].includes(f.dbField)
      );
      
      const englishFields = fields.filter(f => 
        ['email', 'phone', 'name', 'cellPhone'].includes(f.camelField) ||
        ['email', 'phone', 'name', 'cell_phone'].includes(f.dbField)
      );
      
      const inconsistentFields = fields.filter(f => {
        // Check for inconsistencies like name vs firstName/lastName
        return f.camelField === 'name' || 
               (f.camelField === 'phone' && fields.some(other => other.camelField === 'cellPhone'));
      });

      console.log(`\n**Brazilian-specific fields (${brazilianFields.length}):**`);
      brazilianFields.forEach(field => {
        console.log(`- ${field.camelField} → "${field.dbField}"`);
      });
      
      console.log(`\n**English fields (${englishFields.length}):**`);
      englishFields.forEach(field => {
        console.log(`- ${field.camelField} → "${field.dbField}"`);
      });
      
      console.log(`\n**Potentially inconsistent fields (${inconsistentFields.length}):**`);
      inconsistentFields.forEach(field => {
        console.log(`- ${field.camelField} → "${field.dbField}"`);
      });

      // Check for specific inconsistencies
      const hasGenericName = fields.some(f => f.camelField === 'name');
      const hasPhone = fields.some(f => f.camelField === 'phone');
      const hasCellPhone = fields.some(f => f.camelField === 'cellPhone');

      if (hasGenericName) {
        this.issues.push({
          category: 'field_inconsistency',
          severity: 'high',
          description: 'favorecidos uses generic "name" field while other tables use firstName/lastName',
          location: 'favorecidos table',
          examples: ['favorecidos.name vs customers.firstName/lastName'],
          recommendation: 'Standardize on either generic "name" or specific "firstName/lastName" across all tables'
        });
      }

      if (hasPhone && hasCellPhone) {
        this.issues.push({
          category: 'field_inconsistency',
          severity: 'medium',
          description: 'favorecidos has both phone and cellPhone creating redundancy',
          location: 'favorecidos table',
          examples: ['phone: varchar("phone")', 'cellPhone: varchar("cell_phone")'],
          recommendation: 'Consolidate to single phone field or clarify distinction (landline vs mobile)'
        });
      }

      if (brazilianFields.length > 0 && englishFields.length > 0) {
        this.issues.push({
          category: 'language_mix',
          severity: 'low',
          description: 'Mixed Portuguese and English field names in favorecidos table',
          location: 'favorecidos table fields',
          examples: [`Portuguese: ${brazilianFields.map(f => f.camelField).join(', ')}`,
                    `English: ${englishFields.map(f => f.camelField).join(', ')}`],
          recommendation: 'Acceptable mix - Brazilian legal fields (CPF, CNPJ, RG) should remain in Portuguese for specificity'
        });
      }
    }
  }

  private analyzeBrazilianFields(content: string): void {
    console.log('\n## 🇧🇷 BRAZILIAN CONTEXT FIELD ANALYSIS\n');
    
    const brazilianFieldPatterns = {
      cpf: /cpf:/g,
      cnpj: /cnpj:/g,
      rg: /rg:/g
    };

    const brazilianFieldCount = {
      cpf: (content.match(brazilianFieldPatterns.cpf) || []).length,
      cnpj: (content.match(brazilianFieldPatterns.cnpj) || []).length,
      rg: (content.match(brazilianFieldPatterns.rg) || []).length
    };

    console.log('### Brazilian Legal Fields Usage:');
    Object.entries(brazilianFieldCount).forEach(([field, count]) => {
      console.log(`- ${field.toUpperCase()}: ${count} occurrences`);
    });

    const totalBrazilianFields = Object.values(brazilianFieldCount).reduce((sum, count) => sum + count, 0);
    
    if (totalBrazilianFields > 0) {
      console.log(`\n✅ **Brazilian Compliance**: ${totalBrazilianFields} Brazilian-specific fields detected`);
      console.log('These fields should remain in Portuguese for legal and cultural accuracy.');
      
      this.issues.push({
        category: 'convention_violation',
        severity: 'low',
        description: 'Brazilian legal fields correctly implemented',
        location: 'favorecidos and customers tables',
        examples: [`CPF: Brazilian tax ID`, `CNPJ: Brazilian company ID`, `RG: Brazilian identity document`],
        recommendation: 'KEEP AS-IS - These Portuguese terms are correct for Brazilian legal compliance'
      });
    }
  }

  private generateReport(): void {
    console.log('\n## 🎯 NOMENCLATURE ISSUES SUMMARY\n');
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');

    console.log(`### Issue Count by Severity:`);
    console.log(`- Critical: ${criticalIssues.length}`);
    console.log(`- High: ${highIssues.length}`);
    console.log(`- Medium: ${mediumIssues.length}`);
    console.log(`- Low: ${lowIssues.length}`);
    console.log(`- **Total: ${this.issues.length}**`);

    if (this.issues.length === 0) {
      console.log('\n✅ No nomenclature issues detected!');
      return;
    }

    // Report issues by category
    const categories = ['critical', 'high', 'medium', 'low'] as const;
    
    categories.forEach(severity => {
      const issuesInCategory = this.issues.filter(i => i.severity === severity);
      if (issuesInCategory.length === 0) return;
      
      console.log(`\n### ${severity.toUpperCase()} PRIORITY ISSUES:\n`);
      
      issuesInCategory.forEach((issue, index) => {
        console.log(`**${index + 1}. ${issue.description}**`);
        console.log(`- **Category**: ${issue.category}`);
        console.log(`- **Location**: ${issue.location}`);
        console.log(`- **Examples**:`);
        issue.examples.forEach(example => {
          console.log(`  - ${example}`);
        });
        console.log(`- **Recommendation**: ${issue.recommendation}`);
        console.log('');
      });
    });

    // Overall recommendations
    console.log('\n## 🔧 OVERALL RECOMMENDATIONS\n');
    
    const hasLanguageMix = this.issues.some(i => i.category === 'language_mix');
    const hasFieldInconsistency = this.issues.some(i => i.category === 'field_inconsistency');
    
    if (hasLanguageMix) {
      console.log('### Language Mixing Strategy:');
      console.log('1. **Keep Brazilian legal terms**: CPF, CNPJ, RG (these are specific and legally required)');
      console.log('2. **Consider international terms**: email, phone, name (widely understood)');
      console.log('3. **Business decision**: favorecidos vs external_contacts (choose based on target market)');
      console.log('');
    }
    
    if (hasFieldInconsistency) {
      console.log('### Field Consistency Strategy:');
      console.log('1. **Standardize name fields**: Choose either generic "name" or specific "firstName/lastName"');
      console.log('2. **Clarify phone fields**: Distinguish between landline and mobile clearly');
      console.log('3. **Database conventions**: Stick to snake_case for DB, camelCase for TypeScript');
      console.log('');
    }

    console.log('### Risk Assessment:');
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      console.log('🔴 **HIGH RISK**: Critical/High issues may impact development productivity');
    } else if (mediumIssues.length > 0) {
      console.log('🟡 **MEDIUM RISK**: Some inconsistencies but system remains functional');
    } else {
      console.log('🟢 **LOW RISK**: Minor inconsistencies, acceptable for business context');
    }
  }
}

// Execute analysis
const analyzer = new NomenclatureAnalyzer();
analyzer.analyzeNomenclature();

export { NomenclatureAnalyzer };
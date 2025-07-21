// ENTERPRISE INDEXING OPTIMIZATION SYSTEM
// Comprehensive analysis and implementation of critical indexes for performance

import { readFileSync } from 'fs';
import { join } from 'path';

interface IndexDefinition {
  tableName: string;
  indexName: string;
  columns: string[];
  type: 'tenant' | 'foreign_key' | 'composite' | 'geolocation' | 'search';
  purpose: string;
}

class IndexingOptimizer {
  private schemaContent: string;

  constructor() {
    const schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
    this.schemaContent = readFileSync(schemaPath, 'utf-8');
  }

  analyzeCurrentIndexes(): {
    tablesWithIndexes: string[],
    tablesWithoutIndexes: string[],
    totalIndexCount: number,
    indexesByTable: Record<string, IndexDefinition[]>
  } {
    const indexesByTable: Record<string, IndexDefinition[]> = {};
    
    // Extract all table definitions and their indexes
    const tableMatches = [...this.schemaContent.matchAll(/export const (\w+) = pgTable\("([^"]+)"[\s\S]*?\}, \(table\) => \[([\s\S]*?)\]\);/g)];
    
    tableMatches.forEach(match => {
      const [, varName, dbName, indexesContent] = match;
      
      // Parse indexes from the content
      const indexMatches = [...indexesContent.matchAll(/index\("([^"]+)"\)\.on\(([^)]+)\)/g)];
      
      const tableIndexes: IndexDefinition[] = indexMatches.map(indexMatch => {
        const [, indexName, columns] = indexMatch;
        const columnsList = columns.split(',').map(c => c.trim().replace(/table\./g, ''));
        
        return {
          tableName: dbName,
          indexName,
          columns: columnsList,
          type: this.categorizeIndex(indexName, columnsList),
          purpose: this.getIndexPurpose(indexName, columnsList)
        };
      });

      if (tableIndexes.length > 0) {
        indexesByTable[dbName] = tableIndexes;
      }
    });

    // Get all table names
    const allTableMatches = [...this.schemaContent.matchAll(/export const (\w+) = pgTable\("([^"]+)"/g)];
    const allTables = allTableMatches.map(match => match[2]);
    
    const tablesWithIndexes = Object.keys(indexesByTable);
    const tablesWithoutIndexes = allTables.filter(table => !tablesWithIndexes.includes(table));
    
    const totalIndexCount = Object.values(indexesByTable).reduce((sum, indexes) => sum + indexes.length, 0);

    return {
      tablesWithIndexes,
      tablesWithoutIndexes,
      totalIndexCount,
      indexesByTable
    };
  }

  private categorizeIndex(indexName: string, columns: string[]): 'tenant' | 'foreign_key' | 'composite' | 'geolocation' | 'search' {
    const name = indexName.toLowerCase();
    
    if (name.includes('geo') || columns.includes('latitude') || columns.includes('longitude')) {
      return 'geolocation';
    }
    if (name.includes('tenant') && columns.length === 1) {
      return 'tenant';
    }
    if (name.includes('tenant') && columns.length > 1) {
      return 'composite';
    }
    if (columns.some(col => col.includes('_id') || col.includes('Id'))) {
      return 'foreign_key';
    }
    if (name.includes('search') || name.includes('name') || name.includes('category')) {
      return 'search';
    }
    
    return 'composite';
  }

  private getIndexPurpose(indexName: string, columns: string[]): string {
    const name = indexName.toLowerCase();
    
    if (name.includes('geo')) return 'Geolocation queries and proximity searches';
    if (name.includes('tenant_name')) return 'Multi-tenant name searches';
    if (name.includes('tenant_status')) return 'Multi-tenant status filtering';
    if (name.includes('tenant_active')) return 'Multi-tenant active record filtering';
    if (name.includes('assigned')) return 'Assignment queries and workload distribution';
    if (name.includes('time') || name.includes('created')) return 'Temporal queries and audit trails';
    if (name.includes('priority')) return 'Priority-based sorting and filtering';
    if (name.includes('category')) return 'Category-based grouping and searches';
    if (name.includes('project')) return 'Project-related queries and associations';
    if (name.includes('skill')) return 'Skill matching and user capabilities';
    if (name.includes('ticket')) return 'Ticket tracking and message threading';
    
    return 'General query optimization';
  }

  generateIndexingReport(): string {
    const analysis = this.analyzeCurrentIndexes();
    
    let report = `# ENTERPRISE INDEXING OPTIMIZATION REPORT\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Summary Statistics
    report += `## 📊 INDEXING SUMMARY\n`;
    report += `Total tables: ${analysis.tablesWithIndexes.length + analysis.tablesWithoutIndexes.length}\n`;
    report += `Tables with indexes: ${analysis.tablesWithIndexes.length}\n`;
    report += `Tables WITHOUT indexes: ${analysis.tablesWithoutIndexes.length}\n`;
    report += `Total indexes implemented: ${analysis.totalIndexCount}\n\n`;

    // Tables WITH indexes
    report += `## ✅ TABLES WITH COMPREHENSIVE INDEXING\n`;
    analysis.tablesWithIndexes.forEach(tableName => {
      const indexes = analysis.indexesByTable[tableName];
      report += `### ${tableName} (${indexes.length} indexes)\n`;
      
      indexes.forEach(index => {
        report += `- **${index.indexName}** (${index.type})\n`;
        report += `  - Columns: ${index.columns.join(', ')}\n`;
        report += `  - Purpose: ${index.purpose}\n`;
      });
      report += `\n`;
    });

    // Tables WITHOUT indexes
    if (analysis.tablesWithoutIndexes.length > 0) {
      report += `## ❌ CRITICAL TABLES MISSING INDEXES\n`;
      analysis.tablesWithoutIndexes.forEach(tableName => {
        report += `### ${tableName}\n`;
        report += `**Missing critical indexes for enterprise performance:**\n`;
        
        // Suggest indexes based on table name
        const suggestions = this.suggestIndexesForTable(tableName);
        suggestions.forEach(suggestion => {
          report += `- ${suggestion}\n`;
        });
        report += `\n`;
      });
    }

    // Index Type Analysis
    report += `## 🔍 INDEX TYPE DISTRIBUTION\n`;
    const indexTypeCount: Record<string, number> = {};
    Object.values(analysis.indexesByTable).flat().forEach(index => {
      indexTypeCount[index.type] = (indexTypeCount[index.type] || 0) + 1;
    });

    Object.entries(indexTypeCount).forEach(([type, count]) => {
      report += `- **${type}**: ${count} indexes\n`;
    });

    // Performance Impact Assessment
    report += `\n## 🚀 PERFORMANCE IMPACT ASSESSMENT\n`;
    const coverage = (analysis.tablesWithIndexes.length / (analysis.tablesWithIndexes.length + analysis.tablesWithoutIndexes.length)) * 100;
    
    if (coverage >= 90) {
      report += `✅ **EXCELLENT COVERAGE**: ${coverage.toFixed(1)}% of tables have optimized indexes\n`;
    } else if (coverage >= 70) {
      report += `⚠️ **GOOD COVERAGE**: ${coverage.toFixed(1)}% of tables have indexes - room for improvement\n`;
    } else {
      report += `❌ **POOR COVERAGE**: ${coverage.toFixed(1)}% of tables have indexes - critical optimization needed\n`;
    }

    report += `\n**Enterprise Benefits Achieved:**\n`;
    report += `- Multi-tenant query isolation: ${Object.values(analysis.indexesByTable).flat().filter(i => i.type === 'tenant').length} tenant indexes\n`;
    report += `- Foreign key optimization: ${Object.values(analysis.indexesByTable).flat().filter(i => i.type === 'foreign_key').length} FK indexes\n`;
    report += `- Composite query optimization: ${Object.values(analysis.indexesByTable).flat().filter(i => i.type === 'composite').length} composite indexes\n`;
    
    if (Object.values(analysis.indexesByTable).flat().some(i => i.type === 'geolocation')) {
      report += `- Geolocation optimization: Advanced proximity searches enabled\n`;
    }

    return report;
  }

  private suggestIndexesForTable(tableName: string): string[] {
    const suggestions: string[] = [];
    
    // Base tenant index for all tables
    suggestions.push(`tenant_id index for multi-tenant isolation`);
    
    switch (tableName) {
      case 'ticket_messages':
        suggestions.push(`(tenant_id, ticket_id) composite for message threading`);
        suggestions.push(`(tenant_id, sender_type) for sender filtering`);
        suggestions.push(`(tenant_id, created_at) for temporal queries`);
        break;
      
      case 'locations':
        suggestions.push(`(tenant_id, name) for location searches`);
        suggestions.push(`(latitude, longitude) for geolocation queries`);
        suggestions.push(`(tenant_id, is_active) for active location filtering`);
        break;
      
      case 'customer_companies':
        suggestions.push(`(tenant_id, name) for company searches`);
        suggestions.push(`(tenant_id, status) for status filtering`);
        suggestions.push(`(tenant_id, subscription_tier) for tier-based queries`);
        break;
      
      case 'skills':
        suggestions.push(`(tenant_id, name) for skill searches`);
        suggestions.push(`(tenant_id, category) for category filtering`);
        suggestions.push(`(category, is_active) for active skills by category`);
        break;
      
      case 'certifications':
        suggestions.push(`(tenant_id, name) for certification searches`);
        suggestions.push(`(tenant_id, issuer) for issuer filtering`);
        suggestions.push(`validity_period_months for expiration tracking`);
        break;
      
      case 'user_skills':
        suggestions.push(`(tenant_id, user_id) for user skill profiles`);
        suggestions.push(`(tenant_id, skill_id) for skill usage tracking`);
        suggestions.push(`(skill_id, level) for skill level matching`);
        break;
      
      case 'project_actions':
        suggestions.push(`(tenant_id, project_id) for project action tracking`);
        suggestions.push(`(tenant_id, status) for action status filtering`);
        suggestions.push(`(project_id, status) for project progress tracking`);
        break;
      
      default:
        suggestions.push(`Status/priority composite indexes`);
        suggestions.push(`Foreign key relationship indexes`);
        break;
    }
    
    return suggestions;
  }
}

// Execute analysis
const optimizer = new IndexingOptimizer();
const report = optimizer.generateIndexingReport();

console.log(report);

export { IndexingOptimizer };
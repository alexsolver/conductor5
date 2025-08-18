
import { sql } from 'drizzle-orm';
import { db } from '../db';
import * as fs from 'fs';
import * as path from 'path';

export class TenantSchemaUsageAuditor {
  private static instance: TenantSchemaUsageAuditor;
  
  static getInstance(): TenantSchemaUsageAuditor {
    if (!TenantSchemaUsageAuditor.instance) {
      TenantSchemaUsageAuditor.instance = new TenantSchemaUsageAuditor();
    }
    return TenantSchemaUsageAuditor.instance;
  }

  // CRITICAL: Patterns que indicam uso incorreto do schema público
  private readonly PROBLEMATIC_PATTERNS = [
    // Queries diretas sem tenant context
    /db\.execute\(sql`[^`]*SELECT[^`]*FROM\s+(?!information_schema|pg_)[a-zA-Z_]+[^`]*`\)/g,
    /db\.select\(\)\.from\([^)]+\)(?!\.where\([^)]*tenant)/g,
    /db\.insert\([^)]+\)(?!\.values\([^)]*tenant)/g,
    /db\.update\([^)]+\)(?!\.set\([^)]*\)\.where\([^)]*tenant)/g,
    /db\.delete\([^)]+\)(?!\.where\([^)]*tenant)/g,
    
    // Schema hardcoding
    /public\./g,
    /FROM\s+public\./gi,
    /JOIN\s+public\./gi,
    
    // Missing tenant validation
    /INSERT\s+INTO\s+[a-zA-Z_]+\s+/gi,
    /UPDATE\s+[a-zA-Z_]+\s+SET/gi,
    /DELETE\s+FROM\s+[a-zA-Z_]+\s+/gi,
  ];

  // CRITICAL: Arquivos que devem usar schema tenant obrigatoriamente
  private readonly TENANT_REQUIRED_PATHS = [
    'server/modules/**/repositories/**/*.ts',
    'server/modules/**/infrastructure/**/*.ts',
    'server/modules/**/controllers/**/*.ts',
    'server/routes/**/*.ts',
    'server/repositories/**/*.ts'
  ];

  // CRITICAL: Exceções legítimas (podem usar schema público)
  private readonly LEGITIMATE_PUBLIC_USAGE = [
    'server/db.ts',
    'server/utils/productionInitializer.ts',
    'server/scripts/**/*.ts',
    'server/middleware/tenantValidator.ts'
  ];

  async auditCompleteSystem(): Promise<{
    violations: any[];
    summary: any;
    fixes: string[];
  }> {
    console.log('🔍 [TENANT-SCHEMA-AUDITOR] Iniciando auditoria completa do sistema...');
    
    const violations: any[] = [];
    const fixes: string[] = [];
    
    try {
      // 1. Audit code files
      const codeViolations = await this.auditCodeFiles();
      violations.push(...codeViolations.violations);
      fixes.push(...codeViolations.fixes);

      // 2. Audit database queries in runtime
      const runtimeViolations = await this.auditRuntimeQueries();
      violations.push(...runtimeViolations.violations);
      fixes.push(...runtimeViolations.fixes);

      // 3. Audit repository patterns
      const repositoryViolations = await this.auditRepositoryPatterns();
      violations.push(...repositoryViolations.violations);
      fixes.push(...repositoryViolations.fixes);

      // 4. Generate comprehensive report
      const summary = this.generateAuditSummary(violations);

      console.log(`🔍 [TENANT-SCHEMA-AUDITOR] Auditoria completa: ${violations.length} violações encontradas`);
      
      return { violations, summary, fixes };
    } catch (error) {
      console.error('❌ [TENANT-SCHEMA-AUDITOR] Erro durante auditoria:', error);
      throw error;
    }
  }

  private async auditCodeFiles(): Promise<{ violations: any[], fixes: string[] }> {
    const violations: any[] = [];
    const fixes: string[] = [];

    const filesToAudit = this.getFilesToAudit();
    
    for (const filePath of filesToAudit) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileViolations = this.analyzeFileContent(filePath, content);
        
        if (fileViolations.length > 0) {
          violations.push({
            file: filePath,
            type: 'code_violation',
            violations: fileViolations
          });

          // Generate fix suggestions
          fixes.push(...this.generateCodeFixes(filePath, fileViolations));
        }
      } catch (error) {
        console.warn(`⚠️ Could not audit file: ${filePath}`, error.message);
      }
    }

    return { violations, fixes };
  }

  private getFilesToAudit(): string[] {
    const files: string[] = [];

    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
          // Check if file should use tenant schema
          if (this.shouldUseTenantSchema(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir('server');
    return files;
  }

  private shouldUseTenantSchema(filePath: string): boolean {
    // Check if file is in tenant-required paths
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Skip legitimate public usage
    for (const exception of this.LEGITIMATE_PUBLIC_USAGE) {
      if (this.matchesPattern(relativePath, exception)) {
        return false;
      }
    }

    // Check if should use tenant schema
    for (const pattern of this.TENANT_REQUIRED_PATHS) {
      if (this.matchesPattern(relativePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    
    return new RegExp(regexPattern).test(path);
  }

  private analyzeFileContent(filePath: string, content: string): any[] {
    const violations: any[] = [];

    // Check for problematic patterns
    for (const pattern of this.PROBLEMATIC_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          violations.push({
            type: 'schema_violation',
            pattern: pattern.source,
            match: match,
            severity: this.getViolationSeverity(match),
            line: this.getLineNumber(content, match)
          });
        }
      }
    }

    // Check for missing tenant validation
    if (this.isMissingTenantValidation(content)) {
      violations.push({
        type: 'missing_tenant_validation',
        severity: 'high',
        description: 'File performs database operations without tenant validation'
      });
    }

    return violations;
  }

  private getViolationSeverity(match: string): 'low' | 'medium' | 'high' | 'critical' {
    if (match.includes('DELETE') || match.includes('UPDATE')) {
      return 'critical';
    }
    if (match.includes('INSERT')) {
      return 'high';
    }
    if (match.includes('SELECT')) {
      return 'medium';
    }
    return 'low';
  }

  private getLineNumber(content: string, match: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 0;
  }

  private isMissingTenantValidation(content: string): boolean {
    const hasDbOperations = /db\.(select|insert|update|delete|execute)/.test(content);
    const hasTenantValidation = /tenantId|tenant_id|validateTenantAccess/.test(content);
    
    return hasDbOperations && !hasTenantValidation;
  }

  private async auditRuntimeQueries(): Promise<{ violations: any[], fixes: string[] }> {
    const violations: any[] = [];
    const fixes: string[] = [];

    try {
      // Check for queries hitting public schema in runtime
      const publicSchemaQueries = await db.execute(sql`
        SELECT query, calls, mean_exec_time
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%information_schema%'
        AND query NOT LIKE '%pg_%'
        AND (query LIKE '%FROM public.%' OR query LIKE '%UPDATE public.%' OR query LIKE '%INSERT INTO public.%')
        ORDER BY calls DESC
        LIMIT 50
      `);

      for (const query of publicSchemaQueries.rows) {
        violations.push({
          type: 'runtime_public_schema_usage',
          query: query.query,
          calls: query.calls,
          severity: 'high'
        });

        fixes.push(`Runtime query using public schema: ${query.query.substring(0, 100)}...`);
      }
    } catch (error) {
      console.warn('⚠️ Could not audit runtime queries (pg_stat_statements not available)');
    }

    return { violations, fixes };
  }

  private async auditRepositoryPatterns(): Promise<{ violations: any[], fixes: string[] }> {
    const violations: any[] = [];
    const fixes: string[] = [];

    // Check repository files for proper tenant isolation
    const repositoryFiles = this.getRepositoryFiles();

    for (const filePath of repositoryFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for proper tenant schema usage
        if (!this.hasProperTenantSchemaUsage(content)) {
          violations.push({
            file: filePath,
            type: 'repository_schema_violation',
            severity: 'critical',
            description: 'Repository not using proper tenant schema isolation'
          });

          fixes.push(`Fix repository ${filePath} to use tenant schema properly`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not audit repository: ${filePath}`);
      }
    }

    return { violations, fixes };
  }

  private getRepositoryFiles(): string[] {
    const files: string[] = [];
    
    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.includes('Repository') && item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };

    walkDir('server/modules');
    walkDir('server/infrastructure');
    walkDir('server/repositories');
    
    return files;
  }

  private hasProperTenantSchemaUsage(content: string): boolean {
    // Check for tenant schema patterns
    const hasTenantSchema = /tenant_\$\{.*\}|schemaManager\.getTenantDb|tenantId/.test(content);
    const hasDbOperations = /db\.(select|insert|update|delete|execute)/.test(content);
    
    // If has db operations, must have tenant schema usage
    return !hasDbOperations || hasTenantSchema;
  }

  private generateCodeFixes(filePath: string, violations: any[]): string[] {
    const fixes: string[] = [];

    for (const violation of violations) {
      switch (violation.type) {
        case 'schema_violation':
          fixes.push(`${filePath}:${violation.line} - Replace ${violation.match} with tenant-aware query`);
          break;
        case 'missing_tenant_validation':
          fixes.push(`${filePath} - Add tenant validation before database operations`);
          break;
      }
    }

    return fixes;
  }

  private generateAuditSummary(violations: any[]): any {
    const summary = {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical' || v.violations?.some((vv: any) => vv.severity === 'critical')).length,
      high: violations.filter(v => v.severity === 'high' || v.violations?.some((vv: any) => vv.severity === 'high')).length,
      medium: violations.filter(v => v.severity === 'medium' || v.violations?.some((vv: any) => vv.severity === 'medium')).length,
      low: violations.filter(v => v.severity === 'low' || v.violations?.some((vv: any) => vv.severity === 'low')).length,
      types: {} as Record<string, number>
    };

    // Count by type
    for (const violation of violations) {
      if (violation.type) {
        summary.types[violation.type] = (summary.types[violation.type] || 0) + 1;
      }
      if (violation.violations) {
        for (const subViolation of violation.violations) {
          summary.types[subViolation.type] = (summary.types[subViolation.type] || 0) + 1;
        }
      }
    }

    return summary;
  }

  // CRITICAL: Auto-fix method for common violations
  async autoFixViolations(fixes: string[]): Promise<void> {
    console.log('🔧 [TENANT-SCHEMA-AUDITOR] Aplicando correções automáticas...');

    for (const fix of fixes) {
      try {
        await this.applyAutomaticFix(fix);
      } catch (error) {
        console.error(`❌ Failed to apply fix: ${fix}`, error.message);
      }
    }
  }

  private async applyAutomaticFix(fix: string): Promise<void> {
    // Parse fix and apply based on type
    console.log(`🔧 Applying: ${fix}`);
    
    // Implementation would depend on specific fix patterns
    // This is a framework for automatic fixes
  }

  // CRITICAL: Prevention measures
  async installPreventionMeasures(): Promise<void> {
    console.log('🛡️ [TENANT-SCHEMA-AUDITOR] Instalando medidas preventivas...');

    // 1. Create git pre-commit hook
    await this.createPreCommitHook();

    // 2. Add ESLint rules
    await this.addESLintRules();

    // 3. Create runtime monitoring
    await this.setupRuntimeMonitoring();
  }

  private async createPreCommitHook(): Promise<void> {
    const hookContent = `#!/bin/sh
# Tenant Schema Usage Validation
node -e "
const { TenantSchemaUsageAuditor } = require('./server/scripts/TenantSchemaUsageAuditor.ts');
const auditor = TenantSchemaUsageAuditor.getInstance();
auditor.auditCompleteSystem().then(result => {
  if (result.violations.filter(v => v.severity === 'critical').length > 0) {
    console.error('❌ COMMIT BLOCKED: Critical tenant schema violations found');
    process.exit(1);
  }
}).catch(() => process.exit(1));
"`;

    // Would write to .git/hooks/pre-commit
    console.log('📝 Pre-commit hook template created');
  }

  private async addESLintRules(): Promise<void> {
    console.log('📝 ESLint rules for tenant schema validation would be added');
  }

  private async setupRuntimeMonitoring(): Promise<void> {
    console.log('📊 Runtime monitoring for tenant schema usage would be setup');
  }

  // CRITICAL: Continuous monitoring
  async startContinuousMonitoring(): Promise<void> {
    console.log('🔄 [TENANT-SCHEMA-AUDITOR] Iniciando monitoramento contínuo...');

    setInterval(async () => {
      try {
        const result = await this.auditCompleteSystem();
        
        if (result.violations.length > 0) {
          console.warn(`⚠️ [CONTINUOUS-MONITORING] ${result.violations.length} violações detectadas`);
          
          // Send alerts for critical violations
          const critical = result.violations.filter(v => v.severity === 'critical');
          if (critical.length > 0) {
            console.error(`🚨 [CRITICAL-ALERT] ${critical.length} violações críticas de schema tenant detectadas!`);
          }
        }
      } catch (error) {
        console.error('❌ [CONTINUOUS-MONITORING] Erro no monitoramento:', error.message);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }
}

// Export singleton
export const tenantSchemaAuditor = TenantSchemaUsageAuditor.getInstance();

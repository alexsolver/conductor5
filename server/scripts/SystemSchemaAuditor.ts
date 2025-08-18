/**
 * SYSTEM SCHEMA AUDITOR
 * Varre todo o sistema para identificar uso incorreto de schemas
 * Detecta operações que deveriam usar schema tenant mas usam público
 */

import { Pool } from 'pg';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tenantSchemaManager } from '../utils/tenantSchemaValidator';

export interface SchemaViolation {
  file: string;
  line: number;
  type: 'public_schema_usage' | 'missing_tenant_context' | 'hardcoded_schema' | 'unsafe_query';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion: string;
  code: string;
}

export interface DatabaseViolation {
  tenantId: string;
  table: string;
  type: 'wrong_schema' | 'missing_table' | 'invalid_constraint';
  description: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface AuditReport {
  timestamp: Date;
  totalFiles: number;
  violationsCount: number;
  codeViolations: SchemaViolation[];
  databaseViolations: DatabaseViolation[];
  recommendations: string[];
  riskScore: number; // 0-100
}

export class SystemSchemaAuditor {
  private pool: Pool;
  private codeViolations: SchemaViolation[] = [];
  private dbViolations: DatabaseViolation[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
  }

  /**
   * MÉTODO PRINCIPAL: Auditoria completa do sistema
   */
  async performFullAudit(): Promise<AuditReport> {
    console.log('🔍 [SCHEMA-AUDITOR] Iniciando auditoria completa do sistema...');
    
    this.codeViolations = [];
    this.dbViolations = [];

    // 1. Auditar código fonte
    await this.auditSourceCode();
    
    // 2. Auditar esquemas de banco de dados
    await this.auditDatabaseSchemas();
    
    // 3. Auditar configurações
    await this.auditConfigurations();
    
    // 4. Gerar relatório
    const report = this.generateReport();
    
    // 5. Salvar relatório
    await this.saveReport(report);
    
    return report;
  }

  /**
   * AUDITORIA DO CÓDIGO FONTE
   */
  private async auditSourceCode() {
    console.log('📝 [SCHEMA-AUDITOR] Auditando código fonte...');
    
    const serverPath = join(process.cwd(), 'server');
    const sharedPath = join(process.cwd(), 'shared');
    
    await this.auditDirectory(serverPath);
    await this.auditDirectory(sharedPath);
  }

  private async auditDirectory(dirPath: string) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursivamente auditar subdiretórios
          await this.auditDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
          await this.auditFile(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ [SCHEMA-AUDITOR] Erro ao auditar diretório ${dirPath}:`, error);
    }
  }

  private async auditFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Detectar uso explícito de schema público
        if (line.includes('public.') && !line.includes('information_schema') && !line.includes('pg_catalog')) {
          this.codeViolations.push({
            file: filePath,
            line: lineNumber,
            type: 'public_schema_usage',
            description: 'Uso explícito do schema público detectado',
            severity: 'critical',
            suggestion: 'Usar schema tenant dinâmico baseado no contexto do usuário',
            code: line.trim()
          });
        }
        
        // Detectar queries hardcoded sem contexto tenant
        if (line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE') || line.includes('DELETE')) {
          if (!line.includes('tenant') && !line.includes('$1') && !line.includes('?')) {
            this.codeViolations.push({
              file: filePath,
              line: lineNumber,
              type: 'missing_tenant_context',
              description: 'Query sem contexto de tenant detectada',
              severity: 'high',
              suggestion: 'Adicionar filtro de tenant_id ou usar conexão com schema tenant',
              code: line.trim()
            });
          }
        }
        
        // Detectar uso de pool.query() sem interceptação
        if (line.includes('pool.query') && !line.includes('tenant')) {
          this.codeViolations.push({
            file: filePath,
            line: lineNumber,
            type: 'unsafe_query',
            description: 'Uso direto de pool.query sem garantia de schema tenant',
            severity: 'high',
            suggestion: 'Usar tenantSchemaManager.getTenantConnection() para operações tenant',
            code: line.trim()
          });
        }
        
        // Detectar schemas hardcoded
        if (line.includes('tenant_') && line.includes('-')) {
          this.codeViolations.push({
            file: filePath,
            line: lineNumber,
            type: 'hardcoded_schema',
            description: 'Nome de schema tenant hardcoded detectado',
            severity: 'medium',
            suggestion: 'Usar função dinâmica para gerar nome do schema',
            code: line.trim()
          });
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ [SCHEMA-AUDITOR] Erro ao auditar arquivo ${filePath}:`, error);
    }
  }

  /**
   * AUDITORIA DOS ESQUEMAS DE BANCO DE DADOS
   */
  private async auditDatabaseSchemas() {
    console.log('🗄️ [SCHEMA-AUDITOR] Auditando esquemas de banco de dados...');
    
    // Obter lista de todos os schemas tenant
    const tenantSchemas = await this.getTenantSchemas();
    
    for (const schema of tenantSchemas) {
      await this.auditTenantSchema(schema);
    }
  }

  private async getTenantSchemas(): Promise<Array<{schema_name: string, tenant_id: string}>> {
    const result = await this.pool.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    return result.rows.map(row => ({
      schema_name: row.schema_name,
      tenant_id: row.schema_name.replace('tenant_', '').replace(/_/g, '-')
    }));
  }

  private async auditTenantSchema(schema: {schema_name: string, tenant_id: string}) {
    try {
      // Verificar se tabelas essenciais existem
      const essentialTables = [
        'users', 'customers', 'beneficiaries', 'companies', 'tickets',
        'locations', 'user_groups', 'activity_logs', 'notifications'
      ];
      
      const existingTables = await this.pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      `, [schema.schema_name]);
      
      const tableNames = existingTables.rows.map(row => row.table_name);
      
      for (const table of essentialTables) {
        if (!tableNames.includes(table)) {
          this.dbViolations.push({
            tenantId: schema.tenant_id,
            table,
            type: 'missing_table',
            description: `Tabela essencial '${table}' não encontrada no schema ${schema.schema_name}`,
            severity: 'critical'
          });
        }
      }
      
      // Verificar foreign keys que referenciam schema público
      const publicReferences = await this.pool.query(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_schema as ref_schema,
          ccu.table_name as ref_table
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND ccu.table_schema = 'public'
      `, [schema.schema_name]);
      
      for (const ref of publicReferences.rows) {
        this.dbViolations.push({
          tenantId: schema.tenant_id,
          table: ref.table_name,
          type: 'wrong_schema',
          description: `Foreign key em ${ref.table_name}.${ref.column_name} referencia schema público (${ref.ref_schema}.${ref.ref_table})`,
          severity: 'critical'
        });
      }
      
      // Verificar constraints de tenant_id
      const tenantConstraints = await this.pool.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND column_name = 'tenant_id'
      `, [schema.schema_name]);
      
      const tablesWithTenantId = tenantConstraints.rows.map(row => row.table_name);
      
      for (const table of tableNames) {
        if (!tablesWithTenantId.includes(table) && table !== 'migrations') {
          this.dbViolations.push({
            tenantId: schema.tenant_id,
            table,
            type: 'invalid_constraint',
            description: `Tabela '${table}' não possui coluna tenant_id para isolamento`,
            severity: 'high'
          });
        }
      }
      
    } catch (error) {
      console.error(`❌ [SCHEMA-AUDITOR] Erro ao auditar schema ${schema.schema_name}:`, error);
    }
  }

  /**
   * AUDITORIA DE CONFIGURAÇÕES
   */
  private async auditConfigurations() {
    console.log('⚙️ [SCHEMA-AUDITOR] Auditando configurações...');
    
    // Verificar configurações do Drizzle
    const drizzleConfigPath = join(process.cwd(), 'drizzle.config.ts');
    try {
      const drizzleConfig = await fs.readFile(drizzleConfigPath, 'utf-8');
      
      if (!drizzleConfig.includes('schema')) {
        this.codeViolations.push({
          file: drizzleConfigPath,
          line: 1,
          type: 'missing_tenant_context',
          description: 'Configuração do Drizzle pode não suportar schemas múltiplos',
          severity: 'medium',
          suggestion: 'Verificar se configuração suporta multi-schema',
          code: 'drizzle.config.ts'
        });
      }
    } catch (error) {
      console.warn('⚠️ [SCHEMA-AUDITOR] Não foi possível auditar drizzle.config.ts');
    }
  }

  /**
   * GERAR RELATÓRIO
   */
  private generateReport(): AuditReport {
    const totalViolations = this.codeViolations.length + this.dbViolations.length;
    const criticalViolations = [...this.codeViolations, ...this.dbViolations].filter(v => v.severity === 'critical').length;
    
    // Calcular score de risco (0-100)
    const riskScore = Math.min(100, (criticalViolations * 20) + (totalViolations * 5));
    
    const recommendations = this.generateRecommendations();
    
    return {
      timestamp: new Date(),
      totalFiles: 0, // Seria calculado durante a auditoria
      violationsCount: totalViolations,
      codeViolations: this.codeViolations,
      databaseViolations: this.dbViolations,
      recommendations,
      riskScore
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    
    if (this.codeViolations.some(v => v.type === 'public_schema_usage')) {
      recommendations.push('Implementar interceptador de queries para substituir automaticamente referências ao schema público');
    }
    
    if (this.codeViolations.some(v => v.type === 'unsafe_query')) {
      recommendations.push('Migrar todas as queries para usar TenantSchemaManager em vez de pool.query direto');
    }
    
    if (this.dbViolations.some(v => v.type === 'missing_table')) {
      recommendations.push('Executar migrações para criar tabelas faltantes nos schemas tenant');
    }
    
    if (this.dbViolations.some(v => v.type === 'wrong_schema')) {
      recommendations.push('Corrigir foreign keys que referenciam schema público incorretamente');
    }
    
    recommendations.push('Implementar middleware de validação em tempo real para prevenir novos problemas');
    recommendations.push('Configurar monitoramento contínuo de uso de schema');
    
    return recommendations;
  }

  /**
   * SALVAR RELATÓRIO
   */
  private async saveReport(report: AuditReport) {
    const fileName = `schema-audit-${report.timestamp.toISOString().split('T')[0]}.json`;
    const filePath = join(process.cwd(), 'AUDIT_REPORTS', fileName);
    
    try {
      // Criar diretório se não existir
      await fs.mkdir(join(process.cwd(), 'AUDIT_REPORTS'), { recursive: true });
      
      // Salvar relatório
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      
      console.log(`✅ [SCHEMA-AUDITOR] Relatório salvo em: ${filePath}`);
    } catch (error) {
      console.error('❌ [SCHEMA-AUDITOR] Erro ao salvar relatório:', error);
    }
  }

  /**
   * GERAR RELATÓRIO RESUMIDO
   */
  printSummary(report: AuditReport) {
    console.log('\n📊 [SCHEMA-AUDITOR] RESUMO DA AUDITORIA');
    console.log('=====================================');
    console.log(`⏰ Data: ${report.timestamp.toISOString()}`);
    console.log(`📈 Score de Risco: ${report.riskScore}/100`);
    console.log(`🚨 Total de Violações: ${report.violationsCount}`);
    console.log(`📝 Violações de Código: ${report.codeViolations.length}`);
    console.log(`🗄️ Violações de BD: ${report.databaseViolations.length}`);
    
    console.log('\n🔴 VIOLAÇÕES CRÍTICAS:');
    const criticalViolations = [...report.codeViolations, ...report.databaseViolations]
      .filter(v => v.severity === 'critical');
    
    if (criticalViolations.length === 0) {
      console.log('✅ Nenhuma violação crítica encontrada!');
    } else {
      criticalViolations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.description}`);
        if ('file' in violation) {
          console.log(`   📁 ${violation.file}:${violation.line}`);
        }
      });
    }
    
    console.log('\n💡 RECOMENDAÇÕES:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n=====================================\n');
  }
}

/**
 * SCRIPT EXECUTÁVEL
 */
export async function runSchemaAudit() {
  const auditor = new SystemSchemaAuditor();
  
  try {
    console.log('🚀 [SCHEMA-AUDITOR] Iniciando auditoria do sistema...');
    
    const report = await auditor.performFullAudit();
    auditor.printSummary(report);
    
    // Retornar código de saída baseado no risco
    if (report.riskScore > 80) {
      console.log('🔴 ALTA CRITICIDADE - Ação imediata necessária!');
      process.exit(1);
    } else if (report.riskScore > 50) {
      console.log('🟡 RISCO MÉDIO - Correções recomendadas');
      process.exit(0);
    } else {
      console.log('🟢 BAIXO RISCO - Sistema em boa condição');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ [SCHEMA-AUDITOR] Erro durante auditoria:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runSchemaAudit();
}
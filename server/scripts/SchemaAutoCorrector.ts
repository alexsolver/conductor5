/**
 * SCHEMA AUTO-CORRECTOR
 * Corrige automaticamente problemas de schema identificados pela auditoria
 * Implementa correções seguras para garantir uso correto de schemas tenant
 */

import { Pool } from 'pg';
import { promises as fs } from 'fs';
import { join } from 'path';
import { SystemSchemaAuditor, SchemaViolation, DatabaseViolation } from './SystemSchemaAuditor';

export interface CorrectionResult {
  type: 'code' | 'database' | 'configuration';
  description: string;
  success: boolean;
  details: string;
  file?: string;
  originalCode?: string;
  correctedCode?: string;
}

export interface AutoCorrectionReport {
  timestamp: Date;
  totalCorrections: number;
  successfulCorrections: number;
  failedCorrections: number;
  corrections: CorrectionResult[];
  remainingIssues: number;
}

export class SchemaAutoCorrector {
  private pool: Pool;
  private corrections: CorrectionResult[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
  }

  /**
   * MÉTODO PRINCIPAL: Correção automática baseada em auditoria
   */
  async performAutoCorrection(): Promise<AutoCorrectionReport> {
    console.log('🔧 [AUTO-CORRECTOR] Iniciando correção automática...');

    this.corrections = [];

    // 1. Executar auditoria para identificar problemas
    const auditor = new SystemSchemaAuditor();
    const auditReport = await auditor.performFullAudit();

    // 2. Corrigir violações de código
    await this.correctCodeViolations(auditReport.codeViolations);

    // 3. Corrigir violações de banco de dados
    await this.correctDatabaseViolations(auditReport.databaseViolations);

    // 4. Aplicar melhorias preventivas
    await this.applyPreventiveMeasures();

    // 5. Gerar relatório
    const report = this.generateCorrectionReport();

    console.log('✅ [AUTO-CORRECTOR] Correção automática concluída');
    return report;
  }

  /**
   * CORREÇÃO DE VIOLAÇÕES DE CÓDIGO
   */
  private async correctCodeViolations(violations: SchemaViolation[]) {
    console.log('📝 [AUTO-CORRECTOR] Corrigindo violações de código...');

    for (const violation of violations) {
      try {
        switch (violation.type) {
          case 'public_schema_usage':
            await this.correctPublicSchemaUsage(violation);
            break;
          case 'unsafe_query':
            await this.correctUnsafeQuery(violation);
            break;
          case 'hardcoded_schema':
            await this.correctHardcodedSchema(violation);
            break;
          case 'missing_tenant_context':
            await this.correctMissingTenantContext(violation);
            break;
        }
      } catch (error) {
        this.corrections.push({
          type: 'code',
          description: `Falha ao corrigir ${violation.type} em ${violation.file}`,
          success: false,
          details: error instanceof Error ? error.message : 'Unknown error',
          file: violation.file
        });
      }
    }
  }

  private async correctPublicSchemaUsage(violation: SchemaViolation) {
    const content = await fs.readFile(violation.file, 'utf-8');
    const lines = content.split('\n');
    const originalLine = lines[violation.line - 1];

    // Diferentes estratégias de correção baseadas no contexto
    let correctedLine = originalLine;

    if (originalLine.includes('public.users')) {
      correctedLine = originalLine.replace(/public\.users/g, '${schemaName}.users');
    } else if (originalLine.includes('public.')) {
      // Substituição genérica - requer análise do contexto
      correctedLine = originalLine.replace(/public\./g, '${req.tenantConnection?.schemaName || "public"}.');
    }

    if (correctedLine !== originalLine) {
      lines[violation.line - 1] = correctedLine;
      await fs.writeFile(violation.file, lines.join('\n'));

      this.corrections.push({
        type: 'code',
        description: `Corrigido uso do schema público em ${violation.file}:${violation.line}`,
        success: true,
        details: 'Substituído referência hardcoded ao schema público por referência dinâmica',
        file: violation.file,
        originalCode: originalLine.trim(),
        correctedCode: correctedLine.trim()
      });
    }
  }

  private async correctUnsafeQuery(violation: SchemaViolation) {
    const content = await fs.readFile(violation.file, 'utf-8');
    const lines = content.split('\n');
    const originalLine = lines[violation.line - 1];

    // Detectar se já há importação do tenantSchemaManager
    const hasImport = content.includes('tenantSchemaManager') || content.includes('TenantSchemaManager');

    if (!hasImport) {
      // Adicionar import no topo do arquivo
      const importLine = "import { tenantSchemaManager } from '../utils/tenantSchemaValidator';";
      
      // Encontrar linha apropriada para inserir import
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import') && !lines[i].includes('from')) {
          insertIndex = i + 1;
        }
        if (!lines[i].includes('import') && insertIndex > 0) {
          break;
        }
      }

      lines.splice(insertIndex, 0, importLine);
    }

    // Comentar linha original e adicionar versão corrigida
    const commentedLine = `  // FIXME: Use tenantSchemaManager instead - ${originalLine.trim()}`;
    const correctedLine = `  // const connection = await tenantSchemaManager.getTenantConnection(tenantId);`;

    lines[violation.line - 1] = commentedLine;
    lines.splice(violation.line, 0, correctedLine);

    await fs.writeFile(violation.file, lines.join('\n'));

    this.corrections.push({
      type: 'code',
      description: `Marcado query insegura para correção manual em ${violation.file}:${violation.line}`,
      success: true,
      details: 'Adicionado comentário e sugestão de correção - requer revisão manual',
      file: violation.file,
      originalCode: originalLine.trim(),
      correctedCode: `${commentedLine}\n${correctedLine}`
    });
  }

  private async correctHardcodedSchema(violation: SchemaViolation) {
    const content = await fs.readFile(violation.file, 'utf-8');
    const lines = content.split('\n');
    const originalLine = lines[violation.line - 1];

    // Substituir schemas hardcoded por função dinâmica
    const correctedLine = originalLine.replace(
      /tenant_[a-f0-9]{8}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{12}/g,
      '${schemaManager.getSchemaName(tenantId)}'
    );

    if (correctedLine !== originalLine) {
      lines[violation.line - 1] = correctedLine;
      await fs.writeFile(violation.file, lines.join('\n'));

      this.corrections.push({
        type: 'code',
        description: `Corrigido schema hardcoded em ${violation.file}:${violation.line}`,
        success: true,
        details: 'Substituído por função dinâmica de geração de schema',
        file: violation.file,
        originalCode: originalLine.trim(),
        correctedCode: correctedLine.trim()
      });
    }
  }

  private async correctMissingTenantContext(violation: SchemaViolation) {
    // Para queries sem contexto de tenant, adicionar comentário explicativo
    const content = await fs.readFile(violation.file, 'utf-8');
    const lines = content.split('\n');
    const originalLine = lines[violation.line - 1];

    const commentLine = `  // TODO: Add tenant context validation - ensure this query respects tenant isolation`;
    lines.splice(violation.line - 1, 0, commentLine);

    await fs.writeFile(violation.file, lines.join('\n'));

    this.corrections.push({
      type: 'code',
      description: `Adicionado aviso sobre contexto de tenant em ${violation.file}:${violation.line}`,
      success: true,
      details: 'Adicionado comentário para revisão manual',
      file: violation.file,
      originalCode: originalLine.trim(),
      correctedCode: `${commentLine}\n${originalLine.trim()}`
    });
  }

  /**
   * CORREÇÃO DE VIOLAÇÕES DE BANCO DE DADOS
   */
  private async correctDatabaseViolations(violations: DatabaseViolation[]) {
    console.log('🗄️ [AUTO-CORRECTOR] Corrigindo violações de banco de dados...');

    for (const violation of violations) {
      try {
        switch (violation.type) {
          case 'missing_table':
            await this.correctMissingTable(violation);
            break;
          case 'wrong_schema':
            await this.correctWrongSchemaReference(violation);
            break;
          case 'invalid_constraint':
            await this.correctInvalidConstraint(violation);
            break;
        }
      } catch (error) {
        this.corrections.push({
          type: 'database',
          description: `Falha ao corrigir ${violation.type} para tenant ${violation.tenantId}`,
          success: false,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async correctMissingTable(violation: DatabaseViolation) {
    // Não criar tabelas automaticamente - muito arriscado
    // Apenas documentar o problema para ação manual
    
    this.corrections.push({
      type: 'database',
      description: `Tabela faltante '${violation.table}' identificada para tenant ${violation.tenantId}`,
      success: false,
      details: 'Criação automática de tabelas não é segura - requer migração manual'
    });
  }

  private async correctWrongSchemaReference(violation: DatabaseViolation) {
    // Foreign keys incorretas são muito perigosas para corrigir automaticamente
    // Apenas documentar para correção manual
    
    this.corrections.push({
      type: 'database',
      description: `Referência incorreta de schema detectada em ${violation.table} para tenant ${violation.tenantId}`,
      success: false,
      details: 'Correção de foreign keys requer análise manual cuidadosa'
    });
  }

  private async correctInvalidConstraint(violation: DatabaseViolation) {
    const schemaName = `tenant_${violation.tenantId.replace(/-/g, '_')}`;
    
    try {
      // Adicionar coluna tenant_id se não existir
      await this.pool.query(`
        ALTER TABLE ${schemaName}.${violation.table} 
        ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT '${violation.tenantId}'
      `);

      this.corrections.push({
        type: 'database',
        description: `Adicionada coluna tenant_id à tabela ${violation.table} para tenant ${violation.tenantId}`,
        success: true,
        details: 'Coluna tenant_id adicionada com valor padrão'
      });
    } catch (error) {
      this.corrections.push({
        type: 'database',
        description: `Falha ao adicionar coluna tenant_id à tabela ${violation.table}`,
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * APLICAR MEDIDAS PREVENTIVAS
   */
  private async applyPreventiveMeasures() {
    console.log('🛡️ [AUTO-CORRECTOR] Aplicando medidas preventivas...');

    // 1. Criar/atualizar middleware de validação
    await this.ensureValidationMiddleware();

    // 2. Criar script de monitoramento
    await this.ensureMonitoringScript();

    // 3. Criar guia de boas práticas
    await this.ensureBestPracticesGuide();
  }

  private async ensureValidationMiddleware() {
    const middlewarePath = join(process.cwd(), 'server/middleware/schemaValidationMiddleware.ts');
    
    const middlewareContent = `
/**
 * SCHEMA VALIDATION MIDDLEWARE - Auto-generated
 * Valida automaticamente o uso correto de schemas em tempo real
 */

import { Request, Response, NextFunction } from 'express';
import { tenantSchemaManager } from '../utils/tenantSchemaValidator';

export function schemaValidationMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip para rotas de autenticação
    if (req.path.startsWith('/api/auth/')) {
      return next();
    }

    const user = (req as any).user;
    if (user?.tenantId) {
      // Validar que a conexão usa o schema correto
      try {
        const connection = await tenantSchemaManager.getTenantConnection(user.tenantId);
        (req as any).tenantConnection = connection;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Schema validation failed',
          code: 'SCHEMA_VALIDATION_ERROR'
        });
      }
    }

    next();
  };
}
`;

    try {
      await fs.writeFile(middlewarePath, middlewareContent.trim());
      
      this.corrections.push({
        type: 'configuration',
        description: 'Criado middleware de validação de schema',
        success: true,
        details: 'Middleware automático para validação em tempo real',
        file: middlewarePath
      });
    } catch (error) {
      this.corrections.push({
        type: 'configuration',
        description: 'Falha ao criar middleware de validação',
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async ensureMonitoringScript() {
    const scriptPath = join(process.cwd(), 'server/scripts/dailySchemaCheck.ts');
    
    const scriptContent = `
/**
 * DAILY SCHEMA CHECK - Auto-generated
 * Script para verificação diária de integridade de schemas
 */

import { SystemSchemaAuditor } from './SystemSchemaAuditor';

async function dailySchemaCheck() {
  console.log('🔍 Daily Schema Check Starting...');
  
  const auditor = new SystemSchemaAuditor();
  const report = await auditor.performFullAudit();
  
  if (report.riskScore > 30) {
    console.log('⚠️ Schema issues detected - review required');
    // Aqui seria integrado com sistema de alertas
  }
  
  console.log('✅ Daily Schema Check Complete');
}

// Executar se chamado diretamente
if (require.main === module) {
  dailySchemaCheck().catch(console.error);
}
`;

    try {
      await fs.writeFile(scriptPath, scriptContent.trim());
      
      this.corrections.push({
        type: 'configuration',
        description: 'Criado script de monitoramento diário',
        success: true,
        details: 'Script para verificação automática diária',
        file: scriptPath
      });
    } catch (error) {
      this.corrections.push({
        type: 'configuration',
        description: 'Falha ao criar script de monitoramento',
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async ensureBestPracticesGuide() {
    const guidePath = join(process.cwd(), 'SCHEMA_BEST_PRACTICES.md');
    
    const guideContent = `
# MELHORES PRÁTICAS PARA SCHEMAS TENANT

## Regras Fundamentais

1. **NUNCA use referências diretas ao schema público em código tenant**
   - ❌ \`public.users\`
   - ✅ \`\${schemaName}.users\`

2. **SEMPRE use TenantSchemaManager para conexões**
   - ❌ \`pool.query()\`
   - ✅ \`tenantSchemaManager.getTenantConnection()\`

3. **TODAS as tabelas tenant devem ter coluna tenant_id**
   - Garante isolamento de dados
   - Previne vazamentos entre tenants

## Padrões de Implementação

### Conexão Correta
\`\`\`typescript
const connection = await tenantSchemaManager.getTenantConnection(tenantId);
const result = await connection.db.select().from(users);
\`\`\`

### Query com Schema Dinâmico
\`\`\`typescript
const schemaName = \`tenant_\${tenantId.replace(/-/g, '_')}\`;
const query = \`SELECT * FROM \${schemaName}.users WHERE tenant_id = $1\`;
\`\`\`

## Checklist de Validação

- [ ] Todas as queries usam schema tenant correto
- [ ] Nenhuma referência hardcoded a schemas específicos
- [ ] Middleware de validação está ativo
- [ ] Monitoramento automático está configurado

---
*Este guia foi gerado automaticamente pelo SchemaAutoCorrector*
`;

    try {
      await fs.writeFile(guidePath, guideContent.trim());
      
      this.corrections.push({
        type: 'configuration',
        description: 'Criado guia de melhores práticas',
        success: true,
        details: 'Documentação para equipe de desenvolvimento',
        file: guidePath
      });
    } catch (error) {
      this.corrections.push({
        type: 'configuration',
        description: 'Falha ao criar guia de melhores práticas',
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GERAR RELATÓRIO DE CORREÇÕES
   */
  private generateCorrectionReport(): AutoCorrectionReport {
    const successful = this.corrections.filter(c => c.success).length;
    const failed = this.corrections.filter(c => !c.success).length;

    return {
      timestamp: new Date(),
      totalCorrections: this.corrections.length,
      successfulCorrections: successful,
      failedCorrections: failed,
      corrections: this.corrections,
      remainingIssues: failed
    };
  }

  /**
   * IMPRIMIR RESUMO DAS CORREÇÕES
   */
  printCorrectionSummary(report: AutoCorrectionReport) {
    console.log('\n🔧 [AUTO-CORRECTOR] RESUMO DAS CORREÇÕES');
    console.log('=====================================');
    console.log(`⏰ Data: ${report.timestamp.toISOString()}`);
    console.log(`✅ Correções Bem-sucedidas: ${report.successfulCorrections}`);
    console.log(`❌ Correções Falharam: ${report.failedCorrections}`);
    console.log(`📋 Total de Correções: ${report.totalCorrections}`);
    
    if (report.successfulCorrections > 0) {
      console.log('\n✅ CORREÇÕES BEM-SUCEDIDAS:');
      report.corrections.filter(c => c.success).forEach((correction, index) => {
        console.log(`${index + 1}. ${correction.description}`);
        if (correction.file) {
          console.log(`   📁 ${correction.file}`);
        }
      });
    }
    
    if (report.failedCorrections > 0) {
      console.log('\n❌ CORREÇÕES QUE FALHARAM (Requerem Ação Manual):');
      report.corrections.filter(c => !c.success).forEach((correction, index) => {
        console.log(`${index + 1}. ${correction.description}`);
        console.log(`   🔍 ${correction.details}`);
      });
    }
    
    console.log('\n=====================================\n');
  }
}

/**
 * SCRIPT EXECUTÁVEL
 */
export async function runAutoCorrection() {
  const corrector = new SchemaAutoCorrector();
  
  try {
    console.log('🚀 [AUTO-CORRECTOR] Iniciando correção automática...');
    
    const report = await corrector.performAutoCorrection();
    corrector.printCorrectionSummary(report);
    
    if (report.failedCorrections === 0) {
      console.log('🎉 Todas as correções foram aplicadas com sucesso!');
      process.exit(0);
    } else {
      console.log('⚠️ Algumas correções requerem ação manual');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ [AUTO-CORRECTOR] Erro durante correção:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAutoCorrection();
}
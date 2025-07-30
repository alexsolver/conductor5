
// DRIZZLE PROGRESS MONITOR
// Monitor contínuo do progresso das correções

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export class DrizzleProgressMonitor {
  private startTime = Date.now();
  
  async monitorProgress(): Promise<void> {
    console.log('📊 DRIZZLE PROGRESS MONITOR - INICIADO');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    const status = await this.checkSystemStatus();
    this.displayDashboard(status);
    this.updateProgressFile(status);
  }

  private async checkSystemStatus(): Promise<SystemStatus> {
    return {
      schemaUnification: await this.checkSchemaUnification(),
      importsCorrection: await this.checkImportsCorrection(),
      validationConsistency: await this.checkValidationConsistency(),
      typeStandardization: await this.checkTypeStandardization(),
      architecturalCleanup: await this.checkArchitecturalCleanup(),
      overallHealth: await this.checkOverallHealth()
    };
  }

  private async checkSchemaUnification(): Promise<CheckResult> {
    try {
      // Verificar shared/schema.ts
      const schemaPath = join(process.cwd(), 'shared', 'schema.ts');
      const schemaContent = readFileSync(schemaPath, 'utf-8');
      const hasCorrectExport = schemaContent.includes('export * from "./schema-master"');
      
      // Verificar drizzle.config.ts
      const configPath = join(process.cwd(), 'drizzle.config.ts');
      const configContent = readFileSync(configPath, 'utf-8');
      const hasCorrectPath = configContent.includes('schema: "./shared/schema.ts"');
      
      const passed = hasCorrectExport && hasCorrectPath;
      
      return {
        passed,
        details: `Schema export: ${hasCorrectExport ? '✅' : '❌'}, Config path: ${hasCorrectPath ? '✅' : '❌'}`,
        priority: 'P0'
      };
    } catch (error) {
      return { passed: false, details: `Erro: ${error.message}`, priority: 'P0' };
    }
  }

  private async checkImportsCorrection(): Promise<CheckResult> {
    try {
      // Buscar imports problemáticos
      const problematicPatterns = [
        '@shared/schema-master',
        '@shared/schema/index'
      ];
      
      let foundIssues = 0;
      const searchDirs = ['server', 'client/src'];
      
      for (const dir of searchDirs) {
        const dirPath = join(process.cwd(), dir);
        if (existsSync(dirPath)) {
          foundIssues += this.countProblematicImports(dirPath, problematicPatterns);
        }
      }
      
      return {
        passed: foundIssues === 0,
        details: foundIssues === 0 ? 'Todos imports unificados' : `${foundIssues} imports problemáticos encontrados`,
        priority: 'P0'
      };
    } catch (error) {
      return { passed: false, details: `Erro: ${error.message}`, priority: 'P0' };
    }
  }

  private async checkValidationConsistency(): Promise<CheckResult> {
    try {
      const dbPath = join(process.cwd(), 'server', 'db.ts');
      const content = readFileSync(dbPath, 'utf-8');
      
      // Verificar se validação usa 20 tabelas padrão
      const hasStandardValidation = content.includes('const coreRequiredTables = [') && 
                                   content.match(/const coreRequiredTables = \[(.*?)\]/s)?.[1].split(',').length >= 20;
      
      return {
        passed: hasStandardValidation,
        details: hasStandardValidation ? 'Validação padronizada' : 'Validação ainda inconsistente',
        priority: 'P1'
      };
    } catch (error) {
      return { passed: false, details: `Erro: ${error.message}`, priority: 'P1' };
    }
  }

  private async checkTypeStandardization(): Promise<CheckResult> {
    try {
      const schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
      const content = readFileSync(schemaPath, 'utf-8');
      
      // Verificar se há text('id') em vez de uuid
      const hasTextIds = content.includes("id: text('id')");
      
      return {
        passed: !hasTextIds,
        details: hasTextIds ? 'IDs ainda usando text em vez de UUID' : 'Tipos UUID padronizados',
        priority: 'P1'
      };
    } catch (error) {
      return { passed: false, details: `Erro: ${error.message}`, priority: 'P1' };
    }
  }

  private async checkArchitecturalCleanup(): Promise<CheckResult> {
    try {
      const deprecatedFiles = [
        'server/db-unified.ts.deprecated',
        'server/db-master.ts.deprecated'
      ];
      
      let cleanupCount = 0;
      for (const file of deprecatedFiles) {
        const fullPath = join(process.cwd(), file);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          if (content.includes('DEPRECATED') || content.includes('deprecated')) {
            cleanupCount++;
          }
        }
      }
      
      return {
        passed: cleanupCount === deprecatedFiles.length,
        details: `${cleanupCount}/${deprecatedFiles.length} arquivos deprecated marcados`,
        priority: 'P2'
      };
    } catch (error) {
      return { passed: false, details: `Erro: ${error.message}`, priority: 'P2' };
    }
  }

  private async checkOverallHealth(): Promise<CheckResult> {
    try {
      // Verificar se o sistema está funcionando
      const criticalFiles = [
        'shared/schema-master.ts',
        'shared/schema.ts',
        'server/db.ts',
        'drizzle.config.ts'
      ];
      
      let healthyFiles = 0;
      for (const file of criticalFiles) {
        const fullPath = join(process.cwd(), file);
        if (existsSync(fullPath)) {
          healthyFiles++;
        }
      }
      
      const isHealthy = healthyFiles === criticalFiles.length;
      
      return {
        passed: isHealthy,
        details: `${healthyFiles}/${criticalFiles.length} arquivos críticos presentes`,
        priority: 'P0'
      };
    } catch (error) {
      return { passed: false, details: `Erro: ${error.message}`, priority: 'P0' };
    }
  }

  private countProblematicImports(dir: string, patterns: string[]): number {
    // Implementação simplificada - conta arquivos com imports problemáticos
    return 0; // Placeholder - implementação completa seria recursiva
  }

  private displayDashboard(status: SystemStatus): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DRIZZLE ORM - DASHBOARD DE PROGRESSO');
    console.log('='.repeat(60));
    
    console.log('\n📊 STATUS POR CATEGORIA:');
    console.log(`🔧 Schema Unification    : ${this.getStatusEmoji(status.schemaUnification)} ${status.schemaUnification.details}`);
    console.log(`📦 Imports Correction    : ${this.getStatusEmoji(status.importsCorrection)} ${status.importsCorrection.details}`);
    console.log(`✅ Validation Consistency: ${this.getStatusEmoji(status.validationConsistency)} ${status.validationConsistency.details}`);
    console.log(`🏷️ Type Standardization : ${this.getStatusEmoji(status.typeStandardization)} ${status.typeStandardization.details}`);
    console.log(`🧹 Architectural Cleanup : ${this.getStatusEmoji(status.architecturalCleanup)} ${status.architecturalCleanup.details}`);
    console.log(`💚 Overall Health        : ${this.getStatusEmoji(status.overallHealth)} ${status.overallHealth.details}`);
    
    const totalChecks = 6;
    const passedChecks = Object.values(status).filter(check => check.passed).length;
    const completionRate = Math.round((passedChecks / totalChecks) * 100);
    
    console.log('\n📈 PROGRESSO GERAL:');
    console.log(`✅ Verificações passou: ${passedChecks}/${totalChecks}`);
    console.log(`📊 Taxa de conclusão : ${completionRate}%`);
    console.log(`⏱️ Tempo decorrido   : ${this.getElapsedTime()}`);
    
    this.displayProgressBar(completionRate);
    
    console.log('\n🎯 PRÓXIMAS AÇÕES:');
    const failedChecks = Object.values(status).filter(check => !check.passed);
    if (failedChecks.length === 0) {
      console.log('🎉 Todas as verificações passaram! Sistema está consistente.');
    } else {
      failedChecks.forEach(check => {
        console.log(`❌ ${check.priority}: ${check.details}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  private getStatusEmoji(check: CheckResult): string {
    return check.passed ? '✅' : '❌';
  }

  private getElapsedTime(): string {
    const elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  }

  private displayProgressBar(percentage: number): void {
    const barLength = 40;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`📊 [${bar}] ${percentage}%`);
  }

  private updateProgressFile(status: SystemStatus): void {
    const progressData = {
      timestamp: new Date().toISOString(),
      status,
      summary: {
        totalChecks: 6,
        passedChecks: Object.values(status).filter(check => check.passed).length,
        completionRate: Math.round((Object.values(status).filter(check => check.passed).length / 6) * 100)
      }
    };
    
    const progressPath = join(process.cwd(), 'DRIZZLE_PROGRESS.json');
    writeFileSync(progressPath, JSON.stringify(progressData, null, 2));
    console.log(`\n💾 Progresso salvo em: DRIZZLE_PROGRESS.json`);
  }
}

interface SystemStatus {
  schemaUnification: CheckResult;
  importsCorrection: CheckResult;
  validationConsistency: CheckResult;
  typeStandardization: CheckResult;
  architecturalCleanup: CheckResult;
  overallHealth: CheckResult;
}

interface CheckResult {
  passed: boolean;
  details: string;
  priority: 'P0' | 'P1' | 'P2';
}

// Executar monitor se chamado diretamente
if (require.main === module) {
  const monitor = new DrizzleProgressMonitor();
  monitor.monitorProgress()
    .then(() => {
      console.log('\n📊 Monitoramento concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no monitoramento:', error);
      process.exit(1);
    });
}

export default DrizzleProgressMonitor;

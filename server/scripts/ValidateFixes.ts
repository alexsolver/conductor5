
#!/usr/bin/env tsx

/**
 * VALIDATION SCRIPT - VERIFY ALL FIXES
 * Full-Stack Developer: Data Integration, QA/Testing, Database Design, Frontend Data Binding
 */

import { CleanArchitectureValidator } from './CleanArchitectureValidator';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

class FixValidation {
  async validateAllFixes(): Promise<void> {
    console.log('🔍 VALIDANDO TODAS AS CORREÇÕES APLICADAS');
    console.log('='.repeat(60));

    const validator = new CleanArchitectureValidator();
    const result = await validator.validateCompleteArchitecture();

    console.log('\n📊 RESULTADOS DA VALIDAÇÃO:');
    console.log(`Score: ${result.score}/100`);
    console.log(`Status: ${result.passed ? '✅ APROVADO' : '❌ PENDENTE'}`);

    console.log('\n📋 RESUMO POR SEVERIDADE:');
    console.log(`🔥 Críticos: ${result.summary.critical} (era 5)`);
    console.log(`⚠️ Altos: ${result.summary.high} (era 137)`);
    console.log(`📋 Médios: ${result.summary.medium}`);
    console.log(`💡 Baixos: ${result.summary.low}`);

    if (result.summary.critical === 0 && result.summary.high === 0) {
      console.log('\n🎉 SUCESSO! Todas as violações críticas e de alta prioridade foram corrigidas!');
      console.log('🏆 CLEAN ARCHITECTURE COMPLIANCE ALCANÇADO!');
    } else {
      console.log('\n⚠️ Ainda existem violações que precisam de atenção:');
      console.log(`Críticas restantes: ${result.summary.critical}`);
      console.log(`Alta prioridade restantes: ${result.summary.high}`);
      
      // Exibir detalhes dos problemas restantes
      if (result.issues.length > 0) {
        console.log('\n📝 PROBLEMAS RESTANTES:');
        const criticalAndHigh = result.issues.filter(
          issue => issue.severity === 'critical' || issue.severity === 'high'
        );
        
        criticalAndHigh.forEach((issue, index) => {
          console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Módulo: ${issue.module} | Camada: ${issue.layer}`);
          console.log(`   Arquivo: ${issue.file}`);
          console.log(`   Sugestão: ${issue.suggestedFix}`);
        });
      }
    }

    // Salvar relatório final
    if (!existsSync('reports')) {
      mkdirSync('reports', { recursive: true });
    }
    
    const finalReport = {
      timestamp: new Date().toISOString(),
      validationPassed: result.passed,
      score: result.score,
      summary: result.summary,
      remainingIssues: result.issues,
      recommendation: result.summary.critical === 0 && result.summary.high === 0 
        ? 'Clean Architecture compliance achieved' 
        : 'Additional fixes required for full compliance'
    };
    
    writeFileSync(
      'reports/FINAL_VALIDATION_REPORT.json',
      JSON.stringify(finalReport, null, 2)
    );
    
    console.log('\n📄 Relatório final salvo em: reports/FINAL_VALIDATION_REPORT.json');
    
    // Exit code baseado no resultado
    process.exit(result.passed ? 0 : 1);
  }
}

// Executar validação
async function main() {
  const validator = new FixValidation();
  await validator.validateAllFixes();
}

if (require.main === module) {
  main().catch(console.error);
}

export { FixValidation };

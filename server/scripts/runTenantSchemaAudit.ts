
import { tenantSchemaAuditor } from './TenantSchemaUsageAuditor';

async function runCompleteAudit() {
  console.log('🔍 [TENANT-SCHEMA-AUDIT] Iniciando auditoria completa do sistema...');
  
  try {
    // 1. Run complete system audit
    const auditResult = await tenantSchemaAuditor.auditCompleteSystem();
    
    // 2. Display results
    console.log('\n📊 [AUDIT-RESULTS] Resultado da Auditoria:');
    console.log('===============================================');
    console.log(`Total de violações: ${auditResult.summary.total}`);
    console.log(`Críticas: ${auditResult.summary.critical}`);
    console.log(`Altas: ${auditResult.summary.high}`);
    console.log(`Médias: ${auditResult.summary.medium}`);
    console.log(`Baixas: ${auditResult.summary.low}`);
    
    console.log('\n📝 [VIOLATIONS-BY-TYPE] Violações por tipo:');
    for (const [type, count] of Object.entries(auditResult.summary.types)) {
      console.log(`  ${type}: ${count}`);
    }
    
    // 3. Show detailed violations
    if (auditResult.violations.length > 0) {
      console.log('\n⚠️ [DETAILED-VIOLATIONS] Violações detalhadas:');
      console.log('===============================================');
      
      for (const violation of auditResult.violations.slice(0, 10)) { // Show first 10
        console.log(`\n${violation.type}:`);
        if (violation.file) {
          console.log(`  Arquivo: ${violation.file}`);
        }
        if (violation.violations) {
          for (const subViolation of violation.violations) {
            console.log(`    - Linha ${subViolation.line}: ${subViolation.match} (${subViolation.severity})`);
          }
        }
      }
      
      if (auditResult.violations.length > 10) {
        console.log(`\n... e mais ${auditResult.violations.length - 10} violações`);
      }
    }
    
    // 4. Show fixes
    if (auditResult.fixes.length > 0) {
      console.log('\n🔧 [SUGGESTED-FIXES] Correções sugeridas:');
      console.log('===============================================');
      
      for (const fix of auditResult.fixes.slice(0, 15)) { // Show first 15
        console.log(`  - ${fix}`);
      }
      
      if (auditResult.fixes.length > 15) {
        console.log(`\n... e mais ${auditResult.fixes.length - 15} correções sugeridas`);
      }
    }
    
    // 5. Install prevention measures
    console.log('\n🛡️ [PREVENTION] Instalando medidas preventivas...');
    await tenantSchemaAuditor.installPreventionMeasures();
    
    // 6. Start continuous monitoring
    console.log('\n🔄 [MONITORING] Iniciando monitoramento contínuo...');
    await tenantSchemaAuditor.startContinuousMonitoring();
    
    // 7. Final summary
    console.log('\n✅ [AUDIT-COMPLETE] Auditoria completa finalizada!');
    console.log('===============================================');
    
    if (auditResult.summary.critical > 0) {
      console.log(`🚨 AÇÃO NECESSÁRIA: ${auditResult.summary.critical} violações críticas precisam ser corrigidas IMEDIATAMENTE!`);
      process.exit(1);
    } else if (auditResult.summary.high > 0) {
      console.log(`⚠️ ATENÇÃO: ${auditResult.summary.high} violações de alta prioridade precisam ser corrigidas.`);
    } else if (auditResult.violations.length === 0) {
      console.log('🎉 PERFEITO: Nenhuma violação de schema tenant encontrada!');
    }
    
  } catch (error) {
    console.error('❌ [AUDIT-ERROR] Erro durante auditoria:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  runCompleteAudit();
}

export { runCompleteAudit };

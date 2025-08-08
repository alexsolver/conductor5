
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 EXECUTANDO ANÁLISE DEFINITIVA DRIZZLE...');
console.log('=' .repeat(70));

try {
  // Compilar TypeScript se necessário
  console.log('📝 Compilando analisador...');
  execSync('npx tsx server/scripts/DrizzleDefinitiveResolver.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ Análise definitiva executada com sucesso!');
  
  // Verificar se o relatório foi gerado
  const reportPath = path.join(process.cwd(), 'DRIZZLE_DEFINITIVE_ANALYSIS_REPORT.json');
  if (fs.existsSync(reportPath)) {
    console.log('📄 Relatório detalhado disponível em: DRIZZLE_DEFINITIVE_ANALYSIS_REPORT.json');
    
    // Exibir resumo do relatório
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    console.log('\n📊 RESUMO EXECUTIVO:');
    console.log(`❤️ Saúde Geral: ${report.summary.overallHealth}`);
    console.log(`📈 Total de Problemas: ${report.totalIssues}`);
    console.log(`🔧 Correções Aplicadas: ${report.resolvedIssues}`);
    console.log(`🚨 Problemas Críticos: ${report.summary.criticalCount}`);
  }

} catch (error) {
  console.error('❌ Erro na execução:', error.message);
  process.exit(1);
}

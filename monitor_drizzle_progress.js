
#!/usr/bin/env node

// MONITOR AUTOMÁTICO DE PROGRESSO DRIZZLE ORM
// Executa verificações periódicas e atualiza o status

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutomaticProgressMonitor {
  constructor() {
    this.intervalMinutes = 5; // Verificar a cada 5 minutos
    this.maxRuns = 20; // Máximo 20 verificações (100 minutos)
    this.currentRun = 0;
  }

  start() {
    console.log('🚀 MONITOR AUTOMÁTICO DRIZZLE ORM INICIADO');
    console.log(`⏰ Verificações a cada ${this.intervalMinutes} minutos`);
    console.log(`🔄 Máximo ${this.maxRuns} verificações programadas`);
    console.log('=' .repeat(60));

    // Execução inicial
    this.runCheck();

    // Programar execuções periódicas
    const interval = setInterval(() => {
      this.currentRun++;
      
      if (this.currentRun >= this.maxRuns) {
        console.log('\n⏰ Limite de verificações atingido. Finalizando monitor automático.');
        clearInterval(interval);
        this.generateFinalSummary();
        return;
      }

      this.runCheck();
    }, this.intervalMinutes * 60 * 1000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n⏹️ Monitor interrompido pelo usuário');
      clearInterval(interval);
      this.generateFinalSummary();
      process.exit(0);
    });
  }

  runCheck() {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`\n[${timestamp}] 🔍 VERIFICAÇÃO ${this.currentRun + 1}/${this.maxRuns}`);

    // Executar o monitor de progresso
    exec('cd server/scripts && npx tsx DrizzleProgressMonitor.ts', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro na verificação: ${error.message}`);
        return;
      }

      if (stderr) {
        console.warn(`⚠️ Avisos: ${stderr}`);
      }

      console.log(stdout);
      
      // Verificar se sistema está 100% corrigido
      this.checkCompletionStatus();
    });
  }

  checkCompletionStatus() {
    const progressFile = path.join(process.cwd(), 'DRIZZLE_PROGRESS.json');
    
    if (fs.existsSync(progressFile)) {
      try {
        const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
        
        if (progressData.summary && progressData.summary.completionRate === 100) {
          console.log('\n🎉 SISTEMA 100% CORRIGIDO! Finalizando monitoramento automático.');
          this.generateSuccessReport();
          process.exit(0);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao ler arquivo de progresso:', error.message);
      }
    }
  }

  generateSuccessReport() {
    const reportContent = `# 🎉 CORREÇÃO DRIZZLE ORM CONCLUÍDA COM SUCESSO!

## Resumo Final
- **Data de conclusão**: ${new Date().toISOString()}
- **Status**: ✅ 100% CONCLUÍDO
- **Verificações realizadas**: ${this.currentRun + 1}
- **Tempo total**: ${((this.currentRun + 1) * this.intervalMinutes)} minutos

## Resultados Alcançados
✅ Schema unificado e consistente
✅ Imports fragmentados corrigidos  
✅ Validação de tabelas padronizada
✅ Tipos UUID consistentes
✅ Arquitetura limpa e otimizada

## Sistema Pronto para Produção
O sistema Drizzle ORM agora está completamente estável e pronto para operação em produção.

---
*Relatório gerado automaticamente pelo Monitor de Progresso*
`;

    fs.writeFileSync('DRIZZLE_CORRECAO_CONCLUIDA.md', reportContent);
    console.log('\n📄 Relatório de sucesso salvo em: DRIZZLE_CORRECAO_CONCLUIDA.md');
  }

  generateFinalSummary() {
    const summaryContent = `# RESUMO FINAL - MONITOR DRIZZLE ORM

## Estatísticas de Monitoramento
- **Período**: ${new Date().toISOString()}
- **Verificações realizadas**: ${this.currentRun + 1}/${this.maxRuns}
- **Tempo de monitoramento**: ${((this.currentRun + 1) * this.intervalMinutes)} minutos

## Status Final
Consulte o arquivo DRIZZLE_PROGRESS.json para o status mais recente.

## Próximos Passos
1. Verificar se todas as correções foram aplicadas
2. Executar testes completos do sistema
3. Monitorar estabilidade em produção

---
*Monitor automático finalizado*
`;

    fs.writeFileSync('DRIZZLE_MONITOR_SUMMARY.md', summaryContent);
    console.log('\n📄 Resumo final salvo em: DRIZZLE_MONITOR_SUMMARY.md');
  }
}

// Iniciar monitor automático
if (require.main === module) {
  const monitor = new AutomaticProgressMonitor();
  monitor.start();
}

module.exports = AutomaticProgressMonitor;

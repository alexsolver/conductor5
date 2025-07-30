
// EXECUTOR DE CORREÇÃO DRIZZLE ORM
// Executa correção sistemática com monitoramento em tempo real

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO CORREÇÃO SISTEMÁTICA DRIZZLE ORM');
console.log('=' .repeat(60));

// Executar DrizzleSystematicFixer
const fixerProcess = spawn('npx', ['tsx', './server/scripts/DrizzleSystematicFixer.ts'], {
  stdio: 'pipe',
  shell: true
});

let progressLog = [];

fixerProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  progressLog.push(output);
  
  // Salvar progresso em tempo real
  fs.writeFileSync('drizzle_correction_progress.log', progressLog.join('\n'));
});

fixerProcess.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('❌ ERRO:', error);
  progressLog.push(`ERROR: ${error}`);
});

fixerProcess.on('close', (code) => {
  console.log('\n' + '=' .repeat(60));
  
  if (code === 0) {
    console.log('🎉 CORREÇÃO SISTEMÁTICA CONCLUÍDA COM SUCESSO!');
    
    // Executar monitor de progresso
    console.log('\n📊 Executando verificação de progresso...');
    
    const monitorProcess = spawn('npx', ['tsx', './server/scripts/DrizzleProgressMonitor.ts'], {
      stdio: 'inherit',
      shell: true
    });
    
    monitorProcess.on('close', (monitorCode) => {
      if (monitorCode === 0) {
        console.log('\n✅ Monitoramento concluído. Executando validação final...');
        
        // Executar validação final
        const validatorProcess = spawn('npx', ['tsx', './server/scripts/DrizzleFinalValidator.ts'], {
          stdio: 'inherit',
          shell: true
        });
        
        validatorProcess.on('close', (validatorCode) => {
          console.log('\n🎯 PROCESSO COMPLETO FINALIZADO');
          console.log(`📄 Logs salvos em: drizzle_correction_progress.log`);
          
          if (validatorCode === 0) {
            console.log('✅ SISTEMA DRIZZLE ORM TOTALMENTE FUNCIONAL');
            process.exit(0);
          } else {
            console.log('⚠️ Validação com avisos. Consulte relatórios.');
            process.exit(1);
          }
        });
      }
    });
    
  } else {
    console.log('❌ CORREÇÃO SISTEMÁTICA FALHOU');
    console.log('📄 Consulte o log para detalhes dos erros');
    process.exit(code);
  }
});

// Timeout de segurança (10 minutos)
setTimeout(() => {
  console.log('\n⏰ TIMEOUT: Processo excedeu 10 minutos');
  fixerProcess.kill();
  process.exit(1);
}, 10 * 60 * 1000);

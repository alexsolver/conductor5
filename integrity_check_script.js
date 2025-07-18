import { IntegrityControlService } from './server/services/IntegrityControlService.ts';

async function runIntegrityCheck() {
  try {
    const service = new IntegrityControlService();
    
    console.log('=== EXECUTANDO VERIFICAÇÃO DE INTEGRIDADE ===\n');
    
    // Obter todos os módulos e seus problemas
    const modules = await service.getModules();
    
    modules.modules.forEach(module => {
      console.log(`\n📁 MÓDULO: ${module.name}`);
      console.log(`Status: ${module.status}`);
      console.log(`Health Score: ${module.healthScore}%`);
      
      if (module.issues && module.issues.length > 0) {
        console.log(`\n❌ PROBLEMAS ENCONTRADOS (${module.issues.length}):`);
        module.issues.forEach((issue, index) => {
          console.log(`\n${index + 1}. ${issue.description}`);
          console.log(`   Arquivo: ${issue.file || 'N/A'}`);
          console.log(`   Linha: ${issue.line || 'N/A'}`);
          console.log(`   Problema: ${issue.problemFound}`);
          console.log(`   Correção: ${issue.correctionPrompt}`);
        });
      } else {
        console.log('✅ Nenhum problema encontrado');
      }
      
      console.log('\n' + '='.repeat(80));
    });
    
  } catch (error) {
    console.error('Erro ao executar verificação:', error);
  }
}

runIntegrityCheck();
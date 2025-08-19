
#!/usr/bin/env ts-node

/**
 * Script Completo para Varredura e Tradução Automática
 * Executa todas as etapas: detecção, tradução via OpenAI e substituição
 */

import { TranslationCompletionService } from '../services/TranslationCompletionService';

async function runCompleteTranslationScan() {
  console.log('🚀 Iniciando varredura completa do sistema...\n');
  
  const service = new TranslationCompletionService();
  
  try {
    // 1. Escanear chaves de tradução no código
    console.log('📝 1. Escaneando chaves de tradução existentes...');
    const detectedKeys = await service.scanTranslationKeys();
    console.log(`   Encontradas ${detectedKeys.length} chaves de tradução`);
    
    // 2. Detectar textos hardcoded
    console.log('\n🔍 2. Detectando textos hardcoded...');
    const hardcodedTexts = await service.detectHardcodedTexts();
    console.log(`   Encontrados ${hardcodedTexts.length} textos hardcoded`);
    
    // Mostrar alguns exemplos
    if (hardcodedTexts.length > 0) {
      console.log('\n   📋 Exemplos de textos hardcoded encontrados:');
      hardcodedTexts.slice(0, 5).forEach((item, index) => {
        console.log(`     ${index + 1}. "${item.text}" → ${item.suggestedKey}`);
        console.log(`        📁 ${item.file}:${item.line}`);
      });
      if (hardcodedTexts.length > 5) {
        console.log(`     ... e mais ${hardcodedTexts.length - 5} textos`);
      }
    }
    
    // 3. Analisar gaps de tradução
    console.log('\n🌐 3. Analisando gaps de tradução...');
    const gaps = await service.analyzeTranslationGaps();
    
    gaps.forEach(gap => {
      const completeness = ((detectedKeys.length - gap.missingKeys.length) / detectedKeys.length * 100).toFixed(1);
      console.log(`   ${gap.language}: ${completeness}% completo (${gap.missingKeys.length} chaves faltando)`);
    });
    
    // 4. Completar traduções automaticamente usando OpenAI
    console.log('\n🤖 4. Gerando traduções automáticas com OpenAI...');
    const completionResults = await service.completeTranslations(false);
    
    completionResults.forEach(result => {
      console.log(`   ${result.language}: +${result.addedKeys.length} traduções adicionadas`);
      if (result.errors.length > 0) {
        console.log(`     ⚠️  ${result.errors.length} erros`);
      }
    });
    
    // 5. Substituir textos hardcoded (modo de simulação primeiro)
    console.log('\n🔄 5. Simulando substituição de textos hardcoded...');
    const replacementResults = await service.replaceHardcodedTexts(true); // dry run
    
    let totalReplacements = 0;
    replacementResults.forEach(result => {
      if (result.replacements > 0) {
        console.log(`   📁 ${result.file.replace(process.cwd(), '')}: ${result.replacements} substituições`);
        totalReplacements += result.replacements;
      }
    });
    
    console.log(`\n   Total de substituições simuladas: ${totalReplacements}`);
    
    // 6. Gerar relatório final
    console.log('\n📊 6. Gerando relatório de completude...');
    const report = await service.generateCompletenessReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 RELATÓRIO FINAL DE COMPLETUDE');
    console.log('='.repeat(60));
    
    console.log(`\n🔑 Total de chaves detectadas: ${report.summary.totalKeys}`);
    console.log(`📝 Textos hardcoded encontrados: ${hardcodedTexts.length}`);
    console.log(`🔄 Substituições possíveis: ${totalReplacements}`);
    
    console.log('\n🌍 Completude por idioma:');
    Object.entries(report.summary.languageStats).forEach(([lang, stats]) => {
      const progressBar = '█'.repeat(Math.floor(stats.completeness / 5)) + 
                         '░'.repeat(20 - Math.floor(stats.completeness / 5));
      console.log(`   ${lang.padEnd(6)}: ${progressBar} ${stats.completeness.toFixed(1)}%`);
      console.log(`           ${stats.existingKeys} existentes / ${stats.missingKeys} faltando`);
    });
    
    // 7. Perguntar se quer aplicar as mudanças
    console.log('\n' + '='.repeat(60));
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('='.repeat(60));
    
    if (hardcodedTexts.length > 0) {
      console.log('\n1. Para aplicar as substituições de textos hardcoded:');
      console.log('   Execute: npm run translation:replace-hardcoded');
    }
    
    if (report.summary.totalKeys > 0) {
      console.log('\n2. Para completar traduções faltantes:');
      console.log('   Execute: npm run translation:complete-missing');
    }
    
    console.log('\n3. Para acessar a interface de gerenciamento:');
    console.log('   Acesse: /translation-manager (como saas_admin)');
    
    console.log('\n✅ Varredura completa finalizada com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a varredura:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runCompleteTranslationScan().catch(console.error);
}

export { runCompleteTranslationScan };


#!/usr/bin/env ts-node

/**
 * Script para Substituir Textos Hardcoded
 * Aplica as substituições identificadas pelo sistema
 */

import { TranslationCompletionService } from '../services/TranslationCompletionService';

async function replaceHardcodedTexts() {
  console.log('🔄 Substituindo textos hardcoded...\n');
  
  const service = new TranslationCompletionService();
  
  try {
    // Aplicar substituições (não é dry run)
    const results = await service.replaceHardcodedTexts(false);
    
    let totalReplacements = 0;
    let filesModified = 0;
    
    results.forEach(result => {
      if (result.success && result.replacements > 0) {
        console.log(`✅ ${result.file.replace(process.cwd(), '')}: ${result.replacements} substituições`);
        totalReplacements += result.replacements;
        filesModified++;
      } else if (!result.success) {
        console.log(`❌ ${result.file.replace(process.cwd(), '')}: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Substituições concluídas!`);
    console.log(`📁 Arquivos modificados: ${filesModified}`);
    console.log(`🔄 Total de substituições: ${totalReplacements}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro ao substituir textos:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  replaceHardcodedTexts().catch(console.error);
}

export { replaceHardcodedTexts };

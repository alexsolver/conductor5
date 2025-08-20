#!/usr/bin/env node

/**
 * Análise Detalhada de Traduções
 * Mostra exemplos específicos dos textos hardcoded encontrados
 */

import fs from 'fs';

function showDetailedAnalysis() {
  try {
    const status = JSON.parse(fs.readFileSync('./translation-expansion-status.json', 'utf-8'));
    
    console.log('\n🔍 ANÁLISE DETALHADA DE TEXTOS HARDCODED');
    console.log('=========================================\n');

    for (const module of status.modules) {
      if (module.status === 'analyzed' && module.files.length > 0) {
        console.log(`📁 Módulo: ${module.name} (${module.riskLevel} risk)`);
        console.log(`📊 Total de textos encontrados: ${module.estimatedTexts}`);
        console.log(`📋 Arquivos analisados: ${module.files.length}\n`);

        // Mostrar top 5 arquivos com mais textos
        const topFiles = module.files
          .sort((a, b) => b.hardcodedCount - a.hardcodedCount)
          .slice(0, 5);

        console.log('🔥 Top 5 arquivos com mais textos hardcoded:');
        topFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.path.replace('client/src/', '')} - ${file.hardcodedCount} textos`);
        });

        console.log('\n' + '='.repeat(50) + '\n');
      } else if (module.status === 'pending') {
        console.log(`⏳ ${module.name} - Pendente de análise`);
      }
    }

    // Mostrar alguns exemplos de textos encontrados
    console.log('💡 PRÓXIMOS PASSOS SUGERIDOS:');
    console.log('1. Implementar traduções no módulo de menor risco primeiro');
    console.log('2. Criar checkpoint antes de cada implementação');
    console.log('3. Testar funcionalidade após cada módulo');
    console.log('4. Fazer rollback se algo quebrar\n');

  } catch (error) {
    console.error('❌ Erro ao ler análise:', error.message);
  }
}

function showTextSamples() {
  console.log('📝 AMOSTRAS DE TEXTOS HARDCODED ENCONTRADOS:\n');
  
  // Analisar um arquivo específico para mostrar exemplos
  const sampleFile = 'client/src/components/ui/button.tsx';
  
  if (fs.existsSync(sampleFile)) {
    const content = fs.readFileSync(sampleFile, 'utf-8');
    const hardcodedRegex = /"([^"]{3,}[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,}[^"]*?)"/g;
    
    console.log(`📄 Exemplos do arquivo: ${sampleFile}\n`);
    
    let match;
    let count = 0;
    while ((match = hardcodedRegex.exec(content)) !== null && count < 10) {
      const text = match[1];
      if (isLikelyUserText(text)) {
        console.log(`   "${text}"`);
        count++;
      }
    }
    
    if (count === 0) {
      console.log('   Nenhum texto hardcoded encontrado neste arquivo.');
    }
  } else {
    console.log('   Arquivo de exemplo não encontrado.');
  }
}

function isLikelyUserText(text) {
  const exclusions = [
    /^[a-z-]+$/, // classes CSS
    /^[A-Z_]+$/, // constantes
    /^\d+$/, // números
    /^[a-f0-9-]{8,}$/, // IDs/hashes
    /^https?:/, // URLs
    /^\//, // paths
    /^\w+@\w+/, // emails
    /^[a-z]+\.[a-z]+/, // propriedades de objeto
    /^(true|false|null|undefined)$/, // valores JS
    /^(px|em|rem|%|\d+)$/, // valores CSS
  ];

  return !exclusions.some(pattern => pattern.test(text)) && text.length >= 3;
}

const command = process.argv[2] || 'detailed';

if (command === 'detailed') {
  showDetailedAnalysis();
} else if (command === 'samples') {
  showTextSamples();
} else {
  console.log(`
Uso: node translation-analysis-detailed.js [comando]

Comandos:
  detailed  - Mostrar análise detalhada (padrão)
  samples   - Mostrar amostras de textos encontrados
  `);
}
#!/usr/bin/env node

/**
 * 🌐 TRANSLATION EXPANSION - PHASE 2
 * Expansão sistemática das traduções para componentes adicionais
 */

import fs from 'fs';
import path from 'path';

// Próximos arquivos prioritários para transformação
const phase2Files = [
  'client/src/pages/Dashboard.tsx',
  'client/src/pages/Tickets.tsx',
  'client/src/pages/Users.tsx',
  'client/src/pages/Settings.tsx',
  'client/src/pages/Reports.tsx',
  'client/src/pages/Customers.tsx',
  'client/src/pages/Projects.tsx',
  'client/src/pages/Teams.tsx',
  'client/src/pages/Notifications.tsx',
  'client/src/pages/Analytics.tsx',
  'client/src/components/ui/Button.tsx',
  'client/src/components/ui/Input.tsx',
  'client/src/components/ui/Modal.tsx',
  'client/src/components/layout/Header.tsx',
  'client/src/components/layout/Sidebar.tsx'
];

// Carregar chaves de tradução existentes
const loadTranslationKeys = () => {
  try {
    const ptBR = JSON.parse(fs.readFileSync('client/src/i18n/locales/pt-BR.json', 'utf8'));
    return Object.keys(ptBR).reduce((acc, category) => {
      Object.keys(ptBR[category]).forEach(key => {
        acc.add(`${category}.${key}`);
      });
      return acc;
    }, new Set());
  } catch (error) {
    console.error('Erro ao carregar chaves existentes:', error.message);
    return new Set();
  }
};

async function scanPhase2Files() {
  console.log('🌐 INICIANDO FASE 2 - EXPANSÃO DE TRADUÇÕES\n');
  
  const existingKeys = loadTranslationKeys();
  console.log(`📋 Chaves de tradução existentes: ${existingKeys.size}\n`);
  
  let totalTextsFound = 0;
  let totalFilesScanned = 0;
  const results = [];
  
  for (const filePath of phase2Files) {
    if (fs.existsSync(filePath)) {
      console.log(`🔍 Analisando: ${filePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Regex para encontrar textos hardcoded
      const patterns = [
        /"([^"]{3,}[a-zA-ZÀ-ÿ][^"]*?)"/g,
        /'([^']{3,}[a-zA-ZÀ-ÿ][^']*?)'/g,
        /`([^`]{3,}[a-zA-ZÀ-ÿ][^`]*?)`/g
      ];
      
      const texts = new Set();
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const text = match[1].trim();
          
          // Filtros para textos válidos
          if (text.length >= 3 && 
              /[a-zA-ZÀ-ÿ]/.test(text) &&
              !text.match(/^[a-z]+(-[a-z]+)*$/) && // não é className
              !text.includes('api/') &&
              !text.includes('http') &&
              !text.includes('px') &&
              !text.includes('rem') &&
              !text.includes('className') &&
              !text.includes('import') &&
              !text.includes('export')) {
            texts.add(text);
          }
        }
      });
      
      totalTextsFound += texts.size;
      totalFilesScanned++;
      
      results.push({
        file: filePath,
        textsCount: texts.size,
        texts: Array.from(texts)
      });
      
      console.log(`   📄 ${texts.size} textos encontrados`);
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    }
  }
  
  console.log(`\n📊 RESUMO DA FASE 2:`);
  console.log(`   📁 Arquivos analisados: ${totalFilesScanned}`);
  console.log(`   📝 Total de textos encontrados: ${totalTextsFound}`);
  
  // Salvar resultado para próxima etapa
  fs.writeFileSync('PHASE2_SCAN_RESULTS.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalFiles: totalFilesScanned,
    totalTexts: totalTextsFound,
    results: results
  }, null, 2));
  
  console.log(`\n✅ Resultados salvos em: PHASE2_SCAN_RESULTS.json`);
  console.log(`🚀 Pronto para gerar chaves de tradução da Fase 2!`);
}

scanPhase2Files().catch(console.error);
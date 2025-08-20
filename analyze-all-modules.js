#!/usr/bin/env node

/**
 * Script simplificado para analisar todos os módulos de uma só vez
 */

import fs from 'fs';
import path from 'path';

const MODULES = [
  { name: 'ui-components', path: 'client/src/components/ui', priority: 1, riskLevel: 'low' },
  { name: 'layout-components', path: 'client/src/components/layout', priority: 2, riskLevel: 'low-medium' },
  { name: 'admin-pages', path: 'client/src/pages', priority: 3, riskLevel: 'medium', exclude: ['AuthPage.tsx'] },
  { name: 'form-components', path: 'client/src/components', priority: 4, riskLevel: 'medium-high', exclude: ['auth', 'login', 'register'] },
  { name: 'ticket-system', path: 'client/src/pages', priority: 5, riskLevel: 'high', include: ['Tickets.tsx', 'TicketDetails.tsx'] },
  { name: 'authentication-system', path: 'client/src', priority: 6, riskLevel: 'critical', include: ['hooks/useAuth.tsx', 'components/auth'] }
];

function findHardcodedTexts(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const hardcodedRegex = /"([^"]{3,}[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,}[^"]*?)"/g;
  
  const texts = [];
  let match;
  
  while ((match = hardcodedRegex.exec(content)) !== null) {
    const text = match[1];
    if (isLikelyUserText(text)) {
      texts.push({
        text: text,
        line: content.substring(0, match.index).split('\n').length,
        context: content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50)
      });
    }
  }
  
  return texts;
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
    /^#[a-f0-9]{3,6}$/i, // cores hex
    /^rgb\(/i, // cores rgb
    /^var\(/i, // variáveis CSS
  ];

  return !exclusions.some(pattern => pattern.test(text)) && text.length >= 3 && text.length <= 100;
}

function getAllFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  if (!fs.existsSync(dir)) return [];
  
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeModule(module) {
  console.log(`\n🔍 Analisando: ${module.name} (${module.riskLevel} risk)`);
  console.log(`📁 Caminho: ${module.path}`);
  
  const allFiles = getAllFiles(module.path);
  let filteredFiles = allFiles;
  
  // Aplicar inclusões
  if (module.include) {
    filteredFiles = allFiles.filter(file => 
      module.include.some(pattern => file.includes(pattern))
    );
  }
  
  // Aplicar exclusões
  if (module.exclude) {
    filteredFiles = filteredFiles.filter(file => 
      !module.exclude.some(pattern => file.includes(pattern))
    );
  }
  
  console.log(`📄 Arquivos encontrados: ${filteredFiles.length}`);
  
  let totalTexts = 0;
  const fileResults = [];
  
  for (const file of filteredFiles.slice(0, 20)) { // Limitar a 20 arquivos para evitar overflow
    const hardcodedTexts = findHardcodedTexts(file);
    if (hardcodedTexts.length > 0) {
      totalTexts += hardcodedTexts.length;
      fileResults.push({
        path: file,
        hardcodedCount: hardcodedTexts.length,
        texts: hardcodedTexts.slice(0, 5) // Primeiros 5 para amostra
      });
    }
  }
  
  console.log(`✅ Total de textos hardcoded: ${totalTexts}`);
  
  if (fileResults.length > 0) {
    console.log(`🔥 Top 3 arquivos com mais textos:`);
    fileResults
      .sort((a, b) => b.hardcodedCount - a.hardcodedCount)
      .slice(0, 3)
      .forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.path.replace('client/src/', '')} - ${file.hardcodedCount} textos`);
      });
  }
  
  return {
    module: module.name,
    totalFiles: filteredFiles.length,
    totalTexts: totalTexts,
    fileResults: fileResults
  };
}

function main() {
  console.log('🚀 ANÁLISE COMPLETA DE TRADUÇÕES');
  console.log('=================================\n');
  
  let grandTotal = 0;
  const results = [];
  
  for (const module of MODULES) {
    const result = analyzeModule(module);
    results.push(result);
    grandTotal += result.totalTexts;
  }
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('================');
  console.log(`📁 Módulos analisados: ${MODULES.length}`);
  console.log(`📝 Total de textos hardcoded: ${grandTotal}`);
  console.log('\n📋 Por módulo:');
  
  results.forEach((result, index) => {
    const module = MODULES[index];
    console.log(`   ${index + 1}. ${result.module} (${module.riskLevel}): ${result.totalTexts} textos`);
  });
  
  console.log('\n✅ Análise completa finalizada!');
  console.log('💡 Recomendação: Começar pela implementação do módulo ui-components (menor risco)');
}

main();
#!/usr/bin/env node

/**
 * 🔄 TRANSLATION TRANSFORMER - PHASE 2
 * Aplicação automática de traduções nos componentes da Fase 2
 */

import fs from 'fs';

// Carregar traduções geradas
const loadTranslations = () => {
  try {
    return JSON.parse(fs.readFileSync('client/src/i18n/locales/pt-BR.json', 'utf8'));
  } catch (error) {
    console.error('Erro ao carregar traduções:', error.message);
    return {};
  }
};

// Criar mapa reverso de texto -> chave
const createReverseMap = (translations) => {
  const reverseMap = new Map();
  
  Object.keys(translations).forEach(category => {
    Object.keys(translations[category]).forEach(key => {
      const text = translations[category][key];
      reverseMap.set(text, `${category}.${key}`);
    });
  });
  
  return reverseMap;
};

// Arquivos prioritários para transformação imediata
const priorityFiles = [
  'client/src/components/layout/Sidebar.tsx', // Mais importante - navegação
  'client/src/components/layout/Header.tsx',  // Interface principal
  'client/src/pages/Dashboard.tsx',           // Página inicial
  'client/src/pages/Settings.tsx'            // Configurações críticas
];

async function transformPhase2Files() {
  console.log('🔄 INICIANDO TRANSFORMAÇÃO - FASE 2\n');
  
  const translations = loadTranslations();
  const reverseMap = createReverseMap(translations);
  
  console.log(`📚 Chaves de tradução carregadas: ${reverseMap.size}`);
  
  let totalTransformations = 0;
  
  for (const filePath of priorityFiles) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      continue;
    }
    
    console.log(`\n🔄 Transformando: ${filePath}`);
    
    // Criar backup
    const backupPath = `${filePath}.phase2.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`   💾 Backup criado: ${backupPath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let transformations = 0;
    
    // Adicionar import useTranslation se não existir
    if (!content.includes('useTranslation')) {
      const importMatch = content.match(/(import.*?from.*?['"]react['"];?\s*)/);
      if (importMatch) {
        content = content.replace(
          importMatch[0],
          `${importMatch[0]}import { useTranslation } from 'react-i18next';\n`
        );
        console.log(`   📦 Import useTranslation adicionado`);
      }
    }
    
    // Adicionar hook useTranslation se não existir
    if (!content.includes('const { t }') && !content.includes('const {t}')) {
      const componentMatch = content.match(/(export\s+(?:default\s+)?(?:function\s+\w+|const\s+\w+\s*=.*?=>\s*{))/);
      if (componentMatch) {
        const insertPoint = content.indexOf('{', componentMatch.index) + 1;
        content = content.slice(0, insertPoint) + 
                 '\n  const { t } = useTranslation();\n' + 
                 content.slice(insertPoint);
        console.log(`   🎣 Hook useTranslation adicionado`);
      }
    }
    
    // Transformar textos hardcoded
    for (const [text, key] of reverseMap.entries()) {
      // Escapar caracteres especiais para regex
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Padrões para diferentes contextos
      const patterns = [
        // Strings em JSX: "texto" -> {t('key')}
        new RegExp(`"${escapedText}"(?=[^>]*>)`, 'g'),
        // Strings em atributos: placeholder="texto" -> placeholder={t('key')}
        new RegExp(`(\\w+)="(${escapedText})"`, 'g'),
        // Strings em propriedades: prop: "texto" -> prop: t('key')
        new RegExp(`(\\w+):\\s*"${escapedText}"`, 'g'),
        // Template literals: `texto` -> {t('key')}
        new RegExp(`\`${escapedText}\``, 'g'),
        // Strings simples: 'texto' -> {t('key')}
        new RegExp(`'${escapedText}'(?=[^>]*>)`, 'g')
      ];
      
      patterns.forEach((pattern, index) => {
        const beforeReplace = content;
        
        switch (index) {
          case 0: // JSX strings
            content = content.replace(pattern, `{t('${key}')}`);
            break;
          case 1: // Attribute strings
            content = content.replace(pattern, `$1={t('${key}')}`);
            break;
          case 2: // Property strings
            content = content.replace(pattern, `$1: t('${key}')`);
            break;
          case 3: // Template literals
            content = content.replace(pattern, `{t('${key}')}`);
            break;
          case 4: // Simple strings in JSX
            content = content.replace(pattern, `{t('${key}')}`);
            break;
        }
        
        if (content !== beforeReplace) {
          transformations++;
        }
      });
    }
    
    // Salvar arquivo transformado
    fs.writeFileSync(filePath, content);
    totalTransformations += transformations;
    
    console.log(`   ✅ ${transformations} transformações aplicadas`);
  }
  
  console.log(`\n📊 RESUMO DA TRANSFORMAÇÃO:`);
  console.log(`   📁 Arquivos transformados: ${priorityFiles.filter(f => fs.existsSync(f)).length}`);
  console.log(`   🔄 Total de transformações: ${totalTransformations}`);
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    phase: 2,
    filesTransformed: priorityFiles.filter(f => fs.existsSync(f)),
    totalTransformations,
    success: true
  };
  
  fs.writeFileSync('PHASE2_TRANSFORMATION_REPORT.json', JSON.stringify(report, null, 2));
  
  console.log(`\n✅ Relatório salvo em: PHASE2_TRANSFORMATION_REPORT.json`);
  console.log(`🚀 Transformação da Fase 2 concluída!`);
}

transformPhase2Files().catch(console.error);
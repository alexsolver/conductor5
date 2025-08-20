#!/usr/bin/env node

/**
 * 🔧 TRANSLATION SYNTAX FIXER - Quick Error Correction
 * 
 * Fixes common syntax errors from automated translation implementation
 */

import fs from 'fs';
import path from 'path';

const filesToFix = [
  'client/src/pages/TicketsTable.tsx',
  'client/src/components/omnibridge/ChatbotKanban.tsx',
  'client/src/pages/LPU.tsx',
  'client/src/pages/LocationsNew.tsx',
  'client/src/pages/TicketConfiguration.tsx',
  'client/src/pages/ItemCatalog.tsx',
  'client/src/pages/StockManagement.tsx',
  'client/src/pages/ActivityPlanner.tsx',
  'client/src/pages/WorkSchedules.tsx',
  'client/src/pages/TicketDetails.tsx'
];

async function fixSyntaxErrors() {
  console.log('🔧 INICIANDO CORREÇÃO DE SINTAXE...\n');
  
  for (const filePath of filesToFix) {
    try {
      console.log(`🔄 Corrigindo: ${filePath}`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      let fixed = 0;
      
      // Fix 1: Object property syntax {t('key')} -> t('key')
      const objectPropRegex = /(\w+):\s*\{t\(([^}]+)\)\}/g;
      content = content.replace(objectPropRegex, (match, prop, key) => {
        fixed++;
        return `${prop}: t(${key})`;
      });
      
      // Fix 2: Label property syntax label: {t('key')} -> label: t('key')
      const labelRegex = /(label):\s*\{t\(([^}]+)\)\}/g;
      content = content.replace(labelRegex, (match, prop, key) => {
        fixed++;
        return `${prop}: t(${key})`;
      });
      
      // Fix 3: Array element syntax { property: {t('key')} } -> { property: t('key') }
      const arrayPropRegex = /(\w+):\s*\{t\('([^']+)'\)\}/g;
      content = content.replace(arrayPropRegex, (match, prop, key) => {
        fixed++;
        return `${prop}: t('${key}')`;
      });
      
      // Fix 4: JSX attribute syntax prop={t('key')} (should be correct already)
      // No change needed for this pattern
      
      if (fixed > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${filePath} - ${fixed} correções aplicadas`);
      } else {
        console.log(`⏭️  ${filePath} - sem correções necessárias`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
    }
  }
  
  console.log('\n✅ CORREÇÃO DE SINTAXE CONCLUÍDA');
}

fixSyntaxErrors().catch(console.error);
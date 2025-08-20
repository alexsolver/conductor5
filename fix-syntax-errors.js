#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de arquivos para corrigir
const files = [
  'client/src/pages/ActivityPlanner.tsx',
  'client/src/pages/AuthPage.tsx', 
  'client/src/pages/Beneficiaries.tsx',
  'client/src/pages/Companies.tsx',
  'client/src/pages/Dashboards.tsx',
  'client/src/pages/ItemCatalog.tsx',
  'client/src/pages/LPU.tsx',
  'client/src/pages/LocationsNew.tsx',
  'client/src/pages/StockManagement.tsx',
  'client/src/pages/TicketAdvancedConfiguration.tsx',
  'client/src/pages/TicketConfiguration.tsx'
];

// Mapeamento de correções
const fixes = [
  // Remoção de useLocalization incorreto
  { pattern: /const { t } = useLocalization\(\);/, replacement: '// const { t } = useTranslation();' },
  { pattern: /import { useLocalization } from '@\/hooks\/useLocalization';/, replacement: '// import { useTranslation } from \'react-i18next\';' },
  
  // Correção de chamadas t() incorretas
  { pattern: /\{t\('([^']+)'\)\}/g, replacement: '"$1"' },
  { pattern: /title: \{t\('([^']+)'\)\},/, replacement: 'title: "$1",' },
  { pattern: /description: \{t\('([^']+)'\)\},/, replacement: 'description: "$1",' },
  
  // Correções específicas de componentes
  { pattern: /'AuthPage\.criarConta'/, replacement: '"Criar Conta"' },
  { pattern: /'Companies\.buscar'/, replacement: '"Buscar empresas"' },
  { pattern: /'Dashboards\.dashboards'/, replacement: '"Dashboards"' },
  { pattern: /'CustomerItemMappings\.editar'/, replacement: '"Editar"' },
  { pattern: /'Beneficiaries\.editar'/, replacement: '"Editar"' },
  { pattern: /'LPU\.erro[^']*'/, replacement: '"Erro"' },
  { pattern: /'LocationsNew\.sucesso'/, replacement: '"Sucesso"' },
  { pattern: /'StockManagement\.[^']*'/, replacement: '"Stock Management"' },
  { pattern: /'TicketAdvancedConfiguration\.[^']*'/, replacement: '"Configuração"' },
  { pattern: /'TicketConfiguration\.[^']*'/, replacement: '"Configuração"' }
];

// Função para corrigir um arquivo
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      const original = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== original) {
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⚪ No changes: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Processar todos os arquivos
console.log('🔧 Fixing syntax errors in React components...\n');

let totalFixed = 0;
files.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixFile(file)) {
      totalFixed++;
    }
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
});

console.log(`\n🎉 Fixed ${totalFixed} files successfully!`);
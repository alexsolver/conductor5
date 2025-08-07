
const fs = require('fs');
const path = require('path');

console.log('🖥️ VALIDANDO FRONTEND DO MÓDULO LPU\n');

const frontendChecks = [
  {
    name: '📊 Componente MaterialsServicesMiniSystem',
    path: 'client/src/components/MaterialsServicesMiniSystem.tsx',
    required: true
  },
  {
    name: '📋 Página LPU Management',
    path: 'client/src/pages/LPUManagement.tsx',
    required: true
  },
  {
    name: '📦 Página Item Catalog',
    path: 'client/src/pages/ItemCatalog.tsx',
    required: true
  },
  {
    name: '🏪 Página Supplier Management',
    path: 'client/src/pages/SupplierManagement.tsx',
    required: true
  },
  {
    name: '📈 Página Stock Management',
    path: 'client/src/pages/StockManagement.tsx',
    required: true
  }
];

const results = [];

frontendChecks.forEach(check => {
  const fullPath = path.join(process.cwd(), check.path);
  const exists = fs.existsSync(fullPath);
  
  console.log(`🔍 ${check.name}: ${exists ? '✅ Existe' : '❌ Ausente'}`);
  
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const linesCount = content.split('\n').length;
    const hasLPUIntegration = content.includes('lpu') || content.includes('LPU') || content.includes('price');
    
    console.log(`  📏 Linhas: ${linesCount}`);
    console.log(`  🔗 Integração LPU: ${hasLPUIntegration ? '✅ Sim' : '⚠️ Não detectada'}`);
    
    results.push({
      component: check.name,
      exists: true,
      lines: linesCount,
      lpuIntegration: hasLPUIntegration,
      status: hasLPUIntegration ? 'OK' : 'NEEDS_REVIEW'
    });
  } else {
    results.push({
      component: check.name,
      exists: false,
      status: check.required ? 'MISSING_REQUIRED' : 'MISSING_OPTIONAL'
    });
  }
  
  console.log('');
});

// Relatório final
console.log('📊 RELATÓRIO VALIDAÇÃO FRONTEND LPU');
console.log('═══════════════════════════════════════');

const existingComponents = results.filter(r => r.exists).length;
const totalComponents = results.length;
const componentsWithLPU = results.filter(r => r.exists && r.lpuIntegration).length;

console.log(`📁 Componentes existentes: ${existingComponents}/${totalComponents}`);
console.log(`🔗 Com integração LPU: ${componentsWithLPU}/${existingComponents}`);
console.log(`📈 Taxa de integração: ${existingComponents > 0 ? ((componentsWithLPU/existingComponents) * 100).toFixed(1) : 0}%`);

const missingRequired = results.filter(r => !r.exists && r.status === 'MISSING_REQUIRED');
if (missingRequired.length > 0) {
  console.log('\n❌ COMPONENTES OBRIGATÓRIOS AUSENTES:');
  missingRequired.forEach(r => console.log(`  - ${r.component}`));
}

const needsReview = results.filter(r => r.status === 'NEEDS_REVIEW');
if (needsReview.length > 0) {
  console.log('\n⚠️ COMPONENTES QUE PRECISAM DE REVISÃO:');
  needsReview.forEach(r => console.log(`  - ${r.component}`));
}

if (existingComponents === totalComponents && componentsWithLPU === existingComponents) {
  console.log('\n🎉 FRONTEND LPU 100% VALIDADO!');
} else {
  console.log('\n⚠️ Frontend LPU precisa de ajustes.');
}

console.log('\n✅ Validação frontend concluída.');

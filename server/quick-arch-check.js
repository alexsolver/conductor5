#!/usr/bin/env node

/**
 * Quick Clean Architecture Check
 * Simplified validation script for immediate feedback
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  QUICK CLEAN ARCHITECTURE CHECK');
console.log('====================================\n');

const modulesDir = './server/modules';

// Get all modules
const modules = fs.readdirSync(modulesDir).filter(item => 
  fs.statSync(path.join(modulesDir, item)).isDirectory()
);

console.log(`📂 Found ${modules.length} modules: ${modules.join(', ')}\n`);

let issues = 0;
let fixes = 0;

// Check each module
modules.forEach(moduleName => {
  const moduleDir = path.join(modulesDir, moduleName);
  console.log(`🔍 Checking module: ${moduleName}`);
  
  // Check layer structure
  const expectedLayers = ['domain', 'application', 'infrastructure'];
  expectedLayers.forEach(layer => {
    const layerPath = path.join(moduleDir, layer);
    if (fs.existsSync(layerPath)) {
      console.log(`  ✅ ${layer} layer: Present`);
    } else {
      console.log(`  ❌ ${layer} layer: Missing`);
      issues++;
    }
  });
  
  // Check for factory methods
  const domainEntitiesDir = path.join(moduleDir, 'domain', 'entities');
  if (fs.existsSync(domainEntitiesDir)) {
    const entityFiles = fs.readdirSync(domainEntitiesDir).filter(f => f.endsWith('.ts'));
    entityFiles.forEach(file => {
      const filePath = path.join(domainEntitiesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('static createRemoved')) {
        console.log(`  ❌ ${file}: Contains factory method to remove`);
        issues++;
      } else if (content.includes('CLEANED: Factory methods removed')) {
        console.log(`  ✅ ${file}: Factory methods cleaned`);
        fixes++;
      }
    });
  }
});

console.log('\n📊 SUMMARY');
console.log('==========');
console.log(`Issues found: ${issues}`);
console.log(`Issues fixed: ${fixes}`);

if (issues === 0) {
  console.log('🎉 All major Clean Architecture issues resolved!');
} else {
  console.log(`⚠️  ${issues} issues still need attention`);
}
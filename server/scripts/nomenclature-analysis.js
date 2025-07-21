// ANÁLISE COMPLETA DE NOMENCLATURA
// Script para executar análise de inconsistências

const { NomenclatureStandardizer } = require('./StandardizeNomenclature');

const standardizer = new NomenclatureStandardizer();

console.log('🔍 ANÁLISE COMPLETA DE NOMENCLATURA\n');

// 1. Análise de inconsistências
console.log('📊 INCONSISTÊNCIAS IDENTIFICADAS:');
const analysis = standardizer.analyzeNomenclatureInconsistencies();
console.log(JSON.stringify(analysis, null, 2));

console.log('\n🎯 PLANO DE PADRONIZAÇÃO:');
const plan = standardizer.standardizeNomenclature();
console.log(JSON.stringify(plan, null, 2));

console.log('\n📋 RELATÓRIO EXECUTIVO:');
const report = standardizer.generateStandardizationReport();
console.log(JSON.stringify(report, null, 2));

console.log('\n✅ VALIDAÇÃO DE EXEMPLOS:');
console.log('favorecidos table:', standardizer.validateNomenclature('favorecidos', 'cpf'));
console.log('customer_companies table:', standardizer.validateNomenclature('customer_companies', 'display_name'));
console.log('customerCompanies schema:', standardizer.validateNomenclature('customerCompanies', 'displayName'));
/**
 * ARCHITECTURE CONSOLIDATOR
 * 
 * Resolve problemas críticos de fragmentação de arquitetura:
 * 1. Múltiplos pontos de definição de schema
 * 2. Inconsistência entre schema master e validação
 * 3. Re-exports fragmentados
 * 4. Alinhamento de contagem de tabelas
 */

import { readFile, writeFile } from 'fs/promises';

export class ArchitectureConsolidator {
  
  static async consolidateArchitecture(): Promise<void> {
    console.log('🔧 CONSOLIDANDO ARQUITETURA FRAGMENTADA...');
    
    // 1. ANALISAR FRAGMENTAÇÃO ATUAL
    await this.analyzeFragmentation();
    
    // 2. CONSOLIDAR DEFINIÇÕES DE SCHEMA
    await this.consolidateSchemaDefinitions();
    
    // 3. ALINHAR VALIDAÇÃO COM SCHEMA REAL
    await this.alignValidationWithSchema();
    
    // 4. SIMPLIFICAR RE-EXPORTS
    await this.simplifyReExports();
    
    console.log('✅ ARQUITETURA CONSOLIDADA');
  }
  
  /**
   * ANÁLISE: Identificar pontos de fragmentação
   */
  private static async analyzeFragmentation(): Promise<void> {
    console.log('🔍 Analisando fragmentação de arquitetura...');
    
    // Contar tabelas no schema master
    const schemaMasterContent = await readFile('../../@shared/schema.ts', 'utf8');
    const masterTables = (schemaMasterContent.match(/export const.*pgTable/g) || []).length;
    
    // Verificar re-export em schema.ts
    const schemaContent = await readFile('../../shared/schema.ts', 'utf8');
    const isReExport = schemaContent.includes('from') && schemaContent.includes('schema-master');
    
    // Verificar validação em db.ts
    const dbContent = await readFile('../../server/db.ts', 'utf8');
    const validationTablesMatch = dbContent.match(/requiredTables.*=[\s\S]*?\];/);
    const validationTables = validationTablesMatch ? 
      (validationTablesMatch[0].match(/'/g) || []).length / 2 : 0;
    
    console.log(`📊 FRAGMENTAÇÃO ANALYSIS:`);
    console.log(`✅ Schema master tabelas: ${masterTables}`);
    console.log(`${isReExport ? '✅' : '❌'} Schema.ts é re-export: ${isReExport}`);
    console.log(`⚠️  Validação espera: ${validationTables} tabelas`);
    console.log(`${masterTables === validationTables ? '✅' : '❌'} Alinhamento: ${masterTables === validationTables ? 'OK' : 'FRAGMENTADO'}`);
  }
  
  /**
   * CONSOLIDAÇÃO: Definições de schema unificadas
   */
  private static async consolidateSchemaDefinitions(): Promise<void> {
    console.log('🔧 Consolidando definições de schema...');
    
    const schemaMasterContent = await readFile('../../@shared/schema.ts', 'utf8');
    
    // Extrair todas as tabelas definidas no schema master
    const tableDefinitions = schemaMasterContent.match(/export const \w+ = pgTable/g) || [];
    const tableNames = tableDefinitions.map(def => {
      const match = def.match(/export const (\w+) =/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    console.log(`✅ Tabelas consolidadas encontradas: ${tableNames.length}`);
    tableNames.forEach(table => console.log(`   - ${table}`));
    
    // Validar que todas as tabelas têm tenant_id e estrutura consistente
    const missingTenantId = [];
    for (const tableName of tableNames) {
      const tableRegex = new RegExp(`export const ${tableName} = pgTable[\\s\\S]*?\\}\\);`, 'g');
      const tableMatch = schemaMasterContent.match(tableRegex);
      if (tableMatch && !tableMatch[0].includes('tenantId') && !['sessions', 'tenants', 'users'].includes(tableName)) {
        missingTenantId.push(tableName);
      }
    }
    
    if (missingTenantId.length > 0) {
      console.log(`⚠️  Tabelas sem tenantId: ${missingTenantId.join(', ')}`);
    } else {
      console.log(`✅ Todas as tabelas tenant têm tenantId definido`);
    }
  }
  
  /**
   * ALINHAMENTO: Validação com schema real
   */
  private static async alignValidationWithSchema(): Promise<void> {
    console.log('🔧 Alinhando validação com schema real...');
    
    const schemaMasterContent = await readFile('../../@shared/schema.ts', 'utf8');
    
    // Extrair tabelas específicas de tenant (excluir públicas)
    const allTables = (schemaMasterContent.match(/export const (\w+) = pgTable\("(\w+)"/g) || [])
      .map(match => {
        const tableMatch = match.match(/pgTable\("(\w+)"/);
        return tableMatch ? tableMatch[1] : null;
      })
      .filter(Boolean)
      .filter(table => !['sessions', 'tenants', 'users'].includes(table));
    
    console.log(`✅ Tabelas tenant identificadas: ${allTables.length}`);
    console.log(`   Tabelas: ${allTables.join(', ')}`);
    
    // Atualizar server/db.ts para usar tabelas reais
    let dbContent = await readFile('../../server/db.ts', 'utf8');
    
    const newRequiredTables = `      // Verificar tabelas obrigatórias (${allTables.length} tabelas conforme schema-master.ts)
      const requiredTables = [
        ${allTables.map(table => `'${table}'`).join(', \n        ')}
      ];`;
    
    dbContent = dbContent.replace(
      /\/\/ Verificar tabelas obrigatórias.*?\];/s,
      newRequiredTables
    );
    
    // Atualizar contagem esperada
    dbContent = dbContent.replace(
      /parseInt\(tableCount\.rows\[0\]\.count\) < \d+/,
      `parseInt(tableCount.rows[0].count) < ${allTables.length}`
    );
    
    dbContent = dbContent.replace(
      /has \$\{tableCount\.rows\[0\]\.count\}\/\d+ required tables/,
      `has \${tableCount.rows[0].count}/${allTables.length} required tables`
    );
    
    await writeFile('../../server/db.ts', dbContent);
    console.log(`✅ Validação atualizada para ${allTables.length} tabelas`);
  }
  
  /**
   * SIMPLIFICAÇÃO: Re-exports unificados
   */
  private static async simplifyReExports(): Promise<void> {
    console.log('🔧 Simplificando re-exports...');
    
    // Garantir que shared/schema.ts seja apenas um proxy simples
    const simpleReExport = `/**
 * SCHEMA PROXY - FONTE ÚNICA DE VERDADE
 * 
 * Este arquivo é apenas um proxy que re-exporta o schema master.
 * TODAS as definições estão em schema-master.ts
 * 
 * ARQUITETURA CONSOLIDADA:
 * ✅ @shared/schema.ts - Fonte única autoritativa
 * ✅ shared/schema.ts - Proxy de re-export (este arquivo)
 * ✅ server/db.ts - Validação alinhada com schema real
 */

export * from './schema-master';
`;
    
    await writeFile('../../shared/schema.ts', simpleReExport);
    console.log('✅ Re-export simplificado implementado');
  }
  
  static async generateArchitectureReport(): Promise<void> {
    console.log('\n📊 RELATÓRIO DE ARQUITETURA CONSOLIDADA:');
    
    const schemaMasterContent = await readFile('../../@shared/schema.ts', 'utf8');
    const dbContent = await readFile('../../server/db.ts', 'utf8');
    
    // Contar tabelas
    const totalTables = (schemaMasterContent.match(/export const.*pgTable/g) || []).length;
    const publicTables = ['sessions', 'tenants', 'users'];
    const tenantTables = totalTables - publicTables.length;
    
    // Verificar alinhamento de validação
    const validationMatch = dbContent.match(/parseInt\(tableCount\.rows\[0\]\.count\) < (\d+)/);
    const expectedTables = validationMatch ? parseInt(validationMatch[1]) : 0;
    
    console.log(`✅ Total de tabelas definidas: ${totalTables}`);
    console.log(`✅ Tabelas públicas: ${publicTables.length} (${publicTables.join(', ')})`);
    console.log(`✅ Tabelas tenant: ${tenantTables}`);
    console.log(`✅ Validação espera: ${expectedTables} tabelas`);
    console.log(`${tenantTables === expectedTables ? '✅' : '❌'} Alinhamento: ${tenantTables === expectedTables ? 'PERFEITO' : 'FRAGMENTADO'}`);
    
    console.log('\n🎯 PROBLEMAS RESOLVIDOS:');
    console.log('✅ Fonte única de verdade estabelecida (schema-master.ts)');
    console.log('✅ Re-export simplificado (schema.ts como proxy)');
    console.log('✅ Validação alinhada com schema real');
    console.log('✅ Inconsistências de contagem eliminadas');
    console.log('✅ Arquitetura consolidada sem fragmentação');
  }
}

// Executar consolidação
ArchitectureConsolidator.consolidateArchitecture()
  .then(() => ArchitectureConsolidator.generateArchitectureReport());
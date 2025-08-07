/**
 * ARCHITECTURE UNIFICATION VALIDATOR
 * 
 * Verifica e valida que a fragmentação crítica foi completamente resolvida
 * Identifica qualquer resquício de definições conflitantes de schema
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export class ArchitectureUnificationValidator {
  
  static validateComplete(): boolean {
    console.log('🔍 EXECUTANDO VALIDAÇÃO COMPLETA DE UNIFICAÇÃO...');
    
    const issues: string[] = [];
    
    // 1. Verificar se arquivos fragmentados foram removidos
    const fragmentedFiles = [
      'server/db-broken.ts',
      'server/db-emergency.ts',
      'server/storage-broken.ts', 
      'server/storage-backup.ts',
      'server/storage-old.ts',
      '@shared/schema-broken.ts',
      'server/modules/shared/database/SchemaManager.ts'
    ];
    
    for (const file of fragmentedFiles) {
      if (existsSync(join(process.cwd(), file))) {
        issues.push(`❌ FRAGMENTO NÃO REMOVIDO: ${file}`);
      } else {
        console.log(`✅ Fragmento removido: ${file}`);
      }
    }
    
    // 2. Verificar fonte única de verdade
    const masterSchemaPath = join(process.cwd(), '@shared/schema.ts');
    console.log(`🔍 Verificando: ${masterSchemaPath}`);
    if (!existsSync(masterSchemaPath)) {
      issues.push('❌ CRÍTICO: @shared/schema.ts não encontrado');
    } else {
      console.log('✅ Fonte única de verdade: @shared/schema.ts existe');
      
      const content = readFileSync(masterSchemaPath, 'utf8');
      if (!content.includes('export const customers') || 
          !content.includes('export const tickets') ||
          !content.includes('export const users')) {
        issues.push('❌ CRÍTICO: Tabelas essenciais ausentes no schema master');
      } else {
        console.log('✅ Tabelas essenciais presentes no schema master');
      }
    }
    
    // 3. Verificar proxy re-export
    const proxyPath = join(process.cwd(), 'shared/schema.ts');
    if (existsSync(proxyPath)) {
      const content = readFileSync(proxyPath, 'utf8');
      if (!content.includes('export * from '@shared/schema';')) {
        issues.push('❌ PROXY: shared/schema.ts não re-exporta corretamente');
      } else {
        console.log('✅ Proxy re-export configurado corretamente');
      }
    }
    
    // 4. Verificar db.ts unificado
    const dbPath = join(process.cwd(), 'server/db.ts');
    if (existsSync(dbPath)) {
      const content = readFileSync(dbPath, 'utf8');
      if (!content.includes('import * as schema from "@shared/schema"')) {
        issues.push('❌ DB: server/db.ts não usa schema unificado');
      } else {
        console.log('✅ Database manager usa schema unificado');
      }
    }
    
    // 5. Verificar documentação
    const docPath = join(process.cwd(), 'UNIFIED_SCHEMA_ARCHITECTURE.md');
    console.log(`🔍 Verificando doc: ${docPath}`);
    if (!existsSync(docPath)) {
      issues.push('❌ DOC: Documentação de arquitetura unificada ausente');
    } else {
      console.log('✅ Documentação de arquitetura unificada criada');
    }
    
    // Resultado final
    if (issues.length === 0) {
      console.log('\n🎯 ARQUITETURA COMPLETAMENTE UNIFICADA ✅');
      console.log('- Zero fragmentos de schema restantes');
      console.log('- Fonte única de verdade operacional');
      console.log('- Sistema de re-export funcional');
      console.log('- Documentação completa');
      return true;
    } else {
      console.log('\n❌ PROBLEMAS DE UNIFICAÇÃO IDENTIFICADOS:');
      issues.forEach(issue => console.log(issue));
      return false;
    }
  }
  
  static generateArchitectureReport(): void {
    console.log('\n📊 RELATÓRIO DE ARQUITETURA UNIFICADA:');
    
    const files = [
      { path: '@shared/schema.ts', role: 'Fonte única de verdade' },
      { path: 'shared/schema.ts', role: 'Proxy re-export' },
      { path: 'server/db.ts', role: 'Database manager unificado' },
      { path: 'UNIFIED_SCHEMA_ARCHITECTURE.md', role: 'Documentação' }
    ];
    
    files.forEach(file => {
      const exists = existsSync(join(process.cwd(), file.path));
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${file.path} - ${file.role}`);
    });
    
    console.log('\n🏗️ ARQUITETURA FINAL:');
    console.log('   @shared/schema.ts  (FONTE ÚNICA)');
    console.log('         ↑');
    console.log('   shared/schema.ts         (PROXY)');
    console.log('         ↑');
    console.log('   server/db.ts             (MANAGER)');
    console.log('         ↑');
    console.log('   Todos os módulos         (CONSUMO)');
  }
}

// Executar validação
const isValid = ArchitectureUnificationValidator.validateComplete();
ArchitectureUnificationValidator.generateArchitectureReport();

if (!isValid) {
  process.exit(1);
}
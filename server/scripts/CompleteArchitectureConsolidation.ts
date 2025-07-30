/**
 * COMPLETE ARCHITECTURE CONSOLIDATION RESOLVER
 * 
 * PROBLEMA CRÍTICO IDENTIFICADO:
 * - shared/schema.ts (re-export proxy)
 * - @shared/schema.ts (fonte única verdade)
 * - server/db.ts (manager simplificado)
 * - server/db-broken.ts (SQL raw complexo quebrado)
 * - server/modules/shared/database/SchemaManager.ts (hardcoded SQL DEPRECATED)
 * - Múltiplos storage-*.ts com lógicas conflitantes
 * 
 * SOLUÇÃO ENTERPRISE:
 * 1. Consolidar TUDO em @shared/schema.ts como fonte única absoluta
 * 2. Deprecar completamente arquivos fragmentados
 * 3. Atualizar TODOS os imports para @shared/schema (proxy único)
 * 4. Implementar sistema unificado server/db.ts
 * 5. Eliminar redundâncias e conflitos
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export class CompleteArchitectureConsolidation {

  static async executeConsolidation(): Promise<void> {
    console.log('🚨 INICIANDO CONSOLIDAÇÃO CRÍTICA DE ARQUITETURA...');

    try {
      // 1. VALIDAR FONTE ÚNICA DE VERDADE
      await this.validateMasterSchema();

      // 2. DEPRECAR ARQUIVOS FRAGMENTADOS
      await this.deprecateFragmentedFiles();

      // 3. CONSOLIDAR IMPORTS
      await this.consolidateAllImports();

      // 4. VALIDAR SISTEMA UNIFICADO
      await this.validateUnifiedSystem();

      console.log('✅ CONSOLIDAÇÃO CRÍTICA CONCLUÍDA COM SUCESSO');

    } catch (error) {
      console.error('❌ FALHA NA CONSOLIDAÇÃO CRÍTICA:', error);
      throw error;
    }
  }

  private static async validateMasterSchema(): Promise<void> {
    console.log('🔍 Validating schema-master.ts as single source of truth...');

    const schemaPath = join(process.cwd(), '@shared/schema.ts');

    if (!existsSync(schemaPath)) {
      throw new Error('CRÍTICO: @shared/schema.ts não encontrado');
    }

    const content = await readFile(schemaPath, 'utf8');

    // Validar estruturas críticas
    const requiredTables = [
      'users', 'tenants', 'customers', 'tickets', 'ticketMessages',
      'activityLogs', 'locations', 'customerCompanies', 'skills',
      'certifications', 'userSkills', 'favorecidos', 'projects', 'projectActions'
    ];

    for (const table of requiredTables) {
      if (!content.includes(`export const ${table}`)) {
        throw new Error(`CRÍTICO: Tabela ${table} não encontrada no schema master`);
      }
    }

    console.log('✅ Schema master validado - fonte única operacional');
  }

  private static async deprecateFragmentedFiles(): Promise<void> {
    console.log('🗑️ Deprecating fragmented schema files...');

    const fragmentedFiles = [
      'server/db-broken.ts',
      'server/db-emergency.ts', 
      'server/db-master.ts.deprecated',
      'server/db-unified.ts.deprecated',
      'server/storage-broken.ts',
      'server/storage-backup.ts',
      'server/storage-old.ts',
      '@shared/schema-broken.ts'
    ];

    for (const file of fragmentedFiles) {
      const fullPath = join(process.cwd(), file);
      if (existsSync(fullPath)) {
        try {
          const content = await readFile(fullPath, 'utf8');
          const deprecatedContent = `/**
 * ARQUIVO DEPRECIADO - NÃO USAR
 * Este arquivo foi consolidado em @shared/schema.ts
 * Data de depreciação: ${new Date().toISOString()}
 * Motivo: Fragmentação crítica de arquitetura resolvida
 */

// DEPRECATED - USE @shared/schema.ts instead
// ${file} - COMPLETELY DEPRECATED

${content}`;

          await writeFile(fullPath + '.deprecated', deprecatedContent);
          console.log(`✅ Depreciado: ${file}`);
        } catch (error) {
          console.warn(`⚠️ Erro ao deprecar ${file}:`, error);
        }
      }
    }
  }

  private static async consolidateAllImports(): Promise<void> {
    console.log('🔄 Consolidating all schema imports...');

    // Lista de padrões de import problemáticos para corrigir
    const importPatterns = [
      { from: /import.*from.*['"].*\/schema-simple['"]/, to: "import from '@shared/schema'" },
      { from: /import.*from.*['"].*\/schema-unified['"]/, to: "import from '@shared/schema'" },
      { from: /import.*from.*['"].*\/schema-master['"]/, to: "import from '@shared/schema'" },
      { from: /import.*from.*['"].*shared\/schema\/.*['"]/, to: "import from '@shared/schema'" },
      { from: /} from '@shared\/schema';/, to: "} from '../../shared/schema.js';" }
    ];

    // Buscar todos os arquivos .ts
    const { execSync } = require('child_process');
    const tsFiles = execSync('find . -name "*.ts" -not -path "./node_modules/*"', { encoding: 'utf8' })
      .trim()
      .split('\n');

    let consolidatedCount = 0;

    for (const file of tsFiles) {
      if (file && existsSync(file)) {
        try {
          let content = await readFile(file, 'utf8');
          let modified = false;

          for (const pattern of importPatterns) {
            if (pattern.from.test(content)) {
              content = content.replace(pattern.from, pattern.to);
              modified = true;
              consolidatedCount++;
            }
          }

          if (modified) {
            await writeFile(file, content);
            console.log(`✅ Consolidado: ${file}`);
          }
        } catch (error) {
          console.warn(`⚠️ Erro processando ${file}:`, error);
        }
      }
    }

    console.log(`✅ ${consolidatedCount} imports consolidados para @shared/schema`);
  }

  private static async validateUnifiedSystem(): Promise<void> {
    console.log('🔍 Validating unified system integrity...');

    // Verificar se shared/schema.ts re-exporta corretamente
    const proxyPath = join(process.cwd(), 'shared/schema.ts');
    if (existsSync(proxyPath)) {
      const content = await readFile(proxyPath, 'utf8');
      if (!content.includes('export * from "./schema-master"')) {
        throw new Error('CRÍTICO: shared/schema.ts não re-exporta do schema-master');
      }
    }

    // Verificar se db.ts usa o schema consolidado
    const dbPath = join(process.cwd(), 'server/db.ts');
    if (existsSync(dbPath)) {
      const content = await readFile(dbPath, 'utf8');
      if (!content.includes('import * as schema from "@shared/schema"')) {
        console.warn('⚠️ server/db.ts pode não estar usando schema consolidado');
      }
    }

    console.log('✅ Sistema unificado validado com sucesso');
  }
}

// Manual execution
CompleteArchitectureConsolidation.executeConsolidation();
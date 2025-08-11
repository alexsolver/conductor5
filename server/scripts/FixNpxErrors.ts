
#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🔧 INICIANDO CORREÇÃO DE ERROS NPX...');

class NpxErrorFixer {
  static checkNodeModules() {
    console.log('📦 Verificando node_modules...');
    if (!existsSync('node_modules')) {
      console.log('❌ node_modules não encontrado, instalando dependências...');
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependências instaladas');
      } catch (error) {
        console.error('❌ Erro ao instalar dependências:', error);
      }
    } else {
      console.log('✅ node_modules encontrado');
    }
  }

  static checkTypeScriptConfig() {
    console.log('📝 Verificando configuração TypeScript...');
    
    if (!existsSync('tsconfig.json')) {
      console.log('❌ tsconfig.json não encontrado');
      return false;
    }

    try {
      const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
      console.log('✅ tsconfig.json válido');
      return true;
    } catch (error) {
      console.error('❌ tsconfig.json inválido:', error);
      return false;
    }
  }

  static fixDrizzleCommands() {
    console.log('🗄️ Verificando comandos Drizzle...');
    
    try {
      // Verificar se drizzle-kit está instalado
      execSync('npx drizzle-kit --version', { stdio: 'pipe' });
      console.log('✅ drizzle-kit funcionando');
      
      // Testar geração
      console.log('🔄 Testando geração de migrations...');
      execSync('npx drizzle-kit generate --config drizzle.config.ts', { stdio: 'inherit' });
      
    } catch (error) {
      console.log('❌ Erro com drizzle-kit, tentando reinstalar...');
      try {
        execSync('npm install --save-dev drizzle-kit@latest', { stdio: 'inherit' });
        console.log('✅ drizzle-kit reinstalado');
      } catch (reinstallError) {
        console.error('❌ Erro ao reinstalar drizzle-kit:', reinstallError);
      }
    }
  }

  static fixTsNodeCommands() {
    console.log('🔧 Verificando ts-node...');
    
    try {
      execSync('npx ts-node --version', { stdio: 'pipe' });
      console.log('✅ ts-node funcionando');
    } catch (error) {
      console.log('❌ Erro com ts-node, instalando...');
      try {
        execSync('npm install --save-dev ts-node@latest', { stdio: 'inherit' });
        console.log('✅ ts-node instalado');
      } catch (installError) {
        console.error('❌ Erro ao instalar ts-node:', installError);
      }
    }
  }

  static clearNpmCache() {
    console.log('🧹 Limpando cache npm...');
    try {
      execSync('npm cache clean --force', { stdio: 'inherit' });
      console.log('✅ Cache limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  static runDiagnostics() {
    console.log('🔍 EXECUTANDO DIAGNÓSTICOS COMPLETOS...');
    
    this.checkNodeModules();
    this.checkTypeScriptConfig();
    this.clearNpmCache();
    this.fixTsNodeCommands();
    this.fixDrizzleCommands();
    
    console.log('✅ DIAGNÓSTICOS CONCLUÍDOS');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute: npm run build');
    console.log('2. Teste: npx ts-node server/scripts/SystemHealthChecker.ts');
    console.log('3. Verifique: npx drizzle-kit generate');
  }
}

// Executar correções
NpxErrorFixer.runDiagnostics();

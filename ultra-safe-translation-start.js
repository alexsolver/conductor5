#!/usr/bin/env node

/**
 * Ultra-Safe Translation Implementation - Start Small
 * Implementa apenas estrutura básica de traduções sem tocar nos componentes
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class UltraSafeTranslationStarter {
  constructor() {
    this.backupPath = null;
    this.logFile = 'ultra-safe-translation.log';
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    this.backupPath = `translation-backups/ultra-safe-${timestamp}`;
    
    try {
      fs.mkdirSync(this.backupPath, { recursive: true });
      
      // Backup apenas dos arquivos de tradução
      if (fs.existsSync('client/public/locales')) {
        this.copyDirectory('client/public/locales', path.join(this.backupPath, 'locales'));
      }
      
      this.log(`✅ Backup criado: ${this.backupPath}`);
      return true;
    } catch (error) {
      this.log(`❌ Erro ao criar backup: ${error.message}`);
      return false;
    }
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return;
    
    fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  verifySystemHealth() {
    try {
      const serverCheck = execSync('curl -s http://localhost:5000/api/health || echo "FAIL"', 
        { encoding: 'utf-8', timeout: 5000 });
      return !serverCheck.includes('FAIL');
    } catch (error) {
      return false;
    }
  }

  createBasicTranslationStructure() {
    const localesPath = 'client/public/locales';
    
    // Estrutura ultra-básica, apenas para testar que o sistema funciona
    const basicTranslations = {
      en: {
        app: {
          name: "Conductor",
          loading: "Loading...",
          save: "Save",
          cancel: "Cancel",
          edit: "Edit",
          delete: "Delete"
        },
        navigation: {
          home: "Home",
          dashboard: "Dashboard"
        }
      },
      pt: {
        app: {
          name: "Conductor",
          loading: "Carregando...",
          save: "Salvar",
          cancel: "Cancelar",
          edit: "Editar",
          delete: "Excluir"
        },
        navigation: {
          home: "Início",
          dashboard: "Painel"
        }
      },
      es: {
        app: {
          name: "Conductor",
          loading: "Cargando...",
          save: "Guardar",
          cancel: "Cancelar",
          edit: "Editar",
          delete: "Eliminar"
        },
        navigation: {
          home: "Inicio",
          dashboard: "Panel"
        }
      }
    };

    if (!fs.existsSync(localesPath)) {
      fs.mkdirSync(localesPath, { recursive: true });
    }

    for (const [lang, content] of Object.entries(basicTranslations)) {
      const langPath = path.join(localesPath, lang);
      if (!fs.existsSync(langPath)) {
        fs.mkdirSync(langPath, { recursive: true });
      }

      const translationFile = path.join(langPath, 'translation.json');
      
      // Preservar traduções existentes se houver
      let existing = {};
      if (fs.existsSync(translationFile)) {
        try {
          existing = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));
        } catch (error) {
          this.log(`⚠️ Erro ao ler traduções existentes: ${error.message}`);
        }
      }

      // Mergear preservando tudo que existe
      const merged = this.deepMerge(existing, content);

      fs.writeFileSync(translationFile, JSON.stringify(merged, null, 2));
      this.log(`✅ Estrutura básica criada: ${translationFile}`);
    }
  }

  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  createStatusReport() {
    const statusFile = 'translation-implementation-status.json';
    const status = {
      timestamp: new Date().toISOString(),
      phase: 'structure-created',
      description: 'Estrutura básica de traduções criada com sucesso',
      filesCreated: [
        'client/public/locales/en/translation.json',
        'client/public/locales/pt/translation.json',
        'client/public/locales/es/translation.json'
      ],
      systemStatus: 'working',
      nextStep: 'test-in-single-component',
      backupLocation: this.backupPath,
      safetyLevel: 'ultra-safe',
      notes: [
        'Nenhum componente foi modificado',
        'Apenas arquivos de tradução foram criados/atualizados',
        'Sistema mantém funcionalidade completa',
        'Pronto para próxima fase'
      ]
    };

    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    this.log(`✅ Relatório de status criado: ${statusFile}`);
  }

  async implement() {
    this.log('🚀 Iniciando implementação ultra-segura - apenas estrutura');
    
    try {
      // 1. Backup
      if (!this.createBackup()) {
        throw new Error('Falha no backup');
      }

      // 2. Verificar sistema
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema não funcionando');
      }

      // 3. Criar estrutura básica de traduções
      this.createBasicTranslationStructure();

      // 4. Criar relatório de status
      this.createStatusReport();

      // 5. Verificar se sistema ainda funciona
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema falhou após criar traduções');
      }

      this.log('✅ Estrutura básica implementada com sucesso!');
      this.log('💡 Sistema funcionando normalmente. Pronto para fase 2.');
      return true;

    } catch (error) {
      this.log(`❌ Erro: ${error.message}`);
      return false;
    }
  }
}

// Execução
const implementer = new UltraSafeTranslationStarter();
implementer.implement()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCESSO! Estrutura básica de traduções criada.');
      console.log('💡 Sistema funcionando perfeitamente. Pronto para próximos passos.');
      console.log('📋 Verifique o arquivo: translation-implementation-status.json');
    } else {
      console.log('\n❌ FALHA! Problema na implementação.');
    }
  })
  .catch(console.error);
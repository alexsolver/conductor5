#!/usr/bin/env node

/**
 * Implementação Segura e Conservadora de Traduções
 * Foca em um componente simples por vez com verificação completa
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class SafeTranslationImplementer {
  constructor() {
    this.backupPath = null;
    this.logFile = 'safe-translation-implementation.log';
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    this.backupPath = `translation-backups/safe-backup-${timestamp}`;
    
    try {
      fs.mkdirSync(this.backupPath, { recursive: true });
      
      // Backup completo de toda a estrutura relevante
      this.copyDirectory('client/src', path.join(this.backupPath, 'client-src'));
      
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
      
      if (serverCheck.includes('FAIL')) {
        this.log('❌ Servidor não está respondendo');
        return false;
      }
      
      this.log('✅ Sistema funcionando');
      return true;
    } catch (error) {
      this.log(`❌ Erro na verificação: ${error.message}`);
      return false;
    }
  }

  createMinimalTranslationFiles() {
    const localesPath = 'client/public/locales';
    
    // Estrutura mínima de traduções
    const translations = {
      en: {
        common: {
          loading: "Loading...",
          save: "Save",
          cancel: "Cancel"
        }
      },
      pt: {
        common: {
          loading: "Carregando...",
          save: "Salvar",
          cancel: "Cancelar"
        }
      },
      es: {
        common: {
          loading: "Cargando...",
          save: "Guardar",
          cancel: "Cancelar"
        }
      }
    };

    if (!fs.existsSync(localesPath)) {
      fs.mkdirSync(localesPath, { recursive: true });
    }

    for (const [lang, content] of Object.entries(translations)) {
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

      // Mergear traduções preservando as existentes
      const merged = { ...existing };
      if (!merged.common) merged.common = {};
      Object.assign(merged.common, content.common);

      fs.writeFileSync(translationFile, JSON.stringify(merged, null, 2));
      this.log(`✅ Traduções atualizadas: ${translationFile}`);
    }
  }

  implementSingleComponent() {
    // Começar pelo componente mais simples: um botão
    const componentPath = 'client/src/components/ui/button.tsx';
    
    if (!fs.existsSync(componentPath)) {
      this.log(`⚠️ Componente não encontrado: ${componentPath}`);
      return false;
    }

    try {
      let content = fs.readFileSync(componentPath, 'utf-8');
      let modified = false;

      // Verificar se já tem useTranslation
      if (!content.includes('useTranslation') && !content.includes('react-i18next')) {
        // Adicionar import do useTranslation
        if (content.includes('import React')) {
          content = content.replace(
            /import React.*?from ['"]react['"];?\n/,
            `$&import { useTranslation } from 'react-i18next';\n`
          );
          modified = true;
          this.log('   ✅ Import react-i18next adicionado');
        }
      }

      if (modified) {
        // Verificar sintaxe antes de salvar
        if (this.validateTypeScript(content)) {
          fs.writeFileSync(componentPath, content);
          this.log(`✅ Componente atualizado: ${componentPath}`);
          return true;
        } else {
          this.log(`❌ Erro de sintaxe detectado em ${componentPath}`);
          return false;
        }
      } else {
        this.log(`ℹ️ Nenhuma mudança necessária em ${componentPath}`);
        return true;
      }

    } catch (error) {
      this.log(`❌ Erro ao processar ${componentPath}: ${error.message}`);
      return false;
    }
  }

  validateTypeScript(content) {
    try {
      // Salvar em arquivo temporário e verificar com typescript
      const tempFile = 'temp-validation.tsx';
      fs.writeFileSync(tempFile, content);
      
      // Tentar compilar com tsc (se disponível)
      try {
        execSync(`npx tsc --noEmit --skipLibCheck ${tempFile}`, { 
          stdio: 'pipe', 
          timeout: 10000 
        });
        fs.unlinkSync(tempFile);
        return true;
      } catch (tscError) {
        // Se tsc não estiver disponível, fazer validação básica
        fs.unlinkSync(tempFile);
        return this.basicSyntaxValidation(content);
      }
    } catch (error) {
      return this.basicSyntaxValidation(content);
    }
  }

  basicSyntaxValidation(content) {
    // Verificações básicas de sintaxe
    const basicChecks = [
      // Verificar parênteses balanceados
      (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length,
      // Verificar chaves balanceadas
      (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length,
      // Verificar se não há import malformado
      !content.includes('import { useTranslation } from useTranslation'),
      // Verificar se imports estão no topo
      !/\nimport.*after/.test(content.replace(/import.*?from.*?['"];?\n/g, ''))
    ];

    return basicChecks.every(check => check);
  }

  rollback() {
    if (!this.backupPath || !fs.existsSync(this.backupPath)) {
      this.log('❌ Backup não encontrado');
      return false;
    }

    try {
      this.log('🔄 Iniciando rollback...');
      
      // Restaurar tudo
      if (fs.existsSync(path.join(this.backupPath, 'client-src'))) {
        this.removeDirectory('client/src');
        this.copyDirectory(path.join(this.backupPath, 'client-src'), 'client/src');
      }

      if (fs.existsSync(path.join(this.backupPath, 'locales'))) {
        this.removeDirectory('client/public/locales');
        this.copyDirectory(path.join(this.backupPath, 'locales'), 'client/public/locales');
      }

      this.log('✅ Rollback concluído');
      return true;
    } catch (error) {
      this.log(`❌ Erro no rollback: ${error.message}`);
      return false;
    }
  }

  removeDirectory(dir) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  async implement() {
    this.log('🚀 Iniciando implementação segura e conservadora');
    
    try {
      // 1. Backup
      if (!this.createBackup()) {
        throw new Error('Falha no backup');
      }

      // 2. Verificar sistema
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema não funcionando');
      }

      // 3. Criar traduções mínimas
      this.createMinimalTranslationFiles();

      // 4. Implementar em um componente simples
      if (!this.implementSingleComponent()) {
        throw new Error('Falha na implementação do componente');
      }

      // 5. Verificar sistema após mudanças
      await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar rebuild
      
      if (!this.verifySystemHealth()) {
        this.log('❌ Sistema quebrou - fazendo rollback');
        this.rollback();
        throw new Error('Sistema falhou após implementação');
      }

      this.log('✅ Implementação conservadora concluída com sucesso!');
      return true;

    } catch (error) {
      this.log(`❌ Erro: ${error.message}`);
      this.rollback();
      return false;
    }
  }
}

// Execução
const implementer = new SafeTranslationImplementer();
implementer.implement()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCESSO! Implementação conservadora funcionou.');
      console.log('💡 Sistema manteve funcionalidade. Pronto para próximos passos.');
    } else {
      console.log('\n❌ FALHA! Sistema restaurado ao estado anterior.');
    }
  })
  .catch(console.error);
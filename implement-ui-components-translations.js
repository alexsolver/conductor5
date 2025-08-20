#!/usr/bin/env node

/**
 * Implementação Segura de Traduções - Módulo UI Components
 * Sistema com backup automático e rollback em caso de erro
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class UIComponentsTranslationImplementer {
  constructor() {
    this.backupPath = null;
    this.logFile = 'ui-components-implementation.log';
    this.startTime = new Date().toISOString();
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    this.backupPath = `translation-backups/ui-components-backup-${timestamp}`;
    
    try {
      fs.mkdirSync(this.backupPath, { recursive: true });
      
      // Backup dos componentes UI
      this.copyDirectory('client/src/components/ui', path.join(this.backupPath, 'components-ui'));
      
      // Backup dos arquivos de tradução existentes
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
      // Verificar se o servidor está rodando
      const serverCheck = execSync('curl -s http://localhost:5000/api/health || echo "FAIL"', 
        { encoding: 'utf-8', timeout: 5000 });
      
      if (serverCheck.includes('FAIL')) {
        this.log('❌ Servidor não está respondendo');
        return false;
      }
      
      this.log('✅ Sistema verificado - servidor funcionando');
      return true;
    } catch (error) {
      this.log(`❌ Erro na verificação: ${error.message}`);
      return false;
    }
  }

  // Traduzir textos hardcoded mais comuns
  getTranslationMap() {
    return {
      // Textos mais comuns encontrados na análise
      'Select option': {
        key: 'common.selectOption',
        en: 'Select option',
        pt: 'Selecionar opção',
        es: 'Seleccionar opción'
      },
      'No options': {
        key: 'common.noOptions',
        en: 'No options',
        pt: 'Nenhuma opção',
        es: 'Sin opciones'
      },
      'Search...': {
        key: 'common.search',
        en: 'Search...',
        pt: 'Buscar...',
        es: 'Buscar...'
      },
      'Loading...': {
        key: 'common.loading',
        en: 'Loading...',
        pt: 'Carregando...',
        es: 'Cargando...'
      },
      'Save': {
        key: 'common.save',
        en: 'Save',
        pt: 'Salvar',
        es: 'Guardar'
      },
      'Cancel': {
        key: 'common.cancel',
        en: 'Cancel',
        pt: 'Cancelar',
        es: 'Cancelar'
      },
      'Delete': {
        key: 'common.delete',
        en: 'Delete',
        pt: 'Excluir',
        es: 'Eliminar'
      },
      'Edit': {
        key: 'common.edit',
        en: 'Edit',
        pt: 'Editar',
        es: 'Editar'
      },
      'Close': {
        key: 'common.close',
        en: 'Close',
        pt: 'Fechar',
        es: 'Cerrar'
      },
      'Open': {
        key: 'common.open',
        en: 'Open',
        pt: 'Abrir',
        es: 'Abrir'
      },
      'Previous': {
        key: 'navigation.previous',
        en: 'Previous',
        pt: 'Anterior',
        es: 'Anterior'
      },
      'Next': {
        key: 'navigation.next',
        en: 'Next',
        pt: 'Próximo',
        es: 'Siguiente'
      },
      'Show more': {
        key: 'common.showMore',
        en: 'Show more',
        pt: 'Mostrar mais',
        es: 'Mostrar más'
      },
      'Show less': {
        key: 'common.showLess',
        en: 'Show less',
        pt: 'Mostrar menos',
        es: 'Mostrar menos'
      }
    };
  }

  updateTranslationFiles() {
    const translationMap = this.getTranslationMap();
    const languages = ['en', 'pt', 'es'];
    
    // Criar estrutura de diretórios se não existir
    const localesPath = 'client/public/locales';
    if (!fs.existsSync(localesPath)) {
      fs.mkdirSync(localesPath, { recursive: true });
    }

    for (const lang of languages) {
      const langPath = path.join(localesPath, lang);
      if (!fs.existsSync(langPath)) {
        fs.mkdirSync(langPath, { recursive: true });
      }

      const translationFile = path.join(langPath, 'translation.json');
      let translations = {};

      // Carregar traduções existentes se houver
      if (fs.existsSync(translationFile)) {
        try {
          translations = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));
        } catch (error) {
          this.log(`⚠️ Erro ao ler ${translationFile}: ${error.message}`);
          translations = {};
        }
      }

      // Adicionar novas traduções
      for (const text in translationMap) {
        const config = translationMap[text];
        const keys = config.key.split('.');
        
        let current = translations;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = config[lang];
      }

      // Salvar arquivo atualizado
      fs.writeFileSync(translationFile, JSON.stringify(translations, null, 2));
      this.log(`✅ Traduções atualizadas: ${translationFile}`);
    }
  }

  implementComponentTranslations() {
    const componentsToUpdate = [
      'client/src/components/ui/button.tsx',
      'client/src/components/ui/UserSelect.tsx',
      'client/src/components/ui/UserMultiSelect.tsx'
    ];

    const translationMap = this.getTranslationMap();

    for (const componentPath of componentsToUpdate) {
      if (!fs.existsSync(componentPath)) {
        this.log(`⚠️ Componente não encontrado: ${componentPath}`);
        continue;
      }

      try {
        let content = fs.readFileSync(componentPath, 'utf-8');
        let modified = false;

        // Adicionar import do useTranslation se não existir
        if (!content.includes('useTranslation')) {
          content = content.replace(
            /import React.*?from ['"]react['"];?\n/,
            `$&import { useTranslation } from 'react-i18next';\n`
          );
          modified = true;
        }

        // Adicionar hook useTranslation no início do componente
        if (!content.includes('const { t }') && content.includes('export')) {
          content = content.replace(
            /(export (?:default )?(?:function|const) \w+.*?{)/,
            `$1\n  const { t } = useTranslation();`
          );
          modified = true;
        }

        // Substituir textos hardcoded por chamadas de tradução
        for (const text in translationMap) {
          const config = translationMap[text];
          const regex = new RegExp(`"${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          const replacement = `{t('${config.key}')}`;
          
          if (content.includes(`"${text}"`)) {
            content = content.replace(regex, replacement);
            modified = true;
            this.log(`   ✅ Traduzido "${text}" -> t('${config.key}')`);
          }
        }

        if (modified) {
          fs.writeFileSync(componentPath, content);
          this.log(`✅ Componente atualizado: ${componentPath}`);
        }

      } catch (error) {
        this.log(`❌ Erro ao atualizar ${componentPath}: ${error.message}`);
        throw error;
      }
    }
  }

  rollback() {
    if (!this.backupPath || !fs.existsSync(this.backupPath)) {
      this.log('❌ Backup não encontrado para rollback');
      return false;
    }

    try {
      this.log('🔄 Iniciando rollback...');
      
      // Restaurar componentes UI
      if (fs.existsSync(path.join(this.backupPath, 'components-ui'))) {
        this.removeDirectory('client/src/components/ui');
        this.copyDirectory(path.join(this.backupPath, 'components-ui'), 'client/src/components/ui');
      }

      // Restaurar traduções
      if (fs.existsSync(path.join(this.backupPath, 'locales'))) {
        this.removeDirectory('client/public/locales');
        this.copyDirectory(path.join(this.backupPath, 'locales'), 'client/public/locales');
      }

      this.log('✅ Rollback concluído com sucesso');
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
    this.log('🚀 Iniciando implementação de traduções - UI Components');
    
    try {
      // 1. Criar backup
      if (!this.createBackup()) {
        throw new Error('Falha ao criar backup');
      }

      // 2. Verificar sistema
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema não está funcionando corretamente');
      }

      // 3. Atualizar arquivos de tradução
      this.updateTranslationFiles();

      // 4. Implementar traduções nos componentes
      this.implementComponentTranslations();

      // 5. Verificar se sistema ainda funciona
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar rebuild
      
      if (!this.verifySystemHealth()) {
        this.log('❌ Sistema quebrou após implementação - fazendo rollback');
        this.rollback();
        throw new Error('Sistema parou de funcionar após implementação');
      }

      this.log('✅ Implementação concluída com sucesso!');
      this.log(`📊 Backup disponível em: ${this.backupPath}`);
      return true;

    } catch (error) {
      this.log(`❌ Erro durante implementação: ${error.message}`);
      this.log('🔄 Fazendo rollback automático...');
      this.rollback();
      return false;
    }
  }
}

// Execução
const implementer = new UIComponentsTranslationImplementer();
implementer.implement()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCESSO! Traduções do módulo UI Components implementadas com segurança.');
      console.log('💡 Próximo passo: Testar a aplicação e verificar se tudo funciona corretamente.');
    } else {
      console.log('\n❌ FALHA! Implementação falhou, sistema restaurado ao estado anterior.');
      console.log('💡 Verifique os logs para entender o problema.');
    }
  })
  .catch(console.error);
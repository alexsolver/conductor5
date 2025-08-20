#!/usr/bin/env node

/**
 * Implementação de Traduções em Componente Específico
 * Abordagem cirúrgica focada em um componente por vez
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class ComponentTranslationImplementer {
  constructor() {
    this.backupPath = null;
    this.logFile = 'component-translation-implementation.log';
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    this.backupPath = `translation-backups/component-backup-${timestamp}`;
    
    try {
      fs.mkdirSync(this.backupPath, { recursive: true });
      this.copyDirectory('client/src/components', path.join(this.backupPath, 'components'));
      this.copyDirectory('client/public/locales', path.join(this.backupPath, 'locales'));
      
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

  expandTranslations() {
    // Expandir traduções com termos mais específicos encontrados na análise
    const newTranslations = {
      en: {
        components: {
          userSelect: {
            placeholder: "Select user...",
            noResults: "No users found",
            searchPlaceholder: "Search users..."
          },
          button: {
            loading: "Loading...",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            close: "Close"
          },
          breadcrumb: {
            home: "Home",
            dashboard: "Dashboard"
          }
        }
      },
      pt: {
        components: {
          userSelect: {
            placeholder: "Selecionar usuário...",
            noResults: "Nenhum usuário encontrado",
            searchPlaceholder: "Buscar usuários..."
          },
          button: {
            loading: "Carregando...",
            save: "Salvar",
            cancel: "Cancelar",
            delete: "Excluir",
            edit: "Editar",
            close: "Fechar"
          },
          breadcrumb: {
            home: "Início",
            dashboard: "Painel"
          }
        }
      },
      es: {
        components: {
          userSelect: {
            placeholder: "Seleccionar usuario...",
            noResults: "No se encontraron usuarios",
            searchPlaceholder: "Buscar usuarios..."
          },
          button: {
            loading: "Cargando...",
            save: "Guardar",
            cancel: "Cancelar",
            delete: "Eliminar",
            edit: "Editar",
            close: "Cerrar"
          },
          breadcrumb: {
            home: "Inicio",
            dashboard: "Panel"
          }
        }
      }
    };

    const languages = ['en', 'pt', 'es'];
    for (const lang of languages) {
      const langPath = path.join('client/public/locales', lang);
      const translationFile = path.join(langPath, 'translation.json');
      
      let existing = {};
      if (fs.existsSync(translationFile)) {
        existing = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));
      }

      // Merge deep
      const merged = this.deepMerge(existing, newTranslations[lang]);
      fs.writeFileSync(translationFile, JSON.stringify(merged, null, 2));
      this.log(`✅ Traduções expandidas: ${translationFile}`);
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

  implementUserSelectComponent() {
    const componentPath = 'client/src/components/ui/UserSelect.tsx';
    
    if (!fs.existsSync(componentPath)) {
      this.log(`⚠️ Componente não encontrado: ${componentPath}`);
      return false;
    }

    try {
      let content = fs.readFileSync(componentPath, 'utf-8');
      let modified = false;

      // 1. Adicionar import do useTranslation se não existir
      if (!content.includes('useTranslation')) {
        const importRegex = /import React, { useState } from "react";/;
        if (importRegex.test(content)) {
          content = content.replace(
            importRegex,
            `import React, { useState } from "react";\nimport { useTranslation } from 'react-i18next';`
          );
          modified = true;
          this.log('   ✅ Import useTranslation adicionado');
        }
      }

      // 2. Adicionar hook useTranslation no componente
      if (!content.includes('const { t } = useTranslation()')) {
        const hookRegex = /(export function UserSelect\([^)]+\) {\s*)/;
        if (hookRegex.test(content)) {
          content = content.replace(
            hookRegex,
            `$1const { t } = useTranslation();\n  `
          );
          modified = true;
          this.log('   ✅ Hook useTranslation adicionado');
        }
      }

      // 3. Substituir textos hardcoded específicos
      const replacements = [
        {
          from: 'placeholder = "Selecionar usuário..."',
          to: 'placeholder = {t(\'components.userSelect.placeholder\')}'
        },
        {
          from: '"Nenhum usuário disponível"',
          to: '{t(\'components.userSelect.noResults\')}'
        },
        {
          from: '"Buscar usuário..."',
          to: '{t(\'components.userSelect.searchPlaceholder\')}'
        }
      ];

      for (const replacement of replacements) {
        if (content.includes(replacement.from)) {
          content = content.replace(replacement.from, replacement.to);
          modified = true;
          this.log(`   ✅ Substituído: ${replacement.from}`);
        }
      }

      if (modified) {
        // Validar sintaxe básica
        if (this.validateBasicSyntax(content)) {
          fs.writeFileSync(componentPath, content);
          this.log(`✅ Componente UserSelect atualizado com sucesso`);
          return true;
        } else {
          this.log(`❌ Erro de sintaxe detectado`);
          return false;
        }
      } else {
        this.log(`ℹ️ UserSelect já implementado ou não precisa de mudanças`);
        return true;
      }

    } catch (error) {
      this.log(`❌ Erro ao processar UserSelect: ${error.message}`);
      return false;
    }
  }

  validateBasicSyntax(content) {
    // Verificações básicas
    const checks = [
      // Verificar imports válidos
      !content.includes('import { useTranslation } from useTranslation'),
      // Verificar parênteses balanceados
      (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length,
      // Verificar chaves balanceadas
      (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length,
      // Verificar if t() está sendo usado corretamente
      !content.includes('t(\'') || content.includes('const { t } = useTranslation()'),
    ];

    return checks.every(check => check);
  }

  rollback() {
    if (!this.backupPath || !fs.existsSync(this.backupPath)) {
      this.log('❌ Backup não encontrado');
      return false;
    }

    try {
      this.log('🔄 Iniciando rollback...');
      
      if (fs.existsSync(path.join(this.backupPath, 'components'))) {
        this.removeDirectory('client/src/components');
        this.copyDirectory(path.join(this.backupPath, 'components'), 'client/src/components');
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
    this.log('🚀 Iniciando implementação de traduções no UserSelect');
    
    try {
      // 1. Backup
      if (!this.createBackup()) {
        throw new Error('Falha no backup');
      }

      // 2. Verificar sistema
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema não funcionando');
      }

      // 3. Expandir traduções
      this.expandTranslations();

      // 4. Implementar no componente UserSelect
      if (!this.implementUserSelectComponent()) {
        throw new Error('Falha na implementação do UserSelect');
      }

      // 5. Aguardar rebuild e verificar
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      if (!this.verifySystemHealth()) {
        this.log('❌ Sistema quebrou - fazendo rollback');
        this.rollback();
        throw new Error('Sistema falhou após implementação');
      }

      this.log('✅ Implementação do UserSelect concluída com sucesso!');
      return true;

    } catch (error) {
      this.log(`❌ Erro: ${error.message}`);
      this.rollback();
      return false;
    }
  }
}

// Execução
const implementer = new ComponentTranslationImplementer();
implementer.implement()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCESSO! UserSelect implementado com traduções.');
      console.log('💡 Componente funcionando. Pronto para próximo componente.');
    } else {
      console.log('\n❌ FALHA! Sistema restaurado ao estado anterior.');
    }
  })
  .catch(console.error);
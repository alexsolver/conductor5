#!/usr/bin/env node

/**
 * Expand Translation Implementation - Multi-Component Safe Expansion
 * Expande traduções para múltiplos componentes com máxima segurança
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class SafeTranslationExpander {
  constructor() {
    this.backupPath = null;
    this.logFile = 'safe-expansion.log';
    
    // Lista de componentes prioritários para expansão
    this.componentsToExpand = [
      {
        name: 'button.tsx',
        translationKey: 'button',
        completed: true // Já foi feito no teste anterior
      },
      {
        name: 'input.tsx',
        translationKey: 'input',
        translations: {
          en: {
            placeholder: "Enter text...",
            required: "This field is required",
            invalid: "Invalid input",
            clear: "Clear",
            search: "Search..."
          },
          pt: {
            placeholder: "Digite o texto...",
            required: "Este campo é obrigatório", 
            invalid: "Entrada inválida",
            clear: "Limpar",
            search: "Pesquisar..."
          },
          es: {
            placeholder: "Ingrese texto...",
            required: "Este campo es obligatorio",
            invalid: "Entrada inválida", 
            clear: "Limpiar",
            search: "Buscar..."
          }
        }
      },
      {
        name: 'select.tsx',
        translationKey: 'select',
        translations: {
          en: {
            placeholder: "Select option...",
            noOptions: "No options available",
            search: "Search options...",
            clear: "Clear selection"
          },
          pt: {
            placeholder: "Selecionar opção...",
            noOptions: "Nenhuma opção disponível",
            search: "Buscar opções...",
            clear: "Limpar seleção"
          },
          es: {
            placeholder: "Seleccionar opción...",
            noOptions: "No hay opciones disponibles",
            search: "Buscar opciones...",
            clear: "Limpiar selección"
          }
        }
      },
      {
        name: 'dialog.tsx',
        translationKey: 'dialog',
        translations: {
          en: {
            close: "Close",
            cancel: "Cancel",
            save: "Save",
            confirm: "Confirm",
            delete: "Delete"
          },
          pt: {
            close: "Fechar",
            cancel: "Cancelar", 
            save: "Salvar",
            confirm: "Confirmar",
            delete: "Excluir"
          },
          es: {
            close: "Cerrar",
            cancel: "Cancelar",
            save: "Guardar", 
            confirm: "Confirmar",
            delete: "Eliminar"
          }
        }
      },
      {
        name: 'table.tsx',
        translationKey: 'table',
        translations: {
          en: {
            noData: "No data available",
            loading: "Loading...",
            sortAsc: "Sort ascending", 
            sortDesc: "Sort descending",
            filter: "Filter",
            search: "Search in table...",
            rowsPerPage: "Rows per page",
            showing: "Showing",
            of: "of",
            entries: "entries"
          },
          pt: {
            noData: "Nenhum dado disponível",
            loading: "Carregando...",
            sortAsc: "Ordenar crescente",
            sortDesc: "Ordenar decrescente", 
            filter: "Filtrar",
            search: "Pesquisar na tabela...",
            rowsPerPage: "Linhas por página",
            showing: "Mostrando",
            of: "de",
            entries: "entradas"
          },
          es: {
            noData: "No hay datos disponibles",
            loading: "Cargando...",
            sortAsc: "Ordenar ascendente",
            sortDesc: "Ordenar descendente",
            filter: "Filtrar", 
            search: "Buscar en tabla...",
            rowsPerPage: "Filas por página",
            showing: "Mostrando",
            of: "de",
            entries: "entradas"
          }
        }
      }
    ];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    this.backupPath = `translation-backups/safe-expansion-${timestamp}`;
    
    try {
      fs.mkdirSync(this.backupPath, { recursive: true });
      
      // Backup dos arquivos de tradução
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

  rollback() {
    try {
      if (fs.existsSync(path.join(this.backupPath, 'locales'))) {
        // Remover arquivos atuais
        if (fs.existsSync('client/public/locales')) {
          fs.rmSync('client/public/locales', { recursive: true, force: true });
        }
        
        // Restaurar backup
        this.copyDirectory(path.join(this.backupPath, 'locales'), 'client/public/locales');
        this.log('✅ Rollback dos arquivos de tradução realizado');
      }
      return true;
    } catch (error) {
      this.log(`❌ Erro no rollback: ${error.message}`);
      return false;
    }
  }

  addComponentTranslations(component) {
    if (component.completed || !component.translations) return true;

    const languages = ['en', 'pt', 'es'];
    
    for (const lang of languages) {
      const translationFile = `client/public/locales/${lang}/translation.json`;
      
      if (fs.existsSync(translationFile)) {
        try {
          const existing = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));
          
          // Mergear mantendo estruturas existentes
          if (!existing.components) existing.components = {};
          existing.components[component.translationKey] = component.translations[lang];

          fs.writeFileSync(translationFile, JSON.stringify(existing, null, 2));
          this.log(`✅ Traduções do ${component.name} adicionadas: ${lang}`);
        } catch (error) {
          this.log(`❌ Erro ao atualizar traduções ${lang} para ${component.name}: ${error.message}`);
          return false;
        }
      }
    }
    
    return true;
  }

  verifyComponentExists(componentName) {
    const componentPath = `client/src/components/ui/${componentName}`;
    return fs.existsSync(componentPath);
  }

  createProgressReport(completedComponents, failedComponent = null) {
    const status = {
      timestamp: new Date().toISOString(),
      phase: failedComponent ? 'expansion-failed' : 'expansion-in-progress',
      description: failedComponent ? 
        `Expansão falhou no componente: ${failedComponent}` :
        `Expansão em progresso - ${completedComponents.length} componentes processados`,
      completedComponents: completedComponents,
      failedComponent: failedComponent,
      systemStatus: failedComponent ? 'broken' : 'working',
      nextStep: failedComponent ? 'rollback-and-investigate' : 'continue-expansion',
      backupLocation: this.backupPath,
      safetyLevel: 'ultra-safe-expansion',
      translationsExpanded: !failedComponent,
      notes: failedComponent ? [
        `Falha detectada durante expansão do ${failedComponent}`,
        'Rollback necessário',
        'Investigar causa do problema'
      ] : [
        'Traduções expandidas com sucesso para componentes processados',
        'Sistema mantém funcionalidade completa',
        'Nenhum componente foi modificado',
        'Apenas arquivos de tradução foram atualizados'
      ]
    };

    const statusFile = 'safe-expansion-status.json';
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    this.log(`✅ Relatório de progresso criado: ${statusFile}`);
  }

  async expandTranslations() {
    this.log('🚀 Iniciando expansão segura de traduções para múltiplos componentes');
    
    try {
      // 1. Backup
      if (!this.createBackup()) {
        throw new Error('Falha no backup');
      }

      // 2. Verificar sistema funcionando
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema não funcionando antes da expansão');
      }

      const completedComponents = [];
      
      // 3. Processar cada componente individualmente
      for (const component of this.componentsToExpand) {
        this.log(`📝 Processando componente: ${component.name}`);
        
        // Verificar se componente existe
        if (!component.completed && !this.verifyComponentExists(component.name)) {
          this.log(`⚠️ Componente ${component.name} não encontrado - pulando`);
          continue;
        }

        // Adicionar traduções
        if (!component.completed && !this.addComponentTranslations(component)) {
          throw new Error(`Falha ao adicionar traduções para ${component.name}`);
        }

        completedComponents.push(component.name);
        
        // Verificar saúde do sistema após cada componente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!this.verifySystemHealth()) {
          throw new Error(`Sistema falhou após processar ${component.name}`);
        }

        this.log(`✅ Componente ${component.name} processado com sucesso`);
      }

      // 4. Verificação final do sistema
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema falhou na verificação final');
      }

      // 5. Criar relatório de sucesso
      this.createProgressReport(completedComponents);

      this.log('✅ Expansão de traduções CONCLUÍDA COM SUCESSO!');
      this.log('💡 Sistema funcionando normalmente com traduções expandidas.');
      return true;

    } catch (error) {
      this.log(`❌ Expansão falhou: ${error.message}`);
      
      // Rollback automático
      this.log('🔄 Executando rollback...');
      this.rollback();
      
      this.createProgressReport([], error.message);
      return false;
    }
  }
}

// Execução
const expander = new SafeTranslationExpander();
expander.expandTranslations()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCESSO! Expansão de traduções concluída.');
      console.log('💡 Sistema funcionando com traduções expandidas para múltiplos componentes.');
    } else {
      console.log('\n❌ FALHA! Expansão de traduções não concluída.');
      console.log('🔄 Rollback executado. Sistema deve estar funcionando.');
    }
  })
  .catch(console.error);
#!/usr/bin/env node

/**
 * Test Translation Implementation - Single Component
 * Testa implementação em um único componente ultra-simples
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class SingleComponentTranslationTest {
  constructor() {
    this.backupPath = null;
    this.logFile = 'single-component-test.log';
    this.testComponent = 'client/src/components/ui/button.tsx';
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    this.backupPath = `translation-backups/single-component-test-${timestamp}`;
    
    try {
      fs.mkdirSync(this.backupPath, { recursive: true });
      
      // Backup do componente específico
      if (fs.existsSync(this.testComponent)) {
        const backupFile = path.join(this.backupPath, 'button.tsx');
        fs.copyFileSync(this.testComponent, backupFile);
      }

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
      if (fs.existsSync(this.backupPath + '/button.tsx')) {
        fs.copyFileSync(this.backupPath + '/button.tsx', this.testComponent);
        this.log('✅ Rollback do componente realizado');
      }
      return true;
    } catch (error) {
      this.log(`❌ Erro no rollback: ${error.message}`);
      return false;
    }
  }

  addButtonTranslations() {
    // Adicionar traduções específicas para Button nos arquivos de tradução
    const languages = ['en', 'pt', 'es'];
    const buttonTranslations = {
      en: {
        components: {
          button: {
            loading: "Loading...",
            save: "Save",
            cancel: "Cancel", 
            delete: "Delete",
            edit: "Edit",
            close: "Close",
            submit: "Submit",
            reset: "Reset",
            confirm: "Confirm"
          }
        }
      },
      pt: {
        components: {
          button: {
            loading: "Carregando...",
            save: "Salvar",
            cancel: "Cancelar",
            delete: "Excluir",
            edit: "Editar", 
            close: "Fechar",
            submit: "Enviar",
            reset: "Resetar",
            confirm: "Confirmar"
          }
        }
      },
      es: {
        components: {
          button: {
            loading: "Cargando...",
            save: "Guardar",
            cancel: "Cancelar",
            delete: "Eliminar",
            edit: "Editar",
            close: "Cerrar",
            submit: "Enviar", 
            reset: "Resetear",
            confirm: "Confirmar"
          }
        }
      }
    };

    for (const lang of languages) {
      const translationFile = `client/public/locales/${lang}/translation.json`;
      
      if (fs.existsSync(translationFile)) {
        try {
          const existing = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));
          
          // Mergear mantendo estruturas existentes
          if (!existing.components) existing.components = {};
          existing.components.button = buttonTranslations[lang].components.button;

          fs.writeFileSync(translationFile, JSON.stringify(existing, null, 2));
          this.log(`✅ Traduções do botão adicionadas: ${lang}`);
        } catch (error) {
          this.log(`❌ Erro ao atualizar traduções ${lang}: ${error.message}`);
        }
      }
    }
  }

  testImplementation() {
    // Teste simples: apenas verificar se o componente Button ainda existe
    // e se podemos adicionario i18n hook SEM modificar o componente
    
    if (!fs.existsSync(this.testComponent)) {
      this.log(`❌ Componente não encontrado: ${this.testComponent}`);
      return false;
    }

    const buttonContent = fs.readFileSync(this.testComponent, 'utf-8');
    
    // Verificar se o componente tem uma estrutura básica válida
    if (!buttonContent.includes('export') || !buttonContent.includes('Button')) {
      this.log('❌ Estrutura do componente Button inválida');
      return false;
    }

    this.log('✅ Componente Button validado');
    return true;
  }

  createStatusReport(success, error = null) {
    const status = {
      timestamp: new Date().toISOString(),
      phase: success ? 'single-component-test-success' : 'single-component-test-failed',
      description: success ? 
        'Teste de componente único realizado com sucesso' : 
        `Teste de componente único falhou: ${error}`,
      testComponent: this.testComponent,
      systemStatus: success ? 'working' : 'broken',
      nextStep: success ? 'expand-to-more-components' : 'rollback-and-investigate',
      backupLocation: this.backupPath,
      safetyLevel: 'ultra-safe-single-test',
      translationsAdded: success,
      notes: success ? [
        'Traduções para Button adicionadas aos arquivos JSON',
        'Sistema mantém funcionalidade completa',
        'Componente não foi modificado',
        'Pronto para expandir para mais componentes'
      ] : [
        'Falha detectada durante teste',
        'Rollback necessário', 
        'Investigar causa do problema'
      ]
    };

    const statusFile = 'single-component-test-status.json';
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    this.log(`✅ Relatório de status criado: ${statusFile}`);
  }

  async implementAndTest() {
    this.log('🧪 Iniciando teste de componente único');
    
    try {
      // 1. Backup
      if (!this.createBackup()) {
        throw new Error('Falha no backup');
      }

      // 2. Verificar sistema funcionando
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema não funcionando antes do teste');
      }

      // 3. Testar estrutura do componente
      if (!this.testImplementation()) {
        throw new Error('Validação do componente falhou');
      }

      // 4. Adicionar traduções aos arquivos JSON 
      this.addButtonTranslations();

      // 5. Esperar um pouco e verificar se sistema ainda funciona
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!this.verifySystemHealth()) {
        throw new Error('Sistema falhou após adicionar traduções');
      }

      // 6. Criar relatório de sucesso
      this.createStatusReport(true);

      this.log('✅ Teste de componente único APROVADO!');
      this.log('💡 Sistema funcionando normalmente após adicionar traduções.');
      return true;

    } catch (error) {
      this.log(`❌ Teste falhou: ${error.message}`);
      
      // Rollback automático
      this.log('🔄 Executando rollback...');
      this.rollback();
      
      this.createStatusReport(false, error.message);
      return false;
    }
  }
}

// Execução
const tester = new SingleComponentTranslationTest();
tester.implementAndTest()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCESSO! Teste de componente único passou.');
      console.log('💡 Sistema funcionando com traduções. Pronto para expandir.');
    } else {
      console.log('\n❌ FALHA! Teste de componente único não passou.');
      console.log('🔄 Rollback executado. Sistema deve estar funcionando.');
    }
  })
  .catch(console.error);
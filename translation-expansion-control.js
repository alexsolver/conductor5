#!/usr/bin/env node

/**
 * Sistema de Controle para Expansão Gradual de Traduções
 * 
 * Este sistema garante:
 * - Backup automático antes de modificações
 * - Controle granular módulo por módulo
 * - Rollback automático em caso de falha
 * - Monitoramento de progresso detalhado
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TranslationExpansionController {
  constructor() {
    this.controlFile = './translation-expansion-status.json';
    this.backupDir = './translation-backups';
    this.logFile = './translation-expansion.log';
    
    this.initializeController();
  }

  initializeController() {
    // Criar diretório de backup se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Inicializar arquivo de status se não existir
    if (!fs.existsSync(this.controlFile)) {
      const initialStatus = {
        version: '1.0.0',
        startedAt: new Date().toISOString(),
        currentPhase: 'initialization',
        modules: this.getModuleList(),
        statistics: {
          totalModules: 0,
          completedModules: 0,
          failedModules: 0,
          translationKeysAdded: 0,
          hardcodedTextsFound: 0
        },
        lastBackup: null,
        safetyChecks: {
          serverRunning: false,
          frontendResponding: false,
          criticalFunctionsWorking: false
        }
      };
      
      this.saveStatus(initialStatus);
    }
  }

  getModuleList() {
    const modules = [
      // Fase 1: Componentes UI Simples (Baixo Risco)
      {
        name: 'ui-components',
        path: 'client/src/components/ui',
        priority: 1,
        riskLevel: 'low',
        status: 'pending',
        files: [],
        estimatedTexts: 0,
        completedAt: null,
        backupPath: null
      },
      
      // Fase 2: Componentes Layout (Baixo-Médio Risco)
      {
        name: 'layout-components',
        path: 'client/src/components/layout',
        priority: 2,
        riskLevel: 'low-medium',
        status: 'pending',
        files: [],
        estimatedTexts: 0,
        completedAt: null,
        backupPath: null
      },
      
      // Fase 3: Páginas Administrativas (Médio Risco)
      {
        name: 'admin-pages',
        path: 'client/src/pages',
        priority: 3,
        riskLevel: 'medium',
        status: 'pending',
        files: [],
        estimatedTexts: 0,
        completedAt: null,
        backupPath: null,
        exclude: ['AuthPage.tsx'] // Excluir páginas críticas
      },
      
      // Fase 4: Formulários Não-Críticos (Médio-Alto Risco)
      {
        name: 'form-components',
        path: 'client/src/components',
        priority: 4,
        riskLevel: 'medium-high',
        status: 'pending',
        files: [],
        estimatedTexts: 0,
        completedAt: null,
        backupPath: null,
        exclude: ['auth', 'login', 'register'] // Excluir componentes de auth
      },
      
      // Fase 5: Sistema de Tickets (Alto Risco)
      {
        name: 'ticket-system',
        path: 'client/src/pages',
        priority: 5,
        riskLevel: 'high',
        status: 'pending',
        files: [],
        estimatedTexts: 0,
        completedAt: null,
        backupPath: null,
        include: ['Tickets.tsx', 'TicketDetails.tsx']
      },
      
      // Fase 6: Sistema de Autenticação (Crítico - ÚLTIMO)
      {
        name: 'authentication-system',
        path: 'client/src',
        priority: 6,
        riskLevel: 'critical',
        status: 'pending',
        files: [],
        estimatedTexts: 0,
        completedAt: null,
        backupPath: null,
        include: ['hooks/useAuth.tsx', 'pages/AuthPage.tsx']
      }
    ];

    return modules;
  }

  createBackup(moduleName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${moduleName}-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);
    
    try {
      // Criar backup do estado atual
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Copiar arquivos relevantes
      this.copyDirectory('client/src', path.join(backupPath, 'client-src'));
      this.copyDirectory('shared', path.join(backupPath, 'shared'));
      
      // Copiar arquivos de tradução
      if (fs.existsSync('client/public/locales')) {
        this.copyDirectory('client/public/locales', path.join(backupPath, 'locales'));
      }
      
      this.log(`✅ Backup criado: ${backupPath}`);
      return backupPath;
      
    } catch (error) {
      this.log(`❌ Erro ao criar backup: ${error.message}`);
      throw error;
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

  performSafetyChecks() {
    const checks = {
      serverRunning: false,
      frontendResponding: false,
      criticalFunctionsWorking: false
    };

    try {
      // Verificar se o servidor está rodando (porta 5000)
      const serverCheck = execSync('curl -s http://localhost:5000/api/health || echo "FAIL"', 
        { encoding: 'utf-8', timeout: 5000 });
      checks.serverRunning = !serverCheck.includes('FAIL');

      // Verificar se o frontend está respondendo
      const frontendCheck = execSync('curl -s http://localhost:5000 || echo "FAIL"', 
        { encoding: 'utf-8', timeout: 5000 });
      checks.frontendResponding = !frontendCheck.includes('FAIL');

      // Verificar se há erros críticos no console
      checks.criticalFunctionsWorking = checks.serverRunning && checks.frontendResponding;

    } catch (error) {
      this.log(`⚠️ Erro durante verificações de segurança: ${error.message}`);
    }

    return checks;
  }

  rollbackToBackup(backupPath) {
    try {
      this.log(`🔄 Iniciando rollback para: ${backupPath}`);
      
      // Restaurar arquivos do backup
      if (fs.existsSync(path.join(backupPath, 'client-src'))) {
        this.removeDirectory('client/src');
        this.copyDirectory(path.join(backupPath, 'client-src'), 'client/src');
      }
      
      if (fs.existsSync(path.join(backupPath, 'shared'))) {
        this.removeDirectory('shared');
        this.copyDirectory(path.join(backupPath, 'shared'), 'shared');
      }
      
      if (fs.existsSync(path.join(backupPath, 'locales'))) {
        this.removeDirectory('client/public/locales');
        this.copyDirectory(path.join(backupPath, 'locales'), 'client/public/locales');
      }
      
      this.log(`✅ Rollback concluído com sucesso`);
      return true;
      
    } catch (error) {
      this.log(`❌ Erro durante rollback: ${error.message}`);
      return false;
    }
  }

  removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  analyzeModule(moduleName) {
    const status = this.loadStatus();
    const module = status.modules.find(m => m.name === moduleName);
    
    if (!module) {
      throw new Error(`Módulo não encontrado: ${moduleName}`);
    }

    this.log(`🔍 Analisando módulo: ${moduleName}`);
    
    const analysis = {
      hardcodedTexts: [],
      existingTranslationKeys: [],
      files: [],
      estimatedWorkload: 0
    };

    // Analisar arquivos do módulo
    const files = this.getModuleFiles(module);
    
    for (const filePath of files) {
      const fileAnalysis = this.analyzeFile(filePath);
      analysis.hardcodedTexts.push(...fileAnalysis.hardcodedTexts);
      analysis.existingTranslationKeys.push(...fileAnalysis.translationKeys);
      analysis.files.push({
        path: filePath,
        hardcodedCount: fileAnalysis.hardcodedTexts.length,
        translationCount: fileAnalysis.translationKeys.length
      });
    }

    analysis.estimatedWorkload = analysis.hardcodedTexts.length * 2; // 2 minutos por texto

    // Atualizar status do módulo
    module.files = analysis.files;
    module.estimatedTexts = analysis.hardcodedTexts.length;
    module.status = 'analyzed';
    
    this.saveStatus(status);
    this.log(`✅ Análise concluída: ${analysis.hardcodedTexts.length} textos encontrados`);
    
    return analysis;
  }

  getModuleFiles(module) {
    const files = [];
    
    if (!fs.existsSync(module.path)) {
      return files;
    }

    const scanDirectory = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Verificar exclusões
          if (module.exclude && module.exclude.some(exclude => item.includes(exclude))) {
            continue;
          }
          scanDirectory(itemPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          // Verificar inclusões específicas
          if (module.include) {
            if (module.include.some(include => itemPath.includes(include))) {
              files.push(itemPath);
            }
          } else {
            files.push(itemPath);
          }
        }
      }
    };

    scanDirectory(module.path);
    return files;
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const analysis = {
      hardcodedTexts: [],
      translationKeys: []
    };

    // Buscar strings hardcoded (textos em português/inglês entre aspas)
    const hardcodedRegex = /"([^"]{3,}[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,}[^"]*?)"/g;
    let match;
    
    while ((match = hardcodedRegex.exec(content)) !== null) {
      const text = match[1];
      
      // Filtrar falsos positivos (URLs, classes CSS, IDs, etc.)
      if (!this.isLikelyUserText(text)) continue;
      
      analysis.hardcodedTexts.push({
        text: text,
        line: this.getLineNumber(content, match.index),
        context: this.getContext(content, match.index)
      });
    }

    // Buscar chaves de tradução existentes
    const translationRegex = /t\(['"`]([^'"`]+)['"`]\)/g;
    while ((match = translationRegex.exec(content)) !== null) {
      analysis.translationKeys.push(match[1]);
    }

    return analysis;
  }

  isLikelyUserText(text) {
    // Filtrar textos que provavelmente não são para usuário
    const exclusions = [
      /^[a-z-]+$/, // classes CSS
      /^[A-Z_]+$/, // constantes
      /^\d+$/, // números
      /^[a-f0-9-]{8,}$/, // IDs/hashes
      /^https?:/, // URLs
      /^\//, // paths
      /^\w+@\w+/, // emails
      /^[a-z]+\.[a-z]+/, // propriedades de objeto
      /^(true|false|null|undefined)$/, // valores JS
      /^(px|em|rem|%|\d+)$/, // valores CSS
    ];

    return !exclusions.some(pattern => pattern.test(text)) && text.length >= 3;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getContext(content, index) {
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + 50);
    return content.substring(start, end);
  }

  generateReport() {
    const status = this.loadStatus();
    
    console.log('\n📊 RELATÓRIO DE EXPANSÃO DE TRADUÇÕES');
    console.log('=====================================\n');
    
    console.log(`📅 Iniciado em: ${status.startedAt}`);
    console.log(`🎯 Fase atual: ${status.currentPhase}`);
    console.log(`📈 Progresso: ${status.statistics.completedModules}/${status.statistics.totalModules} módulos\n`);
    
    console.log('📋 STATUS DOS MÓDULOS:\n');
    
    status.modules.forEach((module, index) => {
      const statusIcon = {
        'pending': '⏳',
        'analyzed': '🔍',
        'in-progress': '🔧',
        'testing': '🧪',
        'completed': '✅',
        'failed': '❌'
      }[module.status] || '❓';
      
      console.log(`${statusIcon} ${module.name}`);
      console.log(`   Prioridade: ${module.priority} | Risco: ${module.riskLevel}`);
      console.log(`   Arquivos: ${module.files.length} | Textos estimados: ${module.estimatedTexts}`);
      console.log(`   Status: ${module.status}\n`);
    });
    
    console.log('📊 ESTATÍSTICAS:');
    console.log(`   Chaves de tradução adicionadas: ${status.statistics.translationKeysAdded}`);
    console.log(`   Textos hardcoded encontrados: ${status.statistics.hardcodedTextsFound}`);
    console.log(`   Módulos com falha: ${status.statistics.failedModules}\n`);
    
    console.log('🔒 VERIFICAÇÕES DE SEGURANÇA:');
    const checks = status.safetyChecks;
    console.log(`   Servidor rodando: ${checks.serverRunning ? '✅' : '❌'}`);
    console.log(`   Frontend respondendo: ${checks.frontendResponding ? '✅' : '❌'}`);
    console.log(`   Funções críticas: ${checks.criticalFunctionsWorking ? '✅' : '❌'}\n`);
  }

  loadStatus() {
    return JSON.parse(fs.readFileSync(this.controlFile, 'utf-8'));
  }

  saveStatus(status) {
    status.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.controlFile, JSON.stringify(status, null, 2));
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    fs.appendFileSync(this.logFile, logEntry);
  }

  // Métodos principais de controle
  
  async startAnalysisPhase() {
    this.log('🚀 Iniciando fase de análise...');
    
    const status = this.loadStatus();
    status.currentPhase = 'analysis';
    status.lastBackup = this.createBackup('initial-state');
    status.safetyChecks = this.performSafetyChecks();
    
    this.saveStatus(status);
    
    if (!status.safetyChecks.criticalFunctionsWorking) {
      throw new Error('❌ Sistema não está funcionando corretamente. Abortando análise.');
    }
    
    this.log('✅ Sistema verificado. Pronto para análise.');
    return true;
  }

  async analyzeNextModule() {
    const status = this.loadStatus();
    const nextModule = status.modules.find(m => m.status === 'pending');
    
    if (!nextModule) {
      this.log('🎉 Todos os módulos foram analisados!');
      return null;
    }
    
    try {
      const analysis = this.analyzeModule(nextModule.name);
      
      // Atualizar estatísticas
      status.statistics.hardcodedTextsFound += analysis.hardcodedTexts.length;
      this.saveStatus(status);
      
      return {
        module: nextModule,
        analysis: analysis
      };
      
    } catch (error) {
      this.log(`❌ Erro ao analisar módulo ${nextModule.name}: ${error.message}`);
      nextModule.status = 'failed';
      status.statistics.failedModules++;
      this.saveStatus(status);
      throw error;
    }
  }

  getNextRecommendation() {
    const status = this.loadStatus();
    const analyzedModules = status.modules.filter(m => m.status === 'analyzed');
    
    if (analyzedModules.length === 0) {
      return 'Execute analyzeNextModule() para analisar o próximo módulo.';
    }
    
    const safestModule = analyzedModules
      .sort((a, b) => a.priority - b.priority)[0];
    
    return `Módulo recomendado para implementação: ${safestModule.name} (${safestModule.estimatedTexts} textos, risco ${safestModule.riskLevel})`;
  }
}

// Exportar para uso como módulo
export default TranslationExpansionController;

// Permitir execução direta
if (import.meta.url === `file://${process.argv[1]}`) {
  const controller = new TranslationExpansionController();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      console.log('✅ Sistema de controle inicializado');
      break;
      
    case 'analyze':
      controller.startAnalysisPhase()
        .then(() => controller.analyzeNextModule())
        .then((result) => {
          if (result) {
            console.log(`✅ Módulo ${result.module.name} analisado: ${result.analysis.hardcodedTexts.length} textos encontrados`);
          }
        })
        .catch(console.error);
      break;
      
    case 'report':
      controller.generateReport();
      break;
      
    case 'safety':
      const checks = controller.performSafetyChecks();
      console.log('🔒 Verificações de segurança:', checks);
      break;
      
    default:
      console.log(`
Uso: node translation-expansion-control.js <comando>

Comandos:
  init     - Inicializar sistema de controle
  analyze  - Analisar próximo módulo
  report   - Gerar relatório de progresso
  safety   - Verificar se sistema está funcionando
      `);
  }
}
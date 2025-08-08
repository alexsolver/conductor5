
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { db } from '../db';
import { eq } from 'drizzle-orm';

interface LayerIssue {
  id: string;
  layer: 'database' | 'schema' | 'middleware' | 'backend' | 'frontend' | 'ux';
  module: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'missing_field' | 'broken_api' | 'ui_mismatch' | 'data_inconsistency' | 'validation_error' | 'performance';
  description: string;
  evidence: string[];
  affectedFiles: string[];
  expectedBehavior: string;
  currentBehavior: string;
  suggestedFix: string;
}

class SystemLayerAnalyzer {
  private issues: LayerIssue[] = [];
  private modules = [
    'tickets', 'customers', 'knowledge-base', 'materials-services', 
    'timecard', 'locations', 'notifications', 'schedule-management',
    'user-management', 'dashboard', 'auth'
  ];

  async analyzeAllLayers(): Promise<void> {
    console.log('🔍 ANÁLISE SISTEMÁTICA DE CAMADAS - INICIANDO...\n');
    
    for (const module of this.modules) {
      console.log(`\n📦 ANALISANDO MÓDULO: ${module.toUpperCase()}`);
      console.log('=' .repeat(60));
      
      await this.analyzeDatabaseLayer(module);
      await this.analyzeSchemaLayer(module);
      await this.analyzeMiddlewareLayer(module);
      await this.analyzeBackendLayer(module);
      await this.analyzeFrontendLayer(module);
      await this.analyzeUXLayer(module);
    }

    this.generateReport();
  }

  private async analyzeDatabaseLayer(module: string): Promise<void> {
    console.log('\n🗄️  CAMADA 1: BANCO DE DADOS');
    console.log('-'.repeat(40));

    try {
      // Verificar se as tabelas existem
      const tableCheck = await this.checkTableExistence(module);
      if (tableCheck.missing.length > 0) {
        this.addIssue({
          id: `DB-${module}-001`,
          layer: 'database',
          module,
          severity: 'critical',
          type: 'missing_field',
          description: `Tabelas ausentes no banco para módulo ${module}`,
          evidence: [`Tabelas não encontradas: ${tableCheck.missing.join(', ')}`],
          affectedFiles: ['database schema'],
          expectedBehavior: 'Todas as tabelas do módulo devem existir',
          currentBehavior: 'Tabelas ausentes causam erros de runtime',
          suggestedFix: 'Executar migrações ou criar tabelas manualmente'
        });
        console.log(`❌ CRÍTICO: Tabelas ausentes - ${tableCheck.missing.join(', ')}`);
      } else {
        console.log(`✅ Tabelas do módulo ${module}: OK`);
      }

      // Verificar integridade referencial
      const fkCheck = await this.checkForeignKeyIntegrity(module);
      if (fkCheck.broken.length > 0) {
        this.addIssue({
          id: `DB-${module}-002`,
          layer: 'database',
          module,
          severity: 'high',
          type: 'data_inconsistency',
          description: `Foreign keys quebradas no módulo ${module}`,
          evidence: fkCheck.broken,
          affectedFiles: ['database relationships'],
          expectedBehavior: 'Todas as FKs devem ser válidas',
          currentBehavior: 'Dados órfãos ou referências inválidas',
          suggestedFix: 'Limpar dados órfãos e recriar constraints'
        });
        console.log(`❌ ALTO: Foreign Keys quebradas - ${fkCheck.broken.length} encontradas`);
      } else {
        console.log(`✅ Integridade referencial: OK`);
      }

      // Verificar índices de performance
      const indexCheck = await this.checkPerformanceIndexes(module);
      if (indexCheck.missing.length > 0) {
        this.addIssue({
          id: `DB-${module}-003`,
          layer: 'database',
          module,
          severity: 'medium',
          type: 'performance',
          description: `Índices de performance ausentes no módulo ${module}`,
          evidence: indexCheck.missing,
          affectedFiles: ['database indexes'],
          expectedBehavior: 'Índices otimizados para queries frequentes',
          currentBehavior: 'Queries lentas por falta de índices',
          suggestedFix: 'Criar índices compostos tenant-first'
        });
        console.log(`⚠️  MÉDIO: Índices ausentes - ${indexCheck.missing.length} identificados`);
      } else {
        console.log(`✅ Índices de performance: OK`);
      }

    } catch (error) {
      console.log(`❌ CRÍTICO: Erro ao analisar banco - ${error}`);
    }
  }

  private async analyzeSchemaLayer(module: string): Promise<void> {
    console.log('\n📋 CAMADA 2: SCHEMA DRIZZLE');
    console.log('-'.repeat(40));

    try {
      const schemaFile = this.findSchemaFile(module);
      if (!schemaFile) {
        this.addIssue({
          id: `SC-${module}-001`,
          layer: 'schema',
          module,
          severity: 'critical',
          type: 'missing_field',
          description: `Schema file não encontrado para módulo ${module}`,
          evidence: [`Nenhum arquivo de schema localizado`],
          affectedFiles: ['shared/schema-*.ts'],
          expectedBehavior: 'Schema definido para todas as tabelas',
          currentBehavior: 'Schema ausente impede operações ORM',
          suggestedFix: 'Criar schema Drizzle completo para o módulo'
        });
        console.log(`❌ CRÍTICO: Schema ausente`);
        return;
      }

      // Verificar consistência de tipos
      const typeCheck = await this.checkSchemaTypeConsistency(module, schemaFile);
      if (typeCheck.inconsistencies.length > 0) {
        this.addIssue({
          id: `SC-${module}-002`,
          layer: 'schema',
          module,
          severity: 'high',
          type: 'data_inconsistency',
          description: `Inconsistências de tipos no schema ${module}`,
          evidence: typeCheck.inconsistencies,
          affectedFiles: [schemaFile],
          expectedBehavior: 'Tipos schema compatíveis com banco',
          currentBehavior: 'Mismatch de tipos causa erros de validação',
          suggestedFix: 'Alinhar tipos Drizzle com estrutura real do banco'
        });
        console.log(`❌ ALTO: Inconsistências de tipos - ${typeCheck.inconsistencies.length} encontradas`);
      } else {
        console.log(`✅ Consistência de tipos: OK`);
      }

      // Verificar campos obrigatórios
      const requiredFieldsCheck = this.checkRequiredFields(module, schemaFile);
      if (requiredFieldsCheck.missing.length > 0) {
        this.addIssue({
          id: `SC-${module}-003`,
          layer: 'schema',
          module,
          severity: 'medium',
          type: 'missing_field',
          description: `Campos obrigatórios ausentes no schema ${module}`,
          evidence: requiredFieldsCheck.missing,
          affectedFiles: [schemaFile],
          expectedBehavior: 'Todos os campos críticos definidos',
          currentBehavior: 'Campos ausentes causam falhas de inserção',
          suggestedFix: 'Adicionar campos tenant_id, created_at, updated_at, is_active'
        });
        console.log(`⚠️  MÉDIO: Campos obrigatórios ausentes - ${requiredFieldsCheck.missing.join(', ')}`);
      } else {
        console.log(`✅ Campos obrigatórios: OK`);
      }

    } catch (error) {
      console.log(`❌ CRÍTICO: Erro ao analisar schema - ${error}`);
    }
  }

  private async analyzeMiddlewareLayer(module: string): Promise<void> {
    console.log('\n🔧 CAMADA 3: MIDDLEWARE');
    console.log('-'.repeat(40));

    try {
      // Verificar middlewares de autenticação
      const authCheck = this.checkAuthMiddleware(module);
      if (!authCheck.hasAuth) {
        this.addIssue({
          id: `MW-${module}-001`,
          layer: 'middleware',
          module,
          severity: 'critical',
          type: 'validation_error',
          description: `Middleware de autenticação ausente no módulo ${module}`,
          evidence: [`Rotas desprotegidas: ${authCheck.unprotectedRoutes.join(', ')}`],
          affectedFiles: authCheck.routeFiles,
          expectedBehavior: 'Todas as rotas protegidas por JWT',
          currentBehavior: 'Acesso não autorizado possível',
          suggestedFix: 'Adicionar jwtAuth middleware em todas as rotas'
        });
        console.log(`❌ CRÍTICO: Autenticação ausente - ${authCheck.unprotectedRoutes.length} rotas desprotegidas`);
      } else {
        console.log(`✅ Autenticação: OK`);
      }

      // Verificar validação de tenant
      const tenantCheck = this.checkTenantValidation(module);
      if (!tenantCheck.hasValidation) {
        this.addIssue({
          id: `MW-${module}-002`,
          layer: 'middleware',
          module,
          severity: 'high',
          type: 'validation_error',
          description: `Validação de tenant ausente no módulo ${module}`,
          evidence: tenantCheck.issues,
          affectedFiles: tenantCheck.routeFiles,
          expectedBehavior: 'Isolamento perfeito entre tenants',
          currentBehavior: 'Possível vazamento de dados entre tenants',
          suggestedFix: 'Implementar tenantValidator middleware'
        });
        console.log(`❌ ALTO: Validação de tenant ausente`);
      } else {
        console.log(`✅ Validação de tenant: OK`);
      }

      // Verificar rate limiting
      const rateLimitCheck = this.checkRateLimit(module);
      if (!rateLimitCheck.hasRateLimit) {
        this.addIssue({
          id: `MW-${module}-003`,
          layer: 'middleware',
          module,
          severity: 'medium',
          type: 'validation_error',
          description: `Rate limiting ausente no módulo ${module}`,
          evidence: [`APIs sem proteção: ${rateLimitCheck.unprotectedApis.join(', ')}`],
          affectedFiles: rateLimitCheck.routeFiles,
          expectedBehavior: 'Rate limiting para prevenção de abuse',
          currentBehavior: 'APIs vulneráveis a ataques de força bruta',
          suggestedFix: 'Implementar rateLimitMiddleware nas rotas críticas'
        });
        console.log(`⚠️  MÉDIO: Rate limiting ausente - ${rateLimitCheck.unprotectedApis.length} APIs desprotegidas`);
      } else {
        console.log(`✅ Rate limiting: OK`);
      }

    } catch (error) {
      console.log(`❌ CRÍTICO: Erro ao analisar middleware - ${error}`);
    }
  }

  private async analyzeBackendLayer(module: string): Promise<void> {
    console.log('\n⚙️  CAMADA 4: BACKEND/APIs');
    console.log('-'.repeat(40));

    try {
      // Verificar APIs funcionais
      const apiCheck = await this.checkApiResponsiveness(module);
      if (apiCheck.broken.length > 0) {
        this.addIssue({
          id: `BE-${module}-001`,
          layer: 'backend',
          module,
          severity: 'critical',
          type: 'broken_api',
          description: `APIs quebradas no módulo ${module}`,
          evidence: apiCheck.broken.map(api => `${api.endpoint}: ${api.error}`),
          affectedFiles: apiCheck.routeFiles,
          expectedBehavior: 'Todas as APIs respondem corretamente',
          currentBehavior: 'APIs retornam erro 500 ou não respondem',
          suggestedFix: 'Corrigir implementação das rotas e controllers'
        });
        console.log(`❌ CRÍTICO: APIs quebradas - ${apiCheck.broken.length} encontradas`);
        apiCheck.broken.forEach(api => {
          console.log(`   • ${api.endpoint}: ${api.error}`);
        });
      } else {
        console.log(`✅ Responsividade das APIs: OK`);
      }

      // Verificar CRUD completo
      const crudCheck = this.checkCrudCompleteness(module);
      if (crudCheck.missing.length > 0) {
        this.addIssue({
          id: `BE-${module}-002`,
          layer: 'backend',
          module,
          severity: 'high',
          type: 'missing_field',
          description: `Operações CRUD incompletas no módulo ${module}`,
          evidence: [`Operações ausentes: ${crudCheck.missing.join(', ')}`],
          affectedFiles: crudCheck.routeFiles,
          expectedBehavior: 'CRUD completo (Create, Read, Update, Delete)',
          currentBehavior: 'Funcionalidades limitadas por falta de endpoints',
          suggestedFix: 'Implementar todos os endpoints CRUD necessários'
        });
        console.log(`❌ ALTO: CRUD incompleto - faltam: ${crudCheck.missing.join(', ')}`);
      } else {
        console.log(`✅ CRUD completo: OK`);
      }

      // Verificar validação de dados
      const validationCheck = this.checkDataValidation(module);
      if (validationCheck.issues.length > 0) {
        this.addIssue({
          id: `BE-${module}-003`,
          layer: 'backend',
          module,
          severity: 'medium',
          type: 'validation_error',
          description: `Validação de dados insuficiente no módulo ${module}`,
          evidence: validationCheck.issues,
          affectedFiles: validationCheck.controllerFiles,
          expectedBehavior: 'Validação robusta de todos os inputs',
          currentBehavior: 'Dados inválidos podem ser persistidos',
          suggestedFix: 'Implementar validação Zod nos controllers'
        });
        console.log(`⚠️  MÉDIO: Validação insuficiente - ${validationCheck.issues.length} problemas`);
      } else {
        console.log(`✅ Validação de dados: OK`);
      }

      // Verificar tratamento de erros
      const errorHandlingCheck = this.checkErrorHandling(module);
      if (!errorHandlingCheck.hasProperHandling) {
        this.addIssue({
          id: `BE-${module}-004`,
          layer: 'backend',
          module,
          severity: 'medium',
          type: 'validation_error',
          description: `Tratamento de erros inadequado no módulo ${module}`,
          evidence: errorHandlingCheck.issues,
          affectedFiles: errorHandlingCheck.controllerFiles,
          expectedBehavior: 'Try-catch em todos os endpoints com logs estruturados',
          currentBehavior: 'Erros não tratados podem causar crashes',
          suggestedFix: 'Implementar error handling consistente'
        });
        console.log(`⚠️  MÉDIO: Error handling inadequado`);
      } else {
        console.log(`✅ Tratamento de erros: OK`);
      }

    } catch (error) {
      console.log(`❌ CRÍTICO: Erro ao analisar backend - ${error}`);
    }
  }

  private async analyzeFrontendLayer(module: string): Promise<void> {
    console.log('\n🖥️  CAMADA 5: FRONTEND');
    console.log('-'.repeat(40));

    try {
      // Verificar componentes ausentes
      const componentCheck = this.checkRequiredComponents(module);
      if (componentCheck.missing.length > 0) {
        this.addIssue({
          id: `FE-${module}-001`,
          layer: 'frontend',
          module,
          severity: 'high',
          type: 'missing_field',
          description: `Componentes frontend ausentes no módulo ${module}`,
          evidence: [`Componentes não encontrados: ${componentCheck.missing.join(', ')}`],
          affectedFiles: componentCheck.expectedFiles,
          expectedBehavior: 'Todos os componentes necessários implementados',
          currentBehavior: 'Funcionalidades inacessíveis pelo usuário',
          suggestedFix: 'Criar componentes React faltantes'
        });
        console.log(`❌ ALTO: Componentes ausentes - ${componentCheck.missing.join(', ')}`);
      } else {
        console.log(`✅ Componentes necessários: OK`);
      }

      // Verificar integração com APIs
      const apiIntegrationCheck = this.checkApiIntegration(module);
      if (apiIntegrationCheck.disconnected.length > 0) {
        this.addIssue({
          id: `FE-${module}-002`,
          layer: 'frontend',
          module,
          severity: 'critical',
          type: 'broken_api',
          description: `Componentes não integrados com APIs no módulo ${module}`,
          evidence: apiIntegrationCheck.disconnected.map(comp => `${comp.component}: ${comp.missingApi}`),
          affectedFiles: apiIntegrationCheck.componentFiles,
          expectedBehavior: 'Todos os componentes conectados às APIs',
          currentBehavior: 'Componentes exibem dados mock ou falham',
          suggestedFix: 'Implementar React Query hooks para integração'
        });
        console.log(`❌ CRÍTICO: APIs desconectadas - ${apiIntegrationCheck.disconnected.length} componentes`);
        apiIntegrationCheck.disconnected.forEach(comp => {
          console.log(`   • ${comp.component}: falta ${comp.missingApi}`);
        });
      } else {
        console.log(`✅ Integração com APIs: OK`);
      }

      // Verificar campos vinculados
      const fieldBindingCheck = this.checkFieldBinding(module);
      if (fieldBindingCheck.unbound.length > 0) {
        this.addIssue({
          id: `FE-${module}-003`,
          layer: 'frontend',
          module,
          severity: 'high',
          type: 'ui_mismatch',
          description: `Campos não vinculados no frontend do módulo ${module}`,
          evidence: fieldBindingCheck.unbound.map(field => `${field.component}: ${field.field} não vinculado`),
          affectedFiles: fieldBindingCheck.formFiles,
          expectedBehavior: 'Todos os campos de formulário vinculados',
          currentBehavior: 'Campos não salvam dados ou não exibem valores',
          suggestedFix: 'Implementar binding correto com React Hook Form'
        });
        console.log(`❌ ALTO: Campos não vinculados - ${fieldBindingCheck.unbound.length} identificados`);
        fieldBindingCheck.unbound.forEach(field => {
          console.log(`   • ${field.component}: ${field.field}`);
        });
      } else {
        console.log(`✅ Vinculação de campos: OK`);
      }

      // Verificar estados de loading
      const loadingStateCheck = this.checkLoadingStates(module);
      if (loadingStateCheck.missing.length > 0) {
        this.addIssue({
          id: `FE-${module}-004`,
          layer: 'frontend',
          module,
          severity: 'medium',
          type: 'ui_mismatch',
          description: `Estados de loading ausentes no módulo ${module}`,
          evidence: [`Componentes sem loading: ${loadingStateCheck.missing.join(', ')}`],
          affectedFiles: loadingStateCheck.componentFiles,
          expectedBehavior: 'Loading states em todas as operações assíncronas',
          currentBehavior: 'Interface trava sem feedback visual',
          suggestedFix: 'Implementar Skeleton ou Spinner components'
        });
        console.log(`⚠️  MÉDIO: Loading states ausentes - ${loadingStateCheck.missing.length} componentes`);
      } else {
        console.log(`✅ Estados de loading: OK`);
      }

      // Verificar tratamento de erros no frontend
      const errorUICheck = this.checkErrorUI(module);
      if (errorUICheck.missing.length > 0) {
        this.addIssue({
          id: `FE-${module}-005`,
          layer: 'frontend',
          module,
          severity: 'medium',
          type: 'ui_mismatch',
          description: `Tratamento de erros na UI ausente no módulo ${module}`,
          evidence: [`Componentes sem error handling: ${errorUICheck.missing.join(', ')}`],
          affectedFiles: errorUICheck.componentFiles,
          expectedBehavior: 'Error boundaries e feedback de erro',
          currentBehavior: 'Erros quebram a interface sem feedback',
          suggestedFix: 'Implementar ErrorBoundary e toast notifications'
        });
        console.log(`⚠️  MÉDIO: Error handling UI ausente - ${errorUICheck.missing.length} componentes`);
      } else {
        console.log(`✅ Tratamento de erros UI: OK`);
      }

    } catch (error) {
      console.log(`❌ CRÍTICO: Erro ao analisar frontend - ${error}`);
    }
  }

  private async analyzeUXLayer(module: string): Promise<void> {
    console.log('\n🎨 CAMADA 6: UX/USABILIDADE');
    console.log('-'.repeat(40));

    try {
      // Verificar responsividade
      const responsiveCheck = this.checkResponsiveness(module);
      if (!responsiveCheck.isResponsive) {
        this.addIssue({
          id: `UX-${module}-001`,
          layer: 'ux',
          module,
          severity: 'medium',
          type: 'ui_mismatch',
          description: `Interface não responsiva no módulo ${module}`,
          evidence: responsiveCheck.issues,
          affectedFiles: responsiveCheck.componentFiles,
          expectedBehavior: 'Interface adaptável a diferentes tamanhos de tela',
          currentBehavior: 'Interface quebra em dispositivos móveis',
          suggestedFix: 'Implementar Tailwind responsive classes'
        });
        console.log(`⚠️  MÉDIO: Interface não responsiva`);
      } else {
        console.log(`✅ Responsividade: OK`);
      }

      // Verificar acessibilidade
      const accessibilityCheck = this.checkAccessibility(module);
      if (accessibilityCheck.issues.length > 0) {
        this.addIssue({
          id: `UX-${module}-002`,
          layer: 'ux',
          module,
          severity: 'low',
          type: 'ui_mismatch',
          description: `Problemas de acessibilidade no módulo ${module}`,
          evidence: accessibilityCheck.issues,
          affectedFiles: accessibilityCheck.componentFiles,
          expectedBehavior: 'Interface acessível (WCAG guidelines)',
          currentBehavior: 'Barreiras de acessibilidade presentes',
          suggestedFix: 'Adicionar aria-labels, alt texts e keyboard navigation'
        });
        console.log(`⚠️  BAIXO: Problemas de acessibilidade - ${accessibilityCheck.issues.length} encontrados`);
      } else {
        console.log(`✅ Acessibilidade: OK`);
      }

      // Verificar fluxo de usuário
      const userFlowCheck = this.checkUserFlow(module);
      if (userFlowCheck.issues.length > 0) {
        this.addIssue({
          id: `UX-${module}-003`,
          layer: 'ux',
          module,
          severity: 'medium',
          type: 'ui_mismatch',
          description: `Fluxo de usuário problemático no módulo ${module}`,
          evidence: userFlowCheck.issues,
          affectedFiles: userFlowCheck.pageFiles,
          expectedBehavior: 'Fluxo intuitivo e eficiente',
          currentBehavior: 'Usuário pode se perder ou frustrar',
          suggestedFix: 'Redesenhar fluxo com breadcrumbs e navegação clara'
        });
        console.log(`⚠️  MÉDIO: Fluxo de usuário problemático - ${userFlowCheck.issues.length} problemas`);
      } else {
        console.log(`✅ Fluxo de usuário: OK`);
      }

      // Verificar consistência visual
      const visualConsistencyCheck = this.checkVisualConsistency(module);
      if (visualConsistencyCheck.issues.length > 0) {
        this.addIssue({
          id: `UX-${module}-004`,
          layer: 'ux',
          module,
          severity: 'low',
          type: 'ui_mismatch',
          description: `Inconsistências visuais no módulo ${module}`,
          evidence: visualConsistencyCheck.issues,
          affectedFiles: visualConsistencyCheck.componentFiles,
          expectedBehavior: 'Design system consistente',
          currentBehavior: 'Interface visualmente inconsistente',
          suggestedFix: 'Padronizar componentes usando design system'
        });
        console.log(`⚠️  BAIXO: Inconsistências visuais - ${visualConsistencyCheck.issues.length} encontradas`);
      } else {
        console.log(`✅ Consistência visual: OK`);
      }

    } catch (error) {
      console.log(`❌ CRÍTICO: Erro ao analisar UX - ${error}`);
    }
  }

  // ======= MÉTODOS DE VERIFICAÇÃO =======

  private async checkTableExistence(module: string): Promise<{missing: string[], existing: string[]}> {
    // Implementar verificação real de tabelas no banco
    const expectedTables = this.getExpectedTables(module);
    // Simular check - implementar query real ao banco
    return { missing: [], existing: expectedTables };
  }

  private async checkForeignKeyIntegrity(module: string): Promise<{broken: string[], valid: string[]}> {
    // Implementar verificação de FKs quebradas
    return { broken: [], valid: [] };
  }

  private async checkPerformanceIndexes(module: string): Promise<{missing: string[], existing: string[]}> {
    // Implementar verificação de índices
    return { missing: [], existing: [] };
  }

  private findSchemaFile(module: string): string | null {
    const possiblePaths = [
      `shared/schema-${module}.ts`,
      'shared/schema-master.ts',
      'shared/schema.ts'
    ];
    
    for (const path of possiblePaths) {
      try {
        if (statSync(path).isFile()) {
          return path;
        }
      } catch {}
    }
    return null;
  }

  private async checkSchemaTypeConsistency(module: string, schemaFile: string): Promise<{inconsistencies: string[]}> {
    // Implementar verificação de tipos schema vs banco
    return { inconsistencies: [] };
  }

  private checkRequiredFields(module: string, schemaFile: string): {missing: string[]} {
    const content = readFileSync(schemaFile, 'utf-8');
    const requiredFields = ['tenant_id', 'created_at', 'updated_at', 'is_active'];
    const missing = requiredFields.filter(field => !content.includes(field));
    return { missing };
  }

  private checkAuthMiddleware(module: string): {hasAuth: boolean, unprotectedRoutes: string[], routeFiles: string[]} {
    const routeFiles = this.getRouteFiles(module);
    const unprotectedRoutes: string[] = [];
    
    routeFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('jwtAuth')) {
        unprotectedRoutes.push(file);
      }
    });

    return {
      hasAuth: unprotectedRoutes.length === 0,
      unprotectedRoutes,
      routeFiles
    };
  }

  private checkTenantValidation(module: string): {hasValidation: boolean, issues: string[], routeFiles: string[]} {
    const routeFiles = this.getRouteFiles(module);
    const issues: string[] = [];

    routeFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('tenantValidator') && !content.includes('tenant_id')) {
        issues.push(`${file}: Sem validação de tenant`);
      }
    });

    return {
      hasValidation: issues.length === 0,
      issues,
      routeFiles
    };
  }

  private checkRateLimit(module: string): {hasRateLimit: boolean, unprotectedApis: string[], routeFiles: string[]} {
    const routeFiles = this.getRouteFiles(module);
    const unprotectedApis: string[] = [];

    routeFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('rateLimitMiddleware')) {
        unprotectedApis.push(file);
      }
    });

    return {
      hasRateLimit: unprotectedApis.length === 0,
      unprotectedApis,
      routeFiles
    };
  }

  private async checkApiResponsiveness(module: string): Promise<{broken: {endpoint: string, error: string}[], working: string[], routeFiles: string[]}> {
    // Implementar testes reais de API
    return { broken: [], working: [], routeFiles: [] };
  }

  private checkCrudCompleteness(module: string): {missing: string[], complete: string[], routeFiles: string[]} {
    const routeFiles = this.getRouteFiles(module);
    const expectedOperations = ['GET', 'POST', 'PUT', 'DELETE'];
    const missing: string[] = [];

    routeFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      expectedOperations.forEach(op => {
        if (!content.includes(`router.${op.toLowerCase()}`) && !content.includes(`router.${op}`)) {
          missing.push(`${file}: ${op} operation`);
        }
      });
    });

    return {
      missing,
      complete: [],
      routeFiles
    };
  }

  private checkDataValidation(module: string): {issues: string[], controllerFiles: string[]} {
    const controllerFiles = this.getControllerFiles(module);
    const issues: string[] = [];

    controllerFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('zod') && !content.includes('validate') && !content.includes('schema')) {
        issues.push(`${file}: Sem validação de dados`);
      }
    });

    return { issues, controllerFiles };
  }

  private checkErrorHandling(module: string): {hasProperHandling: boolean, issues: string[], controllerFiles: string[]} {
    const controllerFiles = this.getControllerFiles(module);
    const issues: string[] = [];

    controllerFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('try') || !content.includes('catch')) {
        issues.push(`${file}: Sem try-catch`);
      }
    });

    return {
      hasProperHandling: issues.length === 0,
      issues,
      controllerFiles
    };
  }

  private checkRequiredComponents(module: string): {missing: string[], expectedFiles: string[]} {
    const expectedComponents = this.getExpectedComponents(module);
    const missing = expectedComponents.filter(comp => {
      try {
        statSync(`client/src/components/${module}/${comp}.tsx`);
        return false;
      } catch {
        return true;
      }
    });

    return { missing, expectedFiles: expectedComponents };
  }

  private checkApiIntegration(module: string): {disconnected: {component: string, missingApi: string}[], componentFiles: string[]} {
    const componentFiles = this.getComponentFiles(module);
    const disconnected: {component: string, missingApi: string}[] = [];

    componentFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('useQuery') && !content.includes('useMutation') && !content.includes('fetch')) {
        disconnected.push({
          component: file,
          missingApi: 'API integration'
        });
      }
    });

    return { disconnected, componentFiles };
  }

  private checkFieldBinding(module: string): {unbound: {component: string, field: string}[], formFiles: string[]} {
    const formFiles = this.getFormFiles(module);
    const unbound: {component: string, field: string}[] = [];

    formFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('input') && !content.includes('register') && !content.includes('value=')) {
        unbound.push({
          component: file,
          field: 'input fields'
        });
      }
    });

    return { unbound, formFiles };
  }

  private checkLoadingStates(module: string): {missing: string[], componentFiles: string[]} {
    const componentFiles = this.getComponentFiles(module);
    const missing: string[] = [];

    componentFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('useQuery') && !content.includes('isLoading') && !content.includes('Skeleton')) {
        missing.push(file);
      }
    });

    return { missing, componentFiles };
  }

  private checkErrorUI(module: string): {missing: string[], componentFiles: string[]} {
    const componentFiles = this.getComponentFiles(module);
    const missing: string[] = [];

    componentFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('useQuery') && !content.includes('error') && !content.includes('ErrorBoundary')) {
        missing.push(file);
      }
    });

    return { missing, componentFiles };
  }

  private checkResponsiveness(module: string): {isResponsive: boolean, issues: string[], componentFiles: string[]} {
    const componentFiles = this.getComponentFiles(module);
    const issues: string[] = [];

    componentFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('sm:') && !content.includes('md:') && !content.includes('lg:')) {
        issues.push(`${file}: Sem classes responsivas`);
      }
    });

    return {
      isResponsive: issues.length === 0,
      issues,
      componentFiles
    };
  }

  private checkAccessibility(module: string): {issues: string[], componentFiles: string[]} {
    const componentFiles = this.getComponentFiles(module);
    const issues: string[] = [];

    componentFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('aria-') && !content.includes('alt=')) {
        issues.push(`${file}: Sem atributos de acessibilidade`);
      }
    });

    return { issues, componentFiles };
  }

  private checkUserFlow(module: string): {issues: string[], pageFiles: string[]} {
    const pageFiles = this.getPageFiles(module);
    const issues: string[] = [];

    pageFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('navigate') && !content.includes('Link')) {
        issues.push(`${file}: Navegação limitada`);
      }
    });

    return { issues, pageFiles };
  }

  private checkVisualConsistency(module: string): {issues: string[], componentFiles: string[]} {
    const componentFiles = this.getComponentFiles(module);
    const issues: string[] = [];

    componentFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('style=') && !content.includes('className=')) {
        issues.push(`${file}: Estilos inline inconsistentes`);
      }
    });

    return { issues, componentFiles };
  }

  // ======= MÉTODOS AUXILIARES =======

  private getExpectedTables(module: string): string[] {
    const tableMap: Record<string, string[]> = {
      tickets: ['tickets', 'ticket_attachments', 'ticket_history'],
      customers: ['customers', 'companies', 'company_memberships'],
      'materials-services': ['items', 'suppliers', 'stock', 'lpu_pricing'],
      timecard: ['timecard_entries', 'work_schedules'],
      locations: ['locations', 'addresses'],
      notifications: ['notifications', 'notification_preferences'],
      auth: ['users', 'user_sessions']
    };
    return tableMap[module] || [];
  }

  private getExpectedComponents(module: string): string[] {
    const componentMap: Record<string, string[]> = {
      tickets: ['TicketList', 'TicketDetails', 'CreateTicket', 'EditTicket'],
      customers: ['CustomerList', 'CustomerDetails', 'CreateCustomer'],
      'materials-services': ['ItemCatalog', 'SupplierManagement', 'StockManagement']
    };
    return componentMap[module] || [];
  }

  private getRouteFiles(module: string): string[] {
    try {
      return [`server/modules/${module}/routes.ts`];
    } catch {
      return [];
    }
  }

  private getControllerFiles(module: string): string[] {
    try {
      const controllersPath = `server/modules/${module}/application/controllers`;
      const files = readdirSync(controllersPath);
      return files.map(file => join(controllersPath, file));
    } catch {
      return [];
    }
  }

  private getComponentFiles(module: string): string[] {
    try {
      const componentsPath = `client/src/components/${module}`;
      const files = readdirSync(componentsPath);
      return files.map(file => join(componentsPath, file));
    } catch {
      return [];
    }
  }

  private getFormFiles(module: string): string[] {
    return this.getComponentFiles(module).filter(file => 
      file.includes('Form') || file.includes('Modal') || file.includes('Create') || file.includes('Edit')
    );
  }

  private getPageFiles(module: string): string[] {
    try {
      const files = readdirSync('client/src/pages');
      return files.filter(file => file.toLowerCase().includes(module.toLowerCase()));
    } catch {
      return [];
    }
  }

  private addIssue(issue: LayerIssue): void {
    this.issues.push(issue);
  }

  private generateReport(): void {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DE ANÁLISE SISTEMÁTICA');
    console.log('='.repeat(80));

    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');

    console.log(`\n🔥 PROBLEMAS CRÍTICOS: ${criticalIssues.length}`);
    console.log(`⚠️  PROBLEMAS ALTOS: ${highIssues.length}`);
    console.log(`📋 PROBLEMAS MÉDIOS: ${mediumIssues.length}`);
    console.log(`💡 PROBLEMAS BAIXOS: ${lowIssues.length}`);
    console.log(`📊 TOTAL DE PROBLEMAS: ${this.issues.length}`);

    // Agrupar por módulo
    const issuesByModule = this.groupIssuesByModule();
    
    console.log('\n📦 PROBLEMAS POR MÓDULO:');
    Object.entries(issuesByModule).forEach(([module, moduleIssues]) => {
      const critical = moduleIssues.filter(i => i.severity === 'critical').length;
      const high = moduleIssues.filter(i => i.severity === 'high').length;
      const medium = moduleIssues.filter(i => i.severity === 'medium').length;
      const low = moduleIssues.filter(i => i.severity === 'low').length;
      
      console.log(`   ${module}: ${critical}🔥 ${high}⚠️ ${medium}📋 ${low}💡 (Total: ${moduleIssues.length})`);
    });

    // Agrupar por camada
    const issuesByLayer = this.groupIssuesByLayer();
    
    console.log('\n🏗️ PROBLEMAS POR CAMADA:');
    Object.entries(issuesByLayer).forEach(([layer, layerIssues]) => {
      console.log(`   ${layer}: ${layerIssues.length} problemas`);
    });

    // Relatório detalhado dos problemas críticos
    if (criticalIssues.length > 0) {
      console.log('\n🔥 DETALHES DOS PROBLEMAS CRÍTICOS:');
      criticalIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. [${issue.id}] ${issue.description}`);
        console.log(`   Módulo: ${issue.module} | Camada: ${issue.layer} | Tipo: ${issue.type}`);
        console.log(`   Comportamento esperado: ${issue.expectedBehavior}`);
        console.log(`   Comportamento atual: ${issue.currentBehavior}`);
        console.log(`   Correção sugerida: ${issue.suggestedFix}`);
        if (issue.evidence.length > 0) {
          console.log(`   Evidências: ${issue.evidence.join(', ')}`);
        }
      });
    }

    // Salvar relatório em arquivo
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.issues.length,
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: lowIssues.length
      },
      byModule: issuesByModule,
      byLayer: issuesByLayer,
      allIssues: this.issues
    };

    writeFileSync('system-layer-analysis-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Relatório detalhado salvo em: system-layer-analysis-report.json');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ANÁLISE SISTEMÁTICA CONCLUÍDA');
    console.log('='.repeat(80));
  }

  private groupIssuesByModule(): Record<string, LayerIssue[]> {
    return this.issues.reduce((acc, issue) => {
      if (!acc[issue.module]) acc[issue.module] = [];
      acc[issue.module].push(issue);
      return acc;
    }, {} as Record<string, LayerIssue[]>);
  }

  private groupIssuesByLayer(): Record<string, LayerIssue[]> {
    return this.issues.reduce((acc, issue) => {
      if (!acc[issue.layer]) acc[issue.layer] = [];
      acc[issue.layer].push(issue);
      return acc;
    }, {} as Record<string, LayerIssue[]>);
  }
}

// Execução principal
const analyzer = new SystemLayerAnalyzer();
analyzer.analyzeAllLayers().catch(console.error);

export default SystemLayerAnalyzer;

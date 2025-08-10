/**
 * CLEAN ARCHITECTURE VALIDATOR
 * 
 * Valida completamente a implementação do padrão Clean Architecture:
 * - Estrutura de camadas (Domain, Application, Infrastructure, Presentation)
 * - Regras de dependência (Dependency Inversion Principle)
 * - Separação de responsabilidades
 * - Consistência de nomenclatura
 * - Padrões de implementação
 */

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ArchitectureIssue {
  id: string;
  layer: 'domain' | 'application' | 'infrastructure' | 'presentation';
  module: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'dependency_violation' | 'structure_violation' | 'naming_inconsistency' | 'missing_component' | 'coupling_issue';
  description: string;
  file: string;
  line?: number;
  suggestedFix: string;
}

interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  issues: ArchitectureIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

class CleanArchitectureValidator {
  private issues: ArchitectureIssue[] = [];
  private modulesPaths: string[] = [];

  async validateCompleteArchitecture(): Promise<ValidationResult> {
    console.log('🏗️ INICIANDO VALIDAÇÃO COMPLETA DE CLEAN ARCHITECTURE...\n');

    // 1. Descobrir todos os módulos
    this.modulesPaths = this.discoverModules(); // Store the result

    // Only proceed if modules were found
    if (this.modulesPaths.length === 0 && this.issues.some(issue => issue.id === 'system-001')) {
      console.log('❌ Validação interrompida devido a diretório de módulos não encontrado.');
      return this.generateResult(); // Return early if critical issue found
    }

    // 2. Validar estrutura de camadas
    await this.validateLayerStructure();

    // 3. Validar regras de dependência
    await this.validateDependencyRules();

    // 4. Validar separação de responsabilidades
    await this.validateSeparationOfConcerns();

    // 5. Validar padrões de nomenclatura
    await this.validateNamingPatterns();

    // 6. Validar completude da implementação
    await this.validateImplementationCompleteness();

    // 7. Gerar resultado final
    return this.generateResult();
  }

  private discoverModules(): string[] {
    // Primeiro, verifica se estamos executando do diretório correto
    const possiblePaths = [
      join(process.cwd(), 'server', 'modules'), // Projetos com server/modules
      join(__dirname, '..', 'modules'),         // Relative to scripts directory
      join(process.cwd(), 'modules')            // Projetos com modules na raiz do projeto
    ];

    let modulesPath = '';
    for (const pathToCheck of possiblePaths) {
      console.log(`🔍 Verificando caminho: ${pathToCheck}`);
      if (existsSync(pathToCheck)) {
        modulesPath = pathToCheck;
        console.log(`✅ Diretório de módulos encontrado em: ${pathToCheck}`);
        break;
      }
    }

    if (!modulesPath) {
      console.log(`❌ Diretório de módulos não encontrado.`);
      console.log(`   Verifique se a estrutura do projeto está correta ou se o script está sendo executado do diretório raiz.`);
      console.log(`   Caminhos verificados:`);
      possiblePaths.forEach(p => console.log(`     - ${p}`));
      
      this.addIssue({
        id: 'system-001',
        layer: 'infrastructure', // Camada onde a configuração do sistema reside
        module: 'system',
        severity: 'critical',
        type: 'structure_violation',
        description: 'Diretório de módulos não encontrado',
        file: 'package.json ou estrutura de diretórios',
        suggestedFix: 'Certifique-se de que o diretório "modules" exista na raiz do projeto ou em um local esperado, e execute o script a partir do diretório raiz.'
      });
      return []; // Retorna array vazio se o diretório não for encontrado
    }

    const modulesDir = modulesPath;

    try {
      const entries = readdirSync(modulesDir, { withFileTypes: true });
      const moduleDirs = entries
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      this.modulesPaths = moduleDirs.map(moduleName => join(modulesDir, moduleName));
      console.log(`✅ Encontrados ${moduleDirs.length} módulos: ${moduleDirs.join(', ')}`);
      console.log(`📂 Diretório base dos módulos: ${modulesDir}\n`);
      return this.modulesPaths;

    } catch (error) {
      console.error(`❌ Erro ao ler o diretório de módulos ${modulesDir}:`, error);
      this.addIssue({
        id: 'system-002',
        layer: 'infrastructure',
        module: 'system',
        severity: 'critical',
        type: 'structure_violation',
        description: `Erro ao ler o diretório de módulos: ${String(error)}`,
        file: modulesDir,
        suggestedFix: 'Verificar permissões de leitura no diretório de módulos.'
      });
      return [];
    }
  }

  private async validateLayerStructure(): Promise<void> {
    console.log('📋 VALIDANDO ESTRUTURA DE CAMADAS...\n');

    if (this.modulesPaths.length === 0) {
      console.log('   Nenhum módulo encontrado para validar estrutura.');
      return;
    }

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split(/[\\/]/).pop()!; // Use regex for cross-platform compatibility
      await this.validateModuleLayerStructure(modulePath, moduleName);
    }
  }

  private async validateModuleLayerStructure(modulePath: string, moduleName: string): Promise<void> {
    console.log(`🔍 Analisando estrutura do módulo: ${moduleName}`);

    const expectedLayers = ['domain', 'application', 'infrastructure'];
    const presentLayers: string[] = [];

    // Verificar camadas obrigatórias
    for (const layer of expectedLayers) {
      const layerPath = join(modulePath, layer);
      if (existsSync(layerPath)) {
        presentLayers.push(layer);
        console.log(`  ✅ Camada ${layer}: Presente`);

        // Validar estrutura interna da camada
        await this.validateLayerInternalStructure(layerPath, layer, moduleName);
      } else {
        console.log(`  ❌ Camada ${layer}: Ausente`);
        this.addIssue({
          id: `ARCH-${moduleName.toUpperCase()}-L${layer.toUpperCase()}-MISSING`,
          layer: layer as any,
          module: moduleName,
          severity: 'high',
          type: 'structure_violation',
          description: `Camada '${layer}' ausente no módulo ${moduleName}`,
          file: layerPath,
          suggestedFix: `Criar diretório '${layer}' com estrutura apropriada`
        });
      }
    }

    // Verificar se routes.ts (presentation layer) existe
    const presentationDir = join(modulePath, 'presentation');
    let routesPath = '';

    if (existsSync(join(modulePath, 'routes.ts'))) {
      routesPath = join(modulePath, 'routes.ts');
    } else if (existsSync(join(presentationDir, 'routes.ts'))) {
      routesPath = join(presentationDir, 'routes.ts');
    } else if (existsSync(join(presentationDir, 'index.ts'))) { // Alternativa comum para entry point presentation
      routesPath = join(presentationDir, 'index.ts');
    }

    if (routesPath) {
      console.log(`  ✅ Presentation Layer (rotas): Presente`);
      await this.validateRoutesFile(routesPath, moduleName);
    } else {
      console.log(`  ⚠️  Presentation Layer (rotas): Ausente`);
      this.addIssue({
        id: `ARCH-${moduleName.toUpperCase()}-ROUTES-MISSING`,
        layer: 'presentation',
        module: moduleName,
        severity: 'medium',
        type: 'missing_component',
        description: `Arquivo de rotas (routes.ts ou presentation/index.ts) ausente no módulo ${moduleName}`,
        file: modulePath, // Apontar para o diretório do módulo
        suggestedFix: 'Criar arquivo de rotas na camada Presentation ou no diretório raiz do módulo para definir endpoints da API'
      });
    }

    console.log('');
  }

  private async validateLayerInternalStructure(layerPath: string, layer: string, moduleName: string): Promise<void> {
    const expectedStructures: Record<string, string[]> = {
      domain: ['entities', 'repositories', 'events', 'services', 'value-objects'],
      application: ['use-cases', 'controllers', 'dto', 'services', 'repositories'], // Repositories na application são interfaces
      infrastructure: ['repositories', 'clients', 'config']
    };

    const expected = expectedStructures[layer as keyof typeof expectedStructures] || [];

    for (const structure of expected) {
      const structurePath = join(layerPath, structure);
      if (!existsSync(structurePath)) {
        this.addIssue({
          id: `ARCH-${moduleName.toUpperCase()}-${layer.toUpperCase()}-${structure.toUpperCase()}-MISSING`,
          layer: layer as any,
          module: moduleName,
          severity: 'low', // Tornando menos severo, pois nem sempre é obrigatório ter subdiretórios
          type: 'structure_violation',
          description: `Estrutura esperada '${structure}' ausente na camada '${layer}'`,
          file: structurePath,
          suggestedFix: `Criar diretório/arquivo '${structure}' na camada '${layer}' se necessário`
        });
      }
    }
  }

  private async validateDependencyRules(): Promise<void> {
    console.log('🔗 VALIDANDO REGRAS DE DEPENDÊNCIA...\n');

    if (this.modulesPaths.length === 0) {
      console.log('   Nenhum módulo encontrado para validar dependências.');
      return;
    }

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split(/[\\/]/).pop()!;
      await this.validateModuleDependencyRules(modulePath, moduleName);
    }
  }

  private async validateModuleDependencyRules(modulePath: string, moduleName: string): Promise<void> {
    console.log(`🔍 Analisando dependências do módulo: ${moduleName}`);

    // Validar Domain Layer - não deve depender de camadas externas
    await this.validateDomainLayerDependencies(modulePath, moduleName);

    // Validar Application Layer - só pode depender de Domain
    await this.validateApplicationLayerDependencies(modulePath, moduleName);

    // Validar Infrastructure Layer - pode depender de Domain e Application (interfaces)
    await this.validateInfrastructureLayerDependencies(modulePath, moduleName);
    
    // Validar Presentation Layer - pode depender de Application
    await this.validatePresentationLayerDependencies(modulePath, moduleName);
  }

  private async validateDomainLayerDependencies(modulePath: string, moduleName: string): Promise<void> {
    const domainPath = join(modulePath, 'domain');
    if (!existsSync(domainPath)) return;

    const files = this.getAllTSFiles(domainPath);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const violations = this.findDependencyViolations(content, 'domain');

        for (const violation of violations) {
          this.addIssue({
            id: `DEP-${moduleName.toUpperCase()}-DOMAIN-${Date.now()}-${violation.import.replace(/[^a-zA-Z0-9]/g, '')}`,
            layer: 'domain',
            module: moduleName,
            severity: 'critical',
            type: 'dependency_violation',
            description: `Domain Layer: Dependência proibida encontrada -> ${violation.import}`,
            file: file,
            line: violation.line,
            suggestedFix: violation.suggestion
          });
        }
      } catch (error) {
        console.error(`Erro ao ler arquivo ${file} para validação de dependência:`, error);
      }
    }
  }

  private async validateApplicationLayerDependencies(modulePath: string, moduleName: string): Promise<void> {
    const appPath = join(modulePath, 'application');
    if (!existsSync(appPath)) return;

    const files = this.getAllTSFiles(appPath);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const violations = this.findDependencyViolations(content, 'application');

        for (const violation of violations) {
          this.addIssue({
            id: `DEP-${moduleName.toUpperCase()}-APP-${Date.now()}-${violation.import.replace(/[^a-zA-Z0-9]/g, '')}`,
            layer: 'application',
            module: moduleName,
            severity: 'high',
            type: 'dependency_violation',
            description: `Application Layer: Dependência proibida encontrada -> ${violation.import}`,
            file: file,
            line: violation.line,
            suggestedFix: violation.suggestion
          });
        }
      } catch (error) {
        console.error(`Erro ao ler arquivo ${file} para validação de dependência:`, error);
      }
    }
  }

  private async validateInfrastructureLayerDependencies(modulePath: string, moduleName: string): Promise<void> {
    const infraPath = join(modulePath, 'infrastructure');
    if (!existsSync(infraPath)) return;

    const files = this.getAllTSFiles(infraPath);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const violations = this.findDependencyViolations(content, 'infrastructure');

        for (const violation of violations) {
          this.addIssue({
            id: `DEP-${moduleName.toUpperCase()}-INFRA-${Date.now()}-${violation.import.replace(/[^a-zA-Z0-9]/g, '')}`,
            layer: 'infrastructure',
            module: moduleName,
            severity: 'medium',
            type: 'dependency_violation',
            description: `Infrastructure Layer: Dependência questionável -> ${violation.import}`,
            file: file,
            line: violation.line,
            suggestedFix: violation.suggestion
          });
        }
      } catch (error) {
        console.error(`Erro ao ler arquivo ${file} para validação de dependência:`, error);
      }
    }
  }

  private async validatePresentationLayerDependencies(modulePath: string, moduleName: string): Promise<void> {
    const presentationPath = join(modulePath, 'presentation');
    if (!existsSync(presentationPath)) {
      // Verifica se existe routes.ts na raiz do módulo como alternativa
      const rootRoutesPath = join(modulePath, 'routes.ts');
      if (existsSync(rootRoutesPath)) {
         const content = readFileSync(rootRoutesPath, 'utf-8');
         const violations = this.findDependencyViolations(content, 'presentation');
         for (const violation of violations) {
           this.addIssue({
             id: `DEP-${moduleName.toUpperCase()}-PRESENTATION-${Date.now()}-${violation.import.replace(/[^a-zA-Z0-9]/g, '')}`,
             layer: 'presentation',
             module: moduleName,
             severity: 'low', // Geralmente menos crítico na presentation
             type: 'dependency_violation',
             description: `Presentation Layer: Dependência questionável -> ${violation.import}`,
             file: rootRoutesPath,
             line: violation.line,
             suggestedFix: violation.suggestion
           });
         }
      }
      return; // Não há camada de presentation definida ou rotas raiz
    }

    const files = this.getAllTSFiles(presentationPath);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const violations = this.findDependencyViolations(content, 'presentation');

        for (const violation of violations) {
          this.addIssue({
            id: `DEP-${moduleName.toUpperCase()}-PRESENTATION-${Date.now()}-${violation.import.replace(/[^a-zA-Z0-9]/g, '')}`,
            layer: 'presentation',
            module: moduleName,
            severity: 'low', // Geralmente menos crítico na presentation
            type: 'dependency_violation',
            description: `Presentation Layer: Dependência questionável -> ${violation.import}`,
            file: file,
            line: violation.line,
            suggestedFix: violation.suggestion
          });
        }
      } catch (error) {
        console.error(`Erro ao ler arquivo ${file} para validação de dependência:`, error);
      }
    }
  }


  private findDependencyViolations(content: string, currentLayer: string): Array<{import: string, line: number, suggestion: string}> {
    const violations: Array<{import: string, line: number, suggestion: string}> = [];
    const lines = content.split('\n');

    // Padrões de importação proibidos por camada
    const forbiddenImports: Record<string, string[]> = {
      domain: [
        'express', 'drizzle-orm', 'pg', 'bcrypt', 'jsonwebtoken', // Frameworks e bibliotecas específicas
        '../application', '../infrastructure', 'application/', 'infrastructure/', // Camadas internas
        '@nestjs', 'typeorm', 'mongoose', // Outros frameworks/ORMs
        'reflect-metadata' // Geralmente usado em infra ou app layer para DI
      ],
      application: [
        'express', 'drizzle-orm', 'pg', 'bcrypt', 'jsonwebtoken', // Frameworks e bibliotecas específicas
        '../infrastructure', 'infrastructure/', // Camadas internas
        '@nestjs', 'typeorm', 'mongoose', // Outros frameworks/ORMs
        'reflect-metadata'
      ],
      infrastructure: [
        // Infraestrutura pode importar de quase tudo, mas validamos dependências cíclicas ou de presentation
        '../presentation', 'presentation/',
      ],
      presentation: [
        // Presentation pode importar de Application, mas não de Domain ou Infra diretamente
        '../domain', 'domain/',
        '../infrastructure', 'infrastructure/'
      ]
    };

    // Lista de imports permitidos de outras camadas (para validação mais granular)
    const allowedCrossLayerImports: Record<string, string[]> = {
        domain: [], // Domain não pode importar nada de fora
        application: ['../domain', 'domain/'], // Application pode importar Domain
        infrastructure: ['../domain', 'domain/', '../application', 'application/'], // Infra pode importar Domain e Application (interfaces)
        presentation: ['../application', 'application/'] // Presentation pode importar Application
    };

    const forbidden = forbiddenImports[currentLayer as keyof typeof forbiddenImports] || [];
    const allowed = allowedCrossLayerImports[currentLayer as keyof typeof allowedCrossLayerImports] || [];

    lines.forEach((line, index) => {
      // Regex mais robusta para capturar imports: handles various syntaxes like `import {} from '...'`, `import X from '...'`, `import * as Y from '...'`
      const importMatch = line.match(/import(?:["'\s]*(?:[\w*{}\n\r\t, ]+)+)from\s+["']([^'"]+)["']/);
      if (importMatch) {
        const importPath = importMatch[1];

        // 1. Verifica dependências proibidas diretamente
        for (const forbiddenPattern of forbidden) {
          if (importPath.startsWith(forbiddenPattern) || importPath === forbiddenPattern) {
            violations.push({
              import: importPath,
              line: index + 1,
              suggestion: this.getSuggestionForViolation(currentLayer, importPath)
            });
            return; // Uma violação por linha de import é suficiente
          }
        }
        
        // 2. Verifica dependências entre camadas permitidas (se não for um pattern proibido)
        if (currentLayer !== 'domain') { // Domain não deve ter imports de fora
            let isAllowed = false;
            for (const allowedPattern of allowed) {
                if (importPath.startsWith(allowedPattern) || importPath === allowedPattern) {
                    isAllowed = true;
                    break;
                }
            }
            // Se a importação não é permitida e não é um pacote externo (npm)
            if (!isAllowed && !importPath.startsWith('@') && !/^[a-zA-Z0-9]/.test(importPath)) {
               // Considera pacotes externos como permitidos implicitamente, a menos que explicitamente proibidos acima.
               // Se for uma importação interna que não corresponde a nenhum padrão permitido, é uma violação.
               // Esta verificação pode ser refinada. Por ora, confiamos nas proibições explícitas.
            }
        }
      }
    });

    return violations;
  }

  private getSuggestionForViolation(layer: string, importPath: string): string {
    // Sugestões baseadas nos padrões proibidos
    const suggestions: Record<string, Record<string, string>> = {
      domain: {
        'express': 'Domain não deve importar framework web. Use interfaces/ports para abstrair.',
        'drizzle-orm': 'Domain não deve importar ORM. Defina interfaces de repositório no Domain.',
        'pg': 'Domain não deve importar driver de banco de dados. Use interfaces de repositório.',
        'bcrypt': 'Domain não deve importar biblioteca de hash. Use interface de serviço de segurança.',
        'jsonwebtoken': 'Domain não deve importar JWT. Use interface de serviço de autenticação.',
        'application': 'Domain não deve importar Application layer. Use interfaces e eventos.',
        'infrastructure': 'Domain não deve importar Infrastructure layer. Use interfaces e eventos.',
        '@nestjs': 'Domain não deve importar o framework NestJS.',
        'typeorm': 'Domain não deve importar ORM como TypeORM.',
        'mongoose': 'Domain não deve importar ODM como Mongoose.',
        'reflect-metadata': 'Domain não deve usar reflect-metadata diretamente.'
      },
      application: {
        'express': 'Application não deve importar Express diretamente. Use controllers ou DTOs.',
        'drizzle-orm': 'Application não deve importar ORM diretamente. Use interfaces de repositório do Domain.',
        'pg': 'Application não deve importar driver de banco de dados diretamente.',
        'infrastructure': 'Application não deve importar Infrastructure layer diretamente. Use interfaces de repositório.',
        '@nestjs': 'Application não deve importar o framework NestJS diretamente.',
        'typeorm': 'Application não deve importar ORM como TypeORM.',
        'mongoose': 'Application não deve importar ODM como Mongoose.',
        'reflect-metadata': 'Application pode usar reflect-metadata para DI, mas evite acoplamento direto se possível.'
      },
      infrastructure: {
        'presentation': 'Infrastructure não deve importar Presentation layer. A comunicação é via Application.',
        '@nestjs': 'Infrastructure pode usar NestJS para configuração, mas evite lógica de negócio.',
        'express': 'Infrastructure pode usar Express para configurações de infra, mas não para lógica de app.'
      },
      presentation: {
        'domain': 'Presentation não deve importar Domain layer diretamente. Use Application layer.',
        'infrastructure': 'Presentation não deve importar Infrastructure layer diretamente. Use Application layer.',
        'express': 'Presentation usa Express para rotas e controllers.',
        '@nestjs': 'Presentation usa NestJS para rotas e controllers.',
        'drizzle-orm': 'Presentation não deve acessar o ORM.',
        'pg': 'Presentation não deve acessar o driver de banco de dados.'
      }
    };

    const layerSuggestions = suggestions[layer as keyof typeof suggestions];
    if (layerSuggestions) {
      for (const [pattern, suggestion] of Object.entries(layerSuggestions)) {
        // Verifica se o importPath começa com o padrão ou é igual ao padrão
        if (importPath.startsWith(pattern) || importPath === pattern) {
          return suggestion;
        }
      }
    }

    // Sugestão genérica para outros casos
    if (layer === 'domain') {
        return 'Domain layer só deve conter lógica de negócio pura. Evite dependências externas ou de outras camadas.';
    }
    if (layer === 'application') {
        return 'Application layer deve orquestrar o fluxo de negócio, dependendo apenas do Domain layer.';
    }
    if (layer === 'infrastructure') {
        return 'Infrastructure layer implementa detalhes técnicos (banco, API externa), dependendo do Domain e Application (interfaces).';
    }
     if (layer === 'presentation') {
        return 'Presentation layer lida com a interface do usuário/API, dependendo da Application layer.';
    }

    return 'Revisar se esta dependência está alinhada com os princípios de Clean Architecture.';
  }

  private async validateSeparationOfConcerns(): Promise<void> {
    console.log('🎯 VALIDANDO SEPARAÇÃO DE RESPONSABILIDADES...\n');

    if (this.modulesPaths.length === 0) {
      console.log('   Nenhum módulo encontrado para validar separação de responsabilidades.');
      return;
    }

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split(/[\\/]/).pop()!;
      await this.validateModuleSeparationOfConcerns(modulePath, moduleName);
    }
  }

  private async validateModuleSeparationOfConcerns(modulePath: string, moduleName: string): Promise<void> {
    console.log(`🔍 Analisando responsabilidades do módulo: ${moduleName}`);

    // Validar Entities (Domain) - só regras de negócio
    await this.validateEntitiesResponsibilities(modulePath, moduleName);

    // Validar Use Cases (Application) - orquestração
    await this.validateUseCasesResponsibilities(modulePath, moduleName);

    // Validar Repositories (Infrastructure) - persistência
    await this.validateRepositoriesResponsibilities(modulePath, moduleName);

    // Validar Controllers (Application) - recebem requests e chamam use cases
    await this.validateControllersResponsibilities(modulePath, moduleName);
  }

  private async validateEntitiesResponsibilities(modulePath: string, moduleName: string): Promise<void> {
    const entitiesPath = join(modulePath, 'domain', 'entities');
    if (!existsSync(entitiesPath)) return;

    const files = this.getAllTSFiles(entitiesPath);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');

        // Verificar se entity tem lógica de infraestrutura (SQL, ORM, etc.)
        if (/(?:drizzle|typeorm|mongoose|knex|db\.|query|SELECT|INSERT|UPDATE|DELETE)/i.test(content)) {
          this.addIssue({
            id: `SOC-${moduleName.toUpperCase()}-ENTITY-INFRA`,
            layer: 'domain',
            module: moduleName,
            severity: 'critical',
            type: 'coupling_issue',
            description: `Entity contém lógica de infraestrutura (acesso a dados, ORM) - violação de responsabilidade`,
            file: file,
            suggestedFix: 'Mover lógica de infraestrutura para Repository na camada Infrastructure'
          });
        }

        // Verificar se entity tem lógica de apresentação (DTOs, Response/Request)
        if (/(?:Response|Request|DTO|Controller|View)/i.test(content)) {
          this.addIssue({
            id: `SOC-${moduleName.toUpperCase()}-ENTITY-PRESENTATION`,
            layer: 'domain',
            module: moduleName,
            severity: 'high',
            type: 'coupling_issue',
            description: 'Entity misturada com conceitos de Presentation layer (DTOs, Request/Response) - violação de responsabilidade',
            file: file,
            suggestedFix: 'Separar Entity de DTOs/Requests/Responses, movendo-os para Application layer (ou Presentation)'
          });
        }
      } catch (error) {
        console.error(`Erro ao validar responsabilidades da entity ${file}:`, error);
      }
    }
  }

  private async validateUseCasesResponsibilities(modulePath: string, moduleName: string): Promise<void> {
    const useCasesPath = join(modulePath, 'application', 'use-cases');
    const useCasesAltPath = join(modulePath, 'application', 'usecases'); // Alternativa comum

    const files = this.getAllTSFiles(useCasesPath).concat(
      existsSync(useCasesAltPath) ? this.getAllTSFiles(useCasesAltPath) : []
    );

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');

        // Verificar se use case tem lógica direta de banco de dados (sem usar interface de repositório)
        if (/(?:drizzle|typeorm|mongoose|knex|db\.)/i.test(content) && !/this\.(?:repo|repository|service)\./i.test(content)) {
          this.addIssue({
            id: `SOC-${moduleName.toUpperCase()}-USECASE-INFRA`,
            layer: 'application',
            module: moduleName,
            severity: 'high',
            type: 'coupling_issue',
            description: 'Use Case acoplado a implementação de infraestrutura (acesso direto a DB/ORM)',
            file: file,
            suggestedFix: 'Usar interfaces de Repository (definidas no Domain) e injetar implementações na Application layer'
          });
        }

        // Verificar se use case tem lógica de presentation (express, request/response)
        if (/(?:req|res|express|next|Controller)/i.test(content)) {
          this.addIssue({
            id: `SOC-${moduleName.toUpperCase()}-USECASE-PRESENTATION`,
            layer: 'application',
            module: moduleName,
            severity: 'high',
            type: 'coupling_issue',
            description: 'Use Case contém lógica de Presentation layer (acesso a request/response, express)',
            file: file,
            suggestedFix: 'Mover lógica de Presentation para Controllers na camada Application'
          });
        }
      } catch (error) {
        console.error(`Erro ao validar responsabilidades do use case ${file}:`, error);
      }
    }
  }

  private async validateRepositoriesResponsibilities(modulePath: string, moduleName: string): Promise<void> {
    const repoPath = join(modulePath, 'infrastructure', 'repositories');
    if (!existsSync(repoPath)) return;

    const files = this.getAllTSFiles(repoPath);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');

        // Verificar se repository tem regras de negócio complexas (não apenas mapeamento de dados)
        const businessLogicIndicators = [
          'validate', 'calculate', 'process', 'transform', 'filter', 'sort',
          'if.*business', 'rule', 'logic', 'permission', 'authorization', 'validation'
        ];

        for (const indicator of businessLogicIndicators) {
          const regex = new RegExp(`\\b${indicator}\\b`, 'i'); // \b para word boundary
          if (regex.test(content)) {
            this.addIssue({
              id: `SOC-${moduleName.toUpperCase()}-REPO-BUSINESS`,
              layer: 'infrastructure',
              module: moduleName,
              severity: 'medium',
              type: 'coupling_issue',
              description: 'Repository contém possível lógica de negócio ou validação complexa',
              file: file,
              suggestedFix: 'Mover lógica de negócio para Domain layer (Entity ou Service). Repository deve focar em persistência e mapeamento.'
            });
            break; // Para evitar múltiplos avisos para o mesmo arquivo
          }
        }
      } catch (error) {
        console.error(`Erro ao validar responsabilidades do repository ${file}:`, error);
      }
    }
  }

  private async validateControllersResponsibilities(modulePath: string, moduleName: string): Promise<void> {
    const controllersPath = join(modulePath, 'application', 'controllers');
    if (!existsSync(controllersPath)) return;

    const files = this.getAllTSFiles(controllersPath);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');

        // Verificar se controllers contêm lógica de negócio ou acesso direto a dados
        if (/(?:domain|entity|repository|service)\.(?:create|find|update|delete)/i.test(content) ||
            /(?:drizzle|typeorm|mongoose|knex|db\.)/i.test(content)) {
          this.addIssue({
            id: `SOC-${moduleName.toUpperCase()}-CONTROLLER-BUSINESS`,
            layer: 'application', // Controllers estão na Application Layer
            module: moduleName,
            severity: 'high',
            type: 'coupling_issue',
            description: 'Controller contém lógica de negócio ou acesso direto a dados',
            file: file,
            suggestedFix: 'Controllers devem apenas receber requisições, validar DTOs, chamar Use Cases e retornar respostas.'
          });
        }
      } catch (error) {
        console.error(`Erro ao validar responsabilidades do controller ${file}:`, error);
      }
    }
  }


  private async validateNamingPatterns(): Promise<void> {
    console.log('📝 VALIDANDO PADRÕES DE NOMENCLATURA...\n');

    if (this.modulesPaths.length === 0) {
      console.log('   Nenhum módulo encontrado para validar nomenclatura.');
      return;
    }

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split(/[\\/]/).pop()!;
      await this.validateModuleNamingPatterns(modulePath, moduleName);
    }
  }

  private async validateModuleNamingPatterns(modulePath: string, moduleName: string): Promise<void> {
    console.log(`🔍 Analisando nomenclatura do módulo: ${moduleName}`);

    // Validar nomenclatura de entities
    await this.validateEntityNaming(modulePath, moduleName);

    // Validar nomenclatura de use cases
    await this.validateUseCaseNaming(modulePath, moduleName);

    // Validar nomenclatura de repositories
    await this.validateRepositoryNaming(modulePath, moduleName);
    
    // Validar nomenclatura de services (Domain e Application)
    await this.validateServiceNaming(modulePath, moduleName);
  }

  private async validateEntityNaming(modulePath: string, moduleName: string): Promise<void> {
    const entitiesPath = join(modulePath, 'domain', 'entities');
    if (!existsSync(entitiesPath)) return;

    const files = this.getAllTSFiles(entitiesPath);

    for (const file of files) {
      const fileName = file.split(/[\\/]/).pop()!.replace('.ts', '');

      // Entity deve ter nome singular e PascalCase
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(fileName)) {
        this.addIssue({
          id: `NAMING-${moduleName.toUpperCase()}-ENTITY-${fileName}-CASE`,
          layer: 'domain',
          module: moduleName,
          severity: 'low',
          type: 'naming_inconsistency',
          description: `Entity '${fileName}' não segue o padrão PascalCase (ex: Customer, OrderItem)`,
          file: file,
          suggestedFix: 'Renomear arquivo e classe para usar PascalCase singular (ex: Customer, OrderItem)'
        });
      }

      // Verificar se class name corresponde ao filename (ignora extensões e diretórios)
      const content = readFileSync(file, 'utf-8');
      const classMatch = content.match(/export\s+(?:abstract\s+)?class\s+(\w+)/);
      if (classMatch && classMatch[1] !== fileName) {
        this.addIssue({
          id: `NAMING-${moduleName.toUpperCase()}-ENTITY-${fileName}-MISMATCH`,
          layer: 'domain',
          module: moduleName,
          severity: 'low',
          type: 'naming_inconsistency',
          description: `Nome da classe '${classMatch[1]}' não corresponde ao nome do arquivo '${fileName}'`,
          file: file,
          suggestedFix: 'Alinhar o nome da classe exportada com o nome do arquivo'
        });
      }
    }
  }

  private async validateUseCaseNaming(modulePath: string, moduleName: string): Promise<void> {
    const useCasePaths = [
      join(modulePath, 'application', 'use-cases'),
      join(modulePath, 'application', 'usecases') // Alternativa comum
    ];

    for (const ucPath of useCasePaths) {
      if (!existsSync(ucPath)) continue;

      const files = this.getAllTSFiles(ucPath);

      for (const file of files) {
        const fileName = file.split(/[\\/]/).pop()!.replace('.ts', '');

        // Use Case deve terminar com "UseCase" e seguir PascalCase
        if (!/^[A-Z][a-zA-Z0-9]*UseCase$/.test(fileName)) {
          this.addIssue({
            id: `NAMING-${moduleName.toUpperCase()}-USECASE-${fileName}-FORMAT`,
            layer: 'application',
            module: moduleName,
            severity: 'medium',
            type: 'naming_inconsistency',
            description: `Use Case '${fileName}' não segue o padrão '[Action]UseCase' (ex: CreateCustomerUseCase)`,
            file: file,
            suggestedFix: 'Renomear para seguir o padrão [Verbo]UseCase'
          });
        }
      }
    }
  }

  private async validateRepositoryNaming(modulePath: string, moduleName: string): Promise<void> {
    const repoPath = join(modulePath, 'infrastructure', 'repositories');
    if (!existsSync(repoPath)) return;

    const files = this.getAllTSFiles(repoPath);

    for (const file of files) {
      const fileName = file.split(/[\\/]/).pop()!.replace('.ts', '');

      // Repository deve terminar com "Repository" e seguir PascalCase
      if (!/^[A-Z][a-zA-Z0-9]*Repository$/.test(fileName)) {
        this.addIssue({
          id: `NAMING-${moduleName.toUpperCase()}-REPO-${fileName}-FORMAT`,
          layer: 'infrastructure',
          module: moduleName,
          severity: 'medium',
          type: 'naming_inconsistency',
          description: `Repository '${fileName}' não segue o padrão '[Entity]Repository' (ex: CustomerRepository)`,
          file: file,
          suggestedFix: 'Renomear para seguir o padrão [NomeDaEntidade]Repository'
        });
      }

      // Verificar se implementa uma interface (comum e boa prática)
      const content = readFileSync(file, 'utf-8');
      // Procura por `implements IEntityRepository` ou `implements EntityRepositoryInterface`
      if (!/(?:implements\s+I[A-Z]\w*Repository)|(?:implements\s+\w*RepositoryInterface)/.test(content)) {
        this.addIssue({
          id: `IMPL-${moduleName.toUpperCase()}-REPO-${fileName}-INTERFACE`,
          layer: 'infrastructure',
          module: moduleName,
          severity: 'low', // Boa prática, mas não estritamente obrigatório se não houver interface definida
          type: 'structure_violation',
          description: `Repository '${fileName}' idealmente deveria implementar uma interface de repositório`,
          file: file,
          suggestedFix: 'Criar uma interface de repositório no Domain layer (ex: IDomainRepository) e implementar aqui.'
        });
      }
    }
  }
  
  private async validateServiceNaming(modulePath: string, moduleName: string): Promise<void> {
    const servicePaths = [
      join(modulePath, 'domain', 'services'),
      join(modulePath, 'application', 'services')
    ];

    for (const servicePath of servicePaths) {
      if (!existsSync(servicePath)) continue;

      const files = this.getAllTSFiles(servicePath);

      for (const file of files) {
        const fileName = file.split(/[\\/]/).pop()!.replace('.ts', '');
        const layer = servicePath.includes('domain') ? 'domain' : 'application';

        // Service deve seguir PascalCase e pode ou não terminar com "Service"
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(fileName)) {
          this.addIssue({
            id: `NAMING-${moduleName.toUpperCase()}-SERVICE-${fileName}-CASE`,
            layer: layer as any,
            module: moduleName,
            severity: 'low',
            type: 'naming_inconsistency',
            description: `Service '${fileName}' não segue o padrão PascalCase`,
            file: file,
            suggestedFix: 'Renomear para seguir o padrão PascalCase (ex: AuthService, NotificationService)'
          });
        }
        
        // Se terminar com "Service", verificar se não há conflito com Domain Services
        if (fileName.endsWith('Service')) {
           if (layer === 'domain') {
               this.addIssue({
                 id: `NAMING-${moduleName.toUpperCase()}-DOMAINSERVICE-${fileName}-SUFFIX`,
                 layer: 'domain',
                 module: moduleName,
                 severity: 'low',
                 type: 'naming_inconsistency',
                 description: `Domain Service '${fileName}' não precisa necessariamente terminar com 'Service'`,
                 file: file,
                 suggestedFix: 'Considerar remover o sufixo "Service" se for um Domain Service puro (ex: UserDomainService -> User)'
               });
           }
        }
      }
    }
  }


  private async validateImplementationCompleteness(): Promise<void> {
    console.log('🔧 VALIDANDO COMPLETUDE DA IMPLEMENTAÇÃO...\n');

    if (this.modulesPaths.length === 0) {
      console.log('   Nenhum módulo encontrado para validar completude.');
      return;
    }

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split(/[\\/]/).pop()!;
      await this.validateModuleCompleteness(moduleName, modulePath);
    }
  }

  private async validateModuleCompleteness(moduleName: string, modulePath: string): Promise<void> {
    console.log(`🔍 Analisando completude do módulo: ${moduleName}`);

    // Verificar se há entities sem repositories correspondentes
    await this.validateEntityRepositoryPairs(modulePath, moduleName);

    // Verificar se há use cases sem controllers (ou rotas correspondentes)
    await this.validateUseCaseControllerPairs(modulePath, moduleName);

    // Verificar se há repositories sem interfaces definidas no Domain
    await this.validateRepositoryInterfacePairs(modulePath, moduleName);
    
    // Verificar se há services (Domain/Application) sem uso aparente ou com lógica duplicada
    await this.validateServiceUsage(modulePath, moduleName);
  }

  private async validateEntityRepositoryPairs(modulePath: string, moduleName: string): Promise<void> {
    const entitiesPath = join(modulePath, 'domain', 'entities');
    const repoPath = join(modulePath, 'infrastructure', 'repositories');

    if (!existsSync(entitiesPath)) return; // Não há entities para validar

    const entityFiles = this.getAllTSFiles(entitiesPath);
    const entities = entityFiles.map(f => f.split(/[\\/]/).pop()!.replace('.ts', ''));

    for (const entity of entities) {
      // Tenta encontrar um repository com nome como: EntityRepository, IEntityRepository, DrizzleEntityRepository
      const expectedRepoName = `${entity}Repository`;
      const expectedRepoInterfaceName = `I${entity}Repository`;
      const alternativeRepoName = `Drizzle${entity}Repository`; // Comum com Drizzle

      const repoExists = 
        existsSync(join(repoPath, `${expectedRepoName}.ts`)) ||
        existsSync(join(repoPath, `${expectedRepoInterfaceName}.ts`)) || // Se a interface for a única coisa, pode ser um repo implícito
        existsSync(join(repoPath, `${alternativeRepoName}.ts`));

      if (!repoExists) {
        this.addIssue({
          id: `COMP-${moduleName.toUpperCase()}-ENTITY-REPO-${entity}-MISSING`,
          layer: 'infrastructure',
          module: moduleName,
          severity: 'high',
          type: 'missing_component',
          description: `Entity '${entity}' não possui um Repository correspondente na camada Infrastructure`,
          file: repoPath, // Aponta para o diretório de repositories
          suggestedFix: `Criar um arquivo como '${expectedRepoName}.ts' ou '${alternativeRepoName}.ts' na camada Infrastructure`
        });
      }
    }
  }

  private async validateUseCaseControllerPairs(modulePath: string, moduleName: string): Promise<void> {
    const useCasePaths = [
      join(modulePath, 'application', 'use-cases'),
      join(modulePath, 'application', 'usecases')
    ];
    const controllersPath = join(modulePath, 'application', 'controllers');
    const presentationRoutesPath = join(modulePath, 'presentation', 'routes.ts');
    const rootRoutesPath = join(modulePath, 'routes.ts');

    let hasControllers = existsSync(controllersPath);
    let hasRoutes = existsSync(presentationRoutesPath) || existsSync(rootRoutesPath);

    // Verifica se existe algum use case
    let hasUseCases = false;
    for (const ucPath of useCasePaths) {
      if (existsSync(ucPath) && this.getAllTSFiles(ucPath).length > 0) {
        hasUseCases = true;
        break;
      }
    }

    if (!hasUseCases) return; // Se não há use cases, não há o que validar aqui

    // Se há use cases, mas nem controllers nem rotas existem
    if (hasUseCases && !hasControllers && !hasRoutes) {
      this.addIssue({
        id: `COMP-${moduleName.toUpperCase()}-UC-CONTROLLER-ROUTE-MISSING`,
        layer: 'application',
        module: moduleName,
        severity: 'medium',
        type: 'missing_component',
        description: `Existem Use Cases, mas a camada de Presentation (Controllers/Routes) parece ausente ou incompleta`,
        file: modulePath, // Aponta para o diretório do módulo
        suggestedFix: 'Criar Controllers na camada Application e/ou definir rotas na camada Presentation para expor os Use Cases'
      });
      return;
    }

    // Se há use cases e controllers, mas rotas não referenciam controllers
    if (hasUseCases && hasControllers && hasRoutes) {
      const routeContent = existsSync(presentationRoutesPath) ? readFileSync(presentationRoutesPath, 'utf-8') : readFileSync(rootRoutesPath, 'utf-8');
      const controllerFiles = this.getAllTSFiles(controllersPath);
      const controllerNames = controllerFiles.map(f => f.split(/[\\/]/).pop()!.replace('.ts', ''));

      // Verifica se as rotas estão usando os controllers definidos
      for (const controllerName of controllerNames) {
        if (!routeContent.includes(controllerName)) {
          this.addIssue({
            id: `COMP-${moduleName.toUpperCase()}-ROUTE-CONTROLLER-MISMATCH-${controllerName}`,
            layer: 'presentation',
            module: moduleName,
            severity: 'low',
            type: 'structure_violation',
            description: `Controller '${controllerName}' não parece ser referenciado nas rotas do módulo`,
            file: existsSync(presentationRoutesPath) ? presentationRoutesPath : rootRoutesPath,
            suggestedFix: `Garantir que as rotas do módulo utilizem os controllers definidos`
          });
        }
      }
    }
  }

  private async validateRepositoryInterfacePairs(modulePath: string, moduleName: string): Promise<void> {
    const repoPath = join(modulePath, 'infrastructure', 'repositories');
    const domainPath = join(modulePath, 'domain');
    const domainReposPath = join(domainPath, 'repositories');
    const domainPortsPath = join(domainPath, 'ports'); // Pasta comum para interfaces

    if (!existsSync(repoPath)) return;

    const repositoryFiles = this.getAllTSFiles(repoPath);
    const repositoryNames = repositoryFiles.map(f => f.split(/[\\/]/).pop()!.replace('.ts', ''));

    for (const repoName of repositoryNames) {
      // Tenta inferir o nome da interface: IEntityRepository, EntityRepositoryInterface
      let interfaceName = '';
      if (repoName.startsWith('I')) { // Já parece uma interface, ignora
        continue;
      } else if (repoName.endsWith('Repository')) {
        interfaceName = `I${repoName}`;
      } else if (repoName.startsWith('Drizzle') && repoName.endsWith('Repository')) {
        const entityName = repoName.replace('Drizzle', '');
        interfaceName = `I${entityName}Repository`;
      } else {
        // Se não segue padrão comum, pode ser um caso customizado ou um problema de nomenclatura
        // Poderia adicionar um aviso aqui, mas vamos focar nos casos mais comuns.
        continue; 
      }

      const expectedInterfaceFile1 = join(domainReposPath, `${interfaceName}.ts`);
      const expectedInterfaceFile2 = join(domainPortsPath, `${interfaceName}.ts`);

      if (!existsSync(expectedInterfaceFile1) && !existsSync(expectedInterfaceFile2)) {
        this.addIssue({
          id: `COMP-${moduleName.toUpperCase()}-REPO-INTERFACE-${repoName}-MISSING`,
          layer: 'domain',
          module: moduleName,
          severity: 'medium',
          type: 'missing_component',
          description: `Repository '${repoName}' implementa uma interface que não foi encontrada no Domain layer`,
          file: domainPath, // Aponta para o diretório domain
          suggestedFix: `Criar a interface '${interfaceName}' no Domain layer (ex: domain/repositories ou domain/ports)`
        });
      }
    }
  }
  
  private async validateServiceUsage(modulePath: string, moduleName: string): Promise<void> {
      // Valida serviços no Domain Layer
      const domainServicesPath = join(modulePath, 'domain', 'services');
      if (existsSync(domainServicesPath)) {
          const files = this.getAllTSFiles(domainServicesPath);
          for (const file of files) {
              const content = readFileSync(file, 'utf-8');
              // Verifica se o serviço está sendo usado por algum Use Case ou Controller
              // Esta validação é mais complexa e pode exigir análise estática mais profunda.
              // Por ora, faremos uma verificação simples: se o serviço tem métodos exportados
              // e não é usado em lugar nenhum (difícil de verificar sem AST).
              // Adicionamos um aviso genérico se o serviço parece "isolado".
              if (!content.includes('export class') && !content.includes('export interface') && !content.includes('export const')) {
                   this.addIssue({
                      id: `COMP-${moduleName.toUpperCase()}-DOMAIN-SERVICE-UNUSED-${file.split(/[\\/]/).pop()}`,
                      layer: 'domain',
                      module: moduleName,
                      severity: 'low',
                      type: 'missing_component',
                      description: `Domain Service '${file.split(/[\\/]/).pop()}' parece não ter métodos exportados ou estar isolado.`,
                      file: file,
                      suggestedFix: 'Verificar se o serviço é realmente necessário e se está sendo utilizado pelos Use Cases.'
                  });
              }
          }
      }

      // Valida serviços no Application Layer
      const appServicesPath = join(modulePath, 'application', 'services');
       if (existsSync(appServicesPath)) {
          const files = this.getAllTSFiles(appServicesPath);
          for (const file of files) {
               const content = readFileSync(file, 'utf-8');
               // Verifica se o serviço tem lógica de negócio que deveria estar no Domain
               const businessLogicIndicators = [
                   'validate', 'calculate', 'process', 'transform', 'filter', 'sort',
                   'if.*business', 'rule', 'logic', 'permission', 'authorization', 'validation'
               ];
               for (const indicator of businessLogicIndicators) {
                   const regex = new RegExp(`\\b${indicator}\\b`, 'i');
                   if (regex.test(content)) {
                       this.addIssue({
                           id: `COMP-${moduleName.toUpperCase()}-APP-SERVICE-BUSINESS-${file.split(/[\\/]/).pop()}`,
                           layer: 'application',
                           module: moduleName,
                           severity: 'medium',
                           type: 'coupling_issue',
                           description: `Application Service '${file.split(/[\\/]/).pop()}' contém lógica de negócio que deveria estar no Domain Layer.`,
                           file: file,
                           suggestedFix: 'Mover lógica de negócio para Domain Layer (Entity ou Service).'
                       });
                       break; 
                   }
               }
          }
       }
  }

  private async validateRoutesFile(routesPath: string, moduleName: string): Promise<void> {
    try {
      const content = readFileSync(routesPath, 'utf-8');

      // Verificar se usa controllers (ou chama Use Cases diretamente, o que é menos ideal)
      const usesControllers = /Controller\(\)|app\.use\(.*Controller\)/.test(content); // Regex simplificada
      const callsUseCasesDirectly = /\b(useCases?|services?)\.\w+\(/.test(content);

      if (!usesControllers && !callsUseCasesDirectly) {
        this.addIssue({
          id: `ROUTES-${moduleName.toUpperCase()}-NO-LOGIC`,
          layer: 'presentation',
          module: moduleName,
          severity: 'low',
          type: 'structure_violation',
          description: 'Arquivo de rotas não parece conter controllers ou chamadas a Use Cases.',
          file: routesPath,
          suggestedFix: 'Definir rotas que utilizem controllers da camada Application ou chamem Use Cases.'
        });
      } else if (!usesControllers && callsUseCasesDirectly) {
        this.addIssue({
          id: `ROUTES-${moduleName.toUpperCase()}-DIRECT-USECASE`,
          layer: 'presentation',
          module: moduleName,
          severity: 'medium',
          type: 'coupling_issue',
          description: 'Rotas chamando Use Cases diretamente na camada Presentation.',
          file: routesPath,
          suggestedFix: 'Criar Controllers na camada Application para orquestrar a chamada aos Use Cases e formatar a resposta.'
        });
      }

      // Verificar se há lógica de negócio ou acesso a dados diretamente nas rotas
      const businessLogicIndicators = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'drizzle', 'typeorm', 'mongoose', 'knex', 'db\.'];
      for (const indicator of businessLogicIndicators) {
        const regex = new RegExp(`\\b${indicator}\\b`, 'i');
        if (regex.test(content)) {
          this.addIssue({
            id: `ROUTES-${moduleName.toUpperCase()}-BUSINESS-LOGIC`,
            layer: 'presentation',
            module: moduleName,
            severity: 'high',
            type: 'coupling_issue',
            description: `Rotas contêm lógica de negócio ou acesso direto a dados`,
            file: routesPath,
            suggestedFix: 'Mover lógica de negócio/dados para Use Cases na camada Application e/ou Controllers.'
          });
          break; // Só precisa de um aviso para lógica de negócio nas rotas
        }
      }
    } catch (error) {
      console.error(`Erro ao validar o arquivo de rotas ${routesPath}:`, error);
    }
  }

  private getAllTSFiles(dir: string): string[] {
    const files: string[] = [];

    if (!existsSync(dir)) return files;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Ignorar diretórios de node_modules e similares
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
          files.push(...this.getAllTSFiles(fullPath));
        } else if (entry.isFile() && extname(entry.name) === '.ts') {
          files.push(fullPath);
        }
      }
    } catch (error) {
        console.error(`Erro ao listar arquivos em ${dir}:`, error);
    }

    return files;
  }

  private addIssue(issue: ArchitectureIssue): void {
    // Verifica se um issue similar já existe para evitar duplicidade excessiva
    const isDuplicate = this.issues.some(existingIssue => 
        existingIssue.id === issue.id &&
        existingIssue.file === issue.file &&
        existingIssue.line === issue.line &&
        existingIssue.description === issue.description
    );
    if (!isDuplicate) {
        this.issues.push(issue);
    }
  }

  private generateResult(): ValidationResult {
    const critical = this.issues.filter(i => i.severity === 'critical').length;
    const high = this.issues.filter(i => i.severity === 'high').length;
    const medium = this.issues.filter(i => i.severity === 'medium').length;
    const low = this.issues.filter(i => i.severity === 'low').length;

    // Score: Penaliza mais severidades maiores. Assume um peso máximo de 100 para cada categoria de problema.
    const totalIssues = this.issues.length;
    let score = 100;
    
    // Penalidades baseadas na severidade
    const severityPenalties = {
        critical: 10,
        high: 7,
        medium: 4,
        low: 2
    };

    if (totalIssues > 0) {
        let totalPenalty = 0;
        for (const issue of this.issues) {
            totalPenalty += severityPenalties[issue.severity];
        }
        // Calcula o score como 100 - (penalidade total / número máximo de penalidades possíveis * 100)
        // O número máximo de penalidades seria se todos os issues fossem críticos.
        // Vamos simplificar: calcular a porcentagem de issues em relação a um total ponderado.
        
        const maxPossibleScore = 100; // Score máximo base
        const penaltyPerIssue = maxPossibleScore / (totalIssues + 1); // Divide o score pelo número de issues + 1 para evitar divisão por zero e ter um divisor base

        score = Math.max(0, Math.round(maxPossibleScore - (totalPenalty * penaltyPerIssue)));
    }


    return {
      // Passa se não houver problemas críticos ou altos, e poucos médios/baixos.
      // Ajustar esta lógica conforme a tolerância desejada.
      passed: critical === 0 && high === 0 && medium <= 2 && low <= 5, 
      score: Math.max(0, Math.min(100, score)), // Garante que o score fique entre 0 e 100
      issues: this.issues,
      summary: {
        total: totalIssues,
        critical,
        high,
        medium,
        low
      }
    };
  }

  generateDetailedReport(result: ValidationResult): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DETALHADO - VALIDAÇÃO CLEAN ARCHITECTURE');
    console.log('='.repeat(80));

    // Status Geral
    const statusEmoji = result.passed ? '✅' : '❌';
    console.log(`\n${statusEmoji} STATUS GERAL: ${result.passed ? 'APROVADO' : 'REPROVADO'}`);
    console.log(`🎯 SCORE DE ARQUITETURA: ${result.score}/100`);

    // Resumo de Problemas
    console.log(`\n📋 RESUMO DE PROBLEMAS ENCONTRADOS:`);
    console.log(`   🔥 CRÍTICOS: ${result.summary.critical}`);
    console.log(`   ⚠️  ALTOS: ${result.summary.high}`);
    console.log(`   📋 MÉDIOS: ${result.summary.medium}`);
    console.log(`   💡 BAIXOS: ${result.summary.low}`);
    console.log(`   ---`);
    console.log(`   📊 TOTAL: ${result.summary.total}`);

    // Detalhes dos Problemas (se houver)
    if (result.issues.length > 0) {
      console.log(`\n--- DETALHES DOS PROBLEMAS ---`);
      this.issues.forEach(issue => {
        const severityEmoji = {
          critical: '🔥',
          high: '⚠️',
          medium: '📋',
          low: '💡'
        }[issue.severity];
        const lineNumber = issue.line ? ` (Linha ${issue.line})` : '';
        console.log(`\n[${issue.id}] ${severityEmoji} ${issue.description}`);
        console.log(`   Módulo: ${issue.module} | Camada: ${issue.layer} | Tipo: ${issue.type}`);
        console.log(`   Arquivo: ${issue.file}${lineNumber}`);
        console.log(`   Sugestão: ${issue.suggestedFix}`);
      });
    } else {
      console.log('\n🎉 Nenhum problema de arquitetura detectado!');
    }

    // Recomendações de Prioridade
    console.log(`\n--- RECOMENDAÇÕES DE PRIORIDADE ---`);
    if (result.summary.critical > 0) {
      console.log(`1. 🔥 URGENTE: Corrigir ${result.summary.critical} problemas críticos (violações de dependência no Domain, etc.).`);
    }
    if (result.summary.high > 0) {
      console.log(`2. ⚠️  ALTA: Corrigir ${result.summary.high} problemas altos (acoplamento indevido, componentes ausentes).`);
    }
    if (result.summary.medium > 0) {
      console.log(`3. 📋 MÉDIA: Corrigir ${result.summary.medium} problemas médios (nomenclatura, implementação de interfaces).`);
    }
     if (result.summary.low > 0 && result.summary.critical === 0 && result.summary.high === 0 && result.summary.medium === 0) {
      console.log(`💡 BAIXA: Refinar ${result.summary.low} aspectos de nomenclatura e boas práticas.`);
    }
     if (result.summary.total === 0) {
         console.log('   Nenhuma ação necessária no momento.');
     }

    // Score de Maturidade por Aspecto
    console.log(`\n--- MATURIDADE POR ASPECTO ---`);
    const aspects = this.calculateMaturityByAspect(result.issues);

    for (const [aspect, score] of Object.entries(aspects)) {
      const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
      console.log(`   ${aspect}: ${score}/100 [${bar}]`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ VALIDAÇÃO DE CLEAN ARCHITECTURE CONCLUÍDA');
    console.log('='.repeat(80));
  }

  private groupIssuesByModule(issues: ArchitectureIssue[]): Record<string, ArchitectureIssue[]> {
    return issues.reduce((acc, issue) => {
      // Agrupa por módulo, tratando "system" como um módulo especial
      const moduleKey = issue.module === 'system' ? 'System Configuration' : issue.module;
      if (!acc[moduleKey]) acc[moduleKey] = [];
      acc[moduleKey].push(issue);
      return acc;
    }, {} as Record<string, ArchitectureIssue[]>);
  }

  private groupIssuesByLayer(issues: ArchitectureIssue[]): Record<string, ArchitectureIssue[]> {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.layer]) acc[issue.layer] = [];
      acc[issue.layer].push(issue);
      return acc;
    }, {} as Record<string, ArchitectureIssue[]>);
  }

  private calculateMaturityByAspect(issues: ArchitectureIssue[]): Record<string, number> {
    const aspects = {
      'Estrutura de Camadas': 100,
      'Regras de Dependência': 100,
      'Separação de Responsabilidades': 100,
      'Padrões de Nomenclatura': 100,
      'Completude de Implementação': 100
    };

    // Reduz score baseado nos problemas encontrados
    for (const issue of issues) {
      // Penalidades mais altas para problemas mais graves
      const penalty = {
        critical: 20, // Problemas críticos impactam significativamente o score
        high: 15,
        medium: 10,
        low: 5      // Problemas baixos têm impacto menor
      }[issue.severity];

      switch (issue.type) {
        case 'structure_violation':
          aspects['Estrutura de Camadas'] = Math.max(0, aspects['Estrutura de Camadas'] - penalty);
          break;
        case 'dependency_violation':
          aspects['Regras de Dependência'] = Math.max(0, aspects['Regras de Dependência'] - penalty);
          break;
        case 'coupling_issue':
          aspects['Separação de Responsabilidades'] = Math.max(0, aspects['Separação de Responsabilidades'] - penalty);
          break;
        case 'naming_inconsistency':
          aspects['Padrões de Nomenclatura'] = Math.max(0, aspects['Padrões de Nomenclatura'] - penalty);
          break;
        case 'missing_component':
          aspects['Completude de Implementação'] = Math.max(0, aspects['Completude de Implementação'] - penalty);
          break;
      }
    }

    return aspects;
  }

  private saveReports(validationResult: ValidationResult): void {
    // Cria diretório 'reports' se não existir
    if (!existsSync('reports')) {
      mkdirSync('reports', { recursive: true });
    }

    // Salva resultado da validação em JSON
    writeFileSync(
      'reports/clean-architecture-validation-result.json',
      JSON.stringify(validationResult, null, 2)
    );
    console.log('\n✅ Relatório de resultados salvo em: reports/clean-architecture-validation-result.json');

    // Gera e salva o relatório em Markdown
    const markdownReport = this.generateMarkdownReport(validationResult);
    writeFileSync(
      'reports/CLEAN_ARCHITECTURE_REPORT.md', // Mantendo o nome original do arquivo solicitado pelo usuário
      markdownReport
    );
    console.log('✅ Relatório Markdown atualizado em: reports/CLEAN_ARCHITECTURE_REPORT.md');
  }

  private generateMarkdownReport(validationResult: ValidationResult): string {
    let report = `# Relatório de Validação de Clean Architecture\n\n`;
    report += `**Status Geral:** ${validationResult.passed ? '✅ Aprovado' : '❌ Reprovado'}\n`;
    report += `**Score de Arquitetura:** ${validationResult.score}/100\n\n`;

    report += `## Resumo Geral\n`;
    report += `- **Total de Problemas:** ${validationResult.summary.total}\n`;
    report += `  - Críticos: ${validationResult.summary.critical}\n`;
    report += `  - Altos: ${validationResult.summary.high}\n`;
    report += `  - Médios: ${validationResult.summary.medium}\n`;
    report += `  - Baixos: ${validationResult.summary.low}\n\n`;

    report += `## Detalhes dos Problemas por Categoria\n`;
    if (validationResult.issues.length === 0) {
      report += `Nenhum problema de arquitetura detectado!\n`;
    } else {
      // Agrupa problemas por tipo para melhor visualização no Markdown
      const issuesByType = this.issues.reduce((acc, issue) => {
        if (!acc[issue.type]) acc[issue.type] = [];
        acc[issue.type].push(issue);
        return acc;
      }, {} as Record<string, ArchitectureIssue[]>);

      for (const [type, issues] of Object.entries(issuesByType)) {
        const typeName = type.replace(/_/g, ' ').toUpperCase();
        report += `\n### ${typeName}\n`;
        issues.forEach(issue => {
          const severity = {
            critical: '🔥 Crítico',
            high: '⚠️ Alto',
            medium: '📋 Médio',
            low: '💡 Baixo'
          }[issue.severity];
          const lineNumber = issue.line ? ` (Linha ${issue.line})` : '';
          report += `\n- **${issue.id}** (${severity})\n`;
          report += `  - **Descrição:** ${issue.description}\n`;
          report += `  - **Módulo:** ${issue.module}\n`;
          report += `  - **Camada:** ${issue.layer}\n`;
          report += `  - **Arquivo:** \`${issue.file}${lineNumber}\`\n`;
          report += `  - **Sugestão:** ${issue.suggestedFix}\n`;
        });
      }
    }

    // Maturidade por Aspecto
    report += `\n## Maturidade por Aspecto da Arquitetura\n`;
    const aspects = this.calculateMaturityByAspect(validationResult.issues);
    for (const [aspect, score] of Object.entries(aspects)) {
      const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
      report += `- **${aspect}:** ${score}/100 \`${bar}\`\n`;
    }
    
    report += `\n--- Fim do Relatório ---\n`;

    return report;
  }
}

// Função para executar a validação
async function runCleanArchitectureValidation() {
  const validator = new CleanArchitectureValidator();

  try {
    const result = await validator.validateCompleteArchitecture();
    
    // Gera e salva os relatórios
    validator.saveReports(result);
    
    // Exibe o relatório detalhado no console
    validator.generateDetailedReport(result);

    // Sai com código 0 se passou, 1 se falhou
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Ocorreu um erro crítico durante a execução do validador:', error);
    process.exit(1);
  }
}

// Executa a validação se o script for chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  runCleanArchitectureValidation();
}

export { CleanArchitectureValidator, type ValidationResult, type ArchitectureIssue };
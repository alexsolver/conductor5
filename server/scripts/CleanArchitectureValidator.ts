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
import { fileURLToPath } from 'url';

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
    this.discoverModules();

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

  private discoverModules(): void {
    console.log('🔍 Descobrindo módulos do sistema...');

    // Try multiple possible paths for modules directory
    const cwd = process.cwd();
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const possiblePaths = [
      join(cwd, 'server', 'modules'),
      join(scriptDir, '..', 'modules'),
      join(process.cwd(), 'server', 'modules')
    ];
    
    let modulesPath = '';
    for (const path of possiblePaths) {
      console.log(`🔍 Checking path: ${path}`);
      if (existsSync(path)) {
        modulesPath = path;
        console.log(`✅ Found modules directory at: ${path}`);
        break;
      }
    }
    
    if (!modulesPath || !existsSync(modulesPath)) {
      console.log(`❌ Modules directory not found in any of the following paths:`);
      possiblePaths.forEach(path => console.log(`   - ${path}`));
      
      // Check if we're running from a different directory
      console.log(`🔍 Current working directory: ${cwd}`);
      console.log(`🔍 Script directory: ${scriptDir}`);
      
      this.addIssue({
        id: 'ARCH-001',
        layer: 'infrastructure',
        module: 'system',
        severity: 'critical',
        type: 'structure_violation',
        description: 'Diretório de módulos não encontrado',
        file: possiblePaths[0],
        suggestedFix: 'Verificar estrutura de diretórios e executar script do diretório raiz do projeto'
      });
      return;
    }

    const modulesDir = modulesPath;

    const modules = readdirSync(modulesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    this.modulesPaths = modules.map(module => join(modulesDir, module));
    console.log(`✅ Encontrados ${modules.length} módulos: ${modules.join(', ')}`);
    console.log(`📂 Diretório base: ${modulesDir}\n`);
  }

  private async validateLayerStructure(): Promise<void> {
    console.log('📋 VALIDANDO ESTRUTURA DE CAMADAS...\n');

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split('/').pop()!;
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
          id: `ARCH-${moduleName.toUpperCase()}-L${layer.toUpperCase()}`,
          layer: layer as any,
          module: moduleName,
          severity: 'high',
          type: 'structure_violation',
          description: `Camada ${layer} ausente no módulo ${moduleName}`,
          file: layerPath,
          suggestedFix: `Criar diretório ${layer} com estrutura apropriada`
        });
      }
    }

    // Verificar se routes.ts existe (presentation layer)
    const routesPath = join(modulePath, 'routes.ts');
    if (existsSync(routesPath)) {
      console.log(`  ✅ Presentation Layer (routes.ts): Presente`);
      await this.validateRoutesFile(routesPath, moduleName);
    } else {
      console.log(`  ⚠️  Presentation Layer (routes.ts): Ausente`);
      this.addIssue({
        id: `ARCH-${moduleName.toUpperCase()}-ROUTES`,
        layer: 'presentation',
        module: moduleName,
        severity: 'medium',
        type: 'missing_component',
        description: `Arquivo routes.ts ausente no módulo ${moduleName}`,
        file: routesPath,
        suggestedFix: 'Criar arquivo routes.ts para definir endpoints da API'
      });
    }

    console.log('');
  }

  private async validateLayerInternalStructure(layerPath: string, layer: string, moduleName: string): Promise<void> {
    const expectedStructures = {
      domain: ['entities', 'repositories', 'events', 'services'],
      application: ['use-cases', 'controllers', 'dto', 'services'],
      infrastructure: ['repositories']
    };

    const expected = expectedStructures[layer as keyof typeof expectedStructures] || [];

    for (const structure of expected) {
      const structurePath = join(layerPath, structure);
      if (!existsSync(structurePath)) {
        this.addIssue({
          id: `ARCH-${moduleName.toUpperCase()}-${layer.toUpperCase()}-${structure.toUpperCase()}`,
          layer: layer as any,
          module: moduleName,
          severity: 'medium',
          type: 'structure_violation',
          description: `Estrutura ${structure} ausente na camada ${layer}`,
          file: structurePath,
          suggestedFix: `Criar diretório/arquivo ${structure} na camada ${layer}`
        });
      }
    }
  }

  private async validateDependencyRules(): Promise<void> {
    console.log('🔗 VALIDANDO REGRAS DE DEPENDÊNCIA...\n');

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split('/').pop()!;
      await this.validateModuleDependencyRules(modulePath, moduleName);
    }
  }

  private async validateModuleDependencyRules(modulePath: string, moduleName: string): Promise<void> {
    console.log(`🔍 Analisando dependências do módulo: ${moduleName}`);

    // Validar Domain Layer - não deve depender de camadas externas
    await this.validateDomainLayerDependencies(modulePath, moduleName);

    // Validar Application Layer - só pode depender de Domain
    await this.validateApplicationLayerDependencies(modulePath, moduleName);

    // Validar Infrastructure Layer - pode depender de Domain e Application
    await this.validateInfrastructureLayerDependencies(modulePath, moduleName);
  }

  private async validateDomainLayerDependencies(modulePath: string, moduleName: string): Promise<void> {
    const domainPath = join(modulePath, 'domain');
    if (!existsSync(domainPath)) return;

    const files = this.getAllTSFiles(domainPath);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const violations = this.findDependencyViolations(content, 'domain');

      for (const violation of violations) {
        this.addIssue({
          id: `DEP-${moduleName.toUpperCase()}-DOMAIN-${Date.now()}`,
          layer: 'domain',
          module: moduleName,
          severity: 'critical',
          type: 'dependency_violation',
          description: `Domain Layer violando dependência: ${violation.import}`,
          file: file,
          line: violation.line,
          suggestedFix: violation.suggestion
        });
      }
    }
  }

  private async validateApplicationLayerDependencies(modulePath: string, moduleName: string): Promise<void> {
    const appPath = join(modulePath, 'application');
    if (!existsSync(appPath)) return;

    const files = this.getAllTSFiles(appPath);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const violations = this.findDependencyViolations(content, 'application');

      for (const violation of violations) {
        this.addIssue({
          id: `DEP-${moduleName.toUpperCase()}-APP-${Date.now()}`,
          layer: 'application',
          module: moduleName,
          severity: 'high',
          type: 'dependency_violation',
          description: `Application Layer violando dependência: ${violation.import}`,
          file: file,
          line: violation.line,
          suggestedFix: violation.suggestion
        });
      }
    }
  }

  private async validateInfrastructureLayerDependencies(modulePath: string, moduleName: string): Promise<void> {
    const infraPath = join(modulePath, 'infrastructure');
    if (!existsSync(infraPath)) return;

    const files = this.getAllTSFiles(infraPath);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const violations = this.findDependencyViolations(content, 'infrastructure');

      for (const violation of violations) {
        this.addIssue({
          id: `DEP-${moduleName.toUpperCase()}-INFRA-${Date.now()}`,
          layer: 'infrastructure',
          module: moduleName,
          severity: 'medium',
          type: 'dependency_violation',
          description: `Infrastructure Layer com dependência questionável: ${violation.import}`,
          file: file,
          line: violation.line,
          suggestedFix: violation.suggestion
        });
      }
    }
  }

  private findDependencyViolations(content: string, currentLayer: string): Array<{import: string, line: number, suggestion: string}> {
    const violations: Array<{import: string, line: number, suggestion: string}> = [];
    const lines = content.split('\n');

    const forbiddenImports = {
      domain: [
        'express', 'drizzle-orm', 'pg', 'bcrypt', 'jsonwebtoken',
        '../application', '../infrastructure', 'application/', 'infrastructure/'
      ],
      application: [
        'express', 'drizzle-orm', 'pg', 'bcrypt',
        '../infrastructure', 'infrastructure/'
      ],
      infrastructure: [
        // Infrastructure pode importar de qualquer lugar, mas validamos práticas ruins
      ]
    };

    const forbidden = forbiddenImports[currentLayer as keyof typeof forbiddenImports] || [];

    lines.forEach((line, index) => {
      const importMatch = line.match(/import.*from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];

        for (const forbiddenPattern of forbidden) {
          if (importPath.includes(forbiddenPattern)) {
            violations.push({
              import: importPath,
              line: index + 1,
              suggestion: this.getSuggestionForViolation(currentLayer, importPath)
            });
          }
        }
      }
    });

    return violations;
  }

  private getSuggestionForViolation(layer: string, importPath: string): string {
    const suggestions = {
      domain: {
        'express': 'Domain não deve importar framework web. Use interfaces/ports.',
        'drizzle-orm': 'Domain não deve importar ORM. Defina interface de repositório.',
        'bcrypt': 'Domain não deve importar biblioteca de hash. Use interface de serviço.',
        'application': 'Domain não deve importar Application. Inverta a dependência.',
        'infrastructure': 'Domain não deve importar Infrastructure. Use dependency injection.'
      },
      application: {
        'express': 'Application não deve importar framework diretamente. Use controllers.',
        'drizzle-orm': 'Application não deve importar ORM. Use interfaces de repositório.',
        'infrastructure': 'Application não deve importar Infrastructure. Use dependency injection.'
      }
    };

    const layerSuggestions = suggestions[layer as keyof typeof suggestions];
    if (layerSuggestions) {
      for (const [pattern, suggestion] of Object.entries(layerSuggestions)) {
        if (importPath.includes(pattern)) {
          return suggestion;
        }
      }
    }

    return 'Revisar se esta dependência está alinhada com Clean Architecture.';
  }

  private async validateSeparationOfConcerns(): Promise<void> {
    console.log('🎯 VALIDANDO SEPARAÇÃO DE RESPONSABILIDADES...\n');

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split('/').pop()!;
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
  }

  private async validateEntitiesResponsibilities(modulePath: string, moduleName: string): Promise<void> {
    const entitiesPath = join(modulePath, 'domain', 'entities');
    if (!existsSync(entitiesPath)) return;

    const files = this.getAllTSFiles(entitiesPath);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');

      // Verificar se entity tem lógica de infraestrutura
      if (content.includes('SELECT') || content.includes('INSERT') || content.includes('UPDATE')) {
        this.addIssue({
          id: `SOC-${moduleName.toUpperCase()}-ENTITY-SQL`,
          layer: 'domain',
          module: moduleName,
          severity: 'critical',
          type: 'coupling_issue',
          description: 'Entity contém lógica SQL - violação de responsabilidade',
          file: file,
          suggestedFix: 'Mover lógica SQL para Repository na camada Infrastructure'
        });
      }

      // Verificar se entity tem lógica de apresentação
      if (content.includes('Response') || content.includes('Request') || content.includes('DTO')) {
        this.addIssue({
          id: `SOC-${moduleName.toUpperCase()}-ENTITY-DTO`,
          layer: 'domain',
          module: moduleName,
          severity: 'high',
          type: 'coupling_issue',
          description: 'Entity misturada com DTOs - violação de responsabilidade',
          file: file,
          suggestedFix: 'Separar Entity de DTOs, mover DTOs para Application layer'
        });
      }
    }
  }

  private async validateUseCasesResponsibilities(modulePath: string, moduleName: string): Promise<void> {
    const useCasesPath = join(modulePath, 'application', 'use-cases');
    if (!existsSync(useCasesPath)) {
      const useCasesAltPath = join(modulePath, 'application', 'usecases');
      if (!existsSync(useCasesAltPath)) return;
    }

    const files = this.getAllTSFiles(useCasesPath).concat(
      existsSync(join(modulePath, 'application', 'usecases')) ? 
      this.getAllTSFiles(join(modulePath, 'application', 'usecases')) : []
    );

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');

      // Verificar se use case tem lógica de banco
      if (content.includes('drizzle') || content.includes('SELECT') || content.includes('db.')) {
        this.addIssue({
          id: `SOC-${moduleName.toUpperCase()}-USECASE-DB`,
          layer: 'application',
          module: moduleName,
          severity: 'high',
          type: 'coupling_issue',
          description: 'Use Case acoplado a implementação de banco',
          file: file,
          suggestedFix: 'Usar interface de Repository para acessar dados'
        });
      }
    }
  }

  private async validateRepositoriesResponsibilities(modulePath: string, moduleName: string): Promise<void> {
    const repoPath = join(modulePath, 'infrastructure', 'repositories');
    if (!existsSync(repoPath)) return;

    const files = this.getAllTSFiles(repoPath);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');

      // Verificar se repository tem regras de negócio
      const businessLogicIndicators = [
        'validate', 'calculate', 'process', 'transform',
        'if.*business', 'rule', 'logic'
      ];

      for (const indicator of businessLogicIndicators) {
        const regex = new RegExp(indicator, 'i');
        if (regex.test(content)) {
          this.addIssue({
            id: `SOC-${moduleName.toUpperCase()}-REPO-BUSINESS`,
            layer: 'infrastructure',
            module: moduleName,
            severity: 'medium',
            type: 'coupling_issue',
            description: 'Repository contém possível lógica de negócio',
            file: file,
            suggestedFix: 'Mover lógica de negócio para Domain layer (Entity ou Service)'
          });
          break;
        }
      }
    }
  }

  private async validateNamingPatterns(): Promise<void> {
    console.log('📝 VALIDANDO PADRÕES DE NOMENCLATURA...\n');

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split('/').pop()!;
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
  }

  private async validateEntityNaming(modulePath: string, moduleName: string): Promise<void> {
    const entitiesPath = join(modulePath, 'domain', 'entities');
    if (!existsSync(entitiesPath)) return;

    const files = this.getAllTSFiles(entitiesPath);

    for (const file of files) {
      const fileName = file.split('/').pop()!.replace('.ts', '');

      // Entity deve terminar com nome singular e PascalCase
      if (!fileName.match(/^[A-Z][a-zA-Z]*$/)) {
        this.addIssue({
          id: `NAMING-${moduleName.toUpperCase()}-ENTITY-${fileName}`,
          layer: 'domain',
          module: moduleName,
          severity: 'low',
          type: 'naming_inconsistency',
          description: `Entity ${fileName} não segue padrão PascalCase`,
          file: file,
          suggestedFix: 'Renomear para PascalCase (ex: CustomerEntity -> Customer)'
        });
      }

      // Verificar se class name corresponde ao filename
      const content = readFileSync(file, 'utf-8');
      const classMatch = content.match(/export class (\w+)/);
      if (classMatch && classMatch[1] !== fileName) {
        this.addIssue({
          id: `NAMING-${moduleName.toUpperCase()}-ENTITY-CLASS-${fileName}`,
          layer: 'domain',
          module: moduleName,
          severity: 'low',
          type: 'naming_inconsistency',
          description: `Nome da classe ${classMatch[1]} não corresponde ao arquivo ${fileName}`,
          file: file,
          suggestedFix: 'Alinhar nome da classe com nome do arquivo'
        });
      }
    }
  }

  private async validateUseCaseNaming(modulePath: string, moduleName: string): Promise<void> {
    const useCasePaths = [
      join(modulePath, 'application', 'use-cases'),
      join(modulePath, 'application', 'usecases')
    ];

    for (const useCasesPath of useCasePaths) {
      if (!existsSync(useCasesPath)) continue;

      const files = this.getAllTSFiles(useCasesPath);

      for (const file of files) {
        const fileName = file.split('/').pop()!.replace('.ts', '');

        // Use Case deve terminar com "UseCase"
        if (!fileName.endsWith('UseCase')) {
          this.addIssue({
            id: `NAMING-${moduleName.toUpperCase()}-USECASE-${fileName}`,
            layer: 'application',
            module: moduleName,
            severity: 'medium',
            type: 'naming_inconsistency',
            description: `Use Case ${fileName} deve terminar com 'UseCase'`,
            file: file,
            suggestedFix: 'Renomear para [Action]UseCase (ex: CreateCustomerUseCase)'
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
      const fileName = file.split('/').pop()!.replace('.ts', '');

      // Repository deve terminar com "Repository"
      if (!fileName.endsWith('Repository')) {
        this.addIssue({
          id: `NAMING-${moduleName.toUpperCase()}-REPO-${fileName}`,
          layer: 'infrastructure',
          module: moduleName,
          severity: 'medium',
          type: 'naming_inconsistency',
          description: `Repository ${fileName} deve terminar com 'Repository'`,
          file: file,
          suggestedFix: 'Renomear para [Entity]Repository (ex: CustomerRepository)'
        });
      }

      // Verificar se implementa interface
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('implements I') && !content.includes('implements Iface')) {
        this.addIssue({
          id: `IMPL-${moduleName.toUpperCase()}-REPO-${fileName}`,
          layer: 'infrastructure',
          module: moduleName,
          severity: 'medium',
          type: 'structure_violation',
          description: `Repository ${fileName} deve implementar interface`,
          file: file,
          suggestedFix: 'Criar interface I[Entity]Repository no domain e implementar'
        });
      }
    }
  }

  private async validateImplementationCompleteness(): Promise<void> {
    console.log('🔧 VALIDANDO COMPLETUDE DA IMPLEMENTAÇÃO...\n');

    for (const modulePath of this.modulesPaths) {
      const moduleName = modulePath.split('/').pop()!;
      await this.validateModuleCompleteness(modulePath, moduleName);
    }
  }

  private async validateModuleCompleteness(modulePath: string, moduleName: string): Promise<void> {
    console.log(`🔍 Analisando completude do módulo: ${moduleName}`);

    // Verificar se há entities sem repositories
    await this.validateEntityRepositoryPairs(modulePath, moduleName);

    // Verificar se há use cases sem controllers
    await this.validateUseCaseControllerPairs(modulePath, moduleName);

    // Verificar se há repositories sem interfaces
    await this.validateRepositoryInterfacePairs(modulePath, moduleName);
  }

  private async validateEntityRepositoryPairs(modulePath: string, moduleName: string): Promise<void> {
    const entitiesPath = join(modulePath, 'domain', 'entities');
    const repoPath = join(modulePath, 'infrastructure', 'repositories');

    if (!existsSync(entitiesPath)) return;

    const entities = this.getAllTSFiles(entitiesPath).map(f => 
      f.split('/').pop()!.replace('.ts', '')
    );

    for (const entity of entities) {
      const expectedRepoFile = join(repoPath, `${entity}Repository.ts`);
      const altRepoFile = join(repoPath, `Drizzle${entity}Repository.ts`);

      if (!existsSync(expectedRepoFile) && !existsSync(altRepoFile)) {
        this.addIssue({
          id: `COMP-${moduleName.toUpperCase()}-ENTITY-REPO-${entity}`,
          layer: 'infrastructure',
          module: moduleName,
          severity: 'high',
          type: 'missing_component',
          description: `Entity ${entity} não possui Repository correspondente`,
          file: expectedRepoFile,
          suggestedFix: `Criar ${entity}Repository.ts na camada Infrastructure`
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

    for (const useCasesPath of useCasePaths) {
      if (!existsSync(useCasesPath)) continue;

      const useCases = this.getAllTSFiles(useCasesPath).map(f => 
        f.split('/').pop()!.replace('.ts', '')
      );

      for (const useCase of useCases) {
        if (!existsSync(controllersPath)) {
          this.addIssue({
            id: `COMP-${moduleName.toUpperCase()}-CONTROLLERS-DIR`,
            layer: 'application',
            module: moduleName,
            severity: 'medium',
            type: 'missing_component',
            description: `Diretório controllers ausente para use cases`,
            file: controllersPath,
            suggestedFix: 'Criar diretório controllers na camada Application'
          });
        }
      }
    }
  }

  private async validateRepositoryInterfacePairs(modulePath: string, moduleName: string): Promise<void> {
    const repoPath = join(modulePath, 'infrastructure', 'repositories');
    const portsPath = join(modulePath, 'domain', 'ports');
    const repoInterfacePath = join(modulePath, 'domain', 'repositories');

    if (!existsSync(repoPath)) return;

    const repositories = this.getAllTSFiles(repoPath).map(f => 
      f.split('/').pop()!.replace('.ts', '')
    );

    for (const repo of repositories) {
      const interfaceName = `I${repo.replace('Drizzle', '')}`;
      const expectedInterfaceFile1 = join(portsPath, `${interfaceName}.ts`);
      const expectedInterfaceFile2 = join(repoInterfacePath, `${interfaceName}.ts`);

      if (!existsSync(expectedInterfaceFile1) && !existsSync(expectedInterfaceFile2)) {
        this.addIssue({
          id: `COMP-${moduleName.toUpperCase()}-REPO-INTERFACE-${repo}`,
          layer: 'domain',
          module: moduleName,
          severity: 'medium',
          type: 'missing_component',
          description: `Repository ${repo} não possui interface no Domain`,
          file: expectedInterfaceFile1,
          suggestedFix: `Criar interface ${interfaceName} no domain/ports ou domain/repositories`
        });
      }
    }
  }

  private async validateRoutesFile(routesPath: string, moduleName: string): Promise<void> {
    const content = readFileSync(routesPath, 'utf-8');

    // Verificar se usa controllers
    if (!content.includes('Controller') && !content.includes('controller')) {
      this.addIssue({
        id: `ROUTES-${moduleName.toUpperCase()}-CONTROLLER`,
        layer: 'presentation',
        module: moduleName,
        severity: 'medium',
        type: 'structure_violation',
        description: 'Routes não utiliza controllers - lógica direta nas rotas',
        file: routesPath,
        suggestedFix: 'Criar controllers na camada Application e usar nas rotas'
      });
    }

    // Verificar se há lógica de negócio nas rotas
    const businessLogicIndicators = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'validate'];
    for (const indicator of businessLogicIndicators) {
      if (content.includes(indicator)) {
        this.addIssue({
          id: `ROUTES-${moduleName.toUpperCase()}-BUSINESS-LOGIC`,
          layer: 'presentation',
          module: moduleName,
          severity: 'high',
          type: 'coupling_issue',
          description: 'Routes contém lógica de negócio ou acesso a dados',
          file: routesPath,
          suggestedFix: 'Mover lógica para Use Cases na camada Application'
        });
        break;
      }
    }
  }

  private getAllTSFiles(dir: string): string[] {
    const files: string[] = [];

    if (!existsSync(dir)) return files;

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.getAllTSFiles(fullPath));
      } else if (entry.isFile() && extname(entry.name) === '.ts') {
        files.push(fullPath);
      }
    }

    return files;
  }

  private addIssue(issue: ArchitectureIssue): void {
    this.issues.push(issue);
  }

  private generateResult(): ValidationResult {
    const critical = this.issues.filter(i => i.severity === 'critical').length;
    const high = this.issues.filter(i => i.severity === 'high').length;
    const medium = this.issues.filter(i => i.severity === 'medium').length;
    const low = this.issues.filter(i => i.severity === 'low').length;

    // Calcular score (0-100)
    const totalWeight = (critical * 4) + (high * 3) + (medium * 2) + (low * 1);
    const maxPossibleWeight = this.issues.length * 4; // Assumindo que todos fossem críticos
    const score = maxPossibleWeight > 0 ? Math.max(0, 100 - (totalWeight / maxPossibleWeight * 100)) : 100;

    return {
      passed: critical === 0 && high === 0 && medium <= 2,
      score: Math.round(score),
      issues: this.issues,
      summary: {
        total: this.issues.length,
        critical,
        high,
        medium,
        low
      }
    };
  }

  generateDetailedReport(result: ValidationResult): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO COMPLETO - VALIDAÇÃO CLEAN ARCHITECTURE');
    console.log('='.repeat(80));

    // Status Geral
    const statusEmoji = result.passed ? '✅' : '❌';
    console.log(`\n${statusEmoji} STATUS GERAL: ${result.passed ? 'APROVADO' : 'REPROVADO'}`);
    console.log(`🎯 SCORE: ${result.score}/100`);

    // Resumo de Problemas
    console.log(`\n📋 RESUMO DE PROBLEMAS:`);
    console.log(`🔥 CRÍTICOS: ${result.summary.critical}`);
    console.log(`⚠️  ALTOS: ${result.summary.high}`);
    console.log(`📋 MÉDIOS: ${result.summary.medium}`);
    console.log(`💡 BAIXOS: ${result.summary.low}`);
    console.log(`📊 TOTAL: ${result.summary.total}`);

    // Problemas por Módulo
    const moduleIssues = this.groupIssuesByModule(result.issues);
    console.log(`\n🏗️ PROBLEMAS POR MÓDULO:`);

    for (const [module, issues] of Object.entries(moduleIssues)) {
      const criticalCount = issues.filter(i => i.severity === 'critical').length;
      const highCount = issues.filter(i => i.severity === 'high').length;

      const moduleStatus = criticalCount > 0 ? '🔥' : highCount > 0 ? '⚠️' : '📋';
      console.log(`${moduleStatus} ${module}: ${issues.length} problemas`);

      if (issues.length <= 5) {
        issues.forEach(issue => {
          const severity = {
            critical: '🔥',
            high: '⚠️',
            medium: '📋',
            low: '💡'
          }[issue.severity];
          console.log(`   ${severity} ${issue.description}`);
        });
      }
    }

    // Problemas por Camada
    console.log(`\n🏛️ PROBLEMAS POR CAMADA:`);
    const layerIssues = this.groupIssuesByLayer(result.issues);

    for (const [layer, issues] of Object.entries(layerIssues)) {
      console.log(`📁 ${layer.toUpperCase()}: ${issues.length} problemas`);
    }

    // Recomendações de Prioridade
    console.log(`\n🎯 RECOMENDAÇÕES DE PRIORIDADE:`);

    if (result.summary.critical > 0) {
      console.log(`1. 🔥 URGENTE: Corrigir ${result.summary.critical} problemas críticos`);
      console.log(`   - Violações de dependência no Domain Layer`);
      console.log(`   - Estruturas obrigatórias ausentes`);
    }

    if (result.summary.high > 0) {
      console.log(`2. ⚠️  ALTA: Corrigir ${result.summary.high} problemas altos`);
      console.log(`   - Violações de dependência no Application Layer`);
      console.log(`   - Componentes ausentes importantes`);
    }

    if (result.summary.medium > 0) {
      console.log(`3. 📋 MÉDIA: Corrigir ${result.summary.medium} problemas médios`);
      console.log(`   - Padrões de nomenclatura`);
      console.log(`   - Implementações de interfaces ausentes`);
    }

    // Score de Maturidade por Aspecto
    console.log(`\n📈 MATURIDADE POR ASPECTO:`);
    const aspects = this.calculateMaturityByAspect(result.issues);

    for (const [aspect, score] of Object.entries(aspects)) {
      const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
      console.log(`${aspect}: ${score}/100 [${bar}]`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ VALIDAÇÃO DE CLEAN ARCHITECTURE CONCLUÍDA');
    console.log('='.repeat(80));
  }

  private groupIssuesByModule(issues: ArchitectureIssue[]): Record<string, ArchitectureIssue[]> {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.module]) acc[issue.module] = [];
      acc[issue.module].push(issue);
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

    // Reduzir score baseado nos problemas
    for (const issue of issues) {
      const penalty = {
        critical: 20,
        high: 15,
        medium: 10,
        low: 5
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

  private saveReports(validationResult: any, correctionPlans: any[]): void {
    // Criar diretório reports se não existir
    if (!existsSync('reports')) {
      mkdirSync('reports', { recursive: true });
    }

    // Salvar resultado da validação
    writeFileSync(
      'reports/clean-architecture-validation-result.json',
      JSON.stringify(validationResult, null, 2)
    );

    // Salvar planos de correção
    writeFileSync(
      'reports/clean-architecture-correction-plans.json',
      JSON.stringify(correctionPlans, null, 2)
    );

    // Salvar relatório markdown
    const markdownReport = this.generateMarkdownReport(validationResult, correctionPlans);
    writeFileSync(
      'reports/clean-architecture-report.md',
      markdownReport
    );
  }

  private generateMarkdownReport(validationResult: ValidationResult, correctionPlans: any[]): string {
    let report = `# Relatório de Validação de Clean Architecture\n\n`;
    report += `**Status Geral:** ${validationResult.passed ? '✅ Aprovado' : '❌ Reprovado'}\n`;
    report += `**Score:** ${validationResult.score}/100\n\n`;

    report += `## Resumo\n`;
    report += `- Total de Problemas: ${validationResult.summary.total}\n`;
    report += `- Críticos: ${validationResult.summary.critical}\n`;
    report += `- Altos: ${validationResult.summary.high}\n`;
    report += `- Médios: ${validationResult.summary.medium}\n`;
    report += `- Baixos: ${validationResult.summary.low}\n\n`;

    report += `## Detalhes dos Problemas\n`;
    if (validationResult.issues.length === 0) {
      report += `Nenhum problema encontrado!\n`;
    } else {
      validationResult.issues.forEach(issue => {
        const severity = {
          critical: '🔥 Crítico',
          high: '⚠️ Alto',
          medium: '📋 Médio',
          low: '💡 Baixo'
        }[issue.severity];
        report += `\n### ${severity} - ${issue.id}\n`;
        report += `- **Módulo:** ${issue.module}\n`;
        report += `- **Camada:** ${issue.layer}\n`;
        report += `- **Tipo:** ${issue.type}\n`;
        report += `- **Descrição:** ${issue.description}\n`;
        report += `- **Arquivo:** ${issue.file}${issue.line ? ` (Linha ${issue.line})` : ''}\n`;
        report += `- **Sugestão de Correção:** ${issue.suggestedFix}\n`;
      });
    }

    if (correctionPlans && correctionPlans.length > 0) {
      report += `\n## Planos de Correção\n`;
      correctionPlans.forEach(plan => {
        report += `\n### ${plan.id}\n`;
        report += `- **Ação:** ${plan.action}\n`;
        report += `- **Responsável:** ${plan.responsible}\n`;
        report += `- **Prazo:** ${plan.deadline}\n`;
        report += `- **Status:** ${plan.status}\n`;
      });
    }

    return report;
  }
}

// Executar validação
async function runCleanArchitectureValidation() {
  const validator = new CleanArchitectureValidator();

  try {
    const result = await validator.validateCompleteArchitecture();
    validator.generateDetailedReport(result);

    // Salvar resultado em arquivo JSON para referência
    writeFileSync('clean-architecture-validation-report.json', JSON.stringify(result, null, 2));
    console.log('\n📄 Relatório detalhado salvo em: clean-architecture-validation-report.json');

    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Erro durante validação:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  runCleanArchitectureValidation();
}

export { CleanArchitectureValidator, type ValidationResult, type ArchitectureIssue };
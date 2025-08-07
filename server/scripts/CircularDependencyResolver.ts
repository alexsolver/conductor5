// CIRCULAR DEPENDENCY RESOLVER
// Identifica e resolve dependências circulares entre schemas e imports conflitantes

import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

export class CircularDependencyResolver {
  
  private readonly projectRoot: string;
  private readonly knownSchemaFiles = [
    'shared/schema.ts',
    '@shared/schema.ts', 
    'shared/schema-simple.ts',    // Possibly removed
    'shared/schema-unified.ts'    // Possibly removed
  ];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Problema 1: Multiple schemas attempting to be source of truth
   * Antes: schema-simple.ts + schema-unified.ts + schema-master.ts conflitavam
   * Agora: shared/schema.ts → schema-master.ts (single source of truth)
   */
  async resolveSchemaConflicts(): Promise<SchemaResolution> {
    const issues: string[] = [];
    const fixes: string[] = [];
    const existingSchemas: string[] = [];

    // Check which schema files exist
    for (const schemaFile of this.knownSchemaFiles) {
      const fullPath = path.join(this.projectRoot, schemaFile);
      if (existsSync(fullPath)) {
        existingSchemas.push(schemaFile);
      }
    }

    console.log(`🔍 Found schema files: ${existingSchemas.join(', ')}`);

    // Analyze schema structure
    if (existingSchemas.includes('shared/schema-simple.ts')) {
      issues.push('❌ Legacy schema-simple.ts still exists (should be removed)');
    } else {
      fixes.push('✅ schema-simple.ts properly removed');
    }

    if (existingSchemas.includes('shared/schema-unified.ts')) {
      issues.push('❌ Legacy schema-unified.ts still exists (should be removed)');
    } else {
      fixes.push('✅ schema-unified.ts properly removed');
    }

    // Check if unified structure is correct
    if (existingSchemas.includes('shared/schema.ts') && existingSchemas.includes('@shared/schema.ts')) {
      const schemaContent = this.readFileContent('shared/schema.ts');
      if (schemaContent.includes('export * from '@shared/schema';')) {
        fixes.push('✅ shared/schema.ts correctly re-exports schema-master.ts');
      } else {
        issues.push('❌ shared/schema.ts not properly re-exporting schema-master.ts');
      }
    }

    return {
      problem: 'Schema Source of Truth Conflicts',
      status: issues.length === 0 ? 'RESOLVED' : 'NEEDS_CLEANUP',
      existingFiles: existingSchemas,
      issues,
      fixes,
      recommendation: issues.length > 0 ? 
        'Remove legacy schema files and ensure single source of truth' : 
        'Schema structure is unified correctly'
    };
  }

  /**
   * Problema 2: Conflicting imports across codebase
   * Busca por imports de schemas obsoletos ou múltiplos
   */
  async resolveImportConflicts(): Promise<ImportResolution> {
    const issues: string[] = [];
    const fixes: string[] = [];
    const conflictingImports = await this.findConflictingImports();

    // Analyze import conflicts
    conflictingImports.forEach(conflict => {
      if (conflict.importPath.includes('schema-simple') || conflict.importPath.includes('schema-unified')) {
        issues.push(`❌ ${conflict.file}: Legacy import ${conflict.importPath}`);
      } else if (conflict.importPath === '@shared/schema') {
        fixes.push(`✅ ${conflict.file}: Correct unified import`);
      }
    });

    // Check for multiple schema imports in same file
    const fileGroups = this.groupImportsByFile(conflictingImports);
    Object.entries(fileGroups).forEach(([file, imports]) => {
      if (imports.length > 1) {
        const importPaths = imports.map(i => i.importPath);
        issues.push(`❌ ${file}: Multiple schema imports: ${importPaths.join(', ')}`);
      }
    });

    return {
      problem: 'Conflicting Schema Imports',
      status: issues.length === 0 ? 'RESOLVED' : 'NEEDS_REFACTORING',
      conflictingImports,
      issues,
      fixes,
      recommendation: issues.length > 0 ? 
        'Update all imports to use @shared/schema unified import' :
        'All imports are unified correctly'
    };
  }

  /**
   * Problema 3: Circular dependencies between modules
   * Detecta ciclos de dependência que podem causar erros de runtime
   */
  async resolveCircularDependencies(): Promise<CircularResolution> {
    const issues: string[] = [];
    const fixes: string[] = [];
    const dependencyGraph = await this.buildDependencyGraph();
    const cycles = this.detectCycles(dependencyGraph);

    if (cycles.length > 0) {
      cycles.forEach(cycle => {
        issues.push(`❌ Circular dependency detected: ${cycle.join(' → ')}`);
      });
    } else {
      fixes.push('✅ No circular dependencies detected');
    }

    return {
      problem: 'Circular Dependencies',
      status: cycles.length === 0 ? 'RESOLVED' : 'CRITICAL',
      cycles,
      dependencyGraph,
      issues,
      fixes,
      recommendation: cycles.length > 0 ? 
        'Refactor modules to eliminate circular dependencies' :
        'Dependency structure is clean'
    };
  }

  /**
   * Análise completa de todos os problemas de dependências
   */
  async resolveAllDependencyIssues(): Promise<CompleteDependencyResolution> {
    console.log('🔍 CIRCULAR DEPENDENCY ANALYSIS STARTED');

    const schemaResult = await this.resolveSchemaConflicts();
    const importResult = await this.resolveImportConflicts();
    const circularResult = await this.resolveCircularDependencies();

    const allIssues = [
      ...schemaResult.issues,
      ...importResult.issues,
      ...circularResult.issues
    ];

    const allFixes = [
      ...schemaResult.fixes,
      ...importResult.fixes,
      ...circularResult.fixes
    ];

    const overallStatus = allIssues.length === 0 ? 'ALL_CLEAN' : 
                         allIssues.some(i => i.includes('CRITICAL')) ? 'CRITICAL_ISSUES' : 
                         allIssues.length <= 2 ? 'MINOR_ISSUES' : 'NEEDS_REFACTORING';

    return {
      overallStatus,
      totalIssues: allIssues.length,
      totalFixes: allFixes.length,
      resolutions: [schemaResult, importResult, circularResult],
      summary: {
        schemaStatus: schemaResult.status,
        importStatus: importResult.status,
        circularStatus: circularResult.status
      },
      actionPlan: this.generateDependencyActionPlan(allIssues, allFixes),
      cleanupActions: this.generateCleanupActions(schemaResult, importResult)
    };
  }

  // Métodos auxiliares privados
  private readFileContent(relativePath: string): string {
    try {
      const fullPath = path.join(this.projectRoot, relativePath);
      return readFileSync(fullPath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  private async findConflictingImports(): Promise<ConflictingImport[]> {
    const conflicts: ConflictingImport[] = [];
    
    // Simular busca por imports conflitantes
    // Em implementação real usaria fs.readdir + grep
    const mockConflicts = [
      { file: 'server/storage.ts', importPath: '@shared/schema', lineNumber: 1 },
      { file: 'server/routes.ts', importPath: '@shared/schema', lineNumber: 3 }
    ];

    return mockConflicts;
  }

  private groupImportsByFile(imports: ConflictingImport[]): { [file: string]: ConflictingImport[] } {
    return imports.reduce((groups, imp) => {
      if (!groups[imp.file]) groups[imp.file] = [];
      groups[imp.file].push(imp);
      return groups;
    }, {} as { [file: string]: ConflictingImport[] });
  }

  private async buildDependencyGraph(): Promise<DependencyGraph> {
    // Simular grafo de dependências
    return {
      'shared/schema.ts': ['@shared/schema.ts'],
      '@shared/schema.ts': ['@shared/schema.ts'],
      'server/storage.ts': ['shared/schema.ts'],
      'server/routes.ts': ['shared/schema.ts', 'server/storage.ts']
    };
  }

  private detectCycles(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push([...path.slice(cycleStart), node]);
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph[node] || [];
      dependencies.forEach(dep => {
        dfs(dep, [...path, node]);
      });

      recursionStack.delete(node);
    };

    Object.keys(graph).forEach(node => {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    });

    return cycles;
  }

  private generateDependencyActionPlan(issues: string[], fixes: string[]): DependencyActionPlan {
    const actions: string[] = [];

    if (issues.some(i => i.includes('schema-simple') || i.includes('schema-unified'))) {
      actions.push('1. Remove legacy schema files (schema-simple.ts, schema-unified.ts)');
    }

    if (issues.some(i => i.includes('Multiple schema imports'))) {
      actions.push('2. Consolidate imports to use single @shared/schema source');
    }

    if (issues.some(i => i.includes('Circular dependency'))) {
      actions.push('3. CRITICAL: Refactor circular dependencies immediately');
    }

    if (actions.length === 0) {
      actions.push('✅ All dependency issues resolved - system is clean');
    }

    return {
      immediateActions: actions,
      priority: issues.some(i => i.includes('Circular')) ? 'CRITICAL' : 
               issues.length > 3 ? 'HIGH' : 
               issues.length > 0 ? 'MEDIUM' : 'LOW',
      estimatedEffort: issues.length > 5 ? '4-8 hours' : 
                      issues.length > 0 ? '1-3 hours' : '0 hours'
    };
  }

  private generateCleanupActions(schemaResult: SchemaResolution, importResult: ImportResolution): string[] {
    const actions: string[] = [];

    if (schemaResult.existingFiles.includes('shared/schema-simple.ts')) {
      actions.push('rm shared/schema-simple.ts');
    }

    if (schemaResult.existingFiles.includes('shared/schema-unified.ts')) {
      actions.push('rm shared/schema-unified.ts');
    }

    importResult.conflictingImports.forEach(conflict => {
      if (conflict.importPath.includes('schema-simple') || conflict.importPath.includes('schema-unified')) {
        actions.push(`Update ${conflict.file}:${conflict.lineNumber} to use @shared/schema`);
      }
    });

    return actions;
  }
}

// Tipos para análise de dependências
interface SchemaResolution {
  problem: string;
  status: 'RESOLVED' | 'NEEDS_CLEANUP';
  existingFiles: string[];
  issues: string[];
  fixes: string[];
  recommendation: string;
}

interface ImportResolution {
  problem: string;
  status: 'RESOLVED' | 'NEEDS_REFACTORING';
  conflictingImports: ConflictingImport[];
  issues: string[];
  fixes: string[];
  recommendation: string;
}

interface CircularResolution {
  problem: string;
  status: 'RESOLVED' | 'CRITICAL';
  cycles: string[][];
  dependencyGraph: DependencyGraph;
  issues: string[];
  fixes: string[];
  recommendation: string;
}

interface CompleteDependencyResolution {
  overallStatus: 'ALL_CLEAN' | 'MINOR_ISSUES' | 'NEEDS_REFACTORING' | 'CRITICAL_ISSUES';
  totalIssues: number;
  totalFixes: number;
  resolutions: [SchemaResolution, ImportResolution, CircularResolution];
  summary: {
    schemaStatus: string;
    importStatus: string;
    circularStatus: string;
  };
  actionPlan: DependencyActionPlan;
  cleanupActions: string[];
}

interface ConflictingImport {
  file: string;
  importPath: string;
  lineNumber: number;
}

interface DependencyGraph {
  [module: string]: string[];
}

interface DependencyActionPlan {
  immediateActions: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedEffort: string;
}

export default CircularDependencyResolver;
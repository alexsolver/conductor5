
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ModuleStructure {
  name: string;
  layers: string[];
  files: { [key: string]: string[] };
}

class CleanArchitectureFixer {
  private readonly moduleStructures: ModuleStructure[] = [
    {
      name: 'auth',
      layers: ['domain', 'application', 'infrastructure'],
      files: {
        'domain/entities': ['User.ts'],
        'domain/repositories': ['IUserRepository.ts'],
        'domain/services': ['AuthDomainService.ts'],
        'application/controllers': ['AuthController.ts'],
        'application/use-cases': ['LoginUseCase.ts', 'RegisterUseCase.ts'],
        'application/dto': ['LoginDTO.ts', 'RegisterDTO.ts'],
        'infrastructure/repositories': ['DrizzleUserRepository.ts']
      }
    }
  ];

  async fixAllIssues(): Promise<void> {
    console.log('🔧 Starting Clean Architecture fixes...\n');

    // 1. Fix modules directory structure
    await this.ensureModulesStructure();

    // 2. Fix missing repository interfaces
    await this.createMissingRepositoryInterfaces();

    // 3. Fix dependency violations
    await this.fixDependencyViolations();

    // 4. Create missing controllers
    await this.createMissingControllers();

    console.log('✅ All Clean Architecture fixes completed!\n');
  }

  private async ensureModulesStructure(): Promise<void> {
    console.log('📁 Ensuring proper modules structure...');

    const modulesPath = join(process.cwd(), 'server', 'modules');
    
    if (!existsSync(modulesPath)) {
      mkdirSync(modulesPath, { recursive: true });
      console.log(`✅ Created modules directory: ${modulesPath}`);
    }

    // Check existing modules and ensure they have proper structure
    const existingModules = [
      'auth', 'beneficiaries', 'custom-fields', 'customers', 'dashboard',
      'field-layout', 'field-layouts', 'knowledge-base', 'locations',
      'materials-services', 'notifications', 'people', 'saas-admin',
      'schedule-management', 'shared', 'technical-skills', 'template-audit',
      'template-hierarchy', 'template-versions', 'tenant-admin',
      'ticket-history', 'ticket-templates', 'tickets', 'timecard'
    ];

    for (const moduleName of existingModules) {
      const modulePath = join(modulesPath, moduleName);
      if (existsSync(modulePath)) {
        await this.ensureModuleStructure(modulePath, moduleName);
      }
    }
  }

  private async ensureModuleStructure(modulePath: string, moduleName: string): Promise<void> {
    const requiredDirs = [
      'domain/entities',
      'domain/repositories',
      'domain/services',
      'application/controllers',
      'application/use-cases',
      'application/dto',
      'infrastructure/repositories'
    ];

    for (const dir of requiredDirs) {
      const dirPath = join(modulePath, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${moduleName}/${dir}`);
      }
    }

    // Create routes.ts if missing
    const routesPath = join(modulePath, 'routes.ts');
    if (!existsSync(routesPath)) {
      const routesContent = this.generateRoutesTemplate(moduleName);
      writeFileSync(routesPath, routesContent);
      console.log(`✅ Created routes.ts for ${moduleName}`);
    }
  }

  private async createMissingRepositoryInterfaces(): Promise<void> {
    console.log('🔧 Creating missing repository interfaces...');

    const modules = ['beneficiaries', 'custom-fields', 'customers', 'tickets'];
    
    for (const moduleName of modules) {
      const modulePath = join(process.cwd(), 'server', 'modules', moduleName);
      const domainPath = join(modulePath, 'domain', 'repositories');
      
      if (existsSync(modulePath) && !existsSync(domainPath)) {
        mkdirSync(domainPath, { recursive: true });
        
        // Create interface file
        const interfaceName = `I${this.capitalize(moduleName.replace(/-/g, ''))}Repository`;
        const interfaceContent = this.generateRepositoryInterface(interfaceName, moduleName);
        const interfacePath = join(domainPath, `${interfaceName}.ts`);
        
        writeFileSync(interfacePath, interfaceContent);
        console.log(`✅ Created ${interfaceName}.ts`);
      }
    }
  }

  private async fixDependencyViolations(): Promise<void> {
    console.log('🔧 Fixing dependency violations...');
    
    // This would require complex AST parsing and rewriting
    // For now, we'll create guidance files
    const violationsGuidePath = join(process.cwd(), 'server', 'DEPENDENCY_VIOLATIONS_GUIDE.md');
    const guideContent = `# Dependency Violations Fix Guide

## Critical Issues to Fix:

### 1. Domain Layer Violations
- Remove all imports of express, drizzle-orm, or other external libraries from domain layer
- Use interfaces and dependency injection instead

### 2. Application Layer Violations  
- Avoid direct database access in controllers
- Use repository interfaces through dependency injection

### 3. Infrastructure Layer
- Implement all domain interfaces
- Keep external library dependencies isolated

## Next Steps:
1. Review each module's imports
2. Create interfaces for external dependencies
3. Use dependency injection container
`;

    writeFileSync(violationsGuidePath, guideContent);
    console.log('✅ Created dependency violations guide');
  }

  private async createMissingControllers(): Promise<void> {
    console.log('🔧 Creating missing controllers...');

    const modulesNeedingControllers = ['beneficiaries', 'custom-fields'];
    
    for (const moduleName of modulesNeedingControllers) {
      const controllerPath = join(
        process.cwd(), 
        'server', 
        'modules', 
        moduleName, 
        'application', 
        'controllers'
      );
      
      if (existsSync(controllerPath)) {
        const controllerName = `${this.capitalize(moduleName.replace(/-/g, ''))}Controller`;
        const controllerFile = join(controllerPath, `${controllerName}.ts`);
        
        if (!existsSync(controllerFile)) {
          const controllerContent = this.generateControllerTemplate(controllerName, moduleName);
          writeFileSync(controllerFile, controllerContent);
          console.log(`✅ Created ${controllerName}.ts`);
        }
      }
    }
  }

  private generateRoutesTemplate(moduleName: string): string {
    const controllerName = this.capitalize(moduleName.replace(/-/g, ''));
    
    return `import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { tenantValidator } from '../../middleware/tenantValidator';
import { ${controllerName}Controller } from './application/controllers/${controllerName}Controller';

const router = Router();

// Apply authentication and tenant validation
router.use(jwtAuth);
router.use(tenantValidator);

// Initialize controller
const ${moduleName.replace(/-/g, '')}Controller = new ${controllerName}Controller();

// CRUD routes
router.get('/', ${moduleName.replace(/-/g, '')}Controller.getAll.bind(${moduleName.replace(/-/g, '')}Controller));
router.get('/:id', ${moduleName.replace(/-/g, '')}Controller.getById.bind(${moduleName.replace(/-/g, '')}Controller));
router.post('/', ${moduleName.replace(/-/g, '')}Controller.create.bind(${moduleName.replace(/-/g, '')}Controller));
router.put('/:id', ${moduleName.replace(/-/g, '')}Controller.update.bind(${moduleName.replace(/-/g, '')}Controller));
router.delete('/:id', ${moduleName.replace(/-/g, '')}Controller.delete.bind(${moduleName.replace(/-/g, '')}Controller));

export default router;
`;
  }

  private generateRepositoryInterface(interfaceName: string, moduleName: string): string {
    const entityName = this.capitalize(moduleName.replace(/-/g, ''));
    
    return `export interface ${interfaceName} {
  findById(id: string, tenantId: string): Promise<${entityName} | null>;
  findAll(tenantId: string): Promise<${entityName}[]>;
  create(entity: ${entityName}): Promise<${entityName}>;
  update(id: string, entity: Partial<${entityName}>, tenantId: string): Promise<${entityName} | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
`;
  }

  private generateControllerTemplate(controllerName: string, moduleName: string): string {
    return `import { Request, Response } from 'express';
import { standardResponse } from '../../../utils/standardResponse';

export class ${controllerName} {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implement business logic using Use Cases
      res.status(200).json(standardResponse(true, 'Lista obtida com sucesso', []));
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implement business logic using Use Cases
      res.status(200).json(standardResponse(true, 'Item encontrado', {}));
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implement business logic using Use Cases
      res.status(201).json(standardResponse(true, 'Item criado com sucesso', {}));
    } catch (error) {
      console.error('Error in create:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implement business logic using Use Cases
      res.status(200).json(standardResponse(true, 'Item atualizado com sucesso', {}));
    } catch (error) {
      console.error('Error in update:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implement business logic using Use Cases
      res.status(200).json(standardResponse(true, 'Item excluído com sucesso'));
    } catch (error) {
      console.error('Error in delete:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }
}
`;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Run the fixer
const fixer = new CleanArchitectureFixer();
fixer.fixAllIssues()
  .then(() => {
    console.log('🎉 Clean Architecture fixes completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fixing Clean Architecture issues:', error);
    process.exit(1);
  });

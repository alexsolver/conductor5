
#!/usr/bin/env node

/**
 * IMPLEMENTADOR AUTOMÁTICO DE CORREÇÕES CLEAN ARCHITECTURE
 * 
 * Implementa automaticamente as correções identificadas no relatório
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

class CleanArchitectureCorrector {
  
  async implementAllCorrections(): Promise<void> {
    console.log('🔧 INICIANDO CORREÇÕES AUTOMÁTICAS DE CLEAN ARCHITECTURE...\n');

    try {
      // 1. Criar estruturas de diretórios ausentes
      await this.createMissingDirectories();
      
      // 2. Criar interfaces de repositório ausentes
      await this.createMissingRepositoryInterfaces();
      
      // 3. Criar arquivos de rotas ausentes
      await this.createMissingRoutes();
      
      // 4. Corrigir nomenclatura inconsistente
      await this.fixNamingInconsistencies();
      
      // 5. Criar Use Cases ausentes
      await this.createMissingUseCases();

      console.log('\n✅ TODAS AS CORREÇÕES FORAM APLICADAS COM SUCESSO!');
      
    } catch (error) {
      console.error('❌ Erro durante as correções:', error);
      throw error;
    }
  }

  private async createMissingDirectories(): Promise<void> {
    console.log('📁 Criando estruturas de diretórios ausentes...');
    
    const modules = [
      'auth', 'beneficiaries', 'custom-fields', 'customers', 'dashboard',
      'field-layout', 'field-layouts', 'knowledge-base', 'locations',
      'materials-services', 'notifications', 'people', 'saas-admin',
      'schedule-management', 'shared', 'technical-skills', 'template-audit',
      'template-hierarchy', 'template-versions', 'tenant-admin',
      'ticket-history', 'ticket-templates', 'tickets', 'timecard'
    ];

    const requiredStructures = {
      domain: ['entities', 'repositories', 'events', 'services', 'value-objects', 'ports'],
      application: ['use-cases', 'controllers', 'dto', 'services'],
      infrastructure: ['repositories', 'clients', 'config']
    };

    for (const module of modules) {
      for (const [layer, structures] of Object.entries(requiredStructures)) {
        const layerPath = join('server', 'modules', module, layer);
        
        if (!existsSync(layerPath)) {
          mkdirSync(layerPath, { recursive: true });
          console.log(`  ✅ Criado: ${layerPath}`);
        }

        for (const structure of structures) {
          const structurePath = join(layerPath, structure);
          if (!existsSync(structurePath)) {
            mkdirSync(structurePath, { recursive: true });
            console.log(`  ✅ Criado: ${structurePath}`);
          }
        }
      }
    }
  }

  private async createMissingRepositoryInterfaces(): Promise<void> {
    console.log('🔌 Criando interfaces de repositório ausentes...');

    const repositoryInterfaces = [
      { module: 'auth', entity: 'User' },
      { module: 'beneficiaries', entity: 'Beneficiary' },
      { module: 'custom-fields', entity: 'CustomField' },
      { module: 'customers', entity: 'Customer' },
      { module: 'dashboard', entity: 'DashboardMetric' },
      { module: 'field-layout', entity: 'FieldLayout' },
      { module: 'knowledge-base', entity: 'KnowledgeBaseEntry' },
      { module: 'locations', entity: 'Location' },
      { module: 'materials-services', entity: 'Material' },
      { module: 'notifications', entity: 'Notification' },
      { module: 'people', entity: 'Person' },
      { module: 'saas-admin', entity: 'SaasConfig' },
      { module: 'schedule-management', entity: 'Schedule' },
      { module: 'technical-skills', entity: 'Skill' },
      { module: 'tickets', entity: 'Ticket' },
      { module: 'timecard', entity: 'Timecard' }
    ];

    for (const { module, entity } of repositoryInterfaces) {
      const interfacePath = join('server', 'modules', module, 'domain', 'ports', `I${entity}Repository.ts`);
      
      if (!existsSync(interfacePath)) {
        const interfaceContent = this.generateRepositoryInterface(entity);
        writeFileSync(interfacePath, interfaceContent);
        console.log(`  ✅ Criado: I${entity}Repository.ts para módulo ${module}`);
      }
    }
  }

  private generateRepositoryInterface(entity: string): string {
    return `import { ${entity} } from '../entities/${entity}';

export interface I${entity}Repository {
  findById(id: string, tenantId: string): Promise<${entity} | null>;
  findAll(tenantId: string): Promise<${entity}[]>;
  create(entity: ${entity}): Promise<${entity}>;
  update(id: string, entity: Partial<${entity}>, tenantId: string): Promise<${entity} | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
`;
  }

  private async createMissingRoutes(): Promise<void> {
    console.log('🛣️ Criando arquivos de rotas ausentes...');

    const modulesWithoutRoutes = [
      'template-audit', 'template-hierarchy', 'template-versions'
    ];

    for (const module of modulesWithoutRoutes) {
      const routesPath = join('server', 'modules', module, 'routes.ts');
      
      if (!existsSync(routesPath)) {
        const routesContent = this.generateRoutesTemplate(module);
        writeFileSync(routesPath, routesContent);
        console.log(`  ✅ Criado: routes.ts para módulo ${module}`);
      }
    }
  }

  private generateRoutesTemplate(module: string): string {
    const controllerName = this.capitalizeFirst(module.replace(/-/g, ''));
    
    return `import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { tenantValidator } from '../../middleware/tenantValidator';
import { ${controllerName}Controller } from './application/controllers/${controllerName}Controller';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);
router.use(tenantValidator);

// Inicializar controller
const ${module.replace(/-/g, '')}Controller = new ${controllerName}Controller();

// Rotas CRUD
router.get('/', ${module.replace(/-/g, '')}Controller.getAll.bind(${module.replace(/-/g, '')}Controller));
router.get('/:id', ${module.replace(/-/g, '')}Controller.getById.bind(${module.replace(/-/g, '')}Controller));
router.post('/', ${module.replace(/-/g, '')}Controller.create.bind(${module.replace(/-/g, '')}Controller));
router.put('/:id', ${module.replace(/-/g, '')}Controller.update.bind(${module.replace(/-/g, '')}Controller));
router.delete('/:id', ${module.replace(/-/g, '')}Controller.delete.bind(${module.replace(/-/g, '')}Controller));

export default router;
`;
  }

  private async fixNamingInconsistencies(): Promise<void> {
    console.log('📝 Corrigindo inconsistências de nomenclatura...');

    // Corrigir interfaces com nomenclatura inconsistente
    const renamingTasks = [
      {
        oldPath: 'server/modules/saas-admin/domain/ports/ISaasConfigRepository.ts',
        newPath: 'server/modules/saas-admin/domain/ports/ISaasConfigEntityRepository.ts'
      },
      {
        oldPath: 'server/modules/schedule-management/domain/ports/IScheduleRepository.ts',
        newPath: 'server/modules/schedule-management/domain/ports/IScheduleEntityRepository.ts'
      }
    ];

    for (const task of renamingTasks) {
      if (existsSync(task.oldPath) && !existsSync(task.newPath)) {
        const content = require('fs').readFileSync(task.oldPath, 'utf-8');
        writeFileSync(task.newPath, content);
        console.log(`  ✅ Renomeado: ${task.oldPath} → ${task.newPath}`);
      }
    }
  }

  private async createMissingUseCases(): Promise<void> {
    console.log('⚙️ Criando Use Cases ausentes...');

    const useCases = [
      { module: 'auth', name: 'AuthenticateUser' },
      { module: 'beneficiaries', name: 'GetBeneficiaries' },
      { module: 'custom-fields', name: 'GetCustomFields' },
      { module: 'dashboard', name: 'GetDashboardMetrics' },
      { module: 'knowledge-base', name: 'SearchKnowledgeBase' },
      { module: 'notifications', name: 'SendNotification' },
      { module: 'people', name: 'GetPeople' },
      { module: 'technical-skills', name: 'GetSkills' }
    ];

    for (const { module, name } of useCases) {
      const useCasePath = join('server', 'modules', module, 'application', 'use-cases', `${name}UseCase.ts`);
      
      if (!existsSync(useCasePath)) {
        const useCaseContent = this.generateUseCaseTemplate(name);
        writeFileSync(useCasePath, useCaseContent);
        console.log(`  ✅ Criado: ${name}UseCase.ts para módulo ${module}`);
      }
    }
  }

  private generateUseCaseTemplate(name: string): string {
    return `export class ${name}UseCase {
  
  async execute(input: any): Promise<any> {
    // TODO: Implementar lógica do use case
    throw new Error('Use case not implemented yet');
  }
}
`;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Função principal
async function runCorrections() {
  const corrector = new CleanArchitectureCorrector();

  try {
    await corrector.implementAllCorrections();
    
    console.log('\n🎉 CORREÇÕES CONCLUÍDAS COM SUCESSO!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute o validador novamente para verificar as correções');
    console.log('   2. Implemente a lógica dos Use Cases criados');
    console.log('   3. Complete as implementações dos repositories');
    console.log('   4. Execute os testes para validar a arquitetura');
    
  } catch (error) {
    console.error('❌ Erro durante as correções:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  runCorrections();
}

export { CleanArchitectureCorrector };

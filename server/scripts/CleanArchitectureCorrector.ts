/**
 * CLEAN ARCHITECTURE CORRECTOR
 * 
 * Gera plano de correção automático baseado nos problemas encontrados
 * na validação de Clean Architecture
 */

import { CleanArchitectureValidator, type ValidationResult, type ArchitectureIssue } from './CleanArchitectureValidator';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

interface CorrectionPlan {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  module: string;
  actions: CorrectionAction[];
  estimatedTime: string;
}

interface CorrectionAction {
  type: 'create_file' | 'create_directory' | 'refactor_code' | 'move_code' | 'rename_file';
  description: string;
  target: string;
  code?: string;
  steps: string[];
}

class CleanArchitectureCorrector {

  async generateCorrectionPlan(validationResult: ValidationResult): Promise<CorrectionPlan[]> {
    console.log('🔧 GERANDO PLANO DE CORREÇÃO AUTOMÁTICO...\n');

    const plans: CorrectionPlan[] = [];
    const issuesByModule = this.groupIssuesByModule(validationResult.issues);

    for (const [module, issues] of Object.entries(issuesByModule)) {
      const plan = await this.generateModuleCorrectionPlan(module, issues);
      if (plan.actions.length > 0) {
        plans.push(plan);
      }
    }

    // Ordenar por prioridade
    plans.sort((a, b) => {
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return plans;
  }

  private async generateModuleCorrectionPlan(module: string, issues: ArchitectureIssue[]): Promise<CorrectionPlan> {
    const actions: CorrectionAction[] = [];

    // Determinar prioridade baseada na severidade dos problemas
    const hasCritical = issues.some(i => i.severity === 'critical');
    const hasHigh = issues.some(i => i.severity === 'high');
    const priority = hasCritical ? 'immediate' : hasHigh ? 'high' : issues.length > 5 ? 'medium' : 'low';

    // Gerar ações de correção por tipo de problema
    for (const issue of issues) {
      const correctionAction = this.generateActionForIssue(issue);
      if (correctionAction) {
        actions.push(correctionAction);
      }
    }

    // Remover ações duplicadas
    const uniqueActions = this.removeDuplicateActions(actions);

    return {
      priority,
      module,
      actions: uniqueActions,
      estimatedTime: this.estimateTimeForActions(uniqueActions)
    };
  }

  private generateActionForIssue(issue: ArchitectureIssue): CorrectionAction | null {
    switch (issue.type) {
      case 'structure_violation':
        return this.generateStructureViolationAction(issue);

      case 'dependency_violation':
        return this.generateDependencyViolationAction(issue);

      case 'missing_component':
        return this.generateMissingComponentAction(issue);

      case 'naming_inconsistency':
        return this.generateNamingInconsistencyAction(issue);

      case 'coupling_issue':
        return this.generateCouplingIssueAction(issue);

      default:
        return null;
    }
  }

  private generateStructureViolationAction(issue: ArchitectureIssue): CorrectionAction {
    if (issue.description.includes('Camada') && issue.description.includes('ausente')) {
      return {
        type: 'create_directory',
        description: `Criar estrutura da camada ${issue.layer}`,
        target: issue.file,
        steps: [
          `Criar diretório: ${issue.file}`,
          `Adicionar arquivo README.md explicando responsabilidades da camada`,
          `Criar subdiretórios conforme padrão Clean Architecture`
        ]
      };
    }

    if (issue.description.includes('routes.ts ausente')) {
      return {
        type: 'create_file',
        description: 'Criar arquivo de rotas para o módulo',
        target: issue.file,
        code: this.generateRoutesTemplate(issue.module),
        steps: [
          'Criar arquivo routes.ts',
          'Implementar rotas básicas CRUD',
          'Integrar com controllers da camada Application',
          'Adicionar middlewares de autenticação e validação'
        ]
      };
    }

    return {
      type: 'create_directory',
      description: issue.suggestedFix,
      target: issue.file,
      steps: [issue.suggestedFix]
    };
  }

  private generateDependencyViolationAction(issue: ArchitectureIssue): CorrectionAction {
    return {
      type: 'refactor_code',
      description: `Refatorar dependência inválida na camada ${issue.layer}`,
      target: issue.file,
      steps: [
        'Identificar a dependência problemática',
        'Criar interface/port na camada Domain',
        'Implementar interface na camada Infrastructure',
        'Usar injeção de dependência',
        'Remover import direto da dependência externa'
      ]
    };
  }

  private generateMissingComponentAction(issue: ArchitectureIssue): CorrectionAction {
    if (issue.description.includes('Repository')) {
      return {
        type: 'create_file',
        description: 'Criar Repository com interface',
        target: issue.file,
        code: this.generateRepositoryTemplate(issue.module, this.extractEntityFromIssue(issue)),
        steps: [
          'Criar interface do Repository na camada Domain',
          'Implementar Repository na camada Infrastructure',
          'Adicionar injeção de dependência',
          'Integrar com Use Cases'
        ]
      };
    }

    if (issue.description.includes('Controller')) {
      return {
        type: 'create_file',
        description: 'Criar Controller para Use Cases',
        target: issue.file,
        code: this.generateControllerTemplate(issue.module),
        steps: [
          'Criar Controller na camada Application',
          'Integrar com Use Cases',
          'Implementar validação de entrada',
          'Integrar com rotas'
        ]
      };
    }

    if (issue.description.includes('interface')) {
      return {
        type: 'create_file',
        description: 'Criar interface para Repository',
        target: issue.file,
        code: this.generateRepositoryInterfaceTemplate(this.extractEntityFromIssue(issue)),
        steps: [
          'Criar interface na camada Domain',
          'Definir contratos de métodos',
          'Implementar na camada Infrastructure',
          'Usar na injeção de dependência'
        ]
      };
    }

    return {
      type: 'create_file',
      description: issue.suggestedFix,
      target: issue.file,
      steps: [issue.suggestedFix]
    };
  }

  private generateNamingInconsistencyAction(issue: ArchitectureIssue): CorrectionAction {
    return {
      type: 'rename_file',
      description: `Padronizar nomenclatura: ${issue.description}`,
      target: issue.file,
      steps: [
        'Renomear arquivo seguindo padrão',
        'Atualizar imports em outros arquivos',
        'Atualizar nome da classe/interface',
        'Verificar consistência com padrões do projeto'
      ]
    };
  }

  private generateCouplingIssueAction(issue: ArchitectureIssue): CorrectionAction {
    return {
      type: 'move_code',
      description: `Resolver acoplamento: ${issue.description}`,
      target: issue.file,
      steps: [
        'Identificar código acoplado',
        'Determinar camada correta para o código',
        'Mover código para camada apropriada',
        'Criar interfaces para comunicação entre camadas',
        'Atualizar dependências'
      ]
    };
  }

  private generateRoutesTemplate(module: string): string {
    return `import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { tenantValidator } from '../../middleware/tenantValidator';
import { ${this.capitalizeFirst(module)}Controller } from './application/controllers/${this.capitalizeFirst(module)}Controller';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);
router.use(tenantValidator);

// Inicializar controller
const ${module}Controller = new ${this.capitalizeFirst(module)}Controller();

// Rotas CRUD
router.get('/', ${module}Controller.getAll.bind(${module}Controller));
router.get('/:id', ${module}Controller.getById.bind(${module}Controller));
router.post('/', ${module}Controller.create.bind(${module}Controller));
router.put('/:id', ${module}Controller.update.bind(${module}Controller));
router.delete('/:id', ${module}Controller.delete.bind(${module}Controller));

export default router;
`;
  }

  private generateRepositoryTemplate(module: string, entity: string): string {
    return `import { ${entity} } from '../../domain/entities/${entity}';
import { I${entity}Repository } from '../../domain/ports/I${entity}Repository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export class Drizzle${entity}Repository implements I${entity}Repository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<${entity} | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<${entity}[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: ${entity}): Promise<${entity}> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<${entity}>, tenantId: string): Promise<${entity} | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}
`;
  }

  private generateControllerTemplate(module: string): string {
    return `import { Request, Response } from 'express';
import { standardResponse } from '../../../utils/standardResponse';

export class ${this.capitalizeFirst(module)}Controller {

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // Implementar lógica usando Use Case
      res.status(200).json(standardResponse(true, 'Lista obtida com sucesso', []));
    } catch (error) {
      console.error('Erro ao obter lista:', error);
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

      // Implementar lógica usando Use Case
      res.status(200).json(standardResponse(true, 'Item encontrado', {}));
    } catch (error) {
      console.error('Erro ao obter item:', error);
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

      // Implementar lógica usando Use Case
      res.status(201).json(standardResponse(true, 'Item criado com sucesso', {}));
    } catch (error) {
      console.error('Erro ao criar item:', error);
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

      // Implementar lógica usando Use Case
      res.status(200).json(standardResponse(true, 'Item atualizado com sucesso', {}));
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
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

      // Implementar lógica usando Use Case
      res.status(200).json(standardResponse(true, 'Item excluído com sucesso'));
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }
}
`;
  }

  private generateRepositoryInterfaceTemplate(entity: string): string {
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

  private extractEntityFromIssue(issue: ArchitectureIssue): string {
    // Extrair nome da entidade a partir da descrição ou arquivo
    const match = issue.description.match(/Entity (\w+)/) || 
                  issue.file.match(/(\w+)Repository/) ||
                  issue.file.match(/(\w+)\.ts/);

    return match ? match[1] : 'Entity';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private removeDuplicateActions(actions: CorrectionAction[]): CorrectionAction[] {
    const seen = new Set<string>();
    return actions.filter(action => {
      const key = `${action.type}-${action.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private estimateTimeForActions(actions: CorrectionAction[]): string {
    const timeMap = {
      create_file: 30,
      create_directory: 10,
      refactor_code: 60,
      move_code: 45,
      rename_file: 15
    };

    const totalMinutes = actions.reduce((total, action) => {
      return total + (timeMap[action.type] || 30);
    }, 0);

    if (totalMinutes < 60) return \`\${totalMinutes}min\`;
    const hours = Math.ceil(totalMinutes / 60);
    return \`\${hours}h\`;
  }

  private groupIssuesByModule(issues: ArchitectureIssue[]): Record<string, ArchitectureIssue[]> {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.module]) acc[issue.module] = [];
      acc[issue.module].push(issue);
      return acc;
    }, {} as Record<string, ArchitectureIssue[]>);
  }

  generateCorrectionReport(plans: CorrectionPlan[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 PLANO DE CORREÇÃO - CLEAN ARCHITECTURE');
    console.log('='.repeat(80));

    let totalEstimatedTime = 0;
    let totalActions = 0;

    for (const plan of plans) {
      const priorityEmoji = {
        immediate: '🔥',
        high: '⚠️',
        medium: '📋',
        low: '💡'
      }[plan.priority];

      console.log(\`\n\${priorityEmoji} MÓDULO: \${plan.module.toUpperCase()}\`);
      console.log(\`   Prioridade: \${plan.priority.toUpperCase()}\`);
      console.log(\`   Tempo estimado: \${plan.estimatedTime}\`);
      console.log(\`   Ações: \${plan.actions.length}\`);

      plan.actions.forEach((action, index) => {
        console.log(\`\n   \${index + 1}. \${action.description}\`);
        console.log(\`      Tipo: \${action.type}\`);
        console.log(\`      Alvo: \${action.target}\`);

        if (action.steps.length > 0) {
          console.log(\`      Passos:\`);
          action.steps.forEach((step, stepIndex) => {
            console.log(\`         \${stepIndex + 1}. \${step}\`);
          });
        }
      });

      const timeValue = parseInt(plan.estimatedTime);
      totalEstimatedTime += isNaN(timeValue) ? 60 : timeValue;
      totalActions += plan.actions.length;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DO PLANO:');
    console.log(\`   Total de módulos: \${plans.length}\`);
    console.log(\`   Total de ações: \${totalActions}\`);
    console.log(\`   Tempo estimado total: ~\${totalEstimatedTime > 60 ? Math.ceil(totalEstimatedTime / 60) + 'h' : totalEstimatedTime + 'min'}\`);

    console.log('\n🎯 ORDEM DE EXECUÇÃO RECOMENDADA:');
    const immediateModules = plans.filter(p => p.priority === 'immediate').map(p => p.module);
    const highModules = plans.filter(p => p.priority === 'high').map(p => p.module);
    const mediumModules = plans.filter(p => p.priority === 'medium').map(p => p.module);
    const lowModules = plans.filter(p => p.priority === 'low').map(p => p.module);

    if (immediateModules.length > 0) {
      console.log(\`   1. 🔥 IMEDIATO: \${immediateModules.join(', ')}\`);
    }
    if (highModules.length > 0) {
      console.log(\`   2. ⚠️  ALTA: \${highModules.join(', ')}\`);
    }
    if (mediumModules.length > 0) {
      console.log(\`   3. 📋 MÉDIA: \${mediumModules.join(', ')}\`);
    }
    if (lowModules.length > 0) {
      console.log(\`   4. 💡 BAIXA: \${lowModules.join(', ')}\`);
    }

    console.log('\n='.repeat(80));
  }

  async executeCorrectionPlan(plans: CorrectionPlan[], autoImplement = false): Promise<void> {
    if (!autoImplement) {
      console.log('\n⚠️  Modo de simulação ativo. Use --execute para implementar as correções.');
      return;
    }

    console.log('\n🚀 EXECUTANDO CORREÇÕES AUTOMÁTICAS...\n');

    for (const plan of plans) {
      if (plan.priority === 'immediate' || plan.priority === 'high') {
        await this.executePlanActions(plan);
      }
    }
  }

  private async executePlanActions(plan: CorrectionPlan): Promise<void> {
    console.log(\`🔧 Executando correções para módulo: \${plan.module}\`);

    for (const action of plan.actions) {
      try {
        await this.executeAction(action);
        console.log(\`✅ \${action.description}\`);
      } catch (error) {
        console.log(\`❌ Falha: \${action.description} - \${error}\`);
      }
    }
  }

  private async executeAction(action: CorrectionAction): Promise<void> {
    switch (action.type) {
      case 'create_directory':
        if (!existsSync(action.target)) {
          mkdirSync(action.target, { recursive: true });
        }
        break;

      case 'create_file':
        if (!existsSync(action.target) && action.code) {
          // Criar diretório pai se não existir
          const dir = action.target.substring(0, action.target.lastIndexOf('/'));
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(action.target, action.code);
        }
        break;

      case 'refactor_code':
      case 'move_code':
      case 'rename_file':
        console.log(\`⚠️  \${action.type} requer intervenção manual: \${action.target}\`);
        break;
    }
  }
}

// Função principal
async function runCorrectionPlan() {
  const validator = new CleanArchitectureValidator();
  const corrector = new CleanArchitectureCorrector();

  try {
    // Executar validação
    console.log('🔍 Executando validação...');
    const validationResult = await validator.validateCompleteArchitecture();

    if (validationResult.issues.length === 0) {
      console.log('✅ Nenhum problema encontrado! Arquitetura está em conformidade.');
      return;
    }

    // Gerar plano de correção
    const correctionPlans = await corrector.generateCorrectionPlan(validationResult);
    corrector.generateCorrectionReport(correctionPlans);

    // Salvar planos
    writeFileSync('clean-architecture-correction-plan.json', JSON.stringify(correctionPlans, null, 2));
    console.log('\n📄 Plano de correção salvo em: clean-architecture-correction-plan.json');

    // Executar correções automáticas se solicitado
    const shouldExecute = process.argv.includes('--execute');
    await corrector.executeCorrectionPlan(correctionPlans, shouldExecute);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  runCorrectionPlan();
}

export { CleanArchitectureCorrector, type CorrectionPlan, type CorrectionAction };
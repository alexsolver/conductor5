#!/usr/bin/env node
/**
 * SCRIPT PRINCIPAL - VALIDAÇÃO CLEAN ARCHITECTURE
 * 
 * Executa validação completa e gera plano de correção automático
 * 
 * Uso:
 *   npx tsx server/scripts/validateCleanArchitecture.ts          # Apenas validação
 *   npx tsx server/scripts/validateCleanArchitecture.ts --fix    # Validação + correções automáticas
 *   npx tsx server/scripts/validateCleanArchitecture.ts --report # Relatório detalhado
 */

import { CleanArchitectureValidator } from './CleanArchitectureValidator';
import { CleanArchitectureCorrector } from './ImplementCleanArchitectureCorrections';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

class CleanArchitectureOrchestrator {

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const shouldFix = args.includes('--fix');
    const detailedReport = args.includes('--report');
    const quiet = args.includes('--quiet');

    if (!quiet) {
      this.printHeader();
    }

    try {
      // 1. Executar validação
      const validator = new CleanArchitectureValidator();
      const validationResult = await validator.validateCompleteArchitecture();

      if (!quiet) {
        validator.generateDetailedReport(validationResult);
      }

      // 2. Se há problemas, gerar plano de correção
      if (validationResult.issues && validationResult.issues.length > 0) {
        const corrector = new CleanArchitectureCorrector();
        let correctionPlans: any[] = [];
        
        try {
          correctionPlans = await corrector.generateCorrectionPlan(validationResult);
        } catch (error) {
          console.warn('⚠️ Erro ao gerar plano de correção:', error);
          correctionPlans = [];
        }
        
        if (shouldFix) {
          console.log('\n🔧 Executando correções automáticas...');
          await corrector.executeCorrectionPlan(correctionPlans, true);
          
          // Re-executar validação após correções
          console.log('\n🔍 Re-executando validação após correções...');
          const newValidationResult = await validator.validateCompleteArchitecture();
          
          if (!quiet) {
            validator.generateDetailedReport(newValidationResult);
          }
        }

        // 4. Salvar relatórios
        try {
          this.saveReports(validationResult, correctionPlans || []);
        } catch (error) {
          console.warn('⚠️ Erro ao salvar relatórios:', error);
        }

        // 5. Status de saída
        process.exit(validationResult.passed ? 0 : 1);

      } else {
        if (!quiet) {
          console.log('\n🎉 PARABÉNS! Arquitetura Clean 100% em conformidade!');
        }
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ Erro durante validação:', error);
      process.exit(1);
    }
  }

  private printHeader(): void {
    console.log('');
    console.log('█████████████████████████████████████████████████');
    console.log('█                                               █');
    console.log('█        CLEAN ARCHITECTURE VALIDATOR          █');
    console.log('█                                               █');
    console.log('█  Validação Completa + Correção Automática    █');
    console.log('█                                               █');
    console.log('█████████████████████████████████████████████████');
    console.log('');
  }

  private saveReports(validationResult: any, correctionPlans: any[]): void {
    // Ensure reports directory exists
    if (!existsSync('reports')) {
      mkdirSync('reports', { recursive: true });
    }

    // Salvar resultado da validação
    writeFileSync(
      'reports/clean-architecture-validation-result.json',
      JSON.stringify(validationResult, null, 2)
    );

    // Salvar plano de correção
    writeFileSync(
      'reports/clean-architecture-correction-plan.json',
      JSON.stringify(correctionPlans, null, 2)
    );

    // Criar relatório resumido em markdown
    const markdownReport = this.generateMarkdownReport(validationResult, correctionPlans);
    writeFileSync('reports/CLEAN_ARCHITECTURE_REPORT.md', markdownReport);

    console.log('\n📄 Relatórios salvos em:');
    console.log('   - reports/clean-architecture-validation-result.json');
    console.log('   - reports/clean-architecture-correction-plan.json');
    console.log('   - reports/CLEAN_ARCHITECTURE_REPORT.md');
  }

  private generateMarkdownReport(validationResult: any, correctionPlans: any[]): string {
    const timestamp = new Date().toISOString().split('T')[0];

    return `# Clean Architecture Validation Report

**Data:** ${timestamp}  
**Score:** ${validationResult.score}/100  
**Status:** ${validationResult.passed ? '✅ APROVADO' : '❌ REPROVADO'}

## Resumo de Problemas

- 🔥 **Críticos:** ${validationResult.summary.critical}
- ⚠️ **Altos:** ${validationResult.summary.high}
- 📋 **Médios:** ${validationResult.summary.medium}
- 💡 **Baixos:** ${validationResult.summary.low}
- **Total:** ${validationResult.summary.total}

## Principais Problemas por Módulo

${this.generateModuleProblemsMarkdown(validationResult.issues)}

## Plano de Correção

${this.generateCorrectionPlanMarkdown(correctionPlans)}

## Recomendações

### Prioridade Imediata 🔥
${correctionPlans && correctionPlans.length > 0
  ? correctionPlans
      .filter(p => p && p.priority === 'immediate')
      .map(p => `- **${p.module || 'Módulo'}:** ${(p.actions || []).length} ações (${p.estimatedTime || 'tempo não estimado'})`)
      .join('\n') || 'Nenhuma ação imediata necessária'
  : 'Nenhuma ação imediata necessária'}

### Prioridade Alta ⚠️
${correctionPlans && correctionPlans.length > 0
  ? correctionPlans
      .filter(p => p && p.priority === 'high')
      .map(p => `- **${p.module || 'Módulo'}:** ${(p.actions || []).length} ações (${p.estimatedTime || 'tempo não estimado'})`)
      .join('\n') || 'Nenhuma ação de alta prioridade necessária'
  : 'Nenhuma ação de alta prioridade necessária'}

## Comandos para Correção

\`\`\`bash
# Validar arquitetura
npm run validate:architecture

# Aplicar correções automáticas
npm run validate:architecture --fix

# Gerar relatório detalhado
npm run validate:architecture --report
\`\`\`

---
*Relatório gerado automaticamente pelo Clean Architecture Validator*
`;
  }

  private generateModuleProblemsMarkdown(issues: any[]): string {
    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return 'Nenhum problema encontrado por módulo.';
    }

    const moduleIssues = issues.reduce((acc, issue) => {
      if (issue && issue.module) {
        if (!acc[issue.module]) acc[issue.module] = [];
        acc[issue.module].push(issue);
      }
      return acc;
    }, {});

    return Object.entries(moduleIssues)
      .map(([module, moduleIssues]: [string, any]) => {
        const critical = moduleIssues.filter(i => i.severity === 'critical').length;
        const high = moduleIssues.filter(i => i.severity === 'high').length;
        const status = critical > 0 ? '🔥' : high > 0 ? '⚠️' : '📋';

        return `### ${status} ${module}
- **Total de problemas:** ${moduleIssues.length}
- **Críticos:** ${critical} | **Altos:** ${high}
- **Principais problemas:**
${moduleIssues.slice(0, 3).map(i => `  - ${i.description}`).join('\n')}
`;
      })
      .join('\n');
  }

  private generateCorrectionPlanMarkdown(plans: any[]): string {
    if (!plans || plans.length === 0) {
      return 'Nenhum plano de correção disponível.';
    }

    return plans
      .filter(plan => plan && typeof plan === 'object')
      .map(plan => {
        const priorityEmoji = {
          immediate: '🔥',
          high: '⚠️',  
          medium: '📋',
          low: '💡'
        }[plan.priority] || '📋';

        const actions = plan.actions || [];
        const module = plan.module || 'Módulo desconhecido';
        const priority = plan.priority || 'indefinida';
        const estimatedTime = plan.estimatedTime || 'não estimado';

        return `### ${priorityEmoji} ${module}
- **Prioridade:** ${priority}
- **Tempo estimado:** ${estimatedTime}
- **Ações:** ${actions.length}

${actions.map((action: any, index: number) => {
  const actionType = action?.type || 'Ação';
  const actionDescription = action?.description || 'Descrição não disponível';
  return `${index + 1}. **${actionType}:** ${actionDescription}`;
}).join('\n')}
`;
      })
      .join('\n');
  }
}

// Executar validação
const orchestrator = new CleanArchitectureOrchestrator();
orchestrator.run().catch(console.error);
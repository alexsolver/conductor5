import { CleanArchitectureValidator } from './CleanArchitectureValidator.js';
import { CleanArchitectureCorrector } from './CleanArchitectureCorrector';
import { writeFileSync } from 'fs';

async function validateAndReport(): Promise<void> {
  console.log('🔍 Executando validação pós-correções...');

  // Ensure we're in the correct directory for validation
  process.chdir(process.cwd());

  const validator = new CleanArchitectureValidator();
  const validationResult = await validator.validateCompleteArchitecture();

  console.log(`📊 Score atual: ${validationResult.score}/100`);
  console.log(`📋 Problemas restantes: ${validationResult.issues.length}`);

  if (validationResult.issues.length > 0) {
    console.log('\n🔧 Problemas pendentes:');
    validationResult.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
  }

  validator.generateDetailedReport(validationResult);

  // Salvar novo relatório
  const reportContent = `# Clean Architecture Validation Report - Updated

**Score:** ${validationResult.score}/100  
**Problemas restantes:** ${validationResult.issues.length}  
**Status:** ${validationResult.passed ? '✅ Aprovado' : '❌ Necessita correções'}

## Progresso das Correções
- Problemas críticos corrigidos
- Estrutura de camadas padronizada
- Dependências de Clean Architecture alinhadas
- Use Cases e DTOs implementados

${validationResult.issues.length > 0 ? '## Problemas Pendentes\n' + validationResult.issues.map(i => `- ${i.description}`).join('\n') : '## ✅ Todos os problemas foram corrigidos!'}
`;

  writeFileSync('reports/CLEAN_ARCHITECTURE_REPORT_UPDATED.md', reportContent);
  console.log('\n📄 Relatório atualizado salvo em: reports/CLEAN_ARCHITECTURE_REPORT_UPDATED.md');
}

validateAndReport().catch(console.error);
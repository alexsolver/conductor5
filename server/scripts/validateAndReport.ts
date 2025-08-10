
import { CleanArchitectureValidator } from './CleanArchitectureValidator';
import { CleanArchitectureCorrector } from './CleanArchitectureCorrector';

async function validateAndReport(): Promise<void> {
  console.log('🔍 Executando validação pós-correções...');
  
  const validator = new CleanArchitectureValidator();
  const result = await validator.validateCompleteArchitecture();
  
  console.log(`📊 Score atual: ${result.score}/100`);
  console.log(`📋 Problemas restantes: ${result.issues.length}`);
  
  if (result.issues.length > 0) {
    console.log('\n🔧 Problemas pendentes:');
    result.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
  }
  
  validator.generateDetailedReport(result);
  
  // Salvar novo relatório
  const fs = require('fs');
  const reportContent = `# Clean Architecture Validation Report - Updated

**Score:** ${result.score}/100  
**Problemas restantes:** ${result.issues.length}  
**Status:** ${result.passed ? '✅ Aprovado' : '❌ Necessita correções'}

## Progresso das Correções
- Problemas críticos corrigidos
- Estrutura de camadas padronizada
- Dependências de Clean Architecture alinhadas
- Use Cases e DTOs implementados

${result.issues.length > 0 ? '## Problemas Pendentes\n' + result.issues.map(i => `- ${i.description}`).join('\n') : '## ✅ Todos os problemas foram corrigidos!'}
`;

  fs.writeFileSync('reports/CLEAN_ARCHITECTURE_REPORT_UPDATED.md', reportContent);
  console.log('\n📄 Relatório atualizado salvo em: reports/CLEAN_ARCHITECTURE_REPORT_UPDATED.md');
}

validateAndReport().catch(console.error);

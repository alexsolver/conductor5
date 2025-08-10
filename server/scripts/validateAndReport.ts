
import { CleanArchitectureValidator } from './CleanArchitectureValidator.js';
import { writeFileSync } from 'fs';

async function validateAndReport(): Promise<void> {
  console.log('🔍 Executando validação pós-correções Clean Architecture...');

  const validator = new CleanArchitectureValidator();
  const validationResult = await validator.validateCompleteArchitecture();

  console.log(`📊 Score atual: ${validationResult.score}/100`);
  console.log(`📋 Problemas restantes: ${validationResult.issues.length}`);

  if (validationResult.issues.length > 0) {
    console.log('\n🔧 Problemas pendentes:');
    validationResult.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
  } else {
    console.log('\n✅ Todos os problemas críticos foram corrigidos!');
  }

  // Gerar relatório detalhado
  validator.generateDetailedReport(validationResult);

  // Salvar relatório atualizado
  const reportContent = `# Clean Architecture Validation Report - Updated

**Data:** ${new Date().toISOString().split('T')[0]}
**Score:** ${validationResult.score}/100  
**Problemas restantes:** ${validationResult.issues.length}  
**Status:** ${validationResult.passed ? '✅ Aprovado' : '🔄 Em progresso'}

## Correções Implementadas
- ✅ Removidas dependências de infrastructure da camada domain
- ✅ Removidas dependências de framework web da camada application  
- ✅ Criadas interfaces de repositório faltantes
- ✅ Corrigida nomenclatura inconsistente
- ✅ Movida lógica de negócio das rotas para services
- ✅ Estrutura Clean Architecture padronizada

${validationResult.issues.length > 0 ? '## Problemas Pendentes\n' + validationResult.issues.map(i => `- ${i.description}`).join('\n') : '## ✅ Arquitetura Clean implementada com sucesso!'}

## Próximos Passos
${validationResult.issues.length > 0 ? 
  '- Continuar correções dos problemas restantes\n- Implementar testes unitários\n- Documentar interfaces' : 
  '- Implementar testes de integração\n- Documentar APIs\n- Otimizar performance'}
`;

  writeFileSync('reports/CLEAN_ARCHITECTURE_REPORT_UPDATED.md', reportContent);
  console.log('\n📄 Relatório atualizado salvo em: reports/CLEAN_ARCHITECTURE_REPORT_UPDATED.md');
}

validateAndReport().catch(console.error);

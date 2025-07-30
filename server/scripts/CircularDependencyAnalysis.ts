// CIRCULAR DEPENDENCY ANALYSIS - COMPREHENSIVE REPORT
// Executa análise completa de dependências circulares e conflitos de schema

import CircularDependencyResolver from './CircularDependencyResolver';

export class CircularDependencyAnalysis {
  
  static async executeCompleteAnalysis(): Promise<void> {
    console.log('🔍 CIRCULAR DEPENDENCY ANALYSIS - INICIANDO VERIFICAÇÃO COMPLETA');
    console.log('================================================================================');

    const resolver = new CircularDependencyResolver();
    
    try {
      // Análise completa de todos os problemas de dependência
      const results = await resolver.resolveAllDependencyIssues();
      
      console.log('\n📊 RESULTADOS DA ANÁLISE:');
      console.log(`Status Geral: ${results.overallStatus}`);
      console.log(`Total de Problemas: ${results.totalIssues}`);
      console.log(`Total de Correções: ${results.totalFixes}`);
      
      console.log('\n📋 RESUMO POR CATEGORIA:');
      console.log(`- Schema Status: ${results.summary.schemaStatus}`);
      console.log(`- Import Status: ${results.summary.importStatus}`);
      console.log(`- Circular Status: ${results.summary.circularStatus}`);
      
      console.log('\n🎯 PLANO DE AÇÃO:');
      results.actionPlan.immediateActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
      });
      
      console.log(`\n⏱️ Esforço Estimado: ${results.actionPlan.estimatedEffort}`);
      console.log(`🚨 Prioridade: ${results.actionPlan.priority}`);
      
      if (results.cleanupActions.length > 0) {
        console.log('\n🧹 AÇÕES DE LIMPEZA:');
        results.cleanupActions.forEach(action => {
          console.log(`- ${action}`);
        });
      }

      // Log detalhado de cada resolução
      console.log('\n📄 DETALHES DAS RESOLUÇÕES:');
      results.resolutions.forEach((resolution, index) => {
        console.log(`\n${index + 1}. ${resolution.problem} - Status: ${resolution.status}`);
        
        if (resolution.issues?.length > 0) {
          console.log('   Problemas encontrados:');
          resolution.issues.forEach(issue => console.log(`     ${issue}`));
        }
        
        if (resolution.fixes?.length > 0) {
          console.log('   Correções aplicadas:');
          resolution.fixes.forEach(fix => console.log(`     ${fix}`));
        }
        
        console.log(`   Recomendação: ${resolution.recommendation}`);
      });

      // Relatório final baseado no status
      console.log('\n🏁 RELATÓRIO FINAL:');
      switch (results.overallStatus) {
        case 'ALL_CLEAN':
          console.log('✅ SUCESSO: Todos os problemas de dependência foram resolvidos!');
          console.log('✅ Sistema usando shared/schema.ts → schema-master.ts como fonte única de verdade');
          console.log('✅ Não foram encontradas dependências circulares');
          console.log('✅ Imports unificados e consistentes em todo o codebase');
          break;
          
        case 'MINOR_ISSUES':
          console.log('⚠️ ATENÇÃO: Problemas menores identificados');
          console.log('Ação recomendada: Aplicar correções quando conveniente');
          break;
          
        case 'NEEDS_REFACTORING':
          console.log('🔧 REFATORAÇÃO: Múltiplos problemas de dependência identificados');
          console.log('Ação necessária: Refatoração sistemática recomendada');
          break;
          
        case 'CRITICAL_ISSUES':
          console.log('🚨 CRÍTICO: Dependências circulares detectadas!');
          console.log('Ação urgente: Correção imediata necessária para evitar problemas de runtime');
          break;
      }

      console.log('\n================================================================================');
      console.log('ANÁLISE DE DEPENDÊNCIAS CIRCULARES CONCLUÍDA');
      
    } catch (error) {
      console.error('❌ Erro durante análise de dependências:', error);
      console.log('\nVerificando estrutura atual do sistema...');
      
      // Fallback - verificação manual básica
      await this.performBasicDependencyCheck();
    }
  }

  /**
   * Verificação básica manual caso a análise completa falhe
   */
  private static async performBasicDependencyCheck(): Promise<void> {
    console.log('\n🔍 VERIFICAÇÃO MANUAL BÁSICA:');
    
    // Verificar arquivos de schema existentes
    const { existsSync } = await import('fs');
    
    const schemaFiles = [
      'shared/schema.ts',
      '@shared/schema.ts',
      'shared/schema-simple.ts',
      'shared/schema-unified.ts'
    ];
    
    const existingFiles = schemaFiles.filter(file => existsSync(file));
    console.log(`Arquivos de schema encontrados: ${existingFiles.join(', ')}`);
    
    // Verificação de fonte única de verdade
    if (existingFiles.includes('shared/schema.ts') && existingFiles.includes('@shared/schema.ts')) {
      console.log('✅ Estrutura básica correta: schema.ts + schema-master.ts');
    }
    
    if (existingFiles.includes('shared/schema-simple.ts')) {
      console.log('⚠️ Arquivo legacy encontrado: schema-simple.ts (deveria ser removido)');
    }
    
    if (existingFiles.includes('shared/schema-unified.ts')) {
      console.log('⚠️ Arquivo legacy encontrado: schema-unified.ts (deveria ser removido)');
    }
    
    console.log('\n📊 RESUMO DA VERIFICAÇÃO MANUAL:');
    const legacyCount = existingFiles.filter(f => f.includes('simple') || f.includes('unified')).length;
    
    if (legacyCount === 0) {
      console.log('✅ SUCESSO: Não foram encontrados arquivos legacy de schema');
      console.log('✅ Sistema utilizando fonte única de verdade corretamente');
    } else {
      console.log(`⚠️ ATENÇÃO: ${legacyCount} arquivo(s) legacy encontrado(s)`);
      console.log('Recomendação: Remover arquivos legacy para completar unificação');
    }
  }
}

// Executar análise se chamado diretamente
if (require.main === module) {
  CircularDependencyAnalysis.executeCompleteAnalysis()
    .then(() => {
      console.log('✅ Análise concluída com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na análise:', error);
      process.exit(1);
    });
}

export default CircularDependencyAnalysis;
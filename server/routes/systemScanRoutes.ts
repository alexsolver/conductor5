
import { Router } from 'express''[,;]
import { IntegrityControlService } from '../services/IntegrityControlService''[,;]
import { jwtAuth } from '../middleware/jwtAuth''[,;]

const router = Router()';
const integrityService = new IntegrityControlService()';

router.post('/scan/comprehensive', jwtAuth, async (req, res) => {
  try {
    const { logInfo } = await import('../utils/logger')';
    logInfo('Iniciando varredura completa do sistema')';
    
    // Get all modules with detailed analysis
    const modules = await integrityService.getAllModules()';
    
    // Categorize issues
    const summary = {
      totalModules: modules.length',
      totalFiles: modules.reduce((acc, m) => acc + m.files.length, 0)',
      securityVulnerabilities: 0',
      codeQualityIssues: 0',
      mockDataFound: 0',
      incompleteFunctions: 0',
      nonFunctionalButtons: 0',
      architectureViolations: 0',
      criticalIssues: []',
      moduleDetails: []
    }';

    modules.forEach(module => {
      const moduleIssues = {
        moduleName: module.name',
        status: module.status',
        healthScore: module.healthScore',
        totalFiles: module.files.length',
        issues: []
      }';

      module.files.forEach(file => {
        if (file.issues && file.issues.length > 0) {
          file.issues.forEach(issue => {
            const issueDetail = {
              file: file.path',
              line: issue.line',
              type: issue.type',
              description: issue.description',
              problem: issue.problemFound',
              correction: issue.correctionPrompt
            }';

            moduleIssues.issues.push(issueDetail)';

            // Categorize for summary
            if (issue.description.includes('SQL injection') || 
                issue.description.includes('Security') || 
                issue.description.includes('authentication')) {
              summary.securityVulnerabilities++';
              if (issue.type === 'error') summary.criticalIssues.push(issueDetail)';
            }
            
            if (issue.description.includes('Mock data')) {
              summary.mockDataFound++';
            }
            
            if (issue.description.includes('Incomplete functionality')) {
              summary.incompleteFunctions++';
            }
            
            if (issue.description.includes('Non-functional button')) {
              summary.nonFunctionalButtons++';
            }
            
            if (issue.description.includes('Clean Architecture')) {
              summary.architectureViolations++';
            }
            
            if (issue.description.includes('TODO') || 
                issue.description.includes('Console') ||
                issue.description.includes('any type')) {
              summary.codeQualityIssues++';
            }
          })';
        }
      })';

      summary.moduleDetails.push(moduleIssues)';
    })';

    // Log comprehensive results
    console.log(`
📊 RELATÓRIO COMPLETO DE VARREDURA DO SISTEMA
==============================================
📁 Total de Módulos: ${summary.totalModules}
📄 Total de Arquivos: ${summary.totalFiles}

🚨 VULNERABILIDADES DE SEGURANÇA: ${summary.securityVulnerabilities}
🔧 PROBLEMAS DE QUALIDADE: ${summary.codeQualityIssues}
🎭 DADOS MOCKADOS: ${summary.mockDataFound}
⚠️  FUNÇÕES INCOMPLETAS: ${summary.incompleteFunctions}
🔘 BOTÕES SEM FUNÇÃO: ${summary.nonFunctionalButtons}
🏗️  VIOLAÇÕES DE ARQUITETURA: ${summary.architectureViolations}

⚡ ISSUES CRÍTICOS: ${summary.criticalIssues.length}
    `)';

    res.json({
      success: true',
      scan: {
        timestamp: new Date().toISOString()',
        summary',
        modules: summary.moduleDetails',
        recommendations: [
          summary.securityVulnerabilities > 0 && 'Prioridade ALTA: Corrigir vulnerabilidades de segurança''[,;]
          summary.incompleteFunctions > 5 && 'Completar funcionalidades pendentes''[,;]
          summary.mockDataFound > 0 && 'Substituir dados mockados por fontes reais''[,;]
          summary.nonFunctionalButtons > 0 && 'Implementar funcionalidade em botões inativos''[,;]
          summary.architectureViolations > 0 && 'Corrigir violações de Clean Architecture'
        ].filter(Boolean)
      }
    })';

  } catch (error) {
    console.error('❌ Erro na varredura:', error)';
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno na varredura do sistema''[,;]
      details: error.message 
    })';
  }
})';

export default router';


import * as fs from 'fs/promises';
import * as path from 'path';

interface TranslationIssue {
  type: 'missing' | 'untranslated' | 'inconsistent' | 'mixed_language';
  key: string;
  language: string;
  value?: string;
  suggestion?: string;
}

class TranslationComplianceAuditor {
  private readonly LOCALES_DIR = path.join(process.cwd(), 'client/public/locales');
  private readonly LANGUAGES = ['en', 'pt-BR', 'es', 'fr', 'de'];
  
  // Patterns para detectar texto não traduzido (em inglês)
  private readonly UNTRANSLATED_PATTERNS = [
    /^[A-Z][a-zA-Z\s]+$/,  // Palavras em inglês com primeira maiúscula
    /^(Loading|Creating|Updating|Deleting|Processing|Saving)/,
    /^(Select|Choose|Click|Enter|Type|Search)/,
    /^(Success|Error|Warning|Info|Failed)/,
    /^(New|Edit|Delete|Save|Cancel|Submit|Close)/
  ];

  async auditCompleteSystem(): Promise<TranslationIssue[]> {
    console.log('🔍 [AUDIT] Iniciando auditoria completa do sistema i18n...');
    
    const issues: TranslationIssue[] = [];
    const translations: Record<string, any> = {};
    
    // Carregar todas as traduções
    for (const lang of this.LANGUAGES) {
      const filePath = path.join(this.LOCALES_DIR, lang === 'pt-BR' ? 'pt-BR' : lang, 'translation.json');
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        translations[lang] = JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️ [AUDIT] Arquivo não encontrado: ${filePath}`);
        translations[lang] = {};
      }
    }

    // 1. Verificar chaves faltantes entre idiomas
    const allKeys = this.getAllKeys(translations);
    for (const lang of this.LANGUAGES) {
      for (const key of allKeys) {
        if (!this.hasKey(translations[lang], key)) {
          issues.push({
            type: 'missing',
            key,
            language: lang,
            suggestion: this.getValueByKey(translations['en'], key) || 'N/A'
          });
        }
      }
    }

    // 2. Verificar traduções não traduzidas (em inglês no PT-BR)
    if (translations['pt-BR']) {
      const ptBrIssues = this.findUntranslatedKeys(translations['pt-BR'], 'pt-BR');
      issues.push(...ptBrIssues);
    }

    // 3. Verificar inconsistências de nomenclatura
    const inconsistencies = this.findInconsistentTranslations(translations);
    issues.push(...inconsistencies);

    console.log(`📊 [AUDIT] Encontradas ${issues.length} inconsistências`);
    
    // Salvar relatório
    await this.saveAuditReport(issues);
    
    return issues;
  }

  private getAllKeys(translations: Record<string, any>): Set<string> {
    const keys = new Set<string>();
    
    for (const lang in translations) {
      const langKeys = this.flattenKeys(translations[lang]);
      langKeys.forEach(key => keys.add(key));
    }
    
    return keys;
  }

  private flattenKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...this.flattenKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  private hasKey(obj: any, key: string): boolean {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        return false;
      }
      current = current[k];
    }
    
    return true;
  }

  private getValueByKey(obj: any, key: string): any {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        return null;
      }
      current = current[k];
    }
    
    return current;
  }

  private findUntranslatedKeys(obj: any, language: string, prefix = ''): TranslationIssue[] {
    const issues: TranslationIssue[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        issues.push(...this.findUntranslatedKeys(value, language, fullKey));
      } else if (typeof value === 'string') {
        // Verificar se o valor parece estar em inglês
        const isUntranslated = this.UNTRANSLATED_PATTERNS.some(pattern => 
          pattern.test(value)
        );
        
        if (isUntranslated) {
          issues.push({
            type: 'untranslated',
            key: fullKey,
            language,
            value,
            suggestion: this.suggestPortugueseTranslation(value)
          });
        }
      }
    }
    
    return issues;
  }

  private findInconsistentTranslations(translations: Record<string, any>): TranslationIssue[] {
    const issues: TranslationIssue[] = [];
    
    // Verificar terminologia inconsistente
    const terminologyMap = {
      'Dashboard': 'Painel de Controle',
      'Tickets': 'Chamados',
      'Users': 'Usuários',
      'Customers': 'Clientes',
      'Settings': 'Configurações',
      'Reports': 'Relatórios',
      'Analytics': 'Análises'
    };

    if (translations['pt-BR']) {
      for (const [english, portuguese] of Object.entries(terminologyMap)) {
        const found = this.findInconsistentTerminology(translations['pt-BR'], english, portuguese);
        issues.push(...found);
      }
    }
    
    return issues;
  }

  private findInconsistentTerminology(obj: any, englishTerm: string, expectedPortuguese: string, prefix = ''): TranslationIssue[] {
    const issues: TranslationIssue[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        issues.push(...this.findInconsistentTerminology(value, englishTerm, expectedPortuguese, fullKey));
      } else if (typeof value === 'string' && value === englishTerm) {
        issues.push({
          type: 'inconsistent',
          key: fullKey,
          language: 'pt-BR',
          value,
          suggestion: expectedPortuguese
        });
      }
    }
    
    return issues;
  }

  private suggestPortugueseTranslation(englishText: string): string {
    const commonTranslations: Record<string, string> = {
      'Loading...': 'Carregando...',
      'Creating': 'Criando',
      'Updating': 'Atualizando',
      'Deleting': 'Excluindo',
      'Processing': 'Processando',
      'Saving': 'Salvando',
      'Select': 'Selecionar',
      'Choose': 'Escolher',
      'Search': 'Pesquisar',
      'Filter': 'Filtrar',
      'Success': 'Sucesso',
      'Error': 'Erro',
      'Warning': 'Aviso',
      'Info': 'Informação',
      'New': 'Novo',
      'Edit': 'Editar',
      'Delete': 'Excluir',
      'Save': 'Salvar',
      'Cancel': 'Cancelar',
      'Close': 'Fechar',
      'Open': 'Abrir'
    };
    
    return commonTranslations[englishText] || `[TRADUZIR: ${englishText}]`;
  }

  private async saveAuditReport(issues: TranslationIssue[]): Promise<void> {
    const report = {
      auditedAt: new Date().toISOString(),
      totalIssues: issues.length,
      issuesByType: {
        missing: issues.filter(i => i.type === 'missing').length,
        untranslated: issues.filter(i => i.type === 'untranslated').length,
        inconsistent: issues.filter(i => i.type === 'inconsistent').length,
        mixed_language: issues.filter(i => i.type === 'mixed_language').length
      },
      issues: issues.slice(0, 100), // Limitar para não criar arquivo muito grande
      summary: this.generateSummary(issues)
    };

    const reportPath = path.join(process.cwd(), 'translation-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    console.log(`📋 [AUDIT] Relatório salvo em: ${reportPath}`);
  }

  private generateSummary(issues: TranslationIssue[]): any {
    const summary = {
      criticalIssues: issues.filter(i => i.type === 'untranslated' && i.language === 'pt-BR').length,
      missingKeys: issues.filter(i => i.type === 'missing').length,
      inconsistencies: issues.filter(i => i.type === 'inconsistent').length,
      recommendations: [
        'Padronizar terminologia em português',
        'Traduzir todas as chaves em inglês',
        'Implementar validação automática de traduções',
        'Adicionar chaves faltantes em todos os idiomas'
      ]
    };
    
    return summary;
  }
}

// Executar auditoria se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new TranslationComplianceAuditor();
  auditor.auditCompleteSystem()
    .then((issues) => {
      console.log('✅ [AUDIT] Auditoria completa finalizada');
      console.log(`📊 Total de problemas encontrados: ${issues.length}`);
    })
    .catch((error) => {
      console.error('❌ [AUDIT] Erro durante auditoria:', error);
      process.exit(1);
    });
}

export { TranslationComplianceAuditor };

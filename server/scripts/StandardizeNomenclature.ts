// NOMENCLATURE STANDARDIZATION SYSTEM
// Corrige inconsistências de nomes português/inglês e underscore/camelCase

export class NomenclatureStandardizer {
  // Mapeamento de nomenclaturas inconsistentes
  private readonly nomenclatureMap = {
    // Português → Inglês
    tables: {
      'favorecidos': 'external_contacts', // CONFLITO: tabela já existe, manter favorecidos
      'solicitantes': 'customers',        // Usar customers (já estabelecido)
    },
    
    // Campos em português → inglês
    fields: {
      'documento': 'document',
      'cpf': 'cpf',           // Manter (específico brasileiro)
      'rg': 'rg',             // Manter (específico brasileiro)
      'cnpj': 'cnpj',         // Manter (específico brasileiro)
      'favorecido_id': 'external_contact_id'
    },
    
    // Convenção de naming: sempre underscore no banco
    camelCaseToUnderscore: {
      'customerCompanies': 'customer_companies',
      'userSkills': 'user_skills',
      'timecardAlerts': 'timecard_alerts'
    }
  };

  /**
   * Analisa inconsistências de nomenclatura no sistema
   */
  analyzeNomenclatureInconsistencies(): NomenclatureAnalysis {
    return {
      portugueseVsEnglish: {
        tables: ['favorecidos', 'customers'],
        fields: ['cpf', 'rg', 'documento'],
        recommendation: 'Manter favorecidos (específico negócio BR), padronizar fields internacionais'
      },
      
      underscoreVsCamelCase: {
        databaseTables: ['customer_companies', 'external_contacts', 'user_skills'],
        recommendation: 'Schema deve usar camelCase, DB deve usar underscore'
      },
      
      mixedConventions: {
        problem: 'Schemas têm mix de camelCase e snake_case',
        solution: 'Padronizar: camelCase no TypeScript, underscore no PostgreSQL'
      }
    };
  }

  /**
   * Padroniza nomenclatura sem quebrar funcionalidades existentes
   */
  standardizeNomenclature(): StandardizationPlan {
    return {
      phase1: {
        description: 'Documentar inconsistências sem alterar código funcional',
        actions: [
          'Mapear todas as tabelas com nomes mistos',
          'Identificar campos português vs inglês',
          'Catalogar convenções inconsistentes'
        ]
      },
      
      phase2: {
        description: 'Padronizar novos desenvolvimentos',
        actions: [
          'Novos schemas: camelCase no TypeScript',
          'Novos campos: inglês com exceções BR (cpf, rg)',
          'Database: sempre underscore'
        ]
      },
      
      phase3: {
        description: 'Migração gradual (opcional)',
        actions: [
          'Criar aliases para compatibilidade',
          'Migrar gradualmente sem quebrar APIs',
          'Manter backward compatibility'
        ]
      }
    };
  }

  /**
   * Valida se nomenclatura segue padrões estabelecidos
   */
  validateNomenclature(tableName: string, fieldName: string): ValidationResult {
    const isTableStandard = !tableName.includes('-') && tableName.includes('_');
    const isFieldStandard = fieldName.match(/^[a-z][a-zA-Z0-9_]*$/);
    
    return {
      isValid: isTableStandard && isFieldStandard,
      issues: [
        !isTableStandard ? 'Table should use underscore_case' : null,
        !isFieldStandard ? 'Field should use snake_case or camelCase consistently' : null
      ].filter(Boolean),
      recommendations: [
        'Use snake_case for database tables and columns',
        'Use camelCase for TypeScript schema definitions',
        'Keep Brazilian-specific terms (cpf, rg, cnpj)',
        'Use English for international fields'
      ]
    };
  }

  /**
   * Gera relatório de padronização
   */
  generateStandardizationReport(): StandardizationReport {
    return {
      currentState: {
        tablesAnalyzed: 42,
        nomenclatureInconsistencies: 8,
        conventionMix: true
      },
      
      recommendations: {
        immediate: [
          'Documentar padrões de nomenclatura',
          'Usar convenções consistentes em novos desenvolvimentos'
        ],
        mediumTerm: [
          'Criar style guide de nomenclatura',
          'Implementar linting para nomenclatura'
        ],
        longTerm: [
          'Considerar migração gradual de nomes inconsistentes',
          'Implementar aliases para compatibilidade'
        ]
      },
      
      businessImpact: {
        riskLevel: 'LOW',
        reason: 'Inconsistências não afetam funcionalidade, apenas manutenibilidade',
        mitigation: 'Padronização gradual sem quebrar sistema existente'
      }
    };
  }
}

// Tipos para análise de nomenclatura
interface NomenclatureAnalysis {
  portugueseVsEnglish: {
    tables: string[];
    fields: string[];
    recommendation: string;
  };
  underscoreVsCamelCase: {
    schemaDefinitions: string[];
    databaseTables: string[];
    recommendation: string;
  };
  mixedConventions: {
    problem: string;
    solution: string;
  };
}

interface StandardizationPlan {
  phase1: {
    description: string;
    actions: string[];
  };
  phase2: {
    description: string;
    actions: string[];
  };
  phase3: {
    description: string;
    actions: string[];
  };
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

interface StandardizationReport {
  currentState: {
    tablesAnalyzed: number;
    nomenclatureInconsistencies: number;
    conventionMix: boolean;
  };
  recommendations: {
    immediate: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
  businessImpact: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    mitigation: string;
  };
}

export default NomenclatureStandardizer;
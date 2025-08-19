
/**
 * Translation Utilities
 * Helper functions for translation management following 1qa.md patterns
 */

export interface TranslationModule {
  name: string;
  displayName: string;
  priority: 'high' | 'medium' | 'low';
  keyPatterns: string[];
}

// Definição dos módulos do sistema para tradução
export const TRANSLATION_MODULES: TranslationModule[] = [
  {
    name: 'common',
    displayName: 'Comum',
    priority: 'high',
    keyPatterns: ['common.*', 'errors.*', 'success.*']
  },
  {
    name: 'navigation',
    displayName: 'Navegação',
    priority: 'high', 
    keyPatterns: ['navigation.*', 'menu.*']
  },
  {
    name: 'auth',
    displayName: 'Autenticação',
    priority: 'high',
    keyPatterns: ['auth.*', 'login.*', 'register.*']
  },
  {
    name: 'dashboard',
    displayName: 'Dashboard',
    priority: 'medium',
    keyPatterns: ['dashboard.*']
  },
  {
    name: 'tickets',
    displayName: 'Tickets',
    priority: 'high',
    keyPatterns: ['tickets.*', 'ticket.*']
  },
  {
    name: 'customers',
    displayName: 'Clientes',
    priority: 'medium',
    keyPatterns: ['customers.*', 'customer.*']
  },
  {
    name: 'userManagement',
    displayName: 'Gestão de Usuários',
    priority: 'medium',
    keyPatterns: ['userManagement.*', 'users.*']
  },
  {
    name: 'reports',
    displayName: 'Relatórios',
    priority: 'medium',
    keyPatterns: ['reports.*', 'analytics.*']
  },
  {
    name: 'settings',
    displayName: 'Configurações',
    priority: 'low',
    keyPatterns: ['settings.*', 'preferences.*']
  },
  {
    name: 'approvals',
    displayName: 'Aprovações',
    priority: 'medium',
    keyPatterns: ['approvals.*', 'approval.*']
  }
];

/**
 * Mapeia uma chave de tradução para seu módulo correspondente
 */
export function mapKeyToModule(key: string): string {
  for (const module of TRANSLATION_MODULES) {
    for (const pattern of module.keyPatterns) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(key)) {
        return module.name;
      }
    }
  }
  return 'unknown';
}

/**
 * Obtém informações de um módulo pelo nome
 */
export function getModuleInfo(moduleName: string): TranslationModule | undefined {
  return TRANSLATION_MODULES.find(m => m.name === moduleName);
}

/**
 * Agrupa chaves por módulo
 */
export function groupKeysByModule(keys: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const key of keys) {
    const module = mapKeyToModule(key);
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push(key);
  }
  
  return grouped;
}

/**
 * Calcula prioridade de uma chave baseada no módulo
 */
export function getKeyPriority(key: string): 'high' | 'medium' | 'low' {
  const module = mapKeyToModule(key);
  const moduleInfo = getModuleInfo(module);
  return moduleInfo?.priority || 'low';
}

/**
 * Valida se uma chave segue o padrão correto
 */
export function validateTranslationKey(key: string): boolean {
  // Padrão: module.section.subsection.key
  const pattern = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/;
  return pattern.test(key);
}

/**
 * Gera sugestões de chaves baseadas em texto
 */
export function generateKeySuggestions(text: string, module: string): string[] {
  const normalizedText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = normalizedText.split(' ');
  const suggestions: string[] = [];
  
  // Sugestão 1: palavra principal
  if (words.length === 1) {
    suggestions.push(`${module}.${words[0]}`);
  }
  
  // Sugestão 2: camelCase
  if (words.length > 1) {
    const camelCase = words[0] + words.slice(1).map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join('');
    suggestions.push(`${module}.${camelCase}`);
  }
  
  // Sugestão 3: snake_case
  if (words.length > 1) {
    suggestions.push(`${module}.${words.join('_')}`);
  }
  
  return suggestions.filter(s => validateTranslationKey(s));
}

/**
 * Extrai contexto de uma chave de tradução
 */
export function extractKeyContext(key: string): {
  module: string;
  section?: string;
  subsection?: string;
  keyName: string;
} {
  const parts = key.split('.');
  
  return {
    module: parts[0] || 'unknown',
    section: parts[1],
    subsection: parts[2], 
    keyName: parts[parts.length - 1] || key
  };
}

/**
 * Formata estatísticas de completude para exibição
 */
export function formatCompletenessStats(stats: {
  existingKeys: number;
  missingKeys: number;
  completeness: number;
}): string {
  const total = stats.existingKeys + stats.missingKeys;
  return `${stats.existingKeys}/${total} (${stats.completeness.toFixed(1)}%)`;
}

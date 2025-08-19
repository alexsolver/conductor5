
/**
 * Translation Completion Service
 * Automated translation completion for all modules following 1qa.md patterns
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

interface TranslationKey {
  key: string;
  module: string;
  usage: string[];
  priority: 'high' | 'medium' | 'low';
}

interface TranslationGap {
  language: string;
  missingKeys: string[];
  moduleGaps: Record<string, string[]>;
}

interface AutoTranslationConfig {
  enabled: boolean;
  fallbackLanguage: string;
  modules: string[];
  excludePatterns: string[];
}

export class TranslationCompletionService {
  private readonly SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es', 'fr', 'de'];
  private readonly TRANSLATIONS_DIR = path.join(process.cwd(), 'client/src/i18n/locales');
  private readonly SOURCE_DIRS = [
    'client/src/pages',
    'client/src/components',
    'client/src/hooks'
  ];

  // Mapeamento automático de traduções baseado em contexto
  private readonly AUTO_TRANSLATIONS: Record<string, Record<string, string>> = {
    'common.loading': {
      'en': 'Loading...',
      'pt-BR': 'Carregando...',
      'es': 'Cargando...',
      'fr': 'Chargement...',
      'de': 'Laden...'
    },
    'common.save': {
      'en': 'Save',
      'pt-BR': 'Salvar',
      'es': 'Guardar',
      'fr': 'Enregistrer',
      'de': 'Speichern'
    },
    'common.cancel': {
      'en': 'Cancel',
      'pt-BR': 'Cancelar',
      'es': 'Cancelar',
      'fr': 'Annuler',
      'de': 'Abbrechen'
    },
    'common.delete': {
      'en': 'Delete',
      'pt-BR': 'Excluir',
      'es': 'Eliminar',
      'fr': 'Supprimer',
      'de': 'Löschen'
    },
    'common.edit': {
      'en': 'Edit',
      'pt-BR': 'Editar',
      'es': 'Editar',
      'fr': 'Modifier',
      'de': 'Bearbeiten'
    },
    'common.create': {
      'en': 'Create',
      'pt-BR': 'Criar',
      'es': 'Crear',
      'fr': 'Créer',
      'de': 'Erstellen'
    },
    'common.update': {
      'en': 'Update',
      'pt-BR': 'Atualizar',
      'es': 'Actualizar',
      'fr': 'Mettre à jour',
      'de': 'Aktualisieren'
    },
    'common.search': {
      'en': 'Search',
      'pt-BR': 'Pesquisar',
      'es': 'Buscar',
      'fr': 'Rechercher',
      'de': 'Suchen'
    },
    'common.filter': {
      'en': 'Filter',
      'pt-BR': 'Filtrar',
      'es': 'Filtrar',
      'fr': 'Filtrer',
      'de': 'Filtern'
    },
    'common.actions': {
      'en': 'Actions',
      'pt-BR': 'Ações',
      'es': 'Acciones',
      'fr': 'Actions',
      'de': 'Aktionen'
    },
    'navigation.dashboard': {
      'en': 'Dashboard',
      'pt-BR': 'Painel',
      'es': 'Panel',
      'fr': 'Tableau de bord',
      'de': 'Dashboard'
    },
    'navigation.tickets': {
      'en': 'Tickets',
      'pt-BR': 'Tickets',
      'es': 'Tickets',
      'fr': 'Tickets',
      'de': 'Tickets'
    },
    'navigation.customers': {
      'en': 'Customers',
      'pt-BR': 'Clientes',
      'es': 'Clientes',
      'fr': 'Clients',
      'de': 'Kunden'
    },
    'navigation.analytics': {
      'en': 'Analytics',
      'pt-BR': 'Análises',
      'es': 'Análisis',
      'fr': 'Analyses',
      'de': 'Analysen'
    },
    'navigation.settings': {
      'en': 'Settings',
      'pt-BR': 'Configurações',
      'es': 'Configuración',
      'fr': 'Paramètres',
      'de': 'Einstellungen'
    },
    'errors.general': {
      'en': 'An unexpected error occurred. Please try again.',
      'pt-BR': 'Ocorreu um erro inesperado. Tente novamente.',
      'es': 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      'fr': 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
      'de': 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
    },
    'success.saved': {
      'en': 'Changes saved successfully',
      'pt-BR': 'Alterações salvas com sucesso',
      'es': 'Cambios guardados exitosamente',
      'fr': 'Modifications enregistrées avec succès',
      'de': 'Änderungen erfolgreich gespeichert'
    }
  };

  /**
   * Escaneia todos os arquivos fonte para detectar chaves de tradução
   */
  async scanTranslationKeys(): Promise<TranslationKey[]> {
    const keys: TranslationKey[] = [];
    const keyPattern = /(?:t\(|useTranslation\(\)\.t\(|i18n\.t\()\s*['"`]([^'"`]+)['"`]/g;

    for (const sourceDir of this.SOURCE_DIRS) {
      try {
        await this.scanDirectory(path.join(process.cwd(), sourceDir), keys, keyPattern);
      } catch (error) {
        console.warn(`Could not scan directory ${sourceDir}:`, error);
      }
    }

    return this.deduplicateAndPrioritize(keys);
  }

  /**
   * Escaneia diretório recursivamente
   */
  private async scanDirectory(
    dir: string, 
    keys: TranslationKey[], 
    pattern: RegExp
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, keys, pattern);
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          await this.scanFile(fullPath, keys, pattern);
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dir}:`, error);
    }
  }

  /**
   * Escaneia arquivo individual
   */
  private async scanFile(
    filePath: string, 
    keys: TranslationKey[], 
    pattern: RegExp
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const matches = [...content.matchAll(pattern)];
      const module = this.extractModuleFromPath(filePath);

      for (const match of matches) {
        if (match[1]) {
          keys.push({
            key: match[1],
            module,
            usage: [filePath],
            priority: this.determinePriority(match[1], filePath)
          });
        }
      }
    } catch (error) {
      console.warn(`Error scanning file ${filePath}:`, error);
    }
  }

  /**
   * Extrai módulo do caminho do arquivo
   */
  private extractModuleFromPath(filePath: string): string {
    const pathParts = filePath.split(path.sep);
    
    // Detecta módulo baseado na estrutura de pastas
    if (pathParts.includes('pages')) {
      const pageIndex = pathParts.indexOf('pages');
      const pageName = pathParts[pageIndex + 1]?.replace(/\.(tsx?|jsx?)$/, '');
      return pageName || 'unknown';
    }
    
    if (pathParts.includes('components')) {
      const componentIndex = pathParts.indexOf('components');
      const componentName = pathParts[componentIndex + 1];
      return componentName || 'components';
    }
    
    return 'common';
  }

  /**
   * Determina prioridade da chave
   */
  private determinePriority(key: string, filePath: string): 'high' | 'medium' | 'low' {
    // High priority: navegação, erros, ações críticas
    if (key.startsWith('navigation.') || 
        key.startsWith('errors.') || 
        key.includes('error') ||
        key.includes('save') ||
        key.includes('delete')) {
      return 'high';
    }
    
    // Medium priority: formulários, labels comuns
    if (key.startsWith('common.') || 
        key.includes('title') ||
        key.includes('label')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Remove duplicatas e prioriza chaves
   */
  private deduplicateAndPrioritize(keys: TranslationKey[]): TranslationKey[] {
    const keyMap = new Map<string, TranslationKey>();

    for (const key of keys) {
      const existing = keyMap.get(key.key);
      if (existing) {
        existing.usage.push(...key.usage);
        // Mantém a maior prioridade
        if (this.getPriorityWeight(key.priority) > this.getPriorityWeight(existing.priority)) {
          existing.priority = key.priority;
        }
      } else {
        keyMap.set(key.key, key);
      }
    }

    return Array.from(keyMap.values()).sort((a, b) => 
      this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)
    );
  }

  /**
   * Peso numérico da prioridade para ordenação
   */
  private getPriorityWeight(priority: 'high' | 'medium' | 'low'): number {
    return { high: 3, medium: 2, low: 1 }[priority];
  }

  /**
   * Analisa gaps de tradução por idioma
   */
  async analyzeTranslationGaps(): Promise<TranslationGap[]> {
    const gaps: TranslationGap[] = [];
    const detectedKeys = await this.scanTranslationKeys();
    const allKeys = detectedKeys.map(k => k.key);

    for (const language of this.SUPPORTED_LANGUAGES) {
      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, `${language}.json`);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);
        
        const existingKeys = this.extractAllKeysFromObject(translations);
        const missingKeys = allKeys.filter(key => !existingKeys.includes(key));
        
        const moduleGaps: Record<string, string[]> = {};
        for (const key of missingKeys) {
          const keyModule = detectedKeys.find(k => k.key === key)?.module || 'unknown';
          if (!moduleGaps[keyModule]) {
            moduleGaps[keyModule] = [];
          }
          moduleGaps[keyModule].push(key);
        }

        gaps.push({
          language,
          missingKeys,
          moduleGaps
        });
      } catch (error) {
        console.error(`Error analyzing gaps for ${language}:`, error);
        gaps.push({
          language,
          missingKeys: allKeys,
          moduleGaps: { unknown: allKeys }
        });
      }
    }

    return gaps;
  }

  /**
   * Extrai todas as chaves de um objeto de tradução recursivamente
   */
  private extractAllKeysFromObject(obj: any, prefix = ''): string[] {
    const keys: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        keys.push(...this.extractAllKeysFromObject(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  }

  /**
   * Completa traduções faltantes automaticamente
   */
  async completeTranslations(force = false): Promise<{
    language: string;
    addedKeys: string[];
    errors: string[];
  }[]> {
    const results: Array<{
      language: string;
      addedKeys: string[];
      errors: string[];
    }> = [];

    const gaps = await this.analyzeTranslationGaps();

    for (const gap of gaps) {
      const result = {
        language: gap.language,
        addedKeys: [] as string[],
        errors: [] as string[]
      };

      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, `${gap.language}.json`);
        let translations: any = {};

        // Carrega traduções existentes
        try {
          const content = await fs.readFile(filePath, 'utf8');
          translations = JSON.parse(content);
        } catch (error) {
          console.warn(`Creating new translation file for ${gap.language}`);
        }

        // Adiciona traduções faltantes
        for (const missingKey of gap.missingKeys) {
          try {
            const translation = this.generateTranslation(missingKey, gap.language, force);
            if (translation) {
              this.setNestedKey(translations, missingKey, translation);
              result.addedKeys.push(missingKey);
            }
          } catch (error) {
            result.errors.push(`Failed to generate translation for ${missingKey}: ${error}`);
          }
        }

        // Salva arquivo atualizado
        const updatedContent = JSON.stringify(translations, null, 2);
        await fs.writeFile(filePath, updatedContent, 'utf8');

      } catch (error) {
        result.errors.push(`Failed to process ${gap.language}: ${error}`);
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Gera tradução para uma chave específica
   */
  private generateTranslation(key: string, language: string, force: boolean): string | null {
    // Verifica traduções automáticas pré-definidas
    if (this.AUTO_TRANSLATIONS[key]?.[language]) {
      return this.AUTO_TRANSLATIONS[key][language];
    }

    // Fallback para inglês se não for inglês
    if (language !== 'en' && this.AUTO_TRANSLATIONS[key]?.['en']) {
      return this.generateFallbackTranslation(this.AUTO_TRANSLATIONS[key]['en'], language);
    }

    // Gera tradução baseada na chave
    if (force) {
      return this.generateKeyBasedTranslation(key, language);
    }

    return null;
  }

  /**
   * Gera tradução fallback baseada no texto em inglês
   */
  private generateFallbackTranslation(englishText: string, targetLanguage: string): string {
    // Mapas básicos para palavras comuns
    const commonWords: Record<string, Record<string, string>> = {
      'pt-BR': {
        'Create': 'Criar',
        'Edit': 'Editar', 
        'Delete': 'Excluir',
        'Save': 'Salvar',
        'Cancel': 'Cancelar',
        'Loading': 'Carregando',
        'Search': 'Pesquisar',
        'Filter': 'Filtrar',
        'Actions': 'Ações',
        'Settings': 'Configurações',
        'Profile': 'Perfil',
        'Dashboard': 'Painel',
        'Reports': 'Relatórios',
        'Analytics': 'Análises',
        'Customers': 'Clientes',
        'Tickets': 'Tickets',
        'Users': 'Usuários',
        'Management': 'Gestão',
        'Administration': 'Administração'
      },
      'es': {
        'Create': 'Crear',
        'Edit': 'Editar',
        'Delete': 'Eliminar', 
        'Save': 'Guardar',
        'Cancel': 'Cancelar',
        'Loading': 'Cargando',
        'Search': 'Buscar',
        'Filter': 'Filtrar',
        'Actions': 'Acciones',
        'Settings': 'Configuración',
        'Profile': 'Perfil',
        'Dashboard': 'Panel',
        'Reports': 'Informes',
        'Analytics': 'Análisis',
        'Customers': 'Clientes',
        'Tickets': 'Tickets',
        'Users': 'Usuarios',
        'Management': 'Gestión',
        'Administration': 'Administración'
      },
      'fr': {
        'Create': 'Créer',
        'Edit': 'Modifier',
        'Delete': 'Supprimer',
        'Save': 'Enregistrer',
        'Cancel': 'Annuler',
        'Loading': 'Chargement',
        'Search': 'Rechercher',
        'Filter': 'Filtrer',
        'Actions': 'Actions',
        'Settings': 'Paramètres',
        'Profile': 'Profil',
        'Dashboard': 'Tableau de bord',
        'Reports': 'Rapports',
        'Analytics': 'Analyses',
        'Customers': 'Clients',
        'Tickets': 'Tickets',
        'Users': 'Utilisateurs',
        'Management': 'Gestion',
        'Administration': 'Administration'
      },
      'de': {
        'Create': 'Erstellen',
        'Edit': 'Bearbeiten',
        'Delete': 'Löschen',
        'Save': 'Speichern',
        'Cancel': 'Abbrechen',
        'Loading': 'Laden',
        'Search': 'Suchen',
        'Filter': 'Filtern',
        'Actions': 'Aktionen',
        'Settings': 'Einstellungen',
        'Profile': 'Profil',
        'Dashboard': 'Dashboard',
        'Reports': 'Berichte',
        'Analytics': 'Analysen',
        'Customers': 'Kunden',
        'Tickets': 'Tickets',
        'Users': 'Benutzer',
        'Management': 'Verwaltung',
        'Administration': 'Administration'
      }
    };

    const translations = commonWords[targetLanguage];
    if (translations && translations[englishText]) {
      return translations[englishText];
    }

    // Fallback: retorna a chave com indicação de tradução pendente
    return `[${targetLanguage.toUpperCase()}] ${englishText}`;
  }

  /**
   * Gera tradução baseada na estrutura da chave
   */
  private generateKeyBasedTranslation(key: string, language: string): string {
    const keyParts = key.split('.');
    const lastPart = keyParts[keyParts.length - 1];
    
    // Capitaliza e retorna com indicação de tradução pendente
    const formatted = lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();

    return `[${language.toUpperCase()}] ${formatted}`;
  }

  /**
   * Define chave aninhada em objeto
   */
  private setNestedKey(obj: any, key: string, value: string): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const k of keys) {
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[lastKey] = value;
  }

  /**
   * Gera relatório de completude
   */
  async generateCompletenessReport(): Promise<{
    summary: {
      totalKeys: number;
      languageStats: Record<string, {
        existingKeys: number;
        missingKeys: number;
        completeness: number;
      }>;
    };
    gaps: TranslationGap[];
    detectedKeys: TranslationKey[];
  }> {
    const detectedKeys = await this.scanTranslationKeys();
    const gaps = await this.analyzeTranslationGaps();
    
    const languageStats: Record<string, {
      existingKeys: number;
      missingKeys: number;
      completeness: number;
    }> = {};

    for (const gap of gaps) {
      const totalKeys = detectedKeys.length;
      const missingKeys = gap.missingKeys.length;
      const existingKeys = totalKeys - missingKeys;
      const completeness = totalKeys > 0 ? (existingKeys / totalKeys) * 100 : 100;

      languageStats[gap.language] = {
        existingKeys,
        missingKeys,
        completeness: Math.round(completeness * 100) / 100
      };
    }

    return {
      summary: {
        totalKeys: detectedKeys.length,
        languageStats
      },
      gaps,
      detectedKeys
    };
  }
}

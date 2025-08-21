/**
 * Translation Completion Service
 * Automated translation completion for all modules following 1qa.md patterns
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { pool } from '../db';

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
  private readonly TRANSLATIONS_DIR = path.join(process.cwd(), 'client/public/locales');
  private readonly SOURCE_DIRS = [
    'client/src/pages',
    'client/src/components',
    'client/src/hooks'
  ];

  // Map for language directory names, e.g., 'pt' for 'pt-BR'
  private readonly LANGUAGE_MAPPING: Record<string, string> = {
    'pt-BR': 'pt'
  };


  // Mapeamento automático expandido de traduções baseado em contexto
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
    },
    'common.loading': {
      'en': 'Loading...',
      'pt-BR': 'Carregando...',
      'es': 'Cargando...',
      'fr': 'Chargement...',
      'de': 'Laden...'
    },
    'common.processing': {
      'en': 'Processing...',
      'pt-BR': 'Processando...',
      'es': 'Procesando...',
      'fr': 'Traitement...',
      'de': 'Verarbeitung...'
    },
    'common.pleaseWait': {
      'en': 'Please wait',
      'pt-BR': 'Aguarde',
      'es': 'Por favor espere',
      'fr': 'Veuillez patienter',
      'de': 'Bitte warten'
    },
    'common.none': {
      'en': 'None',
      'pt-BR': 'Nenhum',
      'es': 'Ninguno',
      'fr': 'Aucun',
      'de': 'Keine'
    },
    'common.all': {
      'en': 'All',
      'pt-BR': 'Todos',
      'es': 'Todos',
      'fr': 'Tous',
      'de': 'Alle'
    },
    'common.select': {
      'en': 'Select',
      'pt-BR': 'Selecionar',
      'es': 'Seleccione',
      'fr': 'Sélectionner',
      'de': 'Auswählen'
    },
    'common.choose': {
      'en': 'Choose',
      'pt-BR': 'Escolher',
      'es': 'Elegir',
      'fr': 'Choisir',
      'de': 'Wählen'
    },
    'forms.name': {
      'en': 'Name',
      'pt-BR': 'Nome',
      'es': 'Nombre',
      'fr': 'Nom',
      'de': 'Name'
    },
    'forms.email': {
      'en': 'Email',
      'pt-BR': 'Email',
      'es': 'Correo',
      'fr': 'Email',
      'de': 'E-Mail'
    },
    'forms.description': {
      'en': 'Description',
      'pt-BR': 'Descrição',
      'es': 'Descripción',
      'fr': 'Description',
      'de': 'Beschreibung'
    },
    'forms.status': {
      'en': 'Status',
      'pt-BR': 'Status',
      'es': 'Estado',
      'fr': 'Statut',
      'de': 'Status'
    },
    'forms.priority': {
      'en': 'Priority',
      'pt-BR': 'Prioridade',
      'es': 'Prioridad',
      'fr': 'Priorité',
      'de': 'Priorität'
    },
    'forms.category': {
      'en': 'Category',
      'pt-BR': 'Categoria',
      'es': 'Categoría',
      'fr': 'Catégorie',
      'de': 'Kategorie'
    },
    'forms.assignedTo': {
      'en': 'Assigned to',
      'pt-BR': 'Atribuído para',
      'es': 'Asignado a',
      'fr': 'Assigné à',
      'de': 'Zugewiesen an'
    },
    'forms.createdAt': {
      'en': 'Created at',
      'pt-BR': 'Criado em',
      'es': 'Creado en',
      'fr': 'Créé le',
      'de': 'Erstellt am'
    },
    'forms.updatedAt': {
      'en': 'Updated at',
      'pt-BR': 'Atualizado em',
      'es': 'Actualizado en',
      'fr': 'Mis à jour le',
      'de': 'Aktualisiert am'
    },
    'modals.confirm': {
      'en': 'Confirm',
      'pt-BR': 'Confirmar',
      'es': 'Confirmar',
      'fr': 'Confirmer',
      'de': 'Bestätigen'
    },
    'modals.confirmDelete': {
      'en': 'Are you sure you want to delete this item?',
      'pt-BR': 'Tem certeza que deseja excluir este item?',
      'es': '¿Está seguro de que desea eliminar este elemento?',
      'fr': 'Êtes-vous sûr de vouloir supprimer cet élément?',
      'de': 'Sind Sie sicher, dass Sie dieses Element löschen möchten?'
    },
    'placeholders.searchHere': {
      'en': 'Search here...',
      'pt-BR': 'Pesquisar aqui...',
      'es': 'Buscar aquí...',
      'fr': 'Rechercher ici...',
      'de': 'Hier suchen...'
    },
    'placeholders.selectOption': {
      'en': 'Select an option',
      'pt-BR': 'Selecione uma opção',
      'es': 'Seleccione una opción',
      'fr': 'Sélectionnez une option',
      'de': 'Wählen Sie eine Option'
    },
    'placeholders.enterText': {
      'en': 'Enter text',
      'pt-BR': 'Digite o texto',
      'es': 'Ingrese texto',
      'fr': 'Saisissez le texte',
      'de': 'Text eingeben'
    },
    'buttons.submit': {
      'en': 'Submit',
      'pt-BR': 'Enviar',
      'es': 'Enviar',
      'fr': 'Soumettre',
      'de': 'Senden'
    },
    'buttons.close': {
      'en': 'Close',
      'pt-BR': 'Fechar',
      'es': 'Cerrar',
      'fr': 'Fermer',
      'de': 'Schließen'
    },
    'buttons.add': {
      'en': 'Add',
      'pt-BR': 'Adicionar',
      'es': 'Agregar',
      'fr': 'Ajouter',
      'de': 'Hinzufügen'
    },
    'buttons.remove': {
      'en': 'Remove',
      'pt-BR': 'Remover',
      'es': 'Eliminar',
      'fr': 'Supprimer',
      'de': 'Entfernen'
    },
    'messages.success': {
      'en': 'Success',
      'pt-BR': 'Sucesso',
      'es': 'Éxito',
      'fr': 'Succès',
      'de': 'Erfolg'
    },
    'messages.error': {
      'en': 'Error',
      'pt-BR': 'Erro',
      'es': 'Error',
      'fr': 'Erreur',
      'de': 'Fehler'
    },
    'messages.warning': {
      'en': 'Warning',
      'pt-BR': 'Aviso',
      'es': 'Advertencia',
      'fr': 'Avertissement',
      'de': 'Warnung'
    },
    'messages.info': {
      'en': 'Information',
      'pt-BR': 'Informação',
      'es': 'Información',
      'fr': 'Information',
      'de': 'Information'
    }
  };

  /**
   * Carrega traduções de um arquivo de idioma específico
   */
  private async loadTranslations(language: string): Promise<Record<string, any>> {
    try {
      const mappedLanguage = this.LANGUAGE_MAPPING[language] || language;
      const filePath = path.join(this.TRANSLATIONS_DIR, mappedLanguage, 'translation.json');

      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        console.warn(`⚠️ [LOAD-TRANSLATIONS] Translation file not found: ${filePath}`);
        return {};
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ [LOAD-TRANSLATIONS] Error loading translations for ${language}:`, error);
      return {};
    }
  }

  /**
   * Escaneia todos os arquivos fonte para detectar chaves de tradução e textos hardcoded
   */
  async scanTranslationKeys(): Promise<TranslationKey[]> {
    console.log('🔍 [TRANSLATION-SCAN] Starting enhanced translation key scanning process...');
    const keys: TranslationKey[] = [];

    // Expanded patterns to capture more translation usage patterns
    const keyPatterns = [
      // Standard t() function calls - more variations
      /(?:t\(|useTranslation\(\)\.t\(|i18n\.t\()\s*['"`]([^'"`\n]+)['"`]/g,

      // React components with translation props
      /\b(?:title|label|placeholder|text|description|tooltip|aria-label|alt)\s*=\s*\{\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation hooks variations
      /useTranslation\(\)\s*\.\s*t\s*\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Destructured translation hooks
      /const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\)\s*;[\s\S]*?t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation in JSX expressions
      /\{\s*t\(\s*['"`]([^'"`\n]+)['"`]\s*\)\s*\}/g,

      // Translation in template literals
      /\$\{\s*t\(\s*['"`]([^'"`\n]+)['"`]\s*\)\s*\}/g,

      // Translation in conditional expressions
      /\?\s*t\(\s*['"`]([^'"`\n]+)['"`]\s*\)\s*:/g,

      // Translation in array/object literals
      /[:\[\{,]\s*t\(\s*['"`]([^'"`\n]+)['"`]\s*\)\s*[,\]\}]/g,

      // Translation in function returns
      /return\s+t\(\s*['"`]([^'"`\n]+)['"`]\s*\)/g,

      // Translation in console/error messages
      /(?:console\.(?:log|error|warn)|throw\s+new\s+Error)\s*\(\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation with interpolation
      /t\(\s*['"`]([^'"`\n]+)['"`]\s*,\s*\{/g,

      // Translation in toast/notification calls
      /(?:toast|notify|alert)\s*\(\s*\{\s*(?:title|message|description):\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation in form validation
      /(?:message|error):\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation in button/link text
      /(?:onClick|href)\s*=\s*\{\s*.*?t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation in data attributes
      /data-\w+\s*=\s*\{\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation in component props drilling
      /\w+\s*=\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,

      // Translation keys from existing JSON files (to ensure completeness)
      /['"`]([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*?)['"`]\s*:/g,
    ];

    // First, scan existing translation files to get all current keys
    const existingKeys = await this.scanExistingTranslationFiles();
    keys.push(...existingKeys);

    // Then scan source code files
    for (const sourceDir of this.SOURCE_DIRS) {
      const fullPath = path.join(process.cwd(), sourceDir);
      console.log(`📁 [TRANSLATION-SCAN] Scanning directory: ${fullPath}`);

      try {
        // Check if directory exists
        const dirExists = await fs.access(fullPath).then(() => true).catch(() => false);
        if (!dirExists) {
          console.warn(`⚠️ [TRANSLATION-SCAN] Directory not found: ${fullPath}`);
          continue;
        }

        for (const pattern of keyPatterns) {
          await this.scanDirectory(fullPath, keys, pattern);
        }
      } catch (error) {
        console.warn(`⚠️ [TRANSLATION-SCAN] Could not scan directory ${sourceDir}:`, error);
      }
    }

    console.log(`📊 [TRANSLATION-SCAN] Found ${keys.length} raw translation keys (including existing files)`);

    // Filter out invalid keys before processing
    const validKeys = keys.filter(key => this.isValidTranslationKey(key.key));
    console.log(`✅ [TRANSLATION-SCAN] ${validKeys.length} valid keys after filtering`);

    const deduplicated = this.deduplicateAndPrioritize(validKeys);
    console.log(`🎯 [TRANSLATION-SCAN] ${deduplicated.length} unique keys after deduplication`);

    return deduplicated;
  }

  /**
   * Obtém um valor aninhado de um objeto usando uma chave com pontos
   */
  private getNestedValue(obj: any, key: string): any {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }

  /**
   * Define um valor aninhado em um objeto usando uma chave com pontos
   */
  private setNestedValue(obj: any, key: string, value: any): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Gera um relatório completo de completude das traduções
   */
  async generateCompletenessReport(): Promise<any> {
    console.log('📊 [COMPLETENESS-REPORT] Generating translation completeness report...');

    try {
      // Get all keys from expansion scanner
      const allKeys = await this.scanTranslationKeys();

      // Also include keys from existing files
      const existingKeys = await this.scanExistingTranslationFiles();

      // Combine and deduplicate all keys
      const combinedKeys = [...allKeys, ...existingKeys];
      const uniqueKeysMap = new Map<string, TranslationKey>();

      for (const key of combinedKeys) {
        if (!uniqueKeysMap.has(key.key)) {
          uniqueKeysMap.set(key.key, key);
        }
      }

      const finalKeys = Array.from(uniqueKeysMap.values());
      const totalKeys = finalKeys.length;

      console.log(`📋 [COMPLETENESS-REPORT] Total unique keys found: ${totalKeys}`);

      const report: any = {
        summary: {
          totalKeys,
          languageStats: {},
          scannedAt: new Date().toISOString(),
          keysSources: {
            fromScanner: allKeys.length,
            fromExistingFiles: existingKeys.length,
            totalUnique: totalKeys
          }
        },
        gaps: []
      };

      // Analyze each supported language
      for (const language of this.SUPPORTED_LANGUAGES) {
        const translations = await this.loadTranslations(language);
        const missingKeys: string[] = [];
        const moduleGaps: Record<string, string[]> = {};

        // Check each key using the final combined key list
        for (const keyObj of finalKeys) {
          const keyPath = keyObj.key;
          const value = this.getNestedValue(translations, keyPath);

          if (value === undefined || value === null || value === '') {
            missingKeys.push(keyPath);

            // Group by module
            const module = keyObj.module || 'common';
            if (!moduleGaps[module]) {
              moduleGaps[module] = [];
            }
            moduleGaps[module].push(keyPath);
          }
        }

        const existingKeys = totalKeys - missingKeys.length;
        const completeness = totalKeys > 0 ? Math.round((existingKeys / totalKeys) * 100) : 0;

        report.summary.languageStats[language] = {
          totalKeys,
          existingKeys,
          missingKeys: missingKeys.length,
          completeness
        };

        if (missingKeys.length > 0) {
          report.gaps.push({
            language,
            missingKeys,
            moduleGaps
          });
        }
      }

      console.log('✅ [COMPLETENESS-REPORT] Report generated successfully');
      return report;

    } catch (error) {
      console.error('❌ [COMPLETENESS-REPORT] Error generating report:', error);
      throw error;
    }
  }

  /**
   * Conta quantas chaves existem nas traduções carregadas
   */
  private countExistingKeys(translations: Record<string, any>, allKeys: string[]): number {
    if (!translations || !Array.isArray(allKeys)) {
      return 0;
    }

    let count = 0;

    for (const key of allKeys) {
      if (typeof key === 'string' && this.getNestedValue(translations, key) !== undefined) {
        count++;
      }
    }

    // Ensure we return a valid integer
    return Number.isInteger(count) && count >= 0 ? count : 0;
  }

  /**
   * Analisa gaps de tradução para todos os idiomas
   */
  async analyzeTranslationGaps(): Promise<TranslationGap[]> {
    console.log('🔍 [GAPS-ANALYSIS] Analyzing translation gaps...');

    const scannedKeys = await this.scanTranslationKeys();
    const allKeys = scannedKeys.map(k => k.key);
    const gaps: TranslationGap[] = [];

    for (const language of this.SUPPORTED_LANGUAGES) {
      const translations = await this.loadTranslations(language);
      const missingKeys: string[] = [];
      const moduleGaps: Record<string, string[]> = {};

      for (const key of allKeys) {
        if (this.getNestedValue(translations, key) === undefined) {
          missingKeys.push(key);

          // Agrupar por módulo
          const module = key.split('.')[0] || 'general';
          if (!moduleGaps[module]) {
            moduleGaps[module] = [];
          }
          moduleGaps[module].push(key);
        }
      }

      gaps.push({
        language,
        missingKeys,
        moduleGaps
      });
    }

    console.log(`✅ [GAPS-ANALYSIS] Analyzed gaps for ${this.SUPPORTED_LANGUAGES.length} languages`);
    return gaps;
  }

  /**
   * Verifica se uma chave é uma chave de tradução válida
   */
  private isValidTranslationKey(key: string): boolean {
    // Skip empty or undefined
    if (!key || typeof key !== 'string') {
      return false;
    }

    const trimmedKey = key.trim();

    // Skip very short keys (but allow 2+ character keys)
    if (trimmedKey.length < 2) {
      return false;
    }

    // Only skip obvious technical patterns - more permissive now
    const technicalPatterns = [
      /^\/api\/.*$/,        // API routes (full paths only)
      /^https?:\/\/.*$/,    // Full URLs only
      /^\d{3,4}$/,          // HTTP status codes (3-4 digits only)
      /^[A-Z_]{4,}_[A-Z_]{2,}$/, // Constants like API_KEY (stricter)
      /^\$\{[^}]+\}$/,      // Template variables (complete only)
      /^#[0-9a-fA-F]{6}$/,  // Hex colors (6 digits only)
      /^0x[0-9a-fA-F]+$/,   // Hex numbers
      /^[a-f0-9]{8}-[0-9a-f0-9]{4}-[0-9a-f0-9]{4}-[0-9a-f0-9]{4}-[0-9a-f0-9]{12}$/, // UUIDs
      /^[a-f0-9]{32}$/,     // MD5 hashes
      /^\w+\(\)$/,          // Function calls like onClick()
      /^[A-Z]+$/,           // All caps single words (likely constants)
    ];

    for (const pattern of technicalPatterns) {
      if (pattern.test(trimmedKey)) {
        return false;
      }
    }

    // Skip pure numbers
    if (/^\d+$/.test(trimmedKey)) {
      return false;
    }

    // Skip obvious technical words
    const technicalWords = [
      'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD',
      'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
      'console', 'window', 'document', 'localStorage', 'sessionStorage',
      'onClick', 'onChange', 'onSubmit', 'onLoad', 'onError',
      'className', 'innerHTML', 'textContent', 'addEventListener',
      'preventDefault', 'stopPropagation', 'setTimeout', 'setInterval',
      'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean',
      'Promise', 'async', 'await', 'function', 'const', 'let', 'var',
      'import', 'export', 'from', 'default', 'class', 'extends',
      'public', 'private', 'protected', 'static', 'readonly',
      'interface', 'type', 'enum', 'namespace', 'module'
    ];

    if (technicalWords.includes(trimmedKey)) {
      return false;
    }

    // Accept most other keys - much more permissive approach
    // Accept keys with dots (module.key.subkey), camelCase, kebab-case, snake_case
    const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9._-]*$/;

    return validKeyPattern.test(trimmedKey);
  }

  /**
   * Detecta textos hardcoded que precisam ser traduzidos
   */
  async detectHardcodedTexts(): Promise<{
    file: string;
    line: number;
    text: string;
    suggestedKey: string;
    context: string;
  }[]> {
    const hardcodedTexts: Array<{
      file: string;
      line: number;
      text: string;
      suggestedKey: string;
      context: string;
    }> = [];

    for (const sourceDir of this.SOURCE_DIRS) {
      try {
        await this.scanDirectoryForHardcoded(
          path.join(process.cwd(), sourceDir),
          hardcodedTexts
        );
      } catch (error) {
        console.warn(`Could not scan directory for hardcoded text ${sourceDir}:`, error);
      }
    }

    return hardcodedTexts;
  }

  /**
   * Remove chaves de tradução inválidas dos arquivos de tradução
   */
  async cleanInvalidTranslationKeys(): Promise<{
    filesProcessed: number;
    totalKeysRemoved: number;
    details: Array<{
      language: string;
      keysRemoved: string[];
      success: boolean;
    }>;
  }> {
    const results = {
      filesProcessed: 0,
      totalKeysRemoved: 0,
      details: [] as Array<{
        language: string;
        keysRemoved: string[];
        success: boolean;
      }>
    };

    for (const language of this.SUPPORTED_LANGUAGES) {
      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');

        if (!await fs.access(filePath).then(() => true).catch(() => false)) {
          continue;
        }

        const fileContent = await fs.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);

        const invalidKeys: string[] = [];
        const cleanedTranslations = this.removeInvalidKeysFromObject(translations, '', invalidKeys);

        if (invalidKeys.length > 0) {
          // Create backup
          const backupPath = path.join(this.TRANSLATIONS_DIR, language, `translation.backup.json`);
          await fs.writeFile(backupPath, fileContent);

          // Write cleaned translations
          await fs.writeFile(filePath, JSON.stringify(cleanedTranslations, null, 2));

          results.totalKeysRemoved += invalidKeys.length;
        }

        results.details.push({
          language,
          keysRemoved: invalidKeys,
          success: true
        });

        results.filesProcessed++;

      } catch (error) {
        console.error(`Error cleaning ${language} translations:`, error);
        results.details.push({
          language,
          keysRemoved: [],
          success: false
        });
      }
    }

    return results;
  }

  /**
   * Escaneia arquivos de tradução existentes para obter todas as chaves atuais
   */
  private async scanExistingTranslationFiles(): Promise<TranslationKey[]> {
    console.log('📋 [EXISTING-SCAN] Scanning existing translation files...');
    const keys: TranslationKey[] = [];

    try {
      for (const language of this.SUPPORTED_LANGUAGES) {
        const mappedLanguage = this.LANGUAGE_MAPPING[language] || language;
        const filePath = path.join(this.TRANSLATIONS_DIR, mappedLanguage, 'translation.json');

        try {
          const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
          if (!fileExists) {
            console.warn(`⚠️ [EXISTING-SCAN] Translation file not found: ${filePath}`);
            continue;
          }

          const content = await fs.readFile(filePath, 'utf-8');
          const translations = JSON.parse(content);

          // Extract keys recursively
          const extractKeys = (obj: any, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;

            Object.keys(obj).forEach(key => {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                extractKeys(obj[key], fullKey);
              } else {
                keys.push({
                  key: fullKey,
                  module: this.getModuleFromKey(fullKey),
                  usage: [`${mappedLanguage}/translation.json`],
                  priority: this.getPriorityFromKey(fullKey)
                });
              }
            });
          };

          extractKeys(translations);
        } catch (error) {
          console.warn(`⚠️ [EXISTING-SCAN] Error reading ${language} translations:`, error);
        }
      }

      console.log(`📋 [EXISTING-SCAN] Found ${keys.length} keys from existing translation files`);
      return keys;
    } catch (error) {
      console.error('❌ [EXISTING-SCAN] Error scanning existing translation files:', error);
      return [];
    }
  }

  /**
   * Detecta o módulo baseado na chave de tradução
   */
  private getModuleFromKey(key: string): string {
    const parts = key.split('.');
    if (parts.length > 0) {
      const module = parts[0];
      return ['common', 'navigation', 'forms', 'errors', 'success', 'buttons', 'modals', 'placeholders', 'messages'].includes(module)
        ? module
        : 'general';
    }
    return 'general';
  }

  /**
   * Detecta a prioridade baseada na chave de tradução
   */
  private getPriorityFromKey(key: string): 'high' | 'medium' | 'low' {
    if (key.includes('error') || key.includes('required') || key.includes('validation')) {
      return 'high';
    }
    if (key.includes('common') || key.includes('navigation') || key.includes('button')) {
      return 'high';
    }
    if (key.includes('placeholder') || key.includes('tooltip') || key.includes('help')) {
      return 'low';
    }
    return 'medium';
  }


  /**
   * Escaneia um diretório específico em busca de chaves de tradução
   */
  private async scanDirectory(dirPath: string, keys: TranslationKey[], pattern: RegExp): Promise<void> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
            await this.scanDirectory(itemPath, keys, pattern);
          }
        } else if (item.isFile() && /\.(tsx?|jsx?|vue|svelte)$/.test(item.name)) {
          try {
            const content = await fs.readFile(itemPath, 'utf8');
            const matches = [...content.matchAll(pattern)];

            for (const match of matches) {
              const key = match[1];
              if (key && this.isValidTranslationKey(key)) {
                const moduleName = this.extractModuleName(itemPath);
                keys.push({
                  key,
                  module: moduleName,
                  usage: [itemPath],
                  priority: this.determinePriority(key, moduleName)
                });
              }
            }
          } catch (fileError) {
            console.warn(`Could not read file ${itemPath}:`, fileError);
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dirPath}:`, error);
    }
  }

  /**
   * Extrai o nome do módulo baseado no caminho do arquivo
   */
  private extractModuleName(filePath: string): string {
    const relativePath = path.relative(process.cwd(), filePath);
    const parts = relativePath.split(path.sep);

    if (parts.includes('pages')) {
      const pageIndex = parts.indexOf('pages');
      return parts[pageIndex + 1] || 'unknown';
    }

    if (parts.includes('components')) {
      const componentIndex = parts.indexOf('components');
      return parts[componentIndex + 1] || 'components';
    }

    return 'general';
  }

  /**
   * Determina a prioridade de uma chave baseada no contexto
   */
  private determinePriority(key: string, module: string): 'high' | 'medium' | 'low' {
    if (key.includes('error') || key.includes('warning')) return 'high';
    if (key.includes('button') || key.includes('action')) return 'high';
    if (key.includes('title') || key.includes('heading')) return 'medium';
    return 'low';
  }

  /**
   * Remove duplicatas e prioriza chaves de uso
   */
  private deduplicateAndPrioritize(keys: TranslationKey[]): TranslationKey[] {
    const keyMap = new Map<string, TranslationKey>();

    for (const key of keys) {
      if (keyMap.has(key.key)) {
        const existing = keyMap.get(key.key)!;
        // Merge usage arrays and increase priority if found in multiple places
        existing.usage = Array.from(new Set([...existing.usage, ...key.usage]));
        if (existing.usage.length > 1) {
          existing.priority = 'high';
        }
      } else {
        keyMap.set(key.key, { ...key });
      }
    }

    // Return all unique keys - don't over-filter
    return Array.from(keyMap.values());
  }

  /**
   * Converte prioridade em peso numérico para ordenação
   */
  private getPriorityWeight(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
    }
  }

  /**
   * Remove chaves inválidas de um objeto de tradução recursivamente
   */
  private removeInvalidKeysFromObject(obj: any, prefix: string, invalidKeys: string[]): any {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      // Check if this key is invalid
      if (!this.isValidTranslationKey(fullKey) && prefix) {
        invalidKeys.push(fullKey);
        continue;
      }

      // Check if the key itself is problematic
      if (this.isProblematicKey(key)) {
        invalidKeys.push(fullKey);
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        const cleanedValue = this.removeInvalidKeysFromObject(value, fullKey, invalidKeys);
        if (Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue;
        }
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * MÉTODO ULTRA SEGURO: Completa apenas arquivos JSON de tradução
   * NÃO toca em nenhum arquivo de código TypeScript/JSX
   */
  async completeAllTranslations(): Promise<Array<{
    language: string;
    addedKeys: string[];
    errors: string[];
    success: boolean;
  }>> {
    console.log('🔒 [ULTRA-SAFE] Starting ultra-safe translation completion');
    const results: Array<{
      language: string;
      addedKeys: string[];
      errors: string[];
      success: boolean;
    }> = [];

    for (const language of this.SUPPORTED_LANGUAGES) {
      console.log(`🔍 [ULTRA-SAFE] Processing ${language} translation file...`);

      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');

        // Verifica se o arquivo existe
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (!fileExists) {
          console.log(`⚠️ [ULTRA-SAFE] ${language}/translation.json não encontrado, criando...`);
          // Ensure the directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, JSON.stringify({}, null, 2));
        }

        // Lê o arquivo atual
        const currentContent = await fs.readFile(filePath, 'utf8');
        let translations: any = {};

        try {
          translations = JSON.parse(currentContent);
        } catch (parseError) {
          console.warn(`⚠️ [ULTRA-SAFE] ${language}/translation.json tem formato inválido, resetando...`);
          translations = {};
        }

        // Adiciona apenas traduções pré-definidas seguras do AUTO_TRANSLATIONS
        const addedKeys: string[] = [];
        let translationsModified = false;

        for (const [key, translationMap] of Object.entries(this.AUTO_TRANSLATIONS)) {
          if (translationMap[language] && !this.hasTranslation(translations, key)) {
            this.setTranslation(translations, key, translationMap[language]);
            addedKeys.push(key);
            translationsModified = true;
          }
        }

        // Salva apenas se houve modificações
        if (translationsModified) {
          const backupPath = path.join(this.TRANSLATIONS_DIR, language, `translation.json.backup-${Date.now()}`);
          await fs.writeFile(backupPath, currentContent); // Backup primeiro

          await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
          console.log(`✅ [ULTRA-SAFE] ${language}/translation.json updated with ${addedKeys.length} new translations`);
        } else {
          console.log(`ℹ️ [ULTRA-SAFE] ${language}/translation.json already complete, no changes needed`);
        }

        results.push({
          language,
          addedKeys,
          errors: [],
          success: true
        });

      } catch (error) {
        console.error(`❌ [ULTRA-SAFE] Error processing ${language}:`, error);
        results.push({
          language,
          addedKeys: [],
          errors: [error.message],
          success: false
        });
      }
    }

    console.log('🎉 [ULTRA-SAFE] Ultra-safe translation completion finished');
    return results;
  }

  /**
   * Verifica se uma tradução existe (navegação segura por objeto aninhado)
   */
  private hasTranslation(obj: any, key: string): boolean {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        return false;
      }
      current = current[k];
    }

    return current !== undefined && current !== null && current !== '';
  }

  /**
   * Define uma tradução (criação segura de objeto aninhado)
   */
  private setTranslation(obj: any, key: string, value: string): void {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Verifica se uma chave específica é problemática
   */
  private isProblematicKey(key: string): boolean {
    // API routes
    if (key.includes('/api/') || key.includes('${')) {
      return true;
    }

    // HTTP status codes
    if (/^\d{3}:?$/.test(key)) {
      return true;
    }

    // Single numbers
    if (/^\d+$/.test(key)) {
      return true;
    }

    // SQL keywords
    const sqlKeywords = ['AND', 'OR', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE'];
    if (sqlKeywords.includes(key.toUpperCase())) {
      return true;
    }

    // Single special characters
    if (/^[^a-zA-Z0-9]+$/.test(key) && key.length < 3) {
      return true;
    }

    return false;
  }

  /**
   * Escaneia diretório recursivamente
   */
  private async scanDirectoryForHardcoded(
    dir: string,
    hardcodedTexts: Array<{
      file: string;
      line: number;
      text: string;
      suggestedKey: string;
      context: string;
    }>
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectoryForHardcoded(fullPath, hardcodedTexts);
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          await this.scanFileForHardcoded(fullPath, hardcodedTexts);
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory for hardcoded ${dir}:`, error);
    }
  }

  /**
   * Escaneia arquivo para textos hardcoded
   */
  private async scanFileForHardcoded(
    filePath: string,
    hardcodedTexts: Array<{
      file: string;
      line: number;
      text: string;
      suggestedKey: string;
      context: string;
    }>
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');

      // Padrões para detectar textos hardcoded em português/inglês
      const hardcodedPatterns = [
        // Títulos e labels comuns
        /['"`]((?:Criar|Create|Editar|Edit|Excluir|Delete|Salvar|Save|Cancelar|Cancel|Buscar|Search|Filtrar|Filter|Ações|Actions|Configurações|Settings|Dashboard|Painel|Relatórios|Reports|Clientes|Customers|Usuários|Users|Tickets|Análises|Analytics)[^'"`]*?)['"`]/g,
        // Mensagens de erro
        /['"`]((?:Erro|Error|Sucesso|Success|Atenção|Warning|Informação|Information)[^'"`]*?)['"`]/g,
        // Textos de interface
        /['"`]((?:Carregando|Loading|Processando|Processing|Aguarde|Please wait|Nenhum|None|Todos|All|Selecione|Select|Escolha|Choose)[^'"`]*?)['"`]/g,
        // Placeholders
        /placeholder\s*=\s*['"`]([^'"`]+?)['"`]/g,
        // Títulos de colunas
        /header\s*:\s*['"`]([^'"`]+?)['"`]/g,
        // Labels de formulário
        /label\s*[:=]\s*['"`]([^'"`]+?)['"`]/g,
        // Textos de botões
        /(?:children|title)\s*[:=]\s*['"`]([^'"`]+?)['"`]/g
      ];

      lines.forEach((line, lineIndex) => {
        // Skip lines that already use translation functions
        if (line.includes('t(') || line.includes('useTranslation') || line.includes('i18n.t')) {
          return;
        }

        // Skip import/export lines
        if (line.trim().startsWith('import') || line.trim().startsWith('export')) {
          return;
        }

        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
          return;
        }

        hardcodedPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            if (match[1] && this.isTranslatableText(match[1])) {
              const module = this.extractModuleFromPath(filePath);
              const suggestedKey = this.generateTranslationKey(match[1], module);

              hardcodedTexts.push({
                file: filePath,
                line: lineIndex + 1,
                text: match[1],
                suggestedKey,
                context: line.trim()
              });
            }
          }
        });
      });
    } catch (error) {
      console.warn(`Error scanning file for hardcoded ${filePath}:`, error);
    }
  }

  /**
   * Verifica se um texto deve ser traduzido
   */
  private isTranslatableText(text: string): boolean {
    // Skip muito curtos ou que são claramente código
    if (text.length < 3) return false;

    // Skip URLs, paths, códigos
    if (text.includes('/') || text.includes('\\') || text.includes('.') && text.length < 10) {
      return false;
    }

    // Skip valores técnicos
    if (/^[A-Z_]+$/.test(text) || /^\d+$/.test(text)) {
      return false;
    }

    // Skip CSS classes, IDs
    if (text.includes('-') && text.length < 15) {
      return false;
    }

    // Inclui textos em português e inglês comuns
    const translatableWords = [
      'criar', 'create', 'editar', 'edit', 'excluir', 'delete', 'salvar', 'save',
      'cancelar', 'cancel', 'buscar', 'search', 'filtrar', 'filter', 'ações', 'actions',
      'configurações', 'settings', 'dashboard', 'painel', 'relatórios', 'reports',
      'clientes', 'customers', 'usuários', 'users', 'tickets', 'análises', 'analytics',
      'erro', 'error', 'sucesso', 'success', 'atenção', 'warning', 'informação', 'information',
      'carregando', 'loading', 'processando', 'processing', 'aguarde', 'please wait',
      'nenhum', 'none', 'todos', 'all', 'selecione', 'select', 'escolha', 'choose'
    ];

    const lowerText = text.toLowerCase();
    return translatableWords.some(word => lowerText.includes(word));
  }

  /**
   * Gera chave de tradução baseada no texto
   */
  private generateTranslationKey(text: string, module: string): string {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' ')
      .trim();

    const words = normalized.split(' ');

    // Gera camelCase
    const camelCase = words[0] + words.slice(1).map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join('');

    return `${module}.${camelCase}`;
  }

  /**
   * Substitui textos hardcoded por chaves de tradução
   */
  async replaceHardcodedTexts(hardcodedTexts: Array<{
    file: string;
    line: number;
    text: string;
    suggestedKey: string;
    context: string;
  }>): Promise<Array<{
    file: string;
    replacements: number;
    success: boolean;
    error?: string;
  }>> {
    console.log('🚨 [TRANSLATION-SAFETY] Hardcoded text replacement disabled to prevent code corruption');
    return []; // Retorna array vazio para evitar modificações perigosas
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
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          await this.scanDirectory(fullPath, keys, pattern);
        } else if (item.isFile() && /\.(tsx?|jsx?)$/.test(item.name)) {
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
      const matches: RegExpExecArray[] = [];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        matches.push(match);
      }
      const module = this.extractModuleFromPath(filePath);

      for (const match of matches) {
        if (match[1]) {
          const key = match[1];
          // ✅ 1QA.MD: Additional filter to exclude API URLs and paths
          if (!key.includes('/') && !key.startsWith('http') && key.includes('.')) {
            keys.push({
              key,
              module,
              usage: [filePath],
              priority: this.determinePriority(key, filePath)
            });
          }
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
        keyMap.set(key.key, { ...key });
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
        const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');
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
   * Completa traduções faltantes usando o dicionário automático
   */
  async completeTranslations(force = false): Promise<any[]> {
    console.log('🔄 [TRANSLATION-COMPLETION] Starting translation completion process...');
    console.log(`🚨 [SAFETY] Force mode: ${force}`);
    const results = [];

    for (const language of this.SUPPORTED_LANGUAGES) {
      try {
        console.log(`🌐 [TRANSLATION-COMPLETION] Processing language: ${language}`);

        const filePath = path.join(this.TRANSLATIONS_DIR, `${language}/translation.json`);

        // Ensure directory exists
        const dirPath = path.dirname(filePath);
        await fs.mkdir(dirPath, { recursive: true });

        // Read existing translations
        let existingTranslations = {};
        try {
          const fileContent = await fs.readFile(filePath, 'utf8');
          existingTranslations = JSON.parse(fileContent);
          console.log(`📖 [TRANSLATION-COMPLETION] Loaded ${Object.keys(this.flattenObject(existingTranslations)).length} existing translations for ${language}`);
        } catch (error) {
          console.log(`📝 [TRANSLATION-COMPLETION] No existing file for ${language}, creating new one`);
        }

        // Get all available keys
        const allKeys = await this.scanTranslationKeys();
        console.log(`🔍 [TRANSLATION-COMPLETION] Found ${allKeys.length} total keys to process`);

        // Find missing keys
        const flatExisting = this.flattenObject(existingTranslations);
        const missingKeys = allKeys.filter(keyObj => {
          const key = keyObj.key;
          return !flatExisting.hasOwnProperty(key) && !this.hasNestedKey(existingTranslations, key);
        });

        console.log(`❌ [TRANSLATION-COMPLETION] Found ${missingKeys.length} missing keys for ${language}`);

        if (missingKeys.length === 0 && !force) {
          console.log(`✅ [TRANSLATION-COMPLETION] No missing keys for ${language}`);
          results.push({
            language,
            added: 0,
            errors: [],
            successfulFiles: 1
          });
          continue;
        }

        // Add missing translations
        let addedCount = 0;
        const errors = [];
        const updatedTranslations = { ...existingTranslations };

        for (const keyObj of missingKeys) {
          try {
            // Generate translation based on key
            const translation = this.generateTranslationForKey(keyObj.key, language);
            this.setNestedKey(updatedTranslations, keyObj.key, translation);
            addedCount++;

            if (addedCount % 50 === 0) {
              console.log(`🔄 [TRANSLATION-COMPLETION] Added ${addedCount}/${missingKeys.length} translations for ${language}`);
            }
          } catch (error) {
            console.error(`❌ [TRANSLATION-COMPLETION] Error adding key ${keyObj.key}:`, error);
            errors.push(`${keyObj.key}: ${error.message}`);
          }
        }

        // Write updated translations back to file
        try {
          // Create backup first
          const backupPath = `${filePath}.backup-${Date.now()}`;
          try {
            if (Object.keys(existingTranslations).length > 0) {
              await fs.writeFile(backupPath, JSON.stringify(existingTranslations, null, 2));
              console.log(`💾 [BACKUP] Created backup at ${backupPath}`);
            }
          } catch (backupError) {
            console.warn(`⚠️ [TRANSLATION-COMPLETION] Could not create backup for ${language}:`, backupError);
          }

          // Write updated file with proper formatting
          const jsonContent = JSON.stringify(updatedTranslations, null, 2);
          await fs.writeFile(filePath, jsonContent, 'utf8');

          // Verify the write was successful
          const verification = await fs.readFile(filePath, 'utf8');
          const verificationData = JSON.parse(verification);
          const verificationCount = Object.keys(this.flattenObject(verificationData)).length;

          console.log(`💾 [TRANSLATION-COMPLETION] Successfully updated ${language} with ${addedCount} new translations`);
          console.log(`✅ [VERIFICATION] ${language} file now contains ${verificationCount} total translations`);

          results.push({
            language,
            added: addedCount,
            errors,
            successfulFiles: 1,
            totalTranslations: verificationCount
          });
        } catch (writeError) {
          console.error(`❌ [TRANSLATION-COMPLETION] Error writing ${language} file:`, writeError);
          results.push({
            language,
            added: 0,
            errors: [...errors, `Write error: ${writeError.message}`],
            successfulFiles: 0
          });
        }
      } catch (error) {
        console.error(`❌ [TRANSLATION-COMPLETION] Critical error processing ${language}:`, error);
        results.push({
          language,
          added: 0,
          errors: [`Critical error: ${error.message}`],
          successfulFiles: 0
        });
      }
    }

    const totalAdded = results.reduce((sum, result) => sum + result.added, 0);
    console.log(`🎯 [TRANSLATION-COMPLETION] Process complete! Added ${totalAdded} total translations`);

    // Log summary for each language
    results.forEach(result => {
      console.log(`📊 [SUMMARY] ${result.language}: +${result.added} translations, ${result.errors.length} errors`);
    });

    return results;
  }

  /**
   * Salva traduções em um arquivo de idioma específico
   */
  private async saveTranslations(language: string, translations: Record<string, any>): Promise<void> {
    try {
      const mappedLanguage = this.LANGUAGE_MAPPING[language] || language;
      const filePath = path.join(this.TRANSLATIONS_DIR, mappedLanguage, 'translation.json');

      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });

      // Create backup
      const backupPath = `${filePath}.backup-${Date.now()}`;
      try {
        await fs.access(filePath);
        await fs.copyFile(filePath, backupPath);
        console.log(`📋 [SAVE-TRANSLATIONS] Created backup: ${backupPath}`);
      } catch (error) {
        // File doesn't exist, no need for backup
      }

      // Write updated translations
      const content = JSON.stringify(translations, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');

      console.log(`💾 [SAVE-TRANSLATIONS] Successfully saved translations for ${language} to ${filePath}`);
    } catch (error) {
      console.error(`❌ [SAVE-TRANSLATIONS] Error saving translations for ${language}:`, error);
      throw error;
    }
  }

  /**
   * Generate a translation for a given key and language
   */
  private generateTranslationForKey(key: string, language: string): string {
    // Convert key to human-readable text
    const keyParts = key.split('.');
    const lastPart = keyParts[keyParts.length - 1];

    // Convert camelCase and snake_case to readable text
    const humanReadable = lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .trim();

    // Capitalize first letter
    const baseTranslation = humanReadable.charAt(0).toUpperCase() + humanReadable.slice(1);

    // If the key is very short or seems like a code, return it as is
    if (key.length <= 2 || /^[A-Z_]+$/.test(key)) {
      return key;
    }

    // Language-specific translations
    switch (language) {
      case 'pt':
      case 'pt-BR':
        return this.translateToPortuguese(baseTranslation, key);
      case 'es':
        return this.translateToSpanish(baseTranslation, key);
      case 'fr':
        return this.translateToFrench(baseTranslation, key);
      case 'de':
        return this.translateToGerman(baseTranslation, key);
      default:
        return baseTranslation || key;
    }
  }

  // Placeholder translation functions (implement actual translation logic here)
  private translateToPortuguese(text: string, key: string): string {
    // Simple fallback for common keys
    const commonTranslations: Record<string, string> = {
      'Loading': 'Carregando',
      'Save': 'Salvar',
      'Cancel': 'Cancelar',
      'Delete': 'Excluir',
      'Edit': 'Editar',
      'Create': 'Criar',
      'Update': 'Atualizar',
      'Search': 'Pesquisar',
      'Filter': 'Filtrar',
      'Actions': 'Ações',
      'Settings': 'Configurações',
      'Dashboard': 'Painel',
      'Tickets': 'Tickets',
      'Customers': 'Clientes',
      'Analytics': 'Análises',
      'Error': 'Erro',
      'Success': 'Sucesso',
      'Warning': 'Aviso',
      'Information': 'Informação'
    };
    return commonTranslations[text] || text;
  }

  private translateToSpanish(text: string, key: string): string {
    const commonTranslations: Record<string, string> = {
      'Loading': 'Cargando',
      'Save': 'Guardar',
      'Cancel': 'Cancelar',
      'Delete': 'Eliminar',
      'Edit': 'Editar',
      'Create': 'Crear',
      'Update': 'Actualizar',
      'Search': 'Buscar',
      'Filter': 'Filtrar',
      'Actions': 'Acciones',
      'Settings': 'Configuración',
      'Dashboard': 'Panel',
      'Tickets': 'Tickets',
      'Customers': 'Clientes',
      'Analytics': 'Análisis',
      'Error': 'Error',
      'Success': 'Éxito',
      'Warning': 'Advertencia',
      'Information': 'Información'
    };
    return commonTranslations[text] || text;
  }

  private translateToFrench(text: string, key: string): string {
    const commonTranslations: Record<string, string> = {
      'Loading': 'Chargement',
      'Save': 'Enregistrer',
      'Cancel': 'Annuler',
      'Delete': 'Supprimer',
      'Edit': 'Modifier',
      'Create': 'Créer',
      'Update': 'Mettre à jour',
      'Search': 'Rechercher',
      'Filter': 'Filtrer',
      'Actions': 'Actions',
      'Settings': 'Paramètres',
      'Dashboard': 'Tableau de bord',
      'Tickets': 'Tickets',
      'Customers': 'Clients',
      'Analytics': 'Analyses',
      'Error': 'Erreur',
      'Success': 'Succès',
      'Warning': 'Avertissement',
      'Information': 'Information'
    };
    return commonTranslations[text] || text;
  }

  private translateToGerman(text: string, key: string): string {
    const commonTranslations: Record<string, string> = {
      'Loading': 'Laden',
      'Save': 'Speichern',
      'Cancel': 'Abbrechen',
      'Delete': 'Löschen',
      'Edit': 'Bearbeiten',
      'Create': 'Erstellen',
      'Update': 'Aktualisieren',
      'Search': 'Suchen',
      'Filter': 'Filtern',
      'Actions': 'Aktionen',
      'Settings': 'Einstellungen',
      'Dashboard': 'Dashboard',
      'Tickets': 'Tickets',
      'Customers': 'Kunden',
      'Analytics': 'Analysen',
      'Error': 'Fehler',
      'Success': 'Erfolg',
      'Warning': 'Warnung',
      'Information': 'Information'
    };
    return commonTranslations[text] || text;
  }

  /**
   * Set a nested key in an object using dot notation
   */
  private setNestedKey(obj: any, keyPath: string, value: any): void {
    const keys = keyPath.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Check if a nested key exists in an object
   */
  private hasNestedKey(obj: any, keyPath: string): boolean {
    const keys = keyPath.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return current !== undefined && current !== null;
  }

  /**
   * Flatten a nested object to dot notation keys
   */
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, this.flattenObject(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }
    }

    return flattened;
  }
}
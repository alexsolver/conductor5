
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
      'es': 'Seleccionar',
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
    }
  };

  /**
   * Escaneia todos os arquivos fonte para detectar chaves de tradução e textos hardcoded
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
        console.warn(`Could not scan directory for hardcoded texts ${sourceDir}:`, error);
      }
    }

    return hardcodedTexts;
  }

  /**
   * Escaneia diretório para textos hardcoded
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
          const matches = [...line.matchAll(pattern)];
          matches.forEach(match => {
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
          });
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
  async replaceHardcodedTexts(dryRun = true): Promise<{
    file: string;
    replacements: number;
    success: boolean;
    error?: string;
  }[]> {
    const results: Array<{
      file: string;
      replacements: number;
      success: boolean;
      error?: string;
    }> = [];

    const hardcodedTexts = await this.detectHardcodedTexts();
    const fileGroups = hardcodedTexts.reduce((acc, item) => {
      if (!acc[item.file]) acc[item.file] = [];
      acc[item.file].push(item);
      return acc;
    }, {} as Record<string, typeof hardcodedTexts>);

    for (const [filePath, items] of Object.entries(fileGroups)) {
      try {
        let content = await fs.readFile(filePath, 'utf8');
        let replacements = 0;
        
        // Adiciona import do hook de tradução se não existir
        if (!content.includes('useLocalization') && !content.includes('useTranslation')) {
          const importLine = "import { useLocalization } from '@/hooks/useLocalization';\n";
          const lastImport = content.lastIndexOf('import');
          if (lastImport !== -1) {
            const nextLine = content.indexOf('\n', lastImport);
            content = content.slice(0, nextLine + 1) + importLine + content.slice(nextLine + 1);
          }
        }

        // Adiciona hook no componente se não existir
        if (!content.includes('const { t }')) {
          const componentMatch = content.match(/(?:function|const)\s+\w+.*?{/);
          if (componentMatch) {
            const insertPos = content.indexOf('{', componentMatch.index!) + 1;
            const hookLine = '\n  const { t } = useLocalization();\n';
            content = content.slice(0, insertPos) + hookLine + content.slice(insertPos);
          }
        }

        // Substitui textos hardcoded
        for (const item of items) {
          const originalPattern = new RegExp(`['"\`]${item.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
          const replacement = `{t('${item.suggestedKey}')}`;
          
          if (originalPattern.test(content)) {
            content = content.replace(originalPattern, replacement);
            replacements++;
          }
        }

        if (!dryRun && replacements > 0) {
          await fs.writeFile(filePath, content, 'utf8');
        }

        results.push({
          file: filePath,
          replacements,
          success: true
        });

      } catch (error) {
        results.push({
          file: filePath,
          replacements: 0,
          success: false,
          error: String(error)
        });
      }
    }

    return results;
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
            const translation = await this.generateTranslation(missingKey, gap.language, force);
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
   * Obtém configuração da integração OpenAI
   */
  private async getOpenAIConfig(): Promise<{ apiKey: string; baseUrl: string } | null> {
    try {
      const result = await pool.query(`
        SELECT config FROM "public"."system_integrations" 
        WHERE integration_id = $1
      `, ['openai']);

      if (!result.rows[0]?.config) {
        console.warn('[TRANSLATION-AI] OpenAI integration not configured');
        return null;
      }

      const config = result.rows[0].config;
      if (!config.apiKey) {
        console.warn('[TRANSLATION-AI] OpenAI API key not configured');
        return null;
      }

      return {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://api.openai.com/v1'
      };
    } catch (error) {
      console.error('[TRANSLATION-AI] Error getting OpenAI config:', error);
      return null;
    }
  }

  /**
   * Traduz texto usando OpenAI
   */
  private async translateWithOpenAI(text: string, targetLanguage: string): Promise<string | null> {
    try {
      const config = await this.getOpenAIConfig();
      if (!config) {
        return null;
      }

      const languageNames: Record<string, string> = {
        'en': 'English',
        'pt-BR': 'Brazilian Portuguese',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German'
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator specializing in software interface translations. Translate the given text to ${targetLangName}. Keep the translation concise, appropriate for software UI, and maintain any technical terms. Return only the translated text without explanations.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        console.error('[TRANSLATION-AI] OpenAI API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const translation = data.choices?.[0]?.message?.content?.trim();

      if (translation) {
        console.log(`[TRANSLATION-AI] Successfully translated "${text}" to ${targetLanguage}: "${translation}"`);
        return translation;
      }

      return null;
    } catch (error) {
      console.error('[TRANSLATION-AI] Error translating with OpenAI:', error);
      return null;
    }
  }

  /**
   * Gera tradução para uma chave específica
   */
  private async generateTranslation(key: string, language: string, force: boolean): Promise<string | null> {
    // Verifica traduções automáticas pré-definidas
    if (this.AUTO_TRANSLATIONS[key]?.[language]) {
      return this.AUTO_TRANSLATIONS[key][language];
    }

    // Fallback para inglês se não for inglês
    if (language !== 'en' && this.AUTO_TRANSLATIONS[key]?.['en']) {
      const fallback = this.generateFallbackTranslation(this.AUTO_TRANSLATIONS[key]['en'], language);
      if (fallback && !fallback.startsWith('[')) {
        return fallback;
      }
    }

    // Tenta usar OpenAI para tradução automática
    if (language !== 'en') {
      // Primeiro tenta obter o texto em inglês
      let sourceText = this.AUTO_TRANSLATIONS[key]?.['en'];
      
      // Se não tiver tradução em inglês, gera baseado na chave
      if (!sourceText) {
        sourceText = this.generateKeyBasedTranslation(key, 'en').replace(/^\[EN\]\s*/, '');
      }

      if (sourceText) {
        const aiTranslation = await this.translateWithOpenAI(sourceText, language);
        if (aiTranslation) {
          return aiTranslation;
        }
      }
    }

    // Gera tradução baseada na chave como último recurso
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

/**
 * Seed Translations Use Case
 * Popula o banco com traduções básicas do sistema seguindo 1qa.md
 */

import { ITranslationRepository } from '../../domain/repositories/ITranslationRepository';
import { TranslationDomainService } from '../../domain/services/TranslationDomainService';

export class SeedTranslationsUseCase {
  constructor(
    private translationRepository: ITranslationRepository,
    private translationDomainService: TranslationDomainService
  ) {}

  async execute(): Promise<{ created: number; updated: number; errors: string[] }> {
    const results = { created: 0, updated: 0, errors: [] };

    // Traduções básicas do sistema seguindo padrão 1qa.md
    const basicTranslations = [
      // Translation Manager
      { key: 'translationManager.title', en: 'Translation Manager', pt: 'Gerenciador de Traduções', es: 'Administrador de Traducciones' },
      { key: 'translationManager.description', en: 'Manage system translations and localization', pt: 'Gerencie traduções do sistema e localização', es: 'Gestionar traducciones del sistema y localización' },
      { key: 'translationManager.dashboard', en: 'Dashboard', pt: 'Painel', es: 'Panel' },
      { key: 'translationManager.translations', en: 'Translations', pt: 'Traduções', es: 'Traducciones' },
      { key: 'translationManager.gaps', en: 'Gaps Analysis', pt: 'Análise de Lacunas', es: 'Análisis de Brechas' },
      { key: 'translationManager.bulk', en: 'Bulk Operations', pt: 'Operações em Lote', es: 'Operaciones en Lote' },
      
      // Common UI
      { key: 'common.save', en: 'Save', pt: 'Salvar', es: 'Guardar' },
      { key: 'common.cancel', en: 'Cancel', pt: 'Cancelar', es: 'Cancelar' },
      { key: 'common.edit', en: 'Edit', pt: 'Editar', es: 'Editar' },
      { key: 'common.delete', en: 'Delete', pt: 'Excluir', es: 'Eliminar' },
      { key: 'common.create', en: 'Create', pt: 'Criar', es: 'Crear' },
      { key: 'common.search', en: 'Search', pt: 'Buscar', es: 'Buscar' },
      { key: 'common.loading', en: 'Loading...', pt: 'Carregando...', es: 'Cargando...' },
      
      // Messages
      { key: 'messages.success', en: 'Operation completed successfully', pt: 'Operação concluída com sucesso', es: 'Operación completada exitosamente' },
      { key: 'messages.error', en: 'An error occurred', pt: 'Ocorreu um erro', es: 'Ocurrió un error' },
      { key: 'messages.saved', en: 'Changes saved successfully', pt: 'Alterações salvas com sucesso', es: 'Cambios guardados exitosamente' },
      
      // Buttons
      { key: 'buttons.submit', en: 'Submit', pt: 'Enviar', es: 'Enviar' },
      { key: 'buttons.reset', en: 'Reset', pt: 'Resetar', es: 'Resetear' },
      { key: 'buttons.close', en: 'Close', pt: 'Fechar', es: 'Cerrar' },
      
      // Validation
      { key: 'validation.required', en: 'This field is required', pt: 'Este campo é obrigatório', es: 'Este campo es obligatorio' },
      { key: 'validation.email', en: 'Please enter a valid email', pt: 'Por favor, insira um email válido', es: 'Por favor, ingrese un email válido' }
    ];

    // Criar traduções para cada idioma
    const languages = ['en', 'pt-BR', 'es'];
    
    for (const lang of languages) {
      for (const item of basicTranslations) {
        try {
          let value = '';
          switch (lang) {
            case 'en': value = item.en; break;
            case 'pt-BR': value = item.pt; break;
            case 'es': value = item.es; break;
          }

          // Verificar se já existe
          const existing = await this.translationRepository.findByKey(item.key, lang);
          
          if (!existing) {
            await this.translationRepository.create({
              key: item.key,
              language: lang,
              value,
              module: item.key.split('.')[0],
              context: 'System basic translations',
              isGlobal: true,
              isCustomizable: true,
              version: 1,
              tenantId: null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            results.created++;
          } else {
            // Atualizar se necessário
            await this.translationRepository.update(existing.id, {
              value,
              updatedAt: new Date()
            });
            results.updated++;
          }
        } catch (error: any) {
          results.errors.push(`Failed to create ${item.key} (${lang}): ${error.message}`);
        }
      }
    }

    return results;
  }
}
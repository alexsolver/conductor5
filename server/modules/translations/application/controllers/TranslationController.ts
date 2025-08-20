/**
 * Translation Controller
 * Application layer controller for translation operations
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { CreateTranslationUseCase } from '../use-cases/CreateTranslationUseCase';
import { UpdateTranslationUseCase } from '../use-cases/UpdateTranslationUseCase';
import { BulkImportTranslationsUseCase } from '../use-cases/BulkImportTranslationsUseCase';
import { GetTranslationStatsUseCase } from '../use-cases/GetTranslationStatsUseCase';
import { SearchTranslationsUseCase } from '../use-cases/SearchTranslationsUseCase';
import { 
  CreateTranslationDTO, 
  UpdateTranslationDTO,
  BulkImportDTO,
  TranslationSearchDTO,
  TranslationStatsDTO,
  ExportTranslationsDTO
} from '../dto/TranslationDTO';

export class TranslationController {
  constructor(
    private createTranslationUseCase: CreateTranslationUseCase,
    private updateTranslationUseCase: UpdateTranslationUseCase,
    private bulkImportUseCase: BulkImportTranslationsUseCase,
    private getStatsUseCase: GetTranslationStatsUseCase,
    private searchUseCase: SearchTranslationsUseCase
  ) {}

  async createTranslation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request body
      const data = CreateTranslationDTO.parse(req.body);
      
      // Check permissions - only SaaS admins can create global translations
      const isGlobal = data.isGlobal ?? true;
      if (isGlobal && req.user?.role !== 'saas_admin') {
        res.status(403).json({
          success: false,
          message: 'SaaS admin access required for global translations'
        });
        return;
      }

      const tenantId = isGlobal ? undefined : req.user?.tenantId;
      
      const translation = await this.createTranslationUseCase.execute(
        data,
        req.user!.id,
        tenantId
      );

      res.status(201).json({
        success: true,
        message: 'Translation created successfully',
        data: translation
      });
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 :
                        error.message.includes('Invalid') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create translation',
        error: error.message
      });
    }
  }

  async updateTranslation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = UpdateTranslationDTO.parse(req.body);
      
      const translation = await this.updateTranslationUseCase.execute(
        id,
        data,
        req.user!.id,
        req.user?.tenantId
      );

      res.json({
        success: true,
        message: 'Translation updated successfully',
        data: translation
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Access denied') ? 403 :
                        error.message.includes('Invalid') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update translation',
        error: error.message
      });
    }
  }

  async bulkImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = BulkImportDTO.parse(req.body);
      
      // Check permissions for global imports
      if (!data.module && req.user?.role !== 'saas_admin') {
        res.status(403).json({
          success: false,
          message: 'SaaS admin access required for global bulk imports'
        });
        return;
      }

      const result = await this.bulkImportUseCase.execute(
        data,
        req.user!.id,
        req.user?.tenantId
      );

      res.json({
        success: true,
        message: `Bulk import completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to import translations',
        error: error.message
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = TranslationStatsDTO.parse(req.query);
      
      const stats = await this.getStatsUseCase.execute(
        data,
        req.user?.tenantId
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get translation statistics',
        error: error.message
      });
    }
  }

  async searchTranslations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = TranslationSearchDTO.parse(req.query);
      
      const results = await this.searchUseCase.execute(
        data,
        req.user?.tenantId
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search translations',
        error: error.message
      });
    }
  }

  async exportTranslations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = ExportTranslationsDTO.parse(req.query);
      
      // For now, return a placeholder response
      // Real implementation would generate file and stream it
      res.json({
        success: true,
        message: `Export for language ${data.language} will be available shortly`,
        data: {
          downloadUrl: `/api/translations/exports/${data.language}-${Date.now()}.${data.format}`,
          format: data.format,
          language: data.language,
          module: data.module
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export translations',
        error: error.message
      });
    }
  }

  async getLanguages(req: Request, res: Response): Promise<void> {
    try {
      const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
        { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', rtl: false },
        { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
        { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪', rtl: false }
      ];

      res.json({
        success: true,
        data: { languages }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get supported languages',
        error: error.message
      });
    }
  }

  async getTranslationsByLanguage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { language } = req.params;
      
      // Use search use case with language filter
      const results = await this.searchUseCase.execute(
        { language, limit: 10000, offset: 0 },
        req.user?.tenantId
      );

      // Convert to key-value format for frontend
      const translationsMap: Record<string, string> = {};
      for (const translation of results.translations) {
        translationsMap[translation.key] = translation.value;
      }

      res.json({
        success: true,
        data: {
          language,
          translations: translationsMap,
          lastModified: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get translations',
        error: error.message
      });
    }
  }
}
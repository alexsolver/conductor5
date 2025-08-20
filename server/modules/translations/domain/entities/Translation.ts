/**
 * Translation Domain Entity
 * Core business entity for translation management
 */

export interface Translation {
  id: string;
  key: string;
  language: string;
  value: string;
  module: string;
  context?: string;
  tenantId?: string;
  isGlobal: boolean;
  isCustomizable: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface TranslationKey {
  key: string;
  module: string;
  context?: string;
  defaultValue: string;
  description?: string;
  parameters?: string[];
  isCustomizable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  completeness: number;
  lastUpdated: Date;
}

export interface TranslationGap {
  language: string;
  missingKeys: string[];
  moduleGaps: Record<string, string[]>;
  stats: TranslationStats;
}

export interface BulkTranslationImport {
  language: string;
  module?: string;
  translations: Record<string, string>;
  overwrite: boolean;
  validateOnly: boolean;
}

export interface TranslationAudit {
  id: string;
  translationKey: string;
  language: string;
  oldValue?: string;
  newValue: string;
  action: 'create' | 'update' | 'delete';
  tenantId?: string;
  changedBy: string;
  changedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}
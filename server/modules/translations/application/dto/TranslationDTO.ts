/**
 * Translation Data Transfer Objects
 * Application layer DTOs for translation operations
 */

import { z } from 'zod';

// Create Translation DTO
export const CreateTranslationDTO = z.object({
  key: z.string().min(1).max(200).regex(/^[a-z][a-zA-Z0-9._-]*$/, 'Invalid key format'),
  language: z.string().min(2).max(10),
  value: z.string().min(0).max(5000),
  module: z.string().min(1).max(100),
  context: z.string().optional(),
  isGlobal: z.boolean().default(true),
  isCustomizable: z.boolean().default(true),
});

// Update Translation DTO
export const UpdateTranslationDTO = z.object({
  value: z.string().min(0).max(5000),
  context: z.string().optional(),
  isCustomizable: z.boolean().optional(),
}).partial().refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// Create Translation Key DTO
export const CreateTranslationKeyDTO = z.object({
  key: z.string().min(1).max(200).regex(/^[a-z][a-zA-Z0-9._-]*$/, 'Invalid key format'),
  module: z.string().min(1).max(100),
  defaultValue: z.string().min(1),
  description: z.string().optional(),
  parameters: z.array(z.string()).optional(),
  isCustomizable: z.boolean().default(true),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
});

// Bulk Import DTO
export const BulkImportDTO = z.object({
  language: z.string().min(2).max(10),
  module: z.string().min(1).max(100).optional(),
  translations: z.record(z.string().min(0).max(5000)),
  overwrite: z.boolean().default(false),
  validateOnly: z.boolean().default(false),
});

// Translation Search DTO
export const TranslationSearchDTO = z.object({
  query: z.string().min(1).optional(),
  language: z.string().min(2).max(10).optional(),
  module: z.string().min(1).max(100).optional(),
  includeGlobal: z.boolean().default(true),
  includeTenant: z.boolean().default(true),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

// Translation Stats Request DTO
export const TranslationStatsDTO = z.object({
  language: z.string().min(2).max(10).optional(),
  module: z.string().min(1).max(100).optional(),
  includeModuleBreakdown: z.boolean().default(false),
});

// Export DTO
export const ExportTranslationsDTO = z.object({
  language: z.string().min(2).max(10),
  module: z.string().min(1).max(100).optional(),
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  includeMetadata: z.boolean().default(false),
});

// Type exports
export type CreateTranslationData = z.infer<typeof CreateTranslationDTO>;
export type UpdateTranslationData = z.infer<typeof UpdateTranslationDTO>;
export type CreateTranslationKeyData = z.infer<typeof CreateTranslationKeyDTO>;
export type BulkImportData = z.infer<typeof BulkImportDTO>;
export type TranslationSearchData = z.infer<typeof TranslationSearchDTO>;
export type TranslationStatsData = z.infer<typeof TranslationStatsDTO>;
export type ExportTranslationsData = z.infer<typeof ExportTranslationsDTO>;
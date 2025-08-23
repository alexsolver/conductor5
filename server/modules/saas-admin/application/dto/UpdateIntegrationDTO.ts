// ===========================================================================================
// UPDATE INTEGRATION DTO - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// DTO Pattern - Data Transfer Objects para Application layer

import { z } from 'zod';

// ===========================================================================================
// OPENWEATHER API KEY UPDATE DTO
// ===========================================================================================

export const updateOpenWeatherApiKeySchema = z.object({
  apiKey: z.string()
    .min(1, 'API key is required')
    .min(32, 'OpenWeather API key must be at least 32 characters')
    .max(100, 'API key too long'),
  testConnection: z.boolean().optional().default(false)
});

export type UpdateOpenWeatherApiKeyDTO = z.infer<typeof updateOpenWeatherApiKeySchema>;

// ===========================================================================================
// GENERIC INTEGRATION CONFIG UPDATE DTO
// ===========================================================================================

export const updateIntegrationConfigSchema = z.object({
  config: z.record(z.any()),
  enabled: z.boolean().optional(),
  testConnection: z.boolean().optional().default(false)
});

export type UpdateIntegrationConfigDTO = z.infer<typeof updateIntegrationConfigSchema>;

// ===========================================================================================
// INTEGRATION STATUS UPDATE DTO
// ===========================================================================================

export const updateIntegrationStatusSchema = z.object({
  status: z.enum(['connected', 'error', 'disconnected']),
  message: z.string().optional()
});

export type UpdateIntegrationStatusDTO = z.infer<typeof updateIntegrationStatusSchema>;
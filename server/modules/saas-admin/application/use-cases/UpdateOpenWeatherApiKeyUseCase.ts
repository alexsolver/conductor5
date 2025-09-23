// ===========================================================================================
// UPDATE OPENWEATHER API KEY USE CASE - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md

import { Integration } from '../../domain/entities/Integration';
import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';

export interface UpdateOpenWeatherApiKeyRequest {
  apiKey: string;
  testConnection?: boolean;
}

export interface UpdateOpenWeatherApiKeyResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface UpdateSendGridApiKeyRequest {
  apiKey: string;
  fromEmail?: string;
  testConnection?: boolean;
}

export interface UpdateSendGridApiKeyResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}
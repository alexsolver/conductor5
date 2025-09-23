
// ===========================================================================================
// UPDATE SENDGRID API KEY USE CASE - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md

import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';

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

// ✅ SEMPRE seguir este padrão (1qa.md line 68-75)
export class UpdateSendGridApiKeyUseCase {
  constructor(
    private integrationRepository: IIntegrationRepository,
    private logger: any = console // Logger injection for compliance
  ) {}

  async execute(request: UpdateSendGridApiKeyRequest): Promise<UpdateSendGridApiKeyResponse> {
    try {
      // Validation - Domain rules
      if (!request.apiKey || typeof request.apiKey !== 'string') {
        return {
          success: false,
          message: 'API key is required and must be a string',
          errors: ['Invalid API key format']
        };
      }

      // SendGrid API key validation
      if (!request.apiKey.startsWith('SG.')) {
        return {
          success: false,
          message: 'SendGrid API key must start with "SG."',
          errors: ['Invalid SendGrid API key format']
        };
      }

      if (request.apiKey.length < 60) {
        return {
          success: false,
          message: 'SendGrid API key must be at least 60 characters',
          errors: ['API key too short']
        };
      }

      // Email validation if provided
      if (request.fromEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(request.fromEmail)) {
          return {
            success: false,
            message: 'Invalid email format for fromEmail',
            errors: ['Invalid from email format']
          };
        }
      }

      this.logger.info('[UPDATE-SENDGRID-USE-CASE] Updating SendGrid API key');

      // Repository operation
      const integration = await this.integrationRepository.updateSendGridApiKey(
        request.apiKey.trim(),
        request.fromEmail?.trim()
      );

      this.logger.info('[UPDATE-SENDGRID-USE-CASE] SendGrid API key updated successfully');

      return {
        success: true,
        message: 'SendGrid API key updated successfully',
        data: {
          integration: {
            id: integration.id,
            name: integration.name,
            provider: integration.provider,
            status: integration.status,
            config: {
              ...integration.config,
              apiKey: integration.config.apiKey ? `${integration.config.apiKey.substring(0, 8)}...` : null // Mask API key
            },
            updatedAt: integration.updatedAt
          }
        }
      };

    } catch (error) {
      this.logger.error('[UPDATE-SENDGRID-USE-CASE] Error updating SendGrid API key:', error);
      
      return {
        success: false,
        message: 'Failed to update SendGrid API key',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

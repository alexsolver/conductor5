/**
 * GDPR Compliance Controller - Main Application Layer
 * Clean Architecture - Request/Response handling
 * Following 1qa.md enterprise patterns
 */

import { Request, Response } from 'express';
import { CreateDataSubjectRequestUseCase } from '../use-cases/CreateDataSubjectRequestUseCase';
import { GetGdprComplianceMetricsUseCase } from '../use-cases/GetGdprComplianceMetricsUseCase';
import { DrizzleGdprRepository } from '../../infrastructure/repositories/DrizzleGdprRepository';
import type { InsertCookieConsent, InsertPrivacyPolicy, InsertSecurityIncident } from '@shared/schema-gdpr-compliance-clean';

export class GdprController {
  private createDataSubjectRequestUseCase: CreateDataSubjectRequestUseCase;
  private getGdprComplianceMetricsUseCase: GetGdprComplianceMetricsUseCase;
  private gdprRepository: DrizzleGdprRepository;

  constructor() {
    this.gdprRepository = new DrizzleGdprRepository();
    this.createDataSubjectRequestUseCase = new CreateDataSubjectRequestUseCase(this.gdprRepository);
    this.getGdprComplianceMetricsUseCase = new GetGdprComplianceMetricsUseCase(this.gdprRepository);
  }

  // ✅ 1. Cookie Consent Management
  async createCookieConsent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const consentData: InsertCookieConsent = {
        ...req.body,
        tenantId,
        userId: userId || null
      };

      const consent = await this.gdprRepository.createCookieConsent(consentData);

      res.status(201).json({
        success: true,
        message: 'Cookie consent recorded successfully',
        data: consent
      });

    } catch (error) {
      console.error('[GdprController] createCookieConsent error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getCookieConsents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      const consents = await this.gdprRepository.findCookieConsentsByUser(userId, tenantId);

      res.json({
        success: true,
        message: 'Cookie consents retrieved successfully',
        data: consents
      });

    } catch (error) {
      console.error('[GdprController] getCookieConsents error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ✅ 3-7. Data Subject Requests (Direitos GDPR)
  async createDataSubjectRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      const result = await this.createDataSubjectRequestUseCase.execute({
        ...req.body,
        userId,
        tenantId
      });

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error('[GdprController] createDataSubjectRequest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getDataSubjectRequests(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      const requests = await this.gdprRepository.findDataSubjectRequestsByUser(userId, tenantId);

      res.json({
        success: true,
        message: 'Data subject requests retrieved successfully',
        data: requests
      });

    } catch (error) {
      console.error('[GdprController] getDataSubjectRequests error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateDataSubjectRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const updatedRequest = await this.gdprRepository.updateDataSubjectRequest(id, req.body);

      res.json({
        success: true,
        message: 'Data subject request updated successfully',
        data: updatedRequest
      });

    } catch (error) {
      console.error('[GdprController] updateDataSubjectRequest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ✅ 9. Privacy Policies
  async createPrivacyPolicy(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      const policyData: InsertPrivacyPolicy = {
        ...req.body,
        tenantId,
        createdBy: userId
      };

      const policy = await this.gdprRepository.createPrivacyPolicy(policyData);

      res.status(201).json({
        success: true,
        message: 'Privacy policy created successfully',
        data: policy
      });

    } catch (error) {
      console.error('[GdprController] createPrivacyPolicy error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getPrivacyPolicies(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const policies = await this.gdprRepository.findActivePrivacyPolicies(tenantId);

      res.json({
        success: true,
        message: 'Privacy policies retrieved successfully',
        data: policies
      });

    } catch (error) {
      console.error('[GdprController] getPrivacyPolicies error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ✅ 10. Security Incidents
  async createSecurityIncident(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      const incidentData: InsertSecurityIncident = {
        ...req.body,
        tenantId,
        reportedBy: userId
      };

      const incident = await this.gdprRepository.createSecurityIncident(incidentData);

      res.status(201).json({
        success: true,
        message: 'Security incident reported successfully',
        data: incident
      });

    } catch (error) {
      console.error('[GdprController] createSecurityIncident error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getSecurityIncidents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { status, severity } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      let incidents;
      if (status) {
        incidents = await this.gdprRepository.findSecurityIncidentsByStatus(status as string, tenantId);
      } else if (severity) {
        incidents = await this.gdprRepository.findSecurityIncidentsBySeverity(severity as string, tenantId);
      } else {
        incidents = await this.gdprRepository.findIncidentsRequiringNotification(tenantId);
      }

      res.json({
        success: true,
        message: 'Security incidents retrieved successfully',
        data: incidents
      });

    } catch (error) {
      console.error('[GdprController] getSecurityIncidents error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ✅ 12. User Preferences Portal - Funcionalidade 12: Gestão de Preferências de Privacidade
  async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      // ✅ Seguindo padrão 1qa.md - extrair informações do JWT
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = req.user?.userId || req.user?.id;

      console.log(`[GdprController] getUserPreferences - userId: ${userId}, tenantId: ${tenantId}`);
      console.log(`[GdprController] req.user:`, req.user);

      if (!tenantId || !userId) {
        console.error('[GdprController] Missing required authentication data');
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required',
          details: {
            hasUser: !!req.user,
            hasTenantId: !!tenantId,
            hasUserId: !!userId
          }
        });
        return;
      }

      console.log(`[GdprController] Fetching GDPR preferences for user ${userId} in tenant ${tenantId}`);
      
      // ✅ Buscar preferências usando repository conforme Clean Architecture
      const preferences = await this.gdprRepository.findGdprUserPreferencesByUser(userId, tenantId);

      console.log(`[GdprController] GDPR preferences result:`, preferences ? 'Found' : 'Not found');

      res.json({
        success: true,
        message: 'User preferences retrieved successfully',
        data: preferences
      });

    } catch (error) {
      console.error('[GdprController] getUserPreferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      // ✅ Seguindo padrão 1qa.md - extrair informações do JWT
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = req.user?.userId || req.user?.id;

      console.log(`[GdprController] updateUserPreferences - userId: ${userId}, tenantId: ${tenantId}`);

      if (!tenantId || !userId) {
        console.error('[GdprController] Missing required authentication data for update');
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      console.log(`[GdprController] Updating GDPR preferences for user ${userId}`, req.body);

      // ✅ Tentar encontrar preferências existentes conforme Clean Architecture
      let preferences = await this.gdprRepository.findGdprUserPreferencesByUser(userId, tenantId);

      if (preferences) {
        // Atualizar existentes
        console.log(`[GdprController] Updating existing preferences for user ${userId}`);
        preferences = await this.gdprRepository.updateGdprUserPreferences(preferences.id, req.body);
      } else {
        // Criar novas preferências
        console.log(`[GdprController] Creating new preferences for user ${userId}`);
        preferences = await this.gdprRepository.createGdprUserPreferences({
          ...req.body,
          userId,
          tenantId
        });
      }

      console.log(`[GdprController] GDPR preferences updated successfully for user ${userId}`);

      res.json({
        success: true,
        message: 'User preferences updated successfully',
        data: preferences
      });

    } catch (error) {
      console.error('[GdprController] updateUserPreferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ✅ Compliance Metrics & Dashboard
  async getComplianceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const result = await this.getGdprComplianceMetricsUseCase.execute({ tenantId });

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error('[GdprController] getComplianceMetrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ✅ GDPR Data Export (Right of Access)
  async exportUserData(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      const exportData = await this.gdprRepository.exportUserData(userId, tenantId);

      res.json({
        success: true,
        message: 'User data exported successfully',
        data: exportData
      });

    } catch (error) {
      console.error('[GdprController] exportUserData error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ✅ GDPR Data Deletion (Right to be Forgotten)
  async deleteUserData(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      console.log('🗑️ [GDPR-CONTROLLER] Processing data deletion request:', { userId, tenantId });

      // Import and execute DeleteUserDataUseCase
      const { DeleteUserDataUseCase } = await import('../use-cases/DeleteUserDataUseCase');
      const deleteUserDataUseCase = new DeleteUserDataUseCase();

      const result = await deleteUserDataUseCase.execute({
        userId,
        tenantId,
        requestDetails: req.body?.requestDetails || 'Solicitação de exclusão via interface do usuário',
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      console.log('✅ [GDPR-CONTROLLER] Data deletion completed:', result.requestId);

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('❌ [GDPR-CONTROLLER] deleteUserData error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // ✅ ADMIN: Privacy Policy Management
  async getPrivacyPolicies(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      console.log('[GdprController] getPrivacyPolicies - tenantId:', tenantId);

      const policies = await this.gdprRepository.findAllPrivacyPolicies(tenantId);
      
      res.json({
        success: true,
        message: 'Privacy policies retrieved successfully',
        data: policies
      });

    } catch (error) {
      console.log('[GdprController] getPrivacyPolicies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve privacy policies',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createPrivacyPolicy(req: Request, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const { title, content, version, policyType, effectiveDate, requiresAcceptance } = req.body;

      console.log('[GdprController] createPrivacyPolicy - data:', { title, version, policyType });

      const policyData = {
        id: undefined,
        tenantId,
        createdBy: userId,
        policyType,
        version,
        title,
        content,
        isActive: false,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        requiresAcceptance: requiresAcceptance || true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const policy = await this.gdprRepository.createPrivacyPolicy(policyData);
      
      res.json({
        success: true,
        message: 'Privacy policy created successfully',
        data: policy
      });

    } catch (error) {
      console.log('[GdprController] createPrivacyPolicy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create privacy policy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async activatePrivacyPolicy(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { policyId } = req.params;

      console.log('[GdprController] activatePrivacyPolicy - policyId:', policyId);

      // Deactivate all other policies of the same type first
      await this.gdprRepository.deactivateOtherPolicies(policyId, tenantId);
      
      // Activate the selected policy
      const policy = await this.gdprRepository.activatePrivacyPolicy(policyId, tenantId);
      
      res.json({
        success: true,
        message: 'Privacy policy activated successfully',
        data: policy
      });

    } catch (error) {
      console.log('[GdprController] activatePrivacyPolicy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate privacy policy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ✅ USER FACING: Get current active privacy policy
  async getCurrentPrivacyPolicy(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID required'
        });
        return;
      }

      const policies = await this.gdprRepository.findAllPrivacyPolicies(tenantId);
      const activePolicy = policies.find(p => p.isActive) || policies[0];

      res.json({
        success: true,
        message: 'Current privacy policy retrieved successfully',
        data: activePolicy || null
      });

    } catch (error) {
      console.error('[GdprController] getCurrentPrivacyPolicy error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // ✅ ADMIN FACING: Get all privacy policies for admin
  async getAdminPrivacyPolicies(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID required'
        });
        return;
      }

      const policies = await this.gdprRepository.findAllPrivacyPolicies(tenantId);

      res.json({
        success: true,
        message: 'Privacy policies retrieved successfully',
        data: policies
      });

    } catch (error) {
      console.error('[GdprController] getAdminPrivacyPolicies error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
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

  // ✅ 12. User Preferences Portal
  async getUserPreferences(req: Request, res: Response): Promise<void> {
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

      const preferences = await this.gdprRepository.findGdprUserPreferencesByUser(userId, tenantId);

      res.json({
        success: true,
        message: 'User preferences retrieved successfully',
        data: preferences
      });

    } catch (error) {
      console.error('[GdprController] getUserPreferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateUserPreferences(req: Request, res: Response): Promise<void> {
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

      // Tentar encontrar preferências existentes
      let preferences = await this.gdprRepository.findGdprUserPreferencesByUser(userId, tenantId);

      if (preferences) {
        // Atualizar existentes
        preferences = await this.gdprRepository.updateGdprUserPreferences(preferences.id, req.body);
      } else {
        // Criar novas preferências
        preferences = await this.gdprRepository.createGdprUserPreferences({
          ...req.body,
          userId,
          tenantId
        });
      }

      res.json({
        success: true,
        message: 'User preferences updated successfully',
        data: preferences
      });

    } catch (error) {
      console.error('[GdprController] updateUserPreferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
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
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and user authentication required'
        });
        return;
      }

      await this.gdprRepository.deleteUserData(userId, tenantId);

      res.json({
        success: true,
        message: 'User data deleted successfully (Right to be Forgotten)'
      });

    } catch (error) {
      console.error('[GdprController] deleteUserData error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
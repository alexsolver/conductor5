/**
 * GDPR Compliance Repository Interface
 * Clean Architecture - Domain Layer
 * Following 1qa.md patterns for repository abstraction
 */

import type { CookieConsent } from '../entities/CookieConsent';
import type { DataSubjectRequest } from '../entities/DataSubjectRequest';
import type { SecurityIncident } from '../entities/SecurityIncident';
import type {
  InsertCookieConsent,
  InsertDataConsent,
  InsertDataSubjectRequest,
  InsertGdprAuditLog,
  InsertPrivacyPolicy,
  InsertSecurityIncident,
  InsertDataRetentionPolicy,
  InsertGdprUserPreferences,
  DataConsent,
  GdprAuditLog,
  PrivacyPolicy,
  DataRetentionPolicy,
  GdprUserPreferences
} from '@shared/schema-gdpr-compliance-clean';

export interface IGdprComplianceRepository {
  // ✅ 1. Cookie Consents
  createCookieConsent(data: InsertCookieConsent): Promise<CookieConsent>;
  findCookieConsentsByUser(userId: string, tenantId: string): Promise<CookieConsent[]>;
  findCookieConsentsBySession(sessionId: string, tenantId: string): Promise<CookieConsent[]>;
  updateCookieConsent(id: string, data: Partial<InsertCookieConsent>): Promise<CookieConsent>;
  revokeCookieConsent(id: string, tenantId: string): Promise<void>;

  // ✅ 2. Data Consents
  createDataConsent(data: InsertDataConsent): Promise<DataConsent>;
  findDataConsentsByUser(userId: string, tenantId: string): Promise<DataConsent[]>;
  updateDataConsent(id: string, data: Partial<InsertDataConsent>): Promise<DataConsent>;
  revokeDataConsent(id: string, tenantId: string): Promise<void>;

  // ✅ 3-7. Data Subject Requests (Direitos GDPR)
  createDataSubjectRequest(data: InsertDataSubjectRequest): Promise<DataSubjectRequest>;
  findDataSubjectRequestById(id: string, tenantId: string): Promise<DataSubjectRequest | null>;
  findDataSubjectRequestsByUser(userId: string, tenantId: string): Promise<DataSubjectRequest[]>;
  findDataSubjectRequestsByStatus(status: string, tenantId: string): Promise<DataSubjectRequest[]>;
  updateDataSubjectRequest(id: string, data: Partial<InsertDataSubjectRequest>): Promise<DataSubjectRequest>;
  findOverdueRequests(tenantId: string): Promise<DataSubjectRequest[]>;

  // ✅ 8. Audit Logs
  createAuditLog(data: InsertGdprAuditLog): Promise<GdprAuditLog>;
  findAuditLogsByUser(userId: string, tenantId: string): Promise<GdprAuditLog[]>;
  findAuditLogsByEntity(entityType: string, entityId: string, tenantId: string): Promise<GdprAuditLog[]>;
  findAuditLogsByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<GdprAuditLog[]>;

  // ✅ 9. Privacy Policies
  createPrivacyPolicy(data: InsertPrivacyPolicy): Promise<PrivacyPolicy>;
  findPrivacyPolicyById(id: string, tenantId: string): Promise<PrivacyPolicy | null>;
  findActivePrivacyPolicies(tenantId: string): Promise<PrivacyPolicy[]>;
  findPrivacyPoliciesByType(policyType: string, tenantId: string): Promise<PrivacyPolicy[]>;
  updatePrivacyPolicy(id: string, data: Partial<InsertPrivacyPolicy>): Promise<PrivacyPolicy>;
  publishPrivacyPolicy(id: string, tenantId: string): Promise<PrivacyPolicy>;

  // ✅ 10. Security Incidents
  createSecurityIncident(data: InsertSecurityIncident): Promise<SecurityIncident>;
  findSecurityIncidentById(id: string, tenantId: string): Promise<SecurityIncident | null>;
  findSecurityIncidentsByStatus(status: string, tenantId: string): Promise<SecurityIncident[]>;
  findSecurityIncidentsBySeverity(severity: string, tenantId: string): Promise<SecurityIncident[]>;
  updateSecurityIncident(id: string, data: Partial<InsertSecurityIncident>): Promise<SecurityIncident>;
  findIncidentsRequiringNotification(tenantId: string): Promise<SecurityIncident[]>;

  // ✅ 11. Data Retention Policies
  createDataRetentionPolicy(data: InsertDataRetentionPolicy): Promise<DataRetentionPolicy>;
  findDataRetentionPolicyById(id: string, tenantId: string): Promise<DataRetentionPolicy | null>;
  findActiveDataRetentionPolicies(tenantId: string): Promise<DataRetentionPolicy[]>;
  findDataRetentionPoliciesByCategory(category: string, tenantId: string): Promise<DataRetentionPolicy[]>;
  updateDataRetentionPolicy(id: string, data: Partial<InsertDataRetentionPolicy>): Promise<DataRetentionPolicy>;

  // ✅ 12. User Preferences
  createGdprUserPreferences(data: InsertGdprUserPreferences): Promise<GdprUserPreferences>;
  findGdprUserPreferencesByUser(userId: string, tenantId: string): Promise<GdprUserPreferences | null>;
  updateGdprUserPreferences(id: string, data: Partial<InsertGdprUserPreferences>): Promise<GdprUserPreferences>;
  deleteGdprUserPreferences(userId: string, tenantId: string): Promise<void>;

  // ✅ Analytics e Reporting
  getComplianceMetrics(tenantId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    overdueRequests: number;
    completedRequests: number;
    averageResponseTime: number;
    consentRate: number;
    activeIncidents: number;
  }>;

  // ✅ Bulk Operations para GDPR
  exportUserData(userId: string, tenantId: string): Promise<any>;
  deleteUserData(userId: string, tenantId: string): Promise<void>;
  anonymizeUserData(userId: string, tenantId: string): Promise<void>;
}
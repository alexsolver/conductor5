/**
 * Drizzle GDPR Compliance Repository Implementation
 * Clean Architecture - Infrastructure Layer
 * Following 1qa.md patterns for database integration
 */

import { eq, and, gte, lte, isNull, desc } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

import type { IGdprComplianceRepository } from '../../domain/repositories/IGdprComplianceRepository';
import { CookieConsent } from '../../domain/entities/CookieConsent';
import { DataSubjectRequest } from '../../domain/entities/DataSubjectRequest';
import { SecurityIncident } from '../../domain/entities/SecurityIncident';
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

import {
  cookieConsents,
  dataConsents,
  dataSubjectRequests,
  gdprAuditLogs,
  privacyPolicies,
  securityIncidents,
  dataRetentionPolicies,
  gdprUserPreferences
} from '@shared/schema-gdpr-compliance-clean';

export class DrizzleGdprComplianceRepository implements IGdprComplianceRepository {
  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }
  
  // ✅ 1. Cookie Consents Implementation
  async createCookieConsent(data: InsertCookieConsent): Promise<CookieConsent> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(cookieConsents).values(data).returning();
    return CookieConsent.create(result);
  }

  async findCookieConsentsByUser(userId: string, tenantId: string): Promise<CookieConsent[]> {
    const results = await db
      .select()
      .from(cookieConsents)
      .where(and(eq(cookieConsents.userId, userId), eq(cookieConsents.tenantId, tenantId)))
      .orderBy(desc(cookieConsents.createdAt));
    
    return results.map(result => CookieConsent.create(result));
  }

  async findCookieConsentsBySession(sessionId: string, tenantId: string): Promise<CookieConsent[]> {
    const results = await db
      .select()
      .from(cookieConsents)
      .where(and(eq(cookieConsents.sessionId, sessionId), eq(cookieConsents.tenantId, tenantId)))
      .orderBy(desc(cookieConsents.createdAt));
    
    return results.map(result => CookieConsent.create(result));
  }

  async updateCookieConsent(id: string, data: Partial<InsertCookieConsent>): Promise<CookieConsent> {
    const [result] = await db
      .update(cookieConsents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cookieConsents.id, id))
      .returning();
    
    return CookieConsent.create(result);
  }

  async revokeCookieConsent(id: string, tenantId: string): Promise<void> {
    await db
      .update(cookieConsents)
      .set({ 
        granted: false,
        revokedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(cookieConsents.id, id), eq(cookieConsents.tenantId, tenantId)));
  }

  // ✅ 2. Data Consents Implementation
  async createDataConsent(data: InsertDataConsent): Promise<DataConsent> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(dataConsents).values(data).returning();
    return result;
  }

  async findDataConsentsByUser(userId: string, tenantId: string): Promise<DataConsent[]> {
    return await db
      .select()
      .from(dataConsents)
      .where(and(eq(dataConsents.userId, userId), eq(dataConsents.tenantId, tenantId)))
      .orderBy(desc(dataConsents.createdAt));
  }

  async updateDataConsent(id: string, data: Partial<InsertDataConsent>): Promise<DataConsent> {
    const [result] = await db
      .update(dataConsents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataConsents.id, id))
      .returning();
    
    return result;
  }

  async revokeDataConsent(id: string, tenantId: string): Promise<void> {
    await db
      .update(dataConsents)
      .set({ 
        consentGiven: false,
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(eq(dataConsents.id, id), eq(dataConsents.tenantId, tenantId)));
  }

  // ✅ 3-7. Data Subject Requests Implementation
  async createDataSubjectRequest(data: InsertDataSubjectRequest): Promise<DataSubjectRequest> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(dataSubjectRequests).values(data).returning();
    return DataSubjectRequest.create(result);
  }

  async findDataSubjectRequestById(id: string, tenantId: string): Promise<DataSubjectRequest | null> {
    const results = await db
      .select()
      .from(dataSubjectRequests)
      .where(and(eq(dataSubjectRequests.id, id), eq(dataSubjectRequests.tenantId, tenantId)))
      .limit(1);
    
    return results.length > 0 ? DataSubjectRequest.create(results[0]) : null;
  }

  async findDataSubjectRequestsByUser(userId: string, tenantId: string): Promise<DataSubjectRequest[]> {
    const results = await db
      .select()
      .from(dataSubjectRequests)
      .where(and(eq(dataSubjectRequests.userId, userId), eq(dataSubjectRequests.tenantId, tenantId)))
      .orderBy(desc(dataSubjectRequests.createdAt));
    
    return results.map(result => DataSubjectRequest.create(result));
  }

  async findDataSubjectRequestsByStatus(status: string, tenantId: string): Promise<DataSubjectRequest[]> {
    const results = await db
      .select()
      .from(dataSubjectRequests)
      .where(and(eq(dataSubjectRequests.status, status), eq(dataSubjectRequests.tenantId, tenantId)))
      .orderBy(desc(dataSubjectRequests.createdAt));
    
    return results.map(result => DataSubjectRequest.create(result));
  }

  async updateDataSubjectRequest(id: string, data: Partial<InsertDataSubjectRequest>): Promise<DataSubjectRequest> {
    const [result] = await db
      .update(dataSubjectRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataSubjectRequests.id, id))
      .returning();
    
    return DataSubjectRequest.create(result);
  }

  async findOverdueRequests(tenantId: string): Promise<DataSubjectRequest[]> {
    const results = await db
      .select()
      .from(dataSubjectRequests)
      .where(and(
        eq(dataSubjectRequests.tenantId, tenantId),
        lte(dataSubjectRequests.dueDate, new Date()),
        isNull(dataSubjectRequests.completedAt)
      ))
      .orderBy(desc(dataSubjectRequests.dueDate));
    
    return results.map(result => DataSubjectRequest.create(result));
  }

  // ✅ 8. Audit Logs Implementation
  async createAuditLog(data: InsertGdprAuditLog): Promise<GdprAuditLog> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(gdprAuditLogs).values(data).returning();
    return result;
  }

  async findAuditLogsByUser(userId: string, tenantId: string): Promise<GdprAuditLog[]> {
    return await db
      .select()
      .from(gdprAuditLogs)
      .where(and(eq(gdprAuditLogs.userId, userId), eq(gdprAuditLogs.tenantId, tenantId)))
      .orderBy(desc(gdprAuditLogs.createdAt));
  }

  async findAuditLogsByEntity(entityType: string, entityId: string, tenantId: string): Promise<GdprAuditLog[]> {
    return await db
      .select()
      .from(gdprAuditLogs)
      .where(and(
        eq(gdprAuditLogs.entityType, entityType),
        eq(gdprAuditLogs.entityId, entityId),
        eq(gdprAuditLogs.tenantId, tenantId)
      ))
      .orderBy(desc(gdprAuditLogs.createdAt));
  }

  async findAuditLogsByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<GdprAuditLog[]> {
    return await db
      .select()
      .from(gdprAuditLogs)
      .where(and(
        eq(gdprAuditLogs.tenantId, tenantId),
        gte(gdprAuditLogs.createdAt, startDate),
        lte(gdprAuditLogs.createdAt, endDate)
      ))
      .orderBy(desc(gdprAuditLogs.createdAt));
  }

  // ✅ 9. Privacy Policies Implementation
  async createPrivacyPolicy(data: InsertPrivacyPolicy): Promise<PrivacyPolicy> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(privacyPolicies).values(data).returning();
    return result;
  }

  async findPrivacyPolicyById(id: string, tenantId: string): Promise<PrivacyPolicy | null> {
    const results = await db
      .select()
      .from(privacyPolicies)
      .where(and(eq(privacyPolicies.id, id), eq(privacyPolicies.tenantId, tenantId)))
      .limit(1);
    
    return results.length > 0 ? results[0] : null;
  }

  async findActivePrivacyPolicies(tenantId: string): Promise<PrivacyPolicy[]> {
    return await db
      .select()
      .from(privacyPolicies)
      .where(and(eq(privacyPolicies.tenantId, tenantId), eq(privacyPolicies.isActive, true)))
      .orderBy(desc(privacyPolicies.createdAt));
  }

  async findPrivacyPoliciesByType(policyType: string, tenantId: string): Promise<PrivacyPolicy[]> {
    return await db
      .select()
      .from(privacyPolicies)
      .where(and(eq(privacyPolicies.policyType, policyType), eq(privacyPolicies.tenantId, tenantId)))
      .orderBy(desc(privacyPolicies.createdAt));
  }

  async updatePrivacyPolicy(id: string, data: Partial<InsertPrivacyPolicy>): Promise<PrivacyPolicy> {
    const [result] = await db
      .update(privacyPolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(privacyPolicies.id, id))
      .returning();
    
    return result;
  }

  async publishPrivacyPolicy(id: string, tenantId: string): Promise<PrivacyPolicy> {
    const [result] = await db
      .update(privacyPolicies)
      .set({ 
        isPublished: true,
        isActive: true,
        updatedAt: new Date()
      })
      .where(and(eq(privacyPolicies.id, id), eq(privacyPolicies.tenantId, tenantId)))
      .returning();
    
    return result;
  }

  // ✅ 10. Security Incidents Implementation
  async createSecurityIncident(data: InsertSecurityIncident): Promise<SecurityIncident> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(securityIncidents).values(data).returning();
    return SecurityIncident.create(result);
  }

  async findSecurityIncidentById(id: string, tenantId: string): Promise<SecurityIncident | null> {
    const results = await db
      .select()
      .from(securityIncidents)
      .where(and(eq(securityIncidents.id, id), eq(securityIncidents.tenantId, tenantId)))
      .limit(1);
    
    return results.length > 0 ? SecurityIncident.create(results[0]) : null;
  }

  async findSecurityIncidentsByStatus(status: string, tenantId: string): Promise<SecurityIncident[]> {
    // Implementação baseada em containedAt e resolvedAt para determinar status
    let whereClause;
    if (status === 'open') {
      whereClause = and(eq(securityIncidents.tenantId, tenantId), isNull(securityIncidents.resolvedAt));
    } else if (status === 'contained') {
      whereClause = and(
        eq(securityIncidents.tenantId, tenantId), 
        isNull(securityIncidents.resolvedAt),
        sql`${securityIncidents.containedAt} IS NOT NULL`
      );
    } else {
      whereClause = and(
        eq(securityIncidents.tenantId, tenantId),
        sql`${securityIncidents.resolvedAt} IS NOT NULL`
      );
    }

    const results = await db
      .select()
      .from(securityIncidents)
      .where(whereClause)
      .orderBy(desc(securityIncidents.createdAt));
    
    return results.map(result => SecurityIncident.create(result));
  }

  async findSecurityIncidentsBySeverity(severity: string, tenantId: string): Promise<SecurityIncident[]> {
    const results = await db
      .select()
      .from(securityIncidents)
      .where(and(eq(securityIncidents.severity, severity), eq(securityIncidents.tenantId, tenantId)))
      .orderBy(desc(securityIncidents.createdAt));
    
    return results.map(result => SecurityIncident.create(result));
  }

  async updateSecurityIncident(id: string, data: Partial<InsertSecurityIncident>): Promise<SecurityIncident> {
    const [result] = await db
      .update(securityIncidents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(securityIncidents.id, id))
      .returning();
    
    return SecurityIncident.create(result);
  }

  async findIncidentsRequiringNotification(tenantId: string): Promise<SecurityIncident[]> {
    const results = await db
      .select()
      .from(securityIncidents)
      .where(and(
        eq(securityIncidents.tenantId, tenantId),
        sql`${securityIncidents.severity} IN ('high', 'very_high')`,
        eq(securityIncidents.authorityNotified, false)
      ))
      .orderBy(desc(securityIncidents.discoveredAt));
    
    return results.map(result => SecurityIncident.create(result));
  }

  // ✅ 11. Data Retention Policies Implementation
  async createDataRetentionPolicy(data: InsertDataRetentionPolicy): Promise<DataRetentionPolicy> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(dataRetentionPolicies).values(data).returning();
    return result;
  }

  async findDataRetentionPolicyById(id: string, tenantId: string): Promise<DataRetentionPolicy | null> {
    const results = await db
      .select()
      .from(dataRetentionPolicies)
      .where(and(eq(dataRetentionPolicies.id, id), eq(dataRetentionPolicies.tenantId, tenantId)))
      .limit(1);
    
    return results.length > 0 ? results[0] : null;
  }

  async findActiveDataRetentionPolicies(tenantId: string): Promise<DataRetentionPolicy[]> {
    return await db
      .select()
      .from(dataRetentionPolicies)
      .where(and(eq(dataRetentionPolicies.tenantId, tenantId), eq(dataRetentionPolicies.isActive, true)))
      .orderBy(desc(dataRetentionPolicies.createdAt));
  }

  async findDataRetentionPoliciesByCategory(category: string, tenantId: string): Promise<DataRetentionPolicy[]> {
    return await db
      .select()
      .from(dataRetentionPolicies)
      .where(and(eq(dataRetentionPolicies.dataCategory, category), eq(dataRetentionPolicies.tenantId, tenantId)))
      .orderBy(desc(dataRetentionPolicies.createdAt));
  }

  async updateDataRetentionPolicy(id: string, data: Partial<InsertDataRetentionPolicy>): Promise<DataRetentionPolicy> {
    const [result] = await db
      .update(dataRetentionPolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataRetentionPolicies.id, id))
      .returning();
    
    return result;
  }

  // ✅ 12. User Preferences Implementation
  async createGdprUserPreferences(data: InsertGdprUserPreferences): Promise<GdprUserPreferences> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(gdprUserPreferences).values(data).returning();
    return result;
  }

  async findGdprUserPreferencesByUser(userId: string, tenantId: string): Promise<GdprUserPreferences | null> {
    const results = await db
      .select()
      .from(gdprUserPreferences)
      .where(and(eq(gdprUserPreferences.userId, userId), eq(gdprUserPreferences.tenantId, tenantId)))
      .limit(1);
    
    return results.length > 0 ? results[0] : null;
  }

  async updateGdprUserPreferences(id: string, data: Partial<InsertGdprUserPreferences>): Promise<GdprUserPreferences> {
    const [result] = await db
      .update(gdprUserPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(gdprUserPreferences.id, id))
      .returning();
    
    return result;
  }

  async deleteGdprUserPreferences(userId: string, tenantId: string): Promise<void> {
    await db
      .delete(gdprUserPreferences)
      .where(and(eq(gdprUserPreferences.userId, userId), eq(gdprUserPreferences.tenantId, tenantId)));
  }

  // ✅ Analytics e Reporting Implementation
  async getComplianceMetrics(tenantId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    overdueRequests: number;
    completedRequests: number;
    averageResponseTime: number;
    consentRate: number;
    activeIncidents: number;
  }> {
    // Total requests
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataSubjectRequests)
      .where(eq(dataSubjectRequests.tenantId, tenantId));

    // Pending requests  
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataSubjectRequests)
      .where(and(
        eq(dataSubjectRequests.tenantId, tenantId),
        eq(dataSubjectRequests.status, 'pending')
      ));

    // Overdue requests
    const [overdueResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataSubjectRequests)
      .where(and(
        eq(dataSubjectRequests.tenantId, tenantId),
        lte(dataSubjectRequests.dueDate, new Date()),
        isNull(dataSubjectRequests.completedAt)
      ));

    // Completed requests
    const [completedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataSubjectRequests)
      .where(and(
        eq(dataSubjectRequests.tenantId, tenantId),
        eq(dataSubjectRequests.status, 'completed')
      ));

    // Active incidents
    const [incidentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityIncidents)
      .where(and(
        eq(securityIncidents.tenantId, tenantId),
        isNull(securityIncidents.resolvedAt)
      ));

    // Basic consent rate calculation
    const [consentResult] = await db
      .select({ 
        granted: sql<number>`count(*) filter (where granted = true)`,
        total: sql<number>`count(*)` 
      })
      .from(cookieConsents)
      .where(eq(cookieConsents.tenantId, tenantId));

    return {
      totalRequests: totalResult?.count || 0,
      pendingRequests: pendingResult?.count || 0,
      overdueRequests: overdueResult?.count || 0,
      completedRequests: completedResult?.count || 0,
      averageResponseTime: 0, // TODO: Calculate based on request processing times
      consentRate: consentResult?.total ? (consentResult.granted / consentResult.total) * 100 : 0,
      activeIncidents: incidentsResult?.count || 0
    };
  }

  // ✅ Bulk GDPR Operations (Simplified Implementation)
  async exportUserData(userId: string, tenantId: string): Promise<any> {
    // Aggregate all user data for GDPR export
    const [cookieData, consentData, requestData, preferencesData] = await Promise.all([
      this.findCookieConsentsByUser(userId, tenantId),
      this.findDataConsentsByUser(userId, tenantId),
      this.findDataSubjectRequestsByUser(userId, tenantId),
      this.findGdprUserPreferencesByUser(userId, tenantId)
    ]);

    return {
      cookieConsents: cookieData,
      dataConsents: consentData,
      dataSubjectRequests: requestData,
      userPreferences: preferencesData,
      exportedAt: new Date().toISOString()
    };
  }

  async deleteUserData(userId: string, tenantId: string): Promise<void> {
    // Delete user data across all GDPR tables
    await Promise.all([
      db.delete(cookieConsents).where(and(eq(cookieConsents.userId, userId), eq(cookieConsents.tenantId, tenantId))),
      db.delete(dataConsents).where(and(eq(dataConsents.userId, userId), eq(dataConsents.tenantId, tenantId))),
      db.delete(gdprUserPreferences).where(and(eq(gdprUserPreferences.userId, userId), eq(gdprUserPreferences.tenantId, tenantId)))
    ]);
  }

  async anonymizeUserData(userId: string, tenantId: string): Promise<void> {
    // Anonymize user data instead of deletion
    const anonymizedId = `anon_${Date.now()}`;
    
    await Promise.all([
      db.update(cookieConsents)
        .set({ userId: anonymizedId, userAgent: 'ANONYMIZED', ipAddress: 'ANONYMIZED' })
        .where(and(eq(cookieConsents.userId, userId), eq(cookieConsents.tenantId, tenantId))),
      
      db.update(dataConsents)
        .set({ userId: anonymizedId })
        .where(and(eq(dataConsents.userId, userId), eq(dataConsents.tenantId, tenantId))),

      db.update(gdprAuditLogs)
        .set({ userId: anonymizedId, subjectUserId: anonymizedId })
        .where(and(eq(gdprAuditLogs.userId, userId), eq(gdprAuditLogs.tenantId, tenantId)))
    ]);
  }
}
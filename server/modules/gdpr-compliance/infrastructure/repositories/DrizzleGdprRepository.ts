/**
 * Drizzle GDPR Compliance Repository Implementation - Clean
 * Clean Architecture - Infrastructure Layer
 * Following 1qa.md patterns for database integration
 */

import { eq, and, gte, lte, isNull, desc, sql } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import crypto from 'crypto';

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

export class DrizzleGdprRepository implements IGdprComplianceRepository {
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
    
    return results.map((result: any) => CookieConsent.create(result));
  }

  async findCookieConsentsBySession(sessionId: string, tenantId: string): Promise<CookieConsent[]> {
    const results = await db
      .select()
      .from(cookieConsents)
      .where(and(eq(cookieConsents.sessionId, sessionId), eq(cookieConsents.tenantId, tenantId)))
      .orderBy(desc(cookieConsents.createdAt));
    
    return results.map((result: any) => CookieConsent.create(result));
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
    try {
      // ✅ Correção seguindo 1qa.md - select simples sem especificação de campos para evitar erro Drizzle
      const results = await db
        .select()
        .from(dataSubjectRequests)
        .where(and(eq(dataSubjectRequests.userId, userId), eq(dataSubjectRequests.tenantId, tenantId)))
        .orderBy(desc(dataSubjectRequests.createdAt));
    
      return results.map((result: any) => DataSubjectRequest.create(result));
    } catch (error) {
      console.error('[DrizzleGdprRepository] findDataSubjectRequestsByUser error:', error);
      return []; // ✅ Fallback vazio seguindo 1qa.md
    }
  }

  async findDataSubjectRequestsByStatus(status: string, tenantId: string): Promise<DataSubjectRequest[]> {
    const results = await db
      .select()
      .from(dataSubjectRequests)
      .where(and(
        sql`${dataSubjectRequests.status} = ${status}`, 
        eq(dataSubjectRequests.tenantId, tenantId)
      ))
      .orderBy(desc(dataSubjectRequests.createdAt));
    
    return results.map((result: any) => DataSubjectRequest.create(result));
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
    // ✅ Correção seguindo padrão 1qa.md - usar campos existentes no schema
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const results = await db
      .select()
      .from(dataSubjectRequests)
      .where(and(
        eq(dataSubjectRequests.tenantId, tenantId),
        lte(dataSubjectRequests.createdAt, thirtyDaysAgo),
        eq(dataSubjectRequests.status, 'pending')
      ))
      .orderBy(desc(dataSubjectRequests.createdAt));
    
    return results.map((result: any) => DataSubjectRequest.create(result));
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
    
    return results.map((result: any) => SecurityIncident.create(result));
  }

  async findSecurityIncidentsBySeverity(severity: string, tenantId: string): Promise<SecurityIncident[]> {
    const results = await db
      .select()
      .from(securityIncidents)
      .where(and(
        sql`${securityIncidents.severity} = ${severity}`, 
        eq(securityIncidents.tenantId, tenantId)
      ))
      .orderBy(desc(securityIncidents.createdAt));
    
    return results.map((result: any) => SecurityIncident.create(result));
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
    // ✅ Correção seguindo padrão 1qa.md - usar campos existentes no schema
    const results = await db
      .select()
      .from(securityIncidents)
      .where(and(
        eq(securityIncidents.tenantId, tenantId),
        eq(securityIncidents.authorityNotified, false)
      ))
      .orderBy(desc(securityIncidents.createdAt));
    
    return results.map((result: any) => SecurityIncident.create(result));
  }

  // ✅ Simplified implementations for other methods
  async createDataConsent(data: InsertDataConsent): Promise<DataConsent> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(dataConsents).values(data).returning();
    return result;
  }

  async findDataConsentsByUser(userId: string, tenantId: string): Promise<DataConsent[]> {
    return await db
      .select()
      .from(dataConsents)
      .where(and(eq(dataConsents.userId, userId), eq(dataConsents.tenantId, tenantId)));
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
      .set({ consentGiven: false, isActive: false, updatedAt: new Date() })
      .where(and(eq(dataConsents.id, id), eq(dataConsents.tenantId, tenantId)));
  }

  async createAuditLog(data: InsertGdprAuditLog): Promise<GdprAuditLog> {
    const tenantDb = await this.getTenantDb(data.tenantId);
    const [result] = await tenantDb.insert(gdprAuditLogs).values(data).returning();
    return result;
  }

  async findAuditLogsByUser(userId: string, tenantId: string): Promise<GdprAuditLog[]> {
    return await db
      .select()
      .from(gdprAuditLogs)
      .where(and(eq(gdprAuditLogs.userId, userId), eq(gdprAuditLogs.tenantId, tenantId)));
  }

  async findAuditLogsByEntity(entityType: string, entityId: string, tenantId: string): Promise<GdprAuditLog[]> {
    return await db
      .select()
      .from(gdprAuditLogs)
      .where(and(eq(gdprAuditLogs.entityType, entityType), eq(gdprAuditLogs.entityId, entityId), eq(gdprAuditLogs.tenantId, tenantId)));
  }

  async findAuditLogsByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<GdprAuditLog[]> {
    return await db
      .select()
      .from(gdprAuditLogs)
      .where(and(eq(gdprAuditLogs.tenantId, tenantId), gte(gdprAuditLogs.createdAt, startDate), lte(gdprAuditLogs.createdAt, endDate)));
  }

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
      .where(and(eq(privacyPolicies.tenantId, tenantId), eq(privacyPolicies.isActive, true)));
  }

  async findPrivacyPoliciesByType(policyType: string, tenantId: string): Promise<PrivacyPolicy[]> {
    return await db
      .select()
      .from(privacyPolicies)
      .where(and(sql`${privacyPolicies.policyType} = ${policyType}`, eq(privacyPolicies.tenantId, tenantId)));
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
      .set({ isPublished: true, isActive: true, updatedAt: new Date() })
      .where(and(eq(privacyPolicies.id, id), eq(privacyPolicies.tenantId, tenantId)))
      .returning();
    return result;
  }

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
      .where(and(eq(dataRetentionPolicies.tenantId, tenantId), eq(dataRetentionPolicies.isActive, true)));
  }

  async findDataRetentionPoliciesByCategory(category: string, tenantId: string): Promise<DataRetentionPolicy[]> {
    return await db
      .select()
      .from(dataRetentionPolicies)
      .where(and(eq(dataRetentionPolicies.dataCategory, category), eq(dataRetentionPolicies.tenantId, tenantId)));
  }

  async updateDataRetentionPolicy(id: string, data: Partial<InsertDataRetentionPolicy>): Promise<DataRetentionPolicy> {
    const [result] = await db
      .update(dataRetentionPolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataRetentionPolicies.id, id))
      .returning();
    return result;
  }

  async createGdprUserPreferences(data: InsertGdprUserPreferences): Promise<GdprUserPreferences> {
    try {
      // ✅ Seguindo padrão 1qa.md - validar constraints existentes
      if (!data.tenantId) throw new Error('Tenant ID required');
      if (!data.userId) throw new Error('User ID required');

      console.log(`[DrizzleGdprRepository] Creating GDPR preferences for user ${data.userId} in tenant ${data.tenantId}`);
      
      // ✅ Correção seguindo padrão 1qa.md - usar apenas campos válidos do schema
      const preferencesData = {
        userId: data.userId,
        tenantId: data.tenantId,
        emailMarketing: data.emailMarketing ?? false,
        smsMarketing: data.smsMarketing ?? false,
        dataProcessingForAnalytics: data.dataProcessingForAnalytics ?? true,
        profileVisibility: data.profileVisibility ?? 'private',
        cookiePreferences: data.cookiePreferences ?? JSON.stringify({ necessary: true }),
        communicationFrequency: data.communicationFrequency ?? 'minimal',
        dataRetentionPreference: data.dataRetentionPreference ?? 'minimal'
      };

      const [result] = await db
        .insert(gdprUserPreferences)
        .values(preferencesData)
        .returning();
        
      console.log(`[DrizzleGdprRepository] GDPR preferences created successfully with ID ${result.id}`);
      return result;
      
    } catch (error) {
      console.error('[DrizzleGdprRepository] createGdprUserPreferences error:', error);
      throw error;
    }
  }

  async findGdprUserPreferencesByUser(userId: string, tenantId: string): Promise<GdprUserPreferences | null> {
    try {
      // ✅ Seguindo padrão 1qa.md - validar constraints existentes
      if (!tenantId) throw new Error('Tenant ID required');
      if (!userId) throw new Error('User ID required');

      console.log(`[DrizzleGdprRepository] Finding GDPR preferences for user ${userId} in tenant ${tenantId}`);
      
      const results = await db
        .select()
        .from(gdprUserPreferences)
        .where(and(
          eq(gdprUserPreferences.userId, userId), 
          eq(gdprUserPreferences.tenantId, tenantId)
        ))
        .limit(1);

      // ✅ Se não existir, criar preferências padrão conforme 1qa.md
      if (results.length === 0) {
        console.log(`[DrizzleGdprRepository] No preferences found, creating default for user ${userId}`);
        
        // ✅ Preferências padrão seguindo padrão 1qa.md
        const defaultPreferences = {
          userId: userId,
          tenantId: tenantId,
          emailMarketing: false,
          smsMarketing: false,
          dataProcessingForAnalytics: true,
          profileVisibility: 'private' as const,
          cookiePreferences: JSON.stringify({
            necessary: true,
            statistical: false,
            marketing: false
          }),
          communicationFrequency: 'minimal' as const,
          dataRetentionPreference: 'minimal' as const
        };

        const [created] = await db
          .insert(gdprUserPreferences)
          .values(defaultPreferences)
          .returning();
          
        console.log(`[DrizzleGdprRepository] Created default preferences for user ${userId}`);
        return created;
      }
      
      console.log(`[DrizzleGdprRepository] Found existing preferences for user ${userId}`);
      return results[0];
      
    } catch (error) {
      console.error('[DrizzleGdprRepository] findGdprUserPreferencesByUser error:', error);
      throw error;
    }
  }

  async updateGdprUserPreferences(id: string, data: Partial<InsertGdprUserPreferences>): Promise<GdprUserPreferences> {
    try {
      // ✅ Seguindo padrão 1qa.md - validar constraints existentes
      if (!id) throw new Error('Preference ID required');

      console.log(`[DrizzleGdprRepository] Updating GDPR preferences ${id}`);
      
      // ✅ Usar apenas campos válidos do schema
      const updateData: Partial<InsertGdprUserPreferences> = {};
      if (data.emailMarketing !== undefined) updateData.emailMarketing = data.emailMarketing;
      if (data.smsMarketing !== undefined) updateData.smsMarketing = data.smsMarketing;
      if (data.dataProcessingForAnalytics !== undefined) updateData.dataProcessingForAnalytics = data.dataProcessingForAnalytics;
      if (data.profileVisibility !== undefined) updateData.profileVisibility = data.profileVisibility;
      if (data.cookiePreferences !== undefined) updateData.cookiePreferences = data.cookiePreferences;
      if (data.communicationFrequency !== undefined) updateData.communicationFrequency = data.communicationFrequency;
      if (data.dataRetentionPreference !== undefined) updateData.dataRetentionPreference = data.dataRetentionPreference;

      const [result] = await db
        .update(gdprUserPreferences)
        .set(updateData)
        .where(eq(gdprUserPreferences.id, id))
        .returning();
        
      if (!result) {
        throw new Error(`GDPR preferences with ID ${id} not found`);
      }
        
      console.log(`[DrizzleGdprRepository] GDPR preferences ${id} updated successfully`);
      return result;
      
    } catch (error) {
      console.error('[DrizzleGdprRepository] updateGdprUserPreferences error:', error);
      throw error;
    }
  }

  async deleteGdprUserPreferences(userId: string, tenantId: string): Promise<void> {
    await db
      .delete(gdprUserPreferences)
      .where(and(eq(gdprUserPreferences.userId, userId), eq(gdprUserPreferences.tenantId, tenantId)));
  }

  async getComplianceMetrics(tenantId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    overdueRequests: number;
    completedRequests: number;
    averageResponseTime: number;
    consentRate: number;
    activeIncidents: number;
  }> {
    // Simplified metrics calculation
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataSubjectRequests)
      .where(eq(dataSubjectRequests.tenantId, tenantId));

    return {
      totalRequests: totalResult?.count || 0,
      pendingRequests: 0,
      overdueRequests: 0,
      completedRequests: 0,
      averageResponseTime: 0,
      consentRate: 0,
      activeIncidents: 0
    };
  }

  async exportUserData(userId: string, tenantId: string): Promise<any> {
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
    await Promise.all([
      db.delete(cookieConsents).where(and(eq(cookieConsents.userId, userId), eq(cookieConsents.tenantId, tenantId))),
      db.delete(dataConsents).where(and(eq(dataConsents.userId, userId), eq(dataConsents.tenantId, tenantId))),
      db.delete(gdprUserPreferences).where(and(eq(gdprUserPreferences.userId, userId), eq(gdprUserPreferences.tenantId, tenantId)))
    ]);
  }

  async anonymizeUserData(userId: string, tenantId: string): Promise<void> {
    const anonymizedId = `anon_${Date.now()}`;
    
    await Promise.all([
      db.update(cookieConsents)
        .set({ userId: anonymizedId, userAgent: 'ANONYMIZED', ipAddress: 'ANONYMIZED' })
        .where(and(eq(cookieConsents.userId, userId), eq(cookieConsents.tenantId, tenantId))),
      
      db.update(dataConsents)
        .set({ userId: anonymizedId })
        .where(and(eq(dataConsents.userId, userId), eq(dataConsents.tenantId, tenantId)))
    ]);
  }

  // ✅ Privacy Policy Management - ADMIN
  async findAllPrivacyPolicies(tenantId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(privacyPolicies)
      .where(eq(privacyPolicies.tenantId, tenantId))
      .orderBy(desc(privacyPolicies.createdAt));
    
    return results;
  }

  async createPrivacyPolicy(data: any): Promise<any> {
    const [result] = await db
      .insert(privacyPolicies)
      .values(data)
      .returning();
    
    return result;
  }

  async activatePrivacyPolicy(policyId: string, tenantId: string): Promise<any> {
    const [result] = await db
      .update(privacyPolicies)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(and(
        eq(privacyPolicies.id, policyId),
        eq(privacyPolicies.tenantId, tenantId)
      ))
      .returning();
    
    return result;
  }

  async deactivateOtherPolicies(currentPolicyId: string, tenantId: string): Promise<void> {
    await db
      .update(privacyPolicies)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        ne(privacyPolicies.id, currentPolicyId),
        eq(privacyPolicies.tenantId, tenantId)
      ));
  }
}
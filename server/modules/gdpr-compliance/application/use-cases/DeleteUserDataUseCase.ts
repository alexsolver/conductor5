/**
 * Delete User Data Use Case
 * Clean Architecture - Application Layer
 * GDPR Article 17: Right to Erasure (Right to be Forgotten)
 */

import { db } from '../../../../db';
import { dataSubjectRequests, gdprAuditLogs } from '@shared/schema-gdpr-compliance';
import { users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface DeleteUserDataRequest {
  userId: string;
  tenantId: string;
  requestDetails?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface DeleteUserDataResponse {
  success: boolean;
  message: string;
  requestId: string;
  data?: any;
}

export class DeleteUserDataUseCase {
  async execute(request: DeleteUserDataRequest): Promise<DeleteUserDataResponse> {
    const { userId, tenantId, requestDetails, ipAddress, userAgent } = request;

    try {
      console.log('🗑️ [DELETE-USER-DATA] Starting data erasure process:', { userId, tenantId });

      // Step 1: Create Data Subject Request (GDPR compliance)
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      const [dataSubjectRequest] = await db
        .insert(dataSubjectRequests)
        .values({
          userId,
          tenantId,
          requestType: 'erasure',
          status: 'in_progress',
          requestDetails: requestDetails || 'Solicitação de exclusão de dados pessoais (Direito ao Esquecimento)',
          dueDate,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('✅ [DELETE-USER-DATA] Data Subject Request created:', dataSubjectRequest.id);

      // Step 2: Get user data before anonymization (for audit)
      const [userData] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        ))
        .limit(1);

      if (!userData) {
        throw new Error('User not found');
      }

      console.log('🔍 [DELETE-USER-DATA] User data found, proceeding with anonymization');

      // Step 3: Anonymize user data (GDPR-compliant soft delete)
      // We anonymize rather than hard delete to maintain referential integrity
      const anonymizedEmail = `deleted_user_${userId.substring(0, 8)}@anonymized.local`;
      const anonymizedName = `Usuário Excluído`;

      await db
        .update(users)
        .set({
          email: anonymizedEmail,
          name: anonymizedName,
          phone: null,
          // Mark as deleted but keep for audit trail
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        ));

      console.log('✅ [DELETE-USER-DATA] User data anonymized successfully');

      // Step 4: Update Data Subject Request to completed
      await db
        .update(dataSubjectRequests)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
          responseData: {
            anonymizedAt: new Date().toISOString(),
            originalEmail: userData.email,
            anonymizedEmail,
            dataRetained: ['audit_logs', 'gdpr_requests'] // Required by law
          }
        })
        .where(eq(dataSubjectRequests.id, dataSubjectRequest.id));

      console.log('✅ [DELETE-USER-DATA] Data Subject Request marked as completed');

      // Step 5: Create GDPR Audit Log
      await db
        .insert(gdprAuditLogs)
        .values({
          userId,
          subjectUserId: userId,
          action: 'data_erasure_completed',
          entityType: 'user',
          entityId: userId,
          ipAddress: ipAddress || '0.0.0.0',
          userAgent: userAgent || 'unknown',
          requestData: {
            requestId: dataSubjectRequest.id,
            requestType: 'erasure',
            requestDetails
          },
          responseData: {
            anonymizedEmail,
            completedAt: new Date().toISOString()
          },
          tenantId,
          severity: 'high',
          createdAt: new Date()
        });

      console.log('✅ [DELETE-USER-DATA] Audit log created');

      return {
        success: true,
        message: 'Seus dados foram excluídos com sucesso. Você será desconectado em instantes.',
        requestId: dataSubjectRequest.id,
        data: {
          anonymizedAt: new Date().toISOString(),
          requestId: dataSubjectRequest.id
        }
      };

    } catch (error) {
      console.error('❌ [DELETE-USER-DATA] Error during data erasure:', error);
      
      // Log failed attempt
      try {
        await db
          .insert(gdprAuditLogs)
          .values({
            userId,
            subjectUserId: userId,
            action: 'data_erasure_failed',
            entityType: 'user',
            entityId: userId,
            ipAddress: ipAddress || '0.0.0.0',
            userAgent: userAgent || 'unknown',
            requestData: {
              requestDetails,
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            tenantId,
            severity: 'high',
            createdAt: new Date()
          });
      } catch (auditError) {
        console.error('❌ [DELETE-USER-DATA] Failed to create audit log:', auditError);
      }

      throw new Error('Failed to delete user data. Please contact support.');
    }
  }
}

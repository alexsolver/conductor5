// ✅ 1QA.MD COMPLIANCE: APPROVAL TOKEN SERVICE
// Service for generating and validating unique approval tokens

import crypto from 'crypto';
import { db } from '../../../db';
import { approvalInstances } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export class ApprovalTokenService {
  /**
   * Generate a secure unique token for approval via email
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store token in database and set expiration (24 hours default)
   */
  static async createApprovalToken(
    instanceId: string,
    expirationHours: number = 24
  ): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    await db
      .update(approvalInstances)
      .set({
        approvalToken: token,
        tokenExpiresAt: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(approvalInstances.id, instanceId));

    console.log(`✅ [APPROVAL-TOKEN] Token created for instance ${instanceId}, expires at ${expiresAt}`);
    return token;
  }

  /**
   * Validate token and return instance if valid
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    instanceId?: string;
    tenantId?: string;
    entityId?: string;
    entityType?: string;
    error?: string;
  }> {
    try {
      const [instance] = await db
        .select()
        .from(approvalInstances)
        .where(
          and(
            eq(approvalInstances.approvalToken, token),
            gt(approvalInstances.tokenExpiresAt, new Date())
          )
        )
        .limit(1);

      if (!instance) {
        return { valid: false, error: 'Token inválido ou expirado' };
      }

      if (instance.status !== 'pending') {
        return { valid: false, error: 'Esta aprovação já foi processada' };
      }

      return {
        valid: true,
        instanceId: instance.id,
        tenantId: instance.tenantId,
        entityId: instance.entityId,
        entityType: instance.entityType
      };
    } catch (error) {
      console.error('❌ [APPROVAL-TOKEN] Error validating token:', error);
      return { valid: false, error: 'Erro ao validar token' };
    }
  }

  /**
   * Invalidate token after use
   */
  static async invalidateToken(instanceId: string): Promise<void> {
    await db
      .update(approvalInstances)
      .set({
        approvalToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date()
      })
      .where(eq(approvalInstances.id, instanceId));

    console.log(`✅ [APPROVAL-TOKEN] Token invalidated for instance ${instanceId}`);
  }
}

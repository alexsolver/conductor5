/**
 * Cookie Consent Domain Entity
 * Clean Architecture - Domain Layer
 * GDPR/LGPD Compliance - Funcionalidade 1: Consentimento de Cookies & Rastreamento
 */

import type { CookieConsent as CookieConsentType } from '@shared/schema-gdpr-compliance-clean';

export class CookieConsent {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly sessionId: string | null,
    public readonly consentType: string,
    public readonly granted: boolean,
    public readonly consentVersion: string,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly tenantId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly revokedAt: Date | null,
    public readonly auditTrail: any
  ) {}

  /**
   * Verifica se o consentimento ainda é válido
   */
  isValid(): boolean {
    return this.granted && !this.revokedAt;
  }

  /**
   * Verifica se o consentimento foi revogado
   */
  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  /**
   * Factory method para criar nova instância
   */
  static create(data: Partial<CookieConsentType>): CookieConsent {
    if (!data.consentType || typeof data.granted !== 'boolean' || !data.consentVersion || !data.tenantId) {
      throw new Error('Missing required fields for CookieConsent');
    }

    return new CookieConsent(
      data.id || crypto.randomUUID(),
      data.userId || null,
      data.sessionId || null,
      data.consentType,
      data.granted,
      data.consentVersion,
      data.ipAddress || null,
      data.userAgent || null,
      data.tenantId,
      data.createdAt || new Date(),
      data.updatedAt || new Date(),
      data.revokedAt || null,
      data.auditTrail || {}
    );
  }

  /**
   * Revoga o consentimento
   */
  revoke(): CookieConsent {
    return new CookieConsent(
      this.id,
      this.userId,
      this.sessionId,
      this.consentType,
      false,
      this.consentVersion,
      this.ipAddress,
      this.userAgent,
      this.tenantId,
      this.createdAt,
      new Date(),
      new Date(),
      { ...this.auditTrail, revokedAt: new Date().toISOString() }
    );
  }
}
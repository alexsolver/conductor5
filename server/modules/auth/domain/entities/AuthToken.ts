/**
 * AuthToken Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for authentication tokens
 */

export class AuthToken {
  constructor(
    private readonly accessToken: string,
    private readonly refreshToken: string,
    private readonly userId: string,
    private readonly tenantId: string,
    private readonly expiresAt: Date,
    private readonly refreshExpiresAt: Date,
    private readonly issuedAt: Date = new Date()
  ) {}

  // Getters
  getAccessToken(): string { return this.accessToken; }
  getRefreshToken(): string { return this.refreshToken; }
  getUserId(): string { return this.userId; }
  getTenantId(): string { return this.tenantId; }
  getExpiresAt(): Date { return this.expiresAt; }
  getRefreshExpiresAt(): Date { return this.refreshExpiresAt; }
  getIssuedAt(): Date { return this.issuedAt; }

  // Business methods
  isAccessTokenExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRefreshTokenExpired(): boolean {
    return new Date() > this.refreshExpiresAt;
  }

  isValid(): boolean {
    return !this.isAccessTokenExpired();
  }

  canRefresh(): boolean {
    return !this.isRefreshTokenExpired();
  }

  getTimeUntilExpiry(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  getTimeUntilRefreshExpiry(): number {
    return Math.max(0, this.refreshExpiresAt.getTime() - Date.now());
  }

  shouldRenew(): boolean {
    // Renew if token expires in less than 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    return this.getTimeUntilExpiry() < fifteenMinutes;
  }

  toSecurityAuditLog(): object {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      issuedAt: this.issuedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      isValid: this.isValid(),
      canRefresh: this.canRefresh()
    };
  }
}
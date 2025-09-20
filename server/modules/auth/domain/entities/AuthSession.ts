/**
 * DOMAIN LAYER - AUTH SESSION ENTITY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface AuthSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  isActive: boolean;
  
  // Session metadata
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface UserSession {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  employmentType: string;
  permissions: string[];
  expiresAt: Date;
}

export class AuthDomainService {
  private readonly ACCESS_TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly REMEMBER_ME_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Validates login credentials
   */
  validateLoginCredentials(credentials: LoginCredentials): boolean {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format');
    }

    // Password length validation
    if (credentials.password.length < 1) {
      throw new Error('Password cannot be empty');
    }

    return true;
  }

  /**
   * Creates token expiry dates
   */
  createTokenExpiry(rememberMe: boolean = false): {
    accessTokenExpiry: Date;
    refreshTokenExpiry: Date;
  } {
    const now = Date.now();
    
    return {
      accessTokenExpiry: new Date(now + this.ACCESS_TOKEN_EXPIRY),
      refreshTokenExpiry: new Date(now + (rememberMe ? this.REMEMBER_ME_EXPIRY : this.REFRESH_TOKEN_EXPIRY))
    };
  }

  /**
   * Validates if tokens are expired
   */
  isTokenExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }

  /**
   * Validates refresh token
   */
  validateRefreshToken(session: AuthSession): boolean {
    if (!session.isActive) {
      throw new Error('Session is inactive');
    }

    if (this.isTokenExpired(session.refreshExpiresAt)) {
      throw new Error('Refresh token has expired');
    }

    return true;
  }

  /**
   * Creates user session object
   */
  createUserSession(
    sessionId: string,
    userId: string,
    email: string,
    role: string,
    tenantId: string,
    employmentType: string,
    expiresAt: Date,
    permissions: string[] = []
  ): UserSession {
    return {
      sessionId,
      userId,
      email,
      role,
      tenantId,
      employmentType,
      permissions,
      expiresAt
    };
  }

  /**
   * Generates session metadata
   */
  createSessionMetadata(ipAddress?: string, userAgent?: string): {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
  } {
    return {
      ipAddress,
      userAgent,
      deviceInfo: this.parseDeviceInfo(userAgent)
    };
  }

  /**
   * Parses device info from user agent
   */
  private parseDeviceInfo(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;

    // Simple device detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

  /**
   * Validates session activity
   */
  shouldRefreshSession(lastUsedAt: Date, thresholdMinutes: number = 5): boolean {
    const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds
    return (Date.now() - lastUsedAt.getTime()) > threshold;
  }

  /**
   * Calculates remaining session time
   */
  getRemainingSessionTime(expiresAt: Date): number {
    return Math.max(0, expiresAt.getTime() - Date.now());
  }

  /**
   * Validates password reset requirements
   */
  validatePasswordResetRequest(email: string): boolean {
    if (!email) {
      throw new Error('Email is required for password reset');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    return true;
  }

  /**
   * Creates logout metadata
   */
  createLogoutReason(forced: boolean = false): string {
    return forced ? 'forced_logout' : 'user_logout';
  }

  /**
   * Validates concurrent session limits
   */
  validateConcurrentSessions(activeSessions: number, maxSessions: number = 5): boolean {
    if (activeSessions >= maxSessions) {
      throw new Error(`Maximum concurrent sessions (${maxSessions}) exceeded`);
    }
    return true;
  }
}
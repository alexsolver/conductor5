/**
 * APPLICATION LAYER - AUTH DTOs
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface LoginDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponseDTO {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      fullName: string;
      role: string;
      employmentType: string;
      tenantId: string;
      permissions: string[];
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: 'Bearer';
    };
    session: {
      sessionId: string;
      expiresAt: string;
    };
  };
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  workspaceName?: string;
  website?: string;
  phone?: string;
  companySize?: string;
  role?: UserRole;
  
  // GDPR Consents
  acceptPrivacyPolicy?: boolean;
  acceptCookiesNecessary?: boolean;
  acceptCookiesAnalytics?: boolean;
  acceptCookiesMarketing?: boolean;
  privacyPolicyId?: string;
  privacyPolicyVersion?: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  success: boolean;
  message: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: 'Bearer';
    };
    expiresAt: string;
  };
}

export interface LogoutDTO {
  sessionId?: string;
  allDevices?: boolean;
}

export interface PasswordResetRequestDTO {
  email: string;
  tenantId?: string;
}

export interface PasswordResetDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ValidateTokenDTO {
  token: string;
}

export interface ValidateTokenResponseDTO {
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      fullName: string;
      role: string;
      employmentType: string;
      tenantId: string;
      permissions: string[];
    };
    session?: {
      sessionId: string;
      expiresAt: string;
      lastUsedAt: string;
    };
  };
}

export interface SessionInfoDTO {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  employmentType: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface UserSessionsResponseDTO {
  success: boolean;
  message: string;
  data: {
    sessions: SessionInfoDTO[];
    total: number;
    activeSessions: number;
  };
}

export interface AuthStatsDTO {
  totalActiveSessions: number;
  totalUsers: number;
  averageSessionsPerUser: number;
  expiredSessions: number;
  loginAttemptsToday: number;
  failedLoginsToday: number;
  successRate: number;
}

export interface SecurityEventDTO {
  type: 'login' | 'logout' | 'refresh' | 'failed_login' | 'password_reset';
  userId?: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
  timestamp: string;
}

export interface AuthErrorDTO {
  success: false;
  message: string;
  error: string;
  code?: string;
}

export interface MeResponseDTO {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      fullName: string;
      role: string;
      employmentType: string;
      tenantId: string;
      permissions: string[];
      avatar?: string;
      language: string;
      timezone: string;
      lastLoginAt?: string;
    };
    session: {
      sessionId: string;
      expiresAt: string;
      lastUsedAt: string;
      remainingTime: number;
    };
  };
}

// Assume UserRole is defined elsewhere, e.g., in a shared types file
type UserRole = 'admin' | 'user' | 'tenant_admin';
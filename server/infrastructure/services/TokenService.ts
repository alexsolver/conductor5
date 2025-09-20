// JWT Token Service Implementation
import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/services/ITokenService';
import { User } from '../../domain/entities/User';

export class TokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '2h'; // 2 horas para estabilidade
  private readonly refreshTokenExpiry = '30d'; // 30 dias para menos renovações

  private generateSecureDefaultSecret(type: string): string {
    // Generate secure random bytes for development - more secure than hardcoded values
    const randomBytes = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return `dev-${type}-${randomBytes}-${Date.now()}`;
  }

  constructor() {
    // Fixed secrets for consistency with tokenManager
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'conductor-platform-development-fixed-secret-2025';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'conductor-platform-refresh-fixed-secret-2025';
  }

  generateAccessToken(userId: string, email: string): string;
  generateAccessToken(user: User): string;
  generateAccessToken(userIdOrUser: string | User, email?: string): string {
    let userId: string;
    let userEmail: string;
    let role: string;
    let tenantId: string | null;

    if (typeof userIdOrUser === 'string') {
      userId = userIdOrUser;
      userEmail = email!;
      role = 'agent'; // Default role for backward compatibility
      tenantId = null;
    } else {
      userId = userIdOrUser.id;
      userEmail = userIdOrUser.email;
      role = userIdOrUser.role;
      tenantId = userIdOrUser.tenantId;
    }

    const payload = {
      userId,
      email: userEmail,
      role,
      tenantId,
      type: 'access'
    };

    return jwt.sign(payload, this.accessTokenSecret, { 
      expiresIn: this.accessTokenExpiry,
      issuer: 'conductor-platform',
      audience: 'conductor-users'
    });
  }

  generateRefreshToken(userId: string, email: string): string;
  generateRefreshToken(user: User): string;
  generateRefreshToken(userIdOrUser: string | User, email?: string): string {
    let userId: string;

    if (typeof userIdOrUser === 'string') {
      userId = userIdOrUser;
    } else {
      userId = userIdOrUser.id;
    }

    const payload = {
      userId,
      type: 'refresh'
    };

    return jwt.sign(payload, this.refreshTokenSecret, { 
      expiresIn: this.refreshTokenExpiry,
      issuer: 'conductor-platform',
      audience: 'conductor-users'
    });
  }

  verifyAccessToken(token: string): { userId: string; email: string; role: string; tenantId: string | null } | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'conductor-platform',
        audience: 'conductor-users'
      }) as any;

      if (decoded.type !== 'access') {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId
      };
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'conductor-platform',
        audience: 'conductor-users'
      }) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      return {
        userId: decoded.userId
      };
    } catch (error) {
      return null;
    }
  }
}
// Simple JWT Token Service Implementation - Without Dependencies
import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/services/ITokenService';
import { User } from '../../domain/entities/User';

export class SimpleTokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '2h'; // 2 horas para estabilidade
  private readonly refreshTokenExpiry = '30d'; // 30 dias para menos renovações

  constructor() {
    // Fixed secrets for consistency with tokenManager
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'conductor-platform-development-fixed-secret-2025';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'conductor-platform-refresh-fixed-secret-2025';
  }

  private generateFallbackSecret(type: string): string {
    // Simple but secure fallback without requiring crypto module
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    return `secure-${type}-${timestamp}-${randomPart}`;
  }

  generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      type: 'access'
    };

    return jwt.sign(payload, this.accessTokenSecret, { 
      expiresIn: this.accessTokenExpiry,
      issuer: 'conductor-platform',
      audience: 'conductor-users'
    });
  }

  generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
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
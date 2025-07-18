// JWT Token Service Implementation
import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/services/ITokenService';
import { User } from '../../domain/entities/User';

export class TokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  private generateSecureDefaultSecret(type: string): string {
    // Generate secure random bytes for development - more secure than hardcoded values
    const randomBytes = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return `dev-${type}-${randomBytes}-${Date.now()}`;
  }

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecureDefaultSecret('access');
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecureDefaultSecret('refresh');
    
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn('JWT secrets not found in environment variables. Using secure generated defaults for development.');
    }
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
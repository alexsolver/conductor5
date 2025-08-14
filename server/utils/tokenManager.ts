// Enhanced Token Manager for JWT stability
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string | null;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export class TokenManager {
  private static instance: TokenManager;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  
  private constructor() {
    // ✅ CRITICAL FIX - Use same secrets as Use Cases per 1qa.md compliance
    this.accessSecret = process.env.JWT_SECRET || 'conductor-jwt-secret-key-2025';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'conductor-jwt-secret-key-2025';
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private generateStableSecret(type: string): string {
    // Fixed secret for development to prevent signature mismatches
    const base = `conductor-platform-${type}-secret-fixed-development`;
    return `${base}-stable-key-2025`;
  }

  generateAccessToken(user: { id: string; email: string; role: string; tenantId: string | null }): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      type: 'access'
    };

    return jwt.sign(payload, this.accessSecret, {
      expiresIn: '12h',
      issuer: 'conductor-platform',
      audience: 'conductor-users',
      algorithm: 'HS256'
    });
  }

  generateRefreshToken(user: { id: string }): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: '', // Not needed for refresh
      role: '',
      tenantId: null,
      type: 'refresh'
    };

    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: '30d',
      issuer: 'conductor-platform',
      audience: 'conductor-users',
      algorithm: 'HS256'
    });
  }

  verifyAccessToken(token: string): { userId: string; email: string; role: string; tenantId: string | null } | null {
    try {
      if (!token || token.length < 10) {
        console.warn('Invalid token format provided');
        return null;
      }

      const decoded = jwt.verify(token, this.accessSecret, {
        issuer: 'conductor-platform',
        audience: 'conductor-users',
        algorithms: ['HS256']
      }) as TokenPayload;

      if (decoded.type !== 'access') {
        console.warn('Token type mismatch - expected access token');
        return null;
      }

      // Check if token is close to expiry (within 1 hour)
      if (decoded.exp && (decoded.exp * 1000) < (Date.now() + 60 * 60 * 1000)) {
        console.log('Token will expire soon, consider refreshing');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('Access token expired - refresh needed');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.warn('Token validation failed:', error.message);
      } else {
        console.error('Token verification error:', error);
      }
      return null;
    }
  }

  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      if (!token || token.length < 10) {
        console.warn('Invalid refresh token format provided');
        return null;
      }

      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: 'conductor-platform',
        audience: 'conductor-users',
        algorithms: ['HS256']
      }) as TokenPayload;

      if (decoded.type !== 'refresh') {
        console.warn('Token type mismatch - expected refresh token');
        return null;
      }

      return {
        userId: decoded.userId
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('Refresh token expired - re-login required');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.warn('Refresh token validation failed:', error.message);
      } else {
        console.error('Refresh token verification error:', error);
      }
      return null;
    }
  }

  isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (!decoded || !decoded.exp) return false;
      
      // Consider token expiring if less than 2 hours remaining
      return (decoded.exp * 1000) < (Date.now() + 2 * 60 * 60 * 1000);
    } catch {
      return true; // If can't decode, assume expiring
    }
  }
}

export const tokenManager = TokenManager.getInstance();
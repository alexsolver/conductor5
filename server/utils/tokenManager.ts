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
      expiresIn: '24h', // ✅ 1QA.MD: Aumentado para 24 horas para reduzir logouts automáticos
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
      // ✅ CRITICAL FIX - Enhanced token validation per 1qa.md compliance
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('❌ [TOKEN-MANAGER] Invalid token provided:', { tokenType: typeof token, tokenLength: token?.length });
        return null;
      }

      // Check for obvious invalid tokens
      if (token === 'null' || token === 'undefined' || token === 'false') {
        console.error('❌ [TOKEN-MANAGER] Token is literal string:', token);
        return null;
      }

      console.log('🔍 [TOKEN-MANAGER] Verifying access token...', {
        tokenStart: token.substring(0, 20),
        tokenLength: token.length,
        timestamp: new Date().toISOString()
      });

      const decoded = jwt.verify(token, this.accessSecret, {
        issuer: 'conductor-platform',
        audience: 'conductor-users',
        algorithms: ['HS256']
      }) as TokenPayload;

      if (decoded.type !== 'access') {
        console.warn('Token type mismatch - expected access token');
        return null;
      }

      // Check if token is close to expiry (within 4 hours para 24h token)
      if (decoded.exp && (decoded.exp * 1000) < (Date.now() + 4 * 60 * 60 * 1000)) {
        console.log('🔄 [TOKEN-MANAGER] Token will expire in less than 4 hours, should refresh soon');
      }

      return {
        userId: decoded.userId || decoded.sub, // ✅ CRITICAL FIX - Handle both userId and sub per 1qa.md
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
      // ✅ CRITICAL FIX - Enhanced token validation per 1qa.md compliance
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('❌ [TOKEN-MANAGER] Invalid refresh token provided:', { tokenType: typeof token, tokenLength: token?.length });
        return null;
      }

      // Check for obvious invalid tokens
      if (token === 'null' || token === 'undefined' || token === 'false') {
        console.error('❌ [TOKEN-MANAGER] Refresh token is literal string:', token);
        return null;
      }

      console.log('🔍 [TOKEN-MANAGER] Verifying refresh token...', {
        tokenStart: token.substring(0, 20),
        tokenLength: token.length
      });

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
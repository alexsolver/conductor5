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
      if (!token || 
          typeof token !== 'string' || 
          token.trim() === '' ||
          token.length < 20) { // JWT básico tem muito mais de 20 caracteres
        console.error('❌ [TOKEN-MANAGER] Invalid token provided:', { 
          tokenType: typeof token, 
          tokenLength: token?.length,
          tokenValue: token?.substring(0, 10) + '...',
          isEmpty: token?.trim() === '',
          isTooShort: token?.length < 20
        });
        return null;
      }

      // Check for obvious invalid tokens - mais restritivo
      if (token === 'null' || 
          token === 'undefined' || 
          token === 'false' ||
          token === 'true' ||
          token === '{}' ||
          token === '[]' ||
          token.startsWith('{') ||
          token.startsWith('[')) {
        console.error('❌ [TOKEN-MANAGER] Token is literal/invalid string:', token.substring(0, 20));
        return null;
      }

      // ✅ Validate JWT format before processing
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('❌ [TOKEN-MANAGER] Invalid JWT format - parts count:', tokenParts.length);
        return null;
      }

      console.log('🔍 [TOKEN-MANAGER] Verifying access token...', {
        tokenStart: token.substring(0, 20),
        tokenLength: token.length,
        partsCount: tokenParts.length,
        timestamp: new Date().toISOString()
      });

      const decoded = jwt.verify(token, this.accessSecret, {
        issuer: 'conductor-platform',
        audience: 'conductor-users',
        algorithms: ['HS256']
      }) as TokenPayload;

      if (decoded.type !== 'access') {
        console.warn('❌ [TOKEN-MANAGER] Token type mismatch - expected access token, got:', decoded.type);
        return null;
      }

      // ✅ Validate required fields
      if (!decoded.userId && !decoded.sub) {
        console.error('❌ [TOKEN-MANAGER] Token missing userId/sub field');
        return null;
      }

      // Check if token is close to expiry (within 4 hours para 24h token)
      if (decoded.exp && (decoded.exp * 1000) < (Date.now() + 4 * 60 * 60 * 1000)) {
        const minutesToExpiry = Math.round(((decoded.exp * 1000) - Date.now()) / 1000 / 60);
        console.log('🔄 [TOKEN-MANAGER] Token will expire soon:', {
          minutesToExpiry,
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        });
      }

      const result = {
        userId: decoded.userId || decoded.sub, // ✅ CRITICAL FIX - Handle both userId and sub per 1qa.md
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId
      };

      console.log('✅ [TOKEN-MANAGER] Token verified successfully:', {
        userId: result.userId,
        email: result.email,
        tenantId: result.tenantId
      });

      return result;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('⏰ [TOKEN-MANAGER] Access token expired - refresh needed');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.warn('⚠️ [TOKEN-MANAGER] Token validation failed:', error.message);
      } else {
        console.error('❌ [TOKEN-MANAGER] Token verification error:', error);
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

  async refreshAccessToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string; error?: string }> {
    try {
      // Verify refresh token
      const refreshPayload = this.verifyRefreshToken(refreshToken);
      
      if (!refreshPayload) {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      // Get user from database to generate new access token
      const { DependencyContainer } = await import('../middleware/dependencyContainer');
      const container = DependencyContainer.getInstance();
      const userRepository = container.userRepository;

      const user = await userRepository.findById(refreshPayload.userId);
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or inactive'
        };
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      });

      console.log('✅ [TOKEN-MANAGER] Access token refreshed successfully for user:', user.id);

      return {
        success: true,
        accessToken: newAccessToken
      };
    } catch (error: any) {
      console.error('❌ [TOKEN-MANAGER] Error refreshing access token:', error);
      return {
        success: false,
        error: 'Failed to refresh token'
      };
    }
  }
}

export const tokenManager = TokenManager.getInstance();
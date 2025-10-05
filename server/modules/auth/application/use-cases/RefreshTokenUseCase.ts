/**
 * APPLICATION LAYER - REFRESH TOKEN USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

// ✅ CRITICAL FIX - Default import for JWT per 1qa.md compliance
import jwt from 'jsonwebtoken';
import { AuthDomainService, AuthTokens } from '../../domain/entities/AuthSession';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IUserRepository } from '../../../users/domain/repositories/IUserRepository';
import { RefreshTokenDTO } from '../dto/AuthDTO';

// Internal response type for use case (not the HTTP DTO)
interface RefreshTokenResult {
  tokens: AuthTokens;
  expiresAt: string;
}

export class RefreshTokenUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private userRepository: IUserRepository,
    private authDomainService: AuthDomainService
  ) {}

  async execute({ refreshToken }: RefreshTokenDTO): Promise<RefreshTokenResult> {
    try {
      console.log('🔄 [REFRESH-USE-CASE] Starting token refresh process', {
        tokenLength: refreshToken?.length,
        tokenStart: refreshToken?.substring(0, 20),
        hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET
      });

      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new Error('Invalid refresh token format');
      }

      // Verify the refresh token
      let decoded: any;
      try {
        // Use consistent fallback: JWT_REFRESH_SECRET > JWT_SECRET > default
        const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'conductor-jwt-secret-key-2025';
        decoded = jwt.verify(refreshToken, refreshSecret);
        console.log('✅ [REFRESH-USE-CASE] Refresh token verified', {
          userId: decoded.userId || decoded.sub,
          email: decoded.email,
          exp: decoded.exp,
          iat: decoded.iat
        });
      } catch (jwtError: any) {
        console.error('❌ [REFRESH-USE-CASE] JWT verification failed:', {
          message: jwtError.message,
          name: jwtError.name,
          tokenProvided: !!refreshToken
        });

        if (jwtError.name === 'TokenExpiredError') {
          throw new Error('Refresh token has expired');
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new Error('Refresh token is malformed');
        } else {
          throw new Error('Invalid refresh token');
        }
      }

      // Find session by refresh token
      const session = await this.authRepository.findSessionByRefreshToken(refreshToken);
      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Validate refresh token using domain service
      try {
        this.authDomainService.validateRefreshToken(session);
      } catch (error: any) {
        // Invalidate expired session
        await this.authRepository.invalidateSession(session.id);
        throw error; // Re-throw the error from the domain service
      }

      // Find user to generate new tokens with tenant context (1qa.md compliance)
      // Use tenantId from decoded token
      const tenantId = decoded.tenantId;
      if (!tenantId) {
        throw new Error('Tenant ID not found in token');
      }

      const user = await this.userRepository.findByIdAndTenant(session.userId, tenantId);
      if (!user) {
        // Invalidate session for non-existent user
        await this.authRepository.invalidateSession(session.id);
        throw new Error('User not found');
      }

      // Check if user is still active
      if (!user.isActive) {
        await this.authRepository.invalidateSession(session.id);
        throw new Error('Account is deactivated');
      }

      // Create new token expiry dates
      const { accessTokenExpiry, refreshTokenExpiry } = this.authDomainService.createTokenExpiry(false);

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user, accessTokenExpiry);
      const newRefreshToken = this.generateRefreshToken(user, refreshTokenExpiry);

      // Update session with new tokens
      const updatedSession = await this.authRepository.updateSessionTokens(
        session.id,
        newAccessToken,
        newRefreshToken,
        accessTokenExpiry,
        refreshTokenExpiry
      );

      // Update last used timestamp
      await this.authRepository.updateLastUsed(session.id);

      const tokens: AuthTokens = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: Math.floor((accessTokenExpiry.getTime() - Date.now()) / 1000),
        tokenType: 'Bearer'
      };

      return {
        tokens,
        expiresAt: updatedSession.expiresAt.toISOString()
      };
    } catch (error: any) {
      console.error('❌ [REFRESH-USE-CASE] Error during token refresh:', {
        message: error.message,
        stack: error.stack,
        errorObject: error
      });
      // Rethrow the error to be handled by the controller or middleware
      throw error;
    }
  }

  private generateAccessToken(user: any, expiresAt: Date): string {
    const payload = {
      sub: user.id,
      userId: user.id, // ✅ CRITICAL FIX - Adding userId for middleware compatibility per 1qa.md
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      employmentType: user.employmentType,
      type: 'access',
      exp: Math.floor(expiresAt.getTime() / 1000),
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'conductor-jwt-secret-key-2025', {
      algorithm: 'HS256',
      issuer: 'conductor-platform',
      audience: 'conductor-users'
    });
  }

  private generateRefreshToken(user: any, expiresAt: Date): string {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      type: 'refresh',
      exp: Math.floor(expiresAt.getTime() / 1000),
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'conductor-jwt-secret-key-2025', {
      algorithm: 'HS256',
      issuer: 'conductor-platform',
      audience: 'conductor-users'
    });
  }
}
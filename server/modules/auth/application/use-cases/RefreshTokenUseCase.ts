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

export class RefreshTokenUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private userRepository: IUserRepository,
    private authDomainService: AuthDomainService
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<{
    tokens: AuthTokens;
    expiresAt: string;
  }> {
    // Find session by refresh token
    const session = await this.authRepository.findSessionByRefreshToken(dto.refreshToken);
    if (!session) {
      throw new Error('Invalid refresh token');
    }

    // Validate refresh token
    try {
      this.authDomainService.validateRefreshToken(session);
    } catch (error: any) {
      // Invalidate expired session
      await this.authRepository.invalidateSession(session.id);
      throw error;
    }

    // Verify JWT refresh token
    try {
      jwt.verify(
        dto.refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'conductor-jwt-secret-key-2025',
        {
          issuer: 'conductor-platform',
          audience: 'conductor-users',
          algorithms: ['HS256']
        }
      );
    } catch (error) {
      // Invalidate invalid session
      await this.authRepository.invalidateSession(session.id);
      throw new Error('Invalid refresh token');
    }

    // Find user to generate new tokens
    const user = await this.userRepository.findById(session.userId);
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
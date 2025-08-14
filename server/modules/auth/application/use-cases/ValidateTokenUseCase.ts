/**
 * APPLICATION LAYER - VALIDATE TOKEN USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

// ✅ CRITICAL FIX - Default import for JWT per 1qa.md compliance
import jwt from 'jsonwebtoken';
import { AuthDomainService } from '../../domain/entities/AuthSession';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IUserRepository } from '../../../users/domain/repositories/IUserRepository';
import { UserDomainService } from '../../../users/domain/entities/User';

export class ValidateTokenUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private userRepository: IUserRepository,
    private authDomainService: AuthDomainService,
    private userDomainService: UserDomainService
  ) {}

  async execute(accessToken: string): Promise<{
    valid: boolean;
    user?: any;
    session?: any;
  }> {
    if (!accessToken) {
      return { valid: false };
    }

    try {
      // Verify JWT token
      const payload = jwt.verify(
        accessToken,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as any;

      if (payload.type !== 'access') {
        return { valid: false };
      }

      // Find session by access token
      const session = await this.authRepository.findSessionByAccessToken(accessToken);
      if (!session) {
        return { valid: false };
      }

      // Check if session is active
      if (!session.isActive) {
        return { valid: false };
      }

      // Check if token is expired
      if (this.authDomainService.isTokenExpired(session.expiresAt)) {
        // Invalidate expired session
        await this.authRepository.invalidateSession(session.id);
        return { valid: false };
      }

      // Find user
      const user = await this.userRepository.findById(session.userId);
      if (!user) {
        // Invalidate session for non-existent user
        await this.authRepository.invalidateSession(session.id);
        return { valid: false };
      }

      // Check if user is still active
      if (!user.isActive) {
        await this.authRepository.invalidateSession(session.id);
        return { valid: false };
      }

      // Update last used timestamp if enough time has passed
      if (this.authDomainService.shouldRefreshSession(session.lastUsedAt)) {
        await this.authRepository.updateLastUsed(session.id);
      }

      // Get user permissions
      const permissions = this.userDomainService.getUserPermissions(user.role);
      const permissionList = Object.keys(permissions).filter(key => permissions[key as keyof typeof permissions]);

      // Create response objects
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: this.userDomainService.createFullName(user.firstName, user.lastName),
        role: user.role,
        employmentType: user.employmentType,
        tenantId: user.tenantId,
        permissions: permissionList,
        avatar: user.avatar,
        language: user.language,
        timezone: user.timezone,
        lastLoginAt: user.lastLoginAt?.toISOString()
      };

      const sessionResponse = {
        sessionId: session.id,
        expiresAt: session.expiresAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        remainingTime: this.authDomainService.getRemainingSessionTime(session.expiresAt)
      };

      return {
        valid: true,
        user: userResponse,
        session: sessionResponse
      };

    } catch (error: any) {
      // JWT verification failed or other error
      return { valid: false };
    }
  }

  async validateAndGetUserInfo(accessToken: string): Promise<any | null> {
    const result = await this.execute(accessToken);
    return result.valid ? result.user : null;
  }

  async validateSessionById(sessionId: string): Promise<{
    valid: boolean;
    session?: any;
  }> {
    if (!sessionId) {
      return { valid: false };
    }

    const session = await this.authRepository.findSessionById(sessionId);
    if (!session) {
      return { valid: false };
    }

    if (!session.isActive) {
      return { valid: false };
    }

    if (this.authDomainService.isTokenExpired(session.expiresAt)) {
      await this.authRepository.invalidateSession(session.id);
      return { valid: false };
    }

    return {
      valid: true,
      session: {
        sessionId: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        remainingTime: this.authDomainService.getRemainingSessionTime(session.expiresAt)
      }
    };
  }
}
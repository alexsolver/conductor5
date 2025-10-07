/**
 * APPLICATION LAYER - LOGIN USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import * as bcrypt from 'bcrypt';
// ✅ CRITICAL FIX - Default import for JWT per 1qa.md compliance
import jwt from 'jsonwebtoken';
import { AuthDomainService, AuthTokens } from '../../domain/entities/AuthSession';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IUserRepository } from '../../../users/domain/repositories/IUserRepository';
import { UserDomainService } from '../../../users/domain/entities/User';
import { LoginDTO } from '../dto/AuthDTO';

export class LoginUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private userRepository: IUserRepository,
    private authDomainService: AuthDomainService,
    private userDomainService: UserDomainService
  ) {}

  async execute(
    dto: LoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: any;
    tokens: AuthTokens;
    session: any;
  }> {
    // Validate input
    this.authDomainService.validateLoginCredentials(dto);

    // Find user by email for authentication (1qa.md compliant)
    const user = await this.userRepository.findByEmailForAuth(dto.email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check concurrent session limits
    const activeSessionCount = await this.authRepository.countUserActiveSessions(user.id);
    this.authDomainService.validateConcurrentSessions(activeSessionCount);

    // Create token expiry dates
    const { accessTokenExpiry, refreshTokenExpiry } = this.authDomainService.createTokenExpiry(dto.rememberMe);

    // Generate tokens
    const accessToken = this.generateAccessToken(user, accessTokenExpiry);
    const refreshToken = this.generateRefreshToken(user, refreshTokenExpiry);

    // Create session metadata
    const sessionMetadata = this.authDomainService.createSessionMetadata(ipAddress, userAgent);

    // Create session
    const sessionData = {
      tenantId: user.tenantId,
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt: accessTokenExpiry,
      refreshExpiresAt: refreshTokenExpiry,
      isActive: true,
      ...sessionMetadata,
      lastUsedAt: new Date()
    };

    const session = await this.authRepository.createSession(sessionData);

    // Update user login statistics
    await this.userRepository.updateLoginStats(user.id, {
      lastLoginAt: new Date(),
      loginCount: (user.loginCount || 0) + 1
    });

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
      permissions: permissionList
    };

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: Math.floor((accessTokenExpiry.getTime() - Date.now()) / 1000),
      tokenType: 'Bearer'
    };

    const sessionResponse = {
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString()
    };

    return {
      user: userResponse,
      tokens,
      session: sessionResponse
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
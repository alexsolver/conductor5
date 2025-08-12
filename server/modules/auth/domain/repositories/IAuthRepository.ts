/**
 * DOMAIN LAYER - AUTH REPOSITORY INTERFACE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { AuthSession } from '../entities/AuthSession';

export interface IAuthRepository {
  /**
   * Create new authentication session
   */
  createSession(session: Omit<AuthSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthSession>;

  /**
   * Find session by access token
   */
  findSessionByAccessToken(accessToken: string): Promise<AuthSession | null>;

  /**
   * Find session by refresh token
   */
  findSessionByRefreshToken(refreshToken: string): Promise<AuthSession | null>;

  /**
   * Find session by ID
   */
  findSessionById(sessionId: string): Promise<AuthSession | null>;

  /**
   * Update session tokens
   */
  updateSessionTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    refreshExpiresAt: Date
  ): Promise<AuthSession>;

  /**
   * Update session last used timestamp
   */
  updateLastUsed(sessionId: string): Promise<void>;

  /**
   * Invalidate session (logout)
   */
  invalidateSession(sessionId: string): Promise<void>;

  /**
   * Invalidate all user sessions (force logout all devices)
   */
  invalidateAllUserSessions(userId: string): Promise<void>;

  /**
   * Find all active sessions for user
   */
  findUserActiveSessions(userId: string): Promise<AuthSession[]>;

  /**
   * Clean expired sessions
   */
  cleanExpiredSessions(): Promise<number>;

  /**
   * Get session statistics
   */
  getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    averageSessionsPerUser: number;
    expiredSessions: number;
  }>;

  /**
   * Find sessions by IP address (security monitoring)
   */
  findSessionsByIP(ipAddress: string, limit?: number): Promise<AuthSession[]>;

  /**
   * Count concurrent sessions for user
   */
  countUserActiveSessions(userId: string): Promise<number>;

  /**
   * Find recently created sessions for user (security monitoring)
   */
  findRecentUserSessions(userId: string, hoursBack: number): Promise<AuthSession[]>;
}
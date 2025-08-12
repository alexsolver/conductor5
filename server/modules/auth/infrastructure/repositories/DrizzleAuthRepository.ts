/**
 * INFRASTRUCTURE LAYER - DRIZZLE AUTH REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, gte, lt, count, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { AuthSession } from '../../domain/entities/AuthSession';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

// For now, we'll use a simple in-memory store for sessions
// In a real implementation, you would create a proper sessions table
// This is a temporary solution to complete the Clean Architecture pattern
export class DrizzleAuthRepository implements IAuthRepository {
  private sessions: Map<string, AuthSession> = new Map();
  private accessTokenIndex: Map<string, string> = new Map(); // accessToken -> sessionId
  private refreshTokenIndex: Map<string, string> = new Map(); // refreshToken -> sessionId
  private userSessionsIndex: Map<string, Set<string>> = new Map(); // userId -> Set<sessionId>

  async createSession(sessionData: Omit<AuthSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthSession> {
    const now = new Date();
    const sessionId = this.generateId();
    
    const session: AuthSession = {
      id: sessionId,
      ...sessionData,
      createdAt: now,
      updatedAt: now
    };

    // Store session
    this.sessions.set(sessionId, session);
    
    // Update indexes
    this.accessTokenIndex.set(session.accessToken, sessionId);
    this.refreshTokenIndex.set(session.refreshToken, sessionId);
    
    if (!this.userSessionsIndex.has(session.userId)) {
      this.userSessionsIndex.set(session.userId, new Set());
    }
    this.userSessionsIndex.get(session.userId)!.add(sessionId);

    return session;
  }

  async findSessionByAccessToken(accessToken: string): Promise<AuthSession | null> {
    const sessionId = this.accessTokenIndex.get(accessToken);
    if (!sessionId) return null;
    
    return this.sessions.get(sessionId) || null;
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const sessionId = this.refreshTokenIndex.get(refreshToken);
    if (!sessionId) return null;
    
    return this.sessions.get(sessionId) || null;
  }

  async findSessionById(sessionId: string): Promise<AuthSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async updateSessionTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    refreshExpiresAt: Date
  ): Promise<AuthSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Remove old token indexes
    this.accessTokenIndex.delete(session.accessToken);
    this.refreshTokenIndex.delete(session.refreshToken);

    // Update session
    const updatedSession = {
      ...session,
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      updatedAt: new Date()
    };

    // Store updated session
    this.sessions.set(sessionId, updatedSession);

    // Update indexes with new tokens
    this.accessTokenIndex.set(accessToken, sessionId);
    this.refreshTokenIndex.set(refreshToken, sessionId);

    return updatedSession;
  }

  async updateLastUsed(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const updatedSession = {
      ...session,
      lastUsedAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, updatedSession);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Update session as inactive
    const updatedSession = {
      ...session,
      isActive: false,
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, updatedSession);

    // Remove from indexes (keep for audit but don't allow access)
    this.accessTokenIndex.delete(session.accessToken);
    this.refreshTokenIndex.delete(session.refreshToken);
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const userSessionIds = this.userSessionsIndex.get(userId);
    if (!userSessionIds) return;

    for (const sessionId of userSessionIds) {
      await this.invalidateSession(sessionId);
    }
  }

  async findUserActiveSessions(userId: string): Promise<AuthSession[]> {
    const userSessionIds = this.userSessionsIndex.get(userId);
    if (!userSessionIds) return [];

    const sessions: AuthSession[] = [];
    for (const sessionId of userSessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.isActive) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
  }

  async cleanExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions) {
      if (session.isActive && (session.expiresAt < now || session.refreshExpiresAt < now)) {
        await this.invalidateSession(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    averageSessionsPerUser: number;
    expiredSessions: number;
  }> {
    let totalActiveSessions = 0;
    let expiredSessions = 0;
    const activeUsers = new Set<string>();
    const now = new Date();

    for (const session of this.sessions.values()) {
      if (session.isActive) {
        if (session.expiresAt < now || session.refreshExpiresAt < now) {
          expiredSessions++;
        } else {
          totalActiveSessions++;
          activeUsers.add(session.userId);
        }
      }
    }

    const totalUsers = activeUsers.size;
    const averageSessionsPerUser = totalUsers > 0 ? totalActiveSessions / totalUsers : 0;

    return {
      totalActiveSessions,
      totalUsers,
      averageSessionsPerUser: Math.round(averageSessionsPerUser * 100) / 100,
      expiredSessions
    };
  }

  async findSessionsByIP(ipAddress: string, limit: number = 10): Promise<AuthSession[]> {
    const sessions: AuthSession[] = [];

    for (const session of this.sessions.values()) {
      if (session.ipAddress === ipAddress && session.isActive) {
        sessions.push(session);
      }
    }

    return sessions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async countUserActiveSessions(userId: string): Promise<number> {
    const userSessionIds = this.userSessionsIndex.get(userId);
    if (!userSessionIds) return 0;

    let activeCount = 0;
    for (const sessionId of userSessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.isActive) {
        activeCount++;
      }
    }

    return activeCount;
  }

  async findRecentUserSessions(userId: string, hoursBack: number): Promise<AuthSession[]> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const userSessionIds = this.userSessionsIndex.get(userId);
    if (!userSessionIds) return [];

    const sessions: AuthSession[] = [];
    for (const sessionId of userSessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.createdAt >= cutoffTime) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private generateId(): string {
    return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}
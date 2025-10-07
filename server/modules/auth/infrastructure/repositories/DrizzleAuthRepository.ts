/**
 * INFRASTRUCTURE LAYER - DRIZZLE AUTH REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 * Now using persistent database storage instead of in-memory
 */

import { eq, and, gte, lt, count, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { authSessions } from '../../../../../shared/schema-public';
import { AuthSession } from '../../domain/entities/AuthSession';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class DrizzleAuthRepository implements IAuthRepository {
  async createSession(sessionData: Omit<AuthSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthSession> {
    const now = new Date();
    
    const [session] = await db.insert(authSessions).values({
      tenantId: sessionData.tenantId,
      userId: sessionData.userId,
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      expiresAt: sessionData.expiresAt,
      refreshExpiresAt: sessionData.refreshExpiresAt,
      isActive: true,
    }).returning();

    return {
      id: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
      isActive: session.isActive ?? true,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      lastUsedAt: sessionData.lastUsedAt || now,
      createdAt: session.createdAt ?? now,
      updatedAt: session.updatedAt ?? now,
    };
  }

  async findSessionByAccessToken(accessToken: string): Promise<AuthSession | null> {
    const [session] = await db
      .select()
      .from(authSessions)
      .where(and(
        eq(authSessions.accessToken, accessToken),
        eq(authSessions.isActive, true)
      ))
      .limit(1);

    if (!session) return null;

    return this.mapToAuthSession(session);
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const [session] = await db
      .select()
      .from(authSessions)
      .where(and(
        eq(authSessions.refreshToken, refreshToken),
        eq(authSessions.isActive, true)
      ))
      .limit(1);

    if (!session) return null;

    return this.mapToAuthSession(session);
  }

  async findSessionById(sessionId: string): Promise<AuthSession | null> {
    const [session] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.id, sessionId))
      .limit(1);

    if (!session) return null;

    return this.mapToAuthSession(session);
  }

  async updateSessionTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    refreshExpiresAt: Date
  ): Promise<AuthSession> {
    const now = new Date();

    const [session] = await db
      .update(authSessions)
      .set({
        accessToken,
        refreshToken,
        expiresAt,
        refreshExpiresAt,
        updatedAt: now,
      })
      .where(eq(authSessions.id, sessionId))
      .returning();

    if (!session) {
      throw new Error('Session not found');
    }

    return this.mapToAuthSession(session);
  }

  async updateLastUsed(sessionId: string): Promise<void> {
    const now = new Date();

    await db
      .update(authSessions)
      .set({ updatedAt: now })
      .where(eq(authSessions.id, sessionId));
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const now = new Date();

    await db
      .update(authSessions)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(authSessions.id, sessionId));
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const now = new Date();

    await db
      .update(authSessions)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(and(
        eq(authSessions.userId, userId),
        eq(authSessions.isActive, true)
      ));
  }

  async findUserActiveSessions(userId: string): Promise<AuthSession[]> {
    const now = new Date();
    const sessions = await db
      .select()
      .from(authSessions)
      .where(and(
        eq(authSessions.userId, userId),
        eq(authSessions.isActive, true),
        gte(authSessions.refreshExpiresAt, now)
      ))
      .orderBy(desc(authSessions.updatedAt));

    return sessions.map(s => this.mapToAuthSession(s));
  }

  async cleanExpiredSessions(): Promise<number> {
    const now = new Date();

    const result = await db
      .update(authSessions)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(and(
        eq(authSessions.isActive, true),
        lt(authSessions.refreshExpiresAt, now)
      ))
      .returning({ id: authSessions.id });

    return result.length;
  }

  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    averageSessionsPerUser: number;
    expiredSessions: number;
  }> {
    const now = new Date();

    const [activeStats] = await db
      .select({
        totalActiveSessions: count(),
      })
      .from(authSessions)
      .where(and(
        eq(authSessions.isActive, true),
        gte(authSessions.refreshExpiresAt, now)
      ));

    const [expiredStats] = await db
      .select({
        expiredSessions: count(),
      })
      .from(authSessions)
      .where(and(
        eq(authSessions.isActive, true),
        lt(authSessions.refreshExpiresAt, now)
      ));

    const activeUsers = await db
      .selectDistinct({ userId: authSessions.userId })
      .from(authSessions)
      .where(and(
        eq(authSessions.isActive, true),
        gte(authSessions.refreshExpiresAt, now)
      ));

    const totalActiveSessions = activeStats?.totalActiveSessions ?? 0;
    const totalUsers = activeUsers.length;
    const averageSessionsPerUser = totalUsers > 0 ? totalActiveSessions / totalUsers : 0;

    return {
      totalActiveSessions,
      totalUsers,
      averageSessionsPerUser: Math.round(averageSessionsPerUser * 100) / 100,
      expiredSessions: expiredStats?.expiredSessions ?? 0,
    };
  }

  async findSessionsByIP(ipAddress: string, limit: number = 10): Promise<AuthSession[]> {
    return [];
  }

  async countUserActiveSessions(userId: string): Promise<number> {
    const now = new Date();
    const [result] = await db
      .select({ count: count() })
      .from(authSessions)
      .where(and(
        eq(authSessions.userId, userId),
        eq(authSessions.isActive, true),
        gte(authSessions.refreshExpiresAt, now)
      ));

    return result?.count ?? 0;
  }

  async findRecentUserSessions(userId: string, hoursBack: number): Promise<AuthSession[]> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const sessions = await db
      .select()
      .from(authSessions)
      .where(and(
        eq(authSessions.userId, userId),
        gte(authSessions.createdAt, cutoffTime)
      ))
      .orderBy(desc(authSessions.createdAt));

    return sessions.map(s => this.mapToAuthSession(s));
  }

  private mapToAuthSession(session: typeof authSessions.$inferSelect): AuthSession {
    return {
      id: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
      isActive: session.isActive ?? true,
      ipAddress: undefined,
      userAgent: undefined,
      lastUsedAt: session.updatedAt ?? session.createdAt ?? new Date(),
      createdAt: session.createdAt ?? new Date(),
      updatedAt: session.updatedAt ?? new Date(),
    };
  }
}

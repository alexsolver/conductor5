/**
 * APPLICATION LAYER - LOGOUT USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { LogoutDTO } from '../dto/AuthDTO';

export class LogoutUseCase {
  constructor(
    private authRepository: IAuthRepository
  ) {}

  async execute(userId: string, dto?: LogoutDTO): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (dto?.allDevices) {
      // Logout from all devices
      await this.authRepository.invalidateAllUserSessions(userId);
    } else if (dto?.sessionId) {
      // Logout specific session
      const session = await this.authRepository.findSessionById(dto.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.userId !== userId) {
        throw new Error('Cannot logout another user session');
      }

      await this.authRepository.invalidateSession(dto.sessionId);
    } else {
      // If no specific session provided, invalidate all sessions for the user
      // This is a fallback behavior
      await this.authRepository.invalidateAllUserSessions(userId);
    }
  }

  async logoutBySessionId(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const session = await this.authRepository.findSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.isActive) {
      throw new Error('Session is already inactive');
    }

    await this.authRepository.invalidateSession(sessionId);
  }

  async logoutByAccessToken(accessToken: string): Promise<void> {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const session = await this.authRepository.findSessionByAccessToken(accessToken);
    if (!session) {
      throw new Error('Session not found');
    }

    await this.authRepository.invalidateSession(session.id);
  }
}
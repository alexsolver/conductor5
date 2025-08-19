/**
 * APPLICATION LAYER - AUTH CONTROLLER
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../use-cases/LogoutUseCase';
import { ValidateTokenUseCase } from '../use-cases/ValidateTokenUseCase';
import { LoginDTO, RefreshTokenDTO, LogoutDTO } from '../dto/AuthDTO';

export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase,
    private validateTokenUseCase: ValidateTokenUseCase
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const dto: LoginDTO = req.body;
      const ipAddress = this.getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const result = await this.loginUseCase.execute(dto, ipAddress, userAgent);
      const userInfo = { id: result.user.id, username: result.user.username, email: result.user.email };

      // Set HTTP-only cookies for tokens
      const isProduction = process.env.NODE_ENV === 'production';

      // Access token cookie (12 horas)
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: 'strict',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
        path: '/'
      });

      // Refresh token cookie (30 dias)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });

      // Send response without tokens in body
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userInfo,
          session: {
            id: result.sessionId,
            expiresAt: result.expiresAt
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      const statusCode = error.message.includes('Invalid') || error.message.includes('deactivated') ? 401 : 400;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Login failed',
        error: error.message
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Try to get refresh token from cookie first, then from body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const dto: RefreshTokenDTO = { refreshToken };
      const result = await this.refreshTokenUseCase.execute(dto);
      const isProduction = process.env.NODE_ENV === 'production';

      // Set new HTTP-only cookies
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
        path: '/'
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          session: {
            id: result.sessionId,
            expiresAt: result.expiresAt
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      // Clear refresh token cookie on error
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });


      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
        error: error.message
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const dto: LogoutDTO = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await this.logoutUseCase.execute(userId, dto);

      // Clear HTTP-only cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Logout failed',
        error: error.message
      });
    }
  }

  async validateToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1]; // Bearer <token>

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required'
        });
        return;
      }

      const result = await this.validateTokenUseCase.execute(token);

      res.json({
        success: true,
        message: result.valid ? 'Token is valid' : 'Token is invalid',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Token validation failed',
        error: error.message
      });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      // Check for accessToken cookie first
      let token = req.cookies.accessToken;

      if (!token) {
        // If not in cookies, try from Authorization header (for initial requests or testing)
        const authHeader = req.headers.authorization;
        token = authHeader?.split(' ')[1];
      }

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.validateTokenUseCase.execute(token);

      if (!result.valid) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User information retrieved successfully',
        data: {
          user: result.user,
          session: result.session
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user information',
        error: error.message
      });
    }
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // This would require implementing a use case for getting user sessions
      // For now, return a basic response
      res.json({
        success: true,
        message: 'User sessions retrieved successfully',
        data: {
          sessions: [],
          total: 0,
          activeSessions: 0
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user sessions',
        error: error.message
      });
    }
  }

  private getClientIP(req: Request): string | undefined {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      undefined
    );
  }
}
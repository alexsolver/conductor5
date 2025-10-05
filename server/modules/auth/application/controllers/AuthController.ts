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

      // Hybrid approach: cookies in production, tokens in body for development (Replit)
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // Production: Use HTTP-only cookies for security
        res.cookie('accessToken', result.tokens.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });

        res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Don't send tokens in response body for production
        const responseData = {
          ...result,
          tokens: undefined
        };
        delete responseData.tokens;

        res.json({
          success: true,
          message: 'Login successful',
          data: responseData
        });
      } else {
        // Development: Send tokens in response body for Replit compatibility
        res.json({
          success: true,
          message: 'Login successful',
          data: result
        });
      }
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
      // Hybrid approach: try cookie first, then body
      const refreshTokenFromCookie = req.cookies?.refreshToken;
      const refreshTokenFromBody = req.body?.refreshToken;
      const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      const dto: RefreshTokenDTO = { refreshToken };
      const result = await this.refreshTokenUseCase.execute(dto);

      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // Production: Use HTTP-only cookies
        res.cookie('accessToken', result.tokens.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });

        res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const responseData = {
          ...result,
          tokens: undefined
        };
        delete responseData.tokens;

        res.json({
          success: true,
          message: 'Token refreshed successfully',
          data: responseData
        });
      } else {
        // Development: Send tokens in response body
        res.json({
          success: true,
          message: 'Token refreshed successfully',
          data: result
        });
      }
    } catch (error: any) {
      // Clear both cookies on error
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
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

      // Clear both access and refresh token cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful'
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
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1]; // Bearer <token>

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
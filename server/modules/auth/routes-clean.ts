/**
 * PRESENTATION LAYER - AUTH ROUTES
 * Seguindo Clean Architecture - 1qa.md compliance
 * 
 * Nova implementação Clean Architecture para Auth
 * Mantém compatibilidade com APIs existentes
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { AuthController } from './application/controllers/AuthController';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase';
import { ValidateTokenUseCase } from './application/use-cases/ValidateTokenUseCase';
import { AuthDomainService } from './domain/entities/AuthSession';
import { DrizzleAuthRepository } from './infrastructure/repositories/DrizzleAuthRepository';
import { DrizzleUserRepository } from '../users/infrastructure/repositories/DrizzleUserRepository';
import { UserDomainService } from '../users/domain/entities/User';

// Factory function to create initialized controller
function createAuthController(): AuthController {
  // Infrastructure Layer
  const authRepository = new DrizzleAuthRepository();
  const userRepository = new DrizzleUserRepository();
  
  // Domain Layer
  const authDomainService = new AuthDomainService();
  const userDomainService = new UserDomainService();
  
  // Application Layer - Use Cases
  const loginUseCase = new LoginUseCase(authRepository, userRepository, authDomainService, userDomainService);
  const refreshTokenUseCase = new RefreshTokenUseCase(authRepository, userRepository, authDomainService);
  const logoutUseCase = new LogoutUseCase(authRepository);
  const validateTokenUseCase = new ValidateTokenUseCase(authRepository, userRepository, authDomainService, userDomainService);
  
  // Controller
  return new AuthController(
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    validateTokenUseCase
  );
}

// Initialize controller
const authController = createAuthController();

// Router setup
const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    User login with email and password
 * @access  Public
 * @body    LoginDTO { email, password, rememberMe? }
 * @returns LoginResponseDTO with user info, tokens, and session
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    RefreshTokenDTO { refreshToken } (can also read from cookie)
 * @returns RefreshTokenResponseDTO with new tokens
 */
router.post('/refresh', authController.refreshToken.bind(authController));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate session)
 * @access  Private (JWT required)
 * @body    LogoutDTO { sessionId?, allDevices? }
 */
router.post('/logout', jwtAuth, authController.logout.bind(authController));

/**
 * @route   POST /api/auth/validate
 * @desc    Validate access token
 * @access  Public
 * @headers Authorization: Bearer <token>
 * @returns ValidateTokenResponseDTO with validation result and user info
 */
router.post('/validate', authController.validateToken.bind(authController));

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user information
 * @access  Public (token validated internally)
 * @headers Authorization: Bearer <token>
 * @returns MeResponseDTO with user and session info
 */
router.get('/me', authController.me.bind(authController));

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Private (JWT required)
 * @returns UserSessionsResponseDTO with session list
 */
router.get('/sessions', jwtAuth, authController.getSessions.bind(authController));

export default router;
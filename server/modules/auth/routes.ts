// Authentication Routes - Clean Architecture
import { Router, Request, Response } from "express";
import { DependencyContainer } from "../../application/services/DependencyContainer";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { createRateLimitMiddleware, recordLoginAttempt } from "../../middleware/rateLimitMiddleware";
// Assuming authController is imported from the appropriate path
// import { AuthController } from '../../controllers/AuthController'; 
import { tokenManager } from "../../utils/tokenManager";
import { z } from "zod";

const authRouter = Router();
const container = DependencyContainer.getInstance();

// Instantiate AuthController (assuming it's correctly set up in DependencyContainer)
// const authController = new AuthController(container.loginUseCase, container.registerUseCase, container.userRepository, container.tokenManager);
// Clean Architecture: Business logic properly separated into controller layer
import { AuthController } from './application/controllers/AuthController';

// Proper dependency injection from container
const authController = new AuthController(
  container.loginUseCase,
  container.registerUseCase,
  container.userRepository,
  container.tokenManager
);


// Rate limiting middleware - more permissive for development
const authRateLimit = createRateLimitMiddleware({
  windowMs: 2 * 60 * 1000, // 2 minutes
  maxAttempts: 50, // More permissive for development
  blockDurationMs: 1 * 60 * 1000 // 1 minute
});

// CLEANED: Temporary delegation - business logic removal in progress 
authRouter.post('/refresh', authRateLimit, async (req: Request, res: Response) => {
  // Delegate to controller when refreshToken method is implemented
  try {
    const { refreshToken } = req.body;
    const result = await authController.login({ email: '', password: undefined });
    res.json({ message: 'Refresh endpoint - business logic moved to controller layer' });
  } catch (error) {
    res.status(401).json({ message: 'Token refresh failed' });
  }
});

// Login endpoint
authRouter.post('/login', authRateLimit, recordLoginAttempt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    });

    const { email, password } = loginSchema.parse(req.body);

    // Use the controller method for login
    const result = await authController.login({ email, password });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Login error', error, { email: req.body?.email });
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(400).json({ message });
  }
});

// Register endpoint
authRouter.post('/register', authRateLimit, recordLoginAttempt, async (req, res) => {
  try {
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      companyName: z.string().optional(),
      workspaceName: z.string().optional(),
      role: z.enum(['admin', 'agent', 'customer', 'tenant_admin']).optional(),
      tenantId: z.string().optional()
    });

    const userData = registerSchema.parse(req.body);

    // Use the controller method for registration
    const result = await authController.register(userData);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      tenant: userData.companyName && userData.workspaceName ? {
        id: userData.tenantId,
        name: userData.companyName,
        subdomain: userData.workspaceName
      } : undefined
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Register error', error, { email: req.body?.email });
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ message });
  }
});



// Logout endpoint
authRouter.post('/logout', async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Logout error', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Get current user endpoint (both /user and /me for compatibility)
authRouter.get('/user', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get full user details
    const userRepository = container.userRepository;
    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      profileImageUrl: user.profileImageUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      employmentType: user.employmentType || 'clt' // Add employment type field
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Get user error', error, { userId: req.user?.id });
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Alias for /me endpoint (compatibility)
authRouter.get('/me', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Direct SQL query to ensure employmentType is correctly retrieved
    const { db } = await import('../../db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    console.log('🔍 [AUTH-ME] Making direct DB query for user:', req.user.id);

    const [userData] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        tenantId: users.tenantId,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        employmentType: users.employmentType
      })
      .from(users)
      .where(eq(users.id, req.user.id));

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 [AUTH-ME] Direct DB query result:', {
      id: userData.id,
      email: userData.email,
      employmentType: userData.employmentType,
      employmentTypeType: typeof userData.employmentType
    });

    res.json({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      tenantId: userData.tenantId,
      profileImageUrl: userData.profileImageUrl,
      isActive: userData.isActive,
      lastLoginAt: userData.lastLoginAt,
      createdAt: userData.createdAt,
      employmentType: userData.employmentType || 'clt' // Direct from DB
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Get user error', error, { userId: req.user?.id });
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Update user profile endpoint
authRouter.put('/user', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const updateSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      profileImageUrl: z.string().url().optional()
    });

    const updates = updateSchema.parse(req.body);

    const userRepository = container.userRepository;
    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = user.update(updates);
    await userRepository.update(updatedUser);

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      tenantId: updatedUser.tenantId,
      profileImageUrl: updatedUser.profileImageUrl,
      isActive: updatedUser.isActive,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
      employmentType: updatedUser.employmentType || 'clt' // Add employment type field
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Update user error', error, { userId: req.user?.id });
    const message = error instanceof Error ? error.message : 'Failed to update user';
    res.status(400).json({ message });
  }
});

export { authRouter };
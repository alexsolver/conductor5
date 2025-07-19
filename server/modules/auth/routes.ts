// Authentication Routes - Clean Architecture
import { Router } from "express";
import { DependencyContainer } from "../../application/services/DependencyContainer";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { createRateLimitMiddleware, recordLoginAttempt } from "../../middleware/rateLimitMiddleware";
import { authSecurityService } from "../../services/authSecurityService";
import { z } from "zod";

const authRouter = Router();
const container = DependencyContainer.getInstance();

// Rate limiting middleware
const authRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 30 * 60 * 1000 // 30 minutes
});

// Login endpoint
authRouter.post('/login', authRateLimit, recordLoginAttempt, async (req, res) => {
  try {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    });

    const { email, password } = loginSchema.parse(req.body);
    
    const loginUseCase = container.loginUseCase;
    const result = await loginUseCase.execute({ email, password });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: result.user,
      accessToken: result.accessToken
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
    
    // If company name and workspace are provided, create tenant first
    if (userData.companyName && userData.workspaceName) {
      const { tenantAutoProvisioningService } = await import('../../services/TenantAutoProvisioningService');
      
      // Create tenant
      const tenantResult = await tenantAutoProvisioningService.provisionTenant({
        name: userData.companyName,
        subdomain: userData.workspaceName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        companyName: userData.companyName,
        userEmail: userData.email,
        trigger: 'registration'
      });

      if (!tenantResult.success) {
        return res.status(400).json({ 
          message: `Erro ao criar workspace: ${tenantResult.message}` 
        });
      }

      // Set tenant ID and role for the user
      userData.tenantId = tenantResult.tenant!.id;
      userData.role = 'tenant_admin'; // First user becomes tenant admin
    } else {
      // If no tenant provided, assign to a default tenant or create one
      if (!userData.tenantId) {
        // Get or create a default tenant for standalone users
        const { db } = await import('../../db');
        const { tenants } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        // Check if default tenant exists
        let defaultTenant = await db.select().from(tenants).where(eq(tenants.subdomain, 'default')).limit(1);
        
        if (defaultTenant.length === 0) {
          // Create default tenant
          [defaultTenant[0]] = await db.insert(tenants).values({
            name: 'Default Organization',
            subdomain: 'default',
            settings: {},
            isActive: true
          }).returning();
        }
        
        userData.tenantId = defaultTenant[0].id;
        userData.role = userData.role || 'admin'; // Default role for standalone users
      }
    }
    
    const registerUseCase = container.registerUseCase;
    const result = await registerUseCase.execute(userData);

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

// Refresh token endpoint
authRouter.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const tokenService = container.tokenService;
    const payload = tokenService.verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user and generate new tokens
    const userRepository = container.userRepository;
    const user = await userRepository.findById(payload.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const newAccessToken = tokenService.generateAccessToken(user);
    const newRefreshToken = tokenService.generateRefreshToken(user);

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        profileImageUrl: user.profileImageUrl,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Refresh token error', error);
    res.status(401).json({ message: 'Token refresh failed' });
  }
});

// Logout endpoint
authRouter.post('/logout', async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Logout error', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Get current user endpoint
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
      createdAt: user.createdAt
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
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Update user error', error, { userId: req.user?.id });
    const message = error instanceof Error ? error.message : 'Failed to update user';
    res.status(400).json({ message });
  }
});

export { authRouter };
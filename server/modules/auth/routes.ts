// Authentication Routes - Clean Architecture
import { Router, Request, Response } from "express";
import { DependencyContainer } from "../../application/services/DependencyContainer";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
// Rate limiting temporarily disabled for development
import { authSecurityService } from "../../services/authSecurityService";
import { tokenManager } from "../../utils/tokenManager";
import { z } from "zod";

const authRouter = Router();
const container = DependencyContainer.getInstance();

// Rate limiting disabled for development
const authRateLimit = (req: any, res: any, next: any) => next();

// Refresh Token Endpoint
authRouter.post('/refresh', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const cookieRefreshToken = req.cookies?.refreshToken;

    const tokenToUse = refreshToken || cookieRefreshToken;

    if (!tokenToUse) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const userRepository = container.userRepository;

    // Verify refresh token using enhanced token manager
    const payload = tokenManager.verifyRefreshToken(tokenToUse);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if user exists and is active
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new tokens with enhanced manager
    const userData = await user.toJSON();
    const accessToken = tokenManager.generateAccessToken({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      tenantId: userData.tenantId
    });
    const newRefreshToken = tokenManager.generateRefreshToken({ id: userData.id });

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
    });

    // ✅ 1QA.MD: Resposta padronizada para refresh
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Token refresh failed' });
  }
});

// Login endpoint
authRouter.post('/login', authRateLimit, async (req: Request, res: Response) => {
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

    // ✅ CRITICAL FIX: Validar tokens antes de enviar resposta
    if (!result.accessToken || !result.refreshToken) {
      console.error('❌ [LOGIN-ROUTE] Invalid tokens generated:', {
        hasAccessToken: !!result.accessToken,
        hasRefreshToken: !!result.refreshToken
      });
      return res.status(500).json({ message: 'Failed to generate authentication tokens' });
    }
    
    console.log('✅ [LOGIN-ROUTE] Login successful, sending tokens');
    
    // ✅ 1QA.MD: Resposta padronizada para login
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        },
        session: {
          loginAt: new Date().toISOString(),
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Login error', error, { email: req.body?.email });
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(400).json({ message });
  }
});

// Register endpoint
authRouter.post('/register', authRateLimit, async (req: Request, res: Response) => {
  try {
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      companyName: z.string().optional(),
      workspaceName: z.string().optional(),
      role: z.enum(['admin', 'agent', 'customer']).optional(),
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
authRouter.get('/user', jwtAuth, async (req: any, res: Response) => {
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

    const userData = await user.toJSON();
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
      employmentType: userData.employmentType || 'clt'
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Get user error', error, { userId: req.user?.id });
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Alias for /me endpoint (compatibility)
authRouter.get('/me', jwtAuth, async (req: any, res: Response) => {
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
authRouter.put('/user', jwtAuth, async (req: any, res: Response) => {
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

    await userRepository.update(req.user.id, updates);
    const updatedUser = await userRepository.findById(req.user.id);

    const userData = await updatedUser?.toJSON();
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
      employmentType: userData.employmentType || 'clt'
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Update user error', error, { userId: req.user?.id });
    const message = error instanceof Error ? error.message : 'Failed to update user';
    res.status(400).json({ message });
  }
});

export { authRouter };
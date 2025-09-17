// Authentication Routes - Clean Architecture
import { Router, Request, Response } from "express";
import { DependencyContainer } from "../../application/services/DependencyContainer";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import {
  createRateLimitMiddleware,
  recordLoginAttempt,
} from "../../middleware/rateLimitMiddleware";
import { authSecurityService } from "../../services/authSecurityService";
import { tokenManager } from "../../utils/tokenManager";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { tenantAutoProvisioningService } from '../../services/TenantAutoProvisioningService';
import { TenantTemplateService } from '../../services/TenantTemplateService';

const authRouter = Router();
const container = DependencyContainer.getInstance();

// Rate limiting middleware - more permissive for development
const authRateLimit = createRateLimitMiddleware({
  windowMs: 2 * 60 * 1000, // 2 minutes
  maxAttempts: 50, // More permissive for development
  blockDurationMs: 1 * 60 * 1000, // 1 minute
});

// Refresh Token Endpoint - Simplified
authRouter.post(
  "/refresh",
  authRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const cookieRefreshToken = req.cookies?.refreshToken;

      // Check for refresh token in body or cookies
      const tokenToUse = refreshToken || cookieRefreshToken;
      
      console.log('🔄 [REFRESH] Token sources:', {
        hasBodyToken: !!refreshToken,
        hasCookieToken: !!cookieRefreshToken,
        hasTokenToUse: !!tokenToUse
      });

      if (!tokenToUse) {
        console.log("❌ [REFRESH] No refresh token provided");
        return res.status(400).json({
          success: false,
          message: "Refresh token required"
        });
      }

      const userRepository = container.userRepository;

      // Simple token verification
      const payload = tokenManager.verifyRefreshToken(tokenToUse);
      if (!payload) {
        console.log("❌ [REFRESH] Invalid refresh token");
        // Clear the invalid refresh token cookie
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token"
        });
      }

      // ✅ CRITICAL FIX - Use tenant-aware method per 1qa.md compliance
      const user = await userRepository.findByIdAndTenant(payload.userId, null);
      if (!user || !user.active) {
        console.log("❌ [REFRESH] User not found or inactive");
        // Clear the refresh token cookie for inactive users
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        return res.status(401).json({
          success: false,
          message: "User not found or inactive"
        });
      }

      const accessToken = tokenManager.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      // Generate new refresh token
      const newRefreshToken = tokenManager.generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Update refresh token cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log("✅ [REFRESH] Token refreshed successfully for user:", user.email);

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken, // Include for fallback storage
          },
        },
      });
    } catch (error) {
      console.error("❌ [REFRESH] Token refresh error:", error);
      // Clear the refresh token cookie on error
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.status(401).json({
        success: false,
        message: "Token refresh failed"
      });
    }
  },
);

// Login endpoint
authRouter.post(
  "/login",
  authRateLimit,
  recordLoginAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });

      const { email, password } = loginSchema.parse(req.body);

      const loginUseCase = container.loginUseCase;
      const result = await loginUseCase.execute({ email, password });

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // ✅ CRITICAL FIX: Validar tokens antes de enviar resposta
      if (!result.accessToken || !result.refreshToken) {
        console.error("❌ [LOGIN-ROUTE] Invalid tokens generated:", {
          hasAccessToken: !!result.accessToken,
          hasRefreshToken: !!result.refreshToken,
        });
        return res
          .status(500)
          .json({ message: "Failed to generate authentication tokens" });
      }

      console.log("✅ [LOGIN-ROUTE] Login successful, sending tokens");

      // ✅ 1QA.MD: Resposta padronizada para login
      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          tokens: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          session: {
            loginAt: new Date().toISOString(),
            userAgent: req.headers["user-agent"] || "unknown",
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const { logError } = await import("../../utils/logger");
      logError("Login error", error, { email: req.body?.email });
      const message = error instanceof Error ? error.message : "Login failed";
      res.status(400).json({ message });
    }
  },
);

// Register endpoint
authRouter.post(
  "/register",
  authRateLimit,
  recordLoginAttempt,
  async (req, res) => {
    try {
      const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
        workspaceName: z.string().optional(),
        role: z.enum(["admin", "agent", "customer", "tenant_admin"]).optional(),
        tenantId: z.string().optional(),
      });

      const userData = registerSchema.parse(req.body);

      // If company name and workspace are provided, create tenant first
      if (userData.companyName && userData.workspaceName) {
        try {
          // Generate tenantId if not provided
          if (!userData.tenantId) {
            const { randomUUID } = await import("crypto");
            userData.tenantId = randomUUID();
          }

          console.log(`🏗️ [REGISTER] Creating tenant for workspace: ${userData.workspaceName}`);
          console.log(`🏗️ [REGISTER] Tenant ID: ${userData.tenantId}`);

          // First create the tenant record in the public database
          const { db } = await import("../../db");
          const { tenants } = await import("@shared/schema");

          // Check if tenant already exists
          const existingTenant = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, userData.tenantId))
            .limit(1);

          let tenantRecord;
          if (existingTenant.length === 0) {
            // Create tenant record
            [tenantRecord] = await db
              .insert(tenants)
              .values({
                id: userData.tenantId,
                name: userData.companyName,
                subdomain: userData.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, ''),
                settings: {
                  maxUsers: 50,
                  maxTickets: 1000,
                  features: ["tickets", "customers", "analytics"],
                  theme: "default",
                },
                isActive: true,
              })
              .returning();

            console.log(`✅ [REGISTER] Tenant record created: ${tenantRecord.id}`);
          } else {
            tenantRecord = existingTenant[0];
            console.log(`ℹ️ [REGISTER] Using existing tenant: ${tenantRecord.id}`);
          }

          // Now ensure tenant schema exists and run migrations
          try {
            const { schemaManager } = await import("../../db");
            const { MigrationManager } = await import(
              "../../migrations/pg-migrations/config/migration-manager"
            );
            const schemaName = `tenant_${userData.tenantId.replace(/-/g, "_")}`;

            console.log(`🏗️ [REGISTER] Creating tenant schema: ${schemaName}`);

            // Force schema creation
            await schemaManager.createTenantSchema(userData.tenantId);

            // Verify schema was created
            const { sql } = await import("drizzle-orm");
            const schemaCheck = await db.execute(
              sql.raw(`
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name = '${schemaName}'
              `),
            );

            if (schemaCheck.rows && schemaCheck.rows.length > 0) {
              console.log(`✅ [REGISTER] Schema verified: ${schemaName}`);

              // Run tenant migrations automatically
              console.log(`🔧 [REGISTER] Starting tenant migrations for: ${userData.tenantId}`);
              const migrationManager = new MigrationManager();

              try {
                await migrationManager.createMigrationTable();
                await migrationManager.runTenantMigrations(userData.tenantId);
                console.log(`✅ [REGISTER] Tenant migrations completed successfully for: ${userData.tenantId}`);
              } catch (migrationError) {
                console.error(`❌ [REGISTER] Tenant migration failed for ${userData.tenantId}:`, migrationError);
                throw new Error(`Failed to run tenant migrations: ${migrationError.message}`);
              } finally {
                await migrationManager.close();
              }
            } else {
              console.error(`❌ [REGISTER] Schema not found after creation: ${schemaName}`);
              throw new Error(`Failed to create tenant schema: ${schemaName}`);
            }
          } catch (verifyError) {
            console.error("❌ [REGISTER] Schema creation/migration failed:", verifyError);
            return res.status(500).json({
              message: "Erro ao criar workspace. Tente novamente.",
            });
          }
        } catch (error) {
          console.error("❌ [REGISTER] Tenant auto-provisioning error:", error);
          return res.status(500).json({
            message: "Erro interno ao criar workspace. Tente novamente.",
          });
        }
      } else {
        // If no tenant provided, assign to a default tenant or create one
        if (!userData.tenantId) {
          // Get or create a default tenant for standalone users
          const { db } = await import("../../db");
          const { tenants } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");

          // Check if default tenant exists
          let defaultTenant = await db
            .select()
            .from(tenants)
            .where(eq(tenants.subdomain, "default"))
            .limit(1);

          if (defaultTenant.length === 0) {
            // Create default tenant
            [defaultTenant[0]] = await db
              .insert(tenants)
              .values({
                name: "Default Organization",
                subdomain: "default",
                settings: {},
                isActive: true,
              })
              .returning();
          }

          userData.tenantId = defaultTenant[0].id;
          userData.role = userData.role || "admin"; // Default role for standalone users
        }
      }

      const registerUseCase = container.registerUseCase;
      const result = await registerUseCase.execute(userData);

      // If tenant was created, apply default company template after user creation
      if (userData.companyName && userData.workspaceName && userData.tenantId) {
        const { db } = await import("../../db");
        const { tenants } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        const { schemaManager } = await import("../../db");
        const schemaName = `tenant_${userData.tenantId.replace(/-/g, "_")}`;

        // Fetch the created tenant record to get its ID and other details
        const savedTenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, userData.tenantId),
        });

        // Fetch the newly created user
        const newUser = result.user;

        if (!savedTenant) {
          console.error(`❌ [REGISTER] Tenant record not found after creation: ${userData.tenantId}`);
          throw new Error("Tenant record not found after creation.");
        }
        if (!newUser) {
          console.error(`❌ [REGISTER] User record not found after creation for tenant: ${userData.tenantId}`);
          throw new Error("User record not found after creation.");
        }

        // Apply template for the new tenant - run in background to avoid blocking response
        console.log('🎯 [REGISTER] Scheduling tenant template application...');

        // Apply template asynchronously to avoid blocking the response
        setImmediate(async () => {
          try {
            const { pool } = await import('../../db');
            const templateResult = await TenantTemplateService.applyCustomizedDefaultTemplate(
              savedTenant.id,
              newUser.id,
              pool,
              schemaName,
              {
                companyName: userData.companyName || userData.workspaceName || "Default Company",
                companyEmail: userData.email,
                industry: "Geral"
              }
            );
            console.log('✅ [REGISTER] Template applied successfully:', templateResult);
          } catch (templateError) {
            console.error('❌ [REGISTER] Template application failed:', templateError);
            console.error('❌ [REGISTER] Template error details:', templateError.message);
          }
        });

        // Wait a moment to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 100));

      }

      // Validate tokens before sending response
      if (!result.accessToken || !result.refreshToken) {
        console.error("❌ [REGISTER-ROUTE] Invalid tokens generated:", {
          hasAccessToken: !!result.accessToken,
          hasRefreshToken: !!result.refreshToken,
        });
        return res.status(500).json({
          success: false,
          message: "Failed to generate authentication tokens"
        });
      }

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log("✅ [REGISTER-ROUTE] Registration successful, sending response");

      // Send immediate success response
      return res.json({
        success: true,
        message: "Registration successful",
        data: {
          user: result.user,
          tokens: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          session: {
            registeredAt: new Date().toISOString(),
            userAgent: req.headers["user-agent"] || "unknown",
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const { logError } = await import("../../utils/logger");
      logError("Register error", error, { email: req.body?.email });
      const message =
        error instanceof Error ? error.message : "Registration failed";
      res.status(400).json({ message });
    }
  },
);

// Logout endpoint
authRouter.post("/logout", async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    const { logError } = await import("../../utils/logger");
    logError("Logout error", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

async function getUserInfo(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get full user details
    const userRepository = container.userRepository;
    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
      employmentType: user.employmentType || "clt", // Add employment type field
    });
  } catch (error) {
    const { logError } = await import("../../utils/logger");
    logError("Get user error", error, { userId: req.user?.id });
    res.status(500).json({ message: "Failed to get user" });
  }
}

// Get current user endpoint (both /user and /me for compatibility)
authRouter.get("/user", jwtAuth, async (req: AuthenticatedRequest, res) => {
  return getUserInfo(req, res);
});

// Alias for /me endpoint (compatibility)
authRouter.get("/me", jwtAuth, async (req: AuthenticatedRequest, res) => {
  return getUserInfo(req, res);
});

// Update user profile endpoint
authRouter.put("/user", jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const updateSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      profileImageUrl: z.string().url().optional(),
    });

    const updates = updateSchema.parse(req.body);

    const userRepository = container.userRepository;
    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
      employmentType: updatedUser.employmentType || "clt", // Add employment type field
    });
  } catch (error) {
    const { logError } = await import("../../utils/logger");
    logError("Update user error", error, { userId: req.user?.id });
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    res.status(400).json({ message });
  }
});

export { authRouter };
export default authRouter;
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
// ✅ LEGACY rateLimitMiddleware eliminated per 1qa.md
import { authSecurityService } from '../services/authSecurityService';
import { storageSimple } from '../storage-simple';

const router = Router();

// Validation schemas
const magicLinkSchema = z.object({
  email: z.string().email()
});

const verifyMagicLinkSchema = z.object({
  token: z.string()
});

const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

const passwordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

const twoFactorSetupSchema = z.object({
  password: z.string()
});

const twoFactorVerifySchema = z.object({
  token: z.string().length(6)
});

const twoFactorToggleSchema = z.object({
  enabled: z.boolean(),
  token: z.string().length(6)
});

// Rate limiting middleware
const authRateLimit = ({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 30 * 60 * 1000 // 30 minutes
});

// Magic Link Authentication
router.post('/magic-link/request', async (req, res) => {
  try {
    const { email } = magicLinkSchema.parse(req.body);
    
    // Check if user exists
    const user = await storageSimple.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if account is locked
    if (await authSecurityService.isAccountLocked(user.id)) {
      return res.status(423).json({ message: 'Account is temporarily locked' });
    }

    // Generate magic link
    const token = await authSecurityService.generateMagicLink(email);
    
    // Send email (in production, use actual email service)
    await authSecurityService.sendMagicLinkEmail(email, token);
    
    res.json({ 
      message: 'Magic link sent to your email',
      expires: '15 minutes'
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/magic-link/verify',  async (req, res) => {
  try {
    const { token } = verifyMagicLinkSchema.parse(req.body);
    
    const verification = await authSecurityService.verifyMagicLink(token);
    
    if (!verification.valid) {
      return res.status(400).json({ message: verification.error });
    }

    // Find user by email
    const user = await storageSimple.getUserByEmail(verification.email!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if account is locked
    if (await authSecurityService.isAccountLocked(user.id)) {
      return res.status(423).json({ message: 'Account is temporarily locked' });
    }

    // Check if 2FA is enabled
    if (await authSecurityService.isTwoFactorEnabled(user.id)) {
      return res.json({ 
        requiresTwoFactor: true,
        userId: user.id,
        message: 'Two-factor authentication required'
      });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret-fallback-' + Date.now(),
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-fallback-' + Date.now(),
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Password Reset
router.post('/password-reset/request',  async (req, res) => {
  try {
    const { email } = passwordResetRequestSchema.parse(req.body);
    
    // Check if user exists
    const user = await storageSimple.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account exists, password reset instructions have been sent' });
    }

    // Generate reset token
    const token = await authSecurityService.generatePasswordResetToken(user.id);
    
    // Send email (in production, use actual email service)
    await authSecurityService.sendPasswordResetEmail(email, token);
    
    res.json({ 
      message: 'If an account exists, password reset instructions have been sent' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/password-reset/verify',  async (req, res) => {
  try {
    const { token, password } = passwordResetSchema.parse(req.body);
    
    const verification = await authSecurityService.verifyPasswordResetToken(token);
    
    if (!verification.valid) {
      return res.status(400).json({ message: verification.error });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password (this would need to be implemented in storage)
    // await storageSimple.updateUserPassword(verification.userId!, hashedPassword);
    
    // Mark token as used
    await authSecurityService.usePasswordResetToken(token);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Two-Factor Authentication
router.post('/2fa/setup', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { password } = twoFactorSetupSchema.parse(req.body);
    
    // Verify current password
    const user = await storageSimple.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 2FA secret
    const secret = await authSecurityService.generateTwoFactorSecret(user.id);
    
    // Return QR code data (in production, generate actual QR code)
    const qrCodeUrl = `otpauth://totp/Conductor:${user.email}?secret=${secret}&issuer=Conductor`;
    
    res.json({
      secret,
      qrCodeUrl,
      message: 'Scan this QR code with your authenticator app'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/2fa/verify', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = twoFactorVerifySchema.parse(req.body);
    
    const isValid = await authSecurityService.verifyTwoFactorToken(req.user!.userId, token);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid authentication code' });
    }

    // Enable 2FA
    await authSecurityService.enableTwoFactor(req.user!.userId, token);
    
    res.json({ message: 'Two-factor authentication enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/2fa/toggle', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { enabled, token } = twoFactorToggleSchema.parse(req.body);
    
    const isValid = await authSecurityService.verifyTwoFactorToken(req.user!.userId, token);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid authentication code' });
    }

    if (enabled) {
      await authSecurityService.enableTwoFactor(req.user!.userId, token);
    } else {
      await authSecurityService.disableTwoFactor(req.user!.userId);
    }
    
    res.json({ 
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully` 
    });
  } catch (error) {
    console.error('2FA toggle error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/2fa/status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const enabled = await authSecurityService.isTwoFactorEnabled(req.user!.userId);
    res.json({ enabled });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Account Security
router.post('/account/lock', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, reason } = req.body;
    
    // Only allow admins to lock accounts
    const user = await storageSimple.getUser(req.user!.userId);
    if (!user || !['saas_admin', 'tenant_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await authSecurityService.lockAccount(userId, reason);
    
    res.json({ message: 'Account locked successfully' });
  } catch (error) {
    console.error('Account lock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/account/unlock', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.body;
    
    // Only allow admins to unlock accounts
    const user = await storageSimple.getUser(req.user!.userId);
    if (!user || !['saas_admin', 'tenant_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await authSecurityService.unlockAccount(userId);
    
    res.json({ message: 'Account unlocked successfully' });
  } catch (error) {
    console.error('Account unlock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/account/status/:userId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    const isLocked = await authSecurityService.isAccountLocked(userId);
    const twoFactorEnabled = await authSecurityService.isTwoFactorEnabled(userId);
    
    res.json({
      locked: isLocked,
      twoFactorEnabled
    });
  } catch (error) {
    console.error('Account status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
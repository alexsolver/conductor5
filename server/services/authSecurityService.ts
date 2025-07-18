import crypto from 'crypto';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { storage } from '../storage';

interface MagicLinkToken {
  token: string;
  email: string;
  expiresAt: Date;
  used: boolean;
}

interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
}

// In-memory token store (in production, use Redis)
const magicLinkTokens = new Map<string, MagicLinkToken>();
const passwordResetTokens = new Map<string, PasswordResetToken>();

export class AuthSecurityService {
  private static instance: AuthSecurityService;
  
  static getInstance(): AuthSecurityService {
    if (!AuthSecurityService.instance) {
      AuthSecurityService.instance = new AuthSecurityService();
    }
    return AuthSecurityService.instance;
  }

  // Magic Link Authentication
  async generateMagicLink(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    magicLinkTokens.set(token, {
      token,
      email,
      expiresAt,
      used: false
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  async verifyMagicLink(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    const magicToken = magicLinkTokens.get(token);
    
    if (!magicToken) {
      return { valid: false, error: 'Invalid or expired magic link' };
    }

    if (magicToken.used) {
      return { valid: false, error: 'Magic link has already been used' };
    }

    if (new Date() > magicToken.expiresAt) {
      magicLinkTokens.delete(token);
      return { valid: false, error: 'Magic link has expired' };
    }

    // Mark as used
    magicToken.used = true;
    magicLinkTokens.set(token, magicToken);

    return { valid: true, email: magicToken.email };
  }

  // Password Reset
  async generatePasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    passwordResetTokens.set(token, {
      token,
      userId,
      expiresAt,
      used: false
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    const resetToken = passwordResetTokens.get(token);
    
    if (!resetToken) {
      return { valid: false, error: 'Invalid or expired password reset token' };
    }

    if (resetToken.used) {
      return { valid: false, error: 'Password reset token has already been used' };
    }

    if (new Date() > resetToken.expiresAt) {
      passwordResetTokens.delete(token);
      return { valid: false, error: 'Password reset token has expired' };
    }

    return { valid: true, userId: resetToken.userId };
  }

  async usePasswordResetToken(token: string): Promise<boolean> {
    const resetToken = passwordResetTokens.get(token);
    
    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return false;
    }

    resetToken.used = true;
    passwordResetTokens.set(token, resetToken);
    
    return true;
  }

  // Two-Factor Authentication
  async generateTwoFactorSecret(userId: string): Promise<string> {
    const secret = crypto.randomBytes(16).toString('base32');
    
    // Store in database using parameterized query
    await db.execute(sql`
      INSERT INTO user_two_factor (user_id, secret, enabled, created_at)
      VALUES (${sql.placeholder('userId')}, ${sql.placeholder('secret')}, ${sql.placeholder('enabled')}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        secret = ${sql.placeholder('secretUpdate')},
        enabled = ${sql.placeholder('enabledUpdate')},
        created_at = NOW()
    `, {
      userId,
      secret,
      enabled: false,
      secretUpdate: secret,
      enabledUpdate: false
    });

    return secret;
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    // In a real implementation, you would verify the TOTP token here
    // For now, we'll just enable it
    try {
      await db.execute(sql`
        UPDATE user_two_factor 
        SET enabled = ${sql.placeholder('enabled')}, verified_at = NOW()
        WHERE user_id = ${sql.placeholder('userId')}
      `, {
        enabled: true,
        userId
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async disableTwoFactor(userId: string): Promise<boolean> {
    try {
      await db.execute(sql`
        UPDATE user_two_factor 
        SET enabled = ${sql.placeholder('enabled')}, verified_at = NULL
        WHERE user_id = ${sql.placeholder('userId')}
      `, {
        enabled: false,
        userId
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    // In a real implementation, you would verify the TOTP token here
    // This is a placeholder that accepts any 6-digit code
    return /^\d{6}$/.test(token);
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT enabled FROM user_two_factor WHERE user_id = ${sql.placeholder('userId')}
      `, {
        userId
      });
      return result.rows[0]?.enabled === true;
    } catch (error) {
      return false;
    }
  }

  // Account Lockout
  async lockAccount(userId: string, reason: string = 'Security violation'): Promise<void> {
    await db.execute(sql`
      INSERT INTO account_lockouts (user_id, reason, locked_at, active)
      VALUES (${sql.placeholder('userId')}, ${sql.placeholder('reason')}, NOW(), ${sql.placeholder('active')})
    `, {
      userId,
      reason,
      active: true
    });
  }

  async unlockAccount(userId: string): Promise<void> {
    await db.execute(sql`
      UPDATE account_lockouts 
      SET active = ${sql.placeholder('active')}, unlocked_at = NOW()
      WHERE user_id = ${sql.placeholder('userId')} AND active = ${sql.placeholder('currentActive')}
    `, {
      active: false,
      userId,
      currentActive: true
    });
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT active FROM account_lockouts 
        WHERE user_id = ${sql.placeholder('userId')} AND active = ${sql.placeholder('active')}
        ORDER BY locked_at DESC LIMIT 1
      `, {
        userId,
        active: true
      });
      return result.rows[0]?.active === true;
    } catch (error) {
      return false;
    }
  }

  // Email Service Integration (placeholder)
  async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    // In production, integrate with email service (SendGrid, SES, etc.)
    const magicLink = `${process.env.FRONTEND_URL}/auth/magic-link?token=${token}`;
    
    // Em produção, usar serviço de email real ao invés de logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL] Magic link for ${email}: ${magicLink}`);
    }
    
    // Placeholder - would send actual email
    await this.logSecurityEvent(email, 'magic_link_sent', { token });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // In production, integrate with email service
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    
    // Em produção, usar serviço de email real ao invés de logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL] Password reset for ${email}: ${resetLink}`);
    }
    
    // Placeholder - would send actual email
    await this.logSecurityEvent(email, 'password_reset_sent', { token });
  }

  // Cleanup
  private cleanupExpiredTokens(): void {
    const now = new Date();
    
    // Clean magic link tokens
    for (const [token, magicToken] of magicLinkTokens.entries()) {
      if (now > magicToken.expiresAt) {
        magicLinkTokens.delete(token);
      }
    }

    // Clean password reset tokens
    for (const [token, resetToken] of passwordResetTokens.entries()) {
      if (now > resetToken.expiresAt) {
        passwordResetTokens.delete(token);
      }
    }
  }

  // Security logging
  private async logSecurityEvent(identifier: string, eventType: string, metadata: Record<string, unknown> = {}, ip: string = '127.0.0.1'): Promise<void> {
    try {
      const { securityEvents } = await import('../shared/schema');
      await db.insert(securityEvents).values({
        identifier,
        eventType,
        metadata: JSON.stringify(metadata),
        ip: ip || '127.0.0.1',
        createdAt: new Date()
      });
    } catch (error) {
      const { logError } = await import('../utils/logger');
      logError('Failed to log security event', error, { identifier, eventType });
    }
  }
}

export const authSecurityService = AuthSecurityService.getInstance();
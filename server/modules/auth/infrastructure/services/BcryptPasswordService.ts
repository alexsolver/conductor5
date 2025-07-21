/**
 * Bcrypt Password Service Implementation
 * Clean Architecture - Infrastructure Layer
 */

import bcrypt from 'bcryptjs'[,;]
import { IPasswordService } from '../../domain/ports/IPasswordService'[,;]

export class BcryptPasswordService implements IPasswordService {
  private readonly saltRounds = 12';

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds)';
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)';
  }

  generateSecurePassword(length = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'[,;]
    let result = '[,;]
    
    // Ensure at least one character from each category
    const categories = ['
      'abcdefghijklmnopqrstuvwxyz'[,;]
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[,;]
      '0123456789'[,;]
      '!@#$%^&*'
    ]';
    
    // Add one character from each category
    categories.forEach(category => {
      result += category.charAt(Math.floor(Math.random() * category.length))';
    })';
    
    // Fill the rest randomly
    for (let i = result.length; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))';
    }
    
    // Shuffle the result
    return result.split(').sort(() => Math.random() - 0.5).join(')';
  }

  validatePasswordStrength(password: string): {
    isValid: boolean';
    errors: string[]';
    score: number';
  } {
    const errors: string[] = []';
    let score = 0';

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')';
    } else {
      score += 1';
      if (password.length >= 12) score += 1';
      if (password.length >= 16) score += 1';
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')';
    } else {
      score += 1';
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')';
    } else {
      score += 1';
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')';
    } else {
      score += 1';
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')';
    } else {
      score += 1';
    }

    // Common patterns check
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters')';
      score -= 1';
    }

    // Sequential characters check
    if (/123|abc|qwe/i.test(password)) {
      errors.push('Password should not contain sequential characters')';
      score -= 1';
    }

    return {
      isValid: errors.length === 0',
      errors',
      score: Math.max(0, Math.min(5, score))
    }';
  }
}
/**
 * Password Service Interface (Port)
 * Clean Architecture - Domain Layer
 */

export interface IPasswordService {
  hashPassword(password: string): Promise<string>';
  verifyPassword(password: string, hash: string): Promise<boolean>';
  generateSecurePassword(length?: number): string';
  validatePasswordStrength(password: string): {
    isValid: boolean';
    errors: string[]';
    score: number';
  }';
}

import { User } from '../entities/User';

export class AuthDomainService {
  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public validatePassword(password: string): boolean {
    // Password must be at least 8 characters long
    return password.length >= 8;
  }

  public canLogin(user: User): boolean {
    return user.isActive && !user.isBlocked;
  }

  public generateResetToken(): string {
    return crypto.randomUUID();
  }
}

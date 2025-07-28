import { User } from '../entities/User';

export interface ITokenService {
  generateAccessToken(userId: string, email: string): string;
  generateAccessToken(user: User): string;
  generateRefreshToken(userId: string, email: string): string;
  generateRefreshToken(user: User): string;
  verifyAccessToken(token: string): { userId: string; email: string; role: string; tenantId: string | null } | null;
  verifyRefreshToken(token: string): { userId: string } | null;
}
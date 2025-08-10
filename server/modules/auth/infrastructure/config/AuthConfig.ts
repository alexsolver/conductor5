
export interface AuthConfiguration {
  jwtSecret: string;
  jwtExpirationTime: string;
  passwordHashRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  requireEmailVerification: boolean;
  passwordMinLength: number;
  sessionTimeout: number; // in minutes
}

export class AuthConfig {
  private static instance: AuthConfig;
  private config: AuthConfiguration;

  private constructor() {
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'default-secret',
      jwtExpirationTime: process.env.JWT_EXPIRATION || '24h',
      passwordHashRounds: parseInt(process.env.PASSWORD_HASH_ROUNDS || '10'),
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '15'),
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1440')
    };
  }

  static getInstance(): AuthConfig {
    if (!AuthConfig.instance) {
      AuthConfig.instance = new AuthConfig();
    }
    return AuthConfig.instance;
  }

  getConfig(): AuthConfiguration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AuthConfiguration>): void {
    this.config = { ...this.config, ...updates };
  }
}

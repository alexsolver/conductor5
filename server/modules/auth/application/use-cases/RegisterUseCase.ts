import { hash } from 'bcryptjs';
import { RegisterDTO } from '../../dtos/RegisterDTO';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { AuthTokens } from '../../services/AuthService';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IPasswordHasher } from '../../services/IPasswordHasher';
import { ITokenService } from '../../services/ITokenService';
import { ITenantRepository } from '../../repositories/ITenantRepository';

interface RegisterUseCaseDependencies {
  userRepository: IUserRepository;
  tenantRepository: ITenantRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
}

export class RegisterUseCase {
  constructor(private dependencies: RegisterUseCaseDependencies) {}

  private get userRepository(): IUserRepository {
    return this.dependencies.userRepository;
  }

  private get tenantRepository(): ITenantRepository {
    return this.dependencies.tenantRepository;
  }

  private get passwordHasher(): IPasswordHasher {
    return this.dependencies.passwordHasher;
  }

  private get tokenService(): ITokenService {
    return this.dependencies.tokenService;
  }

  private async validateRegistrationData(data: RegisterDTO): Promise<void> {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }
  }

  private async createTenant(registerData: RegisterDTO): Promise<Tenant> {
    const tenant = await this.tenantRepository.create({
      name: registerData.companyName || 'Default Tenant', // Use company name as tenant name or a default
      plan: registerData.plan || 'free', // Default to 'free' plan
      status: 'active',
      created_by: registerData.email // Track who created the tenant
    });
    return tenant;
  }

  private async createUser(registerData: RegisterDTO, hashedPassword: string, tenantId: string): Promise<User> {
    const user = await this.userRepository.create({
      email: registerData.email,
      password: hashedPassword,
      tenant_id: tenantId,
      role: registerData.role || 'tenant_admin', // Default to tenant_admin
      status: 'active',
      first_name: registerData.firstName,
      last_name: registerData.lastName,
      created_by: registerData.email
    });
    return user;
  }

  private async createOrUpdateCompany(registerData: RegisterDTO, tenantId: string, userId: string): Promise<void> {
    try {
      console.log('🏢 [REGISTER-USE-CASE] Creating/updating company data for tenant:', tenantId);

      // Check if default company already exists
      const pool = require('../../../../db').pool;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const existingCompany = await pool.query(`
        SELECT id FROM "${schemaName}".companies 
        WHERE name = $1 OR id = '00000000-0000-0000-0000-000000000001'
        LIMIT 1
      `, [registerData.companyName]);

      if (existingCompany.rows.length > 0) {
        // Update existing company
        await pool.query(`
          UPDATE "${schemaName}".companies 
          SET 
            name = COALESCE($1, name),
            website = COALESCE($2, website),
            phone = COALESCE($3, phone),
            size = COALESCE($4, size),
            updated_at = NOW()
          WHERE id = $5
        `, [
          registerData.companyName,
          registerData.website,
          registerData.phone,
          registerData.companySize,
          existingCompany.rows[0].id
        ]);

        console.log('✅ [REGISTER-USE-CASE] Company updated with registration data');
      } else {
        // Create new company
        await pool.query(`
          INSERT INTO "${schemaName}".companies (
            id, tenant_id, name, website, phone, size, status, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'active', true, NOW(), NOW())
        `, [
          '00000000-0000-0000-0000-000000000001', // Default company ID
          tenantId,
          registerData.companyName,
          registerData.website || null,
          registerData.phone || null,
          registerData.companySize || null
        ]);

        console.log('✅ [REGISTER-USE-CASE] Company created with registration data');
      }
    } catch (error) {
      console.error('❌ [REGISTER-USE-CASE] Failed to create/update company:', error);
      // Don't throw error to avoid breaking registration flow
      // Company data can be updated later
    }
  }

  async execute(registerData: RegisterDTO): Promise<{ user: User; tenant: Tenant; tokens: AuthTokens }> {
    console.log('🔐 [REGISTER-USE-CASE] Starting registration process for:', registerData.email);

    // Validate input data
    await this.validateRegistrationData(registerData);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(registerData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(registerData.password);

    try {
      // Create tenant first
      const tenant = await this.createTenant(registerData);
      console.log('✅ [REGISTER-USE-CASE] Tenant created:', tenant.id);

      // Create user with tenant context
      const user = await this.createUser(registerData, hashedPassword, tenant.id);
      console.log('✅ [REGISTER-USE-CASE] User created:', user.id);

      // Create/Update company data if tenant_admin and company data provided
      if (user.role === 'tenant_admin' && registerData.companyName) {
        await this.createOrUpdateCompany(registerData, tenant.id, user.id);
      }

      // Generate tokens
      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id
      });

      console.log('✅ [REGISTER-USE-CASE] Registration completed successfully');

      return { user, tenant, tokens };
    } catch (error) {
      console.error('❌ [REGISTER-USE-CASE] Registration failed:', error);
      throw error;
    }
  }
}
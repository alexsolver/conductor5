// ===========================
// ENTERPRISE UUID VALIDATOR
// Resolver inconsistências de validação UUID entre módulos
// ===========================

export interface UUIDValidationResult {
  valid: boolean;
  format: 'uuid-v4' | 'alphanumeric' | 'invalid';
  sanitized?: string;
  errors: string[];
}

export interface UUIDValidationConfig {
  strictV4: boolean;
  allowDashes: boolean;
  allowUnderscores: boolean;
  maxLength: number;
  minLength: number;
}

export class EnterpriseUUIDValidator {
  private static instance: EnterpriseUUIDValidator;
  
  // PADRÕES UUID RIGOROSOS
  private readonly UUID_V4_STRICT = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private readonly UUID_V4_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  private readonly TENANT_ID_SAFE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  
  // CONFIGURAÇÃO PADRÃO ENTERPRISE
  private readonly defaultConfig: UUIDValidationConfig = {
    strictV4: true,
    allowDashes: true,
    allowUnderscores: false,
    maxLength: 36,
    minLength: 36
  };

  static getInstance(): EnterpriseUUIDValidator {
    if (!EnterpriseUUIDValidator.instance) {
      EnterpriseUUIDValidator.instance = new EnterpriseUUIDValidator();
    }
    return EnterpriseUUIDValidator.instance;
  }

  // ===========================
  // VALIDAÇÃO PRINCIPAL
  // ===========================
  validateTenantId(tenantId: string, config?: Partial<UUIDValidationConfig>): UUIDValidationResult {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    const errors: string[] = [];
    
    if (!tenantId) {
      return {
        valid: false,
        format: 'invalid',
        errors: ['Tenant ID is required']
      };
    }

    // Validação de comprimento
    if (tenantId.length < effectiveConfig.minLength || tenantId.length > effectiveConfig.maxLength) {
      errors.push(`Tenant ID must be between ${effectiveConfig.minLength} and ${effectiveConfig.maxLength} characters`);
    }

    // Validação de formato
    let format: 'uuid-v4' | 'alphanumeric' | 'invalid' = 'invalid';
    let sanitized = tenantId.toLowerCase().trim();

    if (effectiveConfig.strictV4 && this.UUID_V4_STRICT.test(sanitized)) {
      format = 'uuid-v4';
    } else if (this.UUID_V4_LOOSE.test(sanitized)) {
      format = 'uuid-v4';
    } else if (this.TENANT_ID_SAFE.test(sanitized)) {
      format = 'uuid-v4';
    } else {
      errors.push('Invalid UUID format - must be valid UUID v4');
      format = 'invalid';
    }

    // Validação de caracteres perigosos (SQL Injection Prevention)
    if (this.containsDangerousCharacters(sanitized)) {
      errors.push('Tenant ID contains potentially dangerous characters');
      format = 'invalid';
    }

    return {
      valid: errors.length === 0 && format !== 'invalid',
      format,
      sanitized: errors.length === 0 ? sanitized : undefined,
      errors
    };
  }

  // ===========================
  // VALIDAÇÃO MÚLTIPLA
  // ===========================
  validateMultipleTenantIds(tenantIds: string[]): {
    valid: string[];
    invalid: Array<{ id: string; errors: string[] }>;
    summary: { total: number; validCount: number; invalidCount: number };
  } {
    const valid: string[] = [];
    const invalid: Array<{ id: string; errors: string[] }> = [];

    for (const tenantId of tenantIds) {
      const result = this.validateTenantId(tenantId);
      
      if (result.valid && result.sanitized) {
        valid.push(result.sanitized);
      } else {
        invalid.push({
          id: tenantId,
          errors: result.errors
        });
      }
    }

    return {
      valid,
      invalid,
      summary: {
        total: tenantIds.length,
        validCount: valid.length,
        invalidCount: invalid.length
      }
    };
  }

  // ===========================
  // SANITIZAÇÃO SEGURA
  // ===========================
  sanitizeForDatabase(tenantId: string): string | null {
    const result = this.validateTenantId(tenantId);
    return result.valid ? result.sanitized! : null;
  }

  convertToSchemaName(tenantId: string): string | null {
    const sanitized = this.sanitizeForDatabase(tenantId);
    if (!sanitized) return null;
    
    // Converter para formato de schema PostgreSQL seguro
    return `tenant_${sanitized.replace(/-/g, '_')}`;
  }

  convertFromSchemaName(schemaName: string): string | null {
    if (!schemaName.startsWith('tenant_')) return null;
    
    const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');
    const result = this.validateTenantId(tenantId);
    
    return result.valid ? result.sanitized! : null;
  }

  // ===========================
  // DETECÇÃO DE AMEAÇAS
  // ===========================
  private containsDangerousCharacters(input: string): boolean {
    const dangerousPatterns = [
      /['";]/,           // SQL injection básico
      /--/,              // SQL comentários
      /\/\*/,            // SQL comentários multi-linha
      /\*/,              // Wildcards SQL
      /\\/,              // Escape characters
      /\$\$/,            // PostgreSQL dollar quoting
      /\bDROP\b/i,       // Comandos SQL perigosos
      /\bDELETE\b/i,
      /\bINSERT\b/i,
      /\bUPDATE\b/i,
      /\bALTER\b/i,
      /\bCREATE\b/i,
      /<script/i,        // XSS básico
      /javascript:/i,    // XSS URL scheme
      /on\w+=/i          // Event handlers
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
  }

  // ===========================
  // MIDDLEWARE DE VALIDAÇÃO
  // ===========================
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const tenantId = req.user?.tenantId || req.params?.tenantId || req.body?.tenantId;
      
      if (tenantId) {
        const result = this.validateTenantId(tenantId);
        
        if (!result.valid) {
          return res.status(400).json({
            error: 'Invalid tenant ID',
            details: result.errors,
            code: 'INVALID_TENANT_ID'
          });
        }
        
        // Inject sanitized tenant ID
        if (req.user) req.user.tenantId = result.sanitized;
        if (req.params) req.params.tenantId = result.sanitized;
        if (req.body) req.body.tenantId = result.sanitized;
      }
      
      next();
    };
  }

  // ===========================
  // UTILITÁRIOS
  // ===========================
  generateValidTenantId(): string {
    // Gerar UUID v4 válido
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  isValidFormat(tenantId: string): boolean {
    return this.validateTenantId(tenantId).valid;
  }

  getValidationErrors(tenantId: string): string[] {
    return this.validateTenantId(tenantId).errors;
  }

  // ===========================
  // ESTATÍSTICAS DE VALIDAÇÃO
  // ===========================
  private validationStats = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    threatAttempts: 0
  };

  getValidationStats() {
    return {
      ...this.validationStats,
      successRate: this.validationStats.totalValidations > 0 
        ? (this.validationStats.successfulValidations / this.validationStats.totalValidations) * 100 
        : 0
    };
  }

  resetStats() {
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      threatAttempts: 0
    };
  }
}

// ===========================
// EXPORTAÇÃO SINGLETON
// ===========================
export const enterpriseUUIDValidator = EnterpriseUUIDValidator.getInstance();
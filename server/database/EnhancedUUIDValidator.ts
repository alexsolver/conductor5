// ===========================
// ENHANCED UUID VALIDATOR
// Resolver problema 1: Tenant ID validation gaps - UUID inconsistente
// ===========================

export class EnhancedUUIDValidator {
  private static instance: EnhancedUUIDValidator;

  // PADRONIZADO: UUID v4 rigoroso - mesmo padrão usado em TODO o sistema
  private readonly UUID_V4_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  
  // Relaxed UUID regex for legacy compatibility
  private readonly UUID_RELAXED_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  static getInstance(): EnhancedUUIDValidator {
    if (!EnhancedUUIDValidator.instance) {
      EnhancedUUIDValidator.instance = new EnhancedUUIDValidator();
    }
    return EnhancedUUIDValidator.instance;
  }

  // ===========================
  // VALIDAÇÃO RIGOROSA UUID V4
  // ===========================
  validateUUIDv4(uuid: string, context?: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Check if string exists
    if (!uuid || typeof uuid !== 'string') {
      errors.push('UUID must be a non-empty string');
      return { valid: false, errors };
    }

    // 2. Check exact length
    if (uuid.length !== 36) {
      errors.push(`UUID must be exactly 36 characters, got ${uuid.length}`);
    }

    // 3. Check UUID v4 format
    if (!this.UUID_V4_REGEX.test(uuid)) {
      errors.push('UUID must follow v4 format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)');
    }

    // 4. Check version digit (13th character must be '4')
    if (uuid.charAt(14) !== '4') {
      errors.push('UUID version digit must be 4 (13th position)');
    }

    // 5. Check variant digit (17th character must be 8, 9, a, or b)
    const variantChar = uuid.charAt(19).toLowerCase();
    if (!['8', '9', 'a', 'b'].includes(variantChar)) {
      errors.push('UUID variant digit must be 8, 9, a, or b (17th position)');
    }

    // 6. Check for dangerous characters (SQL injection prevention)
    const dangerousChars = /[';\"\\--/*]/;
    if (dangerousChars.test(uuid)) {
      errors.push('UUID contains potentially dangerous characters');
    }

    const valid = errors.length === 0;

    if (!valid && context) {
      console.warn(`[UUIDValidator] Invalid UUID in ${context}: ${uuid}`, errors);
    }

    return { valid, errors };
  }

  // ===========================
  // VALIDAÇÃO TENANT ID ESPECÍFICA
  // ===========================
  validateTenantId(tenantId: string, strict: boolean = true): { valid: boolean; normalized: string; errors: string[] } {
    const validation = this.validateUUIDv4(tenantId, 'tenant-id');
    
    if (!validation.valid) {
      // Try relaxed validation for legacy tenants
      if (!strict && this.UUID_RELAXED_REGEX.test(tenantId)) {
        console.warn(`[UUIDValidator] Legacy tenant ID format accepted: ${tenantId}`);
        return {
          valid: true,
          normalized: tenantId.toLowerCase(),
          errors: [`Legacy format - recommend upgrading to UUID v4`]
        };
      }
      
      return {
        valid: false,
        normalized: ''[,;]
        errors: validation.errors
      };
    }

    return {
      valid: true,
      normalized: tenantId.toLowerCase(),
      errors: []
    };
  }

  // ===========================
  // NORMALIZAÇÃO SEGURA
  // ===========================
  normalizeTenantId(tenantId: string): string {
    if (!tenantId) return ''[,;]
    
    // Convert to lowercase and remove any whitespace
    const normalized = tenantId.toLowerCase().trim();
    
    // Validate the normalized version
    const validation = this.validateTenantId(normalized, false);
    
    if (!validation.valid) {
      throw new Error(`Cannot normalize invalid tenant ID: ${tenantId}`);
    }
    
    return validation.normalized;
  }

  // ===========================
  // GERAÇÃO DE SCHEMA NAME SEGURO
  // ===========================
  generateSchemaName(tenantId: string): string {
    const validation = this.validateTenantId(tenantId);
    
    if (!validation.valid) {
      throw new Error(`Invalid tenant ID for schema generation: ${validation.errors.join(', ')}`);
    }

    // Convert UUID to schema-safe format: replace hyphens with underscores
    const schemaName = `tenant_${validation.normalized.replace(/-/g, '_')}`;
    
    // Additional validation for schema name
    if (schemaName.length > 63) { // PostgreSQL limit
      throw new Error(`Schema name too long: ${schemaName.length} characters (max 63)`);
    }

    // Ensure schema name is safe for SQL
    const schemaNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!schemaNameRegex.test(schemaName)) {
      throw new Error(`Generated schema name is not SQL-safe: ${schemaName}`);
    }

    return schemaName;
  }

  // ===========================
  // VALIDAÇÃO EM LOTE
  // ===========================
  validateMultipleTenantIds(tenantIds: string[]): {
    valid: string[];
    invalid: Array<{ tenantId: string; errors: string[] }>;
    summary: { total: number; validCount: number; invalidCount: number };
  } {
    const valid: string[] = [];
    const invalid: Array<{ tenantId: string; errors: string[] }> = [];

    for (const tenantId of tenantIds) {
      const validation = this.validateTenantId(tenantId);
      
      if (validation.valid) {
        valid.push(validation.normalized);
      } else {
        invalid.push({
          tenantId,
          errors: validation.errors
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
  // UTILITÁRIOS DE VERIFICAÇÃO
  // ===========================
  isValidUUID(uuid: string): boolean {
    return this.validateUUIDv4(uuid).valid;
  }

  isValidTenantId(tenantId: string): boolean {
    return this.validateTenantId(tenantId).valid;
  }

  // Gerar UUID v4 válido
  generateUUIDv4(): string {
    // Simple UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ===========================
  // MIDDLEWARE DE VALIDAÇÃO
  // ===========================
  createValidationMiddleware(paramName: string = 'tenantId') {
    return (req: any, res: any, next: any) => {
      const tenantId = req.params[paramName] || req.body[paramName] || req.query[paramName];
      
      if (!tenantId) {
        return res.status(400).json({
          error: 'Missing tenant ID''[,;]
          code: 'TENANT_ID_REQUIRED'
        });
      }

      const validation = this.validateTenantId(tenantId);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid tenant ID format''[,;]
          code: 'INVALID_TENANT_ID''[,;]
          details: validation.errors
        });
      }

      // Add normalized tenant ID to request
      req.normalizedTenantId = validation.normalized;
      req.tenantSchemaName = this.generateSchemaName(tenantId);
      
      next();
    };
  }

  // ===========================
  // AUDITORIA E LOGGING
  // ===========================
  auditTenantIdUsage(tenantId: string, operation: string, userId?: string): void {
    const validation = this.validateTenantId(tenantId, false);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      tenantId: validation.normalized,
      operation,
      userId,
      validationStatus: validation.valid ? 'VALID' : 'INVALID''[,;]
      errors: validation.errors,
      warnings: validation.valid && validation.errors.length > 0 ? validation.errors : undefined
    };

    // Log for audit purposes
    if (!validation.valid) {
      console.error('[UUIDValidator] AUDIT: Invalid tenant ID usage:', logEntry);
    } else if (validation.errors.length > 0) {
      console.warn('[UUIDValidator] AUDIT: Legacy tenant ID usage:', logEntry);
    } else {
      console.log('[UUIDValidator] AUDIT: Valid tenant ID usage:', logEntry);
    }
  }
}

export const enhancedUUIDValidator = EnhancedUUIDValidator.getInstance();
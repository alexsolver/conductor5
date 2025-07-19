// ===========================
// ENTERPRISE UUID VALIDATOR - PADRONIZAÇÃO RIGOROSA
// Resolver inconsistências entre validadores UUID
// ===========================

export class EnterpriseUUIDValidator {
  private static instance: EnterpriseUUIDValidator;
  
  // PADRÃO UUID RIGOROSO UNIFICADO - UUID v4 ESTRITO (PADRONIZADO EM TODO O SISTEMA)
  // IGUAL: TenantValidator.ts e ConnectionPoolManager.ts agora usam o mesmo padrão
  private static readonly STRICT_UUID_V4_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  
  // PADRÃO UUID RELAXADO - Para compatibilidade legada apenas
  private static readonly RELAXED_UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

  static getInstance(): EnterpriseUUIDValidator {
    if (!EnterpriseUUIDValidator.instance) {
      EnterpriseUUIDValidator.instance = new EnterpriseUUIDValidator();
    }
    return EnterpriseUUIDValidator.instance;
  }

  // ===========================
  // VALIDAÇÃO RIGOROSA UUID V4
  // ===========================
  validateStrictUUIDv4(uuid: string | null | undefined): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    if (uuid.length !== 36) return false;
    return EnterpriseUUIDValidator.STRICT_UUID_V4_PATTERN.test(uuid);
  }

  // ===========================
  // VALIDAÇÃO RELAXADA (COMPATIBILIDADE)
  // ===========================
  validateRelaxedUUID(uuid: string | null | undefined): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    if (uuid.length !== 36) return false;
    return EnterpriseUUIDValidator.RELAXED_UUID_PATTERN.test(uuid);
  }

  // ===========================
  // VALIDAÇÃO ENTERPRISE (PADRÃO)
  // ===========================
  validateTenantId(tenantId: string | null | undefined): boolean {
    // Usa validação rigorosa por padrão para máxima segurança
    return this.validateStrictUUIDv4(tenantId);
  }

  validateUserId(userId: string | null | undefined): boolean {
    // Usa validação rigorosa por padrão
    return this.validateStrictUUIDv4(userId);
  }

  validateEntityId(entityId: string | null | undefined): boolean {
    // Usa validação rigorosa por padrão
    return this.validateStrictUUIDv4(entityId);
  }

  // ===========================
  // NORMALIZAÇÃO DE UUID
  // ===========================
  normalizeUUID(uuid: string | null | undefined): string | null {
    if (!uuid || typeof uuid !== 'string') return null;
    
    // Remove espaços e converte para lowercase
    const cleaned = uuid.trim().toLowerCase();
    
    // Verifica se é válido após limpeza
    if (this.validateRelaxedUUID(cleaned)) {
      return cleaned;
    }
    
    return null;
  }

  // ===========================
  // CONVERSÃO SCHEMA NAME
  // ===========================
  tenantIdToSchemaName(tenantId: string): string {
    if (!this.validateTenantId(tenantId)) {
      throw new Error(`Invalid tenant ID format: ${tenantId}. Must be UUID v4 (36 chars)`);
    }
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  schemaNameToTenantId(schemaName: string): string {
    if (!schemaName.startsWith('tenant_')) {
      throw new Error(`Invalid schema name format: ${schemaName}`);
    }
    
    const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');
    
    if (!this.validateTenantId(tenantId)) {
      throw new Error(`Invalid tenant ID extracted from schema: ${tenantId}`);
    }
    
    return tenantId;
  }

  // ===========================
  // VALIDATION HELPERS
  // ===========================
  getValidationError(uuid: string | null | undefined, context: string = 'UUID'): string | null {
    if (!uuid) {
      return `${context} is required`;
    }
    
    if (typeof uuid !== 'string') {
      return `${context} must be a string`;
    }
    
    if (uuid.length !== 36) {
      return `${context} must be exactly 36 characters (got ${uuid.length})`;
    }
    
    if (!this.validateStrictUUIDv4(uuid)) {
      return `${context} must be a valid UUID v4 format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)`;
    }
    
    return null;
  }

  // ===========================
  // BATCH VALIDATION
  // ===========================
  validateMultipleIds(ids: string[], context: string = 'IDs'): { valid: string[]; invalid: string[]; errors: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const errors: string[] = [];

    for (const id of ids) {
      const error = this.getValidationError(id, context);
      if (error) {
        invalid.push(id);
        errors.push(`${id}: ${error}`);
      } else {
        valid.push(id);
      }
    }

    return { valid, invalid, errors };
  }

  // ===========================
  // MIGRATION HELPER
  // ===========================
  migrateToStrictValidation(uuid: string | null | undefined): string | null {
    if (!uuid) return null;
    
    // Tenta normalizar primeiro
    const normalized = this.normalizeUUID(uuid);
    if (!normalized) return null;
    
    // Se passou na validação relaxada mas não na rigorosa, pode ser um UUID válido mas não v4
    if (this.validateRelaxedUUID(normalized) && !this.validateStrictUUIDv4(normalized)) {
      console.warn(`UUID ${normalized} is valid but not UUID v4. Consider regenerating.`);
      return normalized; // Retorna mas com warning
    }
    
    if (this.validateStrictUUIDv4(normalized)) {
      return normalized;
    }
    
    return null;
  }

  // ===========================
  // DEBUGGING & MONITORING
  // ===========================
  analyzeUUID(uuid: string | null | undefined): {
    isValid: boolean;
    format: 'strict' | 'relaxed' | 'invalid';
    version?: number;
    variant?: string;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (!uuid) {
      return { isValid: false, format: 'invalid', issues: ['UUID is null or undefined'] };
    }
    
    if (typeof uuid !== 'string') {
      return { isValid: false, format: 'invalid', issues: ['UUID is not a string'] };
    }
    
    if (uuid.length !== 36) {
      issues.push(`Incorrect length: ${uuid.length} (expected 36)`);
    }
    
    if (this.validateStrictUUIDv4(uuid)) {
      return { isValid: true, format: 'strict', version: 4, variant: 'RFC 4122', issues: [] };
    }
    
    if (this.validateRelaxedUUID(uuid)) {
      // Analisar versão e variante
      const versionChar = uuid[14];
      const variantChar = uuid[19];
      
      if (versionChar !== '4') {
        issues.push(`Not UUID v4 (version: ${versionChar})`);
      }
      
      if (!'89abAB'.includes(variantChar)) {
        issues.push(`Invalid variant character: ${variantChar}`);
      }
      
      return { 
        isValid: true, 
        format: 'relaxed', 
        version: parseInt(versionChar), 
        variant: variantChar,
        issues 
      };
    }
    
    issues.push('Does not match UUID pattern');
    return { isValid: false, format: 'invalid', issues };
  }
}

// ===========================
// SINGLETON EXPORT
// ===========================
export const enterpriseUUIDValidator = EnterpriseUUIDValidator.getInstance();
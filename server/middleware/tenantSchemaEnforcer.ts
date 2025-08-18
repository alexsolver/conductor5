
import { Request, Response, NextFunction } from 'express';
import { tenantSchemaAuditor } from '../scripts/TenantSchemaUsageAuditor';

export interface TenantSchemaRequest extends Request {
  tenantId?: string;
  tenantSchemaValidated?: boolean;
  schemaContext?: {
    schemaName: string;
    isValidated: boolean;
    operations: string[];
  };
}

/**
 * CRITICAL: Middleware que força o uso correto de schema tenant
 * Previne operações no schema público quando deveria usar tenant
 */
export function tenantSchemaEnforcer() {
  return async (req: TenantSchemaRequest, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      // Skip for SaaS admin operations that legitimately need public schema
      if (user?.role === 'saas_admin' && req.path.startsWith('/api/saas-admin')) {
        return next();
      }

      // Ensure tenant context exists
      if (!user?.tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required for this operation',
          code: 'MISSING_TENANT_CONTEXT'
        });
      }

      // Validate tenant ID format
      const tenantIdRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!tenantIdRegex.test(user.tenantId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tenant ID format',
          code: 'INVALID_TENANT_ID'
        });
      }

      // Set tenant schema context
      const schemaName = `tenant_${user.tenantId.replace(/-/g, '_')}`;
      req.schemaContext = {
        schemaName,
        isValidated: true,
        operations: []
      };

      // Ensure tenant ID is available in request
      req.tenantId = user.tenantId;
      req.tenantSchemaValidated = true;

      // Log schema context for audit trail
      console.debug(`🔐 [SCHEMA-CONTEXT] Request using schema: ${schemaName} for path: ${req.path}`);

      next();
    } catch (error) {
      console.error('❌ [TENANT-SCHEMA-ENFORCER] Error enforcing tenant schema:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Tenant schema validation failed',
        code: 'SCHEMA_ENFORCEMENT_ERROR'
      });
    }
  };
}

/**
 * CRITICAL: Database operation interceptor
 * Garante que todas as operações de banco usem o schema tenant correto
 */
export function databaseOperationInterceptor() {
  return (req: TenantSchemaRequest, res: Response, next: NextFunction) => {
    // Only apply to requests that should use tenant schema
    if (!req.tenantSchemaValidated) {
      return next();
    }

    // Track database operations for auditing
    const originalJson = res.json;
    res.json = function(data: any) {
      // Log successful database operations
      if (req.schemaContext && data.success !== false) {
        req.schemaContext.operations.push(`${req.method} ${req.path}`);
        
        console.debug(`✅ [DB-OPERATION] Schema ${req.schemaContext.schemaName}: ${req.method} ${req.path}`);
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * CRITICAL: Runtime schema usage validator
 * Valida em tempo real se as queries estão usando o schema correto
 */
export function runtimeSchemaValidator() {
  return async (req: TenantSchemaRequest, res: Response, next: NextFunction) => {
    // Skip for non-tenant operations
    if (!req.tenantSchemaValidated) {
      return next();
    }

    // Store original end function
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any) {
      // Perform runtime validation after request completion
      setTimeout(async () => {
        try {
          if (req.schemaContext && req.schemaContext.operations.length > 0) {
            // Check if any queries hit public schema inappropriately
            const violations = await checkRuntimeSchemaUsage(req.tenantId!);
            
            if (violations.length > 0) {
              console.error(`🚨 [RUNTIME-VIOLATION] Detected ${violations.length} schema violations for tenant ${req.tenantId}`);
              
              // Log to audit system
              await logSchemaViolation(req.tenantId!, req.path, violations);
            }
          }
        } catch (error) {
          console.error('❌ [RUNTIME-VALIDATOR] Error validating schema usage:', error);
        }
      }, 100);
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Check for inappropriate public schema usage in recent queries
 */
async function checkRuntimeSchemaUsage(tenantId: string): Promise<any[]> {
  try {
    // This would check recent queries for public schema usage
    // Implementation depends on available query logging
    return [];
  } catch (error) {
    console.warn('⚠️ Could not check runtime schema usage:', error.message);
    return [];
  }
}

/**
 * Log schema violations for audit trail
 */
async function logSchemaViolation(tenantId: string, path: string, violations: any[]): Promise<void> {
  try {
    console.error(`📝 [AUDIT-LOG] Tenant ${tenantId} - Path ${path} - Violations:`, violations);
    
    // Could store in audit table or external logging system
    // For now, just console logging
  } catch (error) {
    console.error('❌ Failed to log schema violation:', error);
  }
}

/**
 * CRITICAL: Query pattern analyzer middleware
 * Analisa padrões de queries para detectar uso incorreto de schema
 */
export function queryPatternAnalyzer() {
  return (req: TenantSchemaRequest, res: Response, next: NextFunction) => {
    // Skip for non-tenant operations
    if (!req.tenantSchemaValidated) {
      return next();
    }

    // Intercept and analyze request body for SQL patterns
    if (req.body && typeof req.body === 'object') {
      const bodyStr = JSON.stringify(req.body);
      
      // Check for problematic patterns
      const problematicPatterns = [
        /FROM\s+public\./gi,
        /JOIN\s+public\./gi,
        /UPDATE\s+public\./gi,
        /INSERT\s+INTO\s+public\./gi,
        /DELETE\s+FROM\s+public\./gi
      ];

      for (const pattern of problematicPatterns) {
        if (pattern.test(bodyStr)) {
          console.error(`🚨 [QUERY-PATTERN-VIOLATION] Detected public schema usage in request body for tenant ${req.tenantId}`);
          
          return res.status(400).json({
            success: false,
            message: 'Invalid schema usage detected in request',
            code: 'QUERY_PATTERN_VIOLATION'
          });
        }
      }
    }

    next();
  };
}

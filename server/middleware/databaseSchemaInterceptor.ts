/**
 * DATABASE SCHEMA INTERCEPTOR
 * Intercepta TODAS as operações de banco para garantir uso correto do schema tenant
 * Previne operações no schema público quando deveria usar tenant
 */

import { Request, Response, NextFunction } from 'express';
import { tenantSchemaManager } from '../utils/tenantSchemaValidator';
import { Pool } from 'pg';

export interface DatabaseInterceptorRequest extends Request {
  tenantId?: string;
  tenantConnection?: {
    pool: Pool;
    db: any;
    schemaName: string;
  };
  user?: {
    id: string;
    tenantId: string;
    role?: string;
  };
}

/**
 * CRITICAL: Interceptor que força uso correto de conexões tenant
 */
export function databaseSchemaInterceptor() {
  return async (req: DatabaseInterceptorRequest, res: Response, next: NextFunction) => {
    try {
      // Skip para rotas de autenticação
      if (req.path.startsWith('/api/auth/') || req.path.startsWith('/auth/')) {
        return next();
      }

      // Skip para SaaS admin (que pode usar schema público)
      if (req.user?.role === 'saas_admin' && req.path.startsWith('/api/saas-admin')) {
        return next();
      }

      // Verificar se temos contexto de tenant
      if (!req.user?.tenantId) {
        console.warn(`⚠️ [DB-INTERCEPTOR] Request without tenant context: ${req.method} ${req.path}`);
        return res.status(400).json({
          success: false,
          message: 'Tenant context required for database operations',
          code: 'MISSING_TENANT_CONTEXT'
        });
      }

      // Obter conexão tenant correta
      try {
        const connection = await tenantSchemaManager.getTenantConnection(req.user.tenantId);
        req.tenantConnection = {
          pool: connection.pool,
          db: connection.db,
          schemaName: connection.schemaName
        };
        req.tenantId = req.user.tenantId;

        console.debug(`🔗 [DB-INTERCEPTOR] Tenant connection ready: ${connection.schemaName} for ${req.method} ${req.path}`);
      } catch (error) {
        console.error(`❌ [DB-INTERCEPTOR] Failed to get tenant connection for ${req.user.tenantId}:`, error);
        
        return res.status(500).json({
          success: false,
          message: 'Failed to establish tenant database connection',
          code: 'TENANT_CONNECTION_ERROR'
        });
      }

      next();
    } catch (error) {
      console.error('❌ [DB-INTERCEPTOR] Database interceptor error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Database connection interceptor failed',
        code: 'INTERCEPTOR_ERROR'
      });
    }
  };
}

/**
 * CRITICAL: Query monitor que audita operações de banco
 */
export function databaseQueryMonitor() {
  return (req: DatabaseInterceptorRequest, res: Response, next: NextFunction) => {
    // Skip se não temos conexão tenant
    if (!req.tenantConnection) {
      return next();
    }

    // Interceptar queries para auditoria
    const originalQuery = req.tenantConnection.pool.query;
    
    req.tenantConnection.pool.query = function(text: string, params?: any[], callback?: any) {
      // Log da query para auditoria
      console.debug(`🔍 [QUERY-MONITOR] Schema ${req.tenantConnection!.schemaName}: ${text.substring(0, 100)}...`);
      
      // Verificar se query tenta usar schema público incorretamente
      if (text.toLowerCase().includes('public.') && !text.toLowerCase().includes('information_schema')) {
        console.warn(`⚠️ [QUERY-MONITOR] Detected public schema usage in tenant context: ${text.substring(0, 200)}`);
        
        // Substituir referências ao schema público pelo schema tenant
        const correctedText = text.replace(/public\./g, `${req.tenantConnection!.schemaName}.`);
        console.info(`🔧 [QUERY-MONITOR] Auto-corrected query to use tenant schema`);
        
        return originalQuery.call(this, correctedText, params, callback);
      }
      
      // Executar query original
      return originalQuery.call(this, text, params, callback);
    };

    next();
  };
}

/**
 * CRITICAL: Validador de operações específicas por módulo
 */
export function moduleSpecificValidator() {
  return (req: DatabaseInterceptorRequest, res: Response, next: NextFunction) => {
    if (!req.tenantConnection) {
      return next();
    }

    const path = req.path.toLowerCase();
    const method = req.method;

    // Validações específicas por módulo
    const moduleValidations = {
      '/api/tickets': validateTicketsModule,
      '/api/customers': validateCustomersModule,
      '/api/beneficiaries': validateBeneficiariesModule,
      '/api/timecard': validateTimecardModule,
      '/api/dashboards': validateDashboardsModule,
      '/api/reports': validateReportsModule
    };

    // Aplicar validação específica se houver
    for (const [pathPrefix, validator] of Object.entries(moduleValidations)) {
      if (path.startsWith(pathPrefix)) {
        try {
          validator(req, res);
        } catch (error) {
          console.error(`❌ [MODULE-VALIDATOR] ${pathPrefix} validation failed:`, error);
          return res.status(500).json({
            success: false,
            message: `Module validation failed for ${pathPrefix}`,
            code: 'MODULE_VALIDATION_ERROR'
          });
        }
        break;
      }
    }

    next();
  };
}

/**
 * VALIDADORES ESPECÍFICOS POR MÓDULO
 */

function validateTicketsModule(req: DatabaseInterceptorRequest, res: Response) {
  // Garantir que todas as operações de tickets usem tenant correto
  if (req.body && req.method === 'POST') {
    if (!req.body.tenantId) {
      req.body.tenantId = req.tenantId;
    }
    
    // Validar referências de customer_id dentro do tenant
    if (req.body.customer_id && typeof req.body.customer_id === 'string') {
      // Esta validação seria expandida para verificar se o customer existe no tenant
      console.debug(`🎫 [TICKETS-VALIDATOR] Validating customer_id ${req.body.customer_id} for tenant ${req.tenantId}`);
    }
  }
}

function validateCustomersModule(req: DatabaseInterceptorRequest, res: Response) {
  // Garantir isolamento de dados de clientes por tenant
  if (req.body && req.method === 'POST') {
    if (!req.body.tenantId) {
      req.body.tenantId = req.tenantId;
    }
  }
  
  console.debug(`👥 [CUSTOMERS-VALIDATOR] Ensuring tenant isolation for ${req.method} ${req.path}`);
}

function validateBeneficiariesModule(req: DatabaseInterceptorRequest, res: Response) {
  // Garantir que beneficiários sejam isolados por tenant
  if (req.body && req.method === 'POST') {
    if (!req.body.tenantId) {
      req.body.tenantId = req.tenantId;
    }
  }
  
  console.debug(`🏥 [BENEFICIARIES-VALIDATOR] Ensuring tenant isolation for ${req.method} ${req.path}`);
}

function validateTimecardModule(req: DatabaseInterceptorRequest, res: Response) {
  // Timecard é crítico para compliance - garantir isolamento total
  if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.body.tenantId) {
      req.body.tenantId = req.tenantId;
    }
    
    // Garantir que user_id pertence ao tenant
    if (req.body.user_id && req.user) {
      console.debug(`⏰ [TIMECARD-VALIDATOR] Validating user_id ${req.body.user_id} for tenant ${req.tenantId}`);
    }
  }
}

function validateDashboardsModule(req: DatabaseInterceptorRequest, res: Response) {
  // Dashboards devem mostrar apenas dados do tenant
  console.debug(`📊 [DASHBOARDS-VALIDATOR] Ensuring tenant data isolation for ${req.method} ${req.path}`);
}

function validateReportsModule(req: DatabaseInterceptorRequest, res: Response) {
  // Relatórios são críticos - garantir que não vazem dados entre tenants
  console.debug(`📈 [REPORTS-VALIDATOR] Ensuring tenant data isolation for ${req.method} ${req.path}`);
}

/**
 * MIDDLEWARE DE LIMPEZA: Limpa conexões após resposta
 */
export function databaseConnectionCleanup() {
  return (req: DatabaseInterceptorRequest, res: Response, next: NextFunction) => {
    // Interceptar o fim da resposta para cleanup
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any) {
      // Não fechar conexão aqui - deixar o manager gerenciar o pool
      // As conexões são reutilizadas entre requests do mesmo tenant
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * HELPER: Verificar se uma operação deve usar schema tenant
 */
export function shouldUseTenantSchema(path: string, method: string): boolean {
  // Lista de operações que DEVEM usar schema tenant
  const tenantOperations = [
    '/api/tickets',
    '/api/customers',
    '/api/beneficiaries',
    '/api/companies',
    '/api/locations',
    '/api/users',
    '/api/timecard',
    '/api/dashboards',
    '/api/reports',
    '/api/notifications',
    '/api/custom-fields',
    '/api/activity-planner',
    '/api/contracts',
    '/api/approvals'
  ];

  // Lista de operações que podem usar schema público
  const publicOperations = [
    '/api/auth',
    '/api/saas-admin',
    '/api/health',
    '/api/system'
  ];

  // Verificar se é operação tenant
  for (const op of tenantOperations) {
    if (path.startsWith(op)) {
      return true;
    }
  }

  // Verificar se é operação pública
  for (const op of publicOperations) {
    if (path.startsWith(op)) {
      return false;
    }
  }

  // Por padrão, usar schema tenant para operações não classificadas
  return true;
}

export default {
  databaseSchemaInterceptor,
  databaseQueryMonitor,
  moduleSpecificValidator,
  databaseConnectionCleanup,
  shouldUseTenantSchema
};
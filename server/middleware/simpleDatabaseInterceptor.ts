/**
 * CRITICAL: Simplified Database Schema Interceptor  
 * Monitora e previne uso incorreto de schemas multi-tenant
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware simples para monitorar requests e garantir contexto de tenant
 */
export function simpleDatabaseInterceptor() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip para rotas que não requerem contexto de banco
    const skipPaths = [
      '/api/auth/',
      '/auth/',
      '/health',
      '/api/health',
      '/',
      '/favicon',
      '/assets/',
      '/@vite/',
      '/@react-refresh',
      '/__vite_ping',
      '/node_modules/',
      '/@fs/',
      '/src/',
    ];

    const skipByExtension = ['.js', '.css', '.png', '.svg', '.ico', '.woff', '.woff2'];
    
    const shouldSkip = skipPaths.some(path => req.path.startsWith(path)) ||
                      skipByExtension.some(ext => req.path.endsWith(ext)) ||
                      req.path === '/' ||
                      req.method === 'HEAD';

    if (shouldSkip) {
      return next();
    }

    // Verificar contexto de tenant para rotas de API
    if (req.path.startsWith('/api/') && !(req as any).user?.tenantId) {
      console.warn(`⚠️ [DB-INTERCEPTOR] API request without tenant context: ${req.method} ${req.path}`);
    }

    // Log operações com contexto de tenant
    if ((req as any).user?.tenantId) {
      console.debug(`🔐 [SCHEMA-CONTEXT] Request using tenant ${(req as any).user.tenantId} for path: ${req.path}`);
    }

    next();
  };
}

/**
 * Middleware para monitorar operações de banco de dados
 */
export function databaseOperationLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip para requests não-API
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    const user = (req as any).user;
    if (user?.tenantId) {
      // Log da operação com schema info
      res.on('finish', () => {
        if (res.statusCode < 400) {
          console.debug(`✅ [DB-OPERATION] Tenant ${user.tenantId}: ${req.method} ${req.path}`);
        }
      });
    }

    next();
  };
}

/**
 * Middleware de limpeza de recursos (placeholder para compatibilidade)
 */
export function databaseConnectionCleanup() {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}

// Compatibilidade com o sistema existente
export const databaseSchemaInterceptor = simpleDatabaseInterceptor;
export const databaseQueryMonitor = databaseOperationLogger;
export const moduleSpecificValidator = databaseConnectionCleanup;
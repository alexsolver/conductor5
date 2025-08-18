/**
 * Employment Detection Middleware
 * Adds employment type information to user session and requests
 */

import { Request, Response, NextFunction } from 'express';

export interface EmploymentAwareRequest extends Request {
  employmentType?: 'clt' | 'autonomo';
  terminology?: {
    pageTitle: string;
    recordLabel: string;
    entryExitLabel: string;
    timeControlLabel: string;
    approvalLabel: string;
    reportLabel: string;
  };
}

// Cache simples para armazenar o tipo de emprego detectado (opcional, pode ser removido se não for mais necessário)
// const employmentCache = new Map<string, 'clt' | 'autonomo'>();

/**
 * Middleware to detect and add employment type information to requests
 */
export function employmentDetectionMiddleware(
  req: EmploymentAwareRequest,
  res: Response,
  next: NextFunction
) {
  // Get user from session/token - CRITICAL FIX: Ensure user object exists
  const user = (req as any).user;

  // CRITICAL FIX APPLIED: Now runs after jwtAuth, so user should always exist
  console.log('[EMPLOYMENT-DETECTION] Input user:', user ? `{id: ${user.id}, tenantId: ${user.tenantId}}` : 'MISSING');

  // CRITICAL FIX: Always provide valid user object for tenant context
  if (!user || !user.tenantId) {
    console.warn('[EMPLOYMENT-DETECTION] Missing user or tenant context');

    // Skip authentication for public routes and auth endpoints
    const publicPaths = ['/api/auth/', '/api/health', '/api/ping', '/api/csp-report'];
    const isPublicPath = publicPaths.some(path => req.path.includes(path));

    if (!isPublicPath && req.path.includes('/api/')) {
      console.error('[EMPLOYMENT-DETECTION] Blocking API request without tenant context:', req.path);
      return res.status(401).json({
        success: false,
        message: 'User authentication required for tenant operations',
        code: 'MISSING_USER_CONTEXT'
      });
    }

    // For non-API routes or public endpoints, continue with defaults
    req.employmentType = 'clt';
    req.terminology = getTerminologyForType('clt');
    console.log('[EMPLOYMENT-DEBUG] Using default for public/non-API route');
    return next();
  }

  if (user) {
    // Detect employment type from user data
    const employmentType = detectEmploymentTypeFromUser(user);
    req.employmentType = employmentType;

    // Add terminology based on employment type
    req.terminology = getTerminologyForType(employmentType);

    console.log('[EMPLOYMENT-DEBUG] User data:', { detectedType: employmentType });
  } else {
    // CRITICAL FIX: Default values when user is missing
    req.employmentType = 'clt';
    req.terminology = getTerminologyForType('clt');
    console.log('[EMPLOYMENT-DEBUG] Using default: clt');
  }

  next();
}

/**
 * Detect employment type from user object
 */
function detectEmploymentTypeFromUser(user: any): 'clt' | 'autonomo' {
  // Check if user has employmentType field
  if (user?.employmentType) {
    return user.employmentType === 'autonomo' ? 'autonomo' : 'clt';
  }

  // Fallback detection logic
  if (user?.role === 'contractor' || user?.position?.toLowerCase().includes('freelancer')) {
    return 'autonomo';
  }

  // Default to CLT
  return 'clt';
}

/**
 * Get terminology configuration for employment type
 */
function getTerminologyForType(employmentType: 'clt' | 'autonomo') {
  if (employmentType === 'autonomo') {
    return {
      pageTitle: "Controle de Jornada",
      recordLabel: "Registro de Jornada",
      entryExitLabel: "Início/Fim de Atividade",
      timeControlLabel: "Controle de Horas",
      approvalLabel: "Validação de Jornada",
      reportLabel: "Relatório de Jornada"
    };
  } else {
    return {
      pageTitle: "Controle de Ponto",
      recordLabel: "Registro de Ponto",
      entryExitLabel: "Entrada/Saída",
      timeControlLabel: "Banco de Horas",
      approvalLabel: "Aprovação de Ponto",
      reportLabel: "Espelho de Ponto"
    };
  }
}
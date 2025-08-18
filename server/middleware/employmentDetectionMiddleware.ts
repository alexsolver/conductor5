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
  // Get user from session/token
  const user = (req as any).user;

  if (user) {
    // Detect employment type from user data
    const employmentType = detectEmploymentTypeFromUser(user);
    req.employmentType = employmentType;

    // Add terminology based on employment type
    req.terminology = getTerminologyForType(employmentType);
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
// Employment Terminology System
// Provides different terminology for CLT vs Autonomous workers
// Maintains functional equivalence with different UI language

export type EmploymentType = 'clt' | 'autonomo';

export interface TerminologyConfig {
  pageTitle: string;
  menuLabel: string;
  recordLabel: string;
  entryExitLabel: string;
  timeControlLabel: string;
  approvalLabel: string;
  reportLabel: string;
  actionLabels: {
    clockIn: string;
    clockOut: string;
    break: string;
    return: string;
  };
  statusLabels: {
    working: string;
    onBreak: string;
    offline: string;
  };
  routes: {
    main: string;
    reports: string;
    approval: string;
  };
}

// CLT Terminology (Original)
const cltTerminology: TerminologyConfig = {
  pageTitle: "Controle de Ponto",
  menuLabel: "Ponto Eletrônico",
  recordLabel: "Registro de Ponto",
  entryExitLabel: "Entrada/Saída",
  timeControlLabel: "Banco de Horas",
  approvalLabel: "Aprovação de Ponto",
  reportLabel: "Espelho de Ponto",
  actionLabels: {
    clockIn: "Entrada",
    clockOut: "Saída",
    break: "Saída para Intervalo",
    return: "Retorno do Intervalo"
  },
  statusLabels: {
    working: "Trabalhando",
    onBreak: "Em Intervalo",
    offline: "Fora do Expediente"
  },
  routes: {
    main: "/timecard",
    reports: "/timecard/reports",
    approval: "/timecard/approval"
  }
};

// Autonomous Terminology (New)
const autonomousTerminology: TerminologyConfig = {
  pageTitle: "Controle de Jornada",
  menuLabel: "Registro de Jornada",
  recordLabel: "Registro de Jornada",
  entryExitLabel: "Início/Fim de Atividade",
  timeControlLabel: "Controle de Horas",
  approvalLabel: "Validação de Jornada",
  reportLabel: "Relatório de Jornada",
  actionLabels: {
    clockIn: "Início de Atividade",
    clockOut: "Fim de Atividade",
    break: "Pausa na Atividade",
    return: "Retorno à Atividade"
  },
  statusLabels: {
    working: "Em Atividade",
    onBreak: "Em Pausa",
    offline: "Inativo"
  },
  routes: {
    main: "/timecard-autonomous",
    reports: "/timecard-autonomous/reports",
    approval: "/timecard-autonomous/approval"
  }
};

/**
 * Get terminology configuration based on employment type
 */
export function getEmploymentTerminology(employmentType: EmploymentType): TerminologyConfig {
  return employmentType === 'autonomo' ? autonomousTerminology : cltTerminology;
}

/**
 * Detect user employment type from user data
 */
export function detectEmploymentType(user: any): EmploymentType {
  console.log('[EMPLOYMENT-DETECTION] Input user:', {
    email: user?.email,
    role: user?.role,
    employmentType: user?.employmentType,
    position: user?.position
  });

  // Check if user has employmentType field (primary detection)
  if (user?.employmentType && user.employmentType !== 'undefined') {
    const detected = user.employmentType === 'autonomo' ? 'autonomo' : 'clt';
    console.log('[EMPLOYMENT-DETECTION] Using employmentType field:', detected);
    return detected;
  }

  // Fallback detection logic
  // Could be based on role, department, or other criteria

  // Detect based on role
  if (user.role && user.role !== 'undefined') {
    if (user.role.includes('admin') || user.role.includes('saas_admin')) {
      console.log('[EMPLOYMENT-DETECTION] Admin role detected, defaulting to CLT');
      return 'clt';
    }
  }

  // Detect based on position/title
  if (user.position && user.position !== 'undefined') {
    const position = user.position.toLowerCase();
    if (position.includes('freelancer') || position.includes('consultant') || position.includes('contractor')) {
      console.log('[EMPLOYMENT-DETECTION] Freelancer position detected');
      return 'autonomo';
    }
  }

  // Default to CLT
  console.log('[EMPLOYMENT-DETECTION] Using default: clt');
  return 'clt';
}

/**
 * Get appropriate route based on employment type
 */
export function getEmploymentRoute(employmentType: EmploymentType, routeType: keyof TerminologyConfig['routes'] = 'main'): string {
  const terminology = getEmploymentTerminology(employmentType);
  return terminology.routes[routeType];
}

/**
 * Check if user should see CLT-specific features
 */
export function isCLTUser(user: any): boolean {
  return detectEmploymentType(user) === 'clt';
}

/**
 * Check if user should see Autonomous-specific features
 */
export function isAutonomousUser(user: any): boolean {
  return detectEmploymentType(user) === 'autonomo';
}
/**
 * CORREÇÃO CRÍTICA 1: Mapeamento Frontend-Backend Centralizado
 * Resolve inconsistência callerId vs caller_id identificada no QA
 */

export interface TicketFieldMapping {
  // Frontend (camelCase) -> Backend (snake_case)
  callerId: 'caller_id';
  beneficiaryId: 'beneficiary_id';
  assignedToId: 'assigned_to_id';
  customerCompanyId: 'customer_id';
  locationId: 'location_id';
  // Adicionar outros campos conforme necessário
}

export const FRONTEND_TO_BACKEND_MAPPING: Record<string, string> = {
  callerId: 'caller_id',
  beneficiaryId: 'beneficiary_id', 
  assignedToId: 'assigned_to_id',
  customerCompanyId: 'customer_id', // MAPEAMENTO CORRETO
  // 🚨 CORREÇÃO CRÍTICA: location é campo texto, não FK
  location: 'location', // Campo texto livre, não location_id
  // Campos adicionais
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  tenantId: 'tenant_id',
  // CORREÇÃO: Remover duplicate mapping 
  // customerId: 'customer_id', // já tem customerCompanyId

  businessImpact: 'business_impact',
  contactType: 'contact_type'
};

export const BACKEND_TO_FRONTEND_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(FRONTEND_TO_BACKEND_MAPPING).map(([key, value]) => [value, key])
);

/**
 * Converte objeto do frontend (camelCase) para backend (snake_case)
 */
export function mapFrontendToBackend(frontendData: any): any {
  const backendData: any = {};
  
  for (const [frontendKey, value] of Object.entries(frontendData)) {
    const backendKey = FRONTEND_TO_BACKEND_MAPPING[frontendKey] || frontendKey;
    backendData[backendKey] = value;
  }
  
  return backendData;
}

/**
 * Converte objeto do backend (snake_case) para frontend (camelCase)
 */
export function mapBackendToFrontend(backendData: any): any {
  const frontendData: any = {};
  
  for (const [backendKey, value] of Object.entries(backendData)) {
    const frontendKey = BACKEND_TO_FRONTEND_MAPPING[backendKey] || backendKey;
    frontendData[frontendKey] = value;
  }
  
  return frontendData;
}

/**
 * Normaliza nomes de campos para snake_case (padrão do banco)
 */
export function normalizeFieldName(fieldName: string): string {
  return fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Converte snake_case para camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
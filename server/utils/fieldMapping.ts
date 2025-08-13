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
  beneficiaryId: 'beneficiary_id', // FK para tabela beneficiaries
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
  contactType: 'contact_type',

  // Novos campos dinâmicos
  templateAlternative: 'template_alternative',
  estimatedHours: 'estimated_hours',
  actualHours: 'actual_hours',
  dueDate: 'due_date',
  assignmentGroup: 'assignment_group'
};

export const BACKEND_TO_FRONTEND_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(FRONTEND_TO_BACKEND_MAPPING).map(([key, value]) => [value, key])
);

/**
 * Converte objeto do frontend (camelCase) para backend (snake_case)
 */
export function mapFrontendToBackend(frontendData: any): any {
  if (!frontendData || typeof frontendData !== 'object') {
    console.log('⚠️ [FIELD-MAPPING] Invalid input data');
    return {};
  }

  const mapping = getFieldMapping();
  const backendData: any = {};

  console.log('🔍 [FIELD-MAPPING] Starting mapping with data:', {
    inputKeys: Object.keys(frontendData),
    availableMappings: Object.keys(mapping).length
  });

  // Apply direct mappings first
  Object.entries(frontendData).forEach(([frontendKey, value]) => {
    if (mapping[frontendKey]) {
      const backendKey = mapping[frontendKey];
      backendData[backendKey] = value;
      console.log(`✅ [FIELD-MAPPING] Mapped: ${frontendKey} → ${backendKey}`, value);
    } else {
      // Keep unmapped fields as-is (for fields that don't need mapping)
      backendData[frontendKey] = value;
      console.log(`➡️ [FIELD-MAPPING] Pass-through: ${frontendKey}`, value);
    }
  });

  // Ensure critical fields are properly mapped
  const criticalMappings = {
    'customerCompanyId': 'company_id',
    'callerId': 'caller_id',
    'beneficiaryId': 'beneficiary_id',
    'assignedToId': 'assigned_to_id',
    'responsibleId': 'assigned_to_id',
    'callerType': 'caller_type',
    'beneficiaryType': 'beneficiary_type',
    'contactType': 'contact_type',
    'businessImpact': 'business_impact',
    'estimatedHours': 'estimated_hours',
    'actualHours': 'actual_hours',
    'templateAlternative': 'template_alternative',
    'linkTicketNumber': 'link_ticket_number',
    'linkType': 'link_type',
    'linkComment': 'link_comment',
    'assignmentGroup': 'assignment_group'
  };

  // Apply critical mappings if not already applied
  Object.entries(criticalMappings).forEach(([frontendKey, backendKey]) => {
    if (frontendData[frontendKey] !== undefined && !backendData[backendKey]) {
      backendData[backendKey] = frontendData[frontendKey];
      delete backendData[frontendKey]; // Remove frontend key
      console.log(`🔧 [FIELD-MAPPING] Critical mapping applied: ${frontendKey} → ${backendKey}`, frontendData[frontendKey]);
    }
  });

  // Remove undefined values
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === undefined) {
      delete backendData[key];
    }
  });

  console.log('✅ [FIELD-MAPPING] Mapping completed:', {
    inputFields: Object.keys(frontendData).length,
    outputFields: Object.keys(backendData).length,
    mappingsApplied: Object.keys(frontendData).filter(key => 
      mapping[key] || criticalMappings[key]
    ).length,
    finalKeys: Object.keys(backendData)
  });

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

// Mapeamento de campos específicos do ticket para nomes amigáveis e metadados
export const TICKET_FIELD_MAPPING = {
  // Campo Grupo de Atribuição
  assignmentGroup: {
    label: 'Grupo de Atribuição',
    table: 'user_group_memberships',
    column: 'id',
    type: 'foreign_key',
    reference: 'user_groups.id',
    description: 'Grupo responsável pela atribuição do ticket',
    api_endpoint: '/api/user-groups',
    display_field: 'name'
  },
};
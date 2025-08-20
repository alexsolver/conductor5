/**
 * Simple version of useTicketMetadata with mock data for testing
 */

export interface FieldOption {
  id: string;
  fieldName: string;
  optionValue: string;
  optionLabel: string;
  bgColor: string;
  textColor: string;
  sortOrder: number;
  isActive: boolean;
}

// Mock data for testing
const MOCK_FIELD_OPTIONS: Record<string, FieldOption[]> = {
  priority: [
    { id: '1', fieldName: 'priority', optionValue: 'low', optionLabel: 'Baixa', bgColor: 'bg-green-100', textColor: 'text-green-800', sortOrder: 1, isActive: true },
    { id: '2', fieldName: 'priority', optionValue: 'medium', optionLabel: 'Média', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', sortOrder: 2, isActive: true },
    { id: '3', fieldName: 'priority', optionValue: 'high', optionLabel: 'Alta', bgColor: 'bg-orange-100', textColor: 'text-orange-800', sortOrder: 3, isActive: true },
    { id: '4', fieldName: 'priority', optionValue: 'critical', optionLabel: 'Crítica', bgColor: 'bg-red-100', textColor: 'text-red-800', sortOrder: 4, isActive: true }
  ],
  urgency: [
    { id: '5', fieldName: 'urgency', optionValue: 'low', optionLabel: 'Baixa', bgColor: 'bg-green-100', textColor: 'text-green-800', sortOrder: 1, isActive: true },
    { id: '6', fieldName: 'urgency', optionValue: 'medium', optionLabel: 'Média', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', sortOrder: 2, isActive: true },
    { id: '7', fieldName: 'urgency', optionValue: 'high', optionLabel: 'Alta', bgColor: 'bg-orange-100', textColor: 'text-orange-800', sortOrder: 3, isActive: true },
    { id: '8', fieldName: 'urgency', optionValue: 'critical', optionLabel: 'Crítica', bgColor: 'bg-red-100', textColor: 'text-red-800', sortOrder: 4, isActive: true }
  ],
  impact: [
    { id: '9', fieldName: 'impact', optionValue: 'low', optionLabel: 'Baixo', bgColor: 'bg-green-100', textColor: 'text-green-800', sortOrder: 1, isActive: true },
    { id: '10', fieldName: 'impact', optionValue: 'medium', optionLabel: 'Médio', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', sortOrder: 2, isActive: true },
    { id: '11', fieldName: 'impact', optionValue: 'high', optionLabel: 'Alto', bgColor: 'bg-orange-100', textColor: 'text-orange-800', sortOrder: 3, isActive: true },
    { id: '12', fieldName: 'impact', optionValue: 'critical', optionLabel: 'Crítico', bgColor: 'bg-red-100', textColor: 'text-red-800', sortOrder: 4, isActive: true }
  ],
  status: [
    { id: '13', fieldName: 'status', optionValue: 'open', optionLabel: 'Aberto', bgColor: 'bg-blue-100', textColor: 'text-blue-800', sortOrder: 1, isActive: true },
    { id: '14', fieldName: 'status', optionValue: 'in_progress', optionLabel: 'Em Progresso', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', sortOrder: 2, isActive: true },
    { id: '15', fieldName: 'status', optionValue: 'pending', optionLabel: 'Pendente', bgColor: 'bg-gray-100', textColor: 'text-gray-800', sortOrder: 3, isActive: true },
    { id: '16', fieldName: 'status', optionValue: 'resolved', optionLabel: 'Resolvido', bgColor: 'bg-green-100', textColor: 'text-green-800', sortOrder: 4, isActive: true },
    { id: '17', fieldName: 'status', optionValue: 'closed', optionLabel: 'Fechado', bgColor: 'bg-gray-100', textColor: 'text-gray-800', sortOrder: 5, isActive: true }
  ],
  environment: [
    { id: '18', fieldName: 'environment', optionValue: 'lansolver', optionLabel: 'LANSOLVER', bgColor: 'bg-purple-100', textColor: 'text-purple-800', sortOrder: 1, isActive: true },
    { id: '19', fieldName: 'environment', optionValue: 'production', optionLabel: 'PRODUÇÃO', bgColor: 'bg-red-100', textColor: 'text-red-800', sortOrder: 2, isActive: true },
    { id: '20', fieldName: 'environment', optionValue: 'development', optionLabel: 'DESENVOLVIMENTO', bgColor: 'bg-blue-100', textColor: 'text-blue-800', sortOrder: 3, isActive: true },
    { id: '21', fieldName: 'environment', optionValue: 'staging', optionLabel: 'HOMOLOGAÇÃO', bgColor: 'bg-orange-100', textColor: 'text-orange-800', sortOrder: 4, isActive: true }
  ],
  groupField: [
    { id: '22', fieldName: 'groupField', optionValue: 'infraestrutura', optionLabel: 'Infraestrutura', bgColor: 'bg-blue-100', textColor: 'text-blue-800', sortOrder: 1, isActive: true },
    { id: '23', fieldName: 'groupField', optionValue: 'desenvolvimento', optionLabel: 'Desenvolvimento', bgColor: 'bg-green-100', textColor: 'text-green-800', sortOrder: 2, isActive: true },
    { id: '24', fieldName: 'groupField', optionValue: 'suporte', optionLabel: 'Suporte', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', sortOrder: 3, isActive: true },
    { id: '25', fieldName: 'groupField', optionValue: 'qualidade', optionLabel: 'Qualidade', bgColor: 'bg-purple-100', textColor: 'text-purple-800', sortOrder: 4, isActive: true }
  ],
  publicationPriority: [
    { id: '26', fieldName: 'publicationPriority', optionValue: '1-baixa', optionLabel: '1 - Baixa - até 7 dias', bgColor: 'bg-green-100', textColor: 'text-green-800', sortOrder: 1, isActive: true },
    { id: '27', fieldName: 'publicationPriority', optionValue: '2-normal', optionLabel: '2 - Normal - até 3 dias', bgColor: 'bg-blue-100', textColor: 'text-blue-800', sortOrder: 2, isActive: true },
    { id: '28', fieldName: 'publicationPriority', optionValue: '3-alta', optionLabel: '3 - Alta - até 1 dia', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', sortOrder: 3, isActive: true },
    { id: '29', fieldName: 'publicationPriority', optionValue: '4-critica', optionLabel: '4 - Crítico - até 30 minutos', bgColor: 'bg-orange-100', textColor: 'text-orange-800', sortOrder: 4, isActive: true },
    { id: '30', fieldName: 'publicationPriority', optionValue: '5-emergencial', optionLabel: '5 - Emergencial - imediato', bgColor: 'bg-red-100', textColor: 'text-red-800', sortOrder: 5, isActive: true }
  ]
};

export function useTicketMetadataSimple() {
  const getFieldOptions = (fieldName: string): FieldOption[] => {
    return MOCK_FIELD_OPTIONS[fieldName] || [];
  };

  const getFieldOption = (fieldName: string, optionValue: string): FieldOption | undefined => {
    const options = MOCK_FIELD_OPTIONS[fieldName] || [];
    return options.find(option => option.optionValue === optionValue);
  };

  return {
    getFieldOptions,
    getFieldOption,
    isInitializing: false
  };
}